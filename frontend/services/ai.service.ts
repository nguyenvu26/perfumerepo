import api from '@/lib/axios';

export const aiService = {
    async getConsultation(profileData: any) {
        const response = await api.post('/ai/consultation', profileData);
        return response.data;
    },
    async discoverScents(preferences: any) {
        const response = await api.post('/ai/discover', preferences);
        return response.data;
    },
    async getLogs(params: { page?: number; limit?: number; type?: string; status?: string }) {
        const response = await api.get('/ai-logs', { params });
        return response.data;
    },
    async getStats() {
        const response = await api.get('/ai-logs/stats');
        return response.data;
    },
    async getLogDetail(id: string) {
        const response = await api.get(`/ai-logs/${id}`);
        return response.data;
    }
};
