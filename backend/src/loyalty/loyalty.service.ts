import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LoyaltyService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Calculation constants
  private readonly EARN_RATE = 10000; // 10,000đ = 1 point
  private readonly REDEEM_RATE = 1000; // 1 point = 1,000đ

  async getLoyaltyInfo(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      const history = await this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return {
        points: user?.loyaltyPoints || 0,
        history,
      };
    } catch (error) {
      console.error('Error in getLoyaltyInfo:', error);
      throw error;
    }
  }

  async validateRedemption(userId: string, points: number) {
    if (points <= 0) {
      throw new BadRequestException('Số điểm đổi phải lớn hơn 0');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    if (!user || user.loyaltyPoints < points) {
      throw new BadRequestException('Không đủ điểm thưởng để đổi');
    }

    return {
      discountAmount: points * this.REDEEM_RATE,
    };
  }

  /**
   * Actual points deduction, should be called within the order transaction
   */
  async redeemPoints(userId: string, points: number, orderId: string, tx: any) {
    const discountAmount = points * this.REDEEM_RATE;

    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: points } },
    });

    await tx.loyaltyTransaction.create({
      data: {
        userId,
        orderId,
        points: -points,
        reason: `REDEEMED_FOR_ORDER_${orderId}`,
      },
    });

    return { discountAmount };
  }

  async earnPoints(userId: string, amount: number, orderId: string) {
    const points = Math.floor(amount / this.EARN_RATE);
    if (points <= 0) return;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: points } },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          points,
          reason: `EARNED_FROM_ORDER_${orderId}`,
        },
      }),
    ]);

    // Notify user about earned points
    this.notificationsService
      .create({
        userId,
        type: 'LOYALTY',
        title: 'Nhận điểm thưởng',
        content: `Bạn nhận được ${points} điểm thưởng từ đơn hàng.`,
        data: { points, orderId },
      })
      .catch(() => {});
  }

}
