'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Package, Plus, Search, X, Eye, EyeOff, Pencil, ImagePlus, FolderTree, FlaskConical, Database, Flower2, Box } from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { catalogService } from '@/services/catalog.service';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations, useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { motion, AnimatePresence } from 'framer-motion';

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
  const locale = useLocale();
  const { isSidebarCollapsed: isCollapsed, setModalOpen } = useUIStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identity');
  const [showModal, setShowModalState] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSetShowModal = (open: boolean) => {
    setShowModalState(open);
    setModalOpen(open);
  };

  const isFiltered = search !== '' || brandFilter !== '' || categoryFilter !== '';
  const clearFilters = () => {
    setSearch('');
    setBrandFilter('');
    setCategoryFilter('');
    setSkip(0);
  };
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    scentNotes: [] as { name: string; type: 'TOP' | 'MIDDLE' | 'BASE' }[],
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.adminList({
        search: search || undefined,
        brandId: brandFilter || undefined,
        categoryId: categoryFilter || undefined,
        skip,
        take,
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, skip, take]);

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
    setSkip(0);
  }, [search, brandFilter, categoryFilter, take]);

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
            scentNotes: p.notes?.map(n => ({ name: n.note.name, type: n.note.type })) ?? [],
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
    handleSetShowModal(false);
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
      scentNotes: [],
    });
    handleSetShowModal(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setImageFiles([]);
    setExistingImages([]);
    setLoadingProduct(true);
    handleSetShowModal(true);
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

  const addScentNote = () => {
    setForm(f => ({
      ...f,
      scentNotes: [...f.scentNotes, { name: '', type: 'TOP' }]
    }));
  };

  const removeScentNote = (index: number) => {
    setForm(f => ({
      ...f,
      scentNotes: f.scentNotes.filter((_, i) => i !== index)
    }));
  };

  const updateScentNote = (index: number, data: Partial<typeof form.scentNotes[0]>) => {
    setForm(f => ({
      ...f,
      scentNotes: f.scentNotes.map((n, i) => i === index ? { ...n, ...data } : n)
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
    })),
    scentNotes: form.scentNotes.filter(n => n.name.trim()).map(n => ({
      name: n.name.trim(),
      type: n.type
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

  const currentPage = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-10 md:mb-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
            <button
              type="button"
              onClick={openCreate}
              className="flex-1 lg:flex-none bg-gold text-primary-foreground px-10 py-4 rounded-full font-heading text-[11px] uppercase tracking-[.2em] font-extrabold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gold/20 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              {t('add_new')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard/admin/catalog`)}
              className="flex-1 lg:flex-none bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-white/10 text-foreground px-10 py-4 rounded-full font-heading text-[11px] uppercase tracking-[.2em] font-bold flex items-center justify-center gap-3 hover:bg-secondary transition-all"
            >
              <FolderTree className="w-5 h-5 opacity-60" />
              {"Danh mục"}
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-secondary/5 dark:bg-white/[0.02] p-4 rounded-[2rem] border border-border/50 backdrop-blur-sm">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-gold transition-colors" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="w-full bg-white dark:bg-zinc-950/50 border border-border/50 rounded-2xl py-4 pl-14 pr-4 text-sm outline-none focus:border-gold/50 transition-all font-bold uppercase tracking-widest placeholder:text-muted-foreground/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-white dark:bg-zinc-950/50 border border-border/50 rounded-2xl px-6 py-4 text-[10px] uppercase tracking-widest font-bold outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer min-w-[160px] text-foreground"
            >
              <option value="" className="bg-background">{t('form.brand')} - ALL</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-background">{b.name}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-white dark:bg-zinc-950/50 border border-border/50 rounded-2xl px-6 py-4 text-[10px] uppercase tracking-widest font-bold outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer min-w-[160px] text-foreground"
            >
              <option value="" className="bg-background">{t('form.category')} - ALL</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-background">{c.name}</option>
              ))}
            </select>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-muted-foreground px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 group"
              >
                <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                Reset
              </button>
            )}
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {products.map((p, index) => (
                <div
                  key={p.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={cn(
                    "group relative glass bg-white dark:bg-zinc-900/40 rounded-[3rem] border border-white/10 overflow-hidden hover:border-gold/30 transition-all duration-700 animate-in fade-in zoom-in-95 fill-mode-both",
                    !p.isActive && "opacity-75 grayscale-[0.5]"
                  )}
                >
                  {/* Visual Container */}
                  <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                    {p.images?.length ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gold/10" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Status Badges */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        {!p.isActive && (
                          <div className="bg-zinc-900/80 backdrop-blur-md text-zinc-400 text-[8px] px-3 py-1.5 rounded-full uppercase tracking-widest font-black border border-white/5">
                            {t('status.hidden')}
                          </div>
                        )}
                        {getTotalStock(p) <= 5 && p.isActive && (
                          <div className="bg-amber-500/90 backdrop-blur-md text-white text-[8px] px-3 py-1.5 rounded-full uppercase tracking-[.2em] font-black border border-amber-400/20 shadow-lg animate-pulse">
                            {"Sắp Hết Hàng"}
                          </div>
                        )}
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                        <span className="text-[8px] text-white uppercase tracking-widest font-bold">{p.gender}</span>
                      </div>
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(p.id);
                        }}
                        className="w-12 h-12 bg-white text-zinc-950 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(p.id, p.isActive);
                        }}
                        className="w-12 h-12 bg-zinc-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border border-white/10"
                      >
                        {p.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Container */}
                  <div className="p-8">
                    <div className="mb-4">
                      <p className="text-[10px] text-gold uppercase tracking-[.4em] font-black mb-2 opacity-60">{p.brand?.name ?? 'Chưa Có Thương Hiệu'}</p>
                      <h3 className="font-heading text-xl md:text-2xl text-foreground line-clamp-1 leading-tight">{p.name}</h3>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                        {p.concentration || "Parfum"}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                        {p.scentFamily?.name || "Floral"}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-6 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[.2em] font-bold">Giá Bán</p>
                        <span className="text-lg font-serif italic text-gold">
                          {getPriceRange(p)}
                        </span>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[.2em] font-bold">Trạng Thái</p>
                        <div className="flex items-center gap-2 justify-end">
                           <div className={cn("w-1.5 h-1.5 rounded-full", p.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-500")} />
                           <span className={cn("text-[10px] font-black tracking-widest uppercase", p.isActive ? "text-emerald-500" : "text-zinc-500")}>
                             {p.isActive ? "Hoạt Động" : "Ẩn"}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-20">
              <p className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-extrabold text-center md:text-left">
                {total === 0
                  ? '0'
                  : `${skip + 1}-${Math.min(skip + take, total)} / ${total}`}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                <select
                  value={take}
                  onChange={(e) => setTake(Number(e.target.value))}
                  className="bg-white dark:bg-zinc-900 border border-border rounded-full px-4 py-2 text-[10px] uppercase tracking-widest font-bold outline-none focus:border-gold shadow-sm text-foreground"
                >
                  <option value={10} className="bg-background">10 / p</option>
                  <option value={20} className="bg-background">20 / p</option>
                  <option value={40} className="bg-background">40 / p</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSkip((s) => Math.max(0, s - take))}
                    disabled={skip === 0}
                    className="px-6 py-3.5 md:py-2 rounded-full border border-border text-base md:text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-30 bg-white dark:bg-zinc-900 active:scale-95 transition-all shadow-sm"
                  >
                    Trước
                  </button>
                  <span className="text-[10px] uppercase tracking-[.3em] font-extrabold text-muted-foreground min-w-16 text-center">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSkip((s) => (s + take < total ? s + take : s))}
                    disabled={skip + take >= total}
                    className="px-6 py-3.5 md:py-2 rounded-full border border-border text-base md:text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-30 bg-white dark:bg-zinc-900 active:scale-95 transition-all shadow-sm"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {showModal && (
            <div 
              className={cn(
                  "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 bg-white/40 dark:bg-zinc-950/80 backdrop-blur-2xl transition-all duration-500 font-body",
                  "left-0 md:left-20",
                  !isCollapsed && "lg:left-72"
              )} 
              onClick={closeModal}
            >
              <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 30 }}
                 className="bg-background border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-5xl w-full h-full sm:h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative"
                 onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
              {/* Modal Header */}
              <div className="h-20 shrink-0 flex justify-between items-center px-10 border-b border-border sticky top-0 bg-background/90 backdrop-blur-xl z-20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-gold" />
                    <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80">{editId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</span>
                  </div>
                  <h2 className="text-2xl font-heading tracking-tighter leading-none uppercase">
                    {editId ? form.name || t('form.title_edit') : t('form.title_create')}
                  </h2>
                </div>
                <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center bg-secondary/20 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-all active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-64 border-r border-white/10 bg-white/80 dark:bg-zinc-900/60 overflow-y-auto hidden md:block">
                  <nav className="p-8 space-y-2">
                    {[
                      { id: 'identity', icon: Package, label: 'Thông Tin Chính' },
                      { id: 'essence', icon: FlaskConical, label: 'Đặc Tính Hương' },
                      { id: 'composition', icon: Flower2, label: 'Cấu Trúc Nốt Hương' },
                      { id: 'inventory', icon: Database, label: 'Biến Thể & Kho' },
                      { id: 'gallery', icon: ImagePlus, label: 'Bộ Sưu Tập Ảnh' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px]",
                          activeTab === tab.id
                            ? "bg-gold text-white shadow-lg shadow-gold/20"
                            : "text-muted-foreground hover:bg-secondary/50"
                        )}
                      >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : "text-gold/50")} />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </aside>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 pb-32 sm:pb-12">
                  {loadingProduct ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6">
                      <div className="w-16 h-16 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
                      <p className="text-[10px] uppercase font-black tracking-[.4em] text-muted-foreground animate-pulse">Đang Tải Dữ Liệu...</p>
                    </div>
                  ) : (
                    <form id="productForm" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-16 pb-20">
                      {activeTab === 'identity' && (
                        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                          <div className="space-y-2 border-l-4 border-gold pl-6">
                            <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Thông Tin Cơ Bản</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Định danh và phân loại sản phẩm.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Tên Sản Phẩm *</label>
                              <input
                                className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-sm font-bold placeholder:text-muted-foreground/30"
                                value={form.name}
                                onChange={(e) => onNameChange(e.target.value)}
                                required
                                placeholder="Ví dụ: BACCARAT ROUGE 540"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Đường Dẫn (Slug) *</label>
                              <input
                                className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-mono placeholder:text-muted-foreground/30"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                required
                                placeholder="baccarat-rouge-540"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Thương Hiệu *</label>
                              <select
                                className="w-full bg-background border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer text-foreground"
                                value={form.brandId || ''}
                                onChange={(e) => setForm((f) => ({ ...f, brandId: Number(e.target.value) }))}
                                required
                              >
                                <option value="" className="bg-background text-foreground">— Chọn Thương Hiệu —</option>
                                {brands.map((b) => (
                                  <option key={b.id} value={b.id} className="bg-background text-foreground">{b.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Phân Loại</label>
                              <select
                                className="w-full bg-background border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer text-foreground"
                                value={form.categoryId === '' ? '' : form.categoryId}
                                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value === '' ? '' : Number(e.target.value) }))}
                              >
                                <option value="" className="bg-background text-foreground">— Chọn Danh Mục —</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border border-border/50 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[12px] uppercase tracking-[.2em] font-black">Hiển Thị Công Khai</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Bật/tắt hiển thị sản phẩm cho khách hàng.</p>
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
                        </section>
                      )}

                      {activeTab === 'essence' && (
                        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                          <div className="space-y-2 border-l-4 border-gold pl-6">
                            <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Đặc Tính Mùi Hương</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Cấu hình các thông số cảm quan của sản phẩm.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Nhóm Hương</label>
                              <select
                                className="w-full bg-background border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer text-foreground"
                                value={form.scentFamilyId === '' ? '' : form.scentFamilyId}
                                onChange={(e) => setForm((f) => ({ ...f, scentFamilyId: e.target.value === '' ? '' : Number(e.target.value) }))}
                              >
                                <option value="">— Chọn Nhóm Hương —</option>
                                {scentFamilies.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Giới Tính</label>
                              <select
                                className="w-full bg-background border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer text-foreground"
                                value={form.gender}
                                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                              >
                                <option value="">— Chọn Giới Tính —</option>
                                <option value="female">Nữ (Feminine)</option>
                                <option value="male">Nam (Masculine)</option>
                                <option value="unisex">Unisex</option>
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Độ Lưu Hương</label>
                              <input
                                className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold placeholder:text-muted-foreground/30"
                                value={form.longevity}
                                onChange={(e) => setForm((f) => ({ ...f, longevity: e.target.value }))}
                                placeholder="Ví dụ: 12H+ RẤT LÂU"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Nồng Độ</label>
                              <input
                                className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-7 outline-none focus:border-gold transition-all text-xs font-bold placeholder:text-muted-foreground/30"
                                value={form.concentration}
                                onChange={(e) => setForm((f) => ({ ...f, concentration: e.target.value }))}
                                placeholder="Ví dụ: EXTRAIT DE PARFUM"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Mô Tả Sản Phẩm</label>
                            <textarea
                              className="w-full bg-secondary/10 border border-border rounded-[2.5rem] py-8 px-10 outline-none focus:border-gold min-h-[250px] transition-all text-sm font-medium leading-relaxed resize-none shadow-inner"
                              value={form.description}
                              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                              placeholder="Mô tả câu chuyện, cảm xúc và trải nghiệm của mùi hương này..."
                            />
                          </div>
                        </section>
                      )}

                      {activeTab === 'composition' && (
                        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                          <div className="flex justify-between items-end border-l-4 border-gold pl-6">
                            <div className="space-y-2">
                              <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Cấu Trúc Nốt Hương</h3>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Phân tầng cấu trúc hương đầu, giữa và cuối.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addScentNote}
                              className="bg-gold text-primary-foreground text-[10px] uppercase tracking-[.2em] font-black px-8 py-4 rounded-full shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              + Thêm Nốt Hương
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                            {form.scentNotes.map((n, i) => (
                              <div key={i} className="flex items-center gap-8 bg-zinc-50 dark:bg-white/[0.02] p-10 rounded-[3rem] border border-border relative group hover:border-gold/30 transition-all">
                                <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shrink-0 border border-border shadow-sm">
                                  <span className="text-xs font-black text-gold">{i + 1}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                                  <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Tên Nốt Hương</label>
                                    <input
                                      className="w-full bg-secondary/5 border border-border rounded-xl py-4 px-6 text-sm font-bold outline-none focus:border-gold transition-all"
                                      value={n.name}
                                      placeholder="Ví dụ: Hoa Nhài, Gỗ Đàn Hương"
                                      onChange={(e) => updateScentNote(i, { name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Tầng Hương</label>
                                    <select
                                      className="w-full bg-secondary/5 border border-border rounded-xl py-4 px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all cursor-pointer"
                                      value={n.type}
                                      onChange={(e) => updateScentNote(i, { type: e.target.value as 'TOP' | 'MIDDLE' | 'BASE' })}
                                    >
                                      <option value="TOP">Hương Đầu (Top Note)</option>
                                      <option value="MIDDLE">Hương Giữa (Heart Note)</option>
                                      <option value="BASE">Hương Cuối (Base Note)</option>
                                    </select>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeScentNote(i)}
                                  className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                >
                                  <X className="w-6 h-6" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {activeTab === 'inventory' && (
                        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                          <div className="flex justify-between items-end border-l-4 border-gold pl-6">
                            <div className="space-y-2">
                              <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Biến Thể & Kho Hàng</h3>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Cấu hình dung tích, giá bán và số lượng tồn kho.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addVariant}
                              className="bg-gold text-primary-foreground text-[10px] uppercase tracking-[.2em] font-black px-8 py-4 rounded-full shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              + Thêm Biến Thể
                            </button>
                          </div>

                          <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-[3rem] border border-border overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                              <thead className="bg-zinc-100/50 dark:bg-white/5">
                                <tr className="border-b border-border">
                                  <th className="px-10 py-6 text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground">Dung Tích / Tên</th>
                                  <th className="px-10 py-6 text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground">Giá Bán</th>
                                  <th className="px-10 py-6 text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground">Số Lượng Kho</th>
                                  <th className="px-10 py-6 text-right"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {form.variants.map((v, i) => (
                                  <tr key={i} className="group hover:bg-gold/5 transition-colors">
                                    <td className="px-10 py-8">
                                      <input
                                        className="w-full bg-transparent border-b border-transparent focus:border-gold outline-none text-sm font-bold uppercase tracking-widest py-1 transition-all"
                                        value={v.name}
                                        placeholder="Ví dụ: 100ml, 50ml, Travel Size"
                                        onChange={(e) => updateVariant(i, { name: e.target.value })}
                                      />
                                    </td>
                                    <td className="px-10 py-8">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm font-serif italic">₫</span>
                                        <input
                                          type="number"
                                          className="w-32 bg-transparent border-b border-transparent focus:border-gold outline-none text-sm font-mono py-1 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          value={v.price || ''}
                                          onChange={(e) => updateVariant(i, { price: e.target.value === '' ? 0 : Number(e.target.value) })}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-10 py-8">
                                      <input
                                        type="number"
                                        className="w-24 bg-transparent border-b border-transparent focus:border-gold outline-none text-sm font-mono py-1 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={v.stock || ''}
                                        onChange={(e) => updateVariant(i, { stock: e.target.value === '' ? 0 : Number(e.target.value) })}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                      {form.variants.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeVariant(i)}
                                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      )}

                      {activeTab === 'gallery' && (
                        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                          <div className="space-y-2 border-l-4 border-gold pl-6">
                            <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Bộ Sưu Tập Ảnh</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Tải lên hình ảnh chất lượng cao cho sản phẩm.</p>
                          </div>

                          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-12 rounded-[4rem] border border-border shadow-2xl">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                              {existingImages.map((img) => (
                                <div key={img.id} className="relative aspect-[3/4] group shadow-2xl rounded-3xl overflow-hidden border border-border transition-all hover:scale-[1.02]">
                                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImage(img)}
                                      className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/40"
                                    >
                                      <X className="w-7 h-7" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {imageFiles.map((item, i) => (
                                <div key={i} className="relative aspect-[3/4] group shadow-2xl rounded-3xl overflow-hidden border-4 border-dashed border-gold/30 bg-gold/5 transition-all hover:scale-[1.02]">
                                  <img src={item.url} alt="" className="w-full h-full object-cover opacity-60" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => removeImageFile(i)}
                                      className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/40"
                                    >
                                      <X className="w-7 h-7" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {canAddMoreImages && (
                                <label className="aspect-[3/4] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 border-4 border-dashed border-gold/20 rounded-3xl cursor-pointer hover:border-gold/60 hover:bg-gold/5 transition-all active:scale-95 shadow-xl group">
                                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                                    <ImagePlus className="w-8 h-8 text-gold" />
                                  </div>
                                  <span className="text-[12px] uppercase tracking-[.4em] font-black text-gold">{totalImages} / {MAX_IMAGES}</span>
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
                        </section>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 h-24 border-t border-border px-12 flex items-center justify-end gap-6 bg-zinc-50 dark:bg-black/20 backdrop-blur-xl z-20">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3.5 rounded-full text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-foreground transition-all"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  form="productForm"
                  disabled={saving || loadingProduct}
                  className="px-12 py-4 rounded-full bg-gold text-primary-foreground font-heading text-[11px] uppercase tracking-[.2em] font-black disabled:opacity-50 shadow-2xl shadow-gold/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                      {t('form.processing')}
                    </div>
                  ) : editId ? t('form.submit_edit') : t('form.submit_create')}
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