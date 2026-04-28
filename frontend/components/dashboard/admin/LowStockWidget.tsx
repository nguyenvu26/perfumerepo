'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Package } from 'lucide-react';
import Image from 'next/image';

import { useTranslations } from 'next-intl';

export interface LowStockItemDto {
    variantId: string;
    productName: string;
    variantName: string;
    stock: number;
    imageUrl: string | null;
}

interface LowStockWidgetProps {
    data: LowStockItemDto[];
    loading?: boolean;
}

export function LowStockWidget({ data, loading }: LowStockWidgetProps) {
    const t = useTranslations('admin_dashboard');

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">{t('low_stock_alerts')}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t('low_stock_subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-20">
                    <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-2">
                    <div className="text-emerald-500">
                        <Package className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t('all_stock_healthy')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((item, i) => (
                        <motion.div
                            key={item.variantId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all"
                        >
                            {/* Thumbnail */}
                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-secondary border border-border shrink-0">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-tight text-foreground truncate">
                                    {item.productName}
                                </p>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                    {item.variantName}
                                </p>
                            </div>

                            {/* Badge */}
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shrink-0 ${item.stock === 0
                                ? 'bg-red-500/20 text-red-400'
                                : item.stock <= 3
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {item.stock === 0 ? t('out_of_stock') : t('left_suffix', { count: item.stock })}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
