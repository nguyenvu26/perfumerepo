import api from '@/lib/axios';

export type StocktakeStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StocktakeItem {
  id: string;
  variantId: string;
  systemQty: number;
  countedQty: number | null;
  variance: number | null;
  reason: string | null;
  variant: {
    name: string;
    product: { name: string };
  };
}

export interface Stocktake {
  id: string;
  code: string;
  warehouseId: string;
  status: StocktakeStatus;
  createdAt: string;
  warehouse: { name: string };
  items: StocktakeItem[];
  _count?: { items: number };
}

export const inventoryAuditService = {
  list(params?: { warehouseId?: string; skip?: number; take?: number }) {
    return api.get<{ items: Stocktake[]; total: number }>('/admin/inventory/stocktakes', { params }).then(r => r.data);
  },

  getById(id: string) {
    return api.get<Stocktake>(`/admin/inventory/stocktakes/${id}`).then(r => r.data);
  },

  create(dto: { warehouseId: string; variantIds?: string[] }) {
    return api.post<Stocktake>('/admin/inventory/stocktakes', dto).then(r => r.data);
  },

  updateItem(id: string, itemId: string, dto: { countedQty: number; reason?: string }) {
    return api.patch<StocktakeItem>(`/admin/inventory/stocktakes/${id}/items/${itemId}`, dto).then(r => r.data);
  },

  complete(id: string) {
    return api.patch<Stocktake>(`/admin/inventory/stocktakes/${id}/complete`).then(r => r.data);
  },

  cancel(id: string) {
    return api.patch<Stocktake>(`/admin/inventory/stocktakes/${id}/cancel`).then(r => r.data);
  },

  // Analytics
  getLowStock(threshold?: number) {
    return api.get<any[]>('/admin/inventory/analytics/low-stock', { params: { threshold } }).then(r => r.data);
  },

  getInventoryValue() {
    return api.get<{ global: any, byWarehouse: any[] }>('/admin/inventory/analytics/value').then(r => r.data);
  }
};
