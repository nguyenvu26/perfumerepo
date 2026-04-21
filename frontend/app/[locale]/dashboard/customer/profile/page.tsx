'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { AddressManager } from '@/components/address/address-manager';
import { User, Mail, Shield, Edit2, Loader2, CheckCircle, Send, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';

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
                    <div className="mb-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
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
                            <div className="flex items-center gap-4 text-xs font-body text-foreground">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span>{t('security.protected')}</span>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-[2.5rem] border-border space-y-4">
                            <h3 className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                                {t('verification.title')}
                            </h3>
                            {data?.emailVerified ? (
                                <div className="flex items-center gap-4 text-xs font-body text-emerald-500">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{t('verification.verified')}</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        {t('verification.unverified')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={sendingVerify}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gold text-gold text-[10px] font-heading uppercase tracking-widest hover:bg-gold/10 disabled:opacity-50"
                                    >
                                        {sendingVerify ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                        {t('verification.resend')}
                                    </button>
                                    {verifyMsg && (
                                        <p className="text-[10px] text-muted-foreground">{verifyMsg}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass p-10 rounded-[3rem] border-border">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="font-heading text-lg uppercase tracking-widest">{t('personal_info')}</h3>
                                {!editing ? (
                                    <button
                                        type="button"
                                        onClick={() => setEditing(true)}
                                        className="flex items-center gap-2 text-gold text-[10px] uppercase font-heading tracking-widest hover:underline"
                                    >
                                        <Edit2 className="w-3 h-3" /> {t('edit')}
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-primary text-[10px] uppercase font-heading tracking-widest disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} {t('save')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-2 rounded-xl border border-border text-[10px] uppercase font-heading tracking-widest"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
                                        {t('labels.fullName')}
                                    </label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={form.fullName}
                                            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                                        />
                                    ) : (
                                        <p className="font-body text-sm border-b border-border/50 pb-2">
                                            {data?.fullName || t('fallback.empty')}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
                                        {t('labels.phone')}
                                    </label>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                                            placeholder={t('placeholders.phone')}
                                        />
                                    ) : (
                                        <p className="font-body text-sm border-b border-border/50 pb-2 flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            {data?.phone || t('fallback.empty')}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
                                        {t('labels.email')}
                                    </label>
                                    <p className="font-body text-sm border-b border-border/50 pb-2 flex items-center gap-2">
                                        <Mail className="w-3 h-3 text-muted-foreground" />
                                        {data?.email || t('fallback.empty')}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                                        {t('labels.email_immutable')}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
                                        {t('labels.gender')}
                                    </label>
                                    {editing ? (
                                        <div className="relative">
                                            <select
                                                value={form.gender}
                                                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                                                className="w-full px-4 py-3.5 rounded-2xl border border-border/50 bg-zinc-50 dark:bg-white/5 text-[10px] uppercase tracking-widest focus:border-gold outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-white dark:bg-zinc-900">—</option>
                                                <option value="MALE" className="bg-white dark:bg-zinc-900">{t('gender_options.male')}</option>
                                                <option value="FEMALE" className="bg-white dark:bg-zinc-900">{t('gender_options.female')}</option>
                                                <option value="OTHER" className="bg-white dark:bg-zinc-900">{t('gender_options.other')}</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <User size={12} />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="font-body text-sm border-b border-border/50 pb-2">
                                            {data?.gender ? t(`gender_options.${data.gender.toLowerCase()}`) : t('fallback.empty')}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
                                        {t('labels.dob')}
                                    </label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            value={form.dateOfBirth}
                                            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                                        />
                                    ) : (
                                        <p className="font-body text-sm border-b border-border/50 pb-2">
                                            {data?.dateOfBirth
                                                ? format.dateTime(new Date(data.dateOfBirth), { dateStyle: 'long' })
                                                : t('fallback.empty')}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    {data?.role === 'CUSTOMER' ? (
                                        <div className="pt-6 border-t border-border/40">
                                            <AddressManager />
                                        </div>
                                    ) : null}
                                </div>
                                {data?.role === 'CUSTOMER' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
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
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                                                />
                                            ) : (
                                                <p className="font-body text-sm border-b border-border/50 pb-2 text-gold">
                                                    {data?.budgetMin != null
                                                        ? formatCurrency(data.budgetMin)
                                                        : t('fallback.empty')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-heading">
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
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                                                />
                                            ) : (
                                                <p className="font-body text-sm border-b border-border/50 pb-2 text-gold">
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
        </AuthGuard>
    );
}