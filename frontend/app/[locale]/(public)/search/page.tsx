'use client';

import { Search as SearchIcon, Filter, Sparkles } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/common/breadcrumb';

export default function SearchPage() {
    const commonT = useTranslations('common');

    const breadcrumbItems = [
        { label: commonT('search'), active: true }
    ];

    return (
        <div className="min-h-screen bg-background pt-32 pb-20">
            <div className="container-responsive">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />

                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <h1 className="text-fluid-4xl font-serif gold-gradient mb-6 uppercase tracking-tighter">Neural Catalog</h1>
                    <p className="text-muted-foreground font-body text-[10px] md:text-xs uppercase tracking-[0.4em] font-medium">Scanning the essence archives...</p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-3xl mx-auto mb-20"
                >
                    <div className="relative glass p-2 rounded-3xl md:rounded-full border-border flex flex-col md:flex-row items-center shadow-2xl shadow-gold/5 gap-2">
                        <div className="flex flex-1 items-center w-full px-4">
                            <SearchIcon className="w-5 h-5 text-gold shrink-0" />
                            <input
                                type="text"
                                placeholder="Describe a memory, mood, or note..."
                                className="w-full bg-transparent border-none outline-none px-4 py-4 text-base font-body placeholder:text-zinc-600"
                            />
                        </div>
                        <button className="w-full md:w-auto bg-gold text-primary-foreground px-10 py-5 rounded-2xl md:rounded-full font-heading text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/20">
                            Scan Archives
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
                        {['Woody', 'Floral', 'Nocturnal', 'Minimal'].map((tag) => (
                            <button key={tag} className="text-[9px] md:text-[10px] uppercase tracking-widest font-heading text-muted-foreground hover:text-gold transition-colors">
                                #{tag}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-6 border-b border-border/50 gap-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-heading font-bold">
                        84 Results Found <span className="text-gold ml-2 font-black tracking-widest">Displaying Best Matches</span>
                    </p>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-3 glass px-8 py-3 rounded-2xl border-border text-[10px] uppercase tracking-widest font-heading font-bold hover:text-gold transition-all hover:border-gold">
                        <Filter className="w-4 h-4" /> Refine
                    </button>
                </div>

                <div className="grid grid-responsive">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 4) * 0.05 }}
                        >
                            <Link href={`/collection/${i}`} className="group relative block h-full">
                                <div className="aspect-3/4 glass rounded-[2.5rem] border-border overflow-hidden mb-8 relative hover:border-gold/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-gold/5">
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-linear-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button className="w-full bg-white text-black py-4 rounded-xl font-heading text-[10px] uppercase font-bold tracking-widest hover:bg-gold hover:text-white transition-all shadow-xl">
                                            View Essence
                                        </button>
                                    </div>
                                    <div className="absolute top-6 right-6 z-10">
                                        <Sparkles className="w-4 h-4 text-gold/30 group-hover:text-gold animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="px-4">
                                    <p className="text-[9px] text-gold font-black uppercase tracking-[0.3em] mb-2 font-heading">Perfume GPT Premiere</p>
                                    <h3 className="font-heading text-xl uppercase tracking-widest mb-3 group-hover:text-gold transition-colors leading-tight">Obsidian Mist {i}</h3>
                                    <p className="text-xl font-serif text-foreground">$210.00</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
