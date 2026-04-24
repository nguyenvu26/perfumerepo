'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { storesService, type StoreWithDetails } from '@/services/stores.service';
import { userService } from '@/services/user.service';
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Loader2, Warehouse, Save, X, MapPin, Activity, Info, ShieldCheck, Lock, History } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

export default function AdminStoresPage() {
  const t = useTranslations('dashboard.admin.stores');
  const { isSidebarCollapsed: isCollapsed, setModalOpen } = useUIStore();
  const [stores, setStores] = useState<StoreWithDetails[]>([]);
  const [staffUsers, setStaffUsers] = useState<{ id: string; email: string; fullName: string | null; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editStore, setEditStore] = useState<StoreWithDetails | null>(null);
  const [assignModal, setAssignModal] = useState<StoreWithDetails | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const handleSetModal = (m: 'create' | 'edit' | null) => {
    setModal(m);
    setModalOpen(!!m);
  };

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
      handleSetModal(null);
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
      handleSetModal(null);
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
    handleSetModal('edit');
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
                <div className="space-y-4">
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
                            handleSetModal('create');
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gold text-primary-foreground h-14 sm:h-16 px-10 rounded-full font-black uppercase tracking-[.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20"
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" /> {t('add_new')}
                    </button>
                    <button
                        type="button"
                        onClick={openStockManagement}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 h-14 sm:h-16 rounded-full bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[.2em] hover:bg-secondary transition-all active:scale-95 shadow-lg"
                    >
                        <Warehouse className="w-5 h-5 opacity-60 flex-shrink-0" /> {tx('stock_button') || 'Quản lý tồn kho'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/${locale}/dashboard/admin/daily-closing`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 h-14 sm:h-16 rounded-full bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[.2em] hover:bg-secondary transition-all active:scale-95 shadow-lg"
                    >
                        <History className="w-5 h-5 opacity-60 flex-shrink-0 text-gold" /> Lịch sử chốt ca
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
                                           {!s.isActive && <span className="text-[7px] bg-stone-500/10 px-2 py-0.5 rounded-full uppercase font-black opacity-50 italic">{t('status.hidden')}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[9px] font-mono tracking-widest opacity-40">{t('columns.code')}: {s.code || '—'}</span>
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
                                        <p className="text-[8px] uppercase tracking-widest font-black opacity-30 italic leading-none">{t('columns.address')}</p>
                                        <p className="text-xs text-muted-foreground italic font-serif leading-relaxed line-clamp-2">{s.address || '—'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                   <div className="flex items-center justify-between">
                                      <p className="text-[8px] uppercase tracking-[.4em] font-black opacity-40 italic">{t('columns.staff')}</p>
                                      <button onClick={() => setAssignModal(s)} className="text-[8px] text-gold uppercase font-black tracking-widest hover:underline">+ {t('actions.assign')}</button>
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

            <AnimatePresence>
                {modal && (
                    <div className={cn(
                        "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
                        "left-0 md:left-20",
                        !isCollapsed && "lg:left-72"
                    )} onClick={() => handleSetModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="shrink-0 p-8 sm:px-14 sm:py-10 border-b border-white/10 flex justify-between items-center bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <div className="flex items-center gap-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-px bg-gold" />
                                            <span className="text-[9px] uppercase tracking-[.4em] font-black text-gold/80">Kiến Trúc Mạng Lưới</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                                            {modal === 'create' ? t('add_new') : t('edit')}
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSetModal(null)}
                                    className="w-12 h-12 rounded-full bg-secondary/10 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                 {/* Sidebar */}
                                 <aside className="w-72 border-r border-white/10 bg-white/80 dark:bg-zinc-900/60 overflow-y-auto hidden md:block">
                                     <nav className="p-10 space-y-3">
                                         <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-gold text-primary shadow-lg shadow-gold/20 font-black uppercase tracking-widest text-[10px] relative overflow-hidden">
                                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30" />
                                             <Info className="w-4 h-4" />
                                             Tổng Quan
                                         </button>
                                         <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-muted-foreground hover:bg-secondary/50 font-black uppercase tracking-widest text-[10px] opacity-40 cursor-not-allowed">
                                             <MapPin className="w-4 h-4 text-gold/60" />
                                             Vị Trí Tọa Độ
                                         </button>
                                     </nav>
                                    <div className="p-10 mt-10">
                                        <div className="p-6 rounded-3xl bg-gold/5 border border-gold/10">
                                            <p className="text-[9px] uppercase tracking-widest font-black text-gold/60 leading-relaxed italic">
                                                Lưu ý: Mã định danh cửa hàng (Code) được sử dụng để đồng bộ dữ liệu tồn kho.
                                            </p>
                                        </div>
                                    </div>
                                </aside>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-14 pb-32 sm:pb-14">
                                    <form id="storeForm" onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="max-w-2xl space-y-12">
                                        <div className="space-y-2 border-l-4 border-gold pl-6 mb-10">
                                            <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Bản Sắc Thực Thể</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black italic">Xác lập danh tính và mã định danh vật lý.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.name')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.name}
                                                    placeholder={tx('placeholders.name') || 'Tên điểm bán...'}
                                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                    className="w-full h-16 bg-secondary/10 border border-border/50 rounded-2xl px-8 text-sm font-bold outline-none focus:border-gold transition-all placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.code')}</label>
                                                <input
                                                    type="text"
                                                    value={form.code}
                                                    placeholder={tx('placeholders.code') || 'STORE-XXXX'}
                                                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                                                    className="w-full h-16 bg-secondary/10 border border-border/50 rounded-2xl px-8 font-mono text-sm font-bold uppercase tracking-widest outline-none focus:border-gold transition-all placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.address')} *</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gold transition-all group-focus-within:scale-110">
                                                    <MapPin size={22} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.address}
                                                    placeholder={tx('placeholders.address') || 'Số nhà, Phố, Quận, Thành phố...'}
                                                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                                    className="w-full h-16 bg-secondary/10 border border-border/50 rounded-2xl pl-16 pr-8 text-sm font-bold outline-none focus:border-gold transition-all placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-10 bg-zinc-50 dark:bg-zinc-900/40 rounded-[3rem] border border-border/50 flex items-center justify-between shadow-inner">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500",
                                                    form.isActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-200 dark:bg-white/5 text-muted-foreground"
                                                )}>
                                                    <Activity size={22} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[12px] uppercase tracking-[.2em] font-black">{t('form.status')}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{form.isActive ? 'Hiện diện vật lý đang kích hoạt' : 'Thực thể đang tạm ngưng phục vụ'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                                className={cn(
                                                    "relative w-16 h-9 rounded-full transition-all duration-500",
                                                    form.isActive ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-zinc-300 dark:bg-zinc-800"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-500 shadow-md",
                                                    form.isActive ? "left-8" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 h-28 border-t border-white/10 px-12 flex items-center justify-end gap-6 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="px-10 py-4 rounded-full text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-foreground transition-all active:scale-95 font-heading"
                                >
                                    {t('messages.cancel') || 'HUỶ BỎ'}
                                </button>
                                <button
                                    type="submit"
                                    form="storeForm"
                                    disabled={saving}
                                    className="px-16 py-5 rounded-full bg-gold text-primary-foreground font-heading text-[11px] uppercase tracking-[.3em] font-black disabled:opacity-50 shadow-2xl shadow-gold/30 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('messages.saving') || 'ĐANG LƯU...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {modal === 'create' ? (t('messages.save') || 'XÁC LẬP THỰC THỂ') : (t('messages.save') || 'CẬP NHẬT BIẾN THỂ')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign staff modal */}
            <AnimatePresence>
                {assignModal && (
                    <div className={cn(
                        "fixed top-0 bottom-0 right-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
                        "left-0 md:left-20",
                        !isCollapsed && "lg:left-72"
                    )} onClick={() => setAssignModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] h-full max-h-[70vh] bg-background border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col glass"
                            onClick={(e) => e.stopPropagation()}
                        >

                            
                            {/* Header */}
                            <div className="shrink-0 p-8 sm:px-14 sm:py-10 border-b border-white/10 flex justify-between items-center bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <div className="flex items-center gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-px bg-gold" />
                                            <span className="text-[9px] uppercase tracking-[.4em] font-black text-gold/80">Quản Trị Điều Phối</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                                            {t('modal.assign_title', { name: assignModal.name })}
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAssignModal(null)}
                                    className="w-12 h-12 rounded-full bg-secondary/10 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 sm:p-14">
                                <div className="space-y-6">
                                    {staffUsers
                                        .filter((u) => !assignModal.users?.some((x) => x.user.id === u.id))
                                        .map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between p-6 sm:p-8 rounded-[2.5rem] border border-white/5 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-gold/5 hover:border-gold/30 transition-all group shadow-sm active:scale-[0.99] duration-500"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center group-hover:bg-gold group-hover:text-primary transition-all duration-500 shadow-xl border border-white/5">
                                                        <Warehouse size={22} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-heading uppercase tracking-[.4em] leading-none mb-1 group-hover:text-gold transition-colors font-black">
                                                            {u.fullName || tx('unnamed_staff')}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-40">{u.email}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAssign(assignModal.id, u.id)}
                                                    className="h-14 px-8 rounded-full bg-gold text-primary font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20 flex items-center gap-2 group/btn"
                                                >
                                                    <UserPlus size={18} />
                                                    {t('modal.assign_btn')}
                                                </button>
                                            </div>
                                        ))}
                                    
                                    {staffUsers.filter((u) => !assignModal.users?.some((x) => x.user.id === u.id)).length === 0 && (
                                        <div className="py-24 text-center glass rounded-[4rem] border border-dashed border-white/10 opacity-30 italic font-heading">
                                            <Info size={48} className="mx-auto mb-6 text-gold/20" strokeWidth={0.5} />
                                            <p className="text-xl tracking-widest uppercase">{t('modal.none_available')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 h-28 border-t border-white/10 px-12 flex items-center justify-end bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <button
                                    type="button"
                                    onClick={() => setAssignModal(null)}
                                    className="px-14 py-5 rounded-full bg-secondary/10 border border-white/10 font-heading text-[11px] uppercase tracking-[.3em] font-black hover:bg-white/5 transition-all active:scale-95"
                                >
                                    {t('modal.close') || 'HOÀN TẤT'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </AuthGuard>
  );
}
