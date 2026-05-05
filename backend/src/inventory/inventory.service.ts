import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạm giữ (allocate) stock khi có khách đặt Online nhưng chưa xuất kho vật lý.
   * Giảm available, tăng reserved.
   */
  async allocateStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const inventory = await client.inventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });

    if (!inventory || inventory.available < quantity) {
      throw new BadRequestException(
        `Không đủ hàng tồn khả dụng. (Yêu cầu: ${quantity}, Khả dụng: ${inventory?.available || 0})`,
      );
    }

    return client.inventory.update({
      where: { warehouseId_variantId: { warehouseId, variantId } },
      data: {
        available: { decrement: quantity },
        reserved: { increment: quantity },
      },
    });
  }

  /**
   * Chốt xuất kho khi đơn hàng được giao thành công hoặc bán POS tại quầy.
   * Nếu là Online (đã allocate): giảm onHand, giảm reserved.
   * Nếu là POS (bán trực tiếp): giảm cả onHand và available.
   */
  async commitStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    isPreAllocated: boolean = true,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    if (isPreAllocated) {
      // Đã đặt trước (Online) -> Trừ onHand và reserved
      return client.inventory.update({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        data: {
          onHand: { decrement: quantity },
          reserved: { decrement: quantity },
        },
      });
    } else {
      // Bán trực tiếp (POS) -> Trừ thẳng onHand và available
      const inventory = await client.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId, variantId } },
      });
      if (!inventory || inventory.available < quantity) {
        throw new BadRequestException('Không đủ tồn kho khả dụng để xuất.');
      }
      return client.inventory.update({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        data: {
          onHand: { decrement: quantity },
          available: { decrement: quantity },
        },
      });
    }
  }

  /**
   * Xả tồn (release) khi đơn hàng bị hủy hoặc giao thất bại.
   * Nếu đơn chưa giao (chỉ mới allocate): trả lại available, giảm reserved.
   * Nếu đơn đã giao nhưng trả hàng (nhập lại kho vật lý): tăng onHand, tăng available.
   */
  async releaseStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    isRestockPhysical: boolean = false,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    if (isRestockPhysical) {
      // Trả hàng vật lý vào kho
      return client.inventory.upsert({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        create: {
          warehouseId,
          variantId,
          onHand: quantity,
          available: quantity,
          reserved: 0,
        },
        update: {
          onHand: { increment: quantity },
          available: { increment: quantity },
        },
      });
    } else {
      // Hủy đơn (chưa giao đi)
      return client.inventory.update({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        data: {
          available: { increment: quantity },
          reserved: { decrement: quantity },
        },
      });
    }
  }

  /**
   * Trả về kho tổng trung tâm
   */
  async getCentralWarehouse() {
    return this.prisma.store.findFirst({
      where: { type: 'CENTRAL' },
    });
  }
}
