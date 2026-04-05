import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, ValidatePromotionDto } from './dto/promotion.dto';
import { PromotionCode } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findActive() {
    const now = new Date();
    return this.prisma.promotionCode.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
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
