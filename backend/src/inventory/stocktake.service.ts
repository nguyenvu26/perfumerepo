import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StocktakeStatus, InventoryLogType } from '@prisma/client';

@Injectable()
export class StocktakeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { warehouseId?: string; skip?: number; take?: number }) {
    const { warehouseId, skip = 0, take = 20 } = params;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const [items, total] = await Promise.all([
      this.prisma.stocktake.findMany({
        where,
        skip,
        take,
        include: {
          warehouse: true,
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.stocktake.count({ where })
    ]);

    return { items, total };
  }

  async getById(id: string) {
    const stocktake = await this.prisma.stocktake.findUnique({
      where: { id },
      include: {
        warehouse: true,
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    });
    if (!stocktake) throw new NotFoundException('Không tìm thấy phiếu kiểm kê.');
    return stocktake;
  }

  /**
   * Tạo phiếu kiểm kê mới (Snapshot tồn kho hiện tại)
   */
  async create(dto: { warehouseId: string; userId?: string; variantIds?: string[] }) {
    const code = `ST-${Date.now()}`;

    // Get current inventory snapshot for the warehouse
    const currentInventory = await this.prisma.inventory.findMany({
      where: { 
        warehouseId: dto.warehouseId,
        ...(dto.variantIds ? { variantId: { in: dto.variantIds } } : {})
      },
    });

    if (currentInventory.length === 0 && !dto.variantIds) {
      throw new BadRequestException('Kho này hiện không có sản phẩm nào để kiểm kê.');
    }

    return this.prisma.stocktake.create({
      data: {
        code,
        warehouseId: dto.warehouseId,
        status: StocktakeStatus.IN_PROGRESS,
        createdBy: dto.userId,
        items: {
          create: currentInventory.map(inv => ({
            variantId: inv.variantId,
            systemQty: inv.onHand, // Kiểm kê dựa trên tồn vật lý
          }))
        }
      },
      include: { items: true }
    });
  }

  /**
   * Cập nhật số lượng đếm được cho một item trong phiếu
   */
  async updateItem(id: string, itemId: string, countedQty: number, reason?: string) {
    const stocktake = await this.prisma.stocktake.findUnique({ where: { id } });
    if (!stocktake || stocktake.status !== StocktakeStatus.IN_PROGRESS) {
      throw new BadRequestException('Chỉ có thể cập nhật khi phiếu đang IN_PROGRESS.');
    }

    const item = await this.prisma.stocktakeItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Không tìm thấy dòng kiểm kê.');

    const variance = countedQty - item.systemQty;

    return this.prisma.stocktakeItem.update({
      where: { id: itemId },
      data: {
        countedQty,
        variance,
        reason
      }
    });
  }

  /**
   * Hoàn tất kiểm kê và điều chỉnh kho tự động
   */
  async complete(id: string, userId?: string) {
    const stocktake = await this.prisma.stocktake.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!stocktake || stocktake.status !== StocktakeStatus.IN_PROGRESS) {
      throw new BadRequestException('Trạng thái phiếu không hợp lệ để hoàn tất.');
    }

    // Check if all items are counted
    const uncounted = stocktake.items.filter(i => i.countedQty === null);
    if (uncounted.length > 0) {
      throw new BadRequestException(`Còn ${uncounted.length} sản phẩm chưa được đếm số lượng.`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of stocktake.items) {
        if (item.variance !== 0) {
          // Perform adjustment
          await tx.inventory.update({
            where: { warehouseId_variantId: { warehouseId: stocktake.warehouseId, variantId: item.variantId } },
            data: {
              onHand: item.countedQty!,
              available: { increment: item.variance! } // Tăng/giảm available tương ứng với chênh lệch
            }
          });

          // Log the adjustment
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              storeId: stocktake.warehouseId,
              staffId: userId || '',
              type: InventoryLogType.ADJUST,
              quantity: item.variance!,
              reason: `Điều chỉnh kiểm kê (Phiếu ${stocktake.code}): ${item.reason || 'Chênh lệch thực tế'}`
            }
          });
        }
      }

      return tx.stocktake.update({
        where: { id },
        data: { status: StocktakeStatus.COMPLETED }
      });
    });
  }

  async cancel(id: string) {
    return this.prisma.stocktake.update({
      where: { id },
      data: { status: StocktakeStatus.CANCELLED }
    });
  }
}
