import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel } from '@prisma/client';

@Injectable()
export class StaffOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async listStaffPosOrders(
    userId: string,
    role: 'STAFF' | 'ADMIN',
    skip = 0,
    take = 20,
    search?: string,
  ) {
    const where: any = {
      channel: OrderChannel.POS,
    };

    if (role === 'STAFF') {
      where.staffId = userId;
    }

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
                include: { product: true },
              },
            },
          },
          staff: true,
          payments: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
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
              include: { product: true },
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

    // Staff can only view their own POS orders
    if (role === 'STAFF' && order.staffId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }
}
