'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { Link, useRouter } from '@/lib/i18n';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const t = useTranslations('auth.login');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            if (errorParam === 'oauth_failed') {
                setError(t('error_oauth_failed') || 'OAuth login failed. Please try again.');
            }
        }
    }, [searchParams, t]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const user = await login({ email: formData.email, password: formData.password });
            
            // Role-based redirection
            if (user.role === 'ADMIN') {
                router.push('/dashboard/admin');
            } else if (user.role === 'STAFF') {
                router.push('/dashboard/staff');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || t('error_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = (provider: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const oauthUrl = `${apiUrl}/auth/${provider.toLowerCase()}`;
        window.location.href = oauthUrl;
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-0 sm:p-6 lg:p-8 transition-colors">
            <div className="max-w-6xl w-full grid md:grid-cols-2 gap-0 md:gap-12 bg-white dark:bg-zinc-900 rounded-none sm:rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-2xl border-0 sm:border border-stone-100 dark:border-white/5 transition-colors">
                {/* Visual Side */}
                <div className="relative hidden md:block overflow-hidden min-h-[600px]">
                    <Image
                        src="/luxury_perfume_hero_cinematic.png"
                        alt="Luxury Scent"
                        fill
                        className="object-cover contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/20 to-transparent flex flex-col justify-end p-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-fluid-4xl font-serif text-white mb-6 leading-tight italic">
                                {t('title')}
                            </h2>
                        </motion.div>
                    </div>
                </div>

                {/* Form Side */}
                <form onSubmit={handleSubmit} className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center min-h-[100dvh] md:min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-fluid-3xl font-serif text-luxury-black dark:text-white mb-2 transition-colors">
                                {t('welcome_back')}
                            </h1>
                            <p className="text-[10px] text-stone-400 font-bold tracking-[.4em] uppercase mb-8">
                                {t('please_login')}
                            </p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold tracking-widest uppercase">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6 mb-10">
                                {/* Email */}
                                <div className="space-y-2">
                                    <div className="flex items-center pl-2 h-[22px]">
                                        <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                                            {t('email_label')}
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            type="email"
                                            required
                                            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm text-luxury-black dark:text-white"
                                            placeholder={t('email_placeholder')}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-2 h-[22px]">
                                        <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                                            {t('password_label')}
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[9px] font-bold tracking-widest uppercase text-stone-500 hover:text-gold transition-colors cursor-pointer"
                                        >
                                            {tCommon('forgot_password')}
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                        <input
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm pr-16 text-luxury-black dark:text-white"
                                            placeholder={t('password_placeholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                             <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 lg:py-5 bg-gold text-primary rounded-full font-bold tracking-[.3em] uppercase text-[10px] shadow-2xl hover:bg-gold/80 transition-all flex items-center justify-center gap-4 group mb-10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? tCommon('processing').toUpperCase() : t('sign_in')}
                                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />}
                            </button>

                            <div className="space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100 dark:border-white/5" /></div>
                                    <div className="relative flex justify-center"><span className="bg-white dark:bg-zinc-900 px-4 text-[10px] font-bold text-stone-300 uppercase tracking-widest">{t('or_continue')}</span></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('Google')}
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-3 py-4 border border-stone-100 dark:border-white/10 rounded-2xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500">{t('google')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-stone-100 dark:border-white/5 text-center">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                                    {t('no_account')}{' '}
                                    <Link href="/register" className="text-gold hover:text-gold-dark transition-colors">
                                        {t('sign_up')}
                                    </Link>
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </form>
            </div>
        </div>
    );
}
