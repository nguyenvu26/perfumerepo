import api from "@/lib/axios";

export type Store = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  isActive?: boolean;
};

export type StoreWithDetails = Store & {
  users?: {
    user: { id: string; email: string; fullName: string | null; role: string };
  }[];
  _count?: { storeStocks: number; orders: number };
};

export type StockOverviewStore = {
  store: { id: string; name: string; code: string | null };
  variants: {
    variantId: string;
    variantName: string;
    productName: string;
    brandName: string | null;
    imageUrl: string | null;
    quantity: number;
    updatedAt: string;
  }[];
  totalUnits: number;
};

export type StockOverview = {
  stores: StockOverviewStore[];
  summary: { totalStores: number; totalUnits: number };
};

export const storesService = {
  getMyStores(): Promise<Store[]> {
    return api.get<Store[]>("/stores/my-stores").then((r) => r.data);
  },

  list(): Promise<StoreWithDetails[]> {
    return api.get<StoreWithDetails[]>("/stores").then((r) => r.data);
  },

  getById(id: string): Promise<StoreWithDetails> {
    return api.get<StoreWithDetails>(`/stores/${id}`).then((r) => r.data);
  },

  create(data: {
    name: string;
    code?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<Store> {
    return api.post<Store>("/stores", data).then((r) => r.data);
  },

  update(id: string, data: Partial<Store>): Promise<Store> {
    return api.patch<Store>(`/stores/${id}`, data).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/stores/${id}`).then(() => undefined);
  },

  assignStaff(storeId: string, userId: string): Promise<StoreWithDetails> {
    return api
      .post<StoreWithDetails>(`/stores/${storeId}/staff/${userId}`)
      .then((r) => r.data);
  },

  unassignStaff(storeId: string, userId: string): Promise<StoreWithDetails> {
    return api
      .delete<StoreWithDetails>(`/stores/${storeId}/staff/${userId}`)
      .then((r) => r.data);
  },

  getStockOverview(storeId?: string): Promise<StockOverview> {
    return api
      .get<StockOverview>("/stores/stock/overview", {
        params: storeId ? { storeId } : undefined,
      })
      .then((r) => r.data);
  },

  adminImportStock(data: {
    storeId: string;
    variantId: string;
    quantity: number;
    reason?: string;
  }): Promise<StockOverview> {
    return api
      .post<StockOverview>("/stores/stock/import", data)
      .then((r) => r.data);
  },

  batchImportStock(data: {
    storeId: string;
    reason?: string;
    items: { variantId: string; quantity: number | string }[];
  }): Promise<StockOverview> {
    return api
      .post<StockOverview>("/stores/stock/batch-import", data)
      .then((r) => r.data);
  },

  transferStock(data: {
    fromStoreId: string;
    toStoreId: string;
    variantId: string;
    quantity: number;
    reason?: string;
  }): Promise<StockOverview> {
    return api
      .post<StockOverview>("/stores/stock/transfer", data)
      .then((r) => r.data);
  },

  batchTransferStock(data: {
    fromStoreId: string;
    toStoreId: string;
    reason?: string;
    items: { variantId: string; quantity: number | string }[];
  }): Promise<StockOverview> {
    return api
      .post<StockOverview>("/stores/stock/batch-transfer", data)
      .then((r) => r.data);
  },
};
