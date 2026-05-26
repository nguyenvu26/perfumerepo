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
  LucideIcon,
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
  icon: LucideIcon;
  value: string;
};

export default function ProfilePage() {
  const t = useTranslations('dashboard.profile');
  const tFeatured = useTranslations('featured');
  const locale = useLocale();
  const isVi = locale === 'vi';
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
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#ffffff_36%,#fbfaf7_100%)] transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c10_35%,#09090b_100%)]">
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          {/* Hero Header Section */}
          <section className="relative mb-16 overflow-hidden rounded-[3rem] border border-black/5 bg-white shadow-2xl dark:border-white/5 dark:bg-zinc-900/40">
            {/* Banner/Cover Background */}
            <div className="h-48 w-full bg-[linear-gradient(135deg,rgba(197,160,89,0.2)_0%,rgba(197,160,89,0.05)_100%)] dark:bg-[linear-gradient(135deg,rgba(197,160,89,0.1)_0%,rgba(0,0,0,0)_100%)]" />
            
            <div className="relative -mt-16 flex flex-col items-center px-10 pb-12 text-center md:flex-row md:items-end md:text-left">
              <div className="relative">
                <div className="h-40 w-40 overflow-hidden rounded-full border-8 border-white bg-white shadow-xl dark:border-zinc-900 dark:bg-zinc-800">
                  {data?.avatarUrl ? (
                    <img src={data.avatarUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary/10 text-gold/30">
                      <User className="h-20 w-20" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <button 
                  className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-luxury-black shadow-lg shadow-gold/20 transition-transform hover:scale-110 active:scale-95"
                  title={t('edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 flex-1 md:ml-10 md:mt-24">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                      <h1 className="text-4xl font-heading italic gold-gradient tracking-tight">{summaryName}</h1>
                      <div className="flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1 border border-gold/20">
                         <Sparkles className="h-3.5 w-3.5 text-gold" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-gold">{roleLabel}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-start">
                      <div className="flex items-center gap-2">
                         <Mail className="h-3.5 w-3.5 opacity-40" />
                         <span className="italic">{data?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <CalendarDays className="h-3.5 w-3.5 opacity-40" />
                         <span className="italic">{t('member_since')}: {memberSince}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-4 md:pt-0">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="group flex h-12 items-center justify-center gap-3 rounded-full border border-black/5 bg-background px-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-gold hover:text-luxury-black hover:border-gold hover:shadow-xl hover:shadow-gold/20 active:scale-95 shadow-md dark:border-white/10"
                      >
                         <Edit2 className="h-3.5 w-3.5" />
                         {t('edit')}
                      </button>
                    ) : (
                      <div className="flex gap-3">
                         <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="flex h-12 items-center justify-center rounded-full border border-black/5 bg-background px-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:border-white/10"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="flex h-12 items-center justify-center gap-3 rounded-full bg-gold px-10 text-[10px] font-black uppercase tracking-[0.2em] text-luxury-black transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-gold/20 active:scale-95 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {t('save')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] border border-red-500/20 bg-red-500/5 px-8 py-4 text-sm font-medium text-red-500 backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <div className="glass overflow-hidden rounded-[4rem] border border-black/5 bg-white shadow-3xl dark:border-white/10 dark:bg-zinc-900/40">
             <div className="grid gap-0 lg:grid-cols-12 divide-x divide-black/5 dark:divide-white/5">
                
                {/* Left Side: Information Flow */}
                <div className="lg:col-span-8 divide-y divide-black/5 dark:divide-white/5">
                   
                   {/* Personal Information */}
                   <section className="p-12 sm:p-16">
                      <div className="flex items-center justify-between mb-12">
                         <div>
                            <h2 className="text-3xl font-heading italic tracking-tight">{t('personal_info')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold opacity-40 mt-1">{t('title')}</p>
                         </div>
                         <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gold/5 text-gold/30">
                            <User className="h-6 w-6" strokeWidth={1} />
                         </div>
                      </div>
                      
                      <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
                         {profileFields.map((field) => (
                            <div key={field.key} className={cn("space-y-4", field.key === 'email' && "sm:col-span-2")}>
                               <div className="flex items-center gap-3">
                                  <field.icon className="h-3.5 w-3.5 text-gold/40" strokeWidth={2} />
                                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                                    {field.label}
                                  </label>
                               </div>
                               <div className="pl-6 border-l border-gold/10">
                                  {renderFieldValue(field.key)}
                               </div>
                            </div>
                         ))}
                      </div>
                   </section>

                   {/* Address Management */}
                   {data?.role === 'CUSTOMER' && (
                     <section className="p-12 sm:p-16">
                        <div className="flex items-center justify-between mb-12">
                           <div>
                              <h2 className="text-3xl font-heading italic tracking-tight">{isVi ? 'Địa chỉ giao hàng' : 'Shipping Addresses'}</h2>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold opacity-40 mt-1">
                                {isVi ? 'Quản lý điểm nhận hàng.' : 'Delivery locations.'}
                              </p>
                           </div>
                           <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gold/5 text-gold/30">
                              <BadgeCheck className="h-6 w-6" strokeWidth={1} />
                           </div>
                        </div>
                        <div className="px-2">
                           <AddressManager className="profile-address-manager" />
                        </div>
                     </section>
                   )}
                </div>

                {/* Right Side: Sidebar Stats & Security */}
                <div className="lg:col-span-4 bg-black/[0.02] dark:bg-white/[0.01] divide-y divide-black/5 dark:divide-white/5">
                   
                   {/* Budget Section */}
                   {data?.role === 'CUSTOMER' && (
                     <section className="p-12">
                        <div className="flex items-center justify-between mb-10">
                           <h2 className="text-2xl font-heading italic tracking-tight leading-none">{isVi ? 'Ngân sách' : 'Budget'}</h2>
                           <Wallet className="h-5 w-5 text-gold/30" strokeWidth={1} />
                        </div>

                        <div className="space-y-8">
                           {editing ? (
                              <div className="grid gap-4">
                                 {[
                                   { label: 'Min', key: 'budgetMin' },
                                   { label: 'Max', key: 'budgetMax' }
                                 ].map((item) => (
                                    <div key={item.key} className="space-y-2">
                                       <label className="text-[9px] font-black uppercase tracking-widest text-gold/40">{item.label}</label>
                                       <div className="rounded-xl bg-background/50 p-4 border border-black/5 dark:border-white/5">
                                          <input
                                             type="number"
                                             value={form[item.key as 'budgetMin' | 'budgetMax']}
                                             onChange={(e) => setForm(f => ({ ...f, [item.key]: e.target.value ? Number(e.target.value) : '' }))}
                                             className="w-full bg-transparent text-sm font-heading italic outline-none text-gold"
                                           />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="relative py-10">
                                 <div className="relative h-1 w-full bg-black/5 dark:bg-white/10 rounded-full">
                                    <div className={cn(
                                      "absolute inset-0 transition-all",
                                      (data?.budgetMin != null || data?.budgetMax != null) ? "bg-gold/20 shadow-[0_0_15px_rgba(197,160,89,0.2)]" : "bg-dashed opacity-10"
                                    )} />
                                 </div>

                                 <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center">
                                    <div className={cn(
                                      "h-3 w-3 rounded-full transition-all z-20",
                                      data?.budgetMin != null ? "bg-gold shadow-lg shadow-gold/30" : "bg-zinc-800"
                                    )} />
                                    <div className="text-center absolute top-5 left-0">
                                       <p className="text-[12px] font-heading italic gold-gradient">
                                          {data?.budgetMin != null ? formatCurrency(data.budgetMin) : 'Min ---'}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center">
                                    <div className={cn(
                                      "h-3 w-3 rounded-full transition-all z-20",
                                      data?.budgetMax != null ? "bg-gold shadow-lg shadow-gold/30" : "bg-zinc-800"
                                    )} />
                                    <div className="text-center absolute top-5 right-0">
                                       <p className="text-[12px] font-heading italic gold-gradient">
                                          {data?.budgetMax != null ? formatCurrency(data.budgetMax) : 'Max ---'}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           )}

                           <div className="pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-gold opacity-50">{isVi ? 'Tích lũy' : 'Loyalty'}</p>
                                 <p className="text-3xl font-heading italic leading-none">{data?.loyaltyPoints || 0} pts</p>
                              </div>
                              <div className="flex h-10 items-center justify-center rounded-full bg-gold/5 px-4 border border-gold/10">
                                 <Sparkles className="h-3.5 w-3.5 text-gold mr-2" />
                                 <span className="text-[8px] font-black uppercase tracking-widest text-gold">Elite</span>
                              </div>
                           </div>
                        </div>
                     </section>
                   )}

                   {/* Security Section */}
                   <section className="p-12">
                      <div className="flex items-center justify-between mb-8">
                         <h2 className="text-2xl font-heading italic tracking-tight leading-none">{t('security.title')}</h2>
                         <Shield className="h-5 w-5 text-gold/30" strokeWidth={1} />
                      </div>

                      <div className="space-y-4">
                          <button
                            type="button"
                            onClick={openChangePassword}
                            className="group flex h-14 w-full items-center justify-between rounded-2xl bg-black/5 px-6 transition-all hover:bg-gold dark:bg-white/5"
                          >
                             <span className="text-[9px] font-black uppercase tracking-widest text-foreground group-hover:text-luxury-black transition-colors">{t('security.change_password')}</span>
                             <Edit2 className="h-3.5 w-3.5 opacity-20 group-hover:text-luxury-black transition-colors" />
                          </button>

                          <div className={cn(
                            "flex h-14 w-full items-center justify-between rounded-2xl border px-6",
                            data?.emailVerified ? "border-emerald-500/10 bg-emerald-500/5" : "border-amber-500/10 bg-amber-500/5"
                          )}>
                             <span className={cn(
                               "text-[9px] font-black uppercase tracking-widest",
                               data?.emailVerified ? "text-emerald-600" : "text-amber-600"
                             )}>
                                {data?.emailVerified ? t('verification.verified') : t('verification.unverified')}
                             </span>
                             {!data?.emailVerified && (
                                <button onClick={handleResendVerification} className="text-[9px] font-black uppercase underline text-amber-600/60 hover:text-amber-600">
                                   {sendingVerify ? '...' : t('verification.resend')}
                                </button>
                             )}
                          </div>
                      </div>
                   </section>
                </div>
             </div>
          </div>


          {changePasswordOpen ? (
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur-md"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeChangePassword();
              }}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="glass w-full max-w-xl overflow-hidden rounded-[3.5rem] border border-white/10 bg-zinc-900 p-10 shadow-3xl sm:p-12"
              >
                <div className="mb-12 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold mb-3 opacity-70">Security Protocol</p>
                    <h2 className="text-5xl font-heading italic tracking-tighter leading-none mb-3 text-white">{t('security.change_password')}</h2>
                    <p className="text-xs text-muted-foreground italic leading-relaxed opacity-60">{t('security.modal_subtitle')}</p>
                  </div>

                  <button
                    type="button"
                    onClick={closeChangePassword}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {[
                    { id: 'oldPassword', label: t('security.old_password'), show: showOldPassword, setShow: setShowOldPassword },
                    { id: 'newPassword', label: t('security.new_password'), show: showNewPassword, setShow: setShowNewPassword },
                    { id: 'confirmPassword', label: t('security.confirm_password'), show: showConfirmPassword, setShow: setShowConfirmPassword }
                  ].map((item) => (
                    <div key={item.id} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gold opacity-50">{item.label}</label>
                      <div className="relative">
                        <input
                          type={item.show ? 'text' : 'password'}
                          value={changePasswordForm[item.id as keyof typeof changePasswordForm]}
                          onChange={(e) => setChangePasswordForm(f => ({ ...f, [item.id]: e.target.value }))}
                          className="h-16 w-full rounded-2xl border border-white/5 bg-white/5 px-6 pr-14 text-lg font-medium text-white outline-none focus:ring-1 focus:ring-gold/30 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => item.setShow(!item.show)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-gold"
                        >
                          {item.show ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {(changePasswordError || changePasswordSuccess) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cn(
                      'mt-10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest border text-center',
                      changePasswordError
                        ? 'border-red-500/20 bg-red-500/10 text-red-500'
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
                    )}
                  >
                    {changePasswordError || changePasswordSuccess}
                  </motion.div>
                )}

                <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                   <button
                    type="button"
                    onClick={closeChangePassword}
                    className="flex h-16 flex-1 items-center justify-center rounded-full border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/5 hover:text-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitChangePassword()}
                    disabled={changePasswordLoading}
                    className="flex h-16 flex-[2] items-center justify-center gap-3 rounded-full bg-gold text-[11px] font-black uppercase tracking-[0.3em] text-luxury-black transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold/20 active:scale-95 disabled:opacity-50"
                  >
                    {changePasswordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {t('security.change_password')}
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null}
        </main>
      </div>
    </AuthGuard>
  );
}
