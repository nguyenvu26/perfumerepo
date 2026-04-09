'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { catalogService, CatalogItem } from '@/services/catalog.service';
import { Link } from '@/lib/i18n';
import { Search } from 'lucide-react';

export default function BrandsIndexPage() {
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

    // Group by first letter
    const groupedBrands = useMemo(() => {
        const groups: Record<string, CatalogItem[]> = {};
        filteredBrands.forEach(b => {
            const letter = b.name.charAt(0).toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(b);
        });
        return groups;
    }, [filteredBrands]);

    return (
        <div className="bg-stone-50 dark:bg-zinc-950 transition-colors">
            <main className="pt-40 pb-32 min-h-[80vh]">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl md:text-5xl font-serif text-center mb-16 text-foreground tracking-wide">Thương hiệu</h1>

                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between border-y border-border py-6 mb-20 gap-8">
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 flex-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground w-full">
                            <button
                                onClick={() => setSelectedLetter(null)}
                                className={`hover:text-foreground transition-all duration-300 ${!selectedLetter ? 'text-foreground' : ''}`}
                            >
                                ALL BRANDS
                            </button>
                            {letters.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setSelectedLetter(l)}
                                    className={`hover:text-foreground transition-all duration-300 ${selectedLetter === l ? 'text-foreground scale-125' : ''}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Tên thương hiệu..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-border rounded-full bg-background text-sm focus:outline-none focus:border-foreground transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <span className="text-[10px] tracking-[0.3em] font-bold uppercase text-muted-foreground animate-pulse">
                                Đang tải danh bạ...
                            </span>
                        </div>
                    ) : Object.keys(groupedBrands).length === 0 ? (
                        <div className="text-center text-muted-foreground py-20 font-serif text-xl italic">
                            Không tìm thấy thương hiệu phù hợp với yêu cầu.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
                            {Object.keys(groupedBrands).sort().map(letter => (
                                <div key={letter} className="flex flex-col">
                                    <h2 className="text-3xl font-serif text-foreground pb-6 mb-8 border-b border-border">{letter}</h2>
                                    <ul className="flex flex-col gap-4">
                                        {groupedBrands[letter].map(brand => (
                                            <li key={brand.id}>
                                                <Link
                                                    href={`/collection?brand=${encodeURIComponent(brand.name)}`}
                                                    className="group flex items-center text-[15px] text-muted-foreground hover:text-foreground transition-colors font-medium font-serif"
                                                >
                                                    {brand.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
