'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { storesService, type StoreWithDetails } from '@/services/stores.service';
import { userService } from '@/services/user.service';
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Loader2, Warehouse, Save } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export default function AdminStoresPage() {
  const t = useTranslations('dashboard.admin.stores');
  const [stores, setStores] = useState<StoreWithDetails[]>([]);
  const [staffUsers, setStaffUsers] = useState<{ id: string; email: string; fullName: string | null; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editStore, setEditStore] = useState<StoreWithDetails | null>(null);
  const [assignModal, setAssignModal] = useState<StoreWithDetails | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      const data = await storesService.list();
      setStores(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const list = await userService.adminListUsers('STAFF');
      setStaffUsers(list);
    } catch {
      // optional
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchStaff();
  }, [fetchStores, fetchStaff]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.create({
        name: form.name,
        code: form.code || undefined,
        address: form.address || undefined,
        isActive: form.isActive,
      });
      setModal(null);
      setForm({ name: '', code: '', address: '', isActive: true });
      fetchStores();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStore) return;
    setSaving(true);
    try {
      await storesService.update(editStore.id, {
        name: form.name,
        code: form.code || undefined,
        address: form.address || undefined,
        isActive: form.isActive,
      });
      setModal(null);
      setEditStore(null);
      fetchStores();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirm_delete'))) return;
    try {
      await storesService.remove(id);
      fetchStores();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAssign = async (storeId: string, userId: string) => {
    try {
      await storesService.assignStaff(storeId, userId);
      setAssignModal(null);
      fetchStores();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleUnassign = async (storeId: string, userId: string) => {
    try {
      await storesService.unassignStaff(storeId, userId);
      fetchStores();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openEdit = (s: StoreWithDetails) => {
    setEditStore(s);
    setForm({
      name: s.name,
      code: s.code ?? '',
      address: s.address ?? '',
      isActive: s.isActive ?? true,
    });
    setModal('edit');
  };

  const locale = useLocale();
  const router = useRouter();
  const tx = useTranslations('dashboard.admin.stores_extra');

  const openStockManagement = () => {
    router.push(`/${locale}/dashboard/admin/stores/stock`);
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
        <div className="p-4 sm:p-6 md:p-8 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
                       {t('subtitle')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setForm({ name: '', code: '', address: '', isActive: true });
                            setEditStore(null);
                            setModal('create');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 h-12 sm:h-14 rounded-2xl bg-gold text-primary font-heading text-[10px] uppercase tracking-widest hover:opacity-90 shadow-lg shadow-gold/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> {t('add_new')}
                    </button>
                    <button
                        type="button"
                        onClick={openStockManagement}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 h-12 sm:h-14 rounded-2xl bg-secondary/10 dark:bg-white/5 text-foreground font-heading text-[10px] uppercase tracking-widest hover:bg-gold/10 hover:text-gold border border-stone-200 dark:border-white/5 transition-all active:scale-95 shadow-sm"
                    >
                        <Warehouse className="w-4 h-4" /> {tx('stock_button') || 'Quản lý tồn kho'}
                    </button>
                </div>
            </header>

            {error && (
                <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] uppercase font-black tracking-widest animate-pulse">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-32 flex flex-col items-center gap-6">
                    <Loader2 className="w-10 h-10 animate-spin text-gold opacity-40" />
                    <p className="text-[10px] uppercase font-black tracking-[.5em] text-muted-foreground animate-pulse leading-none italic">{t('messages.loading')}</p>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-10">
                    <div className="hidden md:block glass rounded-[3rem] border border-stone-200 dark:border-white/10 overflow-hidden shadow-2xl">
                        <table className="w-full text-left font-body text-sm border-collapse">
                            <thead className="bg-secondary/10 text-muted-foreground border-b border-border/50">
                                <tr>
                                    <th className="pl-10 py-6 text-[10px] uppercase tracking-widest font-heading opacity-50">{t('columns.name')}</th>
                                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-heading opacity-50">{t('columns.code')}</th>
                                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-heading opacity-50">{t('columns.address')}</th>
                                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-heading opacity-50">{t('columns.staff')}</th>
                                    <th className="pr-10 py-6 text-[10px] uppercase tracking-widest font-heading opacity-50 text-right">{t('columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {stores.map((s) => (
                                    <tr key={s.id} className="hover:bg-gold/[0.03] transition-all duration-500 group">
                                        <td className="pl-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <span className="font-heading uppercase text-sm tracking-tight group-hover:text-gold transition-colors italic">{s.name}</span>
                                                {!s.isActive && (
                                                    <span className="bg-stone-500/10 text-stone-400 border border-stone-200 text-[8px] px-2 py-0.5 rounded-full uppercase italic inline-block">
                                                        {t('status.hidden')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className="text-[10px] text-muted-foreground font-mono tracking-widest opacity-60">{s.code ?? '—'}</span>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className="text-[10px] text-muted-foreground max-w-[250px] truncate block opacity-60">{s.address ?? '—'}</span>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-wrap gap-2">
                                                {(s.users ?? []).map((u) => (
                                                    <span
                                                        key={u.user.id}
                                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/30 border border-border/50 text-[9px] font-heading uppercase tracking-widest shadow-sm group/staff"
                                                    >
                                                        {u.user.fullName || u.user.email}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnassign(s.id, u.user.id)}
                                                            className="text-destructive hover:scale-125 transition-transform"
                                                            title={t('actions.unassign')}
                                                        >
                                                            <UserMinus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setAssignModal(s)}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 text-[9px] text-gold uppercase tracking-widest hover:bg-gold/10 transition-all font-heading"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" /> {t('actions.assign')}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="pr-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(s)}
                                                    className="p-4 min-w-[44px] min-h-[44px] rounded-2xl bg-secondary/30 hover:bg-gold-light hover:text-primary transition-all active:scale-90 flex items-center justify-center"
                                                    title={t('actions.edit')}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-4 min-w-[44px] min-h-[44px] rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                                                    title={t('actions.delete')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD LIST */}
                    <div className="md:hidden space-y-6">
                        {stores.map((s) => (
                            <div key={s.id} className="glass bg-white dark:bg-black/20 rounded-[2.5rem] border border-stone-200 dark:border-white/10 p-6 space-y-6 shadow-xl active:scale-[0.98] transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                           <h3 className="text-lg font-heading uppercase italic tracking-tight">{s.name}</h3>
                                           {!s.isActive && <span className="text-[7px] bg-stone-500/10 px-2 py-0.5 rounded-full uppercase font-black opacity-50 italic">Off</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[9px] font-mono tracking-widest opacity-40">Code: {s.code || 'SYS-DEFAULT'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(s)} className="p-4 min-w-[44px] min-h-[44px] bg-secondary/10 rounded-2xl text-stone-400 hover:text-gold transition-all flex items-center justify-center">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} className="p-4 min-w-[44px] min-h-[44px] bg-red-500/5 rounded-2xl text-stone-400 hover:text-red-500 transition-all flex items-center justify-center">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 rounded-[1.5rem] bg-secondary/10 dark:bg-white/[0.02] border border-border/5 space-y-4">
                                     <div className="space-y-1">
                                        <p className="text-[8px] uppercase tracking-widest font-black opacity-30 italic leading-none">Address</p>
                                        <p className="text-xs text-muted-foreground italic font-serif leading-relaxed line-clamp-2">{s.address || '—'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                   <div className="flex items-center justify-between">
                                      <p className="text-[8px] uppercase tracking-[.4em] font-black opacity-40 italic">Staff Assignment</p>
                                      <button onClick={() => setAssignModal(s)} className="text-[8px] text-gold uppercase font-black tracking-widest hover:underline">+ Assign</button>
                                   </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(s.users ?? []).map((u) => (
                                            <div key={u.user.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/5 text-[9px] font-black uppercase tracking-widest shadow-inner">
                                                {u.user.fullName || u.user.email.split('@')[0]}
                                                <UserMinus onClick={() => handleUnassign(s.id, u.user.id)} className="w-3 h-3 text-red-500 opacity-60" />
                                            </div>
                                        ))}
                                        {s.users?.length === 0 && <span className="text-[9px] italic opacity-30">No staff assigned</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {stores.length === 0 && (
                        <div className="py-40 flex flex-col items-center justify-center glass rounded-[3rem] border border-dashed border-stone-200 dark:border-white/10 opacity-30 text-center px-12">
                            <Warehouse className="w-16 h-16 text-gold mb-8" strokeWidth={0.5} />
                            <p className="font-heading uppercase text-2xl tracking-[.1em] italic">{t('messages.empty')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal create / edit */}
            {(modal === 'create' || modal === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setModal(null)}>
                    <div className="glass rounded-[3rem] border border-stone-200 dark:border-white/10 p-8 sm:p-12 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[80px] pointer-events-none" />

                        <h2 className="text-3xl font-heading uppercase italic tracking-tighter mb-10 gold-gradient">
                            {modal === 'create' ? t('add_new') : t('edit')}
                        </h2>
                        <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('form.name')}</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        placeholder={tx('placeholders.name')}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-950 font-heading text-[16px] sm:text-xs uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('form.code')}</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        placeholder={tx('placeholders.code')}
                                        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                                        className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-950 font-mono text-[16px] sm:text-xs uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('form.address')}</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        placeholder={tx('placeholders.address')}
                                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                        className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-950 font-serif text-[16px] sm:text-sm italic outline-none focus:border-gold transition-all shadow-sm"
                                    />
                                </div>
                                <div className="pt-4 flex items-center gap-4">
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-secondary/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold shadow-inner transition-colors duration-500"></div>
                                        <span className="ml-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('form.status')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-14 rounded-full bg-gold text-primary font-heading text-[10px] uppercase tracking-[.3em] font-black disabled:opacity-50 shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? t('messages.saving') : t('messages.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="flex-1 h-14 rounded-full border border-stone-200 dark:border-white/5 font-heading text-[10px] uppercase tracking-[.3em] font-black hover:bg-secondary/50 transition-all active:scale-95 opacity-50 hover:opacity-100"
                                >
                                    {t('messages.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign staff modal */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setAssignModal(null)}>
                    <div className="glass rounded-[3rem] border border-stone-200 dark:border-white/10 p-8 sm:p-12 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-heading uppercase tracking-tighter mb-2 italic gold-gradient">
                            {t('modal.assign_title', { name: assignModal.name })}
                        </h2>
                        <p className="text-[10px] text-muted-foreground mb-10 uppercase tracking-[.4em] font-black opacity-50 italic leading-none">
                            {t('modal.assign_desc')}
                        </p>
                        <ul className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2 py-2">
                            {staffUsers
                                .filter((u) => !assignModal.users?.some((x) => x.user.id === u.id))
                                .map((u) => (
                                    <li key={u.id} className="flex items-center justify-between p-5 rounded-2xl bg-secondary/10 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 hover:border-gold/30 transition-all group shadow-sm">
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-[11px] font-heading uppercase tracking-widest italic group-hover:text-gold transition-colors">{u.fullName || tx('unnamed_staff')}</span>
                                            <span className="text-[9px] text-muted-foreground font-mono opacity-50">{u.email}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAssign(assignModal.id, u.id)}
                                            className="h-10 px-6 rounded-xl bg-gold/10 text-gold text-[9px] font-heading uppercase tracking-widest hover:bg-gold hover:text-primary transition-all active:scale-90 font-black shadow-inner"
                                        >
                                            {t('modal.assign_btn')}
                                        </button>
                                    </li>
                                ))}
                            {staffUsers.filter((u) => !assignModal.users?.some((x) => x.user.id === u.id)).length === 0 && (
                                <li className="py-20 text-center opacity-30 italic font-serif flex flex-col items-center gap-4">
                                     <Loader2 className="w-10 h-10 animate-pulse text-gold/20" strokeWidth={0.5} />
                                     <p className="text-xs">{t('modal.none_available')}</p>
                                </li>
                            )}
                        </ul>
                        <button
                            type="button"
                            onClick={() => setAssignModal(null)}
                            className="mt-10 w-full h-14 rounded-full border border-stone-200 dark:border-white/5 font-heading text-[10px] uppercase tracking-[.3em] font-black hover:bg-secondary transition-all active:scale-95 opacity-50 hover:opacity-100"
                        >
                            {t('modal.close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </AuthGuard>
  );
}
