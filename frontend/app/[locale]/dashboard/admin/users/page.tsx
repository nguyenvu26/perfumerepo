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
      <main className="p-8 pb-20 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[.3em] font-bold">
            {t('subtitle')}
          </p>
        </header>
 
        {error && (
          <div className="mb-8 p-6 rounded-[2rem] bg-destructive/5 border border-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
             <XCircle size={16} />
             {error}
          </div>
        )}
 
        <div className="mb-8 flex items-center gap-6 glass bg-background/50 p-6 rounded-[2rem] border border-border inline-flex">
          <label className="text-[10px] uppercase tracking-[.2em] text-muted-foreground font-bold">
            {t('filter_role')}
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-border bg-background/50 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-gold transition-colors"
          >
            <option value="">{t('roles.all')}</option>
            <option value="ADMIN">{t('roles.admin')}</option>
            <option value="STAFF">{t('roles.staff')}</option>
            <option value="CUSTOMER">{t('roles.customer')}</option>
          </select>
        </div>
 
        <div className="glass rounded-[3rem] border-border overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-secondary/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-heading">{t('table.user')}</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-heading">{t('table.role')}</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-heading">{t('table.store')}</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-heading">{t('table.status')}</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-heading text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-background/20">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-gold" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground animate-pulse">{t('syncing')}</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center text-muted-foreground">
                       <div className="flex flex-col items-center gap-4 opacity-50">
                         <Users size={40} strokeWidth={1} />
                         <span className="text-[10px] uppercase tracking-widest font-bold">{t('no_users')}</span>
                       </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-heading uppercase text-xs tracking-widest text-foreground group-hover:text-gold transition-colors">
                            {u.fullName || u.email.split('@')[0]}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-[9px] font-bold uppercase tracking-[.2em] text-gold/80 glass px-3 py-1.5 rounded-lg border-gold/10">
                          {t(`roles.${u.role.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        {isStaff(u) ? (
                          <div className="flex flex-wrap gap-2 items-center">
                            {userStores(u).map((s) => (
                              <span
                                key={s.store.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border text-[9px] font-bold uppercase tracking-tight group/store"
                              >
                                {s.store.name}
                                <button
                                  type="button"
                                  onClick={() => handleUnassignStore(s.store.id, u.id)}
                                  className="text-muted-foreground hover:text-red-500 transition-colors"
                                  title={t('actions.unassign_store')}
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={() => setStoreModal(u)}
                              className="text-[9px] text-gold uppercase tracking-[.2em] font-bold hover:underline flex items-center gap-1.5 p-1 px-3 glass border-gold/10 rounded-xl"
                            >
                              <Store className="w-3 h-3" /> {t('actions.assign_store')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[8px] uppercase tracking-[.2em] font-bold border transition-colors ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-stone-500/10 text-muted-foreground border-border'
                          }`}
                        >
                          {u.isActive ? t('status.active') : t('status.inactive')}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold tracking-[.2em] text-muted-foreground hover:text-gold transition-all opacity-0 group-hover:opacity-100 p-2 hover:glass rounded-xl"
                        >
                          <Pencil className="w-3 h-3" /> {t('actions.edit')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
 
        {/* Edit role modal */}
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="glass rounded-[3rem] border border-white/10 p-12 w-full max-w-xl bg-background/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 blur-[100px] pointer-events-none" />
 
              <h2 className="text-2xl font-heading uppercase tracking-tighter mb-2 italic">
                {t('modals.edit_title', { name: editModal.fullName || editModal.email.split('@')[0] })}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-bold mb-10">{editModal.email}</p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 ml-1">
                    {t('table.role')}
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full h-14 px-6 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold transition-all"
                  >
                    <option value="CUSTOMER">{t('roles.customer')}</option>
                    <option value="STAFF">{t('roles.staff')}</option>
                    <option value="ADMIN">{t('roles.admin')}</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center transition-all ${editForm.isActive ? 'bg-gold border-gold' : 'bg-white/5'}`}>
                    <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="hidden"
                    />
                    {editForm.isActive && <div className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">{t('table.status')} ({t('status.active')})</span>
                </label>
              </div>
 
              <div className="flex gap-4 mt-12">
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={saving}
                  className="flex-1 h-14 rounded-2xl bg-gold text-black font-heading text-[10px] uppercase tracking-[.3em] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/10 disabled:opacity-50"
                >
                  {saving ? t('modals.saving') : t('modals.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-10 h-14 rounded-2xl border border-white/10 font-bold text-[10px] uppercase tracking-[.3em] hover:bg-white/5 transition-all"
                >
                  {t('modals.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
 
        {/* Assign store modal (for Staff) */}
        {storeModal && isStaff(storeModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="glass rounded-[3rem] border border-white/10 p-12 w-full max-w-xl bg-background/50">
              <h2 className="text-2xl font-heading uppercase tracking-tighter mb-2 italic">
                {t('modals.assign_title', { name: storeModal.fullName || storeModal.email.split('@')[0] })}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-bold mb-10">{t('modals.assign_desc')}</p>
              
              <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                {stores
                  .filter(
                    (s) =>
                      !userStores(storeModal).some((us) => us.store.id === s.id),
                  )
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-gold/20 transition-all group"
                    >
                      <span className="text-xs font-bold uppercase tracking-widest">{s.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssignStore(s.id, storeModal.id)
                        }
                        className="text-[9px] text-gold uppercase tracking-[.3em] font-bold p-2 px-4 glass border-gold/10 rounded-xl hover:bg-gold hover:text-black transition-all"
                      >
                         {t('actions.assign_store')}
                      </button>
                    </li>
                  ))}
                {stores.filter(
                  (s) =>
                    !userStores(storeModal).some((us) => us.store.id === s.id),
                ).length === 0 && (
                  <li className="p-10 text-center glass rounded-2xl border-white/5 opacity-50">
                    <span className="text-[10px] uppercase tracking-widest font-bold">
                       {t('modals.no_stores')}
                    </span>
                  </li>
                )}
              </ul>
              <button
                type="button"
                onClick={() => setStoreModal(null)}
                className="mt-10 w-full h-14 rounded-2xl border border-white/10 font-bold text-[10px] uppercase tracking-[.3em] hover:bg-white/5 transition-all"
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
