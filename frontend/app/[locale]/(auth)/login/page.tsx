'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import {
  AuthDivider,
  AuthFooterLink,
  AuthInputField,
  AuthPasswordField,
  SocialAuthButton,
} from '@/components/auth/auth-form-controls';
import { AuthShell } from '@/components/auth/auth-shell';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter } from '@/lib/i18n';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_failed') {
      setError(
        t('error_oauth_failed') || 'OAuth login failed. Please try again.',
      );
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
      const user = await login({
        email: formData.email,
        password: formData.password,
      });

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
    <AuthShell
      formEyebrow={t('badge')}
      formSubtitle={t('please_login')}
      formTitle={t('welcome_back')}
      visualAlt="Luxury perfume bottle"
      visualImage="/login_perfume_bg.png"
      visualSubtitle={t('subtitle')}
      visualTitle={t('title')}
    >
      <div className="space-y-7">
        {error ? (
          <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInputField
            autoComplete="email"
            disabled={isLoading}
            icon={Mail}
            label={t('email_label')}
            name="email"
            onChange={handleInputChange}
            placeholder={t('email_placeholder')}
            required
            type="email"
            value={formData.email}
          />

          <AuthPasswordField
            autoComplete="current-password"
            disabled={isLoading}
            icon={Lock}
            label={t('password_label')}
            labelAction={
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-[#9CA3AF] transition-colors hover:text-[#C8A96A]"
              >
                {tCommon('forgot_password')}
              </Link>
            }
            name="password"
            onChange={handleInputChange}
            placeholder={t('password_placeholder')}
            required
            value={formData.password}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978] hover:shadow-[0_22px_44px_-22px_rgba(200,169,106,0.82)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isLoading ? tCommon('processing') : t('sign_in')}</span>
            {!isLoading ? (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            ) : null}
          </button>
        </form>

        <div>
          <AuthDivider>{t('or_continue')}</AuthDivider>
          <SocialAuthButton
            disabled={isLoading}
            label={t('google')}
            onClick={() => handleOAuthLogin('Google')}
          />
        </div>

        <AuthFooterLink
          href="/register"
          linkLabel={t('sign_up')}
          prompt={t('no_account')}
        />
      </div>
    </AuthShell>
  );
}
