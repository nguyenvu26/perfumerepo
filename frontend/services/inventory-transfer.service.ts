import api from '@/lib/axios';

export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface TransferOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    product: {
      name: string;
    };
  };
  batches: {
    id: string;
    quantity: number;
    batch: {
      batchCode: string | null;
      expiryDate: string | null;
    };
  }[];
}

export interface TransferOrder {
  id: string;
  code: string;
  fromStoreId: string;
  toStoreId: string;
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
  fromStore: { name: string };
  toStore: { name: string };
  items: TransferOrderItem[];
}

export const inventoryTransferService = {
  list(params?: { skip?: number; take?: number; status?: TransferStatus; toStoreId?: string; fromStoreId?: string }) {
    return api.get<{ items: TransferOrder[]; total: number }>('/admin/inventory/transfers', { params }).then(r => r.data);
  },

  create(dto: { 
    fromStoreId: string; 
    toStoreId: string; 
    items: { 
      variantId: string; 
      quantity: number;
      selectedBatches: { batchId: string; quantity: number }[]
    }[] 
  }) {
    return api.post<TransferOrder>('/admin/inventory/transfers', dto).then(r => r.data);
  },

  getVariantBatches(storeId: string, variantId: string) {
    return api.get<any[]>('/admin/inventory/transfers-utils/variant-batches', { params: { storeId, variantId } }).then(r => r.data);
  },

  ship(id: string) {
    return api.patch<TransferOrder>(`/admin/inventory/transfers/${id}/ship`).then(r => r.data);
  },

  receive(id: string, dto: { items: { variantId: string; actualQuantity: number; note?: string }[] }) {
    return api.patch<TransferOrder>(`/admin/inventory/transfers/${id}/receive`, dto).then(r => r.data);
  },

  cancel(id: string) {
    return api.patch<TransferOrder>(`/admin/inventory/transfers/${id}/cancel`).then(r => r.data);
  }
};
