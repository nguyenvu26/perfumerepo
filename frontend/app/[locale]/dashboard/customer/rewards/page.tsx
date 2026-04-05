'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/common/header';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RewardsPage() {
    const t = useTranslations('rewards_page');
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
            <Header />

            <main className="container mx-auto px-6 py-32 lg:py-40">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-serif text-luxury-black dark:text-white mb-6 uppercase tracking-widest"
                    >
                        {t.rich('title', {
                            tiers: (chunks) => <span className="italic">{chunks}</span>
                        })}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 dark:text-stone-400 text-[10px] uppercase font-bold tracking-[.3em] max-w-2xl mx-auto"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {[
                        {
                            tier: t('tiers.silver.name'),
                            req: t('tiers.silver.req'),
                            perk: t('tiers.silver.perk')
                        },
                        {
                            tier: t('tiers.gold.name'),
                            req: t('tiers.gold.req'),
                            perk: t('tiers.gold.perk')
                        },
                        {
                            tier: t('tiers.platinum.name'),
                            req: t('tiers.platinum.req'),
                            perk: t('tiers.platinum.perk')
                        },
                        {
                            tier: t('tiers.obsidian.name'),
                            req: t('tiers.obsidian.req'),
                            perk: t('tiers.obsidian.perk')
                        }
                    ].map((tier, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="p-10 bg-white dark:bg-white/5 border border-stone-100 dark:border-white/5 rounded-[2.5rem] space-y-4 hover:border-gold transition-all group shadow-sm hover:shadow-xl"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-serif text-luxury-black dark:text-white transition-colors group-hover:italic uppercase tracking-widest">
                                    {tier.tier}
                                </h3>
                                <div className="p-3 bg-stone-50 dark:bg-zinc-800 rounded-2xl group-hover:bg-gold/10 transition-colors">
                                    <Trophy size={20} className="text-stone-300 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-gold">
                                {tier.req}
                            </p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 italic leading-relaxed uppercase tracking-tighter">
                                {tier.perk}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
