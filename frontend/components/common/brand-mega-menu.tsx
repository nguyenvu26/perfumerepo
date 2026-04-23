'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { catalogService, CatalogItem } from '@/services/catalog.service';
import { Link } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const BrandMegaMenu = () => {
    const t = useTranslations('common');
    const [brands, setBrands] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredLetter, setHoveredLetter] = useState<string>('A');

    useEffect(() => {
        catalogService.getPublicBrands()
            .then(setBrands)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const groupedBrands = useMemo(() => {
        const groups: Record<string, CatalogItem[]> = {};
        brands.forEach(b => {
            const letter = b.name.charAt(0).toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(b);
        });

        // Sort brands within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => a.name.localeCompare(b.name));
        });

        return groups;
    }, [brands]);

    // Update hovered letter initially if 'A' is empty
    useEffect(() => {
        if (!loading && Object.keys(groupedBrands).length > 0 && !groupedBrands[hoveredLetter]) {
            const firstAvailable = Object.keys(groupedBrands).sort()[0];
            if (firstAvailable) setHoveredLetter(firstAvailable);
        }
    }, [loading, groupedBrands, hoveredLetter]);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const currentBrands = groupedBrands[hoveredLetter] || [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 w-[600px]">
                <Loader2 className="animate-spin text-gold" size={24} />
            </div>
        );
    }

    return (
        <div className="w-[800px] flex gap-8 p-8 bg-white/100 dark:bg-black/100 backdrop-blur-2xl saturate-[1.8] border border-white/30 dark:border-white/10 rounded-[2rem] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Left: Alphabet Selector */}
            <div className="w-1/3 flex flex-col border-r border-border/40 pr-6">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('boutiques')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Khám phá những thương hiệu nước hoa cao cấp.</p>
                </div>

                <div className="grid grid-cols-4 gap-2 flex-1">
                    {alphabet.map(letter => {
                        const hasBrands = !!groupedBrands[letter];
                        const isHovered = hoveredLetter === letter;
                        return (
                            <button
                                key={letter}
                                onMouseEnter={() => hasBrands && setHoveredLetter(letter)}
                                disabled={!hasBrands}
                                className={`
                                    w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                    ${!hasBrands ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                                    ${isHovered
                                        ? 'bg-gold text-luxury-black shadow-lg shadow-gold/20'
                                        : 'hover:bg-secondary text-foreground'
                                    }
                                `}
                            >
                                {letter}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                    <Link href="/boutiques" className="text-xs font-semibold text-gold hover:text-gold/80 inline-flex items-center group">
                        Xem tất cả thương hiệu
                        <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Right: Brands List */}
            <div className="w-2/3 flex flex-col">
                <div className="flex items-center mb-6 pb-2 border-b border-border/20">
                    <span className="text-4xl font-serif text-gold mr-4">{hoveredLetter}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">{currentBrands.length} thương hiệu</span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 auto-rows-max h-[240px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={hoveredLetter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-3"
                        >
                            {currentBrands.length > 0 ? (
                                currentBrands.slice(0, 12).map(brand => (
                                    <Link
                                        key={brand.id}
                                        href={`/collection?brand=${encodeURIComponent(brand.name)}`}
                                        className="text-sm text-foreground/80 hover:text-gold transition-colors truncate block group"
                                    >
                                        <span className="w-0 group-hover:w-2 inline-block h-px bg-gold mr-0 group-hover:mr-2 transition-all duration-300 align-middle" />
                                        {brand.name}
                                    </Link>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground italic col-span-2">Không có thương hiệu</div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {currentBrands.length > 12 && (
                    <div className="mt-auto text-xs text-muted-foreground pt-4">
                        + {currentBrands.length - 12} thương hiệu khác (xem chi tiết)
                    </div>
                )}
            </div>
        </div>
    );
};
