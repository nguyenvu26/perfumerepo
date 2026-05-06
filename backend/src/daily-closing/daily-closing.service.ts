import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';

@Injectable()
export class DailyClosingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDailyClosingDto) {
    return this.prisma.dailyClosing.create({
      data: {
        ...dto,
        staffId: userId,
      },
    });
  }

  async findAll(storeId?: string) {
    return this.prisma.dailyClosing.findMany({
      where: storeId ? { storeId } : {},
      include: {
        staff: {
          select: {
            fullName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getClosingDetails(id: string) {
    const closing = await this.prisma.dailyClosing.findUnique({
      where: { id },
      include: {
        store: true,
        staff: { select: { fullName: true } }
      }
    });

    if (!closing) return null;

    // Tìm bản chốt ca trước đó của cửa hàng này để xác định khoảng thời gian
    const prevClosing = await this.prisma.dailyClosing.findFirst({
      where: {
        storeId: closing.storeId,
        createdAt: { lt: closing.createdAt }
      },
      orderBy: { createdAt: 'desc' }
    });

    const startTime = prevClosing ? prevClosing.createdAt : new Date(new Date(closing.closingDate).setHours(0,0,0,0));
    const endTime = closing.createdAt;

    // Lấy danh sách đơn hàng trong ca
    const orders = await this.prisma.order.findMany({
      where: {
        storeId: closing.storeId,
        createdAt: { gt: startTime, lte: endTime },
        paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED'] }
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        user: { select: { fullName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Thống kê sản phẩm đã bán
    const productStats = new Map<string, any>();
    (orders as any[]).forEach(order => {
      order.items.forEach((item: any) => {
        const key = item.variantId;
        const existing = productStats.get(key) || {
          id: item.variantId,
          name: item.variant.product.name,
          sku: item.variant.sku,
          quantity: 0,
          revenue: 0,
          purchasePrice: item.purchasePrice ?? item.variant.purchasePrice ?? 0
        };
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        productStats.set(key, existing);
      });
    });

    return {
      closing,
      orders,
      soldProducts: Array.from(productStats.values()),
      stats: {
        avgOrderValue: orders.length > 0 ? closing.systemTotal / orders.length : 0,
        profit: Array.from(productStats.values()).reduce((sum, p) => sum + (p.revenue - (p.purchasePrice * p.quantity)), 0)
      }
    };
  }

  async checkTodayClosing(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closing = await this.prisma.dailyClosing.findFirst({
      where: {
        storeId,
        closingDate: {
          gte: today,
        },
      },
    });

    return !!closing;
  }
}
