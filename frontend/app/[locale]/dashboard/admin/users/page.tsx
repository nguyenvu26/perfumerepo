'use client';
 
import { AuthGuard } from '@/components/auth/auth-guard';
import { userService, type AdminUser } from '@/services/user.service';
import { storesService } from '@/services/stores.service';
import { Users, Loader2, Pencil, Store, UserPlus, UserMinus, XCircle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
 
export default function UsersAdmin() {
  const t = useTranslations('dashboard.admin.users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; code?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [storeModal, setStoreModal] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ role: '', isActive: true });
  const [saving, setSaving] = useState(false);
 
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
      setEditModal(null);
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
      setStoreModal(null);
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
    setEditModal(u);
    setEditForm({ role: u.role, isActive: u.isActive });
  };
 
  const userStores = (u: AdminUser) => u.stores ?? [];
  const isStaff = (u: AdminUser) => u.role === 'STAFF';
 
  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-12 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-heading gold-gradient mb-1 uppercase tracking-tighter leading-none">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-[.3em] font-bold">
            {t('subtitle')}
          </p>
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
                            onClick={() => setStoreModal(u)}
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
                            onClick={() => setStoreModal(u)}
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
        {editModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md sm:p-6" 
            onClick={() => setEditModal(null)}
          >
            <div 
              className="glass rounded-t-[2.5rem] sm:rounded-[3rem] border border-stone-200 dark:border-white/10 p-8 sm:p-12 w-full max-w-xl bg-background sm:bg-background/50 relative overflow-hidden mt-auto sm:mt-0 shadow-2xl transition-all animate-in slide-in-from-bottom sm:zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 blur-[100px] pointer-events-none" />
 
              <div className="mb-10">
                <h2 className="text-2xl sm:text-3xl font-heading uppercase tracking-tighter italic leading-none mb-2">
                  {t('modals.edit_title', { name: editModal.fullName || editModal.email.split('@')[0] })}
                </h2>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[.3em] font-extrabold opacity-60">{editModal.email}</p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-[.4em] text-muted-foreground font-extrabold mb-3 ml-1 italic">
                    {t('table.role')}
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full h-14 sm:h-16 px-6 rounded-2xl border border-stone-200 dark:border-white/10 bg-secondary/5 dark:bg-white/5 text-[16px] sm:text-xs font-bold uppercase tracking-widest outline-none focus:border-gold transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="CUSTOMER">{t('roles.customer')}</option>
                    <option value="STAFF">{t('roles.staff')}</option>
                    <option value="ADMIN">{t('roles.admin')}</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4 bg-secondary/10 dark:bg-white/[0.02] p-5 rounded-2xl border border-border shadow-inner">
                  <div className="w-12 h-6 relative shrink-0">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor="isActive" 
                      className="w-full h-full bg-stone-300 dark:bg-zinc-800 rounded-full block cursor-pointer transition-colors peer-checked:bg-emerald-500 shadow-inner group"
                    >
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-6" />
                    </label>
                  </div>
                  <div>
                    <label htmlFor="isActive" className="text-[10px] font-extrabold uppercase tracking-widest block cursor-pointer leading-none mb-1">
                      {t('table.status')} ({t('status.active')})
                    </label>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Cho phép người dùng truy cập hệ thống</p>
                  </div>
                </div>
              </div>
 
              <div className="flex gap-4 mt-12 pb-4 sm:pb-0">
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={saving}
                  className="flex-1 h-14 sm:h-16 rounded-2xl bg-gold text-black font-heading text-[10px] uppercase tracking-[.3em] font-extrabold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       {t('modals.saving')}
                    </div>
                  ) : t('modals.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-8 sm:px-10 h-14 sm:h-16 rounded-2xl border border-stone-200 dark:border-white/10 font-bold text-[10px] uppercase tracking-[.3em] text-muted-foreground hover:bg-secondary/20 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
                >
                  {t('modals.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
 
        {/* Assign store modal (for Staff) */}
        {storeModal && isStaff(storeModal) && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md sm:p-6"
            onClick={() => setStoreModal(null)}
          >
            <div 
              className="glass rounded-t-[2.5rem] sm:rounded-[3rem] border border-stone-200 dark:border-white/10 p-8 sm:p-12 w-full max-w-xl bg-background sm:bg-background/50 flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh] mt-auto sm:mt-0 shadow-2xl transition-all animate-in slide-in-from-bottom sm:zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-heading uppercase tracking-tighter mb-2 italic leading-none">
                  {t('modals.assign_title', { name: storeModal.fullName || storeModal.email.split('@')[0] })}
                </h2>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[.3em] font-extrabold opacity-60 leading-relaxed">{t('modals.assign_desc')}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="space-y-4">
                  {stores
                    .filter(
                      (s) =>
                        !userStores(storeModal).some((us) => us.store.id === s.id),
                    )
                    .map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between p-5 rounded-2xl border border-stone-100 dark:border-white/5 bg-secondary/5 dark:bg-white/[0.02] hover:bg-stone-50 dark:hover:bg-white/5 hover:border-gold/30 transition-all group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest block">{s.name}</span>
                          <span className="text-[8px] font-mono text-muted-foreground opacity-60">{s.code || 'NO_CODE'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAssignStore(s.id, storeModal.id)
                          }
                          className="text-[9px] text-gold uppercase tracking-[.3em] font-extrabold p-3 px-6 border border-gold/20 rounded-xl hover:bg-gold hover:text-black transition-all shadow-sm active:scale-95"
                        >
                           {t('actions.assign_store')}
                        </button>
                      </li>
                    ))}
                  {stores.filter(
                    (s) =>
                      !userStores(storeModal).some((us) => us.store.id === s.id),
                  ).length === 0 && (
                    <li className="py-20 text-center glass rounded-2xl border border-dashed border-border/30 opacity-40">
                       <Store size={32} className="mx-auto mb-4 text-gold opacity-50" strokeWidth={1} />
                       <span className="text-[10px] uppercase tracking-[.4em] font-extrabold italic">
                         {t('modals.no_stores')}
                       </span>
                    </li>
                  )}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setStoreModal(null)}
                className="mt-8 w-full h-14 sm:h-16 rounded-2xl border border-stone-200 dark:border-white/10 font-extrabold text-[10px] uppercase tracking-[.3em] text-muted-foreground hover:bg-secondary/20 transition-all shadow-sm active:scale-95"
              >
                {t('modals.close')}
              </button>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
