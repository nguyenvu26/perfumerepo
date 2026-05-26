import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Báo cáo hàng tồn kho thấp
   */
  async getLowStockReport(threshold: number = 10) {
    const lowStockItems = await this.prisma.inventory.findMany({
      where: {
        available: { lte: threshold },
      },
      include: {
        warehouse: true,
        variant: {
          include: { 
            product: {
              include: { images: true }
            }
          }
        }
      },
      orderBy: { available: 'asc' }
    });

    return lowStockItems.map(item => ({
      warehouse: item.warehouse.name,
      product: item.variant.product.name,
      variant: item.variant.name,
      sku: item.variant.sku,
      available: item.available,
      onHand: item.onHand,
      imageUrl: item.variant.product.images?.[0]?.url
    }));
  }

  /**
   * Báo cáo tổng giá trị tồn kho (Dựa trên giá trị thực tế của từng lô hàng - Batch Tracking)
   */
  async getInventoryValueReport() {
    // 1. Lấy toàn bộ tồn kho vật lý cùng với các lô hàng còn hàng
    const inventories = await this.prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: true }
        },
        warehouse: true,
        batches: {
          where: { currentQuantity: { gt: 0 } }
        }
      }
    });

    const reportByWarehouse: Record<string, { 
      name: string, 
      totalCostValue: number, 
      totalSellingValue: number,
      totalUnits: number 
    }> = {};

    let globalCostValue = 0;
    let globalSellingValue = 0;
    let globalUnits = 0;

    inventories.forEach(inv => {
      // Tính giá trị vốn dựa trên các lô hàng thực tế (Batch Valuation)
      const costValue = inv.batches.reduce((sum, batch) => {
        return sum + (batch.currentQuantity * batch.purchasePrice);
      }, 0);

      // Giá trị bán lẻ vẫn tính theo giá niêm yết hiện tại
      const sellingPrice = inv.variant.price || 0;
      const sellingValue = inv.onHand * sellingPrice;

      globalCostValue += costValue;
      globalSellingValue += sellingValue;
      globalUnits += inv.onHand;

      if (!reportByWarehouse[inv.warehouseId]) {
        reportByWarehouse[inv.warehouseId] = {
          name: inv.warehouse.name,
          totalCostValue: 0,
          totalSellingValue: 0,
          totalUnits: 0
        };
      }
      reportByWarehouse[inv.warehouseId].totalCostValue += costValue;
      reportByWarehouse[inv.warehouseId].totalSellingValue += sellingValue;
      reportByWarehouse[inv.warehouseId].totalUnits += inv.onHand;
    });

    return {
      global: {
        totalCostValue: globalCostValue,
        totalSellingValue: globalSellingValue,
        potentialProfit: globalSellingValue - globalCostValue,
        totalUnits: globalUnits,
        lastUpdated: new Date()
      },
      byWarehouse: Object.values(reportByWarehouse)
    };
  }
}
