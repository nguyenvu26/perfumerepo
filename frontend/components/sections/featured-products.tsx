'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/lib/i18n';
import { productService, Product } from '@/services/product.service';

type ProductSection = {
    title: string;
    products: Product[];
};

export const FeaturedProducts = () => {
    const t = useTranslations('featured');
    const commonT = useTranslations('common');
    const [featured, setFeatured] = useState<Product[]>([]);
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);

    useEffect(() => {
        Promise.all([
            productService.list({ isFeatured: true, take: 3 }),
            productService.getTopSelling(3),
            productService.list({ take: 3 }),
        ])
            .then(([featuredItems, bestsellerProducts, arrivalItems]) => {
                setFeatured(featuredItems.items);
                setBestsellers(bestsellerProducts);
                setNewArrivals(arrivalItems.items);
            })
            .catch(console.error);
    }, []);

    const sections: ProductSection[] = [
        { title: 'Sản phẩm bán chạy', products: bestsellers },
        { title: 'Sản phẩm nổi bật', products: featured },
        { title: 'Sản phẩm mới', products: newArrivals },
    ];

    const renderSection = (section: ProductSection) => {
        if (section.products.length === 0) return null;

        return (
            <div key={section.title} className="mb-20 last:mb-0 md:mb-24">
                <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="text-3xl leading-tight text-foreground md:text-4xl">{section.title}</h3>
                    </div>

                    <Link
                        href="/collection"
                        className="group inline-flex items-center gap-2 text-base font-medium text-gold transition-colors hover:text-gold-dark"
                    >
                        {t('cta')}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {section.products.map((perfume, index) => (
                        <motion.div
                            key={perfume.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: index * 0.1 }}
                            whileHover={{ y: -6 }}
                            className="group h-full"
                        >
                            <Link href={`/collection/${perfume.id}`} className="block h-full">
                                <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/6 bg-card shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] transition-all dark:border-white/10 dark:bg-card">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                                        {perfume.images?.[0] ? (
                                            <Image
                                                src={perfume.images[0].url}
                                                alt={perfume.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                                                Perfume GPT
                                            </div>
                                        )}

                                        <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-sm font-medium text-foreground backdrop-blur dark:border-white/12 dark:bg-black/35 dark:text-white">
                                            {(perfume as any).scentFamily?.name || perfume.notes?.[0]?.note?.name || 'Signature'}
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-5 md:p-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {perfume.brand?.name || 'Perfume GPT'}
                                            </p>
                                            {perfume.salesCount != null && (
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2 py-1 rounded-md border border-gold/20">
                                                    Đã bán {perfume.salesCount}
                                                </p>
                                            )}
                                        </div>
                                        <h4 className="mt-2 line-clamp-2 text-2xl leading-tight text-foreground md:text-[1.75rem]">
                                            {perfume.name}
                                        </h4>
                                        <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base line-clamp-2">
                                            {perfume.description || 'Khám phá hương thơm độc đáo dành riêng cho bạn.'}
                                        </p>

                                        <div className="mt-auto pt-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-xl font-semibold text-gold md:text-2xl">
                                                    {perfume.variants?.length
                                                        ? `${Math.min(...perfume.variants.map((variant) => variant.price)).toLocaleString('vi-VN')}₫`
                                                        : '0₫'}
                                                </p>
                                                <span className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors group-hover:bg-gold group-hover:text-luxury-black dark:bg-white dark:text-black">
                                                    {commonT('view_options')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <section className="section-py bg-background transition-colors" id="collections">
            <div className="container-responsive">
                <div className="mb-14 max-w-4xl md:mb-16">
                    <p className="text-sm font-medium text-gold">{t('badge')}</p>
                    <h2 className="mt-4 text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl">
                        {t('title')}
                    </h2>
                </div>

                {sections.map(renderSection)}
            </div>
        </section>
    );
};
