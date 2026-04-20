'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Link, useRouter } from '@/lib/i18n';
import { Header } from '@/components/common/header';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your essence...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Missing verification token.');
            return;
        }

        const verify = async () => {
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'Email verified successfully!');
                // Auto redirect to login after 5 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || err.message || 'Verification failed.');
            }
        };

        verify();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors flex flex-col font-sans">
            <Header />
            <main className="flex-1 flex items-center justify-center p-0 py-20 sm:p-6 sm:py-32 lg:p-8">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-none sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl border-0 sm:border border-stone-100 dark:border-white/5 relative overflow-hidden transition-colors">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 text-center space-y-8"
                    >
                        <div className="flex justify-center">
                            {status === 'loading' && (
                                <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <Loader2 className="text-gold animate-spin" size={40} />
                                </div>
                            )}
                            {status === 'success' && (
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center relative">
                                    <CheckCircle2 className="text-green-500" size={40} />
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <Sparkles className="text-gold" size={20} />
                                    </motion.div>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                                    <XCircle className="text-red-500" size={40} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-fluid-2xl lg:text-3xl font-serif text-luxury-black dark:text-white leading-tight">
                                {status === 'loading' ? 'Verification' : status === 'success' ? 'Identity Confirmed' : 'Verification Failed'}
                            </h1>
                            <p className="text-[10px] text-stone-400 font-bold tracking-[.4em] uppercase">
                                Email Verification
                            </p>
                        </div>

                        <p className="text-sm text-stone-500 leading-relaxed italic">
                            {message}
                        </p>

                        {status === 'success' && (
                            <div className="pt-4">
                                <p className="text-[10px] text-stone-400 font-bold tracking-widest uppercase mb-4">
                                    Redirecting to sign in momentarily...
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 py-4 px-10 bg-luxury-black dark:bg-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-all group shadow-xl"
                                >
                                    Login Now
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="pt-4">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 py-3 px-8 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-stone-50 dark:hover:bg-white/5 transition-all"
                                >
                                    Return to Registration
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
