'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { Breadcrumb } from '@/components/common/breadcrumb';
import { Link, usePathname, useRouter } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { productService, type Product, type ProductListRes } from '@/services/product.service';

type GenderFilter = 'MALE' | 'FEMALE' | 'UNISEX' | null;
type PriceFilter = 'P1' | 'P2' | 'P3' | 'P4' | null;
type SeasonFilter = 'XUAN' | 'HA' | 'THU' | 'DONG' | null;
type SortMode = 'price_desc' | 'price_asc';

export function CollectionContent() {
  const locale = useLocale();
  const format = useFormatter();
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isVi = locale === 'vi';

  const labels = useMemo(
    () =>
      isVi
        ? {
            title: 'Bộ sưu tập nước hoa',
            subtitle:
              'Khám phá những mùi hương được sắp xếp rõ ràng, dễ tìm kiếm và dễ lựa chọn hơn cho từng phong cách.',
            badge: 'Tuyển chọn cao cấp',
            resultCount: 'Sản phẩm hiện có',
            brandCount: 'Thương hiệu',
            filterCount: 'Bộ lọc đang bật',
            directoryHint: 'Tìm nhanh theo tên, thương hiệu, nhóm hương và mức giá.',
            searchPlaceholder: 'Tìm theo tên nước hoa, thương hiệu hoặc nhóm hương...',
            sortLabel: 'Sắp xếp giá',
            sortHighLow: 'Cao đến thấp',
            sortLowHigh: 'Thấp đến cao',
            filterLabel: 'Bộ lọc',
            mobileFilterTitle: 'Bộ lọc sản phẩm',
            clearFilters: 'Xóa tất cả bộ lọc',
            brandSearch: 'Tìm nhanh thương hiệu',
            all: 'Tất cả',
            categorySection: 'Danh mục',
            genderSection: 'Giới tính',
            male: 'Nam',
            female: 'Nữ',
            unisex: 'Unisex',
            priceSection: 'Mức giá',
            scentSection: 'Nhóm hương',
            seasonSection: 'Mùa sử dụng',
            spring: 'Xuân',
            summer: 'Hạ',
            autumn: 'Thu',
            winter: 'Đông',
            activeFilters: 'Bộ lọc đang áp dụng',
            productGridTitle: 'Danh sách sản phẩm',
            productGridDesc: 'Bố cục rõ ràng, dễ đọc và tối ưu cho việc so sánh nhanh.',
            loading: 'Đang tải bộ sưu tập...',
            emptyTitle: 'Chưa tìm thấy sản phẩm phù hợp',
            emptyDesc: 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm gợi ý.',
            prev: 'Trước',
            next: 'Sau',
            page: 'Trang',
            detail: 'Xem chi tiết',
            from: 'Từ',
            noPrice: 'Liên hệ',
            allBrands: 'Tất cả thương hiệu',
            heroCardTitle: 'Lựa chọn dễ dàng hơn',
            heroCardDesc:
              'Trang được sắp xếp lại để người dùng tìm sản phẩm nhanh hơn và theo dõi thông tin rõ ràng hơn.',
            heroCardNote: 'Tập trung vào filter, search và card sản phẩm dễ đọc.',
          }
        : {
            title: 'Fragrance Collection',
            subtitle:
              'Discover fragrances through a cleaner layout, larger type, and a clearer premium browsing experience.',
            badge: 'Curated selection',
            resultCount: 'Available products',
            brandCount: 'Brands',
            filterCount: 'Active filters',
            directoryHint: 'Search faster by product name, brand, scent family, and price.',
            searchPlaceholder: 'Search by fragrance name, brand, or scent family...',
            sortLabel: 'Sort by price',
            sortHighLow: 'High to low',
            sortLowHigh: 'Low to high',
            filterLabel: 'Filters',
            mobileFilterTitle: 'Product filters',
            clearFilters: 'Clear all filters',
            brandSearch: 'Search brands',
            all: 'All',
            categorySection: 'Category',
            genderSection: 'Gender',
            male: 'Male',
            female: 'Female',
            unisex: 'Unisex',
            priceSection: 'Price',
            scentSection: 'Scent family',
            seasonSection: 'Season',
            spring: 'Spring',
            summer: 'Summer',
            autumn: 'Autumn',
            winter: 'Winter',
            activeFilters: 'Applied filters',
            productGridTitle: 'Product archive',
            productGridDesc: 'A clearer layout built for quick comparison and easier browsing.',
            loading: 'Loading collection...',
            emptyTitle: 'No products matched your filters',
            emptyDesc: 'Try adjusting your search or filters to explore more options.',
            prev: 'Previous',
            next: 'Next',
            page: 'Page',
            detail: 'View details',
            from: 'From',
            noPrice: 'Contact us',
            allBrands: 'All brands',
            heroCardTitle: 'Designed for easier discovery',
            heroCardDesc:
              'This layout emphasizes readability, cleaner controls, and more polished product presentation.',
            heroCardNote: 'Search, filters, and cards now feel more structured and premium.',
          },
    [isVi]
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScent, setSelectedScent] = useState<string | null>(null);
  const [gender, setGender] = useState<GenderFilter>(null);
  const [priceRange, setPriceRange] = useState<PriceFilter>(null);
  const [selectedSeason, setSelectedSeason] = useState<SeasonFilter>(null);
  const [sort, setSort] = useState<SortMode>('price_desc');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    productService
      .list({ take: 100 })
      .then((response: ProductListRes) => {
        setProducts(response.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const brandFromQuery = searchParams.get('brand');
    const rawBrandId = searchParams.get('brandId');
    const parsedBrandId = rawBrandId ? Number(rawBrandId) : null;
    const hasBrandId = parsedBrandId !== null && Number.isFinite(parsedBrandId) && parsedBrandId > 0;

    if (!brandFromQuery && !hasBrandId) return;

    setSelectedBrand(brandFromQuery || null);
    setSelectedBrandId(hasBrandId ? parsedBrandId : null);
  }, [searchParams]);

  const syncBrandQuery = (brandId: number | null, brandName: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (brandId && brandId > 0) {
      params.set('brandId', String(brandId));
      if (brandName) params.set('brand', brandName);
      else params.delete('brand');
    } else {
      params.delete('brandId');
      params.delete('brand');
    }

    const currentBrandId = searchParams.get('brandId');
    const currentBrand = searchParams.get('brand');
    const nextBrandId = params.get('brandId');
    const nextBrand = params.get('brand');
    if (currentBrandId === nextBrandId && currentBrand === nextBrand) return;

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const formatCurrency = (amount: number) =>
    format.number(amount, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });

  const getMinPrice = (product: Product) => {
    const prices = (product.variants ?? []).map((variant) => variant.price);
    return prices.length ? Math.min(...prices) : null;
  };

  const getScentName = (product: Product) =>
    ((product as Product & { scentFamily?: { name?: string } }).scentFamily?.name || '').trim();

  const brandItems = useMemo(() => {
    const mappedBrands = new Map<string, number>();
    products.forEach((product) => {
      if (!product.brand?.name) return;
      mappedBrands.set(product.brand.name, product.brand.id ?? product.brandId);
    });

    return Array.from(mappedBrands.entries())
      .map(([name, id]) => ({ name, id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  useEffect(() => {
    if (selectedBrand || selectedBrandId === null) return;
    const matchedBrand = products.find(
      (product) => (product.brand?.id ?? product.brandId) === selectedBrandId
    )?.brand?.name;
    if (matchedBrand) setSelectedBrand(matchedBrand);
  }, [products, selectedBrand, selectedBrandId]);

  const categoryItems = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category?.name).filter(Boolean) as string[])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const scentItems = useMemo(() => {
    return Array.from(new Set(products.map(getScentName).filter(Boolean) as string[])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const visibleProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.brand?.name?.toLowerCase().includes(query) ||
          getScentName(product).toLowerCase().includes(query)
        );
      });
    }

    if (selectedBrandId !== null) {
      filtered = filtered.filter((product) => (product.brand?.id ?? product.brandId) === selectedBrandId);
    } else if (selectedBrand) {
      filtered = filtered.filter((product) => product.brand?.name === selectedBrand);
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category?.name === selectedCategory);
    }

    if (selectedScent) {
      filtered = filtered.filter((product) => getScentName(product) === selectedScent);
    }

    if (gender) {
      filtered = filtered.filter((product) => {
        const normalizedGender = (product.gender || '').toUpperCase();
        if (gender === 'MALE') return normalizedGender === 'MALE' || normalizedGender === 'MEN' || normalizedGender === 'NAM';
        if (gender === 'FEMALE') {
          return (
            normalizedGender === 'FEMALE' ||
            normalizedGender === 'WOMEN' ||
            normalizedGender === 'NU' ||
            normalizedGender === 'Ná»®'
          );
        }
        if (gender === 'UNISEX') return normalizedGender === 'UNISEX' || normalizedGender === 'ALL' || normalizedGender === '';
        return false;
      });
    }

    if (priceRange) {
      filtered = filtered.filter((product) => {
        const price = getMinPrice(product);
        if (price == null) return false;
        if (priceRange === 'P1') return price < 1500000;
        if (priceRange === 'P2') return price >= 1500000 && price <= 3000000;
        if (priceRange === 'P3') return price > 3000000 && price <= 5000000;
        if (priceRange === 'P4') return price > 5000000;
        return true;
      });
    }

    if (selectedSeason) {
      filtered = filtered.filter((product) => {
        const description = (product.description || '').toLowerCase();
        const scent = getScentName(product).toLowerCase();
        const notes = (product.notes || []).map((note) => note.note?.name?.toLowerCase()).join(' ');
        const allText = `${description} ${scent} ${notes}`;

        if (selectedSeason === 'XUAN') {
          return allText.includes('xu\u00e2n') || allText.includes('spring') || scent.includes('floral') || scent.includes('fresh');
        }
        if (selectedSeason === 'HA') {
          return allText.includes('h\u1ea1') || allText.includes('summer') || scent.includes('citrus') || scent.includes('aquatic');
        }
        if (selectedSeason === 'THU') {
          return allText.includes('thu') || allText.includes('autumn') || allText.includes('fall') || scent.includes('woody');
        }
        if (selectedSeason === 'DONG') {
          return allText.includes('\u0111\u00f4ng') || allText.includes('winter') || scent.includes('spicy') || scent.includes('oriental');
        }
        return true;
      });
    }

    return [...filtered].sort((first, second) => {
      const firstPrice = getMinPrice(first) ?? 0;
      const secondPrice = getMinPrice(second) ?? 0;
      return sort === 'price_desc' ? secondPrice - firstPrice : firstPrice - secondPrice;
    });
  }, [gender, priceRange, products, searchQuery, selectedBrand, selectedBrandId, selectedCategory, selectedScent, selectedSeason, sort]);

  useEffect(() => {
    setPage(1);
  }, [gender, priceRange, searchQuery, selectedBrand, selectedBrandId, selectedCategory, selectedScent, selectedSeason, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const pagedProducts = visibleProducts.slice((page - 1) * pageSize, page * pageSize);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand(null);
    setSelectedBrandId(null);
    setSelectedCategory(null);
    setSelectedScent(null);
    setGender(null);
    setPriceRange(null);
    setSelectedSeason(null);
    setSort('price_desc');
    syncBrandQuery(null, null);
  };

  const activeFilterCount = [selectedBrand ?? selectedBrandId, selectedCategory, selectedScent, gender, priceRange, selectedSeason].filter(Boolean).length;

  const activeFilters = [
    selectedBrand || selectedBrandId !== null ? { key: 'brand', label: selectedBrand ?? labels.allBrands } : null,
    selectedCategory ? { key: 'category', label: selectedCategory } : null,
    selectedScent ? { key: 'scent', label: selectedScent } : null,
    gender
      ? {
          key: 'gender',
          label:
            gender === 'MALE' ? labels.male : gender === 'FEMALE' ? labels.female : labels.unisex,
        }
      : null,
    priceRange
      ? {
          key: 'price',
          label:
            priceRange === 'P1'
              ? '< 1.500.000'
              : priceRange === 'P2'
                ? '1.500.000 - 3.000.000'
                : priceRange === 'P3'
                  ? '3.000.000 - 5.000.000'
                  : '> 5.000.000',
        }
      : null,
    selectedSeason
      ? {
          key: 'season',
          label:
            selectedSeason === 'XUAN'
              ? labels.spring
              : selectedSeason === 'HA'
                ? labels.summer
                : selectedSeason === 'THU'
                  ? labels.autumn
                  : labels.winter,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const removeFilter = (key: string) => {
    if (key === 'brand') {
      setSelectedBrand(null);
      setSelectedBrandId(null);
      syncBrandQuery(null, null);
    }
    if (key === 'category') setSelectedCategory(null);
    if (key === 'scent') setSelectedScent(null);
    if (key === 'gender') setGender(null);
    if (key === 'price') setPriceRange(null);
    if (key === 'season') setSelectedSeason(null);
  };

  const genderLabel = (value: string | null | undefined) => {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'MALE' || normalized === 'MEN' || normalized === 'NAM') return labels.male;
    if (normalized === 'FEMALE' || normalized === 'WOMEN' || normalized === 'NU' || normalized === 'Ná»®') {
      return labels.female;
    }
    return labels.unisex;
  };

  const breadcrumbItems = [{ label: tCommon('collection'), active: true }];

  const pillClass = (active: boolean) =>
    cn(
      'rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
      active
        ? 'border-gold bg-gold text-luxury-black shadow-[0_14px_34px_-22px_rgba(197,160,89,0.95)]'
        : 'border-black/8 bg-white/80 text-foreground hover:border-gold hover:text-gold dark:border-white/10 dark:bg-white/[0.04] dark:text-white'
    );

  const FiltersContent = () => (
    <div className="space-y-8">
      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.brandCount}</h2>
        <div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedBrand(null);
              setSelectedBrandId(null);
              syncBrandQuery(null, null);
            }}
            className={cn(
              'w-full rounded-2xl px-4 py-3 text-left text-sm transition-all',
              selectedBrand === null && selectedBrandId === null
                ? 'bg-gold/12 font-medium text-gold'
                : 'text-foreground hover:bg-secondary/60 dark:hover:bg-white/[0.04]'
            )}
          >
            {labels.allBrands}
          </button>
          {brandItems.map((brand) => (
            <button
              key={`${brand.id}-${brand.name}`}
              type="button"
              onClick={() => {
                setSelectedBrand(brand.name);
                setSelectedBrandId(brand.id);
                syncBrandQuery(brand.id, brand.name);
              }}
              className={cn(
                'w-full rounded-2xl px-4 py-3 text-left text-sm transition-all',
                selectedBrandId !== null ? selectedBrandId === brand.id : selectedBrand === brand.name
                  ? 'bg-gold/12 font-medium text-gold'
                  : 'text-foreground hover:bg-secondary/60 dark:hover:bg-white/[0.04]'
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.categorySection}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedCategory(null)} className={pillClass(selectedCategory === null)}>
            {labels.all}
          </button>
          {categoryItems.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={pillClass(selectedCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.genderSection}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: null as GenderFilter, label: labels.all },
            { id: 'MALE' as GenderFilter, label: labels.male },
            { id: 'FEMALE' as GenderFilter, label: labels.female },
            { id: 'UNISEX' as GenderFilter, label: labels.unisex },
          ].map((item) => (
            <button
              key={`${String(item.id)}-${item.label}`}
              type="button"
              onClick={() => setGender(item.id)}
              className={pillClass(gender === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.priceSection}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: null as PriceFilter, label: labels.all },
            { id: 'P1' as PriceFilter, label: '< 1.500.000' },
            { id: 'P2' as PriceFilter, label: '1.500.000 - 3.000.000' },
            { id: 'P3' as PriceFilter, label: '3.000.000 - 5.000.000' },
            { id: 'P4' as PriceFilter, label: '> 5.000.000' },
          ].map((item) => (
            <button
              key={`${String(item.id)}-${item.label}`}
              type="button"
              onClick={() => setPriceRange(item.id)}
              className={pillClass(priceRange === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.scentSection}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedScent(null)} className={pillClass(selectedScent === null)}>
            {labels.all}
          </button>
          {scentItems.map((scent) => (
            <button
              key={scent}
              type="button"
              onClick={() => setSelectedScent(scent)}
              className={pillClass(selectedScent === scent)}
            >
              {scent}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-semibold text-foreground">{labels.seasonSection}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: null as SeasonFilter, label: labels.all },
            { id: 'XUAN' as SeasonFilter, label: labels.spring },
            { id: 'HA' as SeasonFilter, label: labels.summer },
            { id: 'THU' as SeasonFilter, label: labels.autumn },
            { id: 'DONG' as SeasonFilter, label: labels.winter },
          ].map((item) => (
            <button
              key={`${String(item.id)}-${item.label}`}
              type="button"
              onClick={() => setSelectedSeason(item.id)}
              className={pillClass(selectedSeason === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={clearAllFilters}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-black/8 bg-background px-5 text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold dark:border-white/10"
      >
        {labels.clearFilters}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#ffffff_34%,#fbfaf7_100%)] pt-28 pb-24 transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c10_35%,#09090b_100%)] md:pt-32">
      <div className="container-responsive">
        <Breadcrumb items={breadcrumbItems} className="mb-8 md:mb-10" />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-28 rounded-[2.3rem] border border-black/6 bg-card p-6 shadow-[0_26px_80px_-52px_rgba(15,23,42,0.35)] dark:border-white/10">
              <FiltersContent />
            </div>
          </aside>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm xl:hidden"
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                  className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-[360px] overflow-y-auto bg-background p-6 shadow-2xl xl:hidden"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">{labels.mobileFilterTitle}</h2>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="rounded-full p-3 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FiltersContent />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <section className="min-w-0">
            <div className="rounded-[2.2rem] border border-black/6 bg-card p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.3)] dark:border-white/10 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={labels.searchPlaceholder}
                    className="w-full rounded-full border border-black/8 bg-background px-14 py-4 text-base text-foreground outline-none transition-all focus:border-gold dark:border-white/10 dark:bg-background"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-black/8 bg-background px-5 text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold dark:border-white/10 xl:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {labels.filterLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSort((current) => (current === 'price_desc' ? 'price_asc' : 'price_desc'))}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-black/8 bg-background px-5 text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold dark:border-white/10"
                  >
                    <span>{labels.sortLabel}:</span>
                    <span>{sort === 'price_desc' ? labels.sortHighLow : labels.sortLowHigh}</span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', sort === 'price_asc' && 'rotate-180')} />
                  </button>
                </div>
              </div>

              {(activeFilters.length > 0 || searchQuery) && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">{labels.activeFilters}</p>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
                      >
                        <span>{searchQuery}</span>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {activeFilters.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => removeFilter(filter.key)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
                      >
                        <span>{filter.label}</span>
                        <X className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-[2.2rem] border border-black/6 bg-card mt-6 dark:border-white/10">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
                <p className="text-base text-muted-foreground">{labels.loading}</p>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-6 rounded-[2.2rem] border border-black/6 bg-card p-10 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.3)] dark:border-white/10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-foreground">{labels.emptyTitle}</h3>
                <p className="mx-auto mt-3 max-w-xl text-base leading-8 text-muted-foreground">{labels.emptyDesc}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {pagedProducts.map((product, index) => {
                    const price = getMinPrice(product);
                    const scent = getScentName(product);

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: index * 0.03 }}
                        className="h-full"
                      >
                        <Link href={`/collection/${product.id}`} className="group block h-full">
                          <article className="flex h-full flex-col overflow-hidden rounded-[2.2rem] border border-black/6 bg-card shadow-[0_24px_70px_-52px_rgba(15,23,42,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_30px_80px_-45px_rgba(197,160,89,0.35)] dark:border-white/10">
                            <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,rgba(248,246,241,0.95),rgba(255,255,255,0.7))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
                              {product.images?.[0]?.url ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gold/30">
                                  <ShoppingBag className="h-14 w-14" strokeWidth={1} />
                                </div>
                              )}

                              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                                <span className="rounded-full bg-black/72 px-3 py-1.5 text-xs font-medium text-white backdrop-blur dark:bg-black/72">
                                  {genderLabel(product.gender)}
                                </span>
                                {scent && (
                                  <span className="max-w-[55%] truncate rounded-full bg-white/88 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur dark:bg-black/72 dark:text-white">
                                    {scent}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-6">
                              <p className="text-sm font-medium text-gold">{product.brand?.name ?? labels.allBrands}</p>
                              <h3 className="mt-2 min-h-[64px] line-clamp-2 text-xl font-semibold leading-8 text-foreground transition-colors group-hover:text-gold">
                                {product.name}
                              </h3>

                              <div className="mt-auto border-t border-border/60 pt-5">
                                <div className="flex items-end justify-between gap-4">
                                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                    {labels.from}
                                  </p>
                                  <span className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 text-sm font-semibold text-gold transition-all group-hover:border-gold group-hover:bg-gold group-hover:text-luxury-black">
                                    <span>{labels.detail}</span>
                                    <Sparkles className="h-4 w-4" />
                                  </span>
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                  {price != null ? formatCurrency(price) : labels.noPrice}
                                </p>
                              </div>
                            </div>
                          </article>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPage((current) => Math.max(1, current - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === 1}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/8 bg-background px-6 text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"
                    >
                      {labels.prev}
                    </button>

                    <div className="rounded-full border border-black/8 bg-card px-6 py-3 text-sm font-semibold text-foreground dark:border-white/10">
                      {labels.page} {page} / {totalPages}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPage((current) => Math.min(totalPages, current + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page >= totalPages}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/8 bg-background px-6 text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"
                    >
                      {labels.next}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
