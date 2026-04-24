'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import {
    AuthFooterLink,
    AuthPasswordField,
} from '@/components/auth/auth-form-controls';
import { AuthShell } from '@/components/auth/auth-shell';
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
        <AuthShell
            formEyebrow={status === "success" ? t('security_updated') : t('badge')}
            formSubtitle={status === "success" ? '' : t('establish_security')}
            formTitle={status === "success" ? t('security_updated') : t('page_title')}
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

                {status === "success" ? (
                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-7">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/16">
                                <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                            </div>
                            <p className="text-sm leading-7 text-[#D8DDE6]">
                                {t('success_message')}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push(`/${locale}/login`)}
                            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978]"
                        >
                            <span>{t('proceed_login')}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <AuthPasswordField
                            autoComplete="new-password"
                            disabled={isLoading}
                            icon={Lock}
                            label={t('new_password_label')}
                            name="password"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('new_password_placeholder')}
                            required
                            value={password}
                        />

                        <AuthPasswordField
                            autoComplete="new-password"
                            disabled={isLoading}
                            icon={Lock}
                            label={t('confirm_label')}
                            name="confirmPassword"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('confirm_placeholder')}
                            required
                            value={confirmPassword}
                        />

                        <button
                            type="submit"
                            disabled={isLoading || !token}
                            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978] hover:shadow-[0_22px_44px_-22px_rgba(200,169,106,0.82)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span>{isLoading ? tCommon('processing') : t('update_security')}</span>
                            {!isLoading ? (
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            ) : null}
                        </button>
                    </form>
                )}

                <AuthFooterLink
                    href="/login"
                    linkLabel={tCommon('back_to_login')}
                    prompt=""
                />
            </div>
        </AuthShell>
    );
}