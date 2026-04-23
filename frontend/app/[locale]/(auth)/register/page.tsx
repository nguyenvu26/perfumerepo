'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';

import {
  AuthDivider,
  AuthFooterLink,
  AuthInputField,
  AuthPasswordField,
  SocialAuthButton,
} from '@/components/auth/auth-form-controls';
import { AuthShell } from '@/components/auth/auth-shell';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const { register } = useAuth();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
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
        phone: formData.phone,
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
    <AuthShell
      formEyebrow={isSubmitted ? t('success_title') : t('badge')}
      formSubtitle={isSubmitted ? '' : t('create_profile')}
      formTitle={isSubmitted ? t('success_title') : t('join_badge')}
      visualAlt="Perfume collection"
      visualImage="/luxury_perfume_auth_aesthetic.png"
      visualSubtitle={t('subtitle')}
      visualTitle={t('title')}
    >
      {isSubmitted ? (
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-7">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/16">
              <CheckCircle2 className="h-7 w-7 text-emerald-300" />
            </div>
            <p className="text-sm leading-7 text-[#D8DDE6]">{t('success_desc')}</p>
          </div>

          <Link
            href="/login"
            className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978]"
          >
            <span>{t('go_to_login')}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          {error ? (
            <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInputField
              autoComplete="name"
              disabled={isLoading}
              icon={User}
              label={t('name_label')}
              name="full_name"
              onChange={handleInputChange}
              placeholder={t('name_placeholder')}
              required
              type="text"
              value={formData.full_name}
            />

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

            <AuthInputField
              autoComplete="tel"
              disabled={isLoading}
              icon={Phone}
              label={t('phone_label')}
              name="phone"
              onChange={handleInputChange}
              placeholder={t('phone_placeholder')}
              type="tel"
              value={formData.phone}
            />

            <AuthPasswordField
              autoComplete="new-password"
              disabled={isLoading}
              icon={Lock}
              label={t('password_label')}
              name="password"
              onChange={handleInputChange}
              placeholder={t('password_placeholder')}
              required
              value={formData.password}
            />

            <AuthPasswordField
              autoComplete="new-password"
              disabled={isLoading}
              icon={Lock}
              label={t('confirm_password_label')}
              name="confirmPassword"
              onChange={handleInputChange}
              placeholder={t('confirm_password_placeholder')}
              required
              value={formData.confirmPassword}
            />

            <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-[#9CA3AF]">
              <input
                checked={termsAccepted}
                className="mt-1 h-4 w-4 rounded border-white/15 bg-transparent text-[#C8A96A] accent-[#C8A96A]"
                onChange={(e) => setTermsAccepted(e.target.checked)}
                type="checkbox"
              />
              <span>
                {t('terms_text')}{' '}
                <Link
                  href="/terms"
                  className="font-medium text-[#C8A96A] transition-colors hover:text-[#E2C793]"
                >
                  {t('terms_link')}
                </Link>{' '}
                &{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-[#C8A96A] transition-colors hover:text-[#E2C793]"
                >
                  {t('privacy_link')}
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#C8A96A] px-6 text-sm font-medium text-[#111216] shadow-[0_18px_40px_-22px_rgba(200,169,106,0.68)] transition-all hover:bg-[#d8b978] hover:shadow-[0_22px_44px_-22px_rgba(200,169,106,0.82)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isLoading ? tCommon('processing') : t('start_journey')}</span>
              {!isLoading ? (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              ) : null}
            </button>
          </form>

          <div>
            <AuthDivider>{t('or_register')}</AuthDivider>
            <SocialAuthButton
              disabled={isLoading}
              label={t('google')}
              onClick={() => handleOAuthLogin('Google')}
            />
          </div>

          <AuthFooterLink
            href="/login"
            linkLabel={t('sign_in')}
            prompt={t('already_member')}
          />
        </div>
      )}
    </AuthShell>
  );
}
