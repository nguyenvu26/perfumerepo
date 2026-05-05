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
              }
            }
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
    items: { variantId: string; quantity: number }[];
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
              quantity: item.quantity
            }))
          }
        }
      });

      // 2. Lock (allocate) stock at source warehouse
      for (const item of dto.items) {
        const inv = await tx.inventory.findUnique({
          where: { warehouseId_variantId: { warehouseId: dto.fromStoreId, variantId: item.variantId } }
        });

        if (!inv || inv.available < item.quantity) {
          throw new BadRequestException(`Không đủ tồn kho khả dụng cho sản phẩm ${item.variantId} tại kho nguồn.`);
        }

        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: dto.fromStoreId, variantId: item.variantId } },
          data: {
            available: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          }
        });

        // Log the allocation
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            storeId: dto.fromStoreId,
            staffId: dto.userId || '',
            type: InventoryLogType.TRANSFER_OUT,
            quantity: item.quantity,
            reason: `Tạm giữ hàng cho phiếu điều chuyển ${code}`
          }
        });
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
      include: { items: true }
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

      for (const item of transfer.items) {
        const inspection = actualQtyMap.get(item.variantId);
        const actualQty = inspection ? inspection.actualQuantity : item.quantity;
        const diff = item.quantity - actualQty; // Missing or damaged

        // 1. Finalize source warehouse: 
        // We already reserved item.quantity. 
        // If we only received 'actualQty', the 'diff' must be removed from onHand too (it's lost).
        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: transfer.fromStoreId, variantId: item.variantId } },
          data: {
            onHand: { decrement: item.quantity },
            reserved: { decrement: item.quantity }
          }
        });

        // 2. Increase at target: only by actualQty
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
        }

        // 3. Log arrival with notes if any
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            storeId: transfer.toStoreId,
            staffId: userId || '',
            type: InventoryLogType.TRANSFER_IN,
            quantity: actualQty,
            reason: `Nhận hàng từ TO ${transfer.code}${diff > 0 ? ` (Hao hụt: ${diff})` : ''}${inspection?.note ? ` - Lưu ý: ${inspection.note}` : ''}`
          }
        });

        // 4. Update the item in the transfer order to record what was actually received
        // Note: You might want to add 'actualQuantity' field to TransferOrderItem in schema later.
        // For now, we rely on InventoryLogs for the audit trail of the discrepancy.
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
      for (const item of transfer.items) {
        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: transfer.fromStoreId, variantId: item.variantId } },
          data: {
            available: { increment: item.quantity },
            reserved: { decrement: item.quantity }
          }
        });
      }

      return tx.transferOrder.update({
        where: { id },
        data: { status: TransferStatus.CANCELLED }
      });
    });
  }
}
