import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryLogType,
  OrderChannel,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { StoresService } from '../stores/stores.service';
import { OrdersService } from '../orders/orders.service';

import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class StaffPosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly storesService: StoresService,
    private readonly loyaltyService: LoyaltyService,
    private readonly ordersService: OrdersService,
  ) { }

  /**
   * Search products **available in the given store** (filtered by StoreStock).
   * If no storeId is provided, returns all products (admin/fallback mode).
   * Includes product images.
   */
  async searchProducts(query: string, storeId?: string) {
    const q = query.trim();
    const productFilter: Prisma.ProductWhereInput = {};

    if (q) {
      productFilter.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        {
          variants: {
            some: {
              isActive: true,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { barcode: q },
              ],
            },
          },
        },
      ];
    }

    return this.findPosProducts(productFilter, storeId);
  }

  /**
   * Exact barcode lookup on `ProductVariant.barcode` (trimmed).
   * Only returns the product if the matching variant is active and (when storeId is set) in stock at that store.
   */
  async searchProductsByBarcode(barcode: string, storeId?: string) {
    const b = barcode.trim();
    if (!b) {
      return [];
    }

    const variant = await this.prisma.productVariant.findFirst({
      where: {
        barcode: b,
        isActive: true,
        ...(storeId
          ? {
              storeStocks: {
                some: { storeId, quantity: { gt: 0 } },
              },
            }
          : {}),
      },
      select: { productId: true },
    });

    if (!variant) {
      return [];
    }

    return this.findPosProducts({ id: variant.productId }, storeId);
  }

  private async findPosProducts(
    productFilter: Prisma.ProductWhereInput,
    storeId?: string,
  ) {
    const where: Prisma.ProductWhereInput = {
      ...productFilter,
      isActive: true,
    };

    if (storeId) {
      where.variants = {
        some: {
          isActive: true,
          storeStocks: {
            some: {
              storeId,
              quantity: { gt: 0 },
            },
          },
        },
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        variants: {
          where: storeId
            ? {
                isActive: true,
                storeStocks: {
                  some: { storeId, quantity: { gt: 0 } },
                },
              }
            : { isActive: true },
          include: {
            storeStocks: storeId ? { where: { storeId } } : false,
          },
        },
        brand: true,
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (storeId) {
      return products.map((p) => ({
        ...p,
        variants: p.variants.map((v: any) => ({
          ...v,
          stock: v.storeStocks?.[0]?.quantity ?? 0,
          storeStocks: undefined,
        })),
      }));
    }

    return products;
  }

  /**
   * Lookup customer loyalty by phone number.
   * Returns registered user info OR aggregated guest loyalty points.
   */
  async lookupLoyaltyByPhone(phone: string) {
    // Check registered user first
    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        loyaltyPoints: true,
      },
    });

    if (user) {
      return {
        registered: true,
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      };
    }

    // No registered user → aggregate guest loyalty transactions by phone
    const guestTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { phone, userId: null },
    });

    const guestPoints = guestTransactions.reduce((sum, t) => sum + t.points, 0);

    return {
      registered: false,
      userId: null,
      fullName: null,
      phone,
      email: null,
      loyaltyPoints: guestPoints,
      transactionCount: guestTransactions.length,
    };
  }

  async searchCustomersByPhone(prefix: string) {
    if (!prefix) return [];
    return this.prisma.user.findMany({
      where: {
        phone: {
          startsWith: prefix,
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
      },
      take: 5,
    });
  }

  async getOrder(staffUserId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.channel !== OrderChannel.POS) {
      throw new ForbiddenException('Not a POS order');
    }
    if (order.staffId !== staffUserId) {
      throw new ForbiddenException('Order does not belong to this staff');
    }

    return order;
  }

  /**
   * Create a POS draft order.
   * Optionally attach a customer by phone number for loyalty tracking.
   */
  async createDraftOrder(
    staffUserId: string,
    storeId: string | null,
    role: string,
    customerPhone?: string,
  ) {
    if (storeId) {
      await this.storesService.ensureStaffCanAccessStore(
        staffUserId,
        storeId,
        role,
      );
    }

    // Look up customer by phone
    let customerId: string | undefined;
    if (customerPhone) {
      const customer = await this.prisma.user.findFirst({
        where: { phone: customerPhone },
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    const order = await this.prisma.order.create({
      data: {
        code: `POS-${Date.now()}`,
        staffId: staffUserId,
        storeId: storeId ?? undefined,
        userId: customerId ?? undefined,
        phone: customerPhone ?? undefined,
        channel: OrderChannel.POS,
        totalAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        isPosDraft: true,
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Attach / change customer after order creation (before payment).
   */
  async setCustomer(
    staffUserId: string,
    orderId: string,
    customerPhone: string,
  ) {
    const order = await this.getStaffOrderOrThrow(staffUserId, orderId);

    const customer = await this.prisma.user.findFirst({
      where: { phone: customerPhone },
    });

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        phone: customerPhone,
        userId: customer?.id ?? null,
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    return updated;
  }

  private async getStaffOrderOrThrow(staffUserId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        store: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.channel !== OrderChannel.POS) {
      throw new ForbiddenException('Not a POS order');
    }
    if (order.staffId !== staffUserId) {
      throw new ForbiddenException('Order does not belong to this staff');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Order is already paid');
    }

    return order;
  }

  /**
   * Add/update/remove an item in a POS order.
   * Wrapped in a Prisma interactive transaction to prevent P1017 connection errors.
   */
  async upsertItem(
    staffUserId: string,
    orderId: string,
    variantId: string,
    quantity: number,
  ) {
    if (quantity < 0) {
      throw new BadRequestException('Quantity must be >= 0');
    }

    const order = await this.getStaffOrderOrThrow(staffUserId, orderId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    let availableStock = variant.stock;
    if (order.storeId) {
      const storeStock = await this.prisma.storeStock.findUnique({
        where: { storeId_variantId: { storeId: order.storeId, variantId } },
      });
      availableStock = storeStock?.quantity ?? 0;
    }

    // Use interactive transaction to avoid connection pool issues (P1017)
    await this.prisma.$transaction(async (tx) => {
      if (quantity === 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: order.id, variantId },
        });
      } else {
        if (quantity > availableStock) {
          throw new BadRequestException(
            `Chỉ còn ${availableStock} sản phẩm trong kho. Không thể thêm ${quantity}.`,
          );
        }

        const existing = order.items.find((i) => i.variantId === variantId);
        const totalPrice = variant.price * quantity;

        if (existing) {
          await tx.orderItem.update({
            where: { id: existing.id },
            data: {
              quantity,
              unitPrice: variant.price,
              totalPrice,
            },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              variantId,
              quantity,
              unitPrice: variant.price,
              totalPrice,
            },
          });
        }
      }

      // Update order totals within same transaction
      const updatedItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      // Preserve and clamp old discountAmount
      const oldDiscount = order.discountAmount || 0;
      const newDiscount = Math.min(oldDiscount, totalAmount);

      await tx.order.update({
        where: { id: order.id },
        data: {
          totalAmount,
          discountAmount: newDiscount,
          finalAmount: totalAmount - newDiscount,
        },
      });
    });

    // Fetch the complete updated order outside of transaction
    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async payCash(staffUserId: string, orderId: string) {
    const order = await this.getStaffOrderOrThrow(staffUserId, orderId);

    if (order.items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    await this.prisma.$transaction(async (tx) => {
      if (order.storeId) {
        for (const item of order.items) {
          const current = await tx.storeStock.findUnique({
            where: {
              storeId_variantId: {
                storeId: order.storeId!,
                variantId: item.variantId,
              },
            },
          });
          const qty = current?.quantity ?? 0;
          if (qty < item.quantity) {
            throw new BadRequestException(
              `Insufficient store stock for variant ${item.variantId}`,
            );
          }
          await tx.storeStock.upsert({
            where: {
              storeId_variantId: {
                storeId: order.storeId!,
                variantId: item.variantId,
              },
            },
            create: {
              storeId: order.storeId!,
              variantId: item.variantId,
              quantity: -item.quantity,
            },
            update: {
              quantity: { decrement: item.quantity },
              updatedAt: new Date(),
            },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              staffId: staffUserId,
              storeId: order.storeId!,
              type: InventoryLogType.SALE_POS,
              quantity: -item.quantity,
              reason: `POS order ${order.code}`,
            },
          });
        }
      } else {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.COD,
          amount: order.finalAmount,
          status: PaymentStatus.PAID,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.COMPLETED,
        },
      });


      // Award loyalty points (1 point per 10,000 VND)
      const fullOrder = await tx.order.findUnique({ where: { id: order.id } });
      const points = Math.floor(order.finalAmount / 10000);
      if (points > 0) {
        const orderPhone = fullOrder?.phone ?? null;

        if (fullOrder?.userId) {
          // Registered customer → update their loyaltyPoints counter + create transaction
          await tx.user.update({
            where: { id: fullOrder.userId },
            data: { loyaltyPoints: { increment: points } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              userId: fullOrder.userId,
              phone: orderPhone,
              orderId: order.id,
              points,
              reason: 'EARNED_FROM_ORDER',
            },
          });
        } else if (orderPhone) {
          // Guest customer (phone only, no account) → create transaction by phone
          // Points will be migrated when they register with this phone number
          await tx.loyaltyTransaction.create({
            data: {
              phone: orderPhone,
              orderId: order.id,
              points,
              reason: 'EARNED_FROM_ORDER',
            },
          });
        }
      }
    });

    const refreshed = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    return refreshed;
  }

  async createQrPayment(staffUserId: string, orderId: string) {
    const order = await this.getStaffOrderOrThrow(staffUserId, orderId);

    if (order.items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    const numericCode = parseInt(order.code.replace(/\D/g, ''), 10);
    const orderCode = Number.isFinite(numericCode) ? numericCode : Date.now();

    return this.paymentsService.createPayOSPaymentLink(
      order.id,
      orderCode,
      order.finalAmount,
      order.items,
    );
  }

  /**
   * Save a local cart from mobile as a server-side draft (PENDING) order.
   */
  async saveAsDraft(
    staffUserId: string,
    role: string,
    storeId: string,
    items: { variantId: string; quantity: number }[],
    customerPhone?: string,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    await this.storesService.ensureStaffCanAccessStore(
      staffUserId,
      storeId,
      role,
    );

    // Resolve customer
    let customerId: string | undefined;
    if (customerPhone) {
      const customer = await this.prisma.user.findFirst({
        where: { phone: customerPhone },
      });
      if (customer) customerId = customer.id;
    }

    // Validate stock & gather variant prices
    const variantData: {
      variantId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      if (item.quantity <= 0) continue;
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found`);
      }

      variantData.push({
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      });
    }

    const totalAmount = variantData.reduce(
      (sum, v) => sum + v.price * v.quantity,
      0,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code: `POS-${Date.now()}`,
          staffId: staffUserId,
          storeId,
          userId: customerId ?? undefined,
          phone: customerPhone ?? undefined,
          channel: OrderChannel.POS,
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          isPosDraft: true,
        },
      });

      for (const v of variantData) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: v.variantId,
            quantity: v.quantity,
            unitPrice: v.price,
            totalPrice: v.price * v.quantity,
          },
        });
      }
      return newOrder;
    });

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        store: true,
        user: {
          select: { id: true, fullName: true, phone: true, loyaltyPoints: true },
        },
      },
    });
  }

  /**
   * One-shot checkout: create order + items + pay in a single transaction.
   * For CASH: order is created and paid immediately.
   * For QR: order is created (PENDING), returns a QR payment link.
   */
  async checkout(
    staffUserId: string,
    role: string,
    storeId: string,
    items: { variantId: string; quantity: number }[],
    paymentMethod: 'CASH' | 'QR',
    customerPhone?: string,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    await this.storesService.ensureStaffCanAccessStore(
      staffUserId,
      storeId,
      role,
    );

    // Resolve customer
    let customerId: string | undefined;
    if (customerPhone) {
      const customer = await this.prisma.user.findFirst({
        where: { phone: customerPhone },
      });
      if (customer) customerId = customer.id;
    }

    // Validate stock & gather variant prices
    const variantData: {
      variantId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      if (item.quantity <= 0) continue;
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found`);
      }

      const storeStock = await this.prisma.storeStock.findUnique({
        where: {
          storeId_variantId: { storeId, variantId: item.variantId },
        },
      });
      const available = storeStock?.quantity ?? 0;
      if (item.quantity > available) {
        throw new BadRequestException(
          `Chỉ còn ${available} sản phẩm trong kho cho variant ${variant.name}`,
        );
      }

      variantData.push({
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      });
    }

    if (variantData.length === 0) {
      throw new BadRequestException('No valid items');
    }

    const totalAmount = variantData.reduce(
      (sum, v) => sum + v.price * v.quantity,
      0,
    );

    // Create order + items (and optionally pay) in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code: `POS-${Date.now()}`,
          staffId: staffUserId,
          storeId,
          userId: customerId ?? undefined,
          phone: customerPhone ?? undefined,
          channel: OrderChannel.POS,
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          status:
            paymentMethod === 'CASH'
              ? OrderStatus.COMPLETED
              : OrderStatus.PENDING,
          paymentStatus:
            paymentMethod === 'CASH'
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING,
        },
      });

      // Create items
      for (const v of variantData) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: v.variantId,
            quantity: v.quantity,
            unitPrice: v.price,
            totalPrice: v.price * v.quantity,
          },
        });
      }

      if (paymentMethod === 'CASH') {
        // Deduct store stock & log
        for (const v of variantData) {
          const result = await tx.storeStock.updateMany({
            where: {
              storeId,
              variantId: v.variantId,
              quantity: { gte: v.quantity },
            },
            data: {
              quantity: { decrement: v.quantity },
              updatedAt: new Date(),
            },
          });

          if (result.count === 0) {
            const variant = await tx.productVariant.findUnique({ where: { id: v.variantId } });
            throw new BadRequestException(
              `Sản phẩm ${variant?.name || v.variantId} không đủ số lượng trong kho tại cửa hàng này.`,
            );
          }

          await tx.inventoryLog.create({
            data: {
              variantId: v.variantId,
              staffId: staffUserId,
              storeId,
              type: InventoryLogType.SALE_POS,
              quantity: -v.quantity,
              reason: `POS order ${newOrder.code}`,
            },
          });
        }

        // Create payment record
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            provider: PaymentProvider.COD,
            amount: totalAmount,
            status: PaymentStatus.PAID,
          },
        });

        // Award loyalty points (1 pt per 10,000 VND)
        const points = Math.floor(totalAmount / 10000);
        if (points > 0) {
          if (customerId) {
            await tx.user.update({
              where: { id: customerId },
              data: { loyaltyPoints: { increment: points } },
            });
            await tx.loyaltyTransaction.create({
              data: {
                userId: customerId,
                phone: customerPhone,
                orderId: newOrder.id,
                points,
                reason: 'EARNED_FROM_ORDER',
              },
            });
          } else if (customerPhone) {
            await tx.loyaltyTransaction.create({
              data: {
                phone: customerPhone,
                orderId: newOrder.id,
                points,
                reason: 'EARNED_FROM_ORDER',
              },
            });
          }
        }
      } else if (paymentMethod === 'QR') {
        // --- STOCK RESERVATION FOR QR ---
        for (const v of variantData) {
          const result = await tx.storeStock.updateMany({
            where: {
              storeId,
              variantId: v.variantId,
              quantity: { gte: v.quantity },
            },
            data: {
              quantity: { decrement: v.quantity },
              updatedAt: new Date(),
            },
          });

          if (result.count === 0) {
            const variant = await tx.productVariant.findUnique({ where: { id: v.variantId } });
            throw new BadRequestException(
              `Sản phẩm ${variant?.name || v.variantId} không đủ số lượng trong kho tại cửa hàng này.`,
            );
          }

          await tx.inventoryLog.create({
            data: {
              variantId: v.variantId,
              staffId: staffUserId,
              storeId,
              type: InventoryLogType.SALE_POS,
              quantity: -v.quantity,
              reason: `POS order ${newOrder.code} (QR Reservation)`,
            },
          });
        }
      }

      return newOrder;
    });

    // For QR, generate payment link
    if (paymentMethod === 'QR') {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
        },
      });
      const numericCode = parseInt(order.code.replace(/\D/g, ''), 10);
      const orderCode = Number.isFinite(numericCode) ? numericCode : Date.now();
      const qrResult = await this.paymentsService.createPayOSPaymentLink(
        order.id,
        orderCode,
        totalAmount,
        fullOrder?.items ?? [],
      );
      return { order, ...qrResult };
    }

    // For CASH, return the complete order
    const refreshed = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
        store: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    return refreshed;
  }

  async cancelOrder(staffUserId: string, orderId: string) {
    const order = await this.getStaffOrderOrThrow(staffUserId, orderId);

    await this.prisma.$transaction(async (tx) => {
      // Delete all order items
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });

      // Update order status to CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      // Return stock
      await this.ordersService.restockOrderItems(order.id, tx);
    });

    return { success: true, orderId: order.id };
  }

}
