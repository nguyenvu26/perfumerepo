// Shared types for returns - match backend
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

export interface ReturnItem {
  id: string;
  returnRequestId: string;
  variantId: string;
  quantity: number;
  qtyReceived?: number;
  reason?: string;
  condition?: string;
  sealIntact?: boolean;
  images: string[];
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  reason?: string;
  note?: string;
  totalAmount?: number;
  refundAmount?: number;
  items: ReturnItem[];
  // ... full model
}
