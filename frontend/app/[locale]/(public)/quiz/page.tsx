'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { QuizForm } from '@/components/quiz/QuizForm';
import { RecommendationCards } from '@/components/quiz/RecommendationCards';
import { quizService, QuizAnswers, QuizRecommendation } from '@/services/quiz.service';

type QuizState = 'intro' | 'quiz' | 'analyzing' | 'results';

export default function QuizPage() {
    const t = useTranslations('quiz');
    const { isAuthenticated } = useAuth();
    const [state, setState] = useState<QuizState>('intro');
    const [recommendations, setRecommendations] = useState<QuizRecommendation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStart = () => {
        setState('quiz');
    };

    const handleSubmit = async (answers: QuizAnswers) => {
        setIsSubmitting(true);
        setError(null);
        setState('analyzing');

        try {
            const result = await quizService.submitQuiz(answers);
            setRecommendations(result.recommendations);
            // Show analyzing animation for at least 3 seconds for UX polish
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setState('results');
        } catch (err: any) {
            console.error('Quiz submission failed:', err);
            setError(err.message || t('error.generic'));
            setState('quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetake = () => {
        setRecommendations([]);
        setError(null);
        setState('quiz');
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors flex flex-col relative overflow-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px]" />
            </div>

            <main className="flex-1 container mx-auto px-4 sm:px-6 py-24 md:py-32 flex flex-col items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {/* ══════════════════════════════════════ */}
                    {/* INTRO STATE */}
                    {/* ══════════════════════════════════════ */}
                    {state === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-2xl mx-auto text-center"
                        >
                            {/* Decorative Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-24 h-24 rounded-3xl bg-gold/10 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold/5"
                            >
                                <Sparkles size={40} className="text-gold" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span className="text-[10px] font-bold tracking-[.4em] uppercase text-gold">
                                    {t('intro.label')}
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-4xl md:text-6xl font-serif text-luxury-black dark:text-white mt-4 mb-6"
                            >
                                {t('intro.title')}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-stone-500 dark:text-stone-400 mb-10 leading-relaxed max-w-lg mx-auto"
                            >
                                {t('intro.description')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-col items-center gap-4"
                            >
                                {isAuthenticated ? (
                                    <button
                                        onClick={handleStart}
                                        className="px-10 py-4 rounded-full gold-btn-gradient text-sm font-bold tracking-[.3em] uppercase text-white shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all flex items-center gap-3 group"
                                    >
                                        {t('intro.start_btn')}
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="px-10 py-4 rounded-full gold-btn-gradient text-sm font-bold tracking-[.3em] uppercase text-white shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all flex items-center gap-3 group"
                                        >
                                            <LogIn size={16} />
                                            {t('intro.login_btn')}
                                        </Link>
                                        <p className="text-xs text-stone-400 dark:text-stone-500">
                                            {t('intro.login_required')}
                                        </p>
                                    </>
                                )}

                                <p className="text-[10px] text-stone-400 dark:text-stone-600 tracking-widest uppercase mt-2">
                                    {t('intro.time_estimate')}
                                </p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════ */}
                    {/* QUIZ FORM STATE */}
                    {/* ══════════════════════════════════════ */}
                    {state === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="max-w-lg mx-auto mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                            <QuizForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════ */}
                    {/* ANALYZING STATE */}
                    {/* ══════════════════════════════════════ */}
                    {state === 'analyzing' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-md mx-auto text-center py-12"
                        >
                            {/* Spinning Loader */}
                            <div className="relative w-28 h-28 mx-auto mb-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                    className="absolute inset-2 border border-gold/30 border-b-transparent rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="text-gold animate-pulse" size={32} />
                                </div>
                            </div>

                            {/* Terminal-style Analysis */}
                            <div className="space-y-3 text-left font-mono text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                    {'>'} {t('analyzing.step1')}
                                </motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                                    {'>'} {t('analyzing.step2')}
                                </motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                                    {'>'} {t('analyzing.step3')}
                                </motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
                                    {'>'} {t('analyzing.step4')}
                                </motion.p>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2.8, ease: 'easeInOut' }}
                                    className="h-px bg-gold/30 mt-3"
                                />
                            </div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 }}
                                className="mt-8 italic text-stone-400 dark:text-stone-500 font-serif"
                            >
                                {t('analyzing.message')}
                            </motion.p>
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════ */}
                    {/* RESULTS STATE */}
                    {/* ══════════════════════════════════════ */}
                    {state === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            <RecommendationCards
                                recommendations={recommendations}
                                onRetake={handleRetake}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
