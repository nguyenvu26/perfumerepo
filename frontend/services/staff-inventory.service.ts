import api from "@/lib/axios";

export type StaffInventoryVariant = {
  id: string;
  name: string;
  brand: string | null;
  variantName: string;
  stock: number;
  updatedAt: string;
};

export type StaffInventoryOverview = {
  storeId?: string;
  stats: {
    totalUnits: number;
    lowStockCount: number;
    latestImportAt: string | null;
  };
  variants: StaffInventoryVariant[];
};

export type InventoryRequest = {
  id: number;
  type: "IMPORT" | "ADJUST";
  quantity: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  store: { id: string; name: string; code: string | null };
  product: string | null;
  brand: string | null;
  variantId: string;
  variantName: string | null;
  imageUrl: string | null;
  staff: { id: string; name: string | null; email: string } | null;
  reviewer: { id: string; name: string | null; email: string } | null;
};

export type SystemVariant = {
  variantId: string;
  productName: string;
  variantName: string;
  brand: string | null;
  sku: string | null;
  price: number;
  imageUrl: string | null;
};

export type StaffInventoryLog = {
  id: number;
  variantId: string;
  staffId?: string | null;
  type: "IMPORT" | "ADJUST" | "SALE_POS";
  quantity: number;
  reason?: string | null;
  createdAt: string;
  variant: {
    id: string;
    name: string;
    productId: string;
    product: {
      id: string;
      name: string;
    };
  };
  staff?: {
    id: string;
    fullName?: string | null;
    email: string;
  } | null;
};

export const staffInventoryService = {
  getOverview(storeId: string): Promise<StaffInventoryOverview> {
    return api
      .get<StaffInventoryOverview>("/staff/inventory", { params: { storeId } })
      .then((r) => r.data);
  },
  importStock(
    storeId: string,
    variantId: string,
    quantity: number,
    reason?: string,
  ): Promise<InventoryRequest> {
    return api
      .post<InventoryRequest>("/staff/inventory/import", {
        storeId,
        variantId,
        quantity,
        reason,
      })
      .then((r) => r.data);
  },
  adjustStock(
    storeId: string,
    variantId: string,
    delta: number,
    reason: string,
  ): Promise<InventoryRequest> {
    return api
      .post<InventoryRequest>("/staff/inventory/adjust", {
        storeId,
        variantId,
        delta,
        reason,
      })
      .then((r) => r.data);
  },
  getMyRequests(storeId?: string): Promise<InventoryRequest[]> {
    return api
      .get<
        InventoryRequest[]
      >("/staff/inventory/requests", { params: storeId ? { storeId } : undefined })
      .then((r) => r.data);
  },
  getLogs(params?: {
    storeId?: string;
    variantId?: string;
    from?: string;
    to?: string;
  }): Promise<StaffInventoryLog[]> {
    return api
      .get<StaffInventoryLog[]>("/staff/inventory/logs", { params })
      .then((r) => r.data);
  },
  searchAllProducts(q?: string): Promise<SystemVariant[]> {
    return api
      .get<SystemVariant[]>("/staff/inventory/search-products", {
        params: q ? { q } : undefined,
      })
      .then((r) => r.data);
  },
};

export const adminInventoryRequestService = {
  list(params?: {
    status?: string;
    storeId?: string;
    staffId?: string;
  }): Promise<InventoryRequest[]> {
    return api
      .get<InventoryRequest[]>("/admin/inventory/requests", { params })
      .then((r) => r.data);
  },
  approve(
    id: number,
    note?: string,
  ): Promise<{ success: boolean; message: string }> {
    return api
      .post<{
        success: boolean;
        message: string;
      }>(`/admin/inventory/requests/${id}/approve`, { note })
      .then((r) => r.data);
  },
  reject(
    id: number,
    note: string,
  ): Promise<{ success: boolean; message: string }> {
    return api
      .post<{
        success: boolean;
        message: string;
      }>(`/admin/inventory/requests/${id}/reject`, { note })
      .then((r) => r.data);
  },
};
