'use client';

import React from 'react';
import { Header } from '@/components/common/header';
import { motion } from 'framer-motion';
import { Droplets, Sparkles, Wind, Zap } from 'lucide-react';

export default function IngredientsPage() {
    const categories = [
        {
            title: "The Resins",
            items: "Omani Frankincense, Aged Labdanum, Somalian Myrrh",
            icon: Zap
        },
        {
            title: "The Florals",
            items: "Grasse Jasmine Grandiflorum, Bulgarian Damask Rose, Florentine Iris",
            icon: Droplets
        },
        {
            title: "The Woods",
            items: "Mysore Sandalwood, Indonesian Oud, Caledonian Cedar",
            icon: Wind
        },
        {
            title: "The Neutrals",
            items: "Ethical Ambergris, Molecular Musk, Clean Vetiver",
            icon: Sparkles
        }
    ];

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
            <Header />

            <main className="container mx-auto px-6 py-32 lg:py-40">
                <div className="max-w-4xl mx-auto text-center mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-serif text-luxury-black dark:text-white mb-6"
                    >
                        The <span className="italic">Anthology</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 dark:text-stone-400 text-lg font-light max-w-2xl mx-auto"
                    >
                        Explore the raw molecular heritage that defines our syntheses.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="space-y-6 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5 text-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                    <cat.icon size={20} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-luxury-black dark:text-white font-serif text-2xl tracking-widest uppercase italic group-hover:not-italic transition-all">
                                    {cat.title}
                                </h3>
                            </div>
                            <p className="text-stone-500 dark:text-stone-400 font-light text-lg leading-relaxed border-l-2 border-stone-100 dark:border-white/5 pl-8 group-hover:border-gold transition-colors">
                                {cat.items}.
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-40 text-center">
                    <div className="inline-block p-1 bg-stone-100 dark:bg-white/5 rounded-full mb-8">
                        <div className="px-6 py-2 bg-white dark:bg-zinc-900 rounded-full text-[10px] font-bold tracking-[.3em] uppercase text-stone-400">
                            Ethically Sourced
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
