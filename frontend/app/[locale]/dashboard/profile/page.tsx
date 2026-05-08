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
      return <p className="text-base font-medium text-foreground">{field?.value || t('fallback.empty')}</p>;
    }

    const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all";

    if (key === 'gender') {
      return (
        <select
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          className={cn(inputClasses, "appearance-none")}
        >
          <option value="">{t('fallback.empty')}</option>
          <option value="MALE">{t('gender_options.male')}</option>
          <option value="FEMALE">{t('gender_options.female')}</option>
          <option value="OTHER">{t('gender_options.other')}</option>
        </select>
      );
    }

    if (key === 'dateOfBirth') {
      return (
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          className={inputClasses}
        />
      );
    }

    if (key === 'email') {
      return <p className="text-base text-muted-foreground">{data?.email || t('fallback.empty')}</p>;
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
        className={inputClasses}
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Profile Header */}
        <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative group">
              <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-gold/20 bg-background shadow-sm transition-all group-hover:border-gold/40">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary/20 text-secondary">
                    <User className="h-14 w-14" />
                  </div>
                )}
              </div>
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Edit2 className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-heading tracking-tight text-foreground">{summaryName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="font-medium text-gold/80">{roleLabel}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{data?.email}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{t('member_since')}: {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-all hover:bg-secondary/50 active:scale-95"
              >
                {t('edit')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-all hover:bg-secondary/50 active:scale-95"
                >
                  {t('cancel')}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20">
            {error}
          </div>
        )}

        <div className="divide-y divide-border border-y border-border">
          {/* Personal Information Section */}
          <section className="py-10">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground">{t('personal_info')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('title')}</p>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                  {profileFields.map((field) => (
                    <div key={field.key} className={cn(field.key === 'email' && "sm:col-span-2")}>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {field.label}
                      </label>
                      <div className="mt-2">
                        {renderFieldValue(field.key)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Budget & Customization Section */}
          {data?.role === 'CUSTOMER' && (
            <section className="py-10">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <h2 className="text-lg font-semibold text-foreground">{t('labels.min_budget')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{budgetDescription}</p>
                </div>
                <div className="lg:col-span-2">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {t('labels.min_budget')}
                      </label>
                      <div className="mt-2">
                        {editing ? (
                          <input
                            type="number"
                            value={form.budgetMin}
                            onChange={(e) => setForm(f => ({ ...f, budgetMin: e.target.value ? Number(e.target.value) : '' }))}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                          />
                        ) : (
                          <p className="text-xl font-medium text-gold">
                            {data?.budgetMin != null ? formatCurrency(data.budgetMin) : t('fallback.empty')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {t('labels.max_budget')}
                      </label>
                      <div className="mt-2">
                        {editing ? (
                          <input
                            type="number"
                            value={form.budgetMax}
                            onChange={(e) => setForm(f => ({ ...f, budgetMax: e.target.value ? Number(e.target.value) : '' }))}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                          />
                        ) : (
                          <p className="text-xl font-medium text-gold">
                            {data?.budgetMax != null ? formatCurrency(data.budgetMax) : t('fallback.empty')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Address Management */}
          {data?.role === 'CUSTOMER' && (
            <section className="py-10">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <h2 className="text-lg font-semibold text-foreground">{locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Addresses'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {locale === 'vi' ? 'Quản lý các địa điểm nhận hàng của bạn.' : 'Manage your delivery locations.'}
                  </p>
                </div>
                <div className="lg:col-span-2">
                  <AddressManager className="profile-address-manager" />
                </div>
              </div>
            </section>
          )}

          {/* Security & Verification Section */}
          <section className="py-10">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground">{t('security.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{securityDescription}</p>
              </div>
              <div className="lg:col-span-2 space-y-10">
                {/* Password Change */}
                <div className="flex items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-secondary/10">
                  <div>
                    <h3 className="font-medium text-foreground">{t('security.change_password')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('security.protected')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openChangePassword}
                    className="shrink-0 h-10 px-6 rounded-full border border-border bg-background text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    {t('security.change_password')}
                  </button>
                </div>

                {/* Email Verification */}
                <div className="flex items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-secondary/10">
                  <div>
                    <h3 className="font-medium text-foreground">{t('verification.title')}</h3>
                    <p className={cn(
                      "text-sm mt-1",
                      data?.emailVerified ? "text-success" : "text-amber-600 dark:text-amber-500"
                    )}>
                      {data?.emailVerified ? t('verification.verified') : t('verification.unverified')}
                    </p>
                  </div>
                  {!data?.emailVerified && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={sendingVerify}
                      className="shrink-0 h-10 px-6 rounded-full bg-gold text-sm font-bold text-luxury-black hover:bg-gold/90 transition-colors disabled:opacity-50"
                    >
                      {sendingVerify ? <Loader2 className="h-4 w-4 animate-spin" /> : t('verification.resend')}
                    </button>
                  )}
                  {data?.emailVerified && (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>


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
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg rounded-2xl bg-background p-8 shadow-2xl border border-border"
            >
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{t('security.change_password')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('security.modal_subtitle')}</p>
                </div>

                <button
                  type="button"
                  onClick={closeChangePassword}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {[
                  { id: 'oldPassword', label: t('security.old_password'), show: showOldPassword, setShow: setShowOldPassword },
                  { id: 'newPassword', label: t('security.new_password'), show: showNewPassword, setShow: setShowNewPassword },
                  { id: 'confirmPassword', label: t('security.confirm_password'), show: showConfirmPassword, setShow: setShowConfirmPassword }
                ].map((item) => (
                  <div key={item.id} className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</label>
                    <div className="relative">
                      <input
                        type={item.show ? 'text' : 'password'}
                        value={changePasswordForm[item.id as keyof typeof changePasswordForm]}
                        onChange={(e) => setChangePasswordForm(f => ({ ...f, [item.id]: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-12 text-base outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => item.setShow(!item.show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                      >
                        {item.show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(changePasswordError || changePasswordSuccess) && (
                <div
                  className={cn(
                    'mt-6 rounded-xl px-4 py-3 text-sm border',
                    changePasswordError
                      ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-950/20'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20',
                  )}
                >
                  {changePasswordError || changePasswordSuccess}
                </div>
              )}

              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeChangePassword}
                  disabled={changePasswordLoading}
                  className="h-11 px-6 rounded-full border border-border bg-background text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void submitChangePassword()}
                  disabled={changePasswordLoading}
                  className="h-11 px-8 rounded-full bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {changePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('security.change_password')}
                </button>
              </div>
            </motion.div>

          </div>
        ) : null}
      </main>
    </AuthGuard>
  );
}
