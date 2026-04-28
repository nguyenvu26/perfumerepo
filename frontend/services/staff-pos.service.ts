import api from '@/lib/axios';
import type { Product, ProductVariant } from './product.service';
import type { PayOSPaymentResponse } from './payment.service';

export type PosOrderItem = {
  id: number;
  orderId: string;
  variantId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  variant: ProductVariant & {
    product?: Pick<Product, 'id' | 'name' | 'images' | 'brand'>;
  };
};

export type PosOrder = {
  id: string;
  code: string;
  staffId?: string | null;
  storeId?: string | null;
  userId?: string | null;
  phone?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  channel: string;
  items: PosOrderItem[];
  store?: { id: string; name: string; code?: string | null } | null;
  user?: {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    loyaltyPoints?: number;
  } | null;
};

export const staffPosService = {
  searchProducts(q: string, storeId?: string) {
    return api
      .get<Product[]>('/staff/pos/products', { params: { q, storeId } })
      .then((r) => r.data);
  },

  /** Exact match on variant barcode (recommended after hardware scanner or camera). */
  searchProductsByBarcode(barcode: string, storeId?: string) {
    return api
      .get<Product[]>('/staff/pos/products', {
        params: { barcode: barcode.trim(), storeId },
      })
      .then((r) => r.data);
  },

  lookupLoyalty(phone: string): Promise<{
    registered: boolean;
    userId: string | null;
    fullName: string | null;
    phone: string;
    email: string | null;
    loyaltyPoints: number;
    transactionCount?: number;
  }> {
    return api
      .get('/staff/pos/loyalty', { params: { phone } })
      .then((r) => r.data);
  },

  createDraft(storeId?: string, customerPhone?: string): Promise<PosOrder> {
    return api
      .post<PosOrder>('/staff/pos/orders', {
        storeId: storeId ?? undefined,
        customerPhone: customerPhone ?? undefined,
      })
      .then((r) => r.data);
  },

  setCustomer(orderId: string, customerPhone: string): Promise<PosOrder> {
    return api
      .patch<PosOrder>(`/staff/pos/orders/${orderId}/customer`, {
        customerPhone,
      })
      .then((r) => r.data);
  },

  upsertItem(
    orderId: string,
    variantId: string,
    quantity: number,
  ): Promise<PosOrder> {
    return api
      .patch<PosOrder>(`/staff/pos/orders/${orderId}/items`, {
        variantId,
        quantity,
      })
      .then((r) => r.data);
  },

  payCash(orderId: string): Promise<PosOrder> {
    return api
      .post<PosOrder>(`/staff/pos/orders/${orderId}/pay/cash`)
      .then((r) => r.data);
  },

  createQrPayment(orderId: string): Promise<PayOSPaymentResponse> {
    return api
      .post<PayOSPaymentResponse>(`/staff/pos/orders/${orderId}/pay/qr`)
      .then((r) => r.data);
  },

  getOrder(orderId: string): Promise<PosOrder> {
    return api
      .get<PosOrder>(`/staff/pos/orders/${orderId}`)
      .then((r) => r.data);
  },

  aiConsult(body: {
    gender?: string;
    occasion?: string;
    budget?: number;
    notes?: string;
    storeId?: string;
  }): Promise<{
    recommendations: {
      productId: string;
      productName: string;
      variantId?: string;
      variantName?: string;
      price: number;
      stock: number;
      reason: string;
    }[];
    rawResponse: string;
  }> {
    return api
      .post('/staff/pos/ai-consult', body)
      .then((r) => r.data);
  },

  getCustomerPromotions(phone: string): Promise<any[]> {
    return api
      .get('/staff/pos/customer-promotions', { params: { phone } })
      .then((r) => r.data);
  },

  applyPromotion(orderId: string, code: string): Promise<PosOrder> {
    return api
      .post(`/staff/pos/orders/${orderId}/apply-promotion`, { code })
      .then((r) => r.data);
  },
};
