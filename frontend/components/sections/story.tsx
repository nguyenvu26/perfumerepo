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
            desc: t('feature1_desc')
        },
        {
            icon: Wind,
            title: t('feature2_title'),
            desc: t('feature2_desc')
        },
        {
            icon: Shield,
            title: t('feature3_title'),
            desc: t('feature3_desc')
        }
    ];

    return (
        <section className="section-py bg-[var(--section-alt)] overflow-hidden transition-colors" id="ai-story">
            <div className="container-responsive">
                <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-16 lg:gap-32 items-center">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1 }}
                        className="order-2 lg:order-1"
                    >
                        {/* Badge */}
                        <div className="flex items-center gap-3 text-gold mb-6 lg:mb-8">
                            <Sparkles size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">
                                {t('badge')}
                            </span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-fluid-xl lg:text-fluid-2xl font-heading mb-6 lg:mb-10 leading-[1.05] text-foreground transition-colors max-w-2xl">
                            {t('title')}
                        </h2>

                        {/* Description */}
                        <p className="text-fluid-md text-muted-foreground mb-10 lg:mb-14 leading-relaxed font-light transition-colors">
                            {t('subtitle')}
                        </p>

                        {/* Features */}
                        <div className="space-y-8 lg:space-y-10 mb-12 lg:mb-16">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex gap-4 lg:gap-6 group cursor-default"
                                >
                                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1.25rem] lg:rounded-[1.5rem] bg-card shadow-sm border border-border flex items-center justify-center text-gold group-hover:scale-110 group-hover:bg-gold group-hover:text-white transition-all duration-500 shrink-0">
                                        <feature.icon size={24} className="lg:w-7 lg:h-7" strokeWidth={1} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base lg:text-lg font-serif text-foreground mb-1 lg:mb-2 transition-colors uppercase">
                                            {feature.title}
                                        </h4>
                                        <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed transition-colors font-light italic">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="flex">
                            <Link
                                href="/quiz"
                                className="group px-10 lg:px-12 py-4 lg:py-5 border-2 border-foreground dark:border-gold text-foreground hover:bg-foreground dark:hover:bg-gold hover:text-background dark:hover:text-background rounded-full font-bold uppercase text-[10px] transition-all inline-flex items-center gap-4 w-full sm:w-auto justify-center"
                            >
                                {t('cta')}
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right: Image with Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                        className="relative aspect-[4/5] md:aspect-[3/4] rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] order-1 lg:order-2"
                    >
                        <Image
                            src="/luxury_ai_scent_lab.png"
                            alt="AI Consultation Interface"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ebony/60 to-transparent" />

                        {/* Stats Card Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 lg:bottom-12 lg:left-12 lg:right-12 p-6 lg:p-10 glass-dark backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] border border-white/10">
                            <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="text-gold" size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h5 className="text-white font-serif text-base lg:text-lg truncate">{t('analysis_title')}</h5>
                                    <p className="text-[8px] lg:text-[9px] uppercase tracking-[.3em] text-white/50 truncate">
                                        {t('analysis_subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3 lg:space-y-4">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "92%" }}
                                        transition={{ duration: 2.5, ease: "easeOut" }}
                                        className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.8)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] lg:text-[10px] text-white/80 tracking-[.4em] uppercase font-bold">
                                    <span>{t('affinity')}</span>
                                    <span className="text-gold">92.4%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
