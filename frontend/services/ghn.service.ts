import api from '@/lib/axios';

export type GHNProvince = { ProvinceID: number; ProvinceName: string; Code: string };
export type GHNDistrict = { DistrictID: number; ProvinceID: number; DistrictName: string; Code: string };
export type GHNWard = { WardCode: string; DistrictID: number; WardName: string };
export type GHNService = { service_id: number; short_name: string; service_type_id: number };
export type GHNFeeResponse = { total: number; service_fee: number;[key: string]: number };

export const ghnService = {
    getProvinces(): Promise<GHNProvince[]> {
        return api.get<GHNProvince[]>('/ghn/provinces').then((r) => r.data);
    },
    getDistricts(provinceId: number): Promise<GHNDistrict[]> {
        return api.get<GHNDistrict[]>('/ghn/districts', { params: { provinceId } }).then((r) => r.data);
    },
    getWards(districtId: number): Promise<GHNWard[]> {
        return api.get<GHNWard[]>('/ghn/wards', { params: { districtId } }).then((r) => r.data);
    },
    getServices(toDistrictId: number): Promise<GHNService[]> {
        return api.get<GHNService[]>('/ghn/services', { params: { toDistrictId } }).then((r) => r.data);
    },
    calculateFee(params: {
        toDistrictId: number;
        toWardCode: string;
        serviceId: number;
        weight?: number;
        codValue?: number;
    }): Promise<GHNFeeResponse> {
        return api.post<GHNFeeResponse>('/ghn/calculate-fee', params).then((r) => r.data);
    },
    isConfigured(): Promise<{ configured: boolean }> {
        return api.get<{ configured: boolean }>('/ghn/config').then((r) => r.data);
    },
};
