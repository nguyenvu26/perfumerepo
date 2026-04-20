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

                <div className="max-w-3xl mx-auto space-y-12 md:space-y-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 sm:p-12 md:p-16 bg-luxury-black text-white rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4rem] text-center space-y-8 md:space-y-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gold/20 blur-[60px] md:blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-gold/10 blur-[60px] md:blur-[100px]" />

                        <div className="relative z-10 w-full">
                            <h3 className="text-2xl md:text-3xl font-heading italic mb-4 md:mb-6">{t('card.title')}</h3>
                            <p className="text-stone-400 text-[10px] md:text-sm italic font-light max-w-sm mx-auto mb-8 md:mb-10 px-4">
                                {t('card.quote')}
                            </p>
                            <div className="text-4xl md:text-6xl font-heading text-gold mb-8 md:mb-10">
                                {t('card.price', { amount: formattedPrice })} <span className="text-xs md:text-lg text-stone-500 not-italic">{t('card.per_month')}</span>
                            </div>
                            <button className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 bg-white text-luxury-black rounded-full font-bold tracking-[.3em] uppercase text-[9px] md:text-[10px] hover:bg-gold hover:text-white transition-all shadow-xl cursor-pointer min-h-[44px]">
                                {t('card.cta')}
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center pt-8 md:pt-12">
                        {[
                            { icon: Bookmark, title: t('perks.drops.title'), desc: t('perks.drops.desc') },
                            { icon: Calendar, title: t('perks.sync.title'), desc: t('perks.sync.desc') },
                            { icon: Zap, title: t('perks.retraining.title'), desc: t('perks.retraining.desc') }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="space-y-3 md:space-y-4 group px-4"
                            >
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-stone-100 dark:border-white/5 mx-auto flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                                    <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1} />
                                </div>
                                <h4 className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-luxury-black dark:text-white">
                                    {item.title}
                                </h4>
                                <p className="text-[9px] md:text-[10px] text-stone-400 uppercase tracking-widest italic leading-relaxed">
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
