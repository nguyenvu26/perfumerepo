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

            <main className="container mx-auto px-4 sm:px-6 py-16 md:py-32 lg:py-40">
                <div className="max-w-4xl mx-auto text-center mb-12 md:mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-6xl font-heading text-luxury-black dark:text-white mb-4 md:mb-6 uppercase tracking-tighter md:tracking-widest"
                    >
                        {t.rich('title', {
                            tiers: (chunks) => <span className="italic">{chunks}</span>
                        })}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-stone-500 dark:text-stone-400 text-[8px] md:text-[10px] uppercase font-bold tracking-[.3em] max-w-xl mx-auto px-4"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto">
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            viewport={{ once: true }}
                            className="p-8 md:p-10 bg-white dark:bg-white/5 border border-border rounded-[2rem] md:rounded-[2.5rem] space-y-4 hover:border-gold/50 transition-all group shadow-sm hover:shadow-xl"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl md:text-2xl font-heading text-luxury-black dark:text-white transition-colors group-hover:italic uppercase tracking-widest leading-tight">
                                    {tier.tier}
                                </h3>
                                <div className="p-2.5 md:p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl md:rounded-2xl group-hover:bg-gold/10 transition-colors">
                                    <Trophy className="text-stone-300 group-hover:text-gold transition-colors w-4.5 h-4.5 md:w-5 md:h-5" />
                                </div>
                            </div>
                            <p className="text-[9px] md:text-[10px] font-black tracking-widest uppercase text-gold">
                                {tier.req}
                            </p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 italic leading-relaxed uppercase tracking-widest mt-4">
                                {tier.perk}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
