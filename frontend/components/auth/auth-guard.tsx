'use client';

import { useEffect } from 'react';
import { useRouter } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'staff' | 'customer')[];
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase() as 'admin' | 'staff' | 'customer')) {
            router.push('/');
        }
    }, [isAuthenticated, user, allowedRoles, router]);

    if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase() as 'admin' | 'staff' | 'customer'))) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return <>{children}</>;
};
