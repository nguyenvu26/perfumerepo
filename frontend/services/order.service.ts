import api from "@/lib/axios";

export type Order = {
  id: string;
  code: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress?: string | null;
  phone?: string | null;
  userId?: string;
  user?: { id: string; name: string; email: string };
  items?: {
    id: number;
    productId: string;
    variantId: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    review?: { id: number } | null;
    product?: {
      id: string;
      name: string;
      slug: string;
      images?: { url: string }[];
    };
  }[];
  createdAt?: string;
  updatedAt?: string;
  returnRequests?: {
    id: string;
    status: string;
    items: {
      variantId: string;
      quantity: number;
    }[];
  }[];
};

export type RefundBankInfo = {
  id: number;
  createdAt: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  note?: string | null;
  submittedAt?: string;
};

export type OrderListResponse = {
  data: Order[];
  total: number;
  skip: number;
  take: number;
  pages: number;
};

export const orderService = {
  create(dto: {
    shippingAddress?: string;
    shippingProvinceId?: number;
    shippingDistrictId?: number;
    shippingWardCode?: string;
    shippingFee?: number;
    shippingServiceId?: number;
    recipientName?: string;
    phone?: string;
    promotionCode?: string;
    redeemPoints?: number;
    paymentMethod?: "COD" | "ONLINE";
  }) {
    return api.post<Order>("/orders", dto).then((r) => r.data);
  },
  listMy(params?: { skip?: number; take?: number }) {
    return api.get<OrderListResponse>("/orders", { params }).then((r) => r.data);
  },
  getById(id: string) {
    return api.get<Order>("/orders/" + id).then((r) => r.data);
  },
  // Admin endpoints
  listAll(skip: number = 0, take: number = 10) {
    return api
      .get<OrderListResponse>(`/orders/admin/all?skip=${skip}&take=${take}`)
      .then((r) => r.data);
  },
  getAdminById(id: string) {
    return api.get<Order>("/orders/admin/" + id).then((r) => r.data);
  },
  updateStatus(id: string, dto: { status?: string; paymentStatus?: string }) {
    return api
      .post<Order>(`/orders/admin/${id}/status`, dto)
      .then((r) => r.data);
  },
  cancel(id: string) {
    return api.post<Order>(`/orders/${id}/cancel`).then((r) => r.data);
  },
  submitRefundBankInfo(
    id: string,
    dto: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      note?: string;
    },
  ) {
    return api
      .post<{ success: boolean }>(`/orders/${id}/refund-bank-info`, dto)
      .then((r) => r.data);
  },
  getRefundBankInfo(id: string) {
    return api
      .get<RefundBankInfo | null>(`/orders/${id}/refund-bank-info`)
      .then((r) => r.data);
  },
  getRefundBankInfoAdmin(id: string) {
    return api
      .get<RefundBankInfo | null>(`/orders/admin/${id}/refund-bank-info`)
      .then((r) => r.data);
  },
};
