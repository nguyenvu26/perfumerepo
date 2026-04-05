'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { BrainCircuit, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CustomerQuiz() {
    const t = useTranslations('quiz');
    const [selected, setSelected] = useState<number | null>(null);

    const options = [
        { key: 'city', icon: '🏙️' },
        { key: 'sea', icon: '🌊' },
        { key: 'library', icon: '📚' },
        { key: 'garden', icon: '🌸' }
    ];

    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="p-4 md:p-8 max-w-5xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center">
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[3rem] glass border-gold/20 mb-8 relative">
                        <div className="absolute inset-0 bg-gold/5 animate-pulse rounded-[3rem]" />
                        <BrainCircuit className="w-10 h-10 text-gold relative z-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading gold-gradient mb-6 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-sm md:text-base uppercase tracking-[0.2em] leading-relaxed max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 md:p-16 rounded-[4rem] border-gold/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "25%" }}
                            className="h-full bg-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                        />
                    </div>

                    <div className="space-y-12 py-4">
                        <h2 className="text-xl md:text-2xl font-heading text-foreground uppercase tracking-widest text-center">
                            {t('question')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {options.map((opt, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelected(i)}
                                    className={`glass p-8 rounded-3xl border-border hover:border-gold/50 group transition-all text-left relative overflow-hidden ${selected === i ? 'ring-2 ring-gold border-gold/50 bg-gold/5' : ''}`}
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Sparkles className="w-5 h-5 text-gold/30" />
                                    </div>
                                    <div className="flex items-start gap-6">
                                        <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-foreground uppercase tracking-widest mb-2 group-hover:text-gold transition-colors">
                                                {t(`options.${opt.key}.title`)}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-relaxed">
                                                {t(`options.${opt.key}.desc`)}
                                            </p>
                                        </div>
                                    </div>
                                    {selected === i && (
                                        <div className="absolute bottom-0 right-0 p-2">
                                            <div className="w-2 h-2 bg-gold rounded-full" />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                        <motion.button
                            disabled={selected === null}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-4 px-12 py-5 rounded-full font-heading text-[10px] uppercase tracking-[0.3em] font-bold transition-all shadow-xl ${selected !== null ? 'bg-gold text-primary-foreground shadow-gold/20' : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'}`}
                        >
                            {t('cta')}
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </main>
        </AuthGuard>
    );
}
