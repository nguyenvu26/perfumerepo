'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
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

        if (user?.role) {
            const role = user.role.toLowerCase();
            router.push(`/dashboard/${role}`);
        }
    }, [isMounted, user, isAuthenticated, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground uppercase tracking-widest">
                    Redirecting to your dashboard...
                </p>
            </div>
        </div>
    );
}
