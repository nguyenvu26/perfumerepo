import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PromotionsService } from '../promotions/promotions.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ShippingService } from '../shipping/shipping.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { InventoryLogType, Prisma, PaymentProvider, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly shippingService: ShippingService,
    private readonly notificationsService: NotificationsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const { cartItemIds } = dto;

    // Filter items if cartItemIds provided
    const itemsToProcess = cartItemIds
      ? cart.items.filter((item) => cartItemIds.includes(item.id))
      : cart.items;

    if (itemsToProcess.length === 0 && cartItemIds) {
      throw new BadRequestException('Selected items not found in cart');
    }

    const totalAmount = itemsToProcess.reduce(
      (sum, item) => sum + item.quantity * item.variant.price,
      0,
    );

    let discountAmount = 0;
    let promoData: any = null;

    if (dto.promotionCode) {
      try {
        promoData = await this.promotionsService.validate(
          {
            code: dto.promotionCode,
            amount: totalAmount,
          },
          userId,
        );
        discountAmount = promoData.discountAmount;
      } catch (e) {
        throw e;
      }
    }

    const finalAmountBeforeLoyalty = totalAmount - discountAmount;
    let loyaltyDiscount = 0;
    if (dto.redeemPoints) {
      const { discountAmount: lpDiscount } =
        await this.loyaltyService.validateRedemption(userId, dto.redeemPoints);
      loyaltyDiscount = lpDiscount;
    }

    const shippingFee = dto.shippingFee ?? 0;
    const finalAmount = Math.max(
      0,
      finalAmountBeforeLoyalty - loyaltyDiscount + shippingFee,
    );
    const actualDiscountAmount = discountAmount + loyaltyDiscount;
    const order = await this.prisma.$transaction(async (tx) => {
      console.log(`[OrdersService] Creating order from cart. Payment method: ${dto.paymentMethod}`);
      const created = await tx.order.create({
        data: {
          code: `ORD-${Date.now()}`,
          userId,
          totalAmount,
          discountAmount: actualDiscountAmount,
          finalAmount,
          shippingAddress: dto.shippingAddress,
          shippingProvinceId: dto.shippingProvinceId,
          shippingDistrictId: dto.shippingDistrictId,
          shippingWardCode: dto.shippingWardCode,
          shippingFee,
          shippingServiceId: dto.shippingServiceId,
          recipientName: dto.recipientName,
          phone: dto.phone,
          items: {
            create: itemsToProcess.map((item) => ({
              variantId: item.variantId,
              unitPrice: item.variant.price,
              quantity: item.quantity,
              totalPrice: item.quantity * item.variant.price,
            })),
          },
          promotions: promoData
            ? {
                create: {
                  promotionCodeId: promoData.promoId,
                  discountAmount: promoData.discountAmount,
                  userPromotionId: promoData.userPromoId,
                },
              }
            : undefined,
          payments: dto.paymentMethod === 'COD'
            ? {
                create: {
                  provider: PaymentProvider.COD,
                  amount: finalAmount,
                  status: PaymentStatus.PENDING,
                },
              }
            : undefined,
        },
        include: {
          items: true,
          promotions: {
            include: { promotionCode: true },
          },
        },
      });

      // --- STOCK RESERVATION ---
      for (const item of itemsToProcess) {
        // Attempt to decrement stock using updateMany for conditional safety
        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw new BadRequestException(
            `Sản phẩm ${item.variant.product.name} - ${item.variant.name} đã hết hàng hoặc không đủ số lượng.`,
          );
        }

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            type: InventoryLogType.SALE_ONLINE,
            quantity: -item.quantity,
            reason: `Online order ${created.code}`,
          },
        });
      }

      if (promoData) {
        // Increment general usage count
        await tx.promotionCode.update({
          where: { id: promoData.promoId },
          data: { usedCount: { increment: 1 } },
        });

        // Mark user-specific promotion as USED
        if (promoData.userPromoId) {
          await tx.userPromotion.update({
            where: { id: promoData.userPromoId },
            data: { 
              status: 'USED',
              usedAt: new Date()
            },
          });
        }
      }

      if (dto.redeemPoints) {
        await this.loyaltyService.redeemPoints(
          userId,
          dto.redeemPoints,
          created.id,
          tx,
        );
      }

      const itemIdsToRemove = itemsToProcess.map((i) => i.id);
      await tx.cartItem.deleteMany({ where: { id: { in: itemIdsToRemove } } });

      return created;
    });

    // GHN shipment creation moved to updateStatus when status becomes CONFIRMED

    // Notify user about new order
    if (order.userId) {
      this.notificationsService
        .create({
          userId: order.userId,
          type: 'ORDER',
          title: 'Đặt hàng thành công',
          content: `Đơn hàng ${order.code} đã được tạo thành công.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            totalAmount: order.finalAmount 
          },
          sendEmail: true,
        })
        .catch(() => {});
    }

    return order;
  }

  async listMyOrders(userId: string, skip = 0, take = 10) {
    const safeSkip = Math.max(0, skip || 0);
    const safeTake = Math.min(100, Math.max(1, take || 10));

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip: safeSkip,
        take: safeTake,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                  },
                },
              },
              review: true,
            },
          },
          promotions: true,
          returnRequests: {
            where: { status: { not: 'CANCELLED' } },
            include: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    const data = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.variant.product,
      })),
    }));

    return {
      data,
      total,
      skip: safeSkip,
      take: safeTake,
      pages: Math.ceil(total / safeTake),
    };
  }

  async listAllOrders(skip: number, take: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [rawData, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                  },
                },
              },
              review: true,
            },
          },
          user: true,
          payments: true,
          promotions: { include: { promotionCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    const orderIds = rawData.map(o => o.id);
    const evidenceLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'REFUND_EVIDENCE_SUBMITTED',
        entity: 'ORDER',
        entityId: { in: orderIds },
      },
      select: { entityId: true },
    });
    const evidenceSet = new Set(evidenceLogs.map(l => l.entityId));

    const data = rawData.map((order) => ({
      ...order,
      hasRefundEvidence: evidenceSet.has(order.id),
      items: order.items.map((item) => ({
        ...item,
        product: item.variant.product,
      })),
    }));

    return {
      data,
      total,
      skip,
      take,
      pages: Math.ceil(total / take),
    };
  }

  async getMyOrderById(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                },
              },
            },
            review: true,
          },
        },
        promotions: { include: { promotionCode: true } },
        returnRequests: {
          where: { status: { not: 'CANCELLED' } },
          include: { items: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.variant.product,
      })),
    };
  }

  async submitRefundBankInfo(
    userId: string,
    orderId: string,
    payload: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      note?: string;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'CANCELLED') {
      throw new BadRequestException('Only cancelled orders accept refund info');
    }
    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException(
        'Refund bank info is only needed for paid online orders',
      );
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REFUND_BANK_INFO_SUBMITTED',
        entity: 'ORDER',
        entityId: orderId,
        metadata: JSON.stringify({
          bankName: payload.bankName.trim(),
          accountNumber: payload.accountNumber.trim(),
          accountHolder: payload.accountHolder.trim(),
          note: payload.note?.trim() || null,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return { success: true };
  }

  async submitRefundEvidence(
    adminId: string,
    orderId: string,
    file: Express.Multer.File,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const upload = await this.cloudinaryService.uploadImage(file.buffer, 'refunds');

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REFUND_EVIDENCE_SUBMITTED',
        entity: 'ORDER',
        entityId: orderId,
        metadata: JSON.stringify({
          imageUrl: upload.url,
          publicId: upload.publicId,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // Notify user about refund confirmation
    if (order.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { fullName: true, email: true },
      });

      if (user) {
        // Create in-app notification
        await this.notificationsService.create({
          userId: order.userId,
          type: 'ORDER',
          title: 'Hoàn tiền đơn hàng đã hủy',
          content: `Chào bạn, PerfumeGPT đã hoàn tất thủ tục hoàn tiền cho đơn hàng ${order.code} mà quý khách đã hủy. Quý khách vui lòng kiểm tra chi tiết đơn hàng để xem minh chứng chuyển khoản. Trân trọng cảm ơn!`,
          data: { orderId: order.id, orderCode: order.code },
          sendEmail: false,
        }).catch(() => {});

        // Send confirmation email
        if (user.email) {
          await this.mailService.sendRefundConfirmationMail(
            user.email,
            user.fullName || 'Quý khách',
            order.code,
            Number(order.finalAmount)
          ).catch(() => {});
        }
      }
    }

    return { success: true, imageUrl: upload.url };
  }

  async getRefundBankInfo(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    const infoLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'REFUND_BANK_INFO_SUBMITTED',
        entity: 'ORDER',
        entityId: orderId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const evidenceLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'REFUND_EVIDENCE_SUBMITTED',
        entity: 'ORDER',
        entityId: orderId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!infoLog && !evidenceLog) return null;

    const info = infoLog?.metadata ? JSON.parse(infoLog.metadata) : {};
    const evidence = evidenceLog?.metadata ? JSON.parse(evidenceLog.metadata) : {};

    return {
      id: infoLog?.id || evidenceLog?.id,
      createdAt: infoLog?.createdAt || evidenceLog?.createdAt,
      ...info,
      refundEvidence: evidence.imageUrl || null,
      evidenceSubmittedAt: evidence.submittedAt || null,
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                },
              },
            },
            review: true,
          },
        },
        user: true,
        payments: true,
        promotions: { include: { promotionCode: true } },
        returnRequests: {
          where: { status: { not: 'CANCELLED' } },
          include: { items: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.variant.product,
      })),
    };
  }

  private readonly STATUS_LABELS: Record<string, string> = {
    CONFIRMED: 'đã được xác nhận',
    PROCESSING: 'đang được xử lý',
    SHIPPED: 'đã được giao cho đơn vị vận chuyển',
    COMPLETED: 'đã hoàn thành',
    CANCELLED: 'đã bị hủy',
  };

  async updateStatus(id: string, status?: any, paymentStatus?: any) {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: { items: true }
    });

    if (status === 'CANCELLED') {
      await this.restockOrderItems(id);
    }

    // GHN shipment creation for ONLINE orders when confirmed
    if (status === 'CONFIRMED' && updated.channel === 'ONLINE') {
      try {
        await this.shippingService.createGhnShipment(id);
      } catch (e) {
        console.warn(`Auto GHN shipment creation failed for order ${id}:`, e.message);
      }
    }

    if (status === 'COMPLETED' && updated.userId) {
      await this.loyaltyService.earnPoints(
        updated.userId,
        updated.finalAmount,
        updated.id,
      );
    }

    // Notify user about status change
    if (status && updated.userId) {
      const label = this.STATUS_LABELS[status] || status;
      this.notificationsService
        .create({
          userId: updated.userId,
          type: 'ORDER',
          title: 'Cập nhật đơn hàng',
          content: `Đơn hàng ${updated.code} ${label}.`,
          data: { orderId: updated.id, orderCode: updated.code, status },
          sendEmail: ['SHIPPED', 'CANCELLED', 'COMPLETED'].includes(status),
        })
        .catch(() => {});

      // Push real-time order status event for instant UI update
      this.notificationsService.emitOrderStatusChanged(updated.userId, {
        orderId: updated.id,
        orderCode: updated.code,
        status,
      });
    }

    return updated;
  }

  async cancelMyOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái ${order.status}`,
      );
    }

    // Try to cancel GHN shipment if it exists
    if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
      try {
        await this.shippingService.cancelGhnShipment(order.id);
      } catch (e) {
        console.warn('GHN cancel failed during order cancellation:', e?.message);
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { 
        promotions: true,
        items: true,
      },
    });

    // Return stock
    await this.restockOrderItems(updated.id);

    // Return promotions if any
    if (updated.promotions.length > 0) {
      for (const applied of updated.promotions) {
        if (applied.userPromotionId) {
          await this.prisma.userPromotion.update({
            where: { id: applied.userPromotionId },
            data: { status: 'UNUSED', usedAt: null },
          });
        }
      }
    }

    // Notify user
    this.notificationsService.create({
        userId,
        type: 'ORDER',
        title: 'Đã hủy đơn hàng',
        content: `Bạn đã hủy đơn hàng ${updated.code} thành công.`,
        data: {
          orderId: updated.id,
          orderCode: updated.code,
          status: 'CANCELLED',
        },
        sendEmail: true,
      })
      .catch(() => {});

    this.notificationsService.emitOrderStatusChanged(userId, {
      orderId: updated.id,
      orderCode: updated.code,
      status: 'CANCELLED',
    });

    return updated;
  }

  /**
   * Return items from a cancelled/failed order back to stock.
   */
  async restockOrderItems(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.items.length === 0) return;

    for (const item of order.items) {
      if (order.storeId) {
        // POS Order with store
        await client.storeStock.upsert({
          where: {
            storeId_variantId: {
              storeId: order.storeId,
              variantId: item.variantId,
            },
          },
          create: {
            storeId: order.storeId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
            updatedAt: new Date(),
          },
        });
      } else {
        // Online Order or POS without store
        await client.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Log inventory return
      await client.inventoryLog.create({
        data: {
          variantId: item.variantId,
          storeId: order.storeId,
          type: InventoryLogType.RETURN,
          quantity: item.quantity,
          reason: `Restocked from cancelled order ${order.code}`,
        },
      });
    }
  }
}
