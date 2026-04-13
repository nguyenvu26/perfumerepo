import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel, PaymentStatus } from '@prisma/client';

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  avgOrderValue: number;
  completionRate: number;
  topProducts: {
    productName: string;
    variantName: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
}

@Injectable()
export class StaffReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyReport(
    userId: string,
    role: 'STAFF' | 'ADMIN',
    dateStr?: string,
  ): Promise<DailyReport> {
    const today = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      channel: OrderChannel.POS,
      createdAt: { gte: startOfDay, lte: endOfDay },
    };

    if (role === 'STAFF') {
      where.staffId = userId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    const totalOrders = orders.length;
    const successful = orders.filter((o) => o.status === 'COMPLETED');
    const cancelled = orders.filter((o) => o.status === 'CANCELLED');
    const refunded = orders.filter(
      (o) =>
        o.paymentStatus === PaymentStatus.REFUNDED ||
        o.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED,
    );

    // Revenue from orders that are NOT cancelled
    // (A partially refunded order is still successful but with less revenue)
    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    const paidOrders = orders.filter((o) =>
      paidStatuses.includes(o.paymentStatus),
    );

    const totalRevenue = paidOrders.reduce(
      (acc, order) => acc + (order.finalAmount - order.refundAmount),
      0,
    );

    const avgOrderValue =
      successful.length > 0 ? Math.round(totalRevenue / successful.length) : 0;

    const completionRate =
      totalOrders > 0 ? Math.round((successful.length / totalOrders) * 100) : 0;

    // Aggregate top products from non-cancelled orders
    const productMap = new Map<
      string,
      {
        productName: string;
        variantName: string;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const order of paidOrders) {
      for (const item of order.items) {
        const key = item.variantId;
        const existing = productMap.get(key);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.totalPrice;
        } else {
          productMap.set(key, {
            productName: item.variant.product.name,
            variantName: item.variant.name,
            totalQuantity: item.quantity,
            totalRevenue: item.totalPrice,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalRevenue,
      totalOrders,
      successfulOrders: successful.length,
      cancelledOrders: cancelled.length,
      refundedOrders: refunded.length,
      avgOrderValue,
      completionRate,
      topProducts,
    };
  }
}
