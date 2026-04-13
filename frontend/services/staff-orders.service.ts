import api from "@/lib/axios";

export type ProductImage = {
  id: number;
  url: string;
};

export type StaffPosOrderItem = {
  id: number;
  orderId: string;
  variantId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    images?: ProductImage[];
  } | null;
  variant?: {
    id: string;
    name: string;
    product?: { id: string; name: string; images?: ProductImage[] } | null;
  };
};

export type StaffPosOrder = {
  id: string;
  code: string;
  staffId?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  refundAmount: number;
  status: string;
  paymentStatus: string;
  channel: string;
  createdAt: string;
  items: StaffPosOrderItem[];
  staff?: { id: string; fullName?: string | null; email: string } | null;
  user?: {
    id: string;
    fullName?: string | null;
    email: string;
    phone?: string | null;
  } | null;
  store?: { id: string; name: string; code?: string | null } | null;
  payments?: {
    id: string;
    provider: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  statusHistory?: {
    id: number;
    status: string;
    note?: string | null;
    createdAt: string;
  }[];
};

export type StaffPosOrderListRes = {
  data: StaffPosOrder[];
  total: number;
  skip: number;
  take: number;
  pages: number;
};

export const staffOrdersService = {
  list(params?: {
    skip?: number;
    take?: number;
    search?: string;
    date?: string;
    status?: string;
  }): Promise<StaffPosOrderListRes> {
    return api
      .get<StaffPosOrderListRes>("/staff/orders", { params })
      .then((r) => {
        const res = r.data;
        res.data = res.data.map((order) => {
          order.items = order.items.map((i) => {
            const product =
              i.product ??
              i.variant?.product ??
              (i.variant
                ? {
                    id: i.variant.id || i.variantId,
                    name: i.variant.name || "Không rõ",
                  }
                : null);
            return { ...i, product };
          });
          return order;
        });
        return res;
      });
  },

  getByCode(code: string): Promise<StaffPosOrder> {
    return api
      .get<StaffPosOrder>(`/staff/orders/by-code/${encodeURIComponent(code)}`)
      .then((r) => {
        const order = r.data;
        order.items = order.items.map((i) => {
          const product =
            i.product ??
            i.variant?.product ??
            (i.variant
              ? {
                  id: i.variant.id || i.variantId,
                  name: i.variant.name || "Không rõ",
                }
              : null);
          return { ...i, product };
        });
        return order;
      });
  },

  getDetail(orderId: string): Promise<StaffPosOrder> {
    return api.get<StaffPosOrder>(`/staff/orders/${orderId}`).then((r) => {
      const order = r.data;
      order.items = order.items.map((i) => {
        const product =
          i.product ??
          i.variant?.product ??
          (i.variant
            ? {
                id: i.variant.id || i.variantId,
                name: i.variant.name || "Không rõ",
              }
            : null);
        return { ...i, product };
      });
      return order;
    });
  },
};
