import api from '@/lib/axios';

export type Payment = {
  id: string;
  orderId: string;
  provider: 'PAYOS' | 'VIETQR' | 'VNPAY' | 'MOMO' | 'COD';
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string | null;
  providerRawData?: string | null;
};

export type PayOSPaymentResponse = {
  paymentId: string;
  checkoutUrl: string;
  qrCode: string; // This is the base64 encoded QR code image
  accountName: string;
  accountNumber: string;
  amount: number;
  description: string;
  orderCode: number;
};

export const paymentService = {
  createPayment(orderId: string) {
    return api.post<PayOSPaymentResponse>('/payments/create-payment', { orderId }).then((r) => r.data);
  },

  getPayment(paymentId: string) {
    return api.get<Payment>('/payments/' + paymentId).then((r) => r.data);
  },

  getPaymentByOrder(orderId: string) {
    return api.get<Payment | null>('/payments/order/' + orderId).then((r) => r.data);
  },
};
