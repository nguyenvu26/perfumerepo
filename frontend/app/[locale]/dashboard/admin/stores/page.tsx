'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { storesService, type StoreWithDetails } from '@/services/stores.service';
import { userService } from '@/services/user.service';
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Loader2, Warehouse, Save, X, MapPin, Activity, Info, ShieldCheck, Lock, History, Search, Users } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editStore, setEditStore] = useState<StoreWithDetails | null>(null);
  const [assignModal, setAssignModal] = useState<StoreWithDetails | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => {
      setSuccessMessage(prev => prev === msg ? null : prev);
    }, 5000);
  };
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStores = stores.length;
  const totalStaff = stores.reduce((acc, s) => acc + (s.users?.length || 0), 0);
  const totalStockUnits = stores.reduce((acc, s) => acc + (s.totalStockUnits || 0), 0);

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
      const { items } = await userService.adminListUsers({ role: 'STAFF' });
      setStaffUsers(items);
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
      triggerSuccess('Tạo chi nhánh mới thành công!');
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
      triggerSuccess('Cập nhật chi nhánh thành công!');
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
      triggerSuccess('Đã xóa hoặc ẩn chi nhánh thành công!');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAssign = async (storeId: string, userId: string) => {
    try {
      await storesService.assignStaff(storeId, userId);
      setAssignModal(null);
      fetchStores();
      triggerSuccess('Gán nhân sự vào chi nhánh thành công!');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleUnassign = async (storeId: string, userId: string) => {
    try {
      await storesService.unassignStaff(storeId, userId);
      fetchStores();
      triggerSuccess('Đã gỡ nhân sự khỏi chi nhánh!');
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
    <AuthGuard allowedRoles={["admin"]}>
        <div className="p-4 sm:p-6 md:p-8 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">
            <header className="space-y-12 border-b border-white/5 pb-12">
                <div className="space-y-4">
                    <h1 className="text-4xl sm:text-6xl font-heading gold-gradient uppercase tracking-tight italic leading-tight">{t('title')}</h1>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
                    {/* Search Bar (Expands) */}
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted-foreground/40 group-focus-within:text-gold transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm chi nhanh theo tên, mã hiệu hoặc địa chỉ vật lý..."
                            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-foreground text-sm font-medium focus:border-gold/50 focus:bg-black/10 dark:focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Buttons (Fixed) */}
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setForm({ name: '', code: '', address: '', isActive: true });
                                setEditStore(null);
                                handleSetModal('create');
                            }}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-gold text-luxury-black h-16 px-8 rounded-2xl font-black uppercase tracking-[.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 flex-shrink-0" /> {t('add_new')}
                        </button>
                        <button
                            type="button"
                            onClick={openStockManagement}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 h-16 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 text-foreground font-black text-[10px] uppercase tracking-[.2em] hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Warehouse className="w-4 h-4 opacity-60 flex-shrink-0" /> {tx('stock_button') || 'Kho hàng'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/${locale}/dashboard/admin/daily-closing`)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 h-16 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 text-foreground font-black text-[10px] uppercase tracking-[.2em] hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <History className="w-4 h-4 opacity-60 flex-shrink-0 text-gold" /> Đối soát
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] uppercase font-black tracking-widest animate-pulse">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] uppercase font-black tracking-widest flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="text-[10px] opacity-60 hover:opacity-100 transition-opacity">Đóng</button>
                </div>
            )}

            {loading ? (
                <div className="py-32 flex flex-col items-center gap-6">
                    <Loader2 className="w-10 h-10 animate-spin text-gold opacity-40" />
                    <p className="text-[10px] uppercase font-black tracking-[.5em] text-muted-foreground animate-pulse leading-none italic">{t('messages.loading')}</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass bg-white dark:bg-zinc-900/20 p-6 rounded-[2rem] border border-white/10 flex items-center gap-5 hover:border-gold/20 transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                                <Warehouse className="w-6 h-6 text-gold" />
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Tổng cửa hàng / Chi nhánh</p>
                                <h3 className="text-3xl font-heading uppercase italic tracking-tighter mt-1">{totalStores}</h3>
                            </div>
                        </div>
                        <div className="glass bg-white dark:bg-zinc-900/20 p-6 rounded-[2rem] border border-white/10 flex items-center gap-5 hover:border-gold/20 transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Nhân sự gán trực</p>
                                <h3 className="text-3xl font-heading uppercase italic tracking-tighter mt-1">{totalStaff} nhân viên</h3>
                            </div>
                        </div>
                        <div className="glass bg-white dark:bg-zinc-900/20 p-6 rounded-[2rem] border border-white/10 flex items-center gap-5 hover:border-gold/20 transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Activity className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Tổng tồn kho toàn mạng lưới</p>
                                <h3 className="text-3xl font-heading uppercase italic tracking-tighter mt-1">{totalStockUnits.toLocaleString()} sản phẩm</h3>
                            </div>
                        </div>
                    </div>


                    {/* Store Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10">
                        {filteredStores.map((s, idx) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, type: 'spring', damping: 25 }}
                            className="group relative glass bg-white/40 dark:bg-[#0e0e0e]/40 rounded-[2.5rem] border border-black/5 dark:border-white/5 overflow-hidden hover:border-gold/30 transition-all duration-700 shadow-2xl flex flex-col min-h-[520px]"
                        >
                            {/* Card Header */}
                            <div className="p-8 pb-6 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            s.isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-500"
                                        )} />
                                        <span className="text-[9px] font-black uppercase tracking-[.4em] text-gold/60 italic leading-none">
                                            {s.type === 'CENTRAL' ? 'Kho Tổng Trung Tâm' : 'Chi Nhánh Boutique'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(s)} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-gold hover:text-luxury-black transition-all duration-500 text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(s.id)} className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-heading uppercase italic tracking-tighter mb-4 group-hover:text-gold transition-colors duration-500 leading-none truncate">
                                    {s.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 dark:opacity-40">Mã: {s.code || 'NA'}</span>
                                    {s.totalStockUnits !== undefined && (
                                        <div className="flex items-center gap-2 bg-gold/10 border border-gold/10 text-gold px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            <Warehouse className="w-3 h-3" />
                                            {s.totalStockUnits.toLocaleString()} Bản thể sản phẩm
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Content - Standardized Heights */}
                            <div className="p-8 space-y-8 flex-1">
                                {/* Address Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 opacity-40 dark:opacity-20 text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[9px] uppercase tracking-widest font-black italic">Tọa Độ Vật Lý</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/70 dark:text-white/50 font-medium leading-relaxed min-h-[44px] line-clamp-2">
                                        {s.address || 'Địa chỉ thực thể chưa được đồng bộ hóa trên bản đồ mạng lưới lưu thông toàn cầu...'}
                                    </p>
                                </div>

                                {/* Staff Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 opacity-40 dark:opacity-20 text-muted-foreground">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-[9px] uppercase tracking-widest font-black italic">Nhân Sự Bản Địa</span>
                                        </div>
                                        <button onClick={() => setAssignModal(s)} className="text-[9px] font-black uppercase tracking-widest text-gold hover:text-gold/80 dark:hover:text-white transition-all decoration-gold/50 underline-offset-4 hover:underline">+ Điều Phối</button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 min-h-[90px] content-start">
                                        {(s.users ?? []).length > 0 ? (
                                            (s.users ?? []).map((u) => (
                                                <div key={u.user.id} className="group/staff relative flex items-center gap-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-2 pr-4 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-all duration-300">
                                                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold text-[10px] font-black border border-gold/20">
                                                        {(u.user.fullName?.[0] || u.user.email[0]).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                         <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/80 dark:text-white/80 leading-none mb-1">{u.user.fullName || 'Nhân viên'}</span>
                                                         <span className="text-[7px] font-bold uppercase opacity-40 dark:opacity-20 tracking-tighter text-muted-foreground">Verified Staff</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleUnassign(s.id, u.user.id); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/staff:opacity-100 transition-all scale-0 group-hover/staff:scale-100"><X size={8} strokeWidth={4} /></button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full flex flex-col items-center justify-center py-4 rounded-2xl border border-dashed border-black/10 dark:border-white/5 opacity-40 dark:opacity-10 text-muted-foreground">
                                                <span className="text-[8px] font-black uppercase tracking-wider">Chưa có nhân sự gán trực</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Background Decorations */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-24 opacity-0 group-hover:opacity-[0.03] pointer-events-none transition-all duration-1000 scale-[3] group-hover:scale-[2] rotate-12 group-hover:rotate-0">
                                {s.type === 'CENTRAL' ? <ShieldCheck className="w-64 h-64 text-gold" /> : <Warehouse className="w-64 h-64 text-gold" />}
                            </div>

                            {/* Interactive Footer Reveal */}
                            <div className="h-1 bg-gold/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                        </motion.div>
                    ))}

                    {filteredStores.length === 0 && (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center glass rounded-[4rem] border border-dashed border-stone-200 dark:border-white/10 opacity-30 text-center px-12">
                            <Warehouse className="w-16 h-16 text-gold mb-8" strokeWidth={0.5} />
                            <p className="font-heading uppercase text-2xl tracking-[.1em] italic">{t('messages.empty')}</p>
                        </div>
                    )}
                </div>
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
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-14 pb-32 sm:pb-14">
                                    <form id="storeForm" onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="max-w-2xl space-y-8 sm:space-y-12">
                                        <div className="space-y-2 border-l-4 border-gold pl-6 mb-8 sm:mb-10">
                                            <h3 className="text-2xl sm:text-3xl font-heading uppercase tracking-tighter italic">Bản Sắc Thực Thể</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black italic">Xác lập danh tính và mã định danh vật lý.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.name')}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    value={form.name}
                                                    placeholder="Tên điểm bán..."
                                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                    className="w-full h-14 sm:h-16 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 sm:px-8 text-sm font-bold outline-none focus:border-gold transition-all placeholder:text-muted-foreground/50 text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.code')}</label>
                                                <input
                                                    type="text"
                                                    value={form.code}
                                                    placeholder="Mã định danh..."
                                                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                                                    className="w-full h-14 sm:h-16 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 sm:px-8 font-mono text-sm font-bold uppercase tracking-widest outline-none focus:border-gold transition-all placeholder:text-muted-foreground/50 text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-black ml-1 italic">{t('form.address')}</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gold transition-all group-focus-within:scale-110">
                                                    <MapPin size={22} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.address}
                                                    placeholder="Số nhà, Phố, Quận, Thành phố..."
                                                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                                    className="w-full h-14 sm:h-16 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-14 sm:pl-16 pr-6 sm:pr-8 text-sm font-bold outline-none focus:border-gold transition-all placeholder:text-muted-foreground/50 text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-10 bg-black/[0.02] dark:bg-zinc-900/40 rounded-[2rem] sm:rounded-[3rem] border border-black/10 dark:border-white/5 flex items-center justify-between shadow-inner">
                                            <div className="flex items-center gap-4 sm:gap-6">
                                                <div className={cn(
                                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex shrink-0 items-center justify-center transition-all duration-500",
                                                    form.isActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-black/10 dark:bg-white/5 text-muted-foreground"
                                                )}>
                                                    <Activity size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] sm:text-[12px] uppercase tracking-[.2em] font-black text-foreground">{t('form.status')}</p>
                                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-snug">{form.isActive ? 'Hiện diện vật lý đang kích hoạt' : 'Thực thể đang tạm ngưng phục vụ'}</p>
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
                            <div className="shrink-0 h-auto border-t border-black/10 dark:border-white/10 p-6 sm:px-12 grid grid-cols-2 sm:flex sm:flex-row items-center justify-end gap-4 sm:gap-6 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="py-4 sm:py-5 px-6 sm:px-10 rounded-full text-[10px] uppercase tracking-widest font-black text-muted-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 font-heading text-center"
                                >
                                    {t('messages.cancel') || 'HUỶ BỎ'}
                                </button>
                                <button
                                    type="submit"
                                    form="storeForm"
                                    disabled={saving}
                                    className="py-4 sm:py-5 px-6 sm:px-16 rounded-full bg-gold text-luxury-black font-heading text-[11px] sm:text-[11px] uppercase tracking-[.3em] font-black disabled:opacity-50 shadow-xl shadow-gold/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                            ĐANG LƯU...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} className="shrink-0" />
                                            XÁC NHẬN
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
                        "fixed top-0 bottom-0 right-0 z-[100] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl overflow-x-hidden",
                        "left-0 md:left-20",
                        !isCollapsed && "lg:left-72"
                    )} onClick={() => setAssignModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] h-full sm:h-auto sm:max-h-[70vh] bg-background border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col glass min-w-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="shrink-0 p-5 sm:px-14 sm:py-10 border-b border-white/10 flex justify-between items-start gap-4 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <div className="min-w-0 flex-1 pr-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-px bg-gold shrink-0" />
                                            <span className="text-[9px] uppercase tracking-[.25em] sm:tracking-[.4em] font-black text-gold/80">Quản Trị Điều Phối</span>
                                        </div>
                                        <h2 className="text-lg sm:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-snug sm:leading-none break-words">
                                            Điều phối nhân sự: {assignModal.name}
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAssignModal(null)}
                                    className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-secondary/10 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-14">
                                <div className="space-y-4 sm:space-y-6 min-w-0">
                                    {staffUsers
                                        .filter((u) => !assignModal.users?.some((x) => x.user.id === u.id))
                                        .map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-white/5 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-gold/5 hover:border-gold/30 transition-all group shadow-sm active:scale-[0.99] duration-500 min-w-0"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                                                    <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center group-hover:bg-gold group-hover:text-primary transition-all duration-500 shadow-xl border border-white/5">
                                                        <Users size={20} className="sm:w-[22px] sm:h-[22px]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm sm:text-base font-heading uppercase tracking-wide sm:tracking-[.4em] leading-tight mb-1 group-hover:text-gold transition-colors font-black truncate">
                                                            {u.fullName || 'Nhân viên chưa đặt tên'}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide sm:tracking-[.4em] font-black opacity-40 truncate">{u.email}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAssign(assignModal.id, u.id)}
                                                    className="w-full sm:w-auto shrink-0 h-11 sm:h-14 px-6 sm:px-8 rounded-full bg-gold text-primary font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <UserPlus size={18} />
                                                    Gán ngay
                                                </button>
                                            </div>
                                        ))}
                                    
                                    {staffUsers.filter((u) => !assignModal.users?.some((x) => x.user.id === u.id)).length === 0 && (
                                        <div className="py-24 text-center glass rounded-[4rem] border border-dashed border-white/10 opacity-30 italic font-heading">
                                            <Info size={48} className="mx-auto mb-6 text-gold/20" strokeWidth={0.5} />
                                            <p className="text-xl tracking-widest uppercase">Không có nhân sự khả dụng</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 h-auto min-h-24 sm:min-h-28 border-t border-white/10 p-6 sm:px-12 flex items-center justify-stretch sm:justify-end bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                                <button
                                    type="button"
                                    onClick={() => setAssignModal(null)}
                                    className="w-full sm:w-auto px-14 py-4 sm:py-5 rounded-full bg-secondary/10 border border-white/10 font-heading text-[11px] uppercase tracking-[.3em] font-black hover:bg-white/5 transition-all active:scale-95 whitespace-nowrap text-center"
                                >
                                    HOÀN TẤT
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
