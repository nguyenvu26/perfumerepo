import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useRouter } from '@/lib/i18n';

// Map backend user to frontend shape; backend role: ADMIN|STAFF|CUSTOMER
function toFrontendUser(me: { id: string; email: string; fullName?: string | null; role: string }) {
    return {
        id: me.id,
        name: me.fullName || me.email,
        email: me.email,
        role: me.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
        points: undefined as number | undefined,
    };
}

export const useAuth = () => {
    const { user, token, setAuth, logout: clearAuth } = useAuthStore();
    const router = useRouter();

    const login = async (credentials: { email: string; password: string }) => {
        const { accessToken, refreshToken } = await authService.login(credentials);
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        }
        const me = await userService.getMe();
        setAuth(toFrontendUser(me), accessToken);
    };

    const register = async (userData: { email: string; password: string; full_name?: string; fullName?: string; phone?: string }) => {
        return await authService.register({
            email: userData.email,
            password: userData.password,
            fullName: userData.fullName ?? userData.full_name,
            phone: userData.phone
        });
    };

    const logout = () => {
        clearAuth();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('refreshToken');
        }
        router.push('/logout');
    };

    return {
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
    };
};
