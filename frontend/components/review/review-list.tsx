'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Review, reviewService } from '@/services/review.service';
import StarRating from './star-rating';
import { ThumbsUp, Flag, CheckCircle2, Loader2, Filter, SortAsc, ChevronDown, User, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface ReviewListProps {
    productId: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
    const t = useTranslations('review');
    const tCommon = useTranslations('common');
    const tNotify = useTranslations('notifications');
    const locale = useLocale();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');

    const take = 10;

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const res = await reviewService.getByProduct(productId, skip, take);
            setReviews(res.items);
            setTotal(res.total);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId, skip]);

    const stats = useMemo(() => {
        if (reviews.length === 0) return { avg: 0, distribution: [0, 0, 0, 0, 0] };
        const distribution = [0, 0, 0, 0, 0];
        let sum = 0;
        reviews.forEach(r => {
            sum += r.rating;
            distribution[r.rating - 1]++;
        });
        return {
            avg: (sum / reviews.length).toFixed(1),
            distribution: distribution.reverse() // 5 to 1
        };
    }, [reviews]);

    const handleReact = async (reviewId: string) => {
        try {
            await reviewService.react(reviewId, 'HELPFUL');
            toast.success(tNotify('helpful_success'));
            setReviews(prev => prev.map(r =>
                r.id === reviewId
                    ? { ...r, _count: { reactions: (r._count?.reactions || 0) + 1 } }
                    : r
            ));
        } catch (error: any) {
            toast.error(error.message || tNotify('failed_to_react'));
        }
    };

    const handleReport = async (reviewId: string) => {
        const reason = window.prompt(t('reason_reporting'));
        if (!reason) return;

        try {
            await reviewService.report(reviewId, reason);
            toast.success(tNotify('report_success'));
        } catch (error: any) {
            toast.error(error.message || tNotify('error'));
        }
    };

    const filteredReviews = useMemo(() => {
        let result = [...reviews];
        if (ratingFilter) {
            result = result.filter(r => r.rating === ratingFilter);
        }

        switch (sortBy) {
            case 'highest': result.sort((a, b) => b.rating - a.rating); break;
            case 'lowest': result.sort((a, b) => a.rating - b.rating); break;
            case 'helpful': result.sort((a, b) => (b._count?.reactions || 0) - (a._count?.reactions || 0)); break;
            default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return result;
    }, [reviews, ratingFilter, sortBy]);

    if (isLoading && reviews.length === 0) {
        return (
            <div className="flex justify-center py-32">
                <Loader2 className="animate-spin h-12 w-12 text-gold opacity-50" />
            </div>
        );
    }

    return (
        <div className="space-y-20">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center border-b border-border/50 pb-20">
                <div className="text-center lg:text-left space-y-6">
                    <h2 className="text-5xl font-serif text-foreground italic tracking-tight">{t('customer_reviews')}</h2>
                    <div className="flex items-center justify-center lg:justify-start gap-8 px-6 lg:px-0">
                        <span className="text-7xl font-serif text-gold leading-none">{stats.avg}</span>
                        <div className="space-y-2 pt-1">
                            <StarRating rating={Number(stats.avg)} readOnly size={20} />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold">
                                {t('based_on_count', { total })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4 max-w-xl mx-auto lg:ml-auto w-full glass p-8 rounded-[2rem] border-gold/10">
                    {stats.distribution.map((count, i) => {
                        const starNum = 5 - i;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                            <div key={starNum} className="flex items-center gap-6 text-[10px]">
                                <span className="w-20 text-muted-foreground font-bold uppercase tracking-widest">{t('stars', { count: starNum })}</span>
                                <Progress value={percentage} className="h-1.5 bg-foreground/5" indicatorClassName="bg-gold shadow-[0_0_10px_rgba(197,160,89,0.3)]" />
                                <span className="w-10 text-right text-muted-foreground font-bold opacity-60">{Math.round(percentage)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-foreground/[0.02] dark:bg-white/[0.02] p-4 rounded-full border border-border/50">
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full h-12 px-6 text-[10px] uppercase font-bold tracking-[.3em] hover:bg-gold/10 hover:text-gold transition-all">
                                <Filter size={14} className="mr-3" />
                                {ratingFilter ? t('stars', { count: ratingFilter }) : t('all_ratings')}
                                <ChevronDown size={14} className="ml-3 opacity-30" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 rounded-2xl p-2 glass border-gold/10 shadow-2xl">
                            <DropdownMenuItem onClick={() => setRatingFilter(null)} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">{t('all_ratings')}</DropdownMenuItem>
                            {[5, 4, 3, 2, 1].map(num => (
                                <DropdownMenuItem key={num} onClick={() => setRatingFilter(num)} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">
                                    {t('stars', { count: num })}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full h-12 px-6 text-[10px] uppercase font-bold tracking-[.3em] hover:bg-gold/10 hover:text-gold transition-all">
                                <SortAsc size={14} className="mr-3" />
                                {t('sort_label', { sortBy: t(`sort_${sortBy}`) })}
                                <ChevronDown size={14} className="ml-3 opacity-30" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-2xl p-2 glass border-gold/10 shadow-2xl">
                            <DropdownMenuItem onClick={() => setSortBy('newest')} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">{t('sort_newest')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('highest')} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">{t('sort_highest')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('lowest')} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">{t('sort_lowest')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('helpful')} className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">{t('sort_helpful')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {ratingFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRatingFilter(null)}
                        className="text-[10px] uppercase font-bold tracking-[.4em] text-muted-foreground hover:text-gold mr-4"
                    >
                        {tCommon('clear_filters')}
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="space-y-16">
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-32 border border-dashed border-border rounded-[3rem] glass bg-gold/5">
                        <Sparkles size={32} className="mx-auto text-gold/20 mb-6" />
                        <p className="text-muted-foreground font-serif italic text-xl opacity-60 tracking-wide">{t('no_reviews_match')}</p>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div key={review.id} className="group animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full glass border-gold/10 flex items-center justify-center font-serif text-2xl text-gold overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-700">
                                            {review.user.avatarUrl ? (
                                                <img src={review.user.avatarUrl} alt={review.user.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} className="opacity-40" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-lg leading-tight tracking-tight">
                                                {review.user.fullName || tNotify('anonymous_user')}
                                            </p>
                                            {review.isVerified && (
                                                <p className="text-[8px] text-gold uppercase tracking-[.5em] font-black flex items-center gap-1.5 mt-2 bg-gold/5 w-fit px-2 py-1 rounded-full border border-gold/10 shadow-sm">
                                                    <CheckCircle2 size={10} className="fill-gold text-white" /> {t('verified_customer')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[.5em] font-bold opacity-40 ml-1">
                                        {format(new Date(review.createdAt), 'MMMM d, yyyy', { locale: locale === 'vi' ? vi : enUS })}
                                    </p>
                                </div>

                                <div className="lg:col-span-3 space-y-6 lg:pl-12 lg:border-l border-border/30">
                                    <div className="flex items-center gap-1">
                                        <StarRating rating={review.rating} readOnly size={16} />
                                    </div>

                                    {review.content && (
                                        <p className="text-foreground/80 leading-[1.8] font-serif text-xl italic tracking-wide">
                                            "{review.content}"
                                        </p>
                                    )}

                                    {review.images.length > 0 && (
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {review.images.map((img) => (
                                                <div key={img.id} className="relative w-32 h-32 rounded-3xl overflow-hidden border border-border group-hover:border-gold/30 transition-all cursor-zoom-in shadow-lg hover:scale-95 duration-500" onClick={() => window.open(img.imageUrl, '_blank')}>
                                                    <img
                                                        src={img.imageUrl}
                                                        alt="review"
                                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-[1.5s] ease-out"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-10 pt-8 border-t border-border/20">
                                        <button
                                            onClick={() => handleReact(review.id)}
                                            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.4em] text-muted-foreground hover:text-gold transition-all duration-500 hover:tracking-[.6em]"
                                        >
                                            <ThumbsUp size={16} className={review._count?.reactions ? 'fill-gold text-gold scale-110' : 'group-hover:scale-110 transition-transform'} />
                                            {t('helpful_count', { count: review._count?.reactions || 0 })}
                                        </button>
                                        <button
                                            onClick={() => handleReport(review.id)}
                                            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.4em] text-muted-foreground/60 hover:text-red-500 transition-all duration-500 hover:tracking-[.6em]"
                                        >
                                            <Flag size={16} />
                                            {t('report')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {total > take && (
                <div className="flex items-center justify-between pt-16 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[.5em] font-bold opacity-50">
                        {t('showing_count', {
                            start: skip + 1,
                            end: Math.min(skip + take, total),
                            total
                        })}
                    </p>
                    <div className="flex gap-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-12 px-10 text-[10px] uppercase font-bold tracking-[.4em] border-border hover:border-gold hover:text-gold transition-all"
                            disabled={skip === 0}
                            onClick={() => setSkip(Math.max(0, skip - take))}
                        >
                            {tCommon('previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-12 px-10 text-[10px] uppercase font-bold tracking-[.4em] border-border hover:border-gold hover:text-gold transition-all"
                            disabled={skip + take >= total}
                            onClick={() => setSkip(skip + take)}
                        >
                            {tCommon('next')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewList;
