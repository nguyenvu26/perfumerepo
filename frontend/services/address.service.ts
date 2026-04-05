import api from '@/lib/axios';

export type UserAddress = {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailAddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressDto = {
  recipientName: string;
  phone: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailAddress: string;
  isDefault?: boolean;
};

export const addressService = {
  getAll() {
    return api.get<UserAddress[]>('/addresses').then((r) => r.data);
  },

  getById(id: string) {
    return api.get<UserAddress>(`/addresses/${id}`).then((r) => r.data);
  },

  create(dto: CreateAddressDto) {
    return api.post<UserAddress>('/addresses', dto).then((r) => r.data);
  },

  update(id: string, dto: Partial<CreateAddressDto>) {
    return api.patch<UserAddress>(`/addresses/${id}`, dto).then((r) => r.data);
  },

  delete(id: string) {
    return api.delete<{ success: boolean }>(`/addresses/${id}`).then((r) => r.data);
  },

  setDefault(id: string) {
    return api.patch<UserAddress>(`/addresses/${id}/default`).then((r) => r.data);
  },
};
