'use client';

import React, { useEffect, useState } from 'react';
import { reviewService, Review } from '@/services/review.service';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MoreHorizontal, Eye, EyeOff, Pin, Trash2, Flag,
    Star, MessageSquare, AlertCircle, CheckCircle2,
    Filter, Search, ArrowRight, ShieldAlert, Loader2, Sparkles, User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import StarRating from '@/components/review/star-rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

export default function AdminReviewsPage() {
    const t = useTranslations('dashboard.admin.reviews');
    const tNotify = useTranslations('notifications');
    const tReview = useTranslations('review');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const dateLocale = locale === 'vi' ? vi : enUS;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<string>('');
    const [searchProduct, setSearchProduct] = useState<string>('');

    const take = 10;

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const data = await reviewService.adminList({
                skip,
                take,
                rating: ratingFilter ? parseInt(ratingFilter) : undefined
            });
            setReviews(data.items);
            setTotal(data.total);
        } catch (error) {
            toast.error(tNotify('action_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const data = await reviewService.adminGetReports();
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchReports();
    }, [skip, ratingFilter]);

    const handleToggleHide = async (review: Review) => {
        try {
            if (review.isHidden) {
                await reviewService.adminShow(review.id);
                toast.success(tNotify('review_visible'));
            } else {
                await reviewService.adminHide(review.id);
                toast.success(tNotify('review_hidden'));
            }
            fetchReviews();
        } catch (error) {
            toast.error(tNotify('action_failed'));
        }
    };

    const handleTogglePin = async (review: Review) => {
        try {
            if (review.isPinned) {
                await reviewService.adminUnpin(review.id);
                toast.success(tNotify('review_unpinned'));
            } else {
                await reviewService.adminPin(review.id);
                toast.success(tNotify('review_pinned'));
            }
            fetchReviews();
        } catch (error) {
            toast.error(tNotify('action_failed'));
        }
    };

    const handleFlag = async (reviewId: string) => {
        try {
            await reviewService.adminFlag(reviewId);
            toast.success(tNotify('review_flagged'));
            fetchReviews();
        } catch (error) {
            toast.error(tNotify('action_failed'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('messages.confirm_purge'))) return;
        try {
            await reviewService.adminDelete(id);
            toast.success(tNotify('review_purged'));
            fetchReviews();
            fetchReports();
        } catch (error) {
            toast.error(tNotify('action_failed'));
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 sm:gap-8">
                <div className="space-y-2 sm:space-y-3">
                    <h1 className="text-4xl sm:text-6xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 bg-secondary/10 dark:bg-black/20 p-4 sm:p-5 rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-sm">
                    <div className="text-right px-4 sm:px-8 border-r border-border/50">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 mb-1">{t('stats.total')}</p>
                        <p className="text-xl sm:text-3xl font-serif text-gold leading-none italic">{total.toLocaleString(locale)}</p>
                    </div>
                    <div className="text-right px-4 sm:px-8">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 mb-1">{t('stats.pending_reports')}</p>
                        <p className="text-xl sm:text-3xl font-serif text-red-500 leading-none italic">{reports.length}</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="all" className="space-y-8 md:space-y-10">
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 sm:gap-8">
                    <TabsList className="bg-secondary/10 dark:bg-white/5 p-1 rounded-2xl sm:rounded-full h-12 sm:h-14 border border-stone-200 dark:border-white/5 flex w-full lg:w-auto">
                        <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-xl sm:rounded-full px-6 sm:px-10 h-full text-[9px] sm:text-[10px] uppercase font-black tracking-[.2em] data-[state=active]:bg-background data-[state=active]:text-gold data-[state=active]:shadow-lg transition-all">
                            {t('tabs.all')}
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="flex-1 sm:flex-none rounded-xl sm:rounded-full px-6 sm:px-10 h-full text-[9px] sm:text-[10px] uppercase font-black tracking-[.2em] data-[state=active]:bg-background data-[state=active]:text-red-500 data-[state=active]:shadow-lg transition-all relative">
                            {t('tabs.reports')}
                            {reports.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] text-white font-bold shadow-lg animate-pulse">
                                    {reports.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <Input
                                placeholder={t('search_placeholder')}
                                className="pl-14 h-12 sm:h-14 rounded-2xl sm:rounded-full bg-secondary/10 border border-stone-200 dark:border-white/5 text-[16px] sm:text-[11px] uppercase font-bold tracking-widest focus-visible:ring-gold/30 transition-all focus:scale-[1.01] shadow-sm"
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <select
                                className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl sm:rounded-full bg-secondary/10 border border-stone-200 dark:border-white/5 text-[16px] sm:text-[10px] uppercase font-bold tracking-[.2em] focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all cursor-pointer hover:bg-gold/5 shadow-sm appearance-none"
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                            >
                                <option value="">{t('all_ratings')}</option>
                                {[5, 4, 3, 2, 1].map(star => (
                                    <option key={star} value={star}>{tReview('stars', { count: star })}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Star size={10} className="text-gold" />
                            </div>
                        </div>
                    </div>
                </div>

                <TabsContent value="all" className="m-0 border-none">
                    {/* DESKTOP TABLE */}
                    <div className="hidden lg:block glass bg-background/50 rounded-[3rem] border border-stone-200 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-8 duration-700">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/30 bg-secondary/10">
                                    <TableHead className="pl-12 text-[10px] uppercase tracking-[.3em] font-black py-8 opacity-50">{t('table.customer_product')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-[.3em] font-black py-8 opacity-50">{t('table.impression')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-[.3em] font-black py-8 opacity-50">{t('table.feedback')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-[.3em] font-black py-8 opacity-50">{t('table.status')}</TableHead>
                                    <TableHead className="pr-12 text-right text-[10px] uppercase tracking-[.3em] font-black py-8 opacity-50">{t('table.action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-96 text-center">
                                            <div className="space-y-6">
                                                <Loader2 className="h-12 w-12 animate-spin mx-auto text-gold opacity-50" />
                                                <p className="text-[10px] uppercase tracking-[.5em] font-black text-muted-foreground animate-pulse leading-none italic">{t('messages.curating')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-96 text-center">
                                            <div className="space-y-6 opacity-30">
                                                <Sparkles className="h-12 w-12 mx-auto text-gold" strokeWidth={0.5} />
                                                <p className="font-heading uppercase text-xl sm:text-2xl tracking-[.2em] italic">{t('messages.silence')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.map((review: any) => (
                                        <TableRow key={review.id} className="border-border/30 group hover:bg-gold/[0.03] transition-all duration-500 border-b border-border/10">
                                            <TableCell className="pl-12 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-full glass border border-gold/10 flex items-center justify-center font-serif text-lg text-gold overflow-hidden shadow-lg group-hover:scale-105 transition-all duration-700 relative">
                                                        {review.user?.avatarUrl ? (
                                                            <Image 
                                                                src={review.user.avatarUrl} 
                                                                alt="" 
                                                                fill
                                                                sizes="56px"
                                                                className="object-cover" 
                                                            />
                                                        ) : (
                                                            <User size={22} className="opacity-30" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 pt-1">
                                                        <p className="text-base font-heading uppercase text-foreground line-clamp-1 tracking-tight group-hover:text-gold transition-colors">{review.product?.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[.2em] opacity-60 italic">
                                                            {review.user?.fullName || tNotify('anonymous_user')} • {format(new Date(review.createdAt), 'MMM dd, yyyy', { locale: dateLocale })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-10">
                                                <div className="flex flex-col gap-2.5">
                                                    <StarRating rating={review.rating} readOnly size={12} />
                                                    <span className="text-[9px] font-black uppercase text-gold tracking-widest opacity-80 italic">{t('rating_label', { rating: review.rating })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-10">
                                                <div className="max-w-md space-y-5">
                                                    <p className="text-sm text-foreground/70 line-clamp-2 italic font-serif leading-relaxed tracking-wide group-hover:text-foreground transition-colors">
                                                        "{review.content || t('messages.no_commentary')}"
                                                    </p>
                                                    {review.images.length > 0 && (
                                                        <div className="flex gap-2.5">
                                                            {review.images.map((img: any, i: number) => (
                                                                <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border border-border/50 shadow-md hover:scale-110 transition-transform duration-500 cursor-zoom-in group/img relative" onClick={() => window.open(img.imageUrl, '_blank')}>
                                                                    <Image 
                                                                        src={img.imageUrl} 
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-cover grayscale group-hover/img:grayscale-0 transition-all duration-700" 
                                                                        alt="" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-10">
                                                <div className="flex flex-wrap gap-2.5">
                                                    {review.isHidden && <Badge className="bg-stone-500/10 text-stone-400 border border-stone-200 rounded-full px-4 py-1.5 text-[8px] uppercase tracking-widest font-black">{t('status.hidden')}</Badge>}
                                                    {review.isPinned && <Badge className="bg-gold/10 text-gold border border-gold/20 rounded-full px-4 py-1.5 text-[8px] uppercase tracking-widest font-black shadow-sm">{t('status.pinned')}</Badge>}
                                                    {review.isVerified && <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full px-4 py-1.5 text-[8px] uppercase tracking-widest font-black">{t('status.verified')}</Badge>}
                                                    {review.flagged && <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-4 py-1.5 text-[8px] uppercase tracking-widest font-black animate-pulse">{t('status.flagged')}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-12 py-10 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-gold/10 hover:text-gold transition-all active:scale-95">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-4 glass border border-stone-200 dark:border-white/10 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-300">
                                                        <DropdownMenuItem onClick={() => handleToggleHide(review)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4 transition-all hover:bg-stone-100 dark:hover:bg-white/5 mb-1 cursor-pointer">
                                                            {review.isHidden ? (
                                                                <><Eye className="mr-4 h-4 w-4 text-emerald-500" /> {t('actions.unhide')}</>
                                                            ) : (
                                                                <><EyeOff className="mr-4 h-4 w-4 opacity-50" /> {t('actions.hide')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTogglePin(review)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4 transition-all hover:bg-gold/5 mb-1 cursor-pointer">
                                                            {review.isPinned ? (
                                                                <><Pin className="mr-4 h-4 w-4 fill-gold text-gold" /> {t('actions.unpin')}</>
                                                            ) : (
                                                                <><Pin className="mr-4 h-4 w-4 text-gold opacity-50" /> {t('actions.pin')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        {!review.flagged && (
                                                            <DropdownMenuItem onClick={() => handleFlag(review.id)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4 transition-all text-red-400 hover:bg-red-500/5 mb-1 cursor-pointer">
                                                                <Flag className="mr-4 h-4 w-4" /> {t('actions.flag')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <div className="h-px bg-border/20 mx-2 my-3" />
                                                        <DropdownMenuItem onClick={() => handleDelete(review.id)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4 transition-all text-red-600 bg-red-500/5 hover:bg-red-600 hover:text-white cursor-pointer group/purge italic">
                                                            <Trash2 className="mr-4 h-4 w-4 group-hover/purge:rotate-6 transition-transform" /> {t('actions.purge')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="p-6 sm:p-10 bg-secondary/10 flex flex-col sm:flex-row items-center justify-between border-t border-border/10 gap-8">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-40 text-center sm:text-left italic leading-none">
                                {t('messages.essence_voices')} {skip + 1}-{Math.min(skip + take, total)} / {total}
                            </p>
                            <div className="flex gap-4 sm:gap-6 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none rounded-full px-10 h-14 text-[10px] uppercase font-black tracking-[.3em] border-stone-200 dark:border-white/10 hover:border-gold hover:text-gold transition-all shadow-sm active:scale-95"
                                    disabled={skip === 0}
                                    onClick={() => setSkip(Math.max(0, skip - take))}
                                >
                                    {tCommon('previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none rounded-full px-10 h-14 text-[10px] uppercase font-black tracking-[.3em] border-stone-200 dark:border-white/10 hover:border-gold hover:text-gold transition-all shadow-sm active:scale-95"
                                    disabled={skip + take >= total}
                                    onClick={() => setSkip(skip + take)}
                                >
                                    {tCommon('next')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE CARD LIST */}
                    <div className="lg:hidden space-y-6">
                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-gold opacity-40" />
                                <p className="text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground opacity-40 italic">{t('messages.curating')}</p>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="py-32 flex flex-col items-center gap-6 opacity-30 text-center px-8">
                                <Sparkles className="h-16 w-16 mx-auto text-gold" strokeWidth={0.5} />
                                <p className="font-heading uppercase text-xl tracking-[.1em] italic leading-tight">{t('messages.silence')}</p>
                            </div>
                        ) : (
                            reviews.map((review: any) => (
                                <div key={review.id} className="glass border border-stone-200 dark:border-white/10 rounded-[2.5rem] p-6 space-y-6 group active:scale-[0.98] transition-all shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full glass border border-gold/10 overflow-hidden shrink-0 relative">
                                                {review.user?.avatarUrl ? (
                                                    <Image 
                                                        src={review.user.avatarUrl} 
                                                        alt="" 
                                                        fill
                                                        sizes="48px"
                                                        className="object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gold/30">
                                                       <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                                                    {review.user?.fullName || tNotify('anonymous_user')}
                                                </p>
                                                <p className="text-[9px] font-mono opacity-40">{format(new Date(review.createdAt), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-secondary/20">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-4 glass border border-stone-200 dark:border-white/10 shadow-2xl backdrop-blur-3xl">
                                                <DropdownMenuItem onClick={() => handleToggleHide(review)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4">
                                                    {review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTogglePin(review)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4">
                                                    {review.isPinned ? 'Bỏ ghim' : 'Ghim đánh giá'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(review.id)} className="rounded-xl text-[10px] uppercase font-black tracking-widest py-4 text-red-500">
                                                    {t('actions.purge')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-heading uppercase text-foreground leading-tight tracking-tight">{review.product?.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <StarRating rating={review.rating} readOnly size={10} />
                                            <span className="text-[8px] font-black uppercase text-gold tracking-widest opacity-80">{t('rating_label', { rating: review.rating })}</span>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/10 dark:bg-white/[0.02] p-5 rounded-[1.5rem] border border-border/5 space-y-4">
                                        <p className="text-xs italic font-serif leading-relaxed text-foreground/80">"{review.content || t('messages.no_commentary')}"</p>
                                        {review.images.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                {review.images.map((img: any, i: number) => (
                                                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-border/30 shrink-0 relative">
                                                        <Image 
                                                            src={img.imageUrl} 
                                                            fill
                                                            sizes="64px"
                                                            className="object-cover grayscale" 
                                                            alt="" 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {review.isHidden && <Badge className="bg-stone-500/10 text-[7px] px-3 py-1 rounded-full uppercase font-black italic">{t('status.hidden')}</Badge>}
                                        {review.isPinned && <Badge className="bg-gold/10 text-gold text-[7px] px-3 py-1 rounded-full uppercase font-black shadow-sm">{t('status.pinned')}</Badge>}
                                        {review.isVerified && <Badge className="bg-emerald-500/10 text-emerald-500 text-[7px] px-3 py-1 rounded-full uppercase font-black">{t('status.verified')}</Badge>}
                                        {review.flagged && <Badge className="bg-red-500/10 text-red-500 text-[7px] px-3 py-1 rounded-full uppercase font-black animate-pulse">{t('status.flagged')}</Badge>}
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl h-12 text-[9px] uppercase font-black tracking-widest border-stone-200 dark:border-white/10"
                                disabled={skip === 0}
                                onClick={() => setSkip(Math.max(0, skip - take))}
                            >
                                {tCommon('previous')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl h-12 text-[9px] uppercase font-black tracking-widest border-stone-200 dark:border-white/10"
                                disabled={skip + take >= total}
                                onClick={() => setSkip(skip + take)}
                            >
                                {tCommon('next')}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="m-0 border-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        {reports.length === 0 ? (
                            <div className="col-span-full py-40 sm:py-48 text-center glass bg-background/50 rounded-[2.5rem] sm:rounded-[4rem] border border-dashed border-stone-200 dark:border-white/10 shadow-inner px-8">
                                <CheckCircle2 className="mx-auto h-16 sm:h-20 w-16 sm:w-20 text-emerald-500/20 mb-8" />
                                <h3 className="text-3xl sm:text-4xl font-heading uppercase tracking-tighter italic text-foreground mb-3">{t('reports.purity_title')}</h3>
                                <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.5em] font-black opacity-40 leading-relaxed italic">{t('reports.purity_desc')}</p>
                            </div>
                        ) : (
                            reports.map((report: any) => (
                                <div key={report.id} className="glass bg-white dark:bg-black/20 rounded-[2.5rem] sm:rounded-[3.5rem] border border-stone-200 dark:border-white/10 p-8 sm:p-10 space-y-6 sm:space-y-8 flex flex-col group hover:border-gold/30 hover:scale-[1.01] transition-all duration-700 shadow-xl backdrop-blur-xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] pointer-events-none" />

                                    <header className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-3 text-red-500 bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 shadow-sm">
                                            <ShieldAlert size={14} className="animate-pulse shrink-0" />
                                            <span className="text-[9px] uppercase tracking-[.2em] font-black leading-none">{t('reports.concern')}</span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground font-black tracking-widest opacity-40 pt-1 leading-none italic">{format(new Date(report.createdAt), 'MMM dd')}</span>
                                    </header>

                                    <div className="space-y-6 flex-1 relative z-10">
                                        <div className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/10 shadow-inner">
                                            <p className="text-[8px] uppercase tracking-[.4em] font-black text-red-500/60 mb-4 italic leading-none">{t('reports.reason')}</p>
                                            <p className="text-base sm:text-lg italic font-serif text-foreground/80 leading-relaxed tracking-wide">"{report.reason}"</p>
                                        </div>

                                        <div className="space-y-4 px-4 border-l border-gold/20 ml-1">
                                            <p className="text-[8px] uppercase tracking-[.4em] font-black text-muted-foreground opacity-50 italic leading-none">
                                                {t('reports.on_review_by', { name: report.review?.user?.fullName || tNotify('anonymous_user') })}
                                            </p>
                                            <p className="text-xs sm:text-sm text-foreground/60 line-clamp-3 italic font-serif leading-relaxed tracking-wide">
                                                "{report.review?.content}"
                                            </p>
                                        </div>
                                    </div>

                                    <footer className="pt-8 border-t border-border/10 flex gap-4 relative z-10">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-12 sm:h-14 rounded-2xl text-[9px] uppercase font-black tracking-[.2em] hover:bg-stone-100 dark:hover:bg-white/5 hover:text-gold transition-all active:scale-95"
                                            onClick={() => handleToggleHide(report.review)}
                                        >
                                            {report.review?.isHidden ? t('actions.unhide') : t('actions.hide')}
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 sm:h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-[9px] uppercase font-black tracking-[.2em] shadow-xl shadow-red-500/20 transition-all active:scale-95 border-none"
                                            onClick={() => handleDelete(report.reviewId)}
                                        >
                                            {t('actions.purge')}
                                        </Button>
                                    </footer>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    );
}
