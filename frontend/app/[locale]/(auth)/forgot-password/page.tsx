'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
    AuthFooterLink,
    AuthInputField,
} from '@/components/auth/auth-form-controls';
import { AuthShell } from '@/components/auth/auth-shell';
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
        <AuthShell
            formEyebrow={isSubmitted ? t('verification_sent') : t('badge')}
            formSubtitle={isSubmitted ? '' : t('page_subtitle')}
            formTitle={isSubmitted ? t('verification_sent') : t('page_title')}
            visualAlt="Luxury perfume bottle"
            visualImage="/luxury_perfume_auth_aesthetic.png"
            visualSubtitle={t('subtitle')}
            visualTitle={t('title')}
        >
            <div className="space-y-7">
                {error ? (
                    <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
                        {error}
                    </div>
                ) : null}

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <AuthInputField
                            autoComplete="email"
                            disabled={isLoading}
                            icon={Mail}
                            label={t('email_label')}
                            name="email"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('email_placeholder')}
                            required
                            type="email"
                            value={email}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978] hover:shadow-[0_22px_44px_-22px_rgba(200,169,106,0.82)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span>{isLoading ? tCommon('processing') : tCommon('send_link')}</span>
                            {!isLoading ? (
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            ) : null}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-7">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/16">
                                <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                            </div>
                            <p className="text-sm leading-7 text-[#D8DDE6]">
                                {t('link_sent')} <span className="font-bold text-white">{email}</span>. {t('link_valid')}
                            </p>
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#C8A96A] hover:underline"
                            >
                                {t('didnt_receive')}
                            </button>
                        </div>
                    </div>
                )}

                <AuthFooterLink
                    href="/login"
                    linkLabel={t('back_to_login')}
                    prompt=""
                />
            </div>
        </AuthShell>
    );
}