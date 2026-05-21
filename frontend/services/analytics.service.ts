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
  expiryDate: string;
  daysUntilExpiry: number;
  status: "CRITICAL" | "WARNING" | "HEALTHY";
}

export const analyticsService = {
  getExpiryAlerts(storeId?: string): Promise<ExpiryAlert[]> {
    return api
      .get<ExpiryAlert[]>("/analytics/expiry-alerts", {
        params: storeId ? { storeId } : undefined,
      })
      .then((r) => r.data);
  },
};
