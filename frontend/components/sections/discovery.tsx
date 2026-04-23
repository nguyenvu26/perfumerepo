'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Cpu, FlaskConical, PackageCheck, ArrowRight } from 'lucide-react';

import { Link } from '@/lib/i18n';

export const Discovery = () => {
    const t = useTranslations('discovery');

    const steps = [
        { icon: Cpu, title: t('step1_title'), desc: t('step1_desc'), label: t('steps.0.label'), number: '01' },
        { icon: FlaskConical, title: t('step2_title'), desc: t('step2_desc'), label: t('steps.1.label'), number: '02' },
        { icon: PackageCheck, title: t('step3_title'), desc: t('step3_desc'), label: t('steps.2.label'), number: '03' },
    ];

    return (
        <section className="section-py relative overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(197,160,89,0.08),transparent_26%)]" />

            <div className="container-responsive relative z-10">
                <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65 }}
                        className="xl:sticky xl:top-28"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/8 px-4 py-2 text-sm font-medium text-gold">
                            <Cpu className="h-4 w-4" />
                            <span>{t('methodology')}</span>
                        </div>

                        <h2 className="mt-5 text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl">
                            {t('title')}
                        </h2>

                        <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                            {t('subtitle')}
                        </p>

                        <div className="mt-10">
                            <Link
                                href="/quiz"
                                className="group inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full bg-gold px-7 text-base font-semibold text-luxury-black transition-all hover:scale-[1.01]"
                            >
                                {t('begin_profile')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.55, delay: index * 0.1 }}
                                className="rounded-[2rem] border border-black/6 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-card md:p-7"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium text-gold">{step.number}</span>
                                </div>

                                <p className="mt-5 text-sm font-medium text-muted-foreground">{step.label}</p>
                                <h3 className="mt-2 text-2xl leading-tight text-foreground">{step.title}</h3>
                                <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: 0.3 }}
                            className="rounded-[2rem] border border-gold/18 bg-[linear-gradient(135deg,rgba(197,160,89,0.14),rgba(197,160,89,0.04))] p-6 shadow-[0_20px_60px_-42px_rgba(197,160,89,0.3)] md:col-span-2 md:p-7"
                        >
                            <p className="text-sm font-medium text-gold">{t('final_badge')}</p>
                            <h3 className="mt-2 text-2xl leading-tight text-foreground md:text-3xl">
                                {t('final_title')}
                            </h3>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                                {t('final_desc')}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
