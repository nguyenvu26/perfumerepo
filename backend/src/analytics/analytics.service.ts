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
  totalProfit: number;      // New: Total Profit (Revenue - COGS)
  inventoryValue: number;   // New: Total Value of stock at cost
  successRate: number;      // New: Percentage of completed orders
  returnRate: number;       // New: Percentage of returned orders
  cancellationRate: number; // New: Percentage of cancelled orders
  revenueChange: number;
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
  async getOverview(startDate?: string, endDate?: string): Promise<OverviewDto> {
    const now = new Date();
    
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;

    if (startDate && endDate) {
      currentStart = new Date(startDate);
      currentEnd = new Date(endDate);
      const durationMs = currentEnd.getTime() - currentStart.getTime();
      previousStart = new Date(currentStart.getTime() - durationMs);
    } else {
      // Default: last 30 days
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      currentEnd = now;
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);
    }

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    // Current period orders
    const currentOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      select: {
        finalAmount: true,
        refundAmount: true,
        status: true,
        paymentStatus: true,
        items: {
          select: {
            purchasePrice: true,
            quantity: true,
            variant: {
              select: {
                purchasePrice: true
              }
            }
          }
        }
      },
    });

    // Previous period orders (for % change)
    const previousOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: previousStart, lt: currentStart },
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
        createdAt: { gte: currentStart, lte: currentEnd },
      },
    });

    const totalProfit = currentPaid.reduce((acc, o) => {
      const revenue = o.finalAmount - o.refundAmount;
      const cogs = o.items.reduce((sum, item: any) => {
        // Fallback to variant price if recorded item price is missing
        const cost = item.purchasePrice ?? item.variant?.purchasePrice ?? 0;
        return sum + cost * item.quantity;
      }, 0);
      return acc + (revenue - cogs);
    }, 0);

    // Inventory Value
    const inventories = await this.prisma.inventory.findMany({
      include: { variant: { select: { purchasePrice: true } } }
    });
    const inventoryValue = inventories.reduce((sum, inv) => sum + (inv.onHand * (inv.variant.purchasePrice || 0)), 0);

    // Success & Return Rates
    const returnsCount = await this.prisma.returnRequest.count({
      where: { createdAt: { gte: currentStart, lte: currentEnd } }
    });
    const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;
    const returnRate = totalOrders > 0 ? (returnsCount / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      newCustomersToday,
      aiConsultations,
      totalProfit,
      inventoryValue,
      revenueChange,
      ordersChange,
      successRate,
      returnRate,
      cancellationRate,
    };
  }

  /**
   * Sales trend data grouped by day for charting
   * @param period 'week' | 'month' | 'year'
   */
  async getSalesTrend(
    period: 'week' | 'month' | 'year' | 'quarter' = 'month',
    startDate?: string,
    endDate?: string,
  ): Promise<SalesTrendPoint[]> {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'week':
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          break;
        case 'quarter':
          start = new Date(now);
          start.setMonth(start.getMonth() - 3);
          break;
        case 'year':
          start = new Date(now);
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'month':
        default:
          start = new Date(now);
          start.setDate(start.getDate() - 30);
          break;
      }
      start.setHours(0, 0, 0, 0);
    }

    const paidStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
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
    const cursor = new Date(start);
    while (cursor <= end) {
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
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        inventories: {
          select: {
            available: true,
          },
        },
      },
      take: 50, // Get more then filter/sort in memory because we can't sum relation fields easily in Prisma where/orderBy
    });

    const lowStockItems = variants
      .map((v: any) => {
        const totalStock = v.inventories.reduce((sum: number, inv: any) => sum + inv.available, 0);
        return {
          variantId: v.id,
          productName: v.product.name,
          variantName: v.name,
          stock: totalStock,
          imageUrl: v.product.images[0]?.url ?? null,
        };
      })
      .filter((v) => v.stock <= threshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);

    return lowStockItems;
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

  /**
   * AI Conversion tracking: How many sold items were recommended by AI
   */
  async getAiConversionRate() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalItems, aiRecommendedItems, totalConsultations] = await Promise.all([
      this.prisma.orderItem.aggregate({
        where: { order: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED'] } } },
        _sum: { quantity: true }
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED'] } }, isAiRecommended: true },
        _sum: { quantity: true }
      }),
      this.prisma.quizResult.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      })
    ]);

    const itemsCount = totalItems._sum.quantity || 0;
    const aiItemsCount = aiRecommendedItems._sum.quantity || 0;

    const conversionRate = itemsCount > 0 ? (aiItemsCount / itemsCount) * 100 : 0;

    return {
      totalConsultations,
      totalItemsSold: itemsCount,
      aiRecommendedItemsSold: aiItemsCount,
      conversionRate: Math.round(conversionRate * 10) / 10
    };
  }

  /**
   * Advanced financial analytics including profit, margin, and ROI
   */
  async getFinancialAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const paidOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
      },
      include: {
        items: {
          include: { variant: { select: { purchasePrice: true } } }
        },
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0; // Cost of Goods Sold

    for (const order of paidOrders) {
      const orderRevenue = order.finalAmount - order.refundAmount;
      totalRevenue += orderRevenue;
      
      for (const item of order.items) {
        // If purchasePrice wasn't captured, fallback to current variant purchasePrice
        const cost = item.purchasePrice ?? item.variant?.purchasePrice ?? 0;
        totalCogs += cost * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const roi = totalCogs > 0 ? (grossProfit / totalCogs) * 100 : 0;

    // Total inventory value at cost
    const inventories = await this.prisma.inventory.findMany({
      include: { variant: { select: { purchasePrice: true } } },
    });
    const totalInventoryValue = inventories.reduce((sum, inv) => {
      return sum + (inv.onHand * (inv.variant.purchasePrice || 0));
    }, 0);

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      grossMargin: Math.round(grossMargin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      inventoryValue: totalInventoryValue,
    };
  }

  /**
   * Inventory turnover and predicted stock-out dates
   */
  async getInventoryHealth() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales volume for each variant in last 30 days
    const sales = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map(sales.map(s => [s.variantId, s._sum.quantity || 0]));

    // Get current stock
    const inventories = await this.prisma.inventory.findMany({
      include: { 
        variant: { 
          include: { 
            product: { 
              select: { 
                name: true,
                images: { orderBy: { order: 'asc' }, take: 1 }
              } 
            } 
          } 
        } 
      },
    });

    const variantStock = new Map<string, { name: string, stock: number, imageUrl: string | null }>();
    for (const inv of inventories) {
      const existing = variantStock.get(inv.variantId);
      if (existing) {
        existing.stock += inv.available;
      } else {
        variantStock.set(inv.variantId, {
          name: `${inv.variant.product.name} - ${inv.variant.name}`,
          stock: inv.available,
          imageUrl: inv.variant.product.images[0]?.url || null
        });
      }
    }

    const healthItems = Array.from(variantStock.entries()).map(([variantId, data]) => {
      const monthlySales = salesMap.get(variantId) || 0;
      const dailySalesRate = monthlySales / 30;
      const daysRemaining = dailySalesRate > 0 ? Math.floor(data.stock / dailySalesRate) : 999;
      
      // Turnover rate = Cost of Goods Sold / Average Inventory
      // Here we use a simpler version: Units Sold / Current Stock
      const turnoverRate = data.stock > 0 ? (monthlySales / data.stock) : 0;

      return {
        variantId,
        name: data.name,
        currentStock: data.stock,
        monthlySales,
        daysRemaining,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        status: daysRemaining < 7 ? 'CRITICAL' : daysRemaining < 15 ? 'WARNING' : 'HEALTHY',
        imageUrl: data.imageUrl
      };
    });

    return healthItems
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 20);
  }

  /**
   * Stock Movement Heatmap: Matrix of products vs stores showing velocity & stock
   */
  async getStockMovementHeatmap() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get all active stores
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true }
    });

    // 2. Get top 20 variants by total sales
    const topSales = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20
    });

    const variantIds = topSales.map(s => s.variantId);

    // 3. Get full variant/product info
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } }
    });

    // 4. Get sales per store per variant (using findMany since groupBy has limits on nested relations)
    const salesItems = await this.prisma.orderItem.findMany({
      where: {
        variantId: { in: variantIds },
        order: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
      },
      select: {
        variantId: true,
        quantity: true,
        order: { select: { storeId: true } }
      }
    });

    // 5. Get current stock per store per variant
    const stockPerStore = await this.prisma.inventory.findMany({
      where: { variantId: { in: variantIds } },
      select: { warehouseId: true, variantId: true, available: true }
    });

    // 6. Build Matrix
    const matrix = variants.map(v => {
      const storeData = stores.map(s => {
        // Aggregate sales for this variant at this store
        const sales = salesItems
          .filter(item => item.variantId === v.id && item.order.storeId === s.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        const stock = stockPerStore.find(st => st.variantId === v.id && st.warehouseId === s.id)?.available || 0;
        const velocity = sales / 30; // units per day
        const daysRemaining = velocity > 0 ? Math.floor(stock / velocity) : (stock > 0 ? 999 : 0);
        
        return {
          storeId: s.id,
          stock,
          velocity: Math.round(velocity * 100) / 100,
          daysRemaining
        };
      });

      return {
        variantId: v.id,
        variantName: `${v.product.name} - ${v.name}`,
        stores: storeData
      };
    });

    // 7. Generate Recommendations
    const recommendations: any[] = [];
    matrix.forEach(row => {
      const criticalStores = row.stores.filter(s => s.daysRemaining < 5 && s.velocity > 0.1);
      const healthyStores = row.stores.filter(s => s.daysRemaining > 30 && s.stock > 10);

      if (criticalStores.length > 0 && healthyStores.length > 0) {
        criticalStores.forEach(target => {
          const source = healthyStores.sort((a, b) => b.stock - a.stock)[0];
          if (source) {
            recommendations.push({
              variantId: row.variantId,
              variantName: row.variantName,
              fromStoreId: source.storeId,
              fromStoreName: stores.find(s => s.id === source.storeId)?.name,
              toStoreId: target.storeId,
              toStoreName: stores.find(s => s.id === target.storeId)?.name,
              suggestedQuantity: Math.min(Math.floor(source.stock / 2), 10),
              reason: `Boutique ${stores.find(s => s.id === target.storeId)?.name} sắp cháy hàng (${target.daysRemaining} ngày), Boutique ${stores.find(s => s.id === source.storeId)?.name} đang dư tồn kho (${source.daysRemaining} ngày).`
            });
          }
        });
      }
    });

    return {
      stores,
      matrix,
      recommendations
    };
  }
}
