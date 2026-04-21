'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Cpu, FlaskConical, PackageCheck } from 'lucide-react';
import { Link } from '@/lib/i18n';

export const Discovery = () => {
    const t = useTranslations('discovery');

    const steps = [
        { icon: Cpu, title: t('step1_title'), desc: t('step1_desc'), label: t('steps.0.label') },
        { icon: FlaskConical, title: t('step2_title'), desc: t('step2_desc'), label: t('steps.1.label') },
        { icon: PackageCheck, title: t('step3_title'), desc: t('step3_desc'), label: t('steps.2.label') },
    ];

    return (
        <section className="section-py relative bg-background overflow-hidden">
            {/* Soft Neural Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="container-responsive relative z-10">
                <div className="text-center space-y-4 mb-20 lg:mb-32">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="flex justify-center items-center gap-4 text-gold/60"
                    >
                        <div className="w-8 h-px bg-gold/30" />
                        <span className="text-[9px] lg:text-[11px] uppercase tracking-[0.4em] font-bold text-gold-dark">{t('methodology')}</span>
                        <div className="w-8 h-px bg-gold/30" />
                    </motion.div>
                    <h2 className="text-fluid-3xl font-heading text-foreground font-light px-4">
                        {t.rich('title', {
                            span: (chunks) => <span className="italic font-normal">{chunks}</span>
                        })}
                    </h2>
                </div>

                <div className="relative">
                    {/* Decorative Curved Path (SVG) */}
                    <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-gold/20 -translate-y-1/2 hidden md:block" />

                    <div className="grid-responsive cols-3 relative gap-16 lg:gap-gutter">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, duration: 1, ease: "easeOut" }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                {/* Step Number Badge */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.5em] font-bold text-gold/40 group-hover:text-gold transition-colors">
                                    {t('phase')} 0{i + 1}
                                </div>

                                {/* Icon Vessel */}
                                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full glass border-white/60 mb-8 lg:mb-10 flex items-center justify-center relative shadow-2xl group-hover:shadow-gold/10 transition-all duration-700 overflow-hidden bg-background/40">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <step.icon className="w-8 h-8 lg:w-10 lg:h-10 text-foreground/80 group-hover:text-gold group-hover:scale-110 transition-all duration-500" />
                                </div>

                                {/* Content */}
                                <div className="space-y-3 lg:space-y-4">
                                    <span className="text-[9px] lg:text-[11px] uppercase tracking-[0.4em] font-body font-bold text-secondary/40 block">
                                        {step.label}
                                    </span>
                                    <h3 className="text-xl lg:text-2xl font-heading text-foreground font-medium tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-secondary/60 font-body text-xs lg:text-[14px] leading-relaxed max-w-[280px] lg:max-w-xs mx-auto uppercase tracking-wider">
                                        {step.desc}
                                    </p>
                                </div>

                                {/* Interactive Glow */}
                                <div className="absolute -inset-4 bg-gold/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA for Discovery */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 lg:mt-24 text-center"
                >
                    <Link href="/quiz">
                        <button className="px-8 lg:px-10 py-4 glass border-foreground/10 text-foreground font-body font-bold text-[10px] uppercase tracking-[0.4em] rounded-full hover:bg-foreground hover:text-background transition-all w-full sm:w-auto">
                            {t('begin_profile')}
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

