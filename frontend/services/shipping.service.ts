import api from '@/lib/axios';

export type Shipment = {
  id: string;
  orderId: string;
  provider: string;
  trackingCode: string | null;
  ghnOrderCode: string | null;
  fee: number | null;
  status: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  ghnDetail?: any;
};

export type ShipmentListResponse = {
  data: (Shipment & { order?: any })[];
  total: number;
  skip: number;
  take: number;
  pages: number;
};

export const shippingService = {
  getByOrderId(orderId: string): Promise<Shipment[]> {
    return api.get<Shipment[]>(`/shipping/orders/${orderId}`).then((r) => r.data);
  },
  createGhnShipment(orderId: string): Promise<{ shipmentId: string; orderCode: string; fee: number }> {
    return api.post<{ shipmentId: string; orderCode: string; fee: number }>(
      `/shipping/orders/${orderId}/create-ghn`,
    ).then((r) => r.data);
  },

  // Admin methods
  listAll(skip = 0, take = 10): Promise<ShipmentListResponse> {
    return api.get<ShipmentListResponse>(`/shipping/admin/all?skip=${skip}&take=${take}`).then((r) => r.data);
  },
  createGhnShipmentAdmin(orderId: string): Promise<{ shipmentId: string; orderCode: string; fee: number }> {
    return api.post<{ shipmentId: string; orderCode: string; fee: number }>(
      `/shipping/admin/${orderId}/create-ghn`,
    ).then((r) => r.data);
  },
  cancelShipment(orderId: string): Promise<Shipment> {
    return api.post<Shipment>(`/shipping/admin/${orderId}/cancel`).then((r) => r.data);
  },
  syncShipmentStatus(shipmentId: string): Promise<Shipment> {
    return api.post<Shipment>(`/shipping/admin/${shipmentId}/sync`).then((r) => r.data);
  },
  getAdminDetail(orderId: string): Promise<Shipment[]> {
    return api.get<Shipment[]>(`/shipping/admin/${orderId}/detail`).then((r) => r.data);
  },
};

