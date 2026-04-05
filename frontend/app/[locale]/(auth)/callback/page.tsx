'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { userService } from '@/services/user.service';

// Map backend user to frontend shape
function toFrontendUser(me: { id: string; email: string; fullName?: string | null; role: string }) {
    return {
        id: me.id,
        name: me.fullName || me.email,
        email: me.email,
        role: me.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
        points: undefined as number | undefined,
    };
}

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing authentication...');

    useEffect(() => {
        const processOAuthCallback = async () => {
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');

            if (accessToken && refreshToken) {
                try {
                    // Save tokens to localStorage
                    localStorage.setItem('token', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);

                    // Fetch user profile
                    setMessage('Fetching your profile...');
                    const userProfile = await userService.getMe();

                    // Update auth store with user info and token
                    setAuth(toFrontendUser(userProfile), accessToken);

                    setStatus('success');
                    setMessage('Authentication successful! Redirecting...');

                    // Redirect to home page after 1.5 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 1500);
                } catch (error) {
                    console.error('Error processing OAuth callback:', error);
                    setStatus('error');
                    setMessage('Failed to fetch user profile');

                    // Clean up tokens on error
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');

                    setTimeout(() => {
                        router.push('/login?error=auth_failed');
                    }, 2000);
                }
            } else {
                setStatus('error');
                setMessage('Authentication failed. No tokens received.');

                setTimeout(() => {
                    router.push('/login?error=oauth_failed');
                }, 2000);
            }
        };

        processOAuthCallback();
    }, [searchParams, router, setAuth]);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-12 shadow-2xl border border-stone-100 dark:border-white/5 text-center"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-gold animate-spin" />
                        <h2 className="text-2xl font-serif text-luxury-black dark:text-white mb-3">
                            Authenticating
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            {message}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
                        <h2 className="text-2xl font-serif text-luxury-black dark:text-white mb-3">
                            Success!
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            {message}
                        </p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
                        <h2 className="text-2xl font-serif text-luxury-black dark:text-white mb-3">
                            Authentication Failed
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                            {message}
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-luxury-black dark:bg-gold text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-800 dark:hover:bg-gold/80 transition-all"
                        >
                            Back to Login
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
