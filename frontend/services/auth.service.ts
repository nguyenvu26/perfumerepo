import api from '@/lib/axios';

// Backend returns { accessToken, refreshToken }
export const authService = {
    async login(credentials: { email: string; password: string }) {
        const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', credentials);
        return data;
    },
    async register(payload: { email: string; password: string; fullName?: string; phone?: string }) {
        const { data } = await api.post<{ success: boolean; message: string }>('/auth/register', {
            email: payload.email,
            password: payload.password,
            fullName: payload.fullName,
            phone: payload.phone || undefined,
        });
        return data;
    },
    async verifyEmail(token: string) {
        const { data } = await api.post<{ success: boolean; message: string }>('/auth/verify-email', { token });
        return data;
    },
    async resendVerificationEmail() {
        const { data } = await api.post<{ success: boolean; message: string }>('/auth/resend-verification');
        return data;
    },
    async refresh(refreshToken: string) {
        const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
        return data;
    },
    async forgotPassword(email: string) {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    },
    async resetPassword(payload: { token: string; newPassword: string }) {
        const { data } = await api.post('/auth/reset-password', payload);
        return data;
    },
    async changePassword(payload: { oldPassword: string; newPassword: string }) {
        const { data } = await api.post('/auth/change-password', payload);
        return data;
    },
};

