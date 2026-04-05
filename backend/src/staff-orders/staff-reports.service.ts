import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel, PaymentStatus } from '@prisma/client';

export interface DailyReport {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    avgOrderValue: number;
    topProducts: {
        productName: string;
        variantName: string;
        totalQuantity: number;
        totalRevenue: number;
    }[];
}

@Injectable()
export class StaffReportsService {
    constructor(private readonly prisma: PrismaService) { }

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

        // Total orders + paid orders
        const [allOrders, paidOrders] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.findMany({
                where: { ...where, paymentStatus: PaymentStatus.PAID },
                include: {
                    items: {
                        include: { variant: { include: { product: true } } },
                    },
                },
            }),
        ]);

        const totalRevenue = paidOrders.reduce(
            (acc, order) => acc + order.finalAmount,
            0,
        );

        const avgOrderValue =
            paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

        // Aggregate top products
        const productMap = new Map<
            string,
            { productName: string; variantName: string; totalQuantity: number; totalRevenue: number }
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
            totalOrders: allOrders,
            completedOrders: paidOrders.length,
            avgOrderValue,
            topProducts,
        };
    }
}
