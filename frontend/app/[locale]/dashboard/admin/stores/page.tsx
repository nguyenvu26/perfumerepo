'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { storesService, type StoreWithDetails } from '@/services/stores.service';
import { userService } from '@/services/user.service';
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

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

  const tx = useTranslations('dashboard.admin.stores_extra');

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-8">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
              {t('title')}
            </h1>
            <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">
              {t('subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ name: '', code: '', address: '', isActive: true });
              setEditStore(null);
              setModal('create');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gold text-primary font-heading text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-gold/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t('add_new')}
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-body">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass rounded-[2.5rem] p-12 text-center text-muted-foreground font-heading uppercase tracking-widest text-xs flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            {t('messages.loading')}
          </div>
        ) : (
          <div className="glass rounded-[2.5rem] border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-heading">{t('columns.name')}</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-heading">{t('columns.code')}</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-heading">{t('columns.address')}</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-heading">{t('columns.staff')}</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-heading text-right">{t('columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stores.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="font-heading uppercase text-xs tracking-wider group-hover:text-gold transition-colors">{s.name}</span>
                        {!s.isActive && (
                          <span className="ml-2 text-[10px] text-muted-foreground italic">{t('status.hidden')}</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-[10px] text-muted-foreground font-mono">{s.code ?? '—'}</td>
                      <td className="px-8 py-6 text-[10px] text-muted-foreground max-w-[200px] truncate">
                        {s.address ?? '—'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {(s.users ?? []).map((u) => (
                            <span
                              key={u.user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border/50 text-[10px] font-heading uppercase tracking-wider"
                            >
                              {u.user.fullName || u.user.email}
                              <button
                                type="button"
                                onClick={() => handleUnassign(s.id, u.user.id)}
                                className="text-destructive hover:scale-110 transition-transform"
                                title={t('actions.unassign')}
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setAssignModal(s)}
                            className="text-[10px] text-gold uppercase tracking-widest hover:underline font-heading flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" /> {t('actions.assign')}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="p-2.5 rounded-xl hover:bg-gold/10 text-muted-foreground hover:text-gold transition-all"
                            title={t('actions.edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
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
            {stores.length === 0 && (
              <div className="p-20 text-center text-muted-foreground font-body italic text-sm">
                {t('messages.empty')}
              </div>
            )}
          </div>
        )}

        {/* Modal create / edit */}
        {(modal === 'create' || modal === 'edit') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
            <div className="glass rounded-[2.5rem] border border-border p-10 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-heading uppercase tracking-tighter mb-8 gold-gradient">
                {modal === 'create' ? t('add_new') : t('edit')}
              </h2>
              <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-heading">
                    {t('form.name')}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    placeholder={tx('placeholders.name')}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-5 py-3 rounded-2xl border border-border bg-background/50 focus:border-gold outline-none transition-all font-body text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-heading">
                    {t('form.code')}
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    placeholder={tx('placeholders.code')}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    className="w-full px-5 py-3 rounded-2xl border border-border bg-background/50 focus:border-gold outline-none transition-all font-body text-sm uppercase tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-heading">
                    {t('form.address')}
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    placeholder={tx('placeholders.address')}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-5 py-3 rounded-2xl border border-border bg-background/50 focus:border-gold outline-none transition-all font-body text-sm"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-border bg-transparent checked:border-gold checked:bg-gold transition-all"
                    />
                    <Plus className="absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 left-1 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm font-body text-muted-foreground group-hover:text-foreground transition-colors">{t('form.status')}</span>
                </label>
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl bg-gold text-primary font-heading text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? t('messages.saving') : t('messages.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-4 rounded-2xl border border-border font-heading text-xs uppercase tracking-widest hover:bg-secondary transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setAssignModal(null)}>
            <div className="glass rounded-[2.5rem] border border-border p-10 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-heading uppercase tracking-tighter mb-2 gold-gradient">
                {t('modal.assign_title', { name: assignModal.name })}
              </h2>
              <p className="text-xs text-muted-foreground mb-8 uppercase tracking-widest font-body">
                {t('modal.assign_desc')}
              </p>
              <ul className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                {staffUsers
                  .filter((u) => !assignModal.users?.some((x) => x.user.id === u.id))
                  .map((u) => (
                    <li key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-gold/30 transition-all group">
                      <div className="flex flex-col">
                        <span className="text-sm font-heading uppercase tracking-wider">{u.fullName || tx('unnamed_staff')}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{u.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssign(assignModal.id, u.id)}
                        className="px-4 py-2 rounded-xl bg-gold/10 text-gold text-[10px] font-heading uppercase tracking-widest hover:bg-gold hover:text-primary-foreground transition-all"
                      >
                        {t('modal.assign_btn')}
                      </button>
                    </li>
                  ))}
                {staffUsers.filter((u) => !assignModal.users?.some((x) => x.user.id === u.id)).length === 0 && (
                  <li className="p-8 text-center text-xs text-muted-foreground italic font-body">
                    {t('modal.none_available')}
                  </li>
                )}
              </ul>
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="mt-8 w-full py-4 rounded-2xl border border-border font-heading text-[10px] uppercase tracking-widest hover:bg-secondary transition-all"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
