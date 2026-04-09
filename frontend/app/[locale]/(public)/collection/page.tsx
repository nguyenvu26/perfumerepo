'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Filter, ChevronDown, ShoppingBag, Sparkles, Search } from 'lucide-react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { productService, type Product, type ProductListRes } from '@/services/product.service';

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

    const genderLabel = (g: string | null | undefined) => {
        const v = (g || '').toUpperCase();
        if (v === 'MALE' || v === 'MEN') return 'Nam';
        if (v === 'FEMALE' || v === 'WOMEN') return 'Nữ';
        if (v === 'UNISEX') return 'Unisex';
        return 'Unisex';
    };

    return (
        <div className="min-h-screen bg-background transition-colors pt-32 px-6 pb-24">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-foreground">Sản phẩm</h1>
                        <p className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-bold mt-2">
                            Hiển thị {loading ? '—' : `${Math.min(visibleProducts.length, 20)}`} sản phẩm
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-border bg-background/60 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setSort((s) => (s === 'price_desc' ? 'price_asc' : 'price_desc'))}
                        >
                            Sắp xếp theo giá: {sort === 'price_desc' ? 'cao đến thấp' : 'thấp đến cao'}
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
                    {/* Sidebar filters */}
                    <aside className="bg-background/70 border border-border rounded-3xl p-6 space-y-10 h-fit sticky top-28">
                        <div>
                            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Thương hiệu</h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    value={brandQuery}
                                    onChange={(e) => setBrandQuery(e.target.value)}
                                    placeholder="Tìm kiếm nhanh"
                                    className="w-full pl-10 pr-3 py-3 rounded-2xl border border-border bg-background/60 text-sm outline-none focus:border-gold transition-colors"
                                />
                            </div>
                            <div className="max-h-64 overflow-auto pr-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedBrand(null)}
                                    className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition-colors ${selectedBrand === null ? 'bg-gold/10 text-gold' : 'hover:bg-secondary/40'}`}
                                >
                                    {tCommon('all')}
                                </button>
                                {brandItems.map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => setSelectedBrand(b)}
                                        className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition-colors ${selectedBrand === b ? 'bg-gold/10 text-gold' : 'hover:bg-secondary/40'}`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Giới tính</h2>
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
                            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Giá cả</h2>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: null, label: 'Tất cả' },
                                    { id: 'P1' as const, label: '< 1.500.000' },
                                    { id: 'P2' as const, label: '1.500.000 - 3.000.000' },
                                    { id: 'P3' as const, label: '3.000.000 - 5.000.000' },
                                    { id: 'P4' as const, label: '> 5.000.000' },
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
                            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Nhóm hương</h2>
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

                        <div>
                            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Mùa</h2>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: null, label: 'Tất cả' },
                                    { id: 'XUAN' as const, label: 'Xuân' },
                                    { id: 'HA' as const, label: 'Hạ' },
                                    { id: 'THU' as const, label: 'Thu' },
                                    { id: 'DONG' as const, label: 'Đông' },
                                ].map((s) => (
                                    <button
                                        key={String(s.id)}
                                        type="button"
                                        onClick={() => setSelectedSeason(s.id)}
                                        className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedSeason === s.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {s.label}
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
                            className="w-full px-4 py-3 rounded-2xl border border-border text-[10px] uppercase tracking-[.2em] font-bold text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
                        >
                            {tCommon('clear_filters')}
                        </button>
                    </aside>

                    {/* Product grid */}
                    <section>
                        <div className="mb-8 relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm tên sản phẩm hoặc thương hiệu..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:border-gold transition-colors shadow-sm"
                            />
                        </div>

                        {loading ? (
                            <div className="py-24 text-center text-muted-foreground text-sm">
                                {tCommon('loading')}
                            </div>
                        ) : (
                            <>
                                <div className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-bold mb-6">
                                    Hiển thị 1-{Math.min(20, visibleProducts.length)} của {visibleProducts.length} kết quả
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {visibleProducts.slice(0, 20).map((p) => {
                                        const price = getMinPrice(p);
                                        return (
                                            <Link key={p.id} href={`/collection/${p.id}`} className="group">
                                                <div className="bg-background border border-border rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
                                                    <div className="relative aspect-4/5 bg-secondary/20">
                                                        {p.images?.[0]?.url ? (
                                                            <img
                                                                src={p.images[0].url}
                                                                alt={p.name}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                            />
                                                        ) : null}

                                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="px-3 py-1 rounded-full bg-foreground text-background text-[9px] font-bold uppercase tracking-widest">
                                                                {genderLabel(p.gender)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                            {p.brand?.name ?? '—'}
                                                        </p>
                                                        <h3 className="mt-1 text-sm font-medium text-foreground line-clamp-2">
                                                            {p.name}
                                                        </h3>
                                                        <p className="mt-2 text-sm font-semibold text-foreground">
                                                            {price != null ? formatCurrency(price) : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
