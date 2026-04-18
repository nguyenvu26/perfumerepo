'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Header } from '@/components/common/header';
import { Sparkles, Wind, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function StoryPage() {
    const t = useTranslations('story_page');

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
            <Header />

            <main>
                {/* Intro Section */}
                <section className="relative h-screen flex items-center justify-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 z-0"
                    >
                        <Image
                            src="/luxury_perfume_hero_cinematic.png"
                            alt="The Art of Scent"
                            fill
                            className="object-cover brightness-50"
                        />
                    </motion.div>

                    <div className="relative z-10 max-w-4xl">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-block px-4 py-1.5 glass text-white text-xs font-bold tracking-[.3em] uppercase mb-8 border border-white/20"
                        >
                            {t('intro.since')}
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-6xl md:text-8xl font-serif text-white mb-12 leading-tight"
                        >
                            {t('intro.title_line1')} <br />
                            <span className="italic">{t('intro.title_line2')}</span>
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="w-px h-24 bg-linear-to-b from-white to-transparent mx-auto"
                        />
                    </div>
                </section>

                {/* Philosophy Section */}
                <section className="py-32 bg-white dark:bg-zinc-900 transition-colors">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                            <div>
                                <span className="text-xs font-bold tracking-[.2em] uppercase text-gold mb-6 block">
                                    {t('philosophy.badge')}
                                </span>
                                <h2 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white mb-10 italic transition-colors">
                                    {t('philosophy.quote')}
                                </h2>
                                <div className="space-y-6 text-stone-600 dark:text-stone-400 leading-[1.8] text-lg font-light transition-colors">
                                    <p>
                                        {t('philosophy.p1')}
                                    </p>
                                    <p>
                                        {t('philosophy.p2')}
                                    </p>
                                </div>
                            </div>
                            <div className="relative aspect-4/5 rounded-[3rem] overflow-hidden shadow-2xl border border-stone-100 dark:border-white/5">
                                <Image
                                    src="/luxury_ai_scent_lab.png"
                                    alt="Ingredients Analysis"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Method Section */}
                <section className="py-32 bg-stone-100 dark:bg-black/20 transition-colors">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white transition-colors">
                                {t('method.title')}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                            {[
                                {
                                    icon: Wind,
                                    title: t('method.sourcing.title'),
                                    desc: t('method.sourcing.desc')
                                },
                                {
                                    icon: Sparkles,
                                    title: t('method.analysis.title'),
                                    desc: t('method.analysis.desc')
                                },
                                {
                                    icon: Heart,
                                    title: t('method.crafting.title'),
                                    desc: t('method.crafting.desc')
                                }
                            ].map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className="text-center group">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-gold mx-auto mb-8 group-hover:bg-gold group-hover:text-white transition-all duration-500 border border-stone-100 dark:border-white/5">
                                            <Icon size={32} strokeWidth={1} />
                                        </div>
                                        <h4 className="text-xl font-serif mb-4 text-luxury-black dark:text-white transition-colors">
                                            {step.title}
                                        </h4>
                                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed transition-colors">
                                            {step.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Store Location Section */}
                <section className="py-32 bg-white dark:bg-zinc-900 transition-colors">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            <div>
                                <span className="text-xs font-bold tracking-[.2em] uppercase text-gold mb-6 block">
                                    {t('location.badge')}
                                </span>
                                <h2 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white mb-8 italic transition-colors">
                                    {t('location.title')}
                                </h2>
                                <p className="text-stone-600 dark:text-stone-400 leading-[1.8] text-lg font-light transition-colors">
                                    {t('location.desc')}
                                </p>
                                <div className="mt-10 space-y-2 text-sm text-stone-500 dark:text-stone-400">
                                    <p className="font-bold tracking-widest uppercase text-[10px] text-gold">{t('location.store_name')}</p>
                                    <p>{t('location.province')}</p>
                                    <a
                                        href="https://maps.app.goo.gl/ttgEyPDpoqE93x8W6"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex text-[10px] font-bold uppercase tracking-widest text-gold hover:underline underline-offset-4"
                                    >
                                        {t('location.map_link')}
                                    </a>
                                </div>
                            </div>
                            <div className="rounded-[3rem] overflow-hidden border border-stone-100 dark:border-white/5 shadow-2xl bg-stone-50 dark:bg-zinc-800">
                                <div className="relative aspect-16/10">
                                    <iframe
                                        title="NOXH An Phú Thịnh Map"
                                        src="https://www.google.com/maps?q=NOXH%20An%20Ph%C3%BA%20Th%E1%BB%8Bnh%2C%20Ph%C6%B0%E1%BB%9Dng%20Quy%20Nh%C6%A1n%20%C4%90%C3%B4ng%2C%20T%E1%BB%89nh%20Gia%20Lai&output=embed"
                                        className="absolute inset-0 w-full h-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-48 relative overflow-hidden bg-luxury-black text-white text-center">
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-5xl md:text-7xl font-serif mb-12">
                            {t('cta.title_line1')} <br /> {t('cta.title_line2')}
                        </h2>
                        <Link
                            href="/customer/consultation"
                            className="inline-block px-12 py-5 bg-gold text-white rounded-full font-bold tracking-widest uppercase hover:bg-gold/80 transition-all shadow-xl"
                        >
                            {t('cta.button')}
                        </Link>
                    </div>
                    <div className="absolute inset-0 opacity-20">
                        <Image
                            src="/luxury_perfume_hero_cinematic.png"
                            alt="Background Overlay"
                            fill
                            className="object-cover"
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
