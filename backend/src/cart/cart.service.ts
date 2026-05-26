import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              brand: true,
              images: {
                orderBy: { order: 'asc' as const },
              },
            },
          },
          inventories: {
            where: { warehouse: { type: 'CENTRAL' as const } },
            select: { available: true },
          },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: CART_INCLUDE,
      });
    }
    return cart;
  }

  /** Tổng tồn kho khả dụng của một variant (Chỉ tính kho TRUNG TÂM cho bán Online) */
  private async getTotalAvailable(variantId: string): Promise<number> {
    const result = await this.prisma.inventory.aggregate({
      where: {
        variantId,
        warehouse: {
          type: 'CENTRAL',
        },
      },
      _sum: { available: true },
    });
    return result._sum.available ?? 0;
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getCart(userId);

    // Kiểm tra variant tồn tại
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new BadRequestException('Sản phẩm không tồn tại.');
    }

    // Số lượng đang có trong giỏ
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    const currentInCart = existing ? existing.quantity : 0;
    const newTotal = currentInCart + dto.quantity;

    // Kiểm tra tồn kho từ bảng Inventory (Chỉ tính kho khả dụng bán hàng)
    const totalAvailable = await this.getTotalAvailable(dto.variantId);

    // FIX: Luôn kiểm tra tồn kho, kể cả khi bằng 0
    if (newTotal > totalAvailable) {
      const remaining = totalAvailable - currentInCart;
      if (remaining <= 0) {
        throw new BadRequestException(
          `Sản phẩm này hiện đã hết hàng hoặc bạn đã thêm tối đa số lượng có sẵn (${totalAvailable}) vào giỏ hàng.`,
        );
      }
      throw new BadRequestException(
        `Chúng tôi chỉ còn ${totalAvailable} sản phẩm trong kho. Bạn đã có ${currentInCart} trong giỏ hàng, chỉ có thể thêm tối đa ${remaining} sản phẩm nữa.`,
      );
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newTotal },
      });
      return this.getCart(userId);
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

    // Lấy cart item để biết variantId
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (cartItem) {
      const totalAvailable = await this.getTotalAvailable(cartItem.variantId);
      // FIX: Luôn kiểm tra tồn kho
      if (dto.quantity > totalAvailable) {
        throw new BadRequestException(
          `Chúng tôi chỉ còn ${totalAvailable} sản phẩm trong kho.`,
        );
      }
    }

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
