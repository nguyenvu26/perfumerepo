import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getVietnamDayRangeUtc } from '../common/vietnam-time';

@Injectable()
export class AutoDailyClosingService {
  private readonly logger = new Logger(AutoDailyClosingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-create a DailyClosing record for yesterday (VN time) per store
   * when no staff manually closes.
   */
  @Cron('5 0 * * *', { timeZone: 'Asia/Ho_Chi_Minh' }) // 00:05 daily
  async autoCloseYesterday(): Promise<void> {
    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() - 1);
    await this.autoCloseForDate(target);
  }

  private async autoCloseForDate(date: Date): Promise<void> {
    const { startUtc: startOfDay, endUtc: endOfDay, vnDate } = getVietnamDayRangeUtc(date);

    // Stores that had orders yesterday
    const storesWithOrders = await this.prisma.order.findMany({
      where: {
        storeId: { not: null },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { storeId: true },
      distinct: ['storeId'],
    });

    const storeIds = storesWithOrders
      .map((s) => s.storeId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (storeIds.length === 0) return;

    for (const storeId of storeIds) {
      try {
        const existing = await this.prisma.dailyClosing.findFirst({
          where: { storeId, closingDate: { gte: startOfDay, lte: endOfDay } },
          select: { id: true },
        });
        if (existing) continue;

        const paidStatuses: PaymentStatus[] = [
          PaymentStatus.PAID,
          PaymentStatus.REFUNDED,
          PaymentStatus.PARTIALLY_REFUNDED,
        ];

        const paidOrders = await this.prisma.order.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
            paymentStatus: { in: paidStatuses },
          },
          include: { payments: true },
        });

        if (paidOrders.length === 0) continue;

        const systemTotal = paidOrders.reduce(
          (acc, o) => acc + (o.finalAmount - o.refundAmount),
          0,
        );

        let systemCash = 0;
        let systemTransfer = 0;
        for (const order of paidOrders) {
          for (const payment of order.payments) {
            if (payment.status !== PaymentStatus.PAID) continue;
            // COD is used as Cash in POS (same logic as staff report)
            if (payment.provider === 'COD') systemCash += payment.amount;
            else systemTransfer += payment.amount;
          }
        }

        const staffId = await this.pickStaffIdForStoreDay(storeId, startOfDay, endOfDay);
        if (!staffId) {
          this.logger.warn(`Skip auto-close: no staff found for store ${storeId} on ${vnDate}`);
          continue;
        }

        await this.prisma.dailyClosing.create({
          data: {
            storeId,
            staffId,
            closingDate: endOfDay,
            systemTotal,
            systemCash,
            systemTransfer,
            actualCash: systemCash,
            actualTransfer: systemTransfer,
            difference: 0,
            note: 'AUTO-CLOSE (no manual closing)',
            orderCount: paidOrders.length,
          },
        });
      } catch (err: any) {
        this.logger.error(
          `Auto-close failed for store ${storeId} (${vnDate}): ${err?.message || err}`,
        );
      }
    }
  }

  private async pickStaffIdForStoreDay(
    storeId: string,
    start: Date,
    end: Date,
  ): Promise<string | null> {
    // Prefer the last POS staff who created an order that day
    const lastStaffOrder = await this.prisma.order.findFirst({
      where: {
        storeId,
        createdAt: { gte: start, lte: end },
        staffId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { staffId: true },
    });
    if (lastStaffOrder?.staffId) return lastStaffOrder.staffId;

    // Fallback: any staff/admin assigned to store
    const storeUser = await this.prisma.userStore.findFirst({
      where: { storeId },
      select: { userId: true },
      orderBy: { assignedAt: 'asc' as Prisma.SortOrder },
    });
    if (storeUser?.userId) return storeUser.userId;

    // Last resort: any admin
    const anyAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return anyAdmin?.id ?? null;
  }
}

