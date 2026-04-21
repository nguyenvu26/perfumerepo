'use client';
 
import { AuthGuard } from '@/components/auth/auth-guard';
import { userService, type AdminUser } from '@/services/user.service';
import { storesService } from '@/services/stores.service';
import { Users, Loader2, Pencil, Store, UserPlus, UserMinus, XCircle, X, ShieldCheck, Lock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
 
export default function UsersAdmin() {
  const t = useTranslations('dashboard.admin.users');
  const { isSidebarCollapsed: isCollapsed, setModalOpen } = useUIStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; code?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [editForm, setEditForm] = useState({ role: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [storeModal, setStoreModal] = useState<AdminUser | null>(null);

  const handleSetEditModal = (u: AdminUser | null) => {
    setEditModal(u);
    setModalOpen(!!u);
  };

  const handleSetStoreModal = (u: AdminUser | null) => {
    setStoreModal(u);
    setModalOpen(!!u);
  };
 
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await userService.adminListUsers(roleFilter || undefined);
      setUsers(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);
 
  const fetchStores = useCallback(async () => {
    try {
      const list = await storesService.list();
      setStores(list);
    } catch {
      // optional
    }
  }, []);
 
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
 
  useEffect(() => {
    if (storeModal) fetchStores();
  }, [storeModal, fetchStores]);
 
  const handleUpdateRole = async () => {
    if (!editModal) return;
    setSaving(true);
    setError(null);
    try {
      await userService.adminUpdateUser(editModal.id, {
        role: editForm.role || undefined,
        isActive: editForm.isActive,
      });
      handleSetEditModal(null);
      fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
 
  const handleAssignStore = async (storeId: string, userId: string) => {
    try {
      await storesService.assignStaff(storeId, userId);
      handleSetStoreModal(null);
      fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    }
  };
 
  const handleUnassignStore = async (storeId: string, userId: string) => {
    try {
      await storesService.unassignStaff(storeId, userId);
      fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    }
  };
 
  const openEdit = (u: AdminUser) => {
    handleSetEditModal(u);
    setEditForm({ role: u.role, isActive: u.isActive });
  };
 
  const userStores = (u: AdminUser) => u.stores ?? [];
  const isStaff = (u: AdminUser) => u.role === 'STAFF';
 
  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
              {t('subtitle')}
            </p>
          </div>
        </header>
 
        {error && (
          <div className="mb-8 p-6 rounded-[2rem] bg-destructive/5 border border-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
             <XCircle size={16} />
             {error}
          </div>
        )}
 
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-secondary/10 dark:bg-black/20 p-4 sm:p-6 rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-sm">
          <label className="text-[10px] uppercase tracking-[.2em] text-muted-foreground font-extrabold ml-1 leading-none shrink-0">
            {t('filter_role')}
          </label>
          <div className="relative w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto min-w-[200px] rounded-xl border border-stone-200 dark:border-white/10 bg-background dark:bg-zinc-900 px-6 py-3 md:py-3 text-[16px] sm:text-[10px] font-bold uppercase tracking-widest outline-none focus:border-gold transition-all cursor-pointer appearance-none shadow-sm"
            >
              <option value="">{t('roles.all')}</option>
              <option value="ADMIN">{t('roles.admin')}</option>
              <option value="STAFF">{t('roles.staff')}</option>
              <option value="CUSTOMER">{t('roles.customer')}</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <Users size={12} />
            </div>
          </div>
        </div>
 
        <div className="hidden lg:block glass rounded-[3rem] border border-stone-200 dark:border-white/10 overflow-hidden shadow-2xl bg-background/30">
          <table className="w-full text-left font-body text-sm border-collapse">
            <thead className="bg-secondary/10 text-muted-foreground border-b border-stone-100 dark:border-white/5">
              <tr>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.user')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.role')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.store')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.status')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-gold opacity-40" strokeWidth={1} />
                      <span className="text-[10px] uppercase tracking-[.3em] font-bold text-muted-foreground animate-pulse italic opacity-40">{t('syncing')}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-muted-foreground">
                     <div className="flex flex-col items-center gap-6 opacity-30">
                       <Users size={64} strokeWidth={0.5} className="text-gold" />
                       <span className="text-[10px] uppercase tracking-[.4em] font-extrabold italic">{t('no_users')}</span>
                     </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.05] transition-all group border-b border-border/10 last:border-0">
                    <td className="px-10 py-10">
                      <div className="flex flex-col">
                        <span className="font-heading uppercase text-xs sm:text-sm tracking-widest text-foreground group-hover:text-gold transition-colors leading-relaxed">
                          {u.fullName || u.email.split('@')[0]}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono mt-0.5 opacity-60 italic">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-10 py-10">
                      <span className="text-[9px] font-bold uppercase tracking-[.2em] text-gold/80 px-4 py-2 rounded-full border border-gold/10 bg-gold/5 shadow-sm">
                        {t(`roles.${u.role.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-10 py-10">
                      {isStaff(u) ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          {userStores(u).map((s) => (
                            <span
                              key={s.store.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/10 dark:bg-white/5 border border-stone-200 dark:border-white/5 text-[9px] font-bold uppercase tracking-tight group/store transition-all hover:bg-red-500/5"
                            >
                              <span className="opacity-70">{s.store.name}</span>
                              <button
                                type="button"
                                onClick={() => handleUnassignStore(s.store.id, u.id)}
                                className="text-stone-400 hover:text-red-500 transition-all p-0.5"
                                title={t('actions.unassign_store')}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleSetStoreModal(u)}
                            className="text-[9px] text-gold uppercase tracking-[.2em] font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 px-4 py-2 border border-gold/20 rounded-full hover:bg-gold/5 shadow-sm"
                          >
                            <UserPlus className="w-3 h-3" /> {t('actions.assign_store')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 italic">—</span>
                      )}
                    </td>
                    <td className="px-10 py-10">
                      <span
                        className={`px-5 py-2 rounded-full text-[8px] uppercase tracking-[.2em] font-extrabold border transition-all ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                            : 'bg-stone-500/10 text-stone-400 border-stone-200'
                        }`}
                      >
                        {u.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="px-10 py-10 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-3 text-[9px] uppercase font-extrabold tracking-[.2em] text-muted-foreground hover:text-gold transition-all opacity-0 group-hover:opacity-100 p-4 min-w-[44px] min-h-[44px] hover:bg-gold/5 rounded-2xl active:scale-90 flex justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" /> {t('actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE USER CARD LIST */}
        <div className="lg:hidden space-y-4">
           {loading ? (
             <div className="py-20 flex flex-col items-center gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-gold opacity-40" strokeWidth={1} />
               <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground opacity-40 italic">{t('syncing')}</span>
             </div>
           ) : users.length === 0 ? (
             <div className="py-32 flex flex-col items-center gap-8 opacity-30 text-center px-6">
                <Users size={80} strokeWidth={0.5} className="text-gold" />
                <span className="text-[10px] uppercase tracking-[.4em] font-extrabold italic">{t('no_users')}</span>
             </div>
           ) : (
             users.map((u) => (
               <div key={u.id} className="glass p-6 rounded-[2.5rem] border border-stone-200 dark:border-white/5 space-y-6 relative overflow-hidden group active:scale-[0.98] transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <h3 className="font-heading text-lg text-foreground group-hover:text-gold transition-colors">{u.fullName || u.email.split('@')[0]}</h3>
                        <p className="text-[9px] font-mono opacity-60 italic">{u.email}</p>
                     </div>
                     <button
                        onClick={() => openEdit(u)}
                        className="p-4 min-w-[44px] min-h-[44px] bg-secondary/10 rounded-full text-stone-400 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                     <span className="text-[8px] font-bold uppercase tracking-[.2em] text-gold/80 px-3 py-1.5 rounded-full border border-gold/10 bg-gold/5">
                        {t(`roles.${u.role.toLowerCase()}`)}
                     </span>
                     <span
                        className={`px-3 py-1.5 rounded-full text-[8px] uppercase tracking-[.2em] font-extrabold border transition-all ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-stone-500/10 text-stone-400 border-stone-200'
                        }`}
                      >
                        {u.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                  </div>

                  {isStaff(u) && (
                    <div className="pt-4 border-t border-border/10 space-y-3">
                       <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-extrabold ml-1">Cửa hàng phụ trách</p>
                       <div className="flex flex-wrap gap-2">
                          {userStores(u).map((s) => (
                            <div key={s.store.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/20 border border-border/10 text-[9px] font-bold uppercase">
                               {s.store.name}
                               <button onClick={() => handleUnassignStore(s.store.id, u.id)} className="text-red-500/60 hover:text-red-500">
                                  <UserMinus size={12} />
                               </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleSetStoreModal(u)}
                            className="bg-gold/10 text-gold p-3 min-w-[44px] min-h-[44px] rounded-xl border border-gold/20 flex items-center justify-center active:scale-95 transition-all"
                          >
                            <Store size={14} />
                          </button>
                       </div>
                    </div>
                  )}
               </div>
             ))
           )}
        </div>
 
        {/* Edit role modal */}
        <AnimatePresence>
          {editModal && (
            <div className={cn(
                "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/40 dark:bg-zinc-950/80 backdrop-blur-2xl",
                "left-0 md:left-20",
                !isCollapsed && "lg:left-72"
            )} onClick={() => handleSetEditModal(null)}>
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
                                <span className="text-[9px] uppercase tracking-[.4em] font-black text-gold/80">Quản Trị Nhân Sự</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                              {t('modals.edit_title', { name: editModal.fullName || editModal.email.split('@')[0] })}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => setEditModal(null)}
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
                                <ShieldCheck className="w-4 h-4" />
                                Phân Quyền
                            </button>
                            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-muted-foreground hover:bg-secondary/50 font-black uppercase tracking-widest text-[10px] opacity-40 cursor-not-allowed">
                                <Lock className="w-4 h-4 text-gold/60" />
                                Bảo Mật
                            </button>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-14 pb-32 sm:pb-14">
                        <div className="max-w-2xl space-y-12">
                            <div className="space-y-2 border-l-4 border-gold pl-6 mb-10">
                                <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Cấu Hình Quyền Hạn</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black italic">Xác định vai trò và phạm vi hoạt động của người dùng.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('table.role')} *</label>
                                <div className="relative group">
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                                        className="w-full h-16 bg-secondary/5 border border-border rounded-2xl px-8 text-sm font-bold outline-none focus:border-gold transition-all appearance-none cursor-pointer uppercase tracking-widest"
                                    >
                                        <option value="CUSTOMER">{t('roles.customer')}</option>
                                        <option value="STAFF">{t('roles.staff')}</option>
                                        <option value="ADMIN">{t('roles.admin')}</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-zinc-50 dark:bg-white/[0.02] rounded-[3rem] border border-border/50 flex items-center justify-between shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[12px] uppercase tracking-[.2em] font-black">{t('table.status')}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{editForm.isActive ? 'Người dùng đang hoạt động' : 'Tài khoản đang bị khóa'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={cn(
                                        "relative w-16 h-9 rounded-full transition-all duration-500",
                                        editForm.isActive ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-zinc-300 dark:bg-zinc-800"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-500 shadow-md",
                                        editForm.isActive ? "left-8" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 h-28 border-t border-white/10 px-12 flex items-center justify-end gap-6 bg-zinc-50 dark:bg-black/20 backdrop-blur-xl z-20">
                    <button
                        type="button"
                        onClick={() => setEditModal(null)}
                        className="px-10 py-4 rounded-full text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-foreground transition-all active:scale-95 font-heading"
                    >
                        {t('modals.cancel')}
                    </button>
                    <button
                        onClick={handleUpdateRole}
                        disabled={saving}
                        className="px-16 py-5 rounded-full bg-gold text-primary-foreground font-heading text-[11px] uppercase tracking-[.3em] font-black disabled:opacity-50 shadow-2xl shadow-gold/30 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-3"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                                {t('modals.saving')}
                            </>
                        ) : t('modals.save')}
                    </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
 
        {/* Assign store modal (for Staff) */}
        <AnimatePresence>
          {storeModal && isStaff(storeModal) && (
            <div className={cn(
                "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/40 dark:bg-zinc-950/80 backdrop-blur-2xl",
                "left-0 md:left-20",
                !isCollapsed && "lg:left-72"
            )} onClick={() => handleSetStoreModal(null)}>
               <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-[800px] h-full sm:h-auto sm:max-h-[70vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
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
                              {t('modals.assign_title', { name: storeModal.fullName || storeModal.email.split('@')[0] })}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => setStoreModal(null)}
                        className="w-12 h-12 rounded-full bg-secondary/10 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-14 pb-32 sm:pb-14">
                    <div className="space-y-6">
                      {stores
                        .filter((s) => !userStores(storeModal).some((us) => us.store.id === s.id))
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-6 sm:p-8 rounded-[2.5rem] border border-white/5 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-gold/5 hover:border-gold/30 transition-all group shadow-sm active:scale-[0.99] duration-500"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center group-hover:bg-gold group-hover:text-primary transition-all duration-500 shadow-xl">
                                <Store size={22} />
                              </div>
                              <div>
                                <h4 className="text-base font-heading uppercase tracking-widest leading-none mb-1 group-hover:text-gold transition-colors">{s.name}</h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40">{s.code || 'NO-CODE'}</p>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleAssignStore(s.id, storeModal.id)}
                              disabled={saving}
                              className="h-14 px-8 rounded-full bg-gold text-primary font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20 flex items-center gap-2 group/btn"
                            >
                                <UserPlus size={16} />
                                {t('actions.assign_store')}
                            </button>
                          </div>
                      ))}
                      
                      {stores.filter((s) => !userStores(storeModal).some((us) => us.store.id === s.id)).length === 0 && (
                        <div className="py-24 text-center glass rounded-[4rem] border border-dashed border-white/10 opacity-30">
                           <Store size={48} className="mx-auto mb-6 text-gold/20" strokeWidth={0.5} />
                           <span className="text-[10px] uppercase tracking-[.6em] font-black italic">
                             {t('modals.no_stores')}
                           </span>
                        </div>
                      )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 h-28 border-t border-white/10 px-12 flex items-center justify-end bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                    <button
                        type="button"
                        onClick={() => setStoreModal(null)}
                        className="px-14 py-5 rounded-full bg-secondary/10 border border-white/10 font-heading text-[11px] uppercase tracking-[.3em] font-black hover:bg-white/5 transition-all active:scale-95"
                    >
                        {t('modals.close') || 'HOÀN TẤT'}
                    </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}
