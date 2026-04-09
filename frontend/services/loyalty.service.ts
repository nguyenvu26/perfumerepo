import api from '@/lib/axios';

export const loyaltyService = {
    getStatus() {
        return api.get<{ points: number; history: any[] }>('/loyalty/status').then((r) => r.data);
    },
};
