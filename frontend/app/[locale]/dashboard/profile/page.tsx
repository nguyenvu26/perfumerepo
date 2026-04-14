'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { AddressManager } from '@/components/address/address-manager';
import { User, Mail, Shield, Edit2, Loader2, CheckCircle, Send, Phone, Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale, useFormatter } from 'next-intl';

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
    loadProfile();
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
        budgetMin: typeof form.budgetMin === 'number' ? form.budgetMin : form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: typeof form.budgetMax === 'number' ? form.budgetMax : form.budgetMax ? Number(form.budgetMax) : undefined,
      });
      setData(updated);
      setEditing(false);
      if (token && authUser && (updated.fullName !== authUser.name || updated.email !== authUser.email)) {
        setAuth(
          { ...authUser, name: updated.fullName || updated.email, email: updated.email },
          token,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0
    });
  };

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
    if (!oldPassword) return setChangePasswordError(t('security.error_old_required'));
    if (!newPassword || newPassword.length < 6) return setChangePasswordError(t('security.error_new_min'));
    if (newPassword !== confirmPassword) return setChangePasswordError(t('security.error_mismatch'));
    
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

  if (loading) {
    return (
      <AuthGuard>
        <main className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="p-8 max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">
            {t('subtitle')}
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="glass p-10 rounded-[3.5rem] border-gold/10 text-center relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-secondary mx-auto mb-6 relative overflow-hidden border-2 border-border flex items-center justify-center">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground/50" />
                )}
              </div>
              <h2 className="font-heading text-xl text-foreground uppercase tracking-widest mb-1">
                {data?.fullName || data?.email || t('user_placeholder')}
              </h2>
              <p className="text-[10px] text-gold uppercase tracking-[0.3em] font-bold">
                {data?.role ? t(`roles.${data.role.toLowerCase()}`) : t('roles.customer')}
              </p>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border-border space-y-6">
              <h3 className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                {t('security.title')}
              </h3>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-foreground">
                <Shield className="w-4 h-4 text-gold shadow-lg shadow-gold/20" />
                <span>{t('security.protected')}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={openChangePassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-primary text-[10px] uppercase font-heading tracking-widest hover:scale-[1.01] transition-all disabled:opacity-50"
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {t('security.change_password')}
                </button>
              </div>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border-border space-y-4">
              <h3 className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                {t('verification.title')}
              </h3>
              {data?.emailVerified ? (
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('verification.verified')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground leading-relaxed">
                    {t('verification.unverified')}
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={sendingVerify}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-gold text-gold text-[10px] font-heading uppercase tracking-widest hover:bg-gold/10 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {sendingVerify ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {t('verification.resend')}
                  </button>
                  {verifyMsg && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">{verifyMsg}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-10 rounded-[3.5rem] border-border shadow-xl">
              <div className="flex justify-between items-center mb-12 border-b border-border pb-6">
                <h3 className="font-heading text-lg uppercase tracking-[.2em]">{t('personal_info')}</h3>
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-gold text-[10px] uppercase font-black tracking-widest hover:tracking-[.3em] transition-all"
                  >
                    <Edit2 className="w-3 h-3" /> {t('edit')}
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold text-primary text-[10px] uppercase font-black tracking-widest disabled:opacity-50 shadow-lg shadow-gold/20"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} {t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-6 py-2.5 rounded-full border border-border text-[10px] uppercase font-black tracking-widest hover:bg-muted-foreground/5"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                    {t('labels.fullName')}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all"
                    />
                  ) : (
                    <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3">
                      {data?.fullName || t('fallback.empty')}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                    {t('labels.phone')}
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all"
                      placeholder={t('fallback.placeholder_phone')}
                    />
                  ) : (
                    <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gold/60" />
                      {data?.phone || t('fallback.empty')}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                    {t('labels.email')}
                  </label>
                  <p className="font-bold text-[10px] opacity-40 lowercase tracking-wider border-b border-border/30 pb-3 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gold/30" />
                    {data?.email || t('fallback.empty')}
                  </p>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                    {t('labels.gender')}
                  </label>
                  {editing ? (
                    <select
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{t('fallback.empty')}</option>
                      <option value="MALE">{t('gender_options.male')}</option>
                      <option value="FEMALE">{t('gender_options.female')}</option>
                      <option value="OTHER">{t('gender_options.other')}</option>
                    </select>
                  ) : (
                    <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3">
                      {data?.gender ? t(`gender_options.${data.gender.toLowerCase()}`) : t('fallback.empty')}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                    {t('labels.dob')}
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all cursor-pointer"
                    />
                  ) : (
                    <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3">
                      {data?.dateOfBirth
                        ? new Date(data.dateOfBirth).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long' })
                        : t('fallback.empty')}
                    </p>
                  )}
                </div>
                <div className="space-y-4 md:col-span-2">
                  {data?.role === 'CUSTOMER' ? (
                    <div className="pt-6 border-t border-border/40">
                      <AddressManager />
                    </div>
                  ) : null}
                </div>
                {data?.role === 'CUSTOMER' && (
                  <>
                    <div className="space-y-4">
                      <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                        {t('labels.min_budget')}
                      </label>
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
                          className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all"
                        />
                      ) : (
                        <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3 text-gold">
                          {data?.budgetMin != null
                            ? formatCurrency(data.budgetMin)
                            : t('fallback.empty')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-black">
                        {t('labels.max_budget')}
                      </label>
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
                          className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all"
                        />
                      ) : (
                        <p className="font-bold text-[10px] uppercase tracking-widest border-b border-border/30 pb-3 text-gold">
                          {data?.budgetMax != null
                            ? formatCurrency(data.budgetMax)
                            : t('fallback.empty')}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {changePasswordOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeChangePassword();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md glass rounded-[3rem] border border-gold/10 bg-background/70 shadow-2xl shadow-gold/10 p-6 md:p-10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-heading text-foreground uppercase tracking-widest">
                  {t('security.change_password')}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {t('security.modal_subtitle')}
                </p>
              </div>

              <button
                type="button"
                onClick={closeChangePassword}
                className="w-6 h-6 p-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold hover:bg-gold/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changePasswordError ? (
              <div className="mb-4 p-3 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {changePasswordError}
              </div>
            ) : null}
            {changePasswordSuccess ? (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm border border-emerald-500/20">
                {changePasswordSuccess}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                  {t('security.old_password')}
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={changePasswordForm.oldPassword}
                    onChange={(e) =>
                      setChangePasswordForm((f) => ({ ...f, oldPassword: e.target.value }))
                    }
                    className="w-full bg-background/50 border border-border rounded-2xl py-3 px-4 pr-12 text-sm outline-none focus:border-gold transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle old password visibility"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                  {t('security.new_password')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={changePasswordForm.newPassword}
                    onChange={(e) =>
                      setChangePasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    className="w-full bg-background/50 border border-border rounded-2xl py-3 px-4 pr-12 text-sm outline-none focus:border-gold transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                  {t('security.confirm_password')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={changePasswordForm.confirmPassword}
                    onChange={(e) =>
                      setChangePasswordForm((f) => ({
                        ...f,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full bg-background/50 border border-border rounded-2xl py-3 px-4 pr-12 text-sm outline-none focus:border-gold transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                type="button"
                onClick={closeChangePassword}
                disabled={changePasswordLoading}
                className="flex-1 px-4 py-3 rounded-2xl border border-border text-[10px] uppercase tracking-widest font-heading text-stone-500 hover:text-foreground hover:border-gold transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => void submitChangePassword()}
                disabled={changePasswordLoading}
                className="flex-1 px-4 py-3 rounded-2xl bg-gold text-primary-foreground text-[10px] uppercase tracking-widest font-heading hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {changePasswordLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('security.waiting')}
                  </span>
                ) : (
                  t('security.change_password')
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
