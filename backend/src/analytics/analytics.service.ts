import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface OverviewDto {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  newCustomersToday: number;
  aiConsultations: number;
  revenueChange: number;   // % change vs previous period
  ordersChange: number;
}

export interface SalesTrendPoint {
  date: string;          // ISO date string (YYYY-MM-DD)
  revenue: number;
  orders: number;
}

export interface TopProductDto {
  productId: string;
  productName: string;
  imageUrl: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ChannelBreakdownDto {
  online: number;
  pos: number;
}

export interface LowStockItemDto {
  variantId: string;
  productName: string;
  variantName: string;
  stock: number;
  imageUrl: string | null;
}

export interface RecentOrderDto {
  id: string;
  code: string;
  customerName: string | null;
  finalAmount: number;
  status: string;
  channel: string;
  createdAt: Date;
}

export interface StoreRevenueDto {
  today: number;
  week: number;
  month: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main overview stats for the dashboard header cards
   */
  async getOverview(): Promise<OverviewDto> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Current period = last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Previous period = 30-60 days ago (for comparison)
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    // Current period orders
    const currentOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        finalAmount: true,
        refundAmount: true,
        status: true,
        paymentStatus: true,
      },
    });

    // Previous period orders (for % change)
    const previousOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: {
        finalAmount: true,
        refundAmount: true,
        paymentStatus: true,
      },
    });

    const currentPaid = currentOrders.filter((o) =>
      paidStatuses.includes(o.paymentStatus),
    );
    const previousPaid = previousOrders.filter((o) =>
      paidStatuses.includes(o.paymentStatus),
    );

    const totalRevenue = currentPaid.reduce(
      (acc, o) => acc + (o.finalAmount - o.refundAmount),
      0,
    );
    const prevRevenue = previousPaid.reduce(
      (acc, o) => acc + (o.finalAmount - o.refundAmount),
      0,
    );

    const totalOrders = currentOrders.length;
    const prevTotalOrders = previousOrders.length;

    const completedOrders = currentOrders.filter(
      (o) => o.status === OrderStatus.COMPLETED,
    ).length;
    const cancelledOrders = currentOrders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    ).length;

    const revenueChange =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10
        : 0;

    const ordersChange =
      prevTotalOrders > 0
        ? Math.round(
            ((totalOrders - prevTotalOrders) / prevTotalOrders) * 1000,
          ) / 10
        : 0;

    // Total customers
    const totalCustomers = await this.prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // New customers today
    const newCustomersToday = await this.prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startOfToday },
      },
    });

    // AI consultations (chat + quiz) in current period
    const aiConsultations = await this.prisma.aiRequestLog.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      newCustomersToday,
      aiConsultations,
      revenueChange,
      ordersChange,
    };
  }

  /**
   * Sales trend data grouped by day for charting
   * @param period 'week' | 'month' | 'year'
   */
  async getSalesTrend(
    period: 'week' | 'month' | 'year' = 'month',
  ): Promise<SalesTrendPoint[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: { in: paidStatuses },
      },
      select: {
        finalAmount: true,
        refundAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const map = new Map<string, { revenue: number; orders: number }>();

    // Pre-fill all dates so chart has no gaps
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

    // For year view, aggregate by month instead of day
    if (period === 'year') {
      const monthMap = new Map<string, { revenue: number; orders: number }>();
      for (const [dateKey, val] of map.entries()) {
        const monthKey = dateKey.slice(0, 7); // YYYY-MM
        const existing = monthMap.get(monthKey);
        if (existing) {
          existing.revenue += val.revenue;
          existing.orders += val.orders;
        } else {
          monthMap.set(monthKey, { ...val });
        }
      }
      return Array.from(monthMap.entries()).map(([date, val]) => ({
        date,
        revenue: val.revenue,
        orders: val.orders,
      }));
    }

    return Array.from(map.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      orders: val.orders,
    }));
  }

  /**
   * Top selling products (by quantity sold)
   */
  async getTopProducts(limit = 5): Promise<TopProductDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        productName: string;
        imageUrl: string | null;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const item of items) {
      const pid = item.variant.productId;
      const existing = productMap.get(pid);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.totalPrice;
      } else {
        productMap.set(pid, {
          productName: item.variant.product.name,
          imageUrl: item.variant.product.images[0]?.url ?? null,
          totalQuantity: item.quantity,
          totalRevenue: item.totalPrice,
        });
      }
    }

    return Array.from(productMap.entries())
      .map(([productId, val]) => ({ productId, ...val }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  /**
   * Channel breakdown: online vs POS orders
   */
  async getChannelBreakdown(): Promise<ChannelBreakdownDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [online, pos] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          channel: 'ONLINE',
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          channel: 'POS',
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      }),
    ]);

    return { online, pos };
  }

  /**
   * Low stock alerts: variants with stock <= threshold
   */
  async getLowStockItems(threshold = 10): Promise<LowStockItemDto[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { stock: 'asc' },
      take: 10,
    });

    return variants.map((v) => ({
      variantId: v.id,
      productName: v.product.name,
      variantName: v.name,
      stock: v.stock,
      imageUrl: v.product.images[0]?.url ?? null,
    }));
  }

  /**
   * Recent orders for the live feed section
   */
  async getRecentOrders(limit = 8): Promise<RecentOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
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

  /**
   * Get revenue breakdown for a specific store
   */
  async getStoreRevenue(storeId: string): Promise<StoreRevenueDto> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: startOfToday }, paymentStatus: { in: paidStatuses } },
        select: { finalAmount: true, refundAmount: true },
      }),
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: startOfWeek }, paymentStatus: { in: paidStatuses } },
        select: { finalAmount: true, refundAmount: true },
      }),
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: startOfMonth }, paymentStatus: { in: paidStatuses } },
        select: { finalAmount: true, refundAmount: true },
      }),
    ]);

    const calculate = (orders: any[]) =>
      orders.reduce((acc, o) => acc + (o.finalAmount - o.refundAmount), 0);

    return {
      today: calculate(todayOrders),
      week: calculate(weekOrders),
      month: calculate(monthOrders),
    };
  }
}
