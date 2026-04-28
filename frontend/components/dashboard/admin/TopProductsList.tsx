'use client';

import { motion } from 'framer-motion';
import { Package, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

import { useTranslations } from 'next-intl';

export interface TopProductDto {
    productId: string;
    productName: string;
    imageUrl: string | null;
    totalQuantity: number;
    totalRevenue: number;
}

function formatVND(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B₫`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
    return `${value}₫`;
}

interface TopProductsListProps {
    data: TopProductDto[];
    loading?: boolean;
}

export function TopProductsList({ data, loading }: TopProductsListProps) {
    const t = useTranslations('admin_dashboard');
    const maxQty = data[0]?.totalQuantity ?? 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-secondary text-foreground">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">
                            {t('top_products')}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {t('top_products_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">{t('no_data')}</p>
                </div>
            ) : (
                <div className="space-y-5 flex-1">
                    {data.map((product, i) => (
                        <motion.div
                            key={product.productId}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                {/* Rank */}
                                <span className={`text-[10px] font-heading w-5 text-center shrink-0 ${i === 0 ? 'text-gold' : 'text-muted-foreground'}`}>
                                    #{i + 1}
                                </span>

                                {/* Thumbnail */}
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-secondary border border-border shrink-0">
                                    {product.imageUrl ? (
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            width={36}
                                            height={36}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Package className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Name + revenue */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-tight text-foreground truncate group-hover:text-gold transition-colors">
                                        {product.productName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {t('units', { count: product.totalQuantity })} · {formatVND(product.totalRevenue)}
                                    </p>
                                </div>

                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-gold transition-all opacity-0 group-hover:opacity-100 shrink-0" />
                            </div>

                            {/* Progress bar */}
                            <div className="ml-9 h-1 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(product.totalQuantity / maxQty) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.07, ease: 'circOut' }}
                                    className={`h-full rounded-full ${i === 0 ? 'bg-gold' : 'bg-gold/40'}`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
