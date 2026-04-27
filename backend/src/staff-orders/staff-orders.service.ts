import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel } from '@prisma/client';

@Injectable()
export class StaffOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listStaffPosOrders(
    userId: string,
    role: 'STAFF' | 'ADMIN',
    skip = 0,
    take = 20,
    search?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
  ) {
    const where: any = {};

    if (role === 'STAFF') {
      const userStores = await this.prisma.userStore.findMany({
        where: { userId },
        select: { storeId: true },
      });
      const storeIds = userStores.map((s) => s.storeId);
      where.storeId = { in: storeIds };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (status) {
      where.status = status;
    }

    // Hide temporary POS orders (e.g. abandoned QR checkouts) that wasn't saved as draft
    where.NOT = {
      channel: OrderChannel.POS,
      paymentStatus: 'PENDING',
      isPosDraft: false,
    };

    // Search by order code or customer phone
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { user: { phone: { contains: term, mode: 'insensitive' } } },
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
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
                include: { product: { include: { images: { take: 1 } } } },
              },
            },
          },
          staff: true,
          payments: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          returnRequests: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
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

  async getOrderDetail(
    orderId: string,
    userId: string,
    role: 'STAFF' | 'ADMIN',
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { include: { images: { take: 1 } } } },
            },
          },
        },
        staff: {
          select: { id: true, fullName: true, email: true },
        },
        payments: true,
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        store: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        returnRequests: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Staff can only view orders from their assigned stores
    if (role === 'STAFF') {
      const userStores = await this.prisma.userStore.findMany({
        where: { userId },
        select: { storeId: true },
      });
      const storeIds = userStores.map((s) => s.storeId);
      if (!order.storeId || !storeIds.includes(order.storeId)) {
        throw new ForbiddenException('You can only view orders from your assigned stores');
      }
    }

    return order;
  }

  async getOrderByCode(code: string, userId: string, role: 'STAFF' | 'ADMIN') {
    const normalizedCode = code.trim();

    const order = await this.prisma.order.findUnique({
      where: { code: normalizedCode },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { include: { images: { take: 1 } } } },
            },
          },
        },
        staff: {
          select: { id: true, fullName: true, email: true },
        },
        payments: true,
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        store: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Removed channel restriction to allow finding online orders for the store
    /*
    if (order.channel !== OrderChannel.POS) {
      throw new ForbiddenException('Only POS orders are allowed in this flow');
    }
    */

    // Staff can only view orders from their assigned stores
    if (role === 'STAFF') {
      const userStores = await this.prisma.userStore.findMany({
        where: { userId },
        select: { storeId: true },
      });
      const storeIds = userStores.map((s) => s.storeId);
      if (!order.storeId || !storeIds.includes(order.storeId)) {
        throw new ForbiddenException('You can only view orders from your assigned stores');
      }
    }

    return order;
  }
}
