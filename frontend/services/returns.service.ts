import api from "@/lib/axios";

export type ReturnStatus =
  | "REQUESTED"
  | "AWAITING_CUSTOMER"
  | "REVIEWING"
  | "APPROVED"
  | "RETURNING"
  | "RECEIVED"
  | "REFUNDING"
  | "REFUND_FAILED"
  | "COMPLETED"
  | "REJECTED"
  | "REJECTED_AFTER_RETURN"
  | "CANCELLED";

export type ReturnItemDto = {
  variantId: string;
  quantity: number;
  reason?: string;
  images?: string[];
};

export type CreateReturnDto = {
  orderId: string;
  items: ReturnItemDto[];
  reason?: string;
  origin?: "ONLINE" | "POS";
};

export type CreateReturnShipmentDto = {
  courier?: string;
  trackingNumber: string;
};

export type ReceiveItemDto = {
  variantId: string;
  qtyReceived: number;
  condition?: string;
  sealIntact?: boolean;
};

export type TriggerRefundDto = {
  method: "manual" | "cash" | "bank_transfer" | "gateway";
  transactionId?: string;
  note?: string;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason?: string;
  totalAmount?: number;
  refundAmount?: number;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    reason?: string;
    images: string[];
  }[];
  // ... other fields
};

export const returnsService = {
  listMyReturns() {
    return api.get<ReturnRequest[]>("/returns").then((r) => r.data);
  },

  getReturn(id: string) {
    return api.get<ReturnRequest>(`/returns/${id}`).then((r) => r.data);
  },

  createReturn(dto: CreateReturnDto, idempotencyKey?: string) {
    return api
      .post<ReturnRequest>("/returns", dto, {
        headers: { "Idempotency-Key": idempotencyKey || "" },
      })
      .then((r) => r.data);
  },

  addShipment(id: string, dto: CreateReturnShipmentDto) {
    return api.post(`/returns/${id}/shipment`, dto).then((r) => r.data);
  },

  cancelReturn(id: string, reason?: string) {
    return api.patch(`/returns/${id}/cancel`, { reason }).then((r) => r.data);
  },

  // Admin endpoints (use with admin auth)
  listAll(skip = 0, take = 20, status?: string, orderId?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      take: take.toString(),
    });
    if (status) params.append("status", status);
    if (orderId) params.append("orderId", orderId);
    return api.get(`/returns/admin/all?${params}`).then((r) => r.data);
  },

  reviewReturn(
    id: string,
    dto: { action: "approve" | "reject"; note?: string },
  ) {
    return api.patch(`/returns/admin/${id}/review`, dto).then((r) => r.data);
  },

  receiveReturn(
    id: string,
    dto: { items: ReceiveItemDto[]; note?: string; receivedLocation?: string },
  ) {
    return api.patch(`/returns/admin/${id}/receive`, dto).then((r) => r.data);
  },

  triggerRefund(id: string, dto: TriggerRefundDto, idempotencyKey?: string) {
    return api
      .post(`/returns/admin/${id}/refund`, dto, {
        headers: { "Idempotency-Key": idempotencyKey || "" },
      })
      .then((r) => r.data);
  },

  getAudits(id: string) {
    return api.get(`/returns/admin/${id}/audits`).then((r) => r.data);
  },

  getRefunds(id: string) {
    return api.get(`/returns/admin/${id}/refunds`).then((r) => r.data);
  },

  posCreateReturn(dto: CreateReturnDto, idempotencyKey?: string) {
    return api
      .post<ReturnRequest>('/returns/admin/pos/create', dto, {
        headers: { "Idempotency-Key": idempotencyKey || "" },
      })
      .then((r) => r.data);
  },
};
