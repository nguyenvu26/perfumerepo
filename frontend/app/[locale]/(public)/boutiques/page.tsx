'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { catalogService, CatalogItem } from '@/services/catalog.service';
import { Link } from '@/lib/i18n';
import { Search, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Breadcrumb } from '@/components/common/breadcrumb';
import { motion } from 'framer-motion';

export default function BrandsIndexPage() {
    const tCommon = useTranslations('common');
    const [brands, setBrands] = useState<CatalogItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        catalogService.getPublicBrands()
            .then(setBrands)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const filteredBrands = useMemo(() => {
        let result = brands;
        if (selectedLetter) {
            result = result.filter(b => b.name.toUpperCase().startsWith(selectedLetter));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(b => b.name.toLowerCase().includes(q));
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [brands, searchQuery, selectedLetter]);

    const groupedBrands = useMemo(() => {
        const groups: Record<string, CatalogItem[]> = {};
        filteredBrands.forEach(b => {
            const letter = b.name.charAt(0).toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(b);
        });
        return groups; groupByLetter(groupedBrands);
    }, [filteredBrands]);

    function groupByLetter(groups: Record<string, CatalogItem[]>) {
        return Object.keys(groups).sort().reduce((acc: Record<string, CatalogItem[]>, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});
    }

    const breadcrumbItems = [
        { label: tCommon('boutiques'), active: true }
    ];

    return (
        <div className="bg-stone-50 dark:bg-zinc-950 transition-colors min-h-screen pt-32 pb-32">
            <div className="container-responsive">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />

                <header className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 text-gold mb-6"
                    >
                        <MapPin size={32} />
                    </motion.div>
                    <h1 className="text-fluid-4xl font-serif text-foreground tracking-tighter uppercase italic gold-gradient">Thương hiệu</h1>
                    <p className="mt-4 text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground font-black">Khám phá những thương hiệu nước hoa cao cấp.</p>
                </header>

                {/* Filter Bar */}
                <div className="flex flex-col items-center justify-center border-y border-border/50 py-10 mb-20 gap-8">
                    <div className="relative w-full max-w-2xl group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by brand name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 border border-border rounded-2xl bg-background/50 text-sm focus:outline-none focus:border-gold transition-all shadow-sm focus:shadow-gold/5"
                        />
                    </div>

                    <div className="w-full overflow-x-auto no-scrollbar lg:overflow-visible flex lg:justify-center">
                        <div className="flex items-center gap-x-6 min-w-max px-4 lg:px-0 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                            <button
                                onClick={() => setSelectedLetter(null)}
                                className={`hover:text-gold transition-all duration-300 px-2 py-1 ${!selectedLetter ? 'text-gold' : ''}`}
                            >
                                ALL BRANDS
                            </button>
                            <div className="w-px h-4 bg-border mx-2 hidden md:block" />
                            {letters.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setSelectedLetter(l)}
                                    className={`hover:text-gold transition-all duration-300 px-2 py-1 ${selectedLetter === l ? 'text-gold scale-150' : ''}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-40 gap-6">
                        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                        <span className="text-[10px] tracking-[0.4em] font-black uppercase text-muted-foreground animate-pulse">
                            Scanning directories...
                        </span>
                    </div>
                ) : Object.keys(groupedBrands).length === 0 ? (
                    <div className="text-center text-muted-foreground py-40 font-serif text-2xl italic opacity-50">
                        No scent houses found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-24">
                        {Object.keys(groupedBrands).map(letter => (
                            <motion.div
                                key={letter}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="flex flex-col"
                            >
                                <h2 className="text-4xl font-serif text-foreground pb-6 mb-10 border-b border-border/50 relative overflow-hidden group">
                                    {letter}
                                    <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gold translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                                </h2>
                                <ul className="flex flex-col gap-6">
                                    {groupedBrands[letter].map(brand => (
                                        <li key={brand.id}>
                                            <Link
                                                href={`/collection?brand=${encodeURIComponent(brand.name)}`}
                                                className="group flex items-center text-[15px] text-muted-foreground hover:text-gold transition-all duration-300 font-serif"
                                            >
                                                <span className="w-0 group-hover:w-4 h-px bg-gold mr-0 group-hover:mr-3 transition-all duration-500" />
                                                {brand.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
