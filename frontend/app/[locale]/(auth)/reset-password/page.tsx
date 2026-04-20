'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Header } from '@/components/common/header';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
    const t = useTranslations('auth.reset_password');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "success">("idle");

    useEffect(() => {
        if (!token) {
            setError(t('error_missing_token'));
        }
    }, [token, t]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError(t('error_invalid_token'));
            return;
        }

        setError(null);

        if (password !== confirmPassword) {
            setError(t('error_password_match'));
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword({ token, newPassword: password });
            setStatus("success");
            // Automatically redirect after 3 seconds
            setTimeout(() => {
                router.push(`/${locale}/login`);
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('error_failed'));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-0 py-20 sm:p-6 sm:py-32 lg:p-8">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-none sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl border-0 sm:border border-stone-100 dark:border-white/5 transition-colors">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-fluid-2xl lg:text-3xl font-serif text-luxury-black dark:text-white mb-2 text-center leading-tight">
                            {t('page_title')}
                        </h1>
                        <p className="text-[10px] text-stone-400 font-bold tracking-[.4em] uppercase mb-8 lg:mb-12 text-center px-4">
                            {t('subtitle')}
                        </p>

                        {status === "success" ? (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                                    <Sparkles className="text-gold" size={40} />
                                </div>
                                <h3 className="text-xl font-serif">{t('security_updated')}</h3>
                                <p className="text-xs text-stone-500 italic">
                                    {t('success_message')}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold tracking-widest uppercase">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">{t('new_password_label')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm pr-16"
                                            placeholder={t('new_password_placeholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">{t('confirm_label')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm pr-16"
                                            placeholder={t('confirm_placeholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 lg:py-5 bg-luxury-black dark:bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] shadow-2xl hover:bg-stone-800 dark:hover:bg-gold/80 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 cursor-pointer"
                                >
                                    {isLoading ? tCommon('processing').toUpperCase() : t('update_security')}
                                    {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
