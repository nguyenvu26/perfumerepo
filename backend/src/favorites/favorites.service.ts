import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) { }

  async list(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            brand: true,
            scentFamily: true,
            notes: {
              include: { note: true },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
            },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      productId: row.productId,
      variantId: row.variantId,
      createdAt: row.createdAt,
      product: row.product,
      variant: row.variant,
    }));
  }

  async add(userId: string, productId: string, variantId?: string) {
    let resolvedVariantId: string | null = null;

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, productId, isActive: true },
        select: { id: true },
      });
      resolvedVariantId = variant?.id ?? null;
    }

    if (!resolvedVariantId) {
      const fallback = await this.prisma.productVariant.findFirst({
        where: { productId, isActive: true },
        orderBy: { price: 'asc' },
        select: { id: true },
      });
      resolvedVariantId = fallback?.id ?? null;
    }

    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, variantId: resolvedVariantId },
      update: { variantId: resolvedVariantId },
    });
    return { success: true };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, productId },
    });
    return { success: true };
  }

  async isFavorite(userId: string, productId: string) {
    const found = await this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { productId: true },
    });
    return { isFavorite: Boolean(found) };
  }
}
