'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Plus, X, Pencil, Trash2, Tag, Layers, Flower } from 'lucide-react';
import { catalogService, type CatalogItem } from '@/services/catalog.service';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

type TabType = 'brands' | 'categories' | 'scentFamilies';

export default function AdminCatalog() {
  const t = useTranslations('dashboard.admin.catalog');
  const [activeTab, setActiveTab] = useState<TabType>('brands');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: CatalogItem[];
      switch (activeTab) {
        case 'brands':
          data = await catalogService.getBrands();
          break;
        case 'categories':
          data = await catalogService.getCategories();
          break;
        case 'scentFamilies':
          data = await catalogService.getScentFamilies();
          break;
      }
      setItems(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditId(null);
    setForm({ name: '', description: '' });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    setEditId(id);
    setSaving(true);
    try {
      let data: CatalogItem;
      switch (activeTab) {
        case 'brands':
          data = await catalogService.getBrand(id);
          break;
        case 'categories':
          data = await catalogService.getCategory(id);
          break;
        case 'scentFamilies':
          data = await catalogService.getScentFamily(id);
          break;
      }
      setForm({ name: data.name, description: data.description || '' });
      setShowModal(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('errors.name_required'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dto = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (editId) {
        switch (activeTab) {
          case 'brands':
            await catalogService.updateBrand(editId, dto);
            break;
          case 'categories':
            await catalogService.updateCategory(editId, dto);
            break;
          case 'scentFamilies':
            await catalogService.updateScentFamily(editId, dto);
            break;
        }
      } else {
        switch (activeTab) {
          case 'brands':
            await catalogService.createBrand(dto);
            break;
          case 'categories':
            await catalogService.createCategory(dto);
            break;
          case 'scentFamilies':
            await catalogService.createScentFamily(dto);
            break;
        }
      }
      closeModal();
      fetchItems();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const typeKey = activeTab === 'brands' ? 'brands' : activeTab === 'categories' ? 'categories' : 'scent_families';
    const typeLabel = t(`tabs.${typeKey}`).toLowerCase();
    if (!confirm(t('delete_confirm', { type: typeLabel }))) return;
    try {
      switch (activeTab) {
        case 'brands':
          await catalogService.deleteBrand(id);
          break;
        case 'categories':
          await catalogService.deleteCategory(id);
          break;
        case 'scentFamilies':
          await catalogService.deleteScentFamily(id);
          break;
      }
      fetchItems();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const tabs = [
    { id: 'brands' as TabType, label: t('tabs.brands'), icon: Tag },
    { id: 'categories' as TabType, label: t('tabs.categories'), icon: Layers },
    { id: 'scentFamilies' as TabType, label: t('tabs.scentFamilies'), icon: Flower },
  ];

  const getTypeName = () => {
    const key = activeTab === 'brands' ? 'brands' : activeTab === 'categories' ? 'categories' : 'scentFamilies';
    return t(`tabs.${key}`);
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full md:w-auto bg-gold text-primary-foreground px-8 py-4 md:py-3 rounded-full font-heading text-[10px] uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-gold/20"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            {t('add_new')}
          </button>
        </header>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 border-b border-white/5 sm:border-border no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-6 py-3 font-heading text-[11px] sm:text-sm uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-gold text-gold bg-gold/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('loading')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-20">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass rounded-2xl md:rounded-[2rem] border border-stone-200 dark:border-white/5 p-6 hover:border-gold/30 transition-all group relative active:scale-[0.98] sm:active:scale-100"
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <h3 className="font-heading text-lg text-foreground leading-tight tracking-tight">{item.name}</h3>
                  <div className="flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(item.id)}
                      className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-gold transition-colors bg-secondary/10 sm:bg-transparent rounded-lg border border-border/5 sm:border-transparent"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors bg-secondary/10 sm:bg-transparent rounded-lg border border-border/5 sm:border-transparent"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-stone-500 dark:text-muted-foreground line-clamp-2 italic font-light leading-relaxed">{item.description}</p>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground space-y-4">
                <Layers className="w-12 h-12 mx-auto opacity-10" />
                <p className="text-[10px] uppercase font-bold tracking-widest">{t('no_items', { type: getTypeName().toLowerCase() })}</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm" onClick={closeModal}>
            <div
              className="bg-background border-t sm:border border-border rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-lg w-full h-[90vh] sm:h-auto flex flex-col p-6 sm:p-10 shadow-2xl relative mt-auto sm:mt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-heading tracking-tighter leading-none">
                    {editId ? t('modal.edit_title', { type: getTypeName() }) : t('modal.create_title', { type: getTypeName() })}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('subtitle')}</p>
                </div>
                <button onClick={closeModal} className="p-3 bg-secondary/20 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-all active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-[.3em] text-gold/80 ml-1">
                      {t('modal.name_label')}
                    </label>
                    <input
                      className="w-full bg-secondary/10 border border-border rounded-2xl py-4 px-6 outline-none focus:border-gold shadow-inner transition-all text-base md:text-sm font-medium"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      placeholder={t('modal.name_placeholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-[.3em] text-gold/80 ml-1">
                      {t('modal.desc_label')}
                    </label>
                    <textarea
                      className="w-full bg-secondary/10 border border-border rounded-2xl py-4 px-6 outline-none focus:border-gold min-h-[150px] shadow-inner transition-all text-base md:text-sm font-light leading-relaxed"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder={t('modal.desc_placeholder')}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 sticky bottom-0 bg-background pb-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 rounded-full border border-border text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:bg-secondary/50 dark:hover:bg-white/5 transition-all"
                  >
                    {t('modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-4 rounded-full bg-gold text-primary-foreground font-heading text-[10px] uppercase tracking-widest font-extrabold disabled:opacity-50 shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {saving ? t('modal.saving') : editId ? t('modal.save') : t('modal.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
