'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function LogoutPage() {
    const commonT = useTranslations('common');

    return (
        <div className="min-h-screen bg-ebony flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="max-w-2xl space-y-12 relative z-10"
            >
                <div className="space-y-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="flex justify-center"
                    >
                        <div className="w-20 h-20 rounded-full border border-gold/20 flex items-center justify-center glass-dark">
                            <Sparkles className="w-8 h-8 text-gold animate-pulse" />
                        </div>
                    </motion.div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-heading text-cream font-light italic leading-tight">
                            Until the next <br /> Inspiration
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.5em] text-gold/60 font-bold">
                            You have been safely disconnected from the House
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-6 max-w-sm mx-auto">
                    <p className="text-cream/50 font-body text-sm leading-relaxed uppercase tracking-widest italic">
                        "A journey of a thousand scents ends with a single memory."
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-10 py-5 bg-gold text-ebony font-body font-bold uppercase tracking-[0.3em] text-[10px] rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.2)] hover:shadow-gold/40 transition-all flex items-center gap-3"
                        >
                            The Home <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                    <Link href="/login">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="px-10 py-5 border border-white/10 text-cream font-body font-bold uppercase tracking-[0.3em] text-[10px] rounded-full glass-dark hover:border-gold/30 transition-all"
                        >
                            Return to Portal
                        </motion.button>
                    </Link>
                </div>
            </motion.div>

            {/* Subtle Brand Watermark */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20">
                <span className="font-heading text-xl tracking-[0.6em] uppercase text-cream">AURA & AI</span>
            </div>
        </div>
    );
}
