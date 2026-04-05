'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';

export const Membership = () => {
    const t = useTranslations('membership');

    const benefits = [
        { icon: Zap, title: t('benefit1_title'), desc: t('benefit1_desc') },
        { icon: ShieldCheck, title: t('benefit2_title'), desc: t('benefit2_desc') },
        { icon: Crown, title: t('benefit3_title'), desc: t('benefit3_desc') },
    ];

    return (
        <section className="py-40 px-6 bg-ebony relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.08)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center space-y-8 mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full border border-gold/20 glass-dark"
                    >
                        <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-gold">{t('badge')}</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-heading text-cream font-light"
                    >
                        {t('title')}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-cream/50 font-body max-w-2xl mx-auto uppercase tracking-widest leading-relaxed"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="space-y-6"
                    >
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="group flex gap-8 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-gold transition-all duration-700">
                                    <benefit.icon className="w-6 h-6 text-gold group-hover:text-ebony transition-colors" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-heading text-cream tracking-wide">{benefit.title}</h3>
                                    <p className="text-cream/40 text-[11px] font-body uppercase tracking-[0.1em] leading-relaxed group-hover:text-cream/70 transition-colors">
                                        {benefit.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Elegant Card Container */}
                        <div className="relative aspect-[1.6/1] rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 group perspective-1000">
                            <motion.div
                                whileHover={{ rotateY: -10, rotateX: 5 }}
                                className="relative w-full h-full transition-transform duration-700 preserve-3d"
                            >
                                <Image
                                    src="/luxury_membership_card_cinematic.png"
                                    alt="Elite Membership Card"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-ebony/60 via-transparent to-white/10" />

                                <div className="absolute bottom-10 left-10 text-white/40 font-body text-[8px] uppercase tracking-[0.5em] font-bold">
                                    {t('member_no', { no: '0001' })}
                                </div>
                            </motion.div>
                        </div>

                        {/* CTA Overlay or Button Below */}
                        <div className="mt-12 text-center lg:text-left">
                            <button className="gold-btn-gradient px-12 py-5 rounded-full font-body font-bold text-[10px] uppercase tracking-[0.4em] text-white shadow-2xl shadow-gold/10 hover:shadow-gold/30 transition-all">
                                {t('cta_access')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
