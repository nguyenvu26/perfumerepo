'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { cartService } from '@/services/cart.service';
import { favoriteService } from '@/services/favorite.service';
import { type Product, type ProductVariant } from '@/services/product.service';

import ReviewList from '../review/review-list';
import ReviewSummaryView from '../review/review-summary';
import StarRating from '../review/star-rating';

export default function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations('product_detail');
  const tCommon = useTranslations('common');
  const tFeatured = useTranslations('featured');
  const locale = useLocale();
  const format = useFormatter();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const isVi = locale === 'vi';
  const labels = useMemo(
    () =>
      isVi
        ? {
            description: 'M\u00f4 t\u1ea3 m\u00f9i h\u01b0\u01a1ng',
            descriptionHint: 'T\u00f3m t\u1eaft nhanh \u0111\u1ec3 d\u1ec5 \u0111\u1ecdc h\u01a1n, b\u1ea1n c\u00f3 th\u1ec3 m\u1edf r\u1ed9ng khi c\u1ea7n.',
            gallery: 'B\u1ed9 s\u01b0u t\u1eadp h\u00ecnh \u1ea3nh',
            optionSummary: 'L\u1ef1a ch\u1ecdn hi\u1ec7n t\u1ea1i',
            gender: 'Gi\u1edbi t\u00ednh',
            scentFamily: 'Nh\u00f3m h\u01b0\u01a1ng',
            availability: 'Tr\u1ea1ng th\u00e1i',
            inStock: 'S\u1eb5n c\u00f3',
            outOfStock: 'H\u1ebft h\u00e0ng',
            selectedSize: 'Dung t\u00edch',
            imageCount: 'H\u00ecnh \u1ea3nh',
            performance: 'Hi\u1ec7u \u1ee9ng l\u01b0u h\u01b0\u01a1ng',
            productProfile: 'H\u1ed3 s\u01a1 s\u1ea3n ph\u1ea9m',
            craftsmanship: 'Tr\u1ea3i nghi\u1ec7m cao c\u1ea5p',
            craftsmanshipDesc:
              'B\u1ed1 c\u1ee5c m\u1edbi t\u1eadp trung v\u00e0o h\u00ecnh \u1ea3nh, th\u00f4ng tin ch\u00ednh v\u00e0 thao t\u00e1c mua h\u00e0ng \u0111\u1ec3 ng\u01b0\u1eddi d\u00f9ng theo d\u00f5i d\u1ec5 h\u01a1n.',
            reviewSection: '\u0110\u00e1nh gi\u00e1 kh\u00e1ch h\u00e0ng',
            readMore: 'Xem th\u00eam',
            readLess: 'Thu g\u1ecdn',
          }
        : {
            description: 'Fragrance description',
            descriptionHint: 'A cleaner preview keeps long copy easier to scan while remaining expandable.',
            gallery: 'Image gallery',
            optionSummary: 'Current selection',
            gender: 'Gender',
            scentFamily: 'Scent family',
            availability: 'Availability',
            inStock: 'Available',
            outOfStock: 'Out of stock',
            selectedSize: 'Size',
            imageCount: 'Images',
            performance: 'Performance',
            productProfile: 'Product profile',
            craftsmanship: 'Premium experience',
            craftsmanshipDesc:
              'This layout focuses on stronger imagery, cleaner product information, and clearer purchase actions.',
            reviewSection: 'Customer reviews',
            readMore: 'Read more',
            readLess: 'Show less',
          },
    [isVi]
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants?.[0] || null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    favoriteService
      .isFavorite(product.id)
      .then((value) => {
        if (mounted) setIsFavorite(value);
      })
      .catch(() => {
        if (mounted) setIsFavorite(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, product.id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!selectedVariant) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await cartService.addItem(selectedVariant.id, 1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error(t('toast_login_required'));
      router.push('/login');
      return;
    }

    if (favoriteLoading) return;
    if (!selectedVariant && !isFavorite) {
      toast.error(t('toast_select_size'));
      return;
    }

    setFavoriteLoading(true);
    try {
      const nextFavorite = await favoriteService.toggleProduct(product.id, isFavorite, selectedVariant?.id);
      setIsFavorite(nextFavorite);
      toast.success(nextFavorite ? t('toast_favorite_added') : t('toast_favorite_removed'));
    } catch (e: unknown) {
      toast.error((e as Error).message || t('toast_favorite_error'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product.images && activeImageIndex < product.images.length - 1) {
      setActiveImageIndex((i) => i + 1);
    }
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product.images && activeImageIndex > 0) {
      setActiveImageIndex((i) => i - 1);
    }
  };

  const formatCurrency = (amount: number) =>
    format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0,
    });

  const getGenderLabel = (g?: string | null) => {
    if (!g) return 'Unisex';
    const upper = g.toUpperCase();
    if (upper === 'MALE' || upper === 'NAM' || upper === 'MEN') return isVi ? 'Nam' : 'Male';
    if (upper === 'FEMALE' || upper === 'NỮ' || upper === 'NU' || upper === 'WOMEN') return isVi ? 'Nữ' : 'Female';
    return 'Unisex';
  };

  const rating = 4.5;
  const activeImage = product.images?.[activeImageIndex]?.url || product.images?.[0]?.url;
  const scentFamily = product.scentFamily?.name || 'Signature';
  const gender = getGenderLabel(product.gender);
  const availability = selectedVariant?.stock && selectedVariant.stock > 0 ? labels.inStock : labels.outOfStock;
  const descriptionText = product.description || t('fallback_description');
  const canExpandDescription = descriptionText.length > 360;

  type NoteType = 'TOP' | 'MIDDLE' | 'BASE';
  type ProductNoteEntry = {
    note?: { name?: string; type?: string | null } | null;
    name?: string | null;
    type?: string | null;
    noteType?: string | null;
    layer?: string | null;
  };

  const normalizeNoteType = (value?: string | null): NoteType | null => {
    if (!value) return null;
    const normalized = value
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_-]+/g, '');
    if (normalized === 'TOP' || normalized === 'HEAD' || normalized === 'TOPNOTE' || normalized === 'HUONGDAU') return 'TOP';
    if (normalized === 'MIDDLE' || normalized === 'MID' || normalized === 'HEART' || normalized === 'MIDDLENOTE' || normalized === 'HEARTNOTE' || normalized === 'HUONGGIUA') return 'MIDDLE';
    if (normalized === 'BASE' || normalized === 'BOTTOM' || normalized === 'BASENOTE' || normalized === 'HUONGCUOI') return 'BASE';
    return null;
  };

  const resolveNoteName = (entry: ProductNoteEntry) => (entry.note?.name || entry.name || '').trim();
  const resolveNoteType = (entry: ProductNoteEntry) =>
    normalizeNoteType(entry.note?.type || entry.type || entry.noteType || entry.layer);

  const noteGroups = [
    {
      type: 'TOP' as const,
      label: t('top_notes'),
      icon: <Sparkles className="h-6 w-6 text-gold" />,
    },
    {
      type: 'MIDDLE' as const,
      label: t('heart_notes'),
      icon: <Heart className="h-6 w-6 text-gold" />,
    },
    {
      type: 'BASE' as const,
      label: t('base_notes'),
      icon: <ShieldCheck className="h-6 w-6 text-gold" />,
    },
  ]
    .map((group) => ({
      ...group,
      items:
        (product.notes as ProductNoteEntry[] | undefined)
          ?.filter((entry) => resolveNoteType(entry) === group.type)
          .map(resolveNoteName)
          .filter(Boolean) || [],
    }))
    .filter((group) => group.items.length > 0);

  const productFacts = [
    {
      label: t('concentration'),
      value: product.concentration || 'Eau de Parfum',
    },
    {
      label: t('longevity'),
      value: product.longevity || 'Long lasting',
    },
    {
      label: labels.gender,
      value: gender,
    },
    {
      label: labels.scentFamily,
      value: scentFamily,
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] xl:items-start">
        <div className="space-y-6 xl:sticky xl:top-28">
          <div className="overflow-hidden rounded-[2.6rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,239,230,0.72))] shadow-[0_30px_90px_-48px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
            <div 
              className="relative aspect-[4/5] overflow-hidden group cursor-zoom-in"
              onClick={() => {
                if (product.images?.length) setIsZoomed(true);
              }}
            >
              {activeImage ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={activeImage}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </AnimatePresence>

                  {activeImageIndex > 0 && (
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/50 text-foreground opacity-0 backdrop-blur transition-all hover:bg-white group-hover:opacity-100 dark:border-white/10 dark:bg-black/50 dark:hover:bg-black z-20"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {product.images && activeImageIndex < product.images.length - 1 && (
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/50 text-foreground opacity-0 backdrop-blur transition-all hover:bg-white group-hover:opacity-100 dark:border-white/10 dark:bg-black/50 dark:hover:bg-black z-20"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                  <div className="pointer-events-none absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/50 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-black/50 z-20">
                    <ZoomIn className="h-5 w-5" />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary/20 px-6 text-center text-sm font-medium text-muted-foreground">
                  {t('visual_data_unavailable')}
                </div>
              )}

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 pointer-events-none z-10">
                <span className="rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  {product.brand?.name || t('elite_series')}
                </span>
                <span className="rounded-full bg-white/88 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur dark:bg-black/75 dark:text-white">
                  {labels.imageCount}: {product.images?.length || 0}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-6 text-white md:p-8 pointer-events-none z-10">
                <p className="text-sm font-medium text-gold">{labels.gallery}</p>
              </div>
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.4rem] border transition-all ${
                    activeImageIndex === index
                      ? 'border-gold shadow-[0_18px_40px_-26px_rgba(197,160,89,0.75)]'
                      : 'border-black/8 hover:border-gold/40 dark:border-white/10'
                  }`}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="rounded-[2rem] border border-black/6 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.25)] dark:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gold">{labels.description}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{labels.descriptionHint}</p>
              </div>
              {canExpandDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((current) => !current)}
                  className="shrink-0 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-all hover:border-gold hover:bg-gold hover:text-luxury-black"
                >
                  {isDescriptionExpanded ? labels.readLess : labels.readMore}
                </button>
              )}
            </div>

            <div className="relative mt-4">
              <p
                className={`text-base leading-8 text-muted-foreground ${
                  isDescriptionExpanded ? '' : 'line-clamp-8'
                }`}
              >
                {descriptionText}
              </p>
              {!isDescriptionExpanded && canExpandDescription && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/92 to-transparent" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2.6rem] border border-black/6 bg-card p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.3)] dark:border-white/10 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold">
                {product.brand?.name || t('elite_series')}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t('archived_hash')}
                {product.slug.toUpperCase().slice(0, 8)}
              </span>
            </div>

            <h1 className="mt-5 text-4xl leading-tight text-foreground md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <StarRating rating={rating} readOnly size={15} />
                <span className="text-sm text-muted-foreground">{t('rating_label', { rating })}</span>
              </div>
              <span className="rounded-full border border-black/8 bg-background px-3 py-1.5 text-sm text-foreground dark:border-white/10">
                {labels.performance}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <p className="text-4xl font-semibold text-gold">
                {selectedVariant ? formatCurrency(selectedVariant.price) : t('select_size')}
              </p>
              <span className="rounded-full border border-black/8 bg-background px-3 py-1.5 text-sm font-medium text-foreground dark:border-white/10">
                {availability}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.6rem] border border-black/6 bg-background p-5 dark:border-white/10">
                <p className="text-sm font-medium text-muted-foreground">{labels.selectedSize}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {selectedVariant?.name || '--'}
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/6 bg-background p-5 dark:border-white/10">
                <p className="text-sm font-medium text-muted-foreground">{labels.scentFamily}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{scentFamily}</p>
              </div>
              <div className="rounded-[1.6rem] border border-black/6 bg-background p-5 dark:border-white/10">
                <p className="text-sm font-medium text-muted-foreground">{labels.gender}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{gender}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2.6rem] border border-black/6 bg-card p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.28)] dark:border-white/10 md:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="text-sm font-medium text-gold">{labels.optionSummary}</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">{t('select_olfactory_volume')}</h2>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {product.variants?.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`min-w-[120px] rounded-[1.5rem] border px-5 py-4 text-left transition-all ${
                    selectedVariant?.id === variant.id
                      ? 'border-gold bg-gold/10 shadow-[0_18px_36px_-24px_rgba(197,160,89,0.8)]'
                      : 'border-black/8 bg-background hover:border-gold/40 dark:border-white/10'
                  }`}
                >
                  <p className="text-base font-semibold text-foreground">{variant.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{formatCurrency(variant.price)}</p>
                </button>
              ))}
            </div>

            {error && <p className="mt-5 text-sm font-medium text-red-500">{error}</p>}
            {success && <p className="mt-5 text-sm font-medium text-emerald-500">{t('unit_added_queue')}</p>}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={loading || !selectedVariant}
                className="inline-flex min-h-[58px] flex-1 items-center justify-center gap-3 rounded-full bg-gold px-6 text-base font-semibold text-luxury-black transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  tCommon('processing')
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    {t('assemble_acquisition')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`inline-flex h-[58px] w-[58px] items-center justify-center rounded-full border transition-all ${
                  isFavorite
                    ? 'border-red-400/50 bg-red-500/10 text-red-700'
                    : 'border-black/8 bg-background text-muted-foreground hover:border-red-300 hover:text-red-400 dark:border-white/10'
                }`}
                aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-700/60' : ''}`} />
              </button>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2.2rem] border border-black/6 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.25)] dark:border-white/10">
              <p className="text-sm font-medium text-gold">{labels.productProfile}</p>
              <div className="mt-5 space-y-4">
                {productFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-black/6 bg-background px-4 py-4 dark:border-white/10"
                  >
                    <span className="text-sm text-muted-foreground">{fact.label}</span>
                    <span className="text-sm font-semibold text-foreground">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-black/6 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.25)] dark:border-white/10">
              <p className="text-sm font-medium text-gold">{labels.craftsmanship}</p>
              <div className="mt-6 grid gap-4">
                <div className="flex gap-4 rounded-[1.4rem] border border-black/6 bg-background p-4 dark:border-white/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t('pattern_matching')}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('pattern_matching_desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-[1.4rem] border border-black/6 bg-background p-4 dark:border-white/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t('authenticity_shield')}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('authenticity_shield_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {noteGroups.length > 0 && (
            <section className="rounded-[2.6rem] border border-black/6 bg-card p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.25)] dark:border-white/10 md:p-8">
              <div className="border-b border-border/60 pb-4">
                <p className="text-sm font-medium text-gold">{labels.scentFamily}</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">{t('olfactory_structure')}</h2>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {noteGroups.map((group) => (
                  <motion.div
                    key={group.type}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center text-center rounded-[2rem] border border-black/6 bg-background p-6 md:p-8 dark:border-white/10"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/10 mb-5">
                      {group.icon}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground leading-snug">
                      {group.label}
                    </h3>
                    <div className="my-4 h-[2px] w-12 bg-gold/20" />
                    <p className="text-sm leading-7 text-muted-foreground">{group.items.join(', ')}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <p className="text-sm font-medium text-gold">{labels.reviewSection}</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">{product.name}</h2>
        </div>
        <div className="space-y-8">
          <ReviewSummaryView productId={product.id} />
          <ReviewList productId={product.id} />
        </div>
      </section>

      <AnimatePresence>
        {isZoomed && product.images?.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur-xl md:p-12"
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-secondary/20 md:right-10 md:top-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="relative flex h-full max-h-[85vh] w-full max-w-6xl items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  src={product.images[activeImageIndex]?.url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain drop-shadow-2xl"
                />
              </AnimatePresence>

              {activeImageIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-0 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border/20 bg-background/50 text-foreground transition-colors hover:bg-secondary/40 md:-left-12 md:h-16 md:w-16"
                >
                  <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </button>
              )}
              {activeImageIndex < product.images.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-0 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border/20 bg-background/50 text-foreground transition-colors hover:bg-secondary/40 md:-right-12 md:h-16 md:w-16"
                >
                  <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </button>
              )}
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border/50 bg-background/50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur z-50">
              {activeImageIndex + 1} / {product.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
