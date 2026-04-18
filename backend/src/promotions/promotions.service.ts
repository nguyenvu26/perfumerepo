import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, ValidatePromotionDto } from './dto/promotion.dto';
import { PromotionCode, UserPromotionStatus } from '@prisma/client';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(dto: CreatePromotionDto) {
    return this.prisma.promotionCode.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async findAll() {
    return this.prisma.promotionCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (userId) {
      // Get IDs of promotions owned by the user
      const ownedPromos = await this.prisma.userPromotion.findMany({
        where: { userId, status: UserPromotionStatus.UNUSED },
        select: { promotionId: true },
      });
      const ownedIds = ownedPromos.map((p) => p.promotionId);

      // Only show promotions that are active AND owned by the user
      where.id = { in: ownedIds };
    } else {
      // For anonymous, show nothing (or strictly public if you want them to see what they're missing)
      where.isPublic = true;
    }

    return this.prisma.promotionCode.findMany({
      where,
      orderBy: { endDate: 'asc' },
    });
  }

  async findPublic(userId: string) {
    const now = new Date();

    // Get IDs of promotions already claimed by this user
    const userPromos = await this.prisma.userPromotion.findMany({
      where: { userId },
      select: { promotionId: true },
    });
    const claimedIds = userPromos.map((p) => p.promotionId);

    return this.prisma.promotionCode.findMany({
      where: {
        isActive: true,
        isPublic: true,
        startDate: { lte: now },
        endDate: { gte: now },
        id: { notIn: claimedIds }, // Exclude claimed ones
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async findRedeemable(userId: string) {
    const now = new Date();

    // Get IDs of promotions already redeemed by this user
    const userPromos = await this.prisma.userPromotion.findMany({
      where: { userId },
      select: { promotionId: true },
    });
    const redeemedIds = userPromos.map((p) => p.promotionId);

    return this.prisma.promotionCode.findMany({
      where: {
        isActive: true,
        isPublic: false,
        pointsCost: { gt: 0 },
        startDate: { lte: now },
        endDate: { gte: now },
        id: { notIn: redeemedIds },
      },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async claim(userId: string, promoId: string) {
    const promo = await this.prisma.promotionCode.findUnique({
      where: { id: promoId },
    });

    if (!promo || !promo.isPublic || !promo.isActive) {
      throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }

    const existing = await this.prisma.userPromotion.findUnique({
      where: { userId_promotionId: { userId, promotionId: promoId } },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã lưu mã giảm giá này rồi');
    }

    return this.prisma.userPromotion.create({
      data: {
        userId,
        promotionId: promoId,
        status: UserPromotionStatus.UNUSED,
      },
    });
  }

  async redeem(userId: string, promoId: string) {
    const promo = await this.prisma.promotionCode.findUnique({
      where: { id: promoId },
    });

    if (!promo || promo.isPublic || promo.pointsCost <= 0 || !promo.isActive) {
      throw new BadRequestException('Mã giảm giá không hợp lệ');
    }

    const existing = await this.prisma.userPromotion.findUnique({
      where: { userId_promotionId: { userId, promotionId: promoId } },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã quy đổi mã giảm giá này rồi');
    }

    // Use a transaction to deduct points and create UserPromotion
    return this.prisma.$transaction(async (tx) => {
      // Deduct points
      await this.loyaltyService.redeemPoints(
        userId,
        promo.pointsCost,
        `VOUCHER_REDEEM_${promo.code}`, // Reason instead of orderId
        tx,
      );

      // Create UserPromotion
      return tx.userPromotion.create({
        data: {
          userId,
          promotionId: promoId,
          status: UserPromotionStatus.UNUSED,
        },
      });
    });
  }

  async getMyPromotions(userId: string) {
    return this.prisma.userPromotion.findMany({
      where: { userId, status: UserPromotionStatus.UNUSED },
      include: {
        promotion: true,
      },
      orderBy: { redeemedAt: 'desc' },
    });
  }

  async validate(dto: ValidatePromotionDto, userId?: string) {
    const promo = await this.prisma.promotionCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new NotFoundException('Promotion code not found or inactive');
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new BadRequestException(
        'Promotion code has expired or is not yet active',
      );
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promotion code usage limit reached');
    }

    // Check if user owns the promotion (if it's not a global/general public code)
    // Actually, for this system, we force users to "claim" or "redeem" first to pick from list
    if (userId) {
      const userPromo = await this.prisma.userPromotion.findFirst({
        where: {
          userId,
          promotionId: promo.id,
          status: UserPromotionStatus.UNUSED,
        },
      });

      if (!userPromo) {
        throw new BadRequestException('Bạn không sở hữu mã giảm giá này hoặc mã đã được sử dụng');
      }
    }

    if (promo.minOrderAmount !== null && dto.amount < promo.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${promo.minOrderAmount} required for this code`,
      );
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discount = Math.floor((dto.amount * promo.discountValue) / 100);
      if (promo.maxDiscount !== null && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = promo.discountValue;
    }

    // Ensure discount doesn't exceed amount
    discount = Math.min(discount, dto.amount);

    return {
      promoId: promo.id,
      code: promo.code,
      discountAmount: discount,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    };
  }

  async findOne(id: string) {
    const promo = await this.prisma.promotionCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async remove(id: string) {
    return this.prisma.promotionCode.delete({ where: { id } });
  }
}
