'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { cartService } from '@/services/cart.service';
import { favoriteService } from '@/services/favorite.service';
import { type Product, type ProductVariant } from '@/services/product.service';
import { cn } from '@/lib/utils';

import ReviewList from '../review/review-list';
import ReviewSummaryView from '../review/review-summary';
import StarRating from '../review/star-rating';
import { reviewService, type ReviewStats } from '@/services/review.service';

type NoteType = 'TOP' | 'MIDDLE' | 'BASE';
type DetailTab = 'notes' | 'details' | 'recommendations';

type ProductNoteEntry = {
  note?: { name?: string; type?: string | null } | null;
  name?: string | null;
  type?: string | null;
  noteType?: string | null;
  layer?: string | null;
};

export default function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations('product_detail');
  const tFeatured = useTranslations('featured');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isVi = locale === 'vi';

  const labels = useMemo(
    () =>
      isVi
        ? {
            brandFallback: 'Thương hiệu',
            gender: 'Giới tính',
            size: 'Dung tích',
            quantity: 'Số lượng',
            addToCart: 'Thêm vào giỏ hàng',
            favorite: 'Yêu thích',
            callNow: 'Gọi ngay',
            phone: '0935873054',
            serviceTime: '9:00 - 21:00',
            freeConsult: 'Tư vấn miễn phí',
            inStock: 'Còn hàng',
            outOfStock: 'Hết hàng',
            noReviews: 'Chưa có đánh giá',
            notesTab: 'Hương',
            detailsTab: 'Đặc điểm',
            recommendationsTab: 'Khuyên dùng',
            scentTone: 'Tone hương',
            topNotes: 'Hương đầu',
            middleNotes: 'Hương giữa',
            baseNotes: 'Hương cuối',
            description: 'Mô tả',
            concentration: 'Nồng độ',
            longevity: 'Lưu hương',
            sillage: 'Tỏa hương',
            category: 'Danh mục',
            seasons: 'Mùa',
            timeOfDay: 'Thời điểm',
            occasions: 'Dịp dùng',
            styles: 'Phong cách',
            targetAge: 'Độ tuổi',
            ingredients: 'Thành phần',
            reviews: 'Đánh giá khách hàng',
            fallbackDescription: 'Một mùi hương tinh tế, phù hợp với nhiều dịp khác nhau.',
          }
        : {
            brandFallback: 'Brand',
            gender: 'Gender',
            size: 'Size',
            quantity: 'Quantity',
            addToCart: 'Add to cart',
            favorite: 'Favorite',
            callNow: 'Call now',
            phone: '0935873054',
            serviceTime: '9:00 - 21:00',
            freeConsult: 'Free consultation',
            inStock: 'In stock',
            outOfStock: 'Out of stock',
            noReviews: 'No reviews yet',
            notesTab: 'notes',
            detailsTab: 'details',
            recommendationsTab: 'recommended',
            scentTone: 'scent tone',
            topNotes: 'top notes',
            middleNotes: 'heart notes',
            baseNotes: 'base notes',
            description: 'description',
            concentration: 'concentration',
            longevity: 'longevity',
            sillage: 'sillage',
            category: 'category',
            seasons: 'seasons',
            timeOfDay: 'time of day',
            occasions: 'occasions',
            styles: 'styles',
            targetAge: 'target age',
            ingredients: 'ingredients',
            reviews: 'Customer reviews',
            fallbackDescription: 'A refined fragrance suited for many occasions.',
          },
    [isVi],
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('notes');
  const [loading, setLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);

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

  useEffect(() => {
    reviewService
      .getStats(product.id)
      .then(setStats)
      .catch(() => setStats(null));
  }, [product.id]);

  const formatCurrency = (amount: number) =>
    format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0,
    });

  const getGenderLabel = (value?: string | null) => {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'MALE' || normalized === 'MEN' || normalized === 'NAM') return isVi ? 'Nam' : 'Male';
    if (normalized === 'FEMALE' || normalized === 'WOMEN' || normalized === 'NU' || normalized === 'NỮ') return isVi ? 'Nữ' : 'Female';
    return 'Unisex';
  };

  const normalizeNoteType = (value?: string | null): NoteType | null => {
    if (!value) return null;
    const normalized = value
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_-]+/g, '');
    if (['TOP', 'HEAD', 'TOPNOTE', 'HUONGDAU'].includes(normalized)) return 'TOP';
    if (['MIDDLE', 'MID', 'HEART', 'MIDDLENOTE', 'HEARTNOTE', 'HUONGGIUA'].includes(normalized)) return 'MIDDLE';
    if (['BASE', 'BOTTOM', 'BASENOTE', 'HUONGCUOI'].includes(normalized)) return 'BASE';
    return null;
  };

  const noteGroups = useMemo(() => {
    const entries = (product.notes || []) as ProductNoteEntry[];
    const resolveName = (entry: ProductNoteEntry) => (entry.note?.name || entry.name || '').trim();
    const resolveType = (entry: ProductNoteEntry) =>
      normalizeNoteType(entry.note?.type || entry.type || entry.noteType || entry.layer);

    const pick = (type: NoteType) =>
      entries
        .filter((entry) => resolveType(entry) === type)
        .map(resolveName)
        .filter(Boolean);

    return {
      TOP: pick('TOP'),
      MIDDLE: pick('MIDDLE'),
      BASE: pick('BASE'),
    };
  }, [product.notes]);

  const allNotes = [...noteGroups.TOP, ...noteGroups.MIDDLE, ...noteGroups.BASE];
  const activeImage = product.images?.[activeImageIndex]?.url || product.images?.[0]?.url;
  const shortDescription = product.shortDescription || product.description || labels.fallbackDescription;
  const longDescription = product.longDescription || product.description || labels.fallbackDescription;
  const gender = getGenderLabel(product.gender);
  const availability = selectedVariant?.stock && selectedVariant.stock > 0 ? labels.inStock : labels.outOfStock;
  const rating = stats?.average || 0;

  const detailRows = [
    { label: labels.concentration, value: product.concentration },
    { label: labels.longevity, value: product.longevity },
    { label: labels.sillage, value: product.sillage },
    { label: labels.gender, value: gender },
    { label: labels.category, value: product.category?.name },
    { label: labels.ingredients, value: product.ingredients },
  ].filter((row) => row.value);

  const recommendationRows = [
    { label: labels.seasons, value: product.seasons?.join(', ') },
    { label: labels.timeOfDay, value: product.timeOfDay?.join(', ') },
    { label: labels.occasions, value: product.occasions?.join(', ') },
    { label: labels.styles, value: product.styles?.join(', ') },
    { label: labels.targetAge, value: product.targetAge },
  ].filter((row) => row.value);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!selectedVariant) return;

    setLoading(true);
    try {
      await cartService.addItem(selectedVariant.id, quantity);
      toast.success(
        isVi
          ? `Đã thêm ${quantity} sản phẩm vào giỏ hàng thành công!`
          : `${quantity} item(s) added to your cart successfully!`,
      );
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message || (error as Error).message;
      toast.error(msg || (isVi ? 'Không thể thêm vào giỏ hàng.' : 'Failed to add to cart.'));
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
    } catch (error) {
      toast.error((error as Error).message || t('toast_favorite_error'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const goPrevImage = () => setActiveImageIndex((current) => Math.max(0, current - 1));
  const goNextImage = () =>
    setActiveImageIndex((current) => Math.min((product.images?.length || 1) - 1, current + 1));

  const renderRows = (rows: Array<{ label: string; value?: string | null }>) => (
    <div className="divide-y divide-border/80">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-6 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)]">
          <dt className="font-semibold lowercase text-foreground">{row.label}</dt>
          <dd className="leading-7 text-muted-foreground">{row.value}</dd>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[minmax(320px,0.86fr)_minmax(420px,1.14fr)] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <div className="grid gap-5 md:grid-cols-[84px_minmax(0,1fr)] md:items-start">
            {product.images && product.images.length > 1 && (
              <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      'h-20 w-20 shrink-0 overflow-hidden border bg-white transition-all',
                      activeImageIndex === index ? 'border-foreground' : 'border-border hover:border-gold',
                    )}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="order-1 md:order-2">
              <button
                type="button"
                onClick={() => activeImage && setZoomed(true)}
                className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-[#f7f4ef]"
              >
                {activeImage ? (
                  <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-8 md:p-10" />
                ) : (
                  <span className="px-8 text-center text-sm text-muted-foreground">{t('visual_data_unavailable')}</span>
                )}
              </button>

              {product.images && product.images.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={goPrevImage}
                    disabled={activeImageIndex === 0}
                    className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-gold disabled:opacity-30"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-14 text-center text-xs text-muted-foreground">
                    {activeImageIndex + 1} / {product.images.length}
                  </span>
                  <button
                    type="button"
                    onClick={goNextImage}
                    disabled={activeImageIndex >= product.images.length - 1}
                    className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-gold disabled:opacity-30"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground">{product.brand?.name || labels.brandFallback}</p>
          <h1 className="mt-4 text-4xl font-normal leading-tight tracking-normal text-foreground md:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>{gender}</span>
            <span>{availability}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} readOnly size={14} />
              <span>
                {stats?.total && stats.total > 0 ? `${rating.toFixed(1)} / 5` : labels.noReviews}
              </span>
            </div>
          </div>

          <p className="mt-5 text-3xl font-normal text-foreground">
            {selectedVariant ? formatCurrency(selectedVariant.price) : t('select_size')}
          </p>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                {labels.size}: <span className="font-semibold text-foreground">{selectedVariant?.name}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      'min-h-10 min-w-16 border px-4 text-sm transition-colors',
                      selectedVariant?.id === variant.id
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border bg-background text-foreground hover:border-gold',
                    )}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full gap-3 sm:w-auto sm:flex-1">
              <div className="flex h-14 w-28 shrink-0 border border-foreground sm:w-36">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="w-8 text-xl font-semibold sm:w-12"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <div className="flex flex-1 items-center justify-center text-base font-semibold">{quantity}</div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(selectedVariant?.stock ?? 99, current + 1)
                    )
                  }
                  disabled={!!(selectedVariant?.stock !== undefined && selectedVariant?.stock !== null && quantity >= selectedVariant.stock)}
                  className="w-8 text-xl font-semibold sm:w-12 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={loading || !selectedVariant}
                className="h-14 flex-1 border border-foreground bg-foreground px-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
              >
                {loading ? (isVi ? 'Đang xử lý...' : 'Processing...') : labels.addToCart}
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={cn(
                'flex h-14 w-full sm:w-auto items-center justify-center gap-2 border px-5 text-sm font-semibold transition-colors',
                isFavorite
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-border bg-background text-foreground hover:border-red-300 hover:text-red-500',
              )}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              <span>{labels.favorite}</span>
            </button>
          </div>


          <div className="mt-6 space-y-2 text-center text-sm text-foreground sm:text-left">
            <p>
              {labels.callNow}{' '}
              <a href={`tel:${labels.phone.replace(/\s/g, '')}`} className="font-semibold text-gold">
                {labels.phone}
              </a>{' '}
              ({labels.serviceTime})
            </p>
            <p className="text-muted-foreground">{labels.freeConsult}</p>
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-sm leading-8 text-muted-foreground">{shortDescription}</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl">
        <div className="flex flex-wrap gap-10 border-b border-border">
          {[
            { id: 'notes' as const, label: labels.notesTab },
            { id: 'details' as const, label: labels.detailsTab },
            { id: 'recommendations' as const, label: labels.recommendationsTab },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 pb-3 text-xl font-semibold lowercase transition-colors',
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === 'notes' && (
            <dl className="divide-y divide-border/80">
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-6 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="font-semibold lowercase text-foreground">{labels.scentTone}</dt>
                <dd className="leading-7 text-muted-foreground">
                  {[product.scentFamily?.name, ...allNotes.slice(0, 4)].filter(Boolean).join(', ') || '-'}
                </dd>
              </div>
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-6 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="font-semibold lowercase text-foreground">{labels.topNotes}</dt>
                <dd className="leading-7 text-muted-foreground">{noteGroups.TOP.join(', ') || '-'}</dd>
              </div>
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-6 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="font-semibold lowercase text-foreground">{labels.middleNotes}</dt>
                <dd className="leading-7 text-muted-foreground">{noteGroups.MIDDLE.join(', ') || '-'}</dd>
              </div>
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-6 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="font-semibold lowercase text-foreground">{labels.baseNotes}</dt>
                <dd className="leading-7 text-muted-foreground">{noteGroups.BASE.join(', ') || '-'}</dd>
              </div>
            </dl>
          )}

          {activeTab === 'details' && <dl>{renderRows(detailRows)}</dl>}

          {activeTab === 'recommendations' && (
            recommendationRows.length > 0 ? (
              <dl>{renderRows(recommendationRows)}</dl>
            ) : null
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold lowercase text-foreground">{labels.description}</h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">{longDescription}</p>
        </div>
      </section>

      <section className="max-w-5xl space-y-8 border-t border-border pt-12">
        <div>
          <p className="text-sm text-gold">{labels.reviews}</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">{product.name}</h2>
        </div>
        <div className="space-y-8">
          <ReviewSummaryView productId={product.id} />
          <ReviewList productId={product.id} />
        </div>
      </section>

      {zoomed && activeImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center border border-border bg-background text-foreground transition-colors hover:border-gold"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={activeImage} alt={product.name} className="max-h-[88vh] max-w-[92vw] object-contain" />
        </div>
      )}
    </div>
  );
}
