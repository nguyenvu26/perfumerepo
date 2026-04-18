import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel, PaymentStatus } from '@prisma/client';

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRefundedAmount: number;
  avgOrderValue: number;
  completionRate: number;
  cancelRate: number;
  hourlySales: {
    hour: number;
    revenue: number;
    orderCount: number;
  }[];
  topProducts: {
    productName: string;
    variantName: string;
    imageUrl?: string;
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
      createdAt: { gte: startOfDay, lte: endOfDay },
    };

    if (role === 'STAFF') {
      const userStores = await this.prisma.userStore.findMany({
        where: { userId },
        select: { storeId: true },
      });
      const storeIds = userStores.map((s) => s.storeId);
      where.storeId = { in: storeIds };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { 
            variant: { 
              include: { 
                product: { 
                  include: { 
                    images: { take: 1 } 
                  } 
                } 
              } 
            } 
          },
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

    const totalRefundedAmount = orders.reduce((acc, order) => acc + order.refundAmount, 0);

    const avgOrderValue =
      successful.length > 0 ? Math.round(totalRevenue / successful.length) : 0;

    const completionRate =
      totalOrders > 0 ? Math.round((successful.length / totalOrders) * 100) : 0;

    const cancelRate =
        totalOrders > 0 ? Math.round((cancelled.length / totalOrders) * 100) : 0;

    // Aggregate top products from non-cancelled orders
    const productMap = new Map<
      string,
      {
        productName: string;
        variantName: string;
        imageUrl?: string;
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
            imageUrl: item.variant.product.images[0]?.url,
            totalQuantity: item.quantity,
            totalRevenue: item.totalPrice,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Hourly sales for the line chart
    const hourlySalesMap = new Map<number, { revenue: number, orderCount: number }>();
    for (let i = 0; i < 24; i++) {
        hourlySalesMap.set(i, { revenue: 0, orderCount: 0 });
    }

    for (const order of paidOrders) {
        // Simple hour extraction, adjust for timezone if needed
        const hour = new Date(order.createdAt).getUTCHours() + 7; 
        const normalizedHour = hour >= 24 ? hour - 24 : hour;
        const entry = hourlySalesMap.get(normalizedHour);
        if (entry) {
            entry.revenue += (order.finalAmount - order.refundAmount);
            entry.orderCount += 1;
        }
    }

    const hourlySales = Array.from(hourlySalesMap.entries()).map(([hour, stats]) => ({
      hour,
      ...stats
    }));

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalRevenue,
      totalOrders,
      completedOrders: successful.length,
      cancelledOrders: cancelled.length,
      refundedOrders: refunded.length,
      totalRefundedAmount,
      avgOrderValue,
      completionRate,
      cancelRate,
      hourlySales,
      topProducts,
    };
  }
}
