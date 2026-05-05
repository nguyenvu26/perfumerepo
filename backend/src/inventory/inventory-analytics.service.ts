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
          include: { product: true }
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
      onHand: item.onHand
    }));
  }

  /**
   * Báo cáo tổng giá trị tồn kho
   */
  async getInventoryValueReport() {
    const inventories = await this.prisma.inventory.findMany({
      include: {
        variant: true,
        warehouse: true
      }
    });

    const reportByWarehouse: Record<string, { name: string, totalValue: number, totalUnits: number }> = {};
    let globalValue = 0;
    let globalUnits = 0;

    inventories.forEach(inv => {
      const value = inv.onHand * (inv.variant.price || 0);
      globalValue += value;
      globalUnits += inv.onHand;

      if (!reportByWarehouse[inv.warehouseId]) {
        reportByWarehouse[inv.warehouseId] = {
          name: inv.warehouse.name,
          totalValue: 0,
          totalUnits: 0
        };
      }
      reportByWarehouse[inv.warehouseId].totalValue += value;
      reportByWarehouse[inv.warehouseId].totalUnits += inv.onHand;
    });

    return {
      global: {
        totalValue: globalValue,
        totalUnits: globalUnits
      },
      byWarehouse: Object.values(reportByWarehouse)
    };
  }
}
