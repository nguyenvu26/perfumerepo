'use client';

import { Search as SearchIcon, Filter, Sparkles } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function SearchPage() {
    const commonT = useTranslations('common');

    return (
        <div className="min-h-screen bg-background pt-32 px-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <h1 className="text-5xl font-heading gold-gradient mb-6 uppercase tracking-tighter">Neural Catalog</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">Scanning the essence archives...</p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-3xl mx-auto mb-20"
                >
                    <div className="relative glass p-2 rounded-full border-border flex items-center shadow-2xl shadow-gold/5">
                        <SearchIcon className="ml-6 w-5 h-5 text-gold" />
                        <input
                            type="text"
                            placeholder="Describe a memory, a mood, or a note..."
                            className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-base md:text-lg font-body placeholder:text-zinc-600"
                        />
                        <button className="bg-gold text-primary-foreground px-8 py-4 rounded-full font-heading text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-all">
                            Scan Archives
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
                        {['Woody', 'Floral', 'Nocturnal', 'Minimal'].map((tag) => (
                            <button key={tag} className="text-[10px] uppercase tracking-widest font-heading text-muted-foreground hover:text-gold transition-colors">
                                #{tag}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <div className="flex justify-between items-center mb-10 pb-6 border-b border-border/50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-heading">
                        84 Results Found <span className="text-gold ml-2 font-bold">Displaying Best Matches</span>
                    </p>
                    <button className="flex items-center gap-2 glass px-6 py-2 rounded-full border-border text-[10px] uppercase tracking-widest font-heading hover:text-gold transition-all">
                        <Filter className="w-3 h-3" /> Refine
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/collection/${i}`} className="group relative block">
                                <div className="aspect-3/4 glass rounded-[2.5rem] border-border overflow-hidden mb-6 relative hover:border-gold/30 transition-all duration-500">
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-linear-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button className="w-full bg-white text-black py-4 rounded-2xl font-heading text-[10px] uppercase font-bold tracking-widest hover:bg-gold hover:text-white transition-all">
                                            View Essence
                                        </button>
                                    </div>
                                    <div className="absolute top-6 right-6 z-10">
                                        <Sparkles className="w-4 h-4 text-gold/30 group-hover:text-gold animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.2em] mb-1">Perfume GPT Premiere</p>
                                    <h3 className="font-heading text-xl uppercase tracking-widest mb-2 group-hover:text-gold transition-colors">Obsidian Mist {i}</h3>
                                    <p className="text-lg font-heading">$210.00</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
