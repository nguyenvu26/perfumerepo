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

  // --- NEW STAFF ANALYTICS METHODS ---

  private async getStaffStoreIds(userId: string, role: string): Promise<string[]> {
    if (role === 'ADMIN') {
      // Admins might not have specific stores assigned, or they can see all?
      // For staff analytics, if an admin views it, maybe they see everything or nothing.
      // Usually, we should just return all store ids or empty.
      const stores = await this.prisma.store.findMany({ select: { id: true } });
      return stores.map(s => s.id);
    }
    const userStores = await this.prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });
    return userStores.map((s) => s.storeId);
  }

  async getStaffOverview(userId: string, role: string) {
    const storeIds = await this.getStaffStoreIds(userId, role);
    if (storeIds.length === 0) return this.emptyOverview();

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const paidStatuses: PaymentStatus[] = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];

    // Current period
    const currentOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, storeId: { in: storeIds } },
      select: { finalAmount: true, refundAmount: true, status: true, paymentStatus: true },
    });

    // Previous period
    const previousOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, storeId: { in: storeIds } },
      select: { finalAmount: true, refundAmount: true, paymentStatus: true },
    });

    const currentPaid = currentOrders.filter((o) => paidStatuses.includes(o.paymentStatus));
    const previousPaid = previousOrders.filter((o) => paidStatuses.includes(o.paymentStatus));

    const totalRevenue = currentPaid.reduce((acc, o) => acc + (o.finalAmount - o.refundAmount), 0);
    const prevRevenue = previousPaid.reduce((acc, o) => acc + (o.finalAmount - o.refundAmount), 0);

    const totalOrders = currentOrders.length;
    const prevTotalOrders = previousOrders.length;

    const completedOrders = currentOrders.filter((o) => o.status === 'COMPLETED').length;
    const cancelledOrders = currentOrders.filter((o) => o.status === 'CANCELLED').length;

    const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;
    const ordersChange = prevTotalOrders > 0 ? Math.round(((totalOrders - prevTotalOrders) / prevTotalOrders) * 1000) / 10 : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenueChange,
      ordersChange,
    };
  }

  private emptyOverview() {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      revenueChange: 0,
      ordersChange: 0,
    };
  }

  async getStaffSalesTrend(userId: string, role: string, period: 'week' | 'month' | 'year' = 'month') {
    const storeIds = await this.getStaffStoreIds(userId, role);
    if (storeIds.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week': startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); break;
      case 'year': startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1); break;
      case 'month':
      default: startDate = new Date(now); startDate.setDate(startDate.getDate() - 30); break;
    }
    startDate.setHours(0, 0, 0, 0);

    const paidStatuses: PaymentStatus[] = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: { in: paidStatuses },
        storeId: { in: storeIds },
      },
      select: { finalAmount: true, refundAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, { revenue: number; orders: number }>();
    const cursor = new Date(startDate);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      map.set(key, { revenue: 0, orders: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) {
        entry.revenue += order.finalAmount - order.refundAmount;
        entry.orders += 1;
      }
    }

    if (period === 'year') {
      const monthMap = new Map<string, { revenue: number; orders: number }>();
      for (const [dateKey, val] of map.entries()) {
        const monthKey = dateKey.slice(0, 7);
        const existing = monthMap.get(monthKey);
        if (existing) {
          existing.revenue += val.revenue;
          existing.orders += val.orders;
        } else {
          monthMap.set(monthKey, { ...val });
        }
      }
      return Array.from(monthMap.entries()).map(([date, val]) => ({ date, ...val }));
    }

    return Array.from(map.entries()).map(([date, val]) => ({ date, ...val }));
  }

  async getStaffTopProducts(userId: string, role: string, limit = 5) {
    const storeIds = await this.getStaffStoreIds(userId, role);
    if (storeIds.length === 0) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
          storeId: { in: storeIds },
        },
      },
      include: {
        variant: { include: { product: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } } } },
      },
    });

    const productMap = new Map<string, any>();
    for (const item of items) {
      const pid = item.variant.productId;
      const existing = productMap.get(pid);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.totalPrice;
      } else {
        productMap.set(pid, {
          productId: pid,
          productName: item.variant.product.name,
          imageUrl: item.variant.product.images[0]?.url ?? null,
          totalQuantity: item.quantity,
          totalRevenue: item.totalPrice,
        });
      }
    }

    return Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, limit);
  }

  async getStaffLowStockItems(userId: string, role: string, threshold = 5) {
    const storeIds = await this.getStaffStoreIds(userId, role);
    if (storeIds.length === 0) return [];

    const storeStocks = await this.prisma.storeStock.findMany({
      where: {
        storeId: { in: storeIds },
        quantity: { lte: threshold },
        variant: { isActive: true, product: { isActive: true } },
      },
      include: {
        variant: {
          include: { product: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } } },
        },
        store: { select: { name: true } },
      },
      orderBy: { quantity: 'asc' },
      take: 20,
    });

    return storeStocks.map((ss) => ({
      variantId: ss.variant.id,
      productName: ss.variant.product.name,
      variantName: ss.variant.name,
      stock: ss.quantity,
      imageUrl: ss.variant.product.images[0]?.url ?? null,
      storeName: ss.store.name,
    }));
  }

  async getStaffRecentOrders(userId: string, role: string, limit = 8) {
    const storeIds = await this.getStaffStoreIds(userId, role);
    if (storeIds.length === 0) return [];

    const orders = await this.prisma.order.findMany({
      where: { storeId: { in: storeIds } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    return orders.map((o) => ({
      id: o.id,
      code: o.code,
      customerName: o.user?.fullName || o.user?.email || null,
      finalAmount: o.finalAmount,
      status: o.status,
      channel: o.channel,
      createdAt: o.createdAt,
    }));
  }
}
