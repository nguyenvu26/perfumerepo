'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'staff' | 'customer')[];
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const tokenInStorage = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!isAuthenticated && !tokenInStorage) {
            router.push('/login');
            return;
        }

        if (isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase() as 'admin' | 'staff' | 'customer')) {
            router.push('/');
        }
    }, [isMounted, isAuthenticated, user, allowedRoles, router]);

    const hasPersistedToken = typeof window !== 'undefined' && localStorage.getItem('token') !== null;
    const isUnauthorized = isMounted && !isAuthenticated && !hasPersistedToken;
    const isForbidden = isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase() as 'admin' | 'staff' | 'customer');

    if (!isMounted || isUnauthorized || isForbidden) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return <>{children}</>;
};
