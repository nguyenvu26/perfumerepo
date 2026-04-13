'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Package, Plus, Search, X, Eye, EyeOff, Pencil, ImagePlus } from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { catalogService } from '@/services/catalog.service';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';

const MAX_IMAGES = 10;

type ExistingImage = { id: number; url: string; order: number };
type VariantForm = { id?: string; name: string; price: number; stock: number; sku: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function AdminProducts() {
  const t = useTranslations('dashboard.admin.products');
  const tFeatured = useTranslations('featured');
  const format = useFormatter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<Array<{ file: File; url: string }>>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [scentFamilies, setScentFamilies] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    brandId: 0,
    categoryId: '' as '' | number,
    scentFamilyId: '' as '' | number,
    description: '',
    gender: '',
    longevity: '',
    concentration: '',
    isActive: true,
    variants: [{ name: t('form.variants.default_name'), price: 0, stock: 0, sku: '' }] as VariantForm[],
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.adminList({ search: search || undefined, take: 50 });
      setProducts(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCatalog = useCallback(async () => {
    try {
      const [b, c, s] = await Promise.all([
        catalogService.getBrands(),
        catalogService.getCategories(),
        catalogService.getScentFamilies(),
      ]);
      setBrands(b);
      setCategories(c);
      setScentFamilies(s);
    } catch {
      // Catalog optional for listing
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (showModal && editId) {
      setLoadingProduct(true);
      productService.adminGetById(editId)
        .then((p: Product) => {
          setForm({
            name: p.name,
            slug: p.slug,
            brandId: p.brandId,
            categoryId: p.categoryId ?? '',
            scentFamilyId: p.scentFamilyId ?? '',
            description: p.description ?? '',
            gender: p.gender ?? '',
            longevity: p.longevity ?? '',
            concentration: p.concentration ?? '',
            isActive: p.isActive,
            variants: p.variants?.length
              ? p.variants.map(v => ({ id: v.id, name: v.name, price: v.price, stock: v.stock, sku: v.sku ?? '' }))
              : [{ name: t('form.variants.default_name'), price: 0, stock: 0, sku: '' }],
          });
          setExistingImages((p.images ?? []) as ExistingImage[]);
        })
        .catch((e: unknown) => setError((e as Error).message))
        .finally(() => setLoadingProduct(false));
    }
  }, [showModal, editId]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach((x) => URL.revokeObjectURL(x.url));
    };
  }, [imageFiles]);

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditId(null);
    setImageFiles((prev) => {
      prev.forEach((x) => URL.revokeObjectURL(x.url));
      return [];
    });
    setExistingImages([]);
    setLoadingProduct(false);
  };

  const openCreate = () => {
    setEditId(null);
    setImageFiles([]);
    setExistingImages([]);
    setLoadingProduct(false);
    setForm({
      name: '',
      slug: '',
      brandId: brands[0]?.id ?? 0,
      categoryId: '',
      scentFamilyId: '',
      description: '',
      gender: '',
      longevity: '',
      concentration: '',
      isActive: true,
      variants: [{ name: t('form.variants.default_name'), price: 0, stock: 0, sku: '' }],
    });
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setImageFiles([]);
    setExistingImages([]);
    setLoadingProduct(true);
    setShowModal(true);
  };

  const onNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: editId ? f.slug : (f.slug || slugify(name)) }));
  };

  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...f.variants, { name: '', price: 0, stock: 0, sku: '' }]
    }));
  };

  const removeVariant = (index: number) => {
    if (form.variants.length <= 1) return;
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, data: Partial<typeof form.variants[0]>) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((v, i) => i === index ? { ...v, ...data } : v)
    }));
  };

  const totalImages = existingImages.length + imageFiles.length;
  const canAddMoreImages = totalImages < MAX_IMAGES;

  const addImageFiles = (files: FileList | null) => {
    if (!files?.length || !canAddMoreImages) return;
    const list = Array.from(files);
    const space = MAX_IMAGES - totalImages;
    const toAdd = list.slice(0, space).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImageFiles((prev) => [...prev, ...toAdd].slice(0, MAX_IMAGES - existingImages.length));
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteImage = async (img: ExistingImage) => {
    if (!editId) return;
    try {
      await productService.adminDeleteImage(editId, img.id);
      setExistingImages((prev) => prev.filter((x) => x.id !== img.id));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const toDto = () => ({
    name: form.name.trim(),
    slug: form.slug.trim(),
    brandId: form.brandId,
    categoryId: form.categoryId === '' ? null : form.categoryId,
    scentFamilyId: form.scentFamilyId === '' ? null : form.scentFamilyId,
    description: form.description || undefined,
    gender: form.gender || undefined,
    longevity: form.longevity || undefined,
    concentration: form.concentration || undefined,
    isActive: form.isActive,
    variants: form.variants.map(v => ({
      id: v.id,
      name: v.name.trim(),
      price: v.price,
      stock: v.stock,
      sku: v.sku.trim() || undefined
    }))
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim() || form.brandId <= 0) {
      setError(t('errors.fill_fields'));
      return;
    }
    const invalidVariant = form.variants.some(v => !v.name.trim() || v.price < 0);
    if (invalidVariant) {
      setError(t('errors.variant_invalid'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await productService.adminUpdate(editId, toDto());
        if (imageFiles.length > 0) {
          await productService.adminUploadImages(editId, imageFiles.map((x) => x.file));
        }
      } else {
        const product = await productService.adminCreate(toDto());
        if (imageFiles.length > 0) {
          await productService.adminUploadImages(product.id, imageFiles.map((x) => x.file));
        }
      }
      closeModal();
      fetchProducts();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus ? t('confirm_hide') : t('confirm_show');
    if (!confirm(confirmMsg)) return;
    try {
      if (currentStatus) {
        // Hide product (soft delete)
        await productService.adminDelete(id);
      } else {
        // Show product (restore)
        await productService.adminUpdate(id, { isActive: true });
      }
      fetchProducts();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const getPriceRange = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return '—';
    const prices = product.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const fmt = (n: number) => format.number(n, { style: 'currency', currency: tFeatured('currency_code') || 'VND', maximumFractionDigits: 0 });
    if (min === max) return fmt(min);
    return `${fmt(min)} - ${fmt(max)}`;
  };

  const getTotalStock = (product: Product) => {
    if (!product.variants) return 0;
    return product.variants.reduce((acc, v) => acc + v.stock, 0);
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-8">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
            <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">{t('subtitle')}</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-gold text-primary-foreground px-6 py-3 rounded-full font-heading text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('add_new')}
          </button>
        </header>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="w-full bg-secondary/20 border border-border rounded-full py-3 pl-12 pr-4 text-sm outline-none focus:border-gold/50 transition-all font-body"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="text-muted-foreground">{t('loading')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className={`glass rounded-[2rem] border-border overflow-hidden hover:border-gold/30 transition-all group ${!p.isActive ? 'opacity-60' : ''
                  }`}
              >
                <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                  {p.images?.length ? (
                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gold/20" />
                    </div>
                  )}
                  {!p.isActive && (
                    <div className="absolute top-2 right-2 bg-red-500/80 text-white text-[8px] px-2 py-1 rounded-full uppercase tracking-widest font-bold">
                      {t('status.hidden')}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[10px] text-gold uppercase tracking-widest font-bold">{p.brand?.name ?? '—'}</p>
                    {!p.isActive && (
                      <span className="text-[8px] text-muted-foreground uppercase">{t('status.hidden')}</span>
                    )}
                  </div>
                  <h3 className="font-heading text-foreground mb-4 line-clamp-1">{p.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-heading text-sm text-gold">
                      {getPriceRange(p)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {t('status.in_stock', { count: getTotalStock(p) })}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(p.id)}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(p.id, p.isActive)}
                      className={`transition-colors ${p.isActive
                        ? 'text-muted-foreground hover:text-orange-500'
                        : 'text-muted-foreground hover:text-green-500'
                        }`}
                      title={p.isActive ? t('actions.hide') : t('actions.show')}
                    >
                      {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeModal}>
            <div
              className="bg-background border border-border rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading">{editId ? t('form.title_edit') : t('form.title_create')}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {loadingProduct ? (
                <div className="py-12 text-center text-muted-foreground">{t('form.loading_product')}</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.name')}</label>
                        <input
                          className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.name}
                          onChange={(e) => onNameChange(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.slug')}</label>
                        <input
                          className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.brand')}</label>
                          <select
                            className="w-full bg-black text-white border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                            value={form.brandId || ''}
                            onChange={(e) => setForm((f) => ({ ...f, brandId: Number(e.target.value) }))}
                            required
                          >
                            <option value="">—</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.category')}</label>
                          <select
                            className="w-full bg-black text-white border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                            value={form.categoryId === '' ? '' : form.categoryId}
                            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value === '' ? '' : Number(e.target.value) }))}
                          >
                            <option value="">—</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.scent_family')}</label>
                        <select
                          className="w-full bg-black text-white border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.scentFamilyId === '' ? '' : form.scentFamilyId}
                          onChange={(e) => setForm((f) => ({ ...f, scentFamilyId: e.target.value === '' ? '' : Number(e.target.value) }))}
                        >
                          <option value="">—</option>
                          {scentFamilies.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.gender')}</label>
                        <select
                          className="w-full bg-black text-white border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.gender}
                          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                        >
                          <option value="">—</option>
                          <option value="female">female</option>
                          <option value="male">male</option>
                          <option value="unisex">unisex</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.longevity')}</label>
                        <input
                          className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.longevity}
                          onChange={(e) => setForm((f) => ({ ...f, longevity: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.concentration')}</label>
                        <input
                          className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                          value={form.concentration}
                          onChange={(e) => setForm((f) => ({ ...f, concentration: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('form.description')}</label>
                    <textarea
                      className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold min-h-[80px]"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  {/* Variants Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] uppercase tracking-widest text-gold font-bold">{t('form.variants.title')}</label>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-[10px] uppercase tracking-widest font-bold bg-gold/10 text-gold px-3 py-1 rounded-full hover:bg-gold/20"
                      >
                        {t('form.variants.add')}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {form.variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-end bg-secondary/10 p-4 rounded-2xl relative group">
                          <div className="flex-1">
                            <label className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1 block">{t('form.variants.name')}</label>
                            <input
                              className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs outline-none focus:border-gold"
                              value={v.name}
                              onChange={(e) => updateVariant(i, { name: e.target.value })}
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1 block">{t('form.variants.price')}</label>
                            <input
                              type="number"
                              className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs outline-none focus:border-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={v.price === 0 && !editId ? '' : v.price}
                              onChange={(e) => updateVariant(i, { price: e.target.value === '' ? 0 : Number(e.target.value) })}
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1 block">{t('form.variants.stock')}</label>
                            <input
                              type="number"
                              className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs outline-none focus:border-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={v.stock === 0 && !editId ? '' : v.stock}
                              onChange={(e) => updateVariant(i, { stock: e.target.value === '' ? 0 : Number(e.target.value) })}
                            />
                          </div>
                          {form.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(i)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      {t('modal.labels.images', { max: MAX_IMAGES })}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 shadow-lg transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.map((item, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={item.url}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg border border-gold/30 border-dashed"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageFile(i)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 shadow-lg transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {canAddMoreImages && (
                        <label className="w-16 h-16 flex flex-col items-center justify-center bg-secondary/10 border border-border border-dashed rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                          <ImagePlus className="w-4 h-4 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => { addImageFiles(e.target.files); e.target.value = ''; }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <label htmlFor="isActive" className="text-sm font-body">{t('form.isActive')}</label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 rounded-full border border-border text-muted-foreground hover:bg-secondary/50 font-heading text-[10px] uppercase tracking-widest"
                    >
                      {t('form.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-3 rounded-full bg-gold text-primary-foreground font-heading uppercase tracking-widest disabled:opacity-50 text-[10px] font-bold shadow-lg shadow-gold/20"
                    >
                      {saving ? t('form.processing') : (editId ? t('form.submit_edit') : t('form.submit_create'))}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}