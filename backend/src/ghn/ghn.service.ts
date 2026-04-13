import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export type GHNProvince = {
    ProvinceID: number;
    ProvinceName: string;
    Code: string;
};
export type GHNDistrict = {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    Code: string;
};
export type GHNWard = {
    WardCode: string;
    DistrictID: number;
    WardName: string;
};
export type GHNServiceOption = {
    service_id: number;
    short_name: string;
    service_type_id: number;
};

export type GHNFeeResponse = {
    total: number;
    service_fee: number;
    insurance_fee: number;
    [key: string]: number;
};

export type GHNCreateOrderResponse = {
    order_code: string;
    sort_code: string;
    total_fee: number;
    trans_type: string;
    expected_delivery_time: string;
    fee: { main_service: number; insurance: number;[key: string]: number };
};



@Injectable()
export class GHNService {
    private readonly client: AxiosInstance;
    private readonly token: string;
    private readonly shopId: number;
    private readonly baseUrl: string;
    private readonly fromDistrictId: number;
    private readonly fromWardCode: string;
    private readonly returnPhone: string;
    private readonly returnAddress: string;

    constructor(private readonly config: ConfigService) {
        this.token = this.config.get<string>('SHIPPING_GHN_TOKEN') ?? '';
        this.shopId = parseInt(this.config.get<string>('SHIPPING_GHN_SHOP_ID') ?? '0', 10);
        const isDev = this.config.get('NODE_ENV') !== 'production';
        this.baseUrl = this.config.get<string>('GHN_API_URL') || (isDev
            ? 'https://dev-online-gateway.ghn.vn/shiip/public-api'
            : 'https://online-gateway.ghn.vn/shiip/public-api');

        this.fromDistrictId = parseInt(
            this.config.get('SHIPPING_GHN_FROM_DISTRICT_ID') ?? '0',
            10,
        );
        this.fromWardCode = this.config.get('SHIPPING_GHN_FROM_WARD_CODE') ?? '';
        this.returnPhone = this.config.get('SHIPPING_GHN_RETURN_PHONE') ?? '';
        this.returnAddress = this.config.get('SHIPPING_GHN_RETURN_ADDRESS') ?? '';

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Token: this.token,
                ShopId: String(this.shopId),
            },
        });
    }

    private ensureConfigured() {
        if (!this.token || !this.shopId)
            throw new Error('GHN chưa được cấu hình (GHN_TOKEN, GHN_SHOP_ID)');
    }

    async getProvinces(): Promise<GHNProvince[]> {
        this.ensureConfigured();
        const res = await this.client.get<{ code: number; data: GHNProvince[] }>(
            '/master-data/province',
        );
        if (res.data.code !== 200) throw new Error('GHN get provinces failed');
        return Array.isArray(res.data.data) ? res.data.data : [];
    }

    async getDistricts(provinceId: number): Promise<GHNDistrict[]> {
        this.ensureConfigured();
        const res = await this.client.get<{ code: number; data: GHNDistrict[] }>(
            '/master-data/district',
            {
                params: { province_id: provinceId },
            },
        );
        if (res.data.code !== 200) throw new Error('GHN get districts failed');
        const data = res.data.data;
        return Array.isArray(data) ? data : [];
    }

    async getWards(districtId: number): Promise<GHNWard[]> {
        this.ensureConfigured();
        const res = await this.client.get<{ code: number; data: GHNWard[] }>(
            '/master-data/ward',
            {
                params: { district_id: districtId },
            },
        );
        if (res.data.code !== 200) throw new Error('GHN get wards failed');
        const data = res.data.data;
        return Array.isArray(data) ? data : [];
    }

    async getAvailableServices(toDistrictId: number): Promise<GHNServiceOption[]> {
        this.ensureConfigured();
        if (!this.fromDistrictId) return [];
        const res = await this.client.post<{ code: number; data: GHNServiceOption[] }>(
            '/v2/shipping-order/available-services',
            {
                shop_id: this.shopId,
                from_district: this.fromDistrictId,
                to_district: toDistrictId,
            },
        );
        if (res.data.code !== 200) throw new Error('GHN get services failed');
        const data = res.data.data;
        // Filter chỉ lấy dịch vụ hàng nhẹ (service_type_id = 2) cho nước hoa
        return Array.isArray(data) ? data.filter(s => s.service_type_id === 2) : [];
    }

    async calculateFee(params: {
        toDistrictId: number;
        toWardCode: string;
        serviceId: number;
        weight: number;
        length?: number;
        width?: number;
        height?: number;
        codValue?: number;
        insuranceValue?: number;
    }): Promise<GHNFeeResponse> {
        this.ensureConfigured();

        let serviceId = params.serviceId;
        if (!serviceId || serviceId === 0) {
            const availableServices = await this.getAvailableServices(params.toDistrictId);
            if (availableServices.length > 0) {
                serviceId = availableServices[0].service_id;
            } else {
                throw new Error('Không có dịch vụ vận chuyển khả dụng cho khu vực này');
            }
        }

        const fromDistrict = this.fromDistrictId || params.toDistrictId;
        const fromWard = this.fromWardCode || '';
        const res = await this.client.post<{ code: number; data: GHNFeeResponse }>(
            '/v2/shipping-order/fee',
            {
                from_district_id: fromDistrict,
                from_ward_code: fromWard || undefined,
                to_district_id: params.toDistrictId,
                to_ward_code: params.toWardCode,
                service_id: serviceId,
                weight: params.weight,
                length: params.length ?? 20,
                width: params.width ?? 15,
                height: params.height ?? 10,
                cod_value: params.codValue ?? 0,
                insurance_value: params.insuranceValue ?? 0,
            },
        );
        if (res.data.code !== 200)
            throw new Error(res.data['message'] ?? 'GHN calculate fee failed');
        return res.data.data;
    }

    async createOrder(params: {
        toName: string;
        toPhone: string;
        toAddress: string;
        toWardCode: string;
        toDistrictId: number;
        fromName?: string;
        fromPhone?: string;
        fromAddress?: string;
        fromWardCode?: string;
        fromDistrictId?: number;
        weight: number;
        length: number;
        width: number;
        height: number;
        serviceId: number;
        serviceTypeId: number;
        paymentTypeId: number;
        codAmount: number;
        insuranceValue?: number;
        content?: string;
        clientOrderCode?: string;
        items: { name: string; quantity: number; price: number; weight?: number }[];
    }): Promise<GHNCreateOrderResponse> {
        this.ensureConfigured();
        const payload = {
            payment_type_id: params.paymentTypeId,
            required_note: 'KHONGCHOXEMHANG',
            return_phone: this.returnPhone,
            return_address: this.returnAddress,
            return_district_id: this.fromDistrictId || null,
            return_ward_code: this.fromWardCode || '',
            client_order_code: params.clientOrderCode ?? '',
            from_name: params.fromName,
            from_phone: params.fromPhone,
            from_address: params.fromAddress,
            from_ward_code: params.fromWardCode,
            from_district_id: params.fromDistrictId,
            to_name: params.toName,
            to_phone: params.toPhone,
            to_address: params.toAddress,
            to_ward_code: params.toWardCode,
            to_district_id: params.toDistrictId,
            cod_amount: params.codAmount,
            content: params.content ?? 'Nước hoa',
            weight: params.weight,
            length: params.length,
            width: params.width,
            height: params.height,
            insurance_value: params.insuranceValue ?? Math.min(params.codAmount, 5000000),
            service_id: params.serviceId,
            service_type_id: params.serviceTypeId,
            items: params.items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                weight: i.weight ?? Math.ceil(params.weight / params.items.length),
            })),
        };

        const res = await this.client.post<{
            code: number;
            message?: string;
            data: GHNCreateOrderResponse;
        }>('/v2/shipping-order/create', payload);
        if (res.data.code !== 200) {
            throw new Error(res.data.message ?? 'GHN create order failed');
        }
        return res.data.data;
    }

    async getOrderDetail(orderCode: string): Promise<any> {
        const res = await this.client.post<{
            code: number;
            message?: string;
            data: any;
        }>('/v2/shipping-order/detail', { order_code: orderCode });
        if (res.data.code !== 200) {
            throw new Error(res.data.message ?? 'GHN get order detail failed');
        }
        return res.data.data;
    }

    async cancelOrder(orderCodes: string[]): Promise<any> {
        const res = await this.client.post<{
            code: number;
            message?: string;
            data: any;
        }>('/v2/switch-status/cancel', { order_codes: orderCodes });
        if (res.data.code !== 200) {
            throw new Error(res.data.message ?? 'GHN cancel order failed');
        }
        return res.data.data;
    }

    isConfigured(): boolean {
        return (
            !!this.token &&
            !!this.shopId &&
            this.fromDistrictId > 0 &&
            !!this.fromWardCode
        );
    }



}
