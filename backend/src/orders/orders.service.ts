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

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly shippingService: ShippingService,
    private readonly notificationsService: NotificationsService,
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

    const totalAmount = cart.items.reduce(
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
            create: cart.items.map((item) => ({
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

      if (promoData) {
        await tx.promotionCode.update({
          where: { id: promoData.promoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (dto.redeemPoints) {
        await this.loyaltyService.redeemPoints(
          userId,
          dto.redeemPoints,
          created.id,
          tx,
        );
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    if (
      dto.paymentMethod === 'COD' &&
      order.shippingDistrictId &&
      order.shippingWardCode
    ) {
      try {
        await this.shippingService.createGhnShipment(order.id);
      } catch (e) {
        console.warn('GHN shipment creation failed:', e?.message);
      }
    }

    // Notify user about new order
    if (order.userId) {
      this.notificationsService
        .create({
          userId: order.userId,
          type: 'ORDER',
          title: 'Đặt hàng thành công',
          content: `Đơn hàng ${order.code} đã được tạo thành công.`,
          data: { orderId: order.id, orderCode: order.code },
        })
        .catch(() => {});
    }

    return order;
  }

  async listMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.variant.product,
      })),
    }));
  }

  async listAllOrders(skip: number, take: number) {
    const [rawData, total] = await Promise.all([
      this.prisma.order.findMany({
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
          promotions: { include: { promotionCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    const data = rawData.map((order) => ({
      ...order,
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
        promotions: { include: { promotionCode: true } },
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
    });

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
}
