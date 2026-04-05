import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: {
                        orderBy: { order: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getCart(userId);

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    if (existing) {
      return this.updateItemQuantity(userId, existing.id, {
        quantity: existing.quantity + dto.quantity,
      });
    }

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
    });

    return this.getCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.getCart(userId);

    await this.prisma.cartItem.updateMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: number) {
    const cart = await this.getCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    return this.getCart(userId);
  }
}
