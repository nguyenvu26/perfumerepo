'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, Globe, Eye, EyeOff, Sparkles, Phone } from 'lucide-react';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const t = useTranslations('auth.register');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { register } = useAuth();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!termsAccepted) {
            setError(t('error_terms'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('error_password_match'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                fullName: formData.full_name,
                phone: formData.phone
            });
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('error_failed'));
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
                        src="/luxury_perfume_auth_aesthetic.png"
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
                            <div className="flex items-center gap-3 text-gold mb-6">
                                <ArrowRight size={24} />
                                <span className="text-[10px] font-bold tracking-[.4em] uppercase">
                                    {t('join_badge')}
                                </span>
                            </div>
                            <h2 className="text-fluid-4xl font-serif text-white mb-6 leading-tight italic">
                                {t('page_title')}
                            </h2>
                            <p className="text-stone-300 text-sm font-light leading-relaxed max-w-sm">
                                {t('page_subtitle')}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center min-h-[100dvh] md:min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {isSubmitted ? (
                                <div className="text-center space-y-8">
                                    <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                                        <Sparkles className="text-gold" size={48} />
                                    </div>
                                    <h1 className="text-fluid-3xl font-serif text-luxury-black dark:text-white mb-2 transition-colors">
                                        {t('success_title')}
                                    </h1>
                                    <p className="text-stone-500 text-sm leading-relaxed max-w-xs mx-auto italic">
                                        {t('success_desc')}
                                    </p>
                                    <div className="pt-8">
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-stone-400 hover:text-gold transition-colors group"
                                        >
                                            {t('go_to_login')}
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-fluid-3xl font-serif text-luxury-black dark:text-white mb-2 transition-colors">
                                        {t('join_badge')}
                                    </h1>
                                    <p className="text-[10px] text-stone-400 font-bold tracking-[.4em] uppercase mb-8">
                                        {t('create_profile')}
                                    </p>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold tracking-widest uppercase">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-6 mb-10">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                                {t('name_label')}
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                                <input
                                                    name="full_name"
                                                    value={formData.full_name}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    required
                                                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm text-luxury-black dark:text-white"
                                                    placeholder={t('name_placeholder')}
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                                {t('email_label')}
                                            </label>
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

                                        {/* Phone Number */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                                {t('phone_label')}
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    type="tel"
                                                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm text-luxury-black dark:text-white"
                                                    placeholder={t('phone_placeholder')}
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                                {t('password_label')}
                                            </label>
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

                                        {/* Confirm Password */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">
                                                {t('confirm_password_label')}
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                                <input
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    required
                                                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl px-14 py-4 outline-none focus:border-gold transition-all text-sm pr-16 text-luxury-black dark:text-white"
                                                    placeholder={t('confirm_password_placeholder')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors cursor-pointer"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-4 p-2"
                                        >
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-stone-200 dark:border-white/10 text-gold focus:ring-gold cursor-pointer"
                                            />
                                            <label htmlFor="terms" className="text-[9px] text-stone-400 font-bold tracking-widest uppercase leading-[1.6] cursor-pointer select-none">
                                                {t('terms_text')} <Link href="/terms" className="text-luxury-black dark:text-white underline hover:text-gold transition-colors italic">{t('terms_link')}</Link> {tCommon('and')} <Link href="/privacy" className="text-luxury-black dark:text-white underline hover:text-gold transition-colors italic">{t('privacy_link')}</Link>.
                                            </label>
                                        </motion.div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-4 lg:py-5 bg-luxury-black dark:bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] shadow-2xl hover:bg-stone-800 dark:hover:bg-gold/80 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? tCommon('processing').toUpperCase() : t('start_journey')}
                                            {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />}
                                        </button>
                                    </form>

                                    <div className="space-y-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100 dark:border-white/5" /></div>
                                            <div className="relative flex justify-center"><span className="bg-white dark:bg-zinc-900 px-4 text-[10px] font-bold text-stone-300 uppercase tracking-widest">{t('or_register')}</span></div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => handleOAuthLogin('Google')}
                                                disabled={isLoading}
                                                className="flex items-center justify-center gap-3 py-4 border border-stone-100 dark:border-white/10 rounded-2xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                <Globe size={18} className="text-stone-400" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500">{t('google')}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-stone-100 dark:border-white/5 text-center">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                                            {t('already_member')}{' '}
                                            <Link href="/login" className="text-gold hover:text-gold-dark transition-colors">
                                                {t('sign_in')}
                                            </Link>
                                        </p>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
