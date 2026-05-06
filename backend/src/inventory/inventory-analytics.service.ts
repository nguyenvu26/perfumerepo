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
   * Báo cáo tổng giá trị tồn kho (Dựa trên giá nhập gần nhất)
   */
  async getInventoryValueReport() {
    // 1. Lấy toàn bộ tồn kho vật lý
    const inventories = await this.prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: true }
        },
        warehouse: true
      }
    });

    // 2. Lấy giá nhập gần nhất cho từng variant từ PurchaseOrderItems
    // Chúng ta chỉ lấy từ các PO đã hoàn thành (COMPLETED)
    const latestPurchasePrices = await this.prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: { status: 'COMPLETED' }
      },
      orderBy: { purchaseOrder: { createdAt: 'desc' } },
      distinct: ['variantId'],
      select: {
        variantId: true,
        unitPrice: true
      }
    });

    const priceMap = new Map(latestPurchasePrices.map(p => [p.variantId, p.unitPrice]));

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
      // Ưu tiên 1: Giá nhập từ phiếu nhập gần nhất
      // Ưu tiên 2: Giá nhập mặc định được thiết lập thủ công trên variant
      const costPrice = priceMap.get(inv.variantId) || inv.variant.purchasePrice || 0;
      const sellingPrice = inv.variant.price || 0;
      
      const costValue = inv.onHand * costPrice;
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
