'use client';

import React from 'react';
import { Bookmark, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale, useFormatter } from 'next-intl';

export default function SubscriptionPage() {
    const t = useTranslations('subscription_page');
    const tFeatured = useTranslations('featured');
    const locale = useLocale();
    const format = useFormatter();

    const priceAmount = locale === 'vi' ? 2000000 : 85;
    const formattedPrice = format.number(priceAmount, {
        style: 'currency',
        currency: tFeatured('currency_code') || 'VND',
        maximumFractionDigits: 0
    });
    return (
        <div className="min-h-screen transition-colors">
            <main className="container mx-auto px-6 py-12 lg:py-20">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-serif text-luxury-black dark:text-white mb-6"
                    >
                        {t.rich('title', {
                            club: (chunks) => <span className="italic">{chunks}</span>
                        })}
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

                <div className="max-w-3xl mx-auto space-y-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 md:p-16 bg-luxury-black text-white rounded-[4rem] text-center space-y-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 blur-[100px]" />

                        <div className="relative z-10">
                            <h3 className="text-3xl font-serif italic mb-6">{t('card.title')}</h3>
                            <p className="text-stone-400 text-sm italic font-light max-w-md mx-auto mb-10">
                                {t('card.quote')}
                            </p>
                            <div className="text-6xl font-serif text-gold mb-10">
                                {t('card.price', { amount: formattedPrice })} <span className="text-lg text-stone-500 not-italic">{t('card.per_month')}</span>
                            </div>
                            <button className="px-12 py-5 bg-white text-luxury-black rounded-full font-bold tracking-[.3em] uppercase text-[10px] hover:bg-gold hover:text-white transition-all shadow-xl cursor-pointer">
                                {t('card.cta')}
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 text-center pt-12">
                        {[
                            { icon: Bookmark, title: t('perks.drops.title'), desc: t('perks.drops.desc') },
                            { icon: Calendar, title: t('perks.sync.title'), desc: t('perks.sync.desc') },
                            { icon: Zap, title: t('perks.retraining.title'), desc: t('perks.retraining.desc') }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-4 group"
                            >
                                <div className="w-16 h-16 rounded-full border border-stone-100 dark:border-white/5 mx-auto flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                                    <item.icon size={24} strokeWidth={1} />
                                </div>
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-luxury-black dark:text-white">
                                    {item.title}
                                </h4>
                                <p className="text-[10px] text-stone-400 uppercase tracking-tighter italic">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
