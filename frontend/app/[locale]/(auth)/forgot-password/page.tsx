'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
    const t = useTranslations('auth.forgot_password');
    const tCommon = useTranslations('common');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await authService.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('error_failed'));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors font-sans">
            <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 bg-white dark:bg-zinc-900 rounded-[4rem] overflow-hidden shadow-2xl border border-stone-100 dark:border-white/5 transition-colors">
                {/* Visual Side */}
                <div className="relative hidden md:block overflow-hidden min-h-[600px]">
                    <Image
                        src="/luxury_perfume_auth_aesthetic.png"
                        alt="Password Recovery"
                        fill
                        className="object-cover contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center gap-3 text-amber-500 mb-6 font-medium">
                                <ArrowRight size={24} />
                                <span className="text-[10px] font-bold tracking-[.4em] uppercase">
                                    {t('badge')}
                                </span>
                            </div>
                            <h2 className="text-5xl font-serif text-white mb-6 leading-tight italic">
                                {t('title')}
                            </h2>
                            <p className="text-stone-300 text-sm font-light leading-relaxed max-w-sm">
                                {t('subtitle')}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-12 md:p-20 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-serif text-zinc-900 dark:text-white mb-2 transition-colors">
                            {isSubmitted ? t('verification_sent') : t('page_title')}
                        </h1>
                        <p className="text-[10px] text-stone-400 font-bold tracking-[.4em] uppercase mb-8">
                            {isSubmitted
                                ? t('check_email')
                                : t('page_subtitle')
                            }
                        </p>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold tracking-widest uppercase">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                            {t('email_label')}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-amber-500 transition-all text-sm text-zinc-900 dark:text-white"
                                                placeholder={t('email_placeholder')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-zinc-900 dark:bg-amber-600 text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] shadow-2xl hover:bg-zinc-800 dark:hover:bg-amber-500 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? tCommon('processing').toUpperCase() : tCommon('send_link')}
                                    {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />}
                                </button>
                            </form>
                        ) : (
                            <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 space-y-6">
                                <p className="text-zinc-900 dark:text-white/70 text-sm leading-relaxed italic">
                                    {t('link_sent')} <span className="text-zinc-900 dark:text-white font-bold">{email}</span>. {t('link_valid')}
                                </p>
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-[9px] uppercase tracking-widest text-amber-600 font-bold hover:underline underline-offset-4 cursor-pointer"
                                >
                                    {t('didnt_receive')}
                                </button>
                            </div>
                        )}

                        <div className="text-center pt-8 mt-8 border-t border-stone-100 dark:border-white/5">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-stone-400 hover:text-amber-600 transition-colors group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                {t('back_to_login')}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
