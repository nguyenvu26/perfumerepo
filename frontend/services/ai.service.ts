import api from '@/lib/axios';

export const aiService = {
    async getConsultation(profileData: any) {
        const response = await api.post('/ai/consultation', profileData);
        return response.data;
    },
    async discoverScents(preferences: any) {
        const response = await api.post('/ai/discover', preferences);
        return response.data;
    }
};
