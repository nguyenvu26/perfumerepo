'use client';

import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/common/breadcrumb';

export default function FavoritesPage() {
    const t = useTranslations('common');

    const breadcrumbItems = [
        { label: t('favorites'), active: true }
    ];

    return (
        <div className="min-h-screen bg-background pt-32 pb-20">
            <div className="container-responsive">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />

                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                    >
                        <Heart className="w-12 h-12 text-gold mx-auto mb-6 fill-gold/10" />
                    </motion.div>
                    <h1 className="text-fluid-4xl font-serif gold-gradient mb-4 uppercase tracking-tighter tracking-widest">Your Sanctuary</h1>
                    <p className="text-muted-foreground font-body text-[10px] md:text-sm uppercase tracking-[0.4em] font-medium">A curated archive of your desired essences.</p>
                </header>

                <div className="grid grid-responsive">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass rounded-[2.5rem] md:rounded-[3rem] border-border overflow-hidden hover:border-gold/30 transition-all group flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-gold/5">
                            <div className="aspect-[4/5] bg-secondary/10 relative overflow-hidden shrink-0">
                                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                                    <button className="w-10 h-10 rounded-full glass border-border flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-1">
                                <div className="flex flex-col mb-8 flex-1">
                                    <p className="text-[9px] text-gold uppercase tracking-[0.3em] font-black mb-2">Elite Series</p>
                                    <h3 className="font-heading text-xl md:text-2xl uppercase tracking-widest text-foreground group-hover:text-gold transition-colors leading-tight">Velvet Oud</h3>
                                    <p className="font-serif text-xl mt-4">$320.00</p>
                                </div>
                                <button className="w-full bg-foreground text-background py-4 rounded-2xl font-heading text-[10px] uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gold hover:text-primary-foreground transition-all shadow-lg active:scale-95">
                                    <ShoppingBag className="w-4 h-4" /> Add to Bag
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
