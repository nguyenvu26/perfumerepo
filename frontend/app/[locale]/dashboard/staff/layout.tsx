'use client';

import { AuthGuard } from '@/components/auth/auth-guard';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            {children}
        </AuthGuard>
    );
}
