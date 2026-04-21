'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, ShoppingBag, Sparkles, Search, X, SlidersHorizontal } from 'lucide-react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { productService, type Product, type ProductListRes } from '@/services/product.service';
import { cn } from '@/lib/utils';
import { Breadcrumb } from '@/components/common/breadcrumb';

export default function CollectionPage() {
    const tCommon = useTranslations('common');
    const tFeatured = useTranslations('featured');
    const locale = useLocale();
    const format = useFormatter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [brandQuery, setBrandQuery] = useState('');
    const searchParams = useSearchParams();
    const brandParam = searchParams.get('brand');
    const [selectedBrand, setSelectedBrand] = useState<string | null>(brandParam || null);
    const [selectedScent, setSelectedScent] = useState<string | null>(null);
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNISEX' | null>(null);
    const [priceRange, setPriceRange] = useState<'P1' | 'P2' | 'P3' | 'P4' | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<'XUAN' | 'HA' | 'THU' | 'DONG' | null>(null);
    const [sort, setSort] = useState<'price_desc' | 'price_asc'>('price_desc');
    const [page, setPage] = useState(1);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const pageSize = 20;

    useEffect(() => {
        productService.list({ take: 100 }).then((r: ProductListRes) => {
            setProducts(r.items);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        const brand = searchParams.get('brand');
        if (brand) {
            setSelectedBrand(brand);
        }
    }, [searchParams]);

    const formatCurrency = (amount: number) => {
        return format.number(amount, {
            style: 'currency',
            currency: tFeatured('currency_code') || 'VND',
            maximumFractionDigits: 0
        });
    };

    const getMinPrice = (p: Product) => {
        const prices = (p.variants ?? []).map(v => v.price);
        return prices.length ? Math.min(...prices) : null;
    };

    const brandItems = useMemo(() => {
        const items = Array.from(
            new Set(
                products
                    .map(p => p.brand?.name)
                    .filter(Boolean) as string[]
            )
        ).sort((a, b) => a.localeCompare(b));

        if (!brandQuery.trim()) return items;
        const q = brandQuery.trim().toLowerCase();
        return items.filter(b => b.toLowerCase().includes(q));
    }, [products, brandQuery]);

    const scentItems = useMemo(() => {
        const items = Array.from(
            new Set(
                products
                    .map(p => (p as any).scentFamily?.name || p.category?.name)
                    .filter(Boolean) as string[]
            )
        ).sort((a, b) => a.localeCompare(b));
        return items;
    }, [products]);

    const visibleProducts = useMemo(() => {
        let filtered = products;

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.brand?.name?.toLowerCase().includes(q));
        }

        if (selectedBrand) {
            filtered = filtered.filter(p => p.brand?.name === selectedBrand);
        }

        if (selectedScent) {
            filtered = filtered.filter(p => {
                const sf = (p as any).scentFamily?.name;
                const cat = p.category?.name;
                return sf === selectedScent || cat === selectedScent;
            });
        }

        if (gender) {
            filtered = filtered.filter(p => {
                const g = (p.gender || '').toUpperCase();
                if (gender === 'MALE') return g === 'MALE' || g === 'MEN' || g === 'NAM';
                if (gender === 'FEMALE') return g === 'FEMALE' || g === 'WOMEN' || g === 'NU' || g === 'NỮ';
                if (gender === 'UNISEX') return g === 'UNISEX' || g === 'ALL' || g === '';
                return false;
            });
        }

        if (priceRange) {
            filtered = filtered.filter(p => {
                const price = getMinPrice(p);
                if (price == null) return false;
                if (priceRange === 'P1') return price < 1500000;
                if (priceRange === 'P2') return price >= 1500000 && price <= 3000000;
                if (priceRange === 'P3') return price > 3000000 && price <= 5000000;
                if (priceRange === 'P4') return price > 5000000;
                return true;
            });
        }

        if (selectedSeason) {
            filtered = filtered.filter(p => {
                const desc = (p.description || '').toLowerCase();
                const sf = ((p as any).scentFamily?.name || p.category?.name || '').toLowerCase();
                const notes = (p.notes || []).map(n => n.note?.name?.toLowerCase()).join(' ');
                const allText = desc + ' ' + sf + ' ' + notes;

                if (selectedSeason === 'XUAN') return allText.includes('xuân') || allText.includes('spring') || sf.includes('floral') || sf.includes('fresh') || sf.includes('hoa');
                if (selectedSeason === 'HA') return allText.includes('hạ') || allText.includes('summer') || sf.includes('citrus') || sf.includes('aquatic') || sf.includes('mát');
                if (selectedSeason === 'THU') return allText.includes('thu') || allText.includes('autumn') || allText.includes('fall') || sf.includes('woody') || sf.includes('gỗ');
                if (selectedSeason === 'DONG') return allText.includes('đông') || allText.includes('winter') || sf.includes('spicy') || sf.includes('oriental') || sf.includes('ngọt') || sf.includes('ấm');
                return true;
            });
        }

        const sorted = [...filtered].sort((a, b) => {
            const pa = getMinPrice(a) ?? 0;
            const pb = getMinPrice(b) ?? 0;
            return sort === 'price_desc' ? pb - pa : pa - pb;
        });

        return sorted;
    }, [products, searchQuery, selectedBrand, selectedScent, gender, priceRange, selectedSeason, sort]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedBrand, selectedScent, gender, priceRange, selectedSeason, sort]);

    const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const pagedProducts = visibleProducts.slice(pageStart, pageStart + pageSize);

    const genderLabel = (g: string | null | undefined) => {
        const v = (g || '').toUpperCase();
        if (v === 'MALE' || v === 'MEN') return 'Nam';
        if (v === 'FEMALE' || v === 'WOMEN') return 'Nữ';
        if (v === 'UNISEX') return 'Unisex';
        return 'Unisex';
    };

    const breadcrumbItems = [
        { label: tCommon('collection'), active: true }
    ];

    const FiltersContent = () => (
        <div className="space-y-10">
            <div>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground mb-4">Thương hiệu</h2>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        value={brandQuery}
                        onChange={(e) => setBrandQuery(e.target.value)}
                        placeholder="Tìm kiếm nhanh"
                        className="w-full pl-10 pr-3 py-3 rounded-2xl border border-border bg-background/60 text-sm outline-none focus:border-gold transition-colors"
                    />
                </div>
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => setSelectedBrand(null)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedBrand === null ? 'bg-gold/10 text-gold' : 'hover:bg-secondary/40'}`}
                    >
                        {tCommon('all')}
                    </button>
                    {brandItems.map((b) => (
                        <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBrand(b)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedBrand === b ? 'bg-gold/10 text-gold' : 'hover:bg-secondary/40'}`}
                        >
                            {b}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground mb-4">Giới tính</h2>
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: null, label: 'Tất cả' },
                        { id: 'MALE' as const, label: 'Nam' },
                        { id: 'FEMALE' as const, label: 'Nữ' },
                        { id: 'UNISEX' as const, label: 'Unisex' },
                    ].map((g) => (
                        <button
                            key={String(g.id) + g.label}
                            type="button"
                            onClick={() => setGender(g.id)}
                            className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${gender === g.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground mb-4">Giá cả</h2>
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: null, label: 'Tất cả' },
                        { id: 'P1' as const, label: '< 1.500.000' },
                        { id: 'P2' as const, label: '1.5 - 3 Tr' },
                        { id: 'P3' as const, label: '3 - 5 Tr' },
                        { id: 'P4' as const, label: '> 5 Tr' },
                    ].map((p) => (
                        <button
                            key={String(p.id)}
                            type="button"
                            onClick={() => setPriceRange(p.id)}
                            className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${priceRange === p.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground mb-4">Nhóm hương</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedScent(null)}
                        className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedScent === null ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                    >
                        Tất cả
                    </button>
                    {scentItems.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedScent(s)}
                            className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedScent === s ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={() => {
                    setSearchQuery('');
                    setBrandQuery('');
                    setSelectedBrand(null);
                    setSelectedScent(null);
                    setGender(null);
                    setPriceRange(null);
                    setSelectedSeason(null);
                    setSort('price_desc');
                }}
                className="w-full px-4 py-4 rounded-2xl border border-border text-[10px] uppercase tracking-[.3em] font-bold text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
            >
                {tCommon('clear_filters')}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background transition-colors pt-32 pb-24">
            <div className="container-responsive">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div className="flex-1">
                        <h1 className="text-fluid-4xl font-serif text-foreground gold-gradient uppercase tracking-tighter">
                            Phòng Lưu Trữ
                        </h1>
                        <p className="text-[10px] uppercase tracking-[.4em] text-muted-foreground font-bold mt-3">
                            {loading ? '—' : `${visibleProducts.length}`} Essence Archives Found
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="lg:hidden flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-border bg-background/60 text-[10px] uppercase tracking-widest font-bold text-foreground transition-colors hover:border-gold"
                            onClick={() => setIsFilterOpen(true)}
                        >
                            <SlidersHorizontal size={14} />
                            Lọc
                        </button>
                        
                        <button
                            type="button"
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-border bg-background/60 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors hover:border-gold"
                            onClick={() => setSort((s) => (s === 'price_desc' ? 'price_asc' : 'price_desc'))}
                        >
                            <span className="hidden sm:inline">Giá:</span> {sort === 'price_desc' ? 'Cao - Thấp' : 'Thấp - Cao'}
                            <ChevronDown size={14} className={cn("transition-transform", sort === 'price_asc' && "rotate-180")} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block bg-background/70 border border-border rounded-[3rem] p-8 h-fit max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar sticky top-32 relative group">
                        <div className="absolute inset-0 bg-linear-to-b from-gold/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                        <FiltersContent />
                    </aside>

                    {/* Mobile Filter Drawer */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsFilterOpen(false)}
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] lg:hidden"
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-background z-[100] lg:hidden shadow-2xl p-8 overflow-y-auto no-scrollbar"
                                >
                                    <div className="flex items-center justify-between mb-10">
                                        <h2 className="text-xl font-serif">Bộ lọc</h2>
                                        <button 
                                            onClick={() => setIsFilterOpen(false)}
                                            className="p-3 -mr-3 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <FiltersContent />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Main Content */}
                    <section className="min-w-0">
                        <div className="mb-10 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" size={20} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by memory, brand, or essence..."
                                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-border bg-background text-sm outline-none focus:border-gold transition-all shadow-sm focus:shadow-gold/10"
                            />
                        </div>

                        {loading ? (
                            <div className="py-32 text-center text-muted-foreground text-[10px] uppercase tracking-[0.5em] animate-pulse">
                                Scanning essence archives...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-responsive cols-4">
                                    {pagedProducts.map((p) => {
                                        const price = getMinPrice(p);
                                        return (
                                            <Link key={p.id} href={`/collection/${p.id}`} className="group block h-full">
                                                <div className="bg-background glass rounded-[2.5rem] overflow-hidden hover:border-gold/30 transition-all duration-500 flex flex-col h-full border border-border shadow-sm hover:shadow-xl hover:shadow-gold/5">
                                                    <div className="relative aspect-3/4 bg-secondary/10 overflow-hidden shrink-0">
                                                        {p.images?.[0]?.url ? (
                                                            <img
                                                                src={p.images[0].url}
                                                                alt={p.name}
                                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center text-gold/20">
                                                                <ShoppingBag size={48} strokeWidth={0.5} />
                                                            </div>
                                                        )}

                                                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="px-4 py-2 rounded-full bg-white/90 dark:bg-black/90 text-foreground text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                                                {genderLabel(p.gender)}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>

                                                    <div className="p-8 flex flex-col flex-1">
                                                        <p className="text-[9px] text-gold uppercase tracking-[0.3em] font-black mb-2">
                                                            {p.brand?.name ?? '—'}
                                                        </p>
                                                        <h3 className="text-base font-heading font-medium text-foreground line-clamp-2 uppercase tracking-wide group-hover:text-gold transition-colors leading-[1.4]">
                                                            {p.name}
                                                        </h3>
                                                        <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/50">
                                                            <p className="text-lg font-serif text-foreground">
                                                                {price != null ? formatCurrency(price) : '—'}
                                                            </p>
                                                            <motion.div
                                                                whileHover={{ x: 3 }}
                                                                className="text-gold"
                                                            >
                                                                <Sparkles size={16} />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {visibleProducts.length === 0 && (
                                    <div className="py-40 text-center">
                                        <div className="w-20 h-20 rounded-full glass border-border mx-auto mb-8 flex items-center justify-center">
                                            <Search className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <h2 className="font-heading text-xl uppercase tracking-widest text-muted-foreground mb-4 italic">Archive results empty</h2>
                                        <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <div className="mt-20 flex items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPage((p) => Math.max(1, p - 1));
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={page === 1}
                                            className="px-8 py-4 rounded-2xl border border-border text-[10px] uppercase tracking-widest font-bold disabled:opacity-30 hover:border-gold transition-colors"
                                        >
                                            Trước
                                        </button>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground min-w-[80px] text-center">
                                            {page} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPage((p) => Math.min(totalPages, p + 1));
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={page >= totalPages}
                                            className="px-8 py-4 rounded-2xl border border-border text-[10px] uppercase tracking-widest font-bold disabled:opacity-30 hover:border-gold transition-colors"
                                        >
                                            Sau
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
