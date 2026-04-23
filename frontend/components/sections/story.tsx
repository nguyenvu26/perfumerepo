'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, Wind, Shield, ArrowRight } from 'lucide-react';

import { Link } from '@/lib/i18n';

export const Story = () => {
    const t = useTranslations('story');

    const features = [
        {
            icon: Droplets,
            title: t('feature1_title'),
            desc: t('feature1_desc'),
        },
        {
            icon: Wind,
            title: t('feature2_title'),
            desc: t('feature2_desc'),
        },
        {
            icon: Shield,
            title: t('feature3_title'),
            desc: t('feature3_desc'),
        },
    ];

    return (
        <section className="section-py overflow-hidden bg-[var(--section-alt)] transition-colors" id="ai-story">
            <div className="container-responsive">
                <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.7 }}
                        className="relative order-2 xl:order-1"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-black/6 bg-stone-950 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.65)] dark:border-white/10">
                            <div className="relative aspect-square sm:aspect-[4/5]">
                                <Image
                                    src="/bleu de channel.png"
                                    alt="Bleu de Chanel"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.7))]" />
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                                <div className="rounded-[1.8rem] border border-white/10 bg-black/35 p-5 text-white backdrop-blur-2xl md:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/18 text-gold">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white/70">{t('analysis_title')}</p>
                                            <p className="text-lg font-semibold text-white">{t('analysis_subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/12">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '92%' }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.8, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-gold"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-white/80">
                                            <span>{t('affinity')}</span>
                                            <span className="font-semibold text-gold">92.4%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.7, delay: 0.05 }}
                        className="order-1 xl:order-2"
                    >
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/8 px-4 py-2 text-sm font-medium text-gold">
                            <Sparkles className="h-4 w-4" />
                            <span>{t('badge')}</span>
                        </div>

                        <h2 className="max-w-3xl text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl">
                            {t('title')}
                        </h2>

                        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                            {t('subtitle')}
                        </p>

                        <div className="mt-10 grid gap-4">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.55, delay: index * 0.1 }}
                                    className="rounded-[1.75rem] border border-black/6 bg-white/78 p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] md:p-6"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                                            <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">
                                                {feature.desc}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-10">
                            <Link
                                href="/quiz"
                                className="group inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full bg-foreground px-7 text-base font-semibold text-background transition-all hover:scale-[1.01] dark:bg-gold dark:text-luxury-black"
                            >
                                {t('cta')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
