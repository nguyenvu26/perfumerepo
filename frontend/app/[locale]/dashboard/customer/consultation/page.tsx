'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, Droplet, Wind, Coffee, Zap, Moon, Sun, LucideIcon } from 'lucide-react';

interface ConsultationOption {
    label: string;
    value: string;
    icon?: LucideIcon;
}

interface StepData {
    id: number;
    title: string;
    key: string;
    options: ConsultationOption[];
}

export default function ConsultationPage() {
    const t = useTranslations('consultation_page');
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const totalSteps = 4;

    const handleNext = (key: string, value: string) => {
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);

        if (step < 3) {
            setStep(step + 1);
        } else if (step === 3) {
            setIsAnalyzing(true);
            setStep(4);
            setTimeout(() => {
                setIsAnalyzing(false);
            }, 4000);
        }
    };

    const currentStepData: StepData[] = [
        {
            id: 1,
            title: t('steps.intensity.title'),
            key: 'intensity',
            options: [
                { label: t('steps.intensity.options.subtle'), icon: Wind, value: 'subtle' },
                { label: t('steps.intensity.options.balanced'), icon: Droplet, value: 'balanced' },
                { label: t('steps.intensity.options.intense'), icon: Zap, value: 'intense' }
            ]
        },
        {
            id: 2,
            title: t('steps.environment.title'),
            key: 'environment',
            options: [
                { label: t('steps.environment.options.outdoor'), icon: Sun, value: 'outdoor' },
                { label: t('steps.environment.options.urban'), icon: Coffee, value: 'urban' },
                { label: t('steps.environment.options.midnight'), icon: Moon, value: 'midnight' }
            ]
        },
        {
            id: 3,
            title: t('steps.emotion.title'),
            key: 'emotion',
            options: [
                { label: t('steps.emotion.options.sophisticated'), value: 'sophisticated' },
                { label: t('steps.emotion.options.playful'), value: 'playful' },
                { label: t('steps.emotion.options.mysterious'), value: 'mysterious' },
                { label: t('steps.emotion.options.vitality'), value: 'vitality' }
            ]
        },
        {
            id: 4,
            title: t('analysis.dna_blueprint'),
            key: 'result',
            options: []
        }
    ];

    return (
        <div className="min-h-screen transition-colors flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-12 flex flex-col items-center justify-center">
                <div className="max-w-4xl w-full">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-20">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center gap-4">
                                <div
                                    className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= s
                                        ? 'bg-gold scale-125 shadow-[0_0_15px_rgba(197,160,89,0.5)]'
                                        : 'bg-stone-400 dark:bg-stone-800'
                                        }`}
                                />
                                {s < 4 && (
                                    <div
                                        className={`w-12 h-px transition-colors ${step > s ? 'bg-gold' : 'bg-stone-400 dark:bg-stone-800'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            {step < 4 ? (
                                <div>
                                    <div className="flex items-center justify-center gap-2 text-gold mb-6">
                                        <Sparkles size={18} />
                                        <span className="text-xs font-bold tracking-[.3em] uppercase italic">
                                            {t('section_prefix')} 0{step}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white mb-16 uppercase tracking-widest">
                                        {currentStepData[step - 1].title}
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {currentStepData[step - 1].options.map((opt, i) => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleNext(currentStepData[step - 1].key, opt.value)}
                                                    className="group p-8 glass bg-white dark:bg-zinc-900 hover:bg-luxury-black dark:hover:bg-gold transition-all duration-500 rounded-3xl border border-stone-200 dark:border-white/10 hover:border-luxury-black dark:hover:border-gold flex flex-col items-center gap-6 cursor-pointer"
                                                >
                                                    {Icon && (
                                                        <div className="p-4 rounded-2xl bg-stone-100 dark:bg-white/5 group-hover:bg-gold/10 transition-colors">
                                                            <Icon
                                                                size={32}
                                                                strokeWidth={1}
                                                                className="text-stone-500 dark:text-stone-600 group-hover:text-gold transition-colors"
                                                            />
                                                        </div>
                                                    )}
                                                    {!Icon && <div className="h-12" />}
                                                    <span className="text-[10px] font-bold tracking-widest uppercase text-luxury-black dark:text-white group-hover:text-white transition-colors">
                                                        {opt.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {step > 1 && (
                                        <button
                                            onClick={() => setStep(step - 1)}
                                            className="mt-12 text-[10px] font-bold tracking-widest uppercase text-stone-600 dark:text-stone-500 hover:text-luxury-black dark:hover:text-white flex items-center gap-2 mx-auto transition-colors"
                                        >
                                            <ArrowLeft size={16} /> {t('prev_step')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto">
                                    {isAnalyzing ? (
                                        <div className="max-w-md mx-auto py-12">
                                            <div className="relative w-24 h-24 mx-auto mb-12">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                                    className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Sparkles className="text-gold animate-pulse" size={32} />
                                                </div>
                                            </div>
                                            <div className="space-y-4 text-left font-mono text-[10px] text-stone-400 uppercase tracking-widest bg-white dark:bg-white/5 p-8 rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm">
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                                    {'>'} {t('analysis.initializing')}
                                                </motion.p>
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                                                    {'>'} {t('analysis.loading')}
                                                </motion.p>
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
                                                    {'>'} {t('analysis.cross_referencing', { intensity: answers.intensity })}
                                                </motion.p>
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
                                                    {'>'} {t('analysis.finalizing')}
                                                </motion.p>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 3.5, ease: 'easeInOut' }}
                                                    className="h-px bg-gold/30 mt-4"
                                                />
                                            </div>
                                            <p className="mt-8 italic text-stone-500 dark:text-stone-400 font-serif">
                                                {t('analysis.calculating')}
                                            </p>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="w-full"
                                        >
                                            <div className="relative aspect-video w-full mb-12 rounded-[3.5rem] overflow-hidden shadow-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10">
                                                <Image
                                                    src="/luxury_ai_scent_lab.png"
                                                    alt="AI Analysis"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/40 to-transparent flex flex-col justify-end p-12 text-left">
                                                    <div className="flex items-center gap-3 text-gold mb-4">
                                                        <Sparkles size={24} />
                                                        <h3 className="text-2xl font-serif text-white uppercase tracking-widest">
                                                            {t('analysis.complete')}
                                                        </h3>
                                                    </div>
                                                    <p className="text-stone-300 text-sm font-light max-w-sm">
                                                        {t('analysis.description')}
                                                    </p>
                                                </div>
                                            </div>

                                            <h2 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white mb-8">
                                                {t.rich('analysis.dna_blueprint', {
                                                    italic: (chunks: React.ReactNode) => <span className="italic">{chunks}</span>
                                                })}
                                            </h2>
                                            <p className="text-stone-500 dark:text-stone-400 mb-12 leading-relaxed uppercase tracking-[.3em] text-[10px] font-bold">
                                                {t('analysis.profile_label')}: {answers.intensity?.toUpperCase()} | {answers.environment?.toUpperCase()} |{' '}
                                                {answers.emotion?.toUpperCase()}
                                            </p>

                                            <div className="flex gap-4 justify-center">
                                                <Link
                                                    href="/dashboard/customer/profile"
                                                    className="px-12 py-5 bg-luxury-black dark:bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase flex items-center gap-4 hover:bg-stone-800 dark:hover:bg-gold/80 transition-all shadow-xl group"
                                                >
                                                    {t('analysis.view_profile')}
                                                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Decorative Elements */}
            <div className="fixed bottom-0 left-0 w-1/3 h-64 bg-gold/5 blur-[120px] pointer-events-none" />
            <div className="fixed top-0 right-0 w-1/3 h-64 bg-gold/5 blur-[120px] pointer-events-none" />
        </div>
    );
}
