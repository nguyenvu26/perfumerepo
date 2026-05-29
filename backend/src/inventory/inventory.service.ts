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
   * Sử dụng thuật toán FEFO (First-Expired-First-Out).
   * Returns deducted batches WITH their purchase prices for accurate cost tracking.
   */
  async commitStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    isPreAllocated: boolean = true,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const deductedBatches: { batchCode: string; quantity: number; purchasePrice: number }[] = [];

    // 1. Fetch Inventory & Batches
    const inventory = await client.inventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
      include: { 
        batches: { 
          where: { currentQuantity: { gt: 0 } }, 
          orderBy: [
            { expiryDate: 'asc' }, // FEFO: Earlier expiry first
            { createdAt: 'asc' }   // Fallback: Older batches first (FIFO)
          ] 
        } 
      }
    });

    if (!inventory) {
      throw new BadRequestException('Không tìm thấy bản ghi tồn kho.');
    }

    // 2. Perform Validation
    if (isPreAllocated) {
      if (inventory.onHand < quantity || inventory.reserved < quantity) {
        throw new BadRequestException(
          `Không đủ số lượng thực tế hoặc dự giữ để xuất kho. (onHand: ${inventory.onHand}, reserved: ${inventory.reserved}, yêu cầu: ${quantity})`,
        );
      }
    } else {
      if (inventory.onHand < quantity || inventory.available < quantity) {
        throw new BadRequestException(
          `Không đủ tồn kho thực tế hoặc khả dụng để xuất. (onHand: ${inventory.onHand}, available: ${inventory.available}, yêu cầu: ${quantity})`,
        );
      }
    }

    // 3. FEFO Logic: Deduct from batches, capturing purchase price
    let remainingToDeduct = quantity;
    for (const batch of inventory.batches) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(batch.currentQuantity, remainingToDeduct);
      
      await client.inventoryBatch.update({
        where: { id: batch.id },
        data: { currentQuantity: { decrement: deduct } }
      });
      
      deductedBatches.push({ 
        batchCode: batch.batchCode ?? 'N/A', 
        quantity: deduct,
        purchasePrice: batch.purchasePrice,
      });
      remainingToDeduct -= deduct;
    }

    // 4. Data Integrity Check & System Alert
    if (remainingToDeduct > 0) {
      console.error(`[FEFO Warning] Inconsistent stock for variant ${variantId} at store ${warehouseId}. Missing ${remainingToDeduct} items in specific batches.`);
    }

    // 5. Update Aggregate Inventory Table
    if (isPreAllocated) {
      await client.inventory.update({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        data: {
          onHand: { decrement: quantity },
          reserved: { decrement: quantity },
        },
      });
    } else {
      await client.inventory.update({
        where: { warehouseId_variantId: { warehouseId, variantId } },
        data: {
          onHand: { decrement: quantity },
          available: { decrement: quantity },
        },
      });
    }

    return { deductedBatches };
  }

  /**
   * Tính giá vốn bình quân gia quyền (Weighted Average Cost) từ các batch
   * đã xuất (FEFO) cho 1 lần bán cụ thể.
   */
  calculateBatchWeightedCost(
    deductedBatches: { quantity: number; purchasePrice: number }[],
  ): number {
    const totalQty = deductedBatches.reduce((s, b) => s + b.quantity, 0);
    if (totalQty === 0) return 0;
    const totalCost = deductedBatches.reduce(
      (s, b) => s + b.quantity * b.purchasePrice, 0,
    );
    return Math.round(totalCost / totalQty);
  }

  /**
   * Tính lại Giá Vốn Bình Quân Gia Quyền (WAC) cho 1 variant
   * dựa trên tất cả InventoryBatch còn tồn (currentQuantity > 0) trên toàn hệ thống.
   * Cập nhật ProductVariant.purchasePrice = WAC mới.
   */
  async recalculateWAC(
    variantId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    // Lấy tất cả batch còn hàng của variant này, bất kể warehouse nào
    const batches = await client.inventoryBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        inventory: { variantId },
      },
      select: {
        currentQuantity: true,
        purchasePrice: true,
      },
    });

    if (batches.length === 0) {
      // Không còn batch nào → giữ nguyên giá vốn hiện tại
      const variant = await client.productVariant.findUnique({
        where: { id: variantId },
        select: { purchasePrice: true },
      });
      return variant?.purchasePrice ?? 0;
    }

    const totalQty = batches.reduce((s, b) => s + b.currentQuantity, 0);
    const totalCost = batches.reduce(
      (s, b) => s + b.currentQuantity * b.purchasePrice, 0,
    );
    const wac = Math.round(totalCost / totalQty);

    // Cập nhật ProductVariant.purchasePrice
    await client.productVariant.update({
      where: { id: variantId },
      data: { purchasePrice: wac },
    });

    return wac;
  }

  /**
   * Xả tồn (release) khi đơn hàng bị hủy hoặc giao thất bại.
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
      const inventory = await client.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId, variantId } },
      });
      if (!inventory || inventory.reserved < quantity) {
        throw new BadRequestException(
          `Không thể xả tồn: số lượng dự giữ không hợp lý. (Reserved: ${inventory?.reserved || 0}, yêu cầu: ${quantity})`,
        );
      }
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

  /**
   * Xử lý hủy lô hàng (hết hạn, hỏng hóc, ...)
   * Zeroes out batch quantity and adjusts aggregate inventory.
   */
  async disposeBatch(batchId: string, tx?: Prisma.TransactionClient) {
    const execute = async (pTx: Prisma.TransactionClient) => {
      // 1. Fetch batch and inventory
      const batch = await pTx.inventoryBatch.findUnique({
        where: { id: batchId },
        include: { inventory: true },
      });

      if (!batch) {
        throw new BadRequestException('Không tìm thấy mã lô hàng.');
      }

      if (batch.currentQuantity <= 0) {
        throw new BadRequestException('Lô hàng này đã hết hoặc đã được xử lý.');
      }

      const quantityToDispose = batch.currentQuantity;

      // 2. Perform disposal
      // Zero out the specific batch
      await pTx.inventoryBatch.update({
        where: { id: batchId },
        data: { currentQuantity: 0 },
      });

      // Update aggregate inventory (onHand and available)
      await pTx.inventory.update({
        where: { id: batch.inventoryId },
        data: {
          onHand: { decrement: quantityToDispose },
          available: { decrement: quantityToDispose },
        },
      });

      // Create Adjustment Log
      await pTx.inventoryLog.create({
        data: {
          variantId: batch.inventory.variantId,
          storeId: batch.inventory.warehouseId,
          type: 'ADJUST',
          quantity: -quantityToDispose,
          purchasePrice: batch.purchasePrice,
          reason: `Xuất hủy hàng hết hạn (Mã lô: ${batch.batchCode || 'N/A'})`,
        },
      });

      return { success: true, disposedQuantity: quantityToDispose };
    };

    if (tx) {
      return execute(tx);
    } else {
      return this.prisma.$transaction(execute);
    }
  }

  /**
   * Cập nhật thông tin lô hàng (metadata)
   */
  async updateBatch(
    batchId: string,
    data: {
      batchCode?: string;
      mfgDate?: Date;
      expiryDate?: Date;
      purchasePrice?: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const batch = await client.inventoryBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new BadRequestException('Không tìm thấy mã lô hàng.');
    }

    // Nếu muốn cập nhật giá vốn, cần lưu ý nó ảnh hưởng đến WAC
    const shouldRecalculateWAC =
      data.purchasePrice !== undefined && data.purchasePrice !== batch.purchasePrice;

    const updated = await client.inventoryBatch.update({
      where: { id: batchId },
      data: {
        batchCode: data.batchCode,
        mfgDate: data.mfgDate,
        expiryDate: data.expiryDate,
        purchasePrice: data.purchasePrice,
      },
      include: { inventory: true },
    });

    if (shouldRecalculateWAC) {
      await this.recalculateWAC(updated.inventory.variantId, client);
    }

    return updated;
  }
}
