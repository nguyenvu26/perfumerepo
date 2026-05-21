'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { Link, useRouter } from '@/lib/i18n';
import { productService, Product } from '@/services/product.service';
import { ScentDNABadge } from '@/components/product/scent-dna-badge';
import { useAuth } from '@/hooks/use-auth';
import { favoriteService } from '@/services/favorite.service';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

type ProductSection = {
    title: string;
    products: Product[];
};

export const FeaturedProducts = () => {
    const [featured, setFeatured] = useState<Product[]>([]);
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);

    const locale = useLocale();
    const router = useRouter();
    const isVi = locale === 'vi';
    const { isAuthenticated } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthenticated) {
            setFavoriteIds(new Set());
            return;
        }
        
        const loadFavorites = () => {
            favoriteService.getFavorites().then(items => {
                setFavoriteIds(new Set(items.map(i => i.id)));
            }).catch(() => {});
        };

        loadFavorites();
        
        const handleUpdate = () => loadFavorites();
        window.addEventListener(favoriteService.eventName, handleUpdate);
        return () => window.removeEventListener(favoriteService.eventName, handleUpdate);
    }, [isAuthenticated]);

    const handleToggleFavorite = async (e: React.MouseEvent, productId: string, variantId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error(isVi ? 'Vui lòng đăng nhập để thêm vào yêu thích' : 'Please login to add to favorites');
            router.push('/login');
            return;
        }
        try {
            const isFav = favoriteIds.has(productId);
            const nextFavorite = await favoriteService.toggleProduct(productId, isFav, variantId);
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (nextFavorite) next.add(productId);
                else next.delete(productId);
                return next;
            });
            toast.success(nextFavorite 
                ? (isVi ? 'Đã thêm vào danh sách yêu thích' : 'Added to favorites')
                : (isVi ? 'Đã xóa khỏi danh sách yêu thích' : 'Removed from favorites')
            );
        } catch (error) {
            toast.error((error as Error).message || "Lỗi");
        }
    };

    useEffect(() => {
        Promise.all([
            productService.getTopReviewed(8),
            productService.getTopSelling(8),
            productService.list({ take: 8 }),
        ])
            .then(([featuredItems, bestsellerProducts, arrivalItems]) => {
                setFeatured(featuredItems);
                setBestsellers(bestsellerProducts);
                setNewArrivals(arrivalItems.items);
            })
            .catch(console.error);
    }, []);

    const sections: ProductSection[] = [
        { title: isVi ? 'Nước Hoa Hot' : 'Hot Perfumes', products: bestsellers },
        { title: isVi ? 'Hàng Mới Về' : 'New Arrivals', products: newArrivals },
        { title: isVi ? 'Sản Phẩm Nổi Bật' : 'Featured Products', products: featured },
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
            <div className="mb-24 last:mb-0 relative z-10">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-10 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: 40 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="h-px bg-gradient-to-r from-transparent to-[#C5A059]" 
                        />
                        <h3 className="text-2xl md:text-3xl font-medium text-foreground tracking-wide font-sans bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/80">
                            {section.title}
                        </h3>
                        <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: 40 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="h-px bg-gradient-to-l from-transparent to-[#C5A059]" 
                        />
                    </div>
                    <Link
                        href="/collection"
                        className="group flex items-center gap-1.5 text-sm font-medium text-[#C5A059] opacity-80 hover:opacity-100 transition-opacity"
                    >
                        Xem thêm
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </motion.div>

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
                        {section.products.map((perfume, idx) => {
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
                                <motion.div
                                    key={perfume.id}
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.21, 1.02, 0.43, 1.01] }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="relative w-[200px] md:w-[240px] shrink-0 snap-start group"
                                >
                                    {/* Entire card click link area */}
                                    <Link
                                        href={`/collection/${perfume.id}`}
                                        className="absolute inset-0 z-0 rounded-[1.8rem]"
                                        aria-label={perfume.name}
                                    />

                                    <article className="flex flex-col h-full overflow-hidden rounded-[1.8rem] border border-black/6 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-[0_16px_48px_-24px_rgba(15,23,42,0.18)] transition-all duration-400 group-hover:border-[#C5A059]/40 group-hover:shadow-[0_24px_60px_-28px_rgba(197,160,89,0.35)] pointer-events-none">

                                        {/* Image Zone */}
                                        <div className="relative aspect-square overflow-hidden bg-[linear-gradient(160deg,#faf8f3_0%,#f3ede0_100%)] dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
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
                                            
                                            <div className="absolute left-3.5 top-3.5 z-10">
                                                <ScentDNABadge product={perfume} showText={false} />
                                            </div>

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

                                    {/* Wishlist button */}
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.8 }}
                                        onClick={(e) => handleToggleFavorite(e, perfume.id)}
                                        className={`absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur transition-colors shadow-sm ${
                                            favoriteIds.has(perfume.id)
                                                ? 'text-red-500 hover:text-red-600'
                                                : 'text-zinc-400 hover:text-[#C5A059]'
                                        }`}
                                        aria-label="Thêm vào yêu thích"
                                    >
                                        <Heart 
                                            className={`h-4 w-4 transition-transform duration-300 ${
                                                favoriteIds.has(perfume.id) ? 'fill-current scale-110' : ''
                                            }`} 
                                        />
                                    </motion.button>
                                </motion.div>
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
            className="py-20 md:py-28 bg-[linear-gradient(180deg,#fdfcf8_0%,#ffffff_50%,#fdfcf8_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c0f_50%,#09090b_100%)] transition-colors relative overflow-hidden"
            id="collections"
        >
            {/* Glowing background decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
                <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-[#C5A059]/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] rounded-full bg-[#C5A059]/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-[#C5A059]/5 blur-[110px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            <div className="container-responsive max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                {sections.map((section) => (
                    <CarouselSection key={section.title} section={section} />
                ))}

                {/* Quiz CTA Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    whileHover={{ scale: 1.01, boxShadow: '0 20px 80px -20px rgba(197, 160, 89, 0.25)' }}
                    className="relative mt-20 overflow-hidden flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-[#C5A059]/20 bg-[linear-gradient(135deg,rgba(197,160,89,0.08)_0%,rgba(197,160,89,0.03)_50%,rgba(197,160,89,0.08)_100%)] dark:bg-[linear-gradient(135deg,rgba(197,160,89,0.1)_0%,rgba(197,160,89,0.04)_50%,rgba(197,160,89,0.1)_100%)] px-8 py-14 text-center shadow-[0_0_80px_-30px_rgba(197,160,89,0.2)]"
                >
                    {/* Floating animated sparkles inside the CTA */}
                    <div className="absolute top-4 left-6 animate-bounce opacity-40" style={{ animationDuration: '4s' }}>
                        <Sparkles className="h-4 w-4 text-[#C5A059]/50" />
                    </div>
                    <div className="absolute bottom-6 right-8 animate-bounce opacity-40" style={{ animationDuration: '6s' }}>
                        <Sparkles className="h-5 w-5 text-[#C5A059]/50" />
                    </div>

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
                        className="group inline-flex items-center gap-3 rounded-full bg-[#C5A059] px-8 py-4 text-sm font-bold text-white shadow-[0_16px_40px_-12px_rgba(197,160,89,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_-12px_rgba(197,160,89,0.7)] active:scale-95 z-10"
                    >
                        Tìm Sản Phẩm Phù Hợp
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
