'use client';

import React from 'react';
import { Gift, Mail } from 'lucide-react';
import { Header } from '@/components/common/header';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function GiftingPage() {
    const t = useTranslations('gifting_page');
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
            <Header />

            <main className="container mx-auto px-6 py-32 lg:py-40">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-serif text-luxury-black dark:text-white mb-6"
                    >
                        {t('title_line1')} <span className="italic">{t('title_line2')}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 dark:text-stone-400 text-lg font-light max-w-2xl mx-auto"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-12 bg-white dark:bg-white/5 border border-stone-100 dark:border-white/5 rounded-[4rem] space-y-10 flex flex-col justify-between hover:shadow-2xl transition-all group"
                    >
                        <div className="space-y-8">
                            <div className="w-20 h-20 rounded-3xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                <Gift size={40} strokeWidth={1} />
                            </div>
                            <h3 className="text-4xl font-serif text-luxury-black dark:text-white transition-colors uppercase tracking-widest leading-none">
                                {t('physical_title_line1')} <br /><span className="italic">{t('physical_title_line2')}</span>
                            </h3>
                            <p className="text-stone-400 dark:text-stone-500 text-sm font-light leading-relaxed italic border-l-2 border-stone-100 dark:border-white/5 pl-6">
                                {t('physical_desc')}
                            </p>
                        </div>
                        <button className="w-full py-6 border-2 border-luxury-black dark:border-gold text-luxury-black dark:text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] hover:bg-luxury-black hover:text-white dark:hover:bg-gold transition-all cursor-pointer">
                            {t('physical_cta')}
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-12 bg-luxury-black text-white rounded-[4rem] space-y-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 blur-[100px]" />

                        <div className="space-y-8 relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                <Mail size={40} strokeWidth={1} />
                            </div>
                            <h3 className="text-4xl font-serif text-white transition-colors uppercase tracking-widest leading-none italic">
                                {t('digital_title_line1')} <br />{t('digital_title_line2')}
                            </h3>
                            <p className="text-stone-400 text-sm font-light leading-relaxed italic border-l-2 border-white/10 pl-6">
                                {t('digital_desc')}
                            </p>
                        </div>
                        <button className="w-full py-6 bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] hover:bg-white hover:text-luxury-black transition-all shadow-xl relative z-10 cursor-pointer">
                            {t('digital_cta')}
                        </button>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
