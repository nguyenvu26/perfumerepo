import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStatus, InventoryLogType } from '@prisma/client';

@Injectable()
export class TransferOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { 
    skip?: number; 
    take?: number; 
    status?: TransferStatus;
    fromStoreId?: string;
    toStoreId?: string;
    userId?: string;
    userRole?: string;
  }) {
    const { skip = 0, take = 20, status, fromStoreId, toStoreId, userId, userRole } = params;
    const where: any = {};
    if (status) where.status = status;

    if (userRole?.toUpperCase() === 'STAFF') {
      // Staff can only see orders where they are related to the stores involved
      // We combine the base staff restriction with the optional filters
      const staffRestriction = {
        OR: [
          { fromStore: { users: { some: { userId } } } },
          { toStore: { users: { some: { userId } } } }
        ]
      };

      if (fromStoreId || toStoreId) {
        where.AND = [staffRestriction];
        if (fromStoreId) where.AND.push({ fromStoreId });
        if (toStoreId) where.AND.push({ toStoreId });
      } else {
        Object.assign(where, staffRestriction);
      }
    } else {
      // Admin can filter by any store
      if (fromStoreId) where.fromStoreId = fromStoreId;
      if (toStoreId) where.toStoreId = toStoreId;
    }

    const [items, total] = await Promise.all([
      this.prisma.transferOrder.findMany({
        where,
        skip,
        take,
        include: {
          fromStore: true,
          toStore: true,
          items: {
            include: {
              variant: {
                include: { product: true }
              },
              batches: {
                include: { batch: true }
              }
            } as any
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.transferOrder.count({ where })
    ]);

    return { items, total };
  }

  async create(dto: {
    fromStoreId: string;
    toStoreId: string;
    items: { 
      variantId: string; 
      quantity: number;
      selectedBatches: { batchId: string; quantity: number }[]
    }[];
    userId?: string;
  }) {
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('Kho xuất và kho nhập phải khác nhau.');
    }

    const code = `TO-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Transfer Order
      const transfer = await tx.transferOrder.create({
        data: {
          code,
          fromStoreId: dto.fromStoreId,
          toStoreId: dto.toStoreId,
          createdBy: dto.userId,
          items: {
            create: dto.items.map(item => ({
              variantId: item.variantId,
              quantity: item.quantity,
              batches: {
                create: item.selectedBatches.map(b => ({
                  batchId: b.batchId,
                  quantity: b.quantity
                }))
              }
            }))
          }
        },
        include: { fromStore: true, toStore: true }
      });

      // 2. Physically deduct stock from source warehouse and batches
      for (const item of dto.items) {
        const totalBatchQty = item.selectedBatches.reduce((s, b) => s + b.quantity, 0);
        if (totalBatchQty !== item.quantity) {
          throw new BadRequestException(`Tổng số lượng chọn theo lô (${totalBatchQty}) phải bằng tổng số lượng điều chuyển (${item.quantity}).`);
        }

        const inv = await tx.inventory.findUnique({
          where: { warehouseId_variantId: { warehouseId: dto.fromStoreId, variantId: item.variantId } }
        });

        if (!inv || inv.available < item.quantity) {
          throw new BadRequestException(`Không đủ tồn kho khả dụng cho sản phẩm ${item.variantId} tại kho nguồn.`);
        }

        // Deduct from aggregate inventory
        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: dto.fromStoreId, variantId: item.variantId } },
          data: {
            available: { decrement: item.quantity },
            onHand: { decrement: item.quantity }, // We deduct onHand too because it's "leaving" the warehouse
          }
        });

        // Deduct from specific batches
        for (const sb of item.selectedBatches) {
          const batch = await tx.inventoryBatch.findUnique({ where: { id: sb.batchId } });
          if (!batch || batch.currentQuantity < sb.quantity) {
             throw new BadRequestException(`Lô hàng ${sb.batchId} không đủ số lượng thực tế.`);
          }
          await tx.inventoryBatch.update({
            where: { id: sb.batchId },
            data: { currentQuantity: { decrement: sb.quantity } }
          });

          // Log detail for each batch
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              batchId: sb.batchId,
              storeId: dto.fromStoreId,
              staffId: dto.userId || '',
              type: InventoryLogType.TRANSFER_OUT,
              quantity: -sb.quantity,
              reason: `Đã xuất đi ${transfer.toStore.name} (Lô: ${batch.batchCode || 'N/A'}, Phiếu: ${code})`
            }
          });
        }
      }

      return transfer;
    });
  }

  async ship(id: string, userId?: string, userRole?: string) {
    const transfer = await this.prisma.transferOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy phiếu điều chuyển.');
    
    if (userRole === 'STAFF') {
      const access = await this.prisma.userStore.findUnique({
        where: { userId_storeId: { userId: userId!, storeId: transfer.fromStoreId } }
      });
      if (!access) throw new ForbiddenException('Bạn không có quyền xuất hàng từ kho này.');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể chuyển trạng thái khi phiếu đang ở mức PENDING.');
    }

    return this.prisma.transferOrder.update({
      where: { id },
      data: { status: TransferStatus.IN_TRANSIT }
    });
  }

  async receive(id: string, dto: { items: { variantId: string; actualQuantity: number; note?: string }[] }, userId?: string, userRole?: string) {
    const transfer = await this.prisma.transferOrder.findUnique({
      where: { id },
      include: { 
        items: {
          include: {
            batches: { include: { batch: true } }
          }
        },
        fromStore: true,
        toStore: true
      }
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy phiếu điều chuyển.');

    if (userRole?.toUpperCase() === 'STAFF') {
      const access = await this.prisma.userStore.findUnique({
        where: { userId_storeId: { userId: userId!, storeId: transfer.toStoreId } }
      });
      if (!access) throw new ForbiddenException('Bạn không có quyền nhận hàng tại kho này.');
    }

    if (transfer.status !== TransferStatus.IN_TRANSIT && transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Trạng thái không hợp lệ để nhận hàng.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create a map for quick lookup
      const actualQtyMap = new Map(dto.items.map(i => [i.variantId, i]));

      for (const item of (transfer as any).items) {
        const inspection = actualQtyMap.get(item.variantId);
        const actualQty = inspection ? inspection.actualQuantity : item.quantity;
        
        // Ratio to distribute actual received qty across the original batches if there's a discrepancy
        const ratio = actualQty / item.quantity;

        // 1. Increase at target: aggregately
        if (actualQty > 0) {
          await tx.inventory.upsert({
            where: { warehouseId_variantId: { warehouseId: transfer.toStoreId, variantId: item.variantId } },
            create: {
              warehouseId: transfer.toStoreId,
              variantId: item.variantId,
              onHand: actualQty,
              available: actualQty,
              reserved: 0
            },
            update: {
              onHand: { increment: actualQty },
              available: { increment: actualQty }
            }
          });

          // 2. Inheritance: Recreate/Update batches at target store
          const targetInv = await tx.inventory.findUnique({
            where: { warehouseId_variantId: { warehouseId: transfer.toStoreId, variantId: item.variantId } }
          });

          for (const itemBatch of (item as any).batches) {
            const receivedInBatch = Math.round(itemBatch.quantity * ratio);
            if (receivedInBatch <= 0) continue;

            const originalBatch = itemBatch.batch;
            
            // Try to find a matching batch in the destination store (same code and expiry)
            let targetBatch = await tx.inventoryBatch.findFirst({
              where: {
                inventoryId: (targetInv as any)!.id,
                batchCode: originalBatch.batchCode,
                expiryDate: originalBatch.expiryDate
              }
            });

            if (targetBatch) {
              await tx.inventoryBatch.update({
                where: { id: targetBatch.id },
                data: { currentQuantity: { increment: receivedInBatch } }
              });
            } else {
              targetBatch = await tx.inventoryBatch.create({
                data: {
                  inventoryId: (targetInv as any)!.id,
                  batchCode: originalBatch.batchCode,
                  mfgDate: originalBatch.mfgDate,
                  expiryDate: originalBatch.expiryDate,
                  purchasePrice: originalBatch.purchasePrice,
                  initialQuantity: receivedInBatch,
                  currentQuantity: receivedInBatch
                }
              });
            }

            // Log entry for each batch received
            await tx.inventoryLog.create({
              data: {
                variantId: item.variantId,
                batchId: targetBatch.id,
                storeId: transfer.toStoreId,
                staffId: userId || '',
                type: InventoryLogType.TRANSFER_IN,
                quantity: receivedInBatch,
                reason: `Nhận hàng từ ${(transfer as any).fromStore.name} (Lô: ${originalBatch.batchCode || 'N/A'}, Phiếu: ${transfer.code})`
              }
            });
          }
        }
      }

      return tx.transferOrder.update({
        where: { id },
        data: { 
          status: TransferStatus.COMPLETED,
          updatedAt: new Date()
        }
      });
    });
  }

  async cancel(id: string, userId?: string, userRole?: string) {
    const transfer = await this.prisma.transferOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy phiếu điều chuyển.');

    if (userRole === 'STAFF') {
      const access = await this.prisma.userStore.findUnique({
        where: { userId_storeId: { userId: userId!, storeId: transfer.fromStoreId } }
      });
      if (!access) throw new ForbiddenException('Bạn không có quyền hủy phiếu này.');
    }

    if (transfer.status === TransferStatus.COMPLETED || transfer.status === TransferStatus.CANCELLED) {
      throw new BadRequestException('Không thể hủy phiếu đã hoàn tất hoặc đã hủy trước đó.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Release allocated stock at source
      for (const item of (transfer as any).items) {
        // Return to aggregate inventory
        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: (transfer as any).fromStoreId, variantId: item.variantId } },
          data: {
            available: { increment: item.quantity },
            onHand: { increment: item.quantity }
          }
        });

        // Return to specific batches
        for (const itemBatch of (item as any).batches) {
           await tx.inventoryBatch.update({
             where: { id: itemBatch.batchId },
             data: { currentQuantity: { increment: itemBatch.quantity } }
           });
        }
      }

      return tx.transferOrder.update({
        where: { id },
        data: { status: TransferStatus.CANCELLED }
      });
    });
  }

  async getVariantBatches(storeId: string, variantId: string) {
    const inv = await this.prisma.inventory.findUnique({
      where: { warehouseId_variantId: { warehouseId: storeId, variantId } },
      include: {
        batches: {
          where: { currentQuantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });
    return inv?.batches || [];
  }
}
