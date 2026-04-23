'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  User,
  Mail,
  Shield,
  Edit2,
  Loader2,
  CheckCircle,
  Send,
  Phone,
  Eye,
  EyeOff,
  X,
  CalendarDays,
  BadgeCheck,
  Wallet,
  Save,
  Sparkles,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AddressManager } from '@/components/address/address-manager';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

type ProfileData = {
  id: string;
  email: string;
  phone?: string | null;
  role: string;
  fullName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  loyaltyPoints?: number;
  createdAt?: string;
  emailVerified?: boolean;
};

type FieldConfig = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
};

export default function ProfilePage() {
  const t = useTranslations('dashboard.profile');
  const tFeatured = useTranslations('featured');
  const locale = useLocale();
  const format = useFormatter();
  const { user: authUser, token, setAuth } = useAuthStore();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    budgetMin: '' as string | number,
    budgetMax: '' as string | number,
  });

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await userService.getMe();
      setData(me);
      setForm({
        fullName: me.fullName ?? '',
        phone: me.phone ?? '',
        gender: me.gender ?? '',
        dateOfBirth: me.dateOfBirth ? me.dateOfBirth.slice(0, 10) : '',
        budgetMin: me.budgetMin ?? '',
        budgetMax: me.budgetMax ?? '',
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleResendVerification = async () => {
    setSendingVerify(true);
    setVerifyMsg(null);
    try {
      await authService.resendVerificationEmail();
      setVerifyMsg(t('verification.sent'));
    } catch (e) {
      setVerifyMsg((e as Error).message);
    } finally {
      setSendingVerify(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await userService.updateProfile({
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        budgetMin:
          typeof form.budgetMin === 'number' ? form.budgetMin : form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax:
          typeof form.budgetMax === 'number' ? form.budgetMax : form.budgetMax ? Number(form.budgetMax) : undefined,
      });

      setData(updated);
      setEditing(false);

      if (token && authUser && (updated.fullName !== authUser.name || updated.email !== authUser.email)) {
        setAuth({ ...authUser, name: updated.fullName || updated.email, email: updated.email }, token);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0,
    });

  const displayValue = (value?: string | null) => value || t('fallback.empty');

  const roleLabel = data?.role ? t(`roles.${data.role.toLowerCase()}`) : t('roles.customer');
  const memberSince = data?.createdAt
    ? new Date(data.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const loadingLabel =
    locale === 'vi' ? '\u0110ang t\u1ea3i h\u1ed3 s\u01a1...' : 'Loading profile...';
  const budgetDescription =
    locale === 'vi'
      ? 'Qu\u1ea3n l\u00fd ng\u00e2n s\u00e1ch m\u00f9i h\u01b0\u01a1ng \u0111\u1ec3 h\u1ec7 th\u1ed1ng g\u1ee3i \u00fd ph\u00f9 h\u1ee3p h\u01a1n.'
      : 'Set your fragrance budget so the system can recommend a better fit.';
  const securityDescription =
    locale === 'vi'
      ? 'M\u1eadt kh\u1ea9u v\u00e0 th\u00f4ng tin truy c\u1eadp n\u00ean \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt \u0111\u1ecbnh k\u1ef3 \u0111\u1ec3 t\u00e0i kho\u1ea3n lu\u00f4n an to\u00e0n.'
      : 'Refresh your password and access details regularly to keep the account secure.';
  const overviewTitle =
    locale === 'vi' ? 'T\u1ed5ng quan t\u00e0i kho\u1ea3n' : 'Account overview';
  const overviewDescription =
    locale === 'vi'
      ? 'Th\u00f4ng tin nhanh \u0111\u1ec3 b\u1ea1n theo d\u00f5i t\u00e0i kho\u1ea3n d\u1ec5 h\u01a1n.'
      : 'Quick details to help you track your account more easily.';
  const roleFieldLabel = locale === 'vi' ? 'Vai tr\u00f2' : 'Role';

  const summaryName = data?.fullName || data?.email || t('user_placeholder');
  const profileFields: FieldConfig[] = useMemo(
    () => [
      {
        key: 'fullName',
        label: t('labels.fullName'),
        icon: User,
        value: displayValue(data?.fullName),
      },
      {
        key: 'phone',
        label: t('labels.phone'),
        icon: Phone,
        value: displayValue(data?.phone),
      },
      {
        key: 'email',
        label: t('labels.email'),
        icon: Mail,
        value: displayValue(data?.email),
      },
      {
        key: 'gender',
        label: t('labels.gender'),
        icon: BadgeCheck,
        value: data?.gender ? t(`gender_options.${data.gender.toLowerCase()}`) : t('fallback.empty'),
      },
      {
        key: 'dateOfBirth',
        label: t('labels.dob'),
        icon: CalendarDays,
        value: data?.dateOfBirth
          ? new Date(data.dateOfBirth).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
              dateStyle: 'long',
            })
          : t('fallback.empty'),
      },
    ],
    [data, locale, t],
  );

  const openChangePassword = () => {
    setChangePasswordOpen(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    setChangePasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const closeChangePassword = () => {
    if (changePasswordLoading) return;
    setChangePasswordOpen(false);
  };

  const submitChangePassword = async () => {
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    const { oldPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!oldPassword) {
      setChangePasswordError(t('security.error_old_required'));
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError(t('security.error_new_min'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError(t('security.error_mismatch'));
      return;
    }

    setChangePasswordLoading(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      setChangePasswordSuccess(t('security.success'));
      setTimeout(() => closeChangePassword(), 2000);
    } catch (e: any) {
      setChangePasswordError(e.response?.data?.message || (e as Error).message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const renderFieldValue = (key: string) => {
    if (!editing) {
      const field = profileFields.find((item) => item.key === key);
      return <p className="mt-2 text-base font-medium leading-7 text-foreground">{field?.value || t('fallback.empty')}</p>;
    }

    if (key === 'gender') {
      return (
        <div className="relative mt-3">
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="w-full appearance-none rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
          >
            <option value="">{t('fallback.empty')}</option>
            <option value="MALE">{t('gender_options.male')}</option>
            <option value="FEMALE">{t('gender_options.female')}</option>
            <option value="OTHER">{t('gender_options.other')}</option>
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
            <User className="h-4 w-4" />
          </div>
        </div>
      );
    }

    if (key === 'dateOfBirth') {
      return (
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          className="mt-3 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
        />
      );
    }

    if (key === 'email') {
      return <p className="mt-2 text-base leading-7 text-stone-500 dark:text-stone-400">{data?.email || t('fallback.empty')}</p>;
    }

    const map: Record<string, string | number> = {
      fullName: form.fullName,
      phone: form.phone,
      budgetMin: form.budgetMin,
      budgetMax: form.budgetMax,
    };

    const inputType = key === 'phone' ? 'tel' : key.includes('budget') ? 'number' : 'text';

    return (
      <input
        type={inputType}
        value={map[key] ?? ''}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [key]: inputType === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value,
          }))
        }
        placeholder={key === 'phone' ? t('fallback.placeholder_phone') : ''}
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
      />
    );
  };

  if (loading) {
    return (
      <AuthGuard>
        <main className="mx-auto flex min-h-[420px] max-w-5xl items-center justify-center p-8">
          <div className="glass flex min-h-[220px] w-full max-w-xl items-center justify-center rounded-[2rem] border border-gold/10">
            <div className="flex items-center gap-3 text-base text-stone-500 dark:text-stone-300">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              {loadingLabel}
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-2 sm:px-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(246,238,228,0.68))] p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.75)] backdrop-blur md:p-8 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]">
          <div className="absolute right-[-2rem] top-[-2rem] h-40 w-40 rounded-full bg-gold/12 blur-3xl" />
          <div className="absolute bottom-[-3rem] left-[-3rem] h-44 w-44 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border border-gold/20 bg-white/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)] dark:bg-white/[0.05] md:h-28 md:w-28">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-stone-400 dark:text-stone-500" />
                )}
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-sm font-medium text-gold">
                  <Sparkles className="h-4 w-4" />
                  {roleLabel}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading text-foreground uppercase tracking-tighter leading-tight">{summaryName}</h1>
                  <p className="mt-2 text-base leading-7 text-stone-500 dark:text-stone-300">{t('subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-3 py-2 text-sm text-stone-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
                    <Mail className="h-4 w-4 text-gold" />
                    {data?.email || t('fallback.empty')}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-3 py-2 text-sm text-stone-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
                    <CalendarDays className="h-4 w-4 text-gold" />
                    {memberSince}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-gold/20 bg-white/80 px-5 text-sm font-medium text-foreground transition-all hover:border-gold hover:text-gold dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                >
                  <Edit2 className="h-4 w-4" />
                  {t('edit')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-luxury-black transition-all hover:scale-[1.01] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white/80 px-5 text-sm font-medium text-stone-600 transition-all hover:border-gold hover:text-gold dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300"
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50/90 px-5 py-4 text-sm text-red-600 shadow-[0_20px_45px_-30px_rgba(220,38,38,0.4)] dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading text-foreground uppercase tracking-tight">{t('personal_info')}</h2>
                  <p className="mt-2 text-sm leading-7 text-stone-500 dark:text-stone-400">{t('title')}</p>
                </div>
                <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-stone-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
                  {editing ? t('save') : roleLabel}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {profileFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        'rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]',
                        field.key === 'email' && 'md:col-span-2',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{field.label}</p>
                        </div>
                      </div>
                      {renderFieldValue(field.key)}
                    </div>
                  );
                })}
              </div>
            </div>

            {data?.role === 'CUSTOMER' && (
              <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading text-foreground uppercase tracking-tight">{t('labels.min_budget')}</h2>
                    <p className="mt-2 text-sm leading-7 text-stone-500 dark:text-stone-400">{budgetDescription}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('labels.min_budget')}</p>
                    {editing ? (
                      <input
                        type="number"
                        value={form.budgetMin}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            budgetMin: e.target.value ? Number(e.target.value) : '',
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
                      />
                    ) : (
                      <p className="mt-2 text-xl font-semibold text-gold">
                        {data?.budgetMin != null ? formatCurrency(data.budgetMin) : t('fallback.empty')}
                      </p>
                    )}
                  </div>

                  <div className="rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('labels.max_budget')}</p>
                    {editing ? (
                      <input
                        type="number"
                        value={form.budgetMax}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            budgetMax: e.target.value ? Number(e.target.value) : '',
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
                      />
                    ) : (
                      <p className="mt-2 text-xl font-semibold text-gold">
                        {data?.budgetMax != null ? formatCurrency(data.budgetMax) : t('fallback.empty')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {data?.role === 'CUSTOMER' ? (
              <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
                <AddressManager className="profile-address-manager" />
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-heading text-foreground uppercase tracking-tight">{t('security.title')}</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{t('security.protected')}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-base font-medium text-foreground">{t('security.protected')}</p>
                <p className="mt-2 text-sm leading-7 text-stone-500 dark:text-stone-400">{securityDescription}</p>
              </div>

              <button
                type="button"
                onClick={openChangePassword}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-luxury-black transition-all hover:scale-[1.01] disabled:opacity-50"
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('security.change_password')}
              </button>
            </div>

            <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-heading text-foreground uppercase tracking-tight">{t('verification.title')}</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {data?.emailVerified ? t('verification.verified') : t('verification.unverified')}
                  </p>
                </div>
              </div>

              {data?.emailVerified ? (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-base font-medium">{t('verification.verified')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/75 p-5 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <p className="text-sm leading-7">{t('verification.unverified')}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={sendingVerify}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-gold bg-white/80 px-5 text-sm font-medium text-gold transition-all hover:bg-gold/8 disabled:opacity-50 dark:bg-white/[0.03]"
                  >
                    {sendingVerify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t('verification.resend')}
                  </button>

                  {verifyMsg && <p className="text-sm text-stone-500 dark:text-stone-400">{verifyMsg}</p>}
                </div>
              )}
            </div>

            <div className="glass rounded-[2rem] border border-gold/10 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-heading text-foreground uppercase tracking-tight">{overviewTitle}</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{overviewDescription}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('labels.email')}</p>
                  <p className="mt-2 break-all text-base font-medium text-foreground">{data?.email || t('fallback.empty')}</p>
                </div>
                <div className="rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{roleFieldLabel}</p>
                  <p className="mt-2 text-base font-medium text-foreground">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {changePasswordOpen ? (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeChangePassword();
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass w-full max-w-lg rounded-[2rem] border border-gold/10 bg-background/80 p-6 shadow-2xl md:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{t('security.change_password')}</h2>
                  <p className="mt-2 text-sm leading-7 text-stone-500 dark:text-stone-400">{t('security.modal_subtitle')}</p>
                </div>

                <button
                  type="button"
                  onClick={closeChangePassword}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-stone-500 transition-colors hover:border-gold hover:text-gold dark:border-white/10 dark:text-stone-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('security.old_password')}</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={changePasswordForm.oldPassword}
                      onChange={(e) => setChangePasswordForm((f) => ({ ...f, oldPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 pr-12 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-500 transition-colors hover:text-gold"
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('security.new_password')}</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={changePasswordForm.newPassword}
                      onChange={(e) => setChangePasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 pr-12 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-500 transition-colors hover:text-gold"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('security.confirm_password')}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={changePasswordForm.confirmPassword}
                      onChange={(e) => setChangePasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3.5 pr-12 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-white/[0.04]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-500 transition-colors hover:text-gold"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {(changePasswordError || changePasswordSuccess) && (
                <div
                  className={cn(
                    'mt-5 rounded-2xl px-4 py-3 text-sm',
                    changePasswordError
                      ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
                  )}
                >
                  {changePasswordError || changePasswordSuccess}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeChangePassword}
                  disabled={changePasswordLoading}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black/10 bg-white/80 px-5 text-sm font-medium text-stone-600 transition-all hover:border-gold hover:text-gold disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void submitChangePassword()}
                  disabled={changePasswordLoading}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-luxury-black transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {changePasswordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('security.waiting')}
                    </>
                  ) : (
                    t('security.change_password')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </main>
    </AuthGuard>
  );
}
