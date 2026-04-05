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
        <div className="p-10 space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                <div className="space-y-3">
                    <h1 className="text-6xl font-serif text-foreground italic tracking-normal leading-tight">{t('title')}</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[.6em] font-black opacity-60">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-6 glass p-4 rounded-3xl border-gold/10 shadow-2xl">
                    <div className="text-right px-8 border-r border-border/50">
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 mb-1">{t('stats.total')}</p>
                        <p className="text-3xl font-serif text-gold leading-none">{total.toLocaleString(locale)}</p>
                    </div>
                    <div className="text-right px-8">
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 mb-1">{t('stats.pending_reports')}</p>
                        <p className="text-3xl font-serif text-red-500 leading-none">{reports.length}</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="all" className="space-y-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <TabsList className="bg-foreground/5 dark:bg-white/5 p-1 rounded-full h-14 border border-border/50">
                        <TabsTrigger value="all" className="rounded-full px-10 h-full text-[10px] uppercase font-black tracking-[.2em] data-[state=active]:bg-background data-[state=active]:text-gold data-[state=active]:shadow-xl transition-all">
                            {t('tabs.all')}
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="rounded-full px-10 h-full text-[10px] uppercase font-black tracking-[.2em] data-[state=active]:bg-background data-[state=active]:text-red-500 data-[state=active]:shadow-xl transition-all relative">
                            {t('tabs.reports')}
                            {reports.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-lg animate-pulse">
                                    {reports.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <Input
                                placeholder={t('search_placeholder')}
                                className="pl-12 h-14 rounded-full glass border-border/50 text-[11px] uppercase font-bold tracking-widest focus-visible:ring-gold/30 transition-all focus:scale-[1.02]"
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-14 px-8 rounded-full glass border border-border/50 text-[10px] uppercase font-bold tracking-[.2em] focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all cursor-pointer hover:bg-gold/5"
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                        >
                            <option value="">{t('all_ratings')}</option>
                            {[5, 4, 3, 2, 1].map(star => (
                                <option key={star} value={star}>{tReview('stars', { count: star })}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <TabsContent value="all" className="m-0 border-none">
                    <div className="glass bg-background/50 rounded-[3rem] border border-border/50 overflow-hidden shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-8 duration-700">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/30 bg-foreground/[0.02]">
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
                                                <p className="text-[10px] uppercase tracking-[.5em] font-black text-muted-foreground animate-pulse">{t('messages.curating')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-96 text-center">
                                            <div className="space-y-4">
                                                <Sparkles className="h-10 w-10 mx-auto text-gold opacity-20" />
                                                <p className="font-serif italic text-muted-foreground text-2xl tracking-wide opacity-50">{t('messages.silence')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.map((review: any) => (
                                        <TableRow key={review.id} className="border-border/30 group hover:bg-gold/[0.02] transition-colors duration-500">
                                            <TableCell className="pl-12 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-full glass border-gold/10 flex items-center justify-center font-serif text-lg text-gold overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-700">
                                                        {review.user?.avatarUrl ? (
                                                            <img src={review.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={20} className="opacity-30" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 pt-1">
                                                        <p className="text-base font-bold text-foreground line-clamp-1 tracking-tight">{review.product?.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[.2em] opacity-50">
                                                            {review.user?.fullName || tNotify('anonymous_user')} • {format(new Date(review.createdAt), 'MMM dd, yyyy', { locale: dateLocale })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="flex flex-col gap-2">
                                                    <StarRating rating={review.rating} readOnly size={12} />
                                                    <span className="text-[9px] font-black uppercase text-gold tracking-widest opacity-70">{t('rating_label', { rating: review.rating })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="max-w-md space-y-4">
                                                    <p className="text-sm text-foreground/70 line-clamp-2 italic font-serif leading-relaxed tracking-wide">
                                                        "{review.content || t('messages.no_commentary')}"
                                                    </p>
                                                    {review.images.length > 0 && (
                                                        <div className="flex gap-2">
                                                            {review.images.map((img: any, i: number) => (
                                                                <div key={i} className="w-10 h-10 rounded-xl overflow-hidden border border-border/50 shadow-md hover:scale-110 transition-transform duration-500 cursor-zoom-in" onClick={() => window.open(img.imageUrl, '_blank')}>
                                                                    <img src={img.imageUrl} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="flex flex-wrap gap-2.5">
                                                    {review.isHidden && <Badge className="bg-muted text-muted-foreground border-none rounded-full px-4 py-1 text-[8px] uppercase tracking-widest font-black shadow-sm">{t('status.hidden')}</Badge>}
                                                    {review.isPinned && <Badge className="bg-gold/10 text-gold border-border-gold/20 border rounded-full px-4 py-1 text-[8px] uppercase tracking-widest font-black shadow-sm">{t('status.pinned')}</Badge>}
                                                    {review.isVerified && <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-4 py-1 text-[8px] uppercase tracking-widest font-black shadow-sm">{t('status.verified')}</Badge>}
                                                    {review.flagged && <Badge className="bg-red-500/10 text-red-500 border-none rounded-full px-4 py-1 text-[8px] uppercase tracking-widest font-black shadow-sm animate-pulse">{t('status.flagged')}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-12 py-8 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-12 w-12 p-0 rounded-full hover:bg-gold/10 hover:text-gold transition-all shadow-sm">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-64 rounded-3xl p-3 glass border-gold/10 shadow-2xl backdrop-blur-2xl">
                                                        <DropdownMenuItem onClick={() => handleToggleHide(review)} className="rounded-2xl text-[10px] uppercase font-black tracking-widest py-4 transition-all hover:bg-foreground/5 mb-1 cursor-pointer">
                                                            {review.isHidden ? (
                                                                <><Eye className="mr-4 h-4 w-4 text-emerald-500" /> {t('actions.unhide')}</>
                                                            ) : (
                                                                <><EyeOff className="mr-4 h-4 w-4 opacity-50" /> {t('actions.hide')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTogglePin(review)} className="rounded-2xl text-[10px] uppercase font-black tracking-widest py-4 transition-all hover:bg-gold/5 mb-1 cursor-pointer">
                                                            {review.isPinned ? (
                                                                <><Pin className="mr-4 h-4 w-4 fill-gold text-gold" /> {t('actions.unpin')}</>
                                                            ) : (
                                                                <><Pin className="mr-4 h-4 w-4 text-gold opacity-50" /> {t('actions.pin')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        {!review.flagged && (
                                                            <DropdownMenuItem onClick={() => handleFlag(review.id)} className="rounded-2xl text-[10px] uppercase font-black tracking-widest py-4 transition-all text-red-400 hover:bg-red-500/5 mb-1 cursor-pointer">
                                                                <Flag className="mr-4 h-4 w-4" /> {t('actions.flag')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <div className="h-px bg-border/20 mx-2 my-2" />
                                                        <DropdownMenuItem onClick={() => handleDelete(review.id)} className="rounded-2xl text-[10px] uppercase font-black tracking-widest py-4 transition-all text-red-600 bg-red-500/5 hover:bg-red-600 hover:text-white cursor-pointer group/purge">
                                                            <Trash2 className="mr-4 h-4 w-4 group-hover/purge:rotate-12 transition-transform" /> {t('actions.purge')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="p-8 bg-foreground/[0.02] flex items-center justify-between border-t border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-40">
                                {t('messages.essence_voices')} {skip + 1}-{Math.min(skip + take, total)} / {total}
                            </p>
                            <div className="flex gap-6">
                                <Button
                                    variant="outline"
                                    className="rounded-full px-10 h-12 text-[10px] uppercase font-black tracking-[.3em] border-border/50 hover:border-gold hover:text-gold transition-all"
                                    disabled={skip === 0}
                                    onClick={() => setSkip(Math.max(0, skip - take))}
                                >
                                    {tCommon('previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-full px-10 h-12 text-[10px] uppercase font-black tracking-[.3em] border-border/50 hover:border-gold hover:text-gold transition-all"
                                    disabled={skip + take >= total}
                                    onClick={() => setSkip(skip + take)}
                                >
                                    {tCommon('next')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="m-0 border-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        {reports.length === 0 ? (
                            <div className="col-span-full py-48 text-center glass bg-background/50 rounded-[4rem] border border-dashed border-border/50 shadow-inner">
                                <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500/20 mb-8" />
                                <h3 className="text-4xl font-serif text-foreground italic mb-3 tracking-tight">{t('reports.purity_title')}</h3>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-[.6em] font-black opacity-40">{t('reports.purity_desc')}</p>
                            </div>
                        ) : (
                            reports.map((report: any) => (
                                <div key={report.id} className="glass bg-background/50 rounded-[3.5rem] border border-border/50 p-10 space-y-8 flex flex-col group hover:border-gold/30 hover:scale-[1.02] transition-all duration-700 shadow-xl backdrop-blur-xl">
                                    <header className="flex justify-between items-start">
                                        <div className="flex items-center gap-3 text-red-500 bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 shadow-sm">
                                            <ShieldAlert size={16} className="animate-pulse" />
                                            <span className="text-[10px] uppercase tracking-[.3em] font-black">{t('reports.concern')}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold tracking-widest opacity-40 pt-2">{format(new Date(report.createdAt), 'MMM dd')}</span>
                                    </header>

                                    <div className="space-y-6 flex-1">
                                        <div className="p-8 rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/10 shadow-inner">
                                            <p className="text-[9px] uppercase tracking-[.4em] font-black text-red-500/60 mb-4">{t('reports.reason')}</p>
                                            <p className="text-lg italic font-serif text-foreground/80 leading-relaxed tracking-wide">"{report.reason}"</p>
                                        </div>

                                        <div className="space-y-4 px-4 border-l-2 border-gold/10 ml-2">
                                            <p className="text-[9px] uppercase tracking-[.4em] font-black text-muted-foreground opacity-40">
                                                {t('reports.on_review_by', { name: report.review?.user?.fullName || tNotify('anonymous_user') })}
                                            </p>
                                            <p className="text-sm text-foreground/60 line-clamp-3 italic font-serif leading-relaxed tracking-wide">
                                                "{report.review?.content}"
                                            </p>
                                        </div>
                                    </div>

                                    <footer className="pt-8 border-t border-border/10 flex gap-4">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-14 rounded-full text-[10px] uppercase font-black tracking-[.2em] hover:bg-foreground/5 hover:text-gold transition-all"
                                            onClick={() => handleToggleHide(report.review)}
                                        >
                                            {report.review?.isHidden ? t('actions.unhide') : t('actions.hide')}
                                        </Button>
                                        <Button
                                            className="flex-1 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase font-black tracking-[.2em] shadow-2xl shadow-red-500/30 transition-all active:scale-95"
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
