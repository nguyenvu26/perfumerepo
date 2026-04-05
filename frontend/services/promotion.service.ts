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
    // Admin services
    findAll() {
        return api.get<any[]>('/promotions').then((r) => r.data);
    },
    create(dto: any) {
        return api.post<any>('/promotions', dto).then((r) => r.data);
    },
    remove(id: string) {
        return api.delete(`/promotions/${id}`).then((r) => r.data);
    }
};
