'use client';

import React from 'react';
import { Gift, Mail } from 'lucide-react';
import { Header } from '@/components/common/header';
import { motion } from 'framer-motion';

export default function GiftingPage() {
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
                        The Art of <span className="italic">Giving</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 dark:text-stone-400 text-lg font-light max-w-2xl mx-auto"
                    >
                        Bestow the luxury of a personal olfactory journey upon another.
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
                                The Physical <br /><span className="italic">Discovery Set</span>
                            </h3>
                            <p className="text-stone-400 dark:text-stone-500 text-sm font-light leading-relaxed italic border-l-2 border-stone-100 dark:border-white/5 pl-6">
                                A hand-packaged selection of our permanent collection, allowing them to find their initial resonance before the AI synthesis.
                            </p>
                        </div>
                        <button className="w-full py-6 border-2 border-luxury-black dark:border-gold text-luxury-black dark:text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] hover:bg-luxury-black hover:text-white dark:hover:bg-gold transition-all cursor-pointer">
                            Buy Physical Set • 2.000.000đ
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
                                The Digital <br />Atelier Pass
                            </h3>
                            <p className="text-stone-400 text-sm font-light leading-relaxed italic border-l-2 border-white/10 pl-6">
                                An invitation to our AI-powered consultation. The gift of a bespoke molecular signature delivered instantly via the digital registry.
                            </p>
                        </div>
                        <button className="w-full py-6 bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] hover:bg-white hover:text-luxury-black transition-all shadow-xl relative z-10 cursor-pointer">
                            Send Digital Pass • 5.500.000đ
                        </button>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
