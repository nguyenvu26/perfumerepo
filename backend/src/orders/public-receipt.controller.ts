import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public controller — NO authentication required.
 * Serves receipt data by order code so customers can view receipts
 * by scanning QR codes printed at the POS.
 */
@Controller('public/receipt')
export class PublicReceiptController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async getReceiptByCode(@Param('code') code: string) {
    const order = await this.prisma.order.findFirst({
      where: { code },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { order: 'asc' }, take: 1 },
                    brand: true,
                  },
                },
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
          },
        },
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    // Return sanitised receipt data (no sensitive info)
    return {
      code: order.code,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      channel: order.channel,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      store: order.store,
      customer: order.user
        ? {
            fullName: order.user.fullName,
            phone: order.user.phone
              ? order.user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
              : null,
          }
        : order.phone
          ? {
              fullName: null,
              phone: order.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
            }
          : null,
      items: order.items.map((item) => ({
        productName: item.variant.product?.name ?? 'Sản phẩm',
        brandName: item.variant.product?.brand?.name ?? null,
        variantName: item.variant.name,
        imageUrl: item.variant.product?.images?.[0]?.url ?? null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
    };
  }
}
