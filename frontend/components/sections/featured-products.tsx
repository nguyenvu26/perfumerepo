'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles } from 'lucide-react';

import { Link } from '@/lib/i18n';
import { productService, Product } from '@/services/product.service';

type ProductSection = {
    title: string;
    products: Product[];
};

export const FeaturedProducts = () => {
    const [featured, setFeatured] = useState<Product[]>([]);
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);

    useEffect(() => {
        Promise.all([
            productService.list({ isFeatured: true, take: 8 }),
            productService.getTopSelling(8),
            productService.list({ take: 8 }),
        ])
            .then(([featuredItems, bestsellerProducts, arrivalItems]) => {
                setFeatured(featuredItems.items);
                setBestsellers(bestsellerProducts);
                setNewArrivals(arrivalItems.items);
            })
            .catch(console.error);
    }, []);

    const sections: ProductSection[] = [
        { title: 'Deal Thơm', products: bestsellers },
        { title: 'New Arrivals', products: newArrivals },
        { title: 'Sản Phẩm Nổi Bật', products: featured },
    ];

    const CarouselSection = ({ section }: { section: ProductSection }) => {
        const scrollRef = useRef<HTMLDivElement>(null);

        const scroll = (direction: 'left' | 'right') => {
            if (scrollRef.current) {
                const scrollAmount = scrollRef.current.clientWidth * 0.75;
                scrollRef.current.scrollBy({
                    left: direction === 'left' ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
                });
            }
        };

        if (section.products.length === 0) return null;

        return (
            <div className="mb-24 last:mb-0">
                {/* Section Header */}
                <div className="relative mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C5A059]" />
                        <h3 className="text-2xl md:text-3xl font-medium text-foreground tracking-wide">
                            {section.title}
                        </h3>
                        <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C5A059]" />
                    </div>
                    <Link
                        href="/collection"
                        className="group flex items-center gap-1.5 text-sm font-medium text-[#C5A059] opacity-80 hover:opacity-100 transition-opacity"
                    >
                        Xem thêm
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>

                {/* Carousel */}
                <div className="relative group/carousel">
                    {/* Left Button */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-[42%] -translate-y-1/2 -translate-x-4 md:-translate-x-5 z-10 flex h-11 w-11 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 bg-white/95 dark:bg-zinc-900/95 text-[#C5A059] rounded-full shadow-[0_8px_30px_-8px_rgba(197,160,89,0.4)] border border-[#C5A059]/20 hover:bg-[#C5A059] hover:text-white hover:border-[#C5A059]"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Scroll Container */}
                    <div
                        ref={scrollRef}
                        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {section.products.map((perfume) => {
                            const minPrice = perfume.variants?.length
                                ? Math.min(...perfume.variants.map((v) => v.price))
                                : 0;

                            const maxPrice = perfume.variants?.length
                                ? Math.max(...perfume.variants.map((v) => v.price))
                                : 0;

                            const priceString = minPrice === maxPrice && minPrice > 0
                                ? `${minPrice.toLocaleString('vi-VN')}đ`
                                : minPrice > 0
                                    ? `${minPrice.toLocaleString('vi-VN')}đ – ${maxPrice.toLocaleString('vi-VN')}đ`
                                    : 'Liên hệ';

                            const sizesCount = perfume.variants?.length || 0;

                            return (
                                <Link
                                    key={perfume.id}
                                    href={`/collection/${perfume.id}`}
                                    className="block w-[200px] md:w-[240px] shrink-0 snap-start group"
                                >
                                    <article className="flex flex-col h-full overflow-hidden rounded-[1.8rem] border border-black/6 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-[0_16px_48px_-24px_rgba(15,23,42,0.18)] transition-all duration-400 hover:-translate-y-1.5 hover:border-[#C5A059]/40 hover:shadow-[0_24px_60px_-28px_rgba(197,160,89,0.35)]">

                                        {/* Image Zone */}
                                        <div className="relative aspect-[3/4] overflow-hidden bg-[linear-gradient(160deg,#faf8f3_0%,#f3ede0_100%)] dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                                            {perfume.images?.[0] ? (
                                                <Image
                                                    src={perfume.images[0].url}
                                                    alt={perfume.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-107"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#C5A059]/30">
                                                    <ShoppingBag className="h-12 w-12" strokeWidth={1} />
                                                    <span className="text-xs text-[#C5A059]/50 font-medium tracking-widest uppercase">No image</span>
                                                </div>
                                            )}

                                            {/* Bottom gradient overlay */}
                                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                                            {/* Wishlist button */}
                                            <button
                                                className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 dark:bg-zinc-900/85 text-zinc-400 backdrop-blur hover:text-[#C5A059] transition-colors shadow-sm"
                                                aria-label="Thêm vào yêu thích"
                                            >
                                                <Heart className="h-4 w-4" />
                                            </button>

                                            {/* Size badge */}
                                            {sizesCount > 0 && (
                                                <div className="absolute left-3.5 bottom-3.5 z-10">
                                                    <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                                                        {sizesCount} sizes
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Zone */}
                                        <div className="flex flex-1 flex-col p-4 pb-5">
                                            <p className="text-[11px] font-semibold text-[#C5A059] uppercase tracking-[0.15em] mb-1 truncate">
                                                {perfume.brand?.name || 'Boutique'}
                                            </p>
                                            <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2 min-h-[40px] mb-3 group-hover:text-[#C5A059] transition-colors">
                                                {perfume.brand?.name ? `${perfume.brand.name} ${perfume.name}` : perfume.name}
                                            </h4>

                                            <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/6 dark:border-white/8 pt-3">
                                                <p className="text-sm font-semibold text-foreground leading-tight">
                                                    {priceString}
                                                </p>
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C5A059]/10 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white transition-all">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Button */}
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-[42%] -translate-y-1/2 translate-x-4 md:translate-x-5 z-10 flex h-11 w-11 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 bg-white/95 dark:bg-zinc-900/95 text-[#C5A059] rounded-full shadow-[0_8px_30px_-8px_rgba(197,160,89,0.4)] border border-[#C5A059]/20 hover:bg-[#C5A059] hover:text-white hover:border-[#C5A059]"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <section
            className="py-20 md:py-28 bg-[linear-gradient(180deg,#fdfcf8_0%,#ffffff_50%,#fdfcf8_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c0f_50%,#09090b_100%)] transition-colors"
            id="collections"
        >
            <div className="container-responsive max-w-7xl mx-auto px-6 md:px-12">
                {sections.map((section) => (
                    <CarouselSection key={section.title} section={section} />
                ))}

                {/* Quiz CTA Banner */}
                <div className="mt-20 flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-[#C5A059]/20 bg-[linear-gradient(135deg,rgba(197,160,89,0.08)_0%,rgba(197,160,89,0.03)_50%,rgba(197,160,89,0.08)_100%)] dark:bg-[linear-gradient(135deg,rgba(197,160,89,0.1)_0%,rgba(197,160,89,0.04)_50%,rgba(197,160,89,0.1)_100%)] px-8 py-14 text-center shadow-[0_0_80px_-30px_rgba(197,160,89,0.2)]">
                    <div className="flex items-center gap-2 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-4 py-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                        <span className="text-xs font-semibold text-[#C5A059] uppercase tracking-widest">AI Tư Vấn</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-medium text-foreground max-w-lg leading-snug">
                        Chưa biết chọn mùi nào?{' '}
                        <span className="text-[#C5A059]">Để AI giúp bạn</span>
                    </h2>

                    <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
                        Trả lời 5 câu hỏi ngắn — nhận danh sách nước hoa phù hợp với phong cách và ngân sách của bạn.
                    </p>

                    <Link
                        href="/quiz"
                        className="group inline-flex items-center gap-3 rounded-full bg-[#C5A059] px-8 py-4 text-sm font-bold text-white shadow-[0_16px_40px_-12px_rgba(197,160,89,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_-12px_rgba(197,160,89,0.7)] active:scale-95"
                    >
                        Tìm Sản Phẩm Phù Hợp
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
};
