import api from "@/lib/axios";

export interface ExpiryAlert {
  batchId: string;
  batchCode: string;
  variantId: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  warehouseName: string;
  currentQuantity: number;
  initialQuantity: number;
  purchasePrice: number;
  mfgDate: string | null;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "CRITICAL" | "WARNING" | "HEALTHY" | "SOLD_OUT";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const analyticsService = {
  getExpiryAlerts(params: {
    storeId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<ExpiryAlert>> {
    return api
      .get<PaginatedResponse<ExpiryAlert>>("/analytics/expiry-alerts", {
        params,
      })
      .then((r) => r.data);
  },

  disposeBatch(batchId: string): Promise<{ success: boolean; disposedQuantity: number }> {
    return api
      .post(`/analytics/batch/${batchId}/dispose`)
      .then((r) => r.data);
  },

  updateBatch(
    batchId: string,
    data: { batchCode?: string; mfgDate?: string; expiryDate?: string; purchasePrice?: number }
  ): Promise<any> {
    return api
      .patch(`/analytics/batch/${batchId}`, data)
      .then((r) => r.data);
  },
};
