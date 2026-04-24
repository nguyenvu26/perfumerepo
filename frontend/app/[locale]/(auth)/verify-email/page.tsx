'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Link, useRouter } from '@/lib/i18n';
import { AuthShell } from '@/components/auth/auth-shell';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
    const t = useTranslations('auth.callback');
    const tCommon = useTranslations('common');
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(t('authenticating'));

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage(t('error_no_token'));
            return;
        }

        const verify = async () => {
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || t('success_msg'));
                // Auto redirect to login after 5 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || err.message || t('error_title'));
            }
        };

        verify();
    }, [token, router, t]);

    return (
        <AuthShell
            formEyebrow={status === 'loading' ? t('authenticating') : status === 'success' ? t('success_title') : t('error_title')}
            formSubtitle=""
            formTitle={status === 'loading' ? t('authenticating') : status === 'success' ? t('success_title') : t('error_title')}
            visualAlt="Luxury perfume bottle"
            visualImage="/luxury_perfume_auth_aesthetic.png"
            visualSubtitle=""
            visualTitle="Verification"
        >
            <div className="space-y-8 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                    {status === 'loading' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                            <Loader2 className="h-10 w-10 animate-spin text-[#C8A96A]" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
                            <XCircle className="h-10 w-10 text-rose-500" />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="text-sm leading-7 text-[#D8DDE6]/80 italic">
                        {message}
                    </p>
                </div>

                {status === 'success' && (
                    <div className="space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                            Redirecting to sign in momentarily...
                        </p>
                        <Link
                            href="/login"
                            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978]"
                        >
                            <span>{t('back_to_login')}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <Link
                        href="/register"
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-transparent px-6 text-sm font-medium text-[#F5F5F5] transition-all hover:bg-white/5"
                    >
                        <span>Return to Registration</span>
                    </Link>
                )}
            </div>
        </AuthShell>
    );
}