import api from '@/lib/axios';

export type PromotionValidationResponse = {
    promoId: string;
    code: string;
    discountAmount: number;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
};

export const promotionService = {
    validate(code: string, amount: number) {
        return api.post<PromotionValidationResponse>('/promotions/validate', { code, amount }).then((r) => r.data);
    },
    getActive() {
        return api.get<any[]>('/promotions/active').then((r) => r.data);
    },
    getPublic() {
        return api.get<any[]>('/promotions/public').then((r) => r.data);
    },
    getRedeemable() {
        return api.get<any[]>('/promotions/redeemable').then((r) => r.data);
    },
    getMyPromotions() {
        return api.get<any[]>('/promotions/my-promotions').then((r) => r.data);
    },
    claim(id: string) {
        return api.post(`/promotions/claim/${id}`).then((r) => r.data);
    },
    redeem(id: string) {
        return api.post(`/promotions/redeem/${id}`).then((r) => r.data);
    },
    // Admin services
    findAll() {
        return api.get<any[]>('/promotions').then((r) => r.data);
    },
    create(dto: any) {
        return api.post<any>('/promotions', dto).then((r) => r.data);
    },
    update(id: string, dto: any) {
        return api.patch<any>(`/promotions/${id}`, dto).then((r) => r.data);
    },
    remove(id: string) {
        return api.delete(`/promotions/${id}`).then((r) => r.data);
    }
};
