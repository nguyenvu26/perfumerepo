import api from '@/lib/axios';

export interface InventoryValueReport {
  global: {
    totalCostValue: number;
    totalSellingValue: number;
    potentialProfit: number;
    totalUnits: number;
    lastUpdated: string;
  };
  byWarehouse: {
    name: string;
    totalCostValue: number;
    totalSellingValue: number;
    totalUnits: number;
  }[];
}

export interface LowStockItem {
  warehouse: string;
  product: string;
  variant: string;
  sku: string;
  available: number;
  onHand: number;
}

export const inventoryAnalyticsService = {
  getInventoryValue() {
    return api.get<InventoryValueReport>('/admin/inventory/analytics/value').then(r => r.data);
  },

  getLowStock(threshold?: number) {
    return api.get<LowStockItem[]>('/admin/inventory/analytics/low-stock', {
      params: { threshold }
    }).then(r => r.data);
  }
};
