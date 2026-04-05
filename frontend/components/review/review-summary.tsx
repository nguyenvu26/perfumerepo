'use client';

import React, { useEffect, useState } from 'react';
import { ReviewSummary, reviewService } from '@/services/review.service';
import { Sparkles, ThumbsUp, ThumbsDown, Tag, Loader2, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ReviewSummaryViewProps {
    productId: string;
}

const ReviewSummaryView: React.FC<ReviewSummaryViewProps> = ({ productId }) => {
    const t = useTranslations('review_summary');
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await reviewService.getSummary(productId);
                setSummary(data);
            } catch (error) {
                console.error("Failed to fetch AI summary", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, [productId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass bg-white/50 dark:bg-zinc-900/50 rounded-[3rem] border border-stone-100 dark:border-white/5 animate-pulse">
                <Loader2 className="animate-spin h-6 w-6 text-gold mb-4" />
                <span className="text-[10px] uppercase tracking-[.3em] text-stone-400 font-black">{t('ai_distilling')}</span>
            </div>
        );
    }

    if (!summary) return null;

    const pros = summary.pros?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const cons = summary.cons?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const keywords = summary.keywords?.split(',').map(s => s.trim()).filter(Boolean) || [];

    return (
        <div className="relative overflow-hidden glass bg-stone-50/50 dark:bg-zinc-900/50 rounded-[3rem] border border-stone-100 dark:border-white/5 p-8 md:p-12 space-y-10">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            
            <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gold">
                        <Sparkles size={18} className="fill-gold/20" />
                        <span className="text-[10px] uppercase tracking-[.4em] font-black">{t('ai_powered_insights')}</span>
                    </div>
                    <h3 className="text-3xl font-serif text-luxury-black dark:text-white">{t('what_people_saying')}</h3>
                </div>
                
                {summary.sentiment && (
                    <Badge className={cn(
                        "rounded-full px-6 py-2 text-[10px] uppercase tracking-widest font-black border-none",
                        summary.sentiment === 'POSITIVE' ? "bg-emerald-500/10 text-emerald-600" :
                        summary.sentiment === 'NEGATIVE' ? "bg-red-500/10 text-red-600" : "bg-stone-500/10 text-stone-600"
                    )}>
                        {t('overall_sentiment', { sentiment: summary.sentiment })}
                    </Badge>
                )}
            </header>

            <div className="relative space-y-8">
                <div className="relative">
                    <Quote className="absolute -top-4 -left-6 text-gold/10 w-12 h-12 -z-10" />
                    <p className="text-xl md:text-2xl font-serif text-stone-600 dark:text-stone-300 italic leading-relaxed">
                        {summary.summary}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                    {pros.length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[.3em] flex items-center gap-3 text-emerald-600">
                                <span className="h-px w-8 bg-emerald-600/30" />
                                <ThumbsUp size={14} /> {t('the_allure')}
                            </h4>
                            <ul className="space-y-4">
                                {pros.map((pro, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-150 transition-transform" />
                                        <span className="text-sm font-serif italic text-stone-600 dark:text-stone-400">{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {cons.length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[.3em] flex items-center gap-3 text-red-600/70">
                                <span className="h-px w-8 bg-red-600/20" />
                                <ThumbsDown size={14} /> {t('the_nuance')}
                            </h4>
                            <ul className="space-y-4">
                                {cons.map((con, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 group-hover:scale-150 transition-transform" />
                                        <span className="text-sm font-serif italic text-stone-600 dark:text-stone-400">{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {keywords.length > 0 && (
                <div className="pt-8 border-t border-stone-100 dark:border-white/5">
                    <div className="flex flex-wrap gap-3">
                        <Tag size={14} className="text-gold mt-1 shrink-0" />
                        {keywords.map((word, i) => (
                            <Badge 
                                key={i} 
                                variant="outline" 
                                className="rounded-full border-stone-200 dark:border-white/10 text-[9px] uppercase tracking-widest font-bold py-1.5 px-4 hover:border-gold/50 transition-colors cursor-default"
                            >
                                {word}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewSummaryView;
