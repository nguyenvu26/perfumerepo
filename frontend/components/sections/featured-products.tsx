'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';
import { productService, Product } from '@/services/product.service';

export const FeaturedProducts = () => {
    const t = useTranslations('featured');
    const [featured, setFeatured] = useState<Product[]>([]);
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);

    useEffect(() => {
        Promise.all([
            productService.list({ isFeatured: 'true' as any, take: 3 }),
            productService.list({ isBestseller: 'true' as any, take: 3 }),
            productService.list({ take: 3 })
        ]).then(([f, b, n]) => {
            setFeatured(f.items);
            setBestsellers(b.items);
            setNewArrivals(n.items);
        }).catch(console.error);
    }, []);

    const renderGrid = (title: string, products: Product[]) => {
        if (products.length === 0) return null;
        return (
            <div className="mb-32 last:mb-0">
                <div className="flex justify-between items-end mb-16 gap-12">
                    <h3 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white transition-colors leading-none tracking-tighter">
                        {title}
                    </h3>
                    <Link
                        href="/collection"
                        className="group text-[10px] font-bold tracking-[.4em] uppercase border-b-2 border-gold pb-2 text-luxury-black dark:text-white transition-colors flex items-center gap-4"
                    >
                        {t('cta') || 'Explore'}
                        <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 xl:gap-24">
                    {products.map((perfume, i) => (
                        <motion.div
                            key={perfume.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                            className="group cursor-pointer"
                        >
                            <Link href={`/collection/${perfume.id}`}>
                                <div className="relative aspect-[3/4] bg-stone-50 dark:bg-zinc-900 mb-10 overflow-hidden rounded-[3.5rem] transition-all border border-stone-100 dark:border-white/5 shadow-sm group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] group-hover:-translate-y-4">
                                    {perfume.images?.[0] && (
                                        <Image
                                            src={perfume.images[0].url}
                                            alt={perfume.name}
                                            fill
                                            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute top-8 left-8">
                                        <span className="glass px-4 py-2 rounded-full text-[9px] font-bold tracking-widest uppercase text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-4 group-hover:translate-y-0">
                                            {(perfume as any).scentFamily?.name || perfume.notes?.[0]?.note?.name || 'Aura'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-8 left-8 right-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                                        <button className="w-full py-4 glass text-white text-[10px] font-bold tracking-[.4em] uppercase rounded-full hover:bg-white hover:text-luxury-black transition-all">
                                            {t('add') || 'View'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <p className="text-[9px] text-stone-400 dark:text-stone-500 font-bold tracking-[.4em] uppercase mb-2 transition-colors">
                                        {perfume.brand?.name || 'Perfume'}
                                    </p>
                                    <h4 className="text-3xl font-serif text-luxury-black dark:text-white mb-4 group-hover:italic transition-all duration-500 line-clamp-1">
                                        {perfume.name}
                                    </h4>
                                    <div className="w-8 h-px bg-stone-200 dark:bg-gold/30 mb-4 transition-colors" />
                                    <p className="text-lg font-serif italic text-luxury-black dark:text-white transition-colors tracking-widest">
                                        {perfume.variants?.length ? Math.min(...perfume.variants.map(v => v.price)).toLocaleString('vi-VN') : '0'}đ
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <section className="py-40 bg-white dark:bg-zinc-950 transition-colors" id="collections">
            <div className="container mx-auto px-6">
                <div className="max-w-2xl mb-24">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold tracking-[.5em] uppercase mb-6 transition-colors font-serif italic">
                        {t('badge')}
                    </p>
                    <h2 className="text-6xl md:text-8xl font-serif text-luxury-black dark:text-white transition-colors leading-none tracking-tighter">
                        {t('title')}
                    </h2>
                </div>

                {renderGrid('Sản Phẩm Bán Chạy', bestsellers)}
                {renderGrid('Sản Phẩm Nổi Bật', featured)}
                {renderGrid('Sản Phẩm Mới', newArrivals)}
            </div>
        </section>
    );
};
