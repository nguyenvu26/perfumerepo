'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ExternalLink, Sparkles, Tag, RotateCcw } from 'lucide-react';
import { QuizRecommendation } from '@/services/quiz.service';

interface RecommendationCardsProps {
    recommendations: QuizRecommendation[];
    onRetake: () => void;
}

export function RecommendationCards({ recommendations, onRetake }: RecommendationCardsProps) {
    const t = useTranslations('quiz');

    if (recommendations.length === 0) {
        return (
            <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={32} className="text-gold" />
                </div>
                <h3 className="text-2xl font-serif text-luxury-black dark:text-white mb-3">
                    {t('results.no_results_title')}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
                    {t('results.no_results_desc')}
                </p>
                <button
                    onClick={onRetake}
                    className="px-8 py-3 rounded-full gold-btn-gradient text-sm font-bold tracking-widest uppercase text-white shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow flex items-center gap-2 mx-auto"
                >
                    <RotateCcw size={14} /> {t('results.retake')}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <div className="flex items-center justify-center gap-2 text-gold mb-4">
                    <Sparkles size={18} />
                    <span className="text-[10px] font-bold tracking-[.4em] uppercase">
                        {t('results.ai_picked')}
                    </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-serif text-luxury-black dark:text-white mb-3">
                    {t('results.title')}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
                    {t('results.subtitle')}
                </p>
            </motion.div>

            {/* Recommendation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <motion.a
                        key={rec.productId}
                        href={`/en/products/${rec.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="group relative rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden hover:border-gold/50 hover:shadow-xl hover:shadow-gold/5 transition-all duration-500 cursor-pointer flex flex-col"
                    >
                        {/* Rank Badge */}
                        <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-gold/30">
                            {index + 1}
                        </div>

                        {/* Image */}
                        <div className="relative w-full aspect-square bg-stone-100 dark:bg-white/5 overflow-hidden">
                            {rec.imageUrl ? (
                                <img
                                    src={rec.imageUrl}
                                    alt={rec.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Sparkles size={48} className="text-stone-300 dark:text-stone-700" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                    <ExternalLink size={14} className="text-gold" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                            {/* Brand */}
                            {rec.brand && (
                                <span className="text-[10px] font-bold tracking-[.3em] uppercase text-gold mb-1">
                                    {rec.brand}
                                </span>
                            )}

                            {/* Name */}
                            <h3 className="font-serif text-lg text-luxury-black dark:text-white group-hover:text-gold transition-colors line-clamp-2 mb-2">
                                {rec.name}
                            </h3>

                            {/* AI Reason */}
                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed flex-1 mb-4 line-clamp-3">
                                {rec.reason}
                            </p>

                            {/* Tags */}
                            {rec.tags && rec.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {rec.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-white/10"
                                        >
                                            <Tag size={8} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Price */}
                            <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-lg font-bold text-gold">
                                    {Number(rec.price).toLocaleString()}₫
                                </span>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 group-hover:text-gold transition-colors flex items-center gap-1">
                                    {t('results.view_detail')} <ExternalLink size={10} />
                                </span>
                            </div>
                        </div>
                    </motion.a>
                ))}
            </div>

            {/* Retake Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: recommendations.length * 0.1 + 0.3 }}
                className="flex justify-center mt-12"
            >
                <button
                    onClick={onRetake}
                    className="px-8 py-3.5 rounded-full border border-stone-300 dark:border-white/10 text-xs font-bold tracking-widest uppercase text-stone-600 dark:text-stone-400 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all flex items-center gap-2"
                >
                    <RotateCcw size={14} /> {t('results.retake')}
                </button>
            </motion.div>
        </div>
    );
}
