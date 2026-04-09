import api from '@/lib/axios';

export type AdminUserStore = {
  store: { id: string; name: string; code: string | null };
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  stores?: AdminUserStore[];
};

// Backend: GET/PATCH /users/me, GET /admin/users, PATCH /admin/users/:id
export const userService = {
    async getMe() {
        const { data } = await api.get('/users/me');
        return data;
    },
    async updateProfile(payload: { fullName?: string; phone?: string; gender?: string; dateOfBirth?: string; address?: string; city?: string; country?: string; avatarUrl?: string; budgetMin?: number; budgetMax?: number }) {
        const { data } = await api.patch('/users/me', payload);
        return data;
    },
    async adminListUsers(role?: string): Promise<AdminUser[]> {
        const { data } = await api.get<AdminUser[]>('/admin/users', { params: role ? { role } : undefined });
        return data;
    },
    async adminGetUser(id: string): Promise<AdminUser> {
        const { data } = await api.get<AdminUser>(`/admin/users/${id}`);
        return data;
    },
    async adminUpdateUser(id: string, payload: { role?: string; isActive?: boolean }): Promise<AdminUser> {
        const { data } = await api.patch<AdminUser>(`/admin/users/${id}`, payload);
        return data;
    },
};
