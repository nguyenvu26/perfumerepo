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
        <section className="py-40 bg-muted/30 overflow-hidden transition-colors" id="ai-story">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-24 items-center">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1 }}
                    >
                        {/* Badge */}
                        <div className="flex items-center gap-3 text-gold mb-8">
                            <Sparkles size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">
                                {t('badge')}
                            </span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-5xl md:text-7xl font-heading mb-10 leading-[1.1] text-foreground transition-colors">
                            {t('title')}
                        </h2>

                        {/* Description */}
                        <p className="text-xl text-muted-foreground mb-14 leading-relaxed font-light transition-colors">
                            {t('subtitle')}
                        </p>

                        {/* Features */}
                        <div className="space-y-10 mb-16">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex gap-6 group cursor-default"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-card shadow-sm border border-border flex items-center justify-center text-gold group-hover:scale-110 group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                        <feature.icon size={28} strokeWidth={1} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-serif text-foreground mb-2 transition-colors uppercase">
                                            {feature.title}
                                        </h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed transition-colors font-light italic">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/quiz"
                            className="group px-12 py-5 border-2 border-foreground dark:border-gold text-foreground hover:bg-foreground dark:hover:bg-gold hover:text-background dark:hover:text-background rounded-full font-bold uppercase text-[10px] transition-all inline-flex items-center gap-4"
                        >
                            {t('cta')}
                            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Right: Image with Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                        className="relative aspect-[4/5] md:aspect-[3/4] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]"
                    >
                        <Image
                            src="/luxury_ai_scent_lab.png"
                            alt="AI Consultation Interface"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ebony/60 to-transparent" />

                        {/* Stats Card Overlay */}
                        <div className="absolute bottom-12 left-12 right-12 p-10 glass-dark backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                                    <Sparkles className="text-gold" size={24} />
                                </div>
                                <div>
                                    <h5 className="text-white font-serif text-lg">{t('analysis_title')}</h5>
                                    <p className="text-[9px] uppercase tracking-[.3em] text-white/50">
                                        {t('analysis_subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "92%" }}
                                        transition={{ duration: 2.5, ease: "easeOut" }}
                                        className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.8)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-white/80 tracking-[.4em] uppercase font-bold">
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
