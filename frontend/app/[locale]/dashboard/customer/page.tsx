'use client';

import { useEffect, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Coins, Inbox, Loader2, MapPinned, Sparkles, Tag, User, Zap } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Link } from '@/lib/i18n';
import { loyaltyService } from '@/services/loyalty.service';
import { promotionService } from '@/services/promotion.service';
import { quizService, type QuizRecommendation } from '@/services/quiz.service';

interface LatestQuizResult {
    id: string;
    createdAt: string;
    recommendation?: QuizRecommendation[];
    recommendations?: QuizRecommendation[];
    gender?: string;
    occasion?: string;
    preferredFamily?: string;
    longevity?: string;
    analysis?: string;
}

export default function CustomerDashboard() {
    const t = useTranslations('dashboard.customer.home');
    const locale = useLocale();
    const format = useFormatter();

    const [points, setPoints] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [quizLoading, setQuizLoading] = useState(true);
    const [offersLoading, setOffersLoading] = useState(true);
    const [latestQuiz, setLatestQuiz] = useState<LatestQuizResult | null>(null);
    const [offersCount, setOffersCount] = useState(0);

    useEffect(() => {
        loyaltyService.getStatus()
            .then((data) => setPoints(data.points))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        quizService.getHistory()
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setLatestQuiz(data[0]);
                }
            })
            .catch(console.error)
            .finally(() => setQuizLoading(false));
    }, []);

    useEffect(() => {
        Promise.all([
            promotionService.getPublic(),
            promotionService.getRedeemable(),
        ])
            .then(([publicPromotions, redeemablePromotions]) => {
                setOffersCount(publicPromotions.length + redeemablePromotions.length);
            })
            .catch(console.error)
            .finally(() => setOffersLoading(false));
    }, []);

    const latestRecommendations = latestQuiz?.recommendation ?? latestQuiz?.recommendations ?? [];
    const featuredRecommendation = latestRecommendations[0];

    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="mx-auto max-w-7xl p-4 sm:p-8">
                <header className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-12 md:flex-row md:items-end">
                    <div>
                        <h1 className="mb-2 text-3xl font-heading uppercase tracking-tighter gold-gradient md:text-4xl">{t('title')}</h1>
                        <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground md:text-sm">{t('subtitle')}</p>
                    </div>

                    <div className="flex w-full gap-4 md:w-auto">
                        <div className="glass flex flex-1 items-center gap-2 rounded-2xl border-gold/10 px-4 py-2 md:flex-none md:gap-3 md:px-6 md:py-3">
                            {loading ? (
                                <Loader2 size={14} className="animate-spin text-gold" />
                            ) : (
                                <Coins size={14} className="text-gold" />
                            )}
                            <div className="text-left">
                                <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground md:text-[8px]">{t('credits_label')}</p>
                                <p className="font-heading text-[10px] text-foreground md:text-xs">
                                    {loading ? '---' : format.number(points ?? 0)} {t('credits_suffix')}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mb-12 grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                    <div className="glass rounded-[2.5rem] bg-gradient-to-br from-gold/20 via-transparent to-gold/5 p-1 md:rounded-[3rem] lg:col-span-2">
                        <div className="flex h-full flex-col gap-6 rounded-[2.4rem] bg-background/40 p-6 backdrop-blur-3xl md:rounded-[2.9rem] md:flex-row md:gap-10 md:p-10">
                            <div className="glass relative flex min-h-[200px] w-full items-center justify-center overflow-hidden rounded-[2rem] border-gold/10 aspect-square md:w-1/2 md:aspect-auto md:rounded-[2.5rem]">
                                {quizLoading ? (
                                    <>
                                        <div className="absolute inset-0 bg-[url('/hero-bottle.png')] bg-cover bg-center opacity-10" />
                                        <div className="relative z-10 text-center">
                                            <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-gold md:h-8 md:w-8" />
                                            <span className="font-heading text-[8px] uppercase tracking-[0.4em] text-gold md:text-[10px]">{t('analyzing')}</span>
                                        </div>
                                    </>
                                ) : featuredRecommendation ? (
                                    <>
                                        {featuredRecommendation.imageUrl ? (
                                            <img
                                                src={featuredRecommendation.imageUrl}
                                                alt={featuredRecommendation.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-[url('/hero-bottle.png')] bg-cover bg-center opacity-10" />
                                                <Sparkles className="relative z-10 h-6 w-6 text-gold md:h-8 md:w-8" />
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-[url('/hero-bottle.png')] bg-cover bg-center opacity-10" />
                                        <div className="relative z-10 text-center">
                                            <Sparkles className="mx-auto mb-4 h-6 w-6 animate-pulse text-gold md:h-8 md:w-8" />
                                            <span className="font-heading text-[8px] uppercase tracking-[0.4em] text-gold md:text-[10px]">{t('analyzing')}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col justify-center text-center md:text-left">
                                {featuredRecommendation ? (
                                    <>
                                        <p className="mb-2 font-heading text-[8px] uppercase tracking-[0.4em] text-gold md:text-[10px]">
                                            {locale === 'vi' ? 'Đã cập nhật' : 'Updated'}
                                        </p>
                                        <h2 className="mb-3 text-xl font-heading uppercase leading-tight tracking-widest text-foreground md:mb-4 md:text-2xl">
                                            {featuredRecommendation.name}
                                        </h2>
                                        <div className="mb-4 flex flex-wrap justify-center gap-2 md:mb-6 md:justify-start">
                                            <span className="rounded-full bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold">
                                                {latestRecommendations.length} {locale === 'vi' ? 'Gợi ý' : 'Recommendations'}
                                            </span>
                                            {latestQuiz?.preferredFamily ? (
                                                <span className="rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {latestQuiz.preferredFamily}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mb-6 line-clamp-3 font-body text-[11px] leading-relaxed text-muted-foreground md:mb-8 md:text-sm">
                                            {featuredRecommendation.reason || latestQuiz?.analysis || t('evolving_desc')}
                                        </p>
                                        <div className="flex justify-center md:justify-start">
                                            <Link
                                                href="/quiz"
                                                className="rounded-full border border-border px-8 py-3.5 text-center font-heading text-[10px] font-bold uppercase tracking-widest text-foreground transition-all hover:border-gold/30 hover:text-gold"
                                            >
                                                {locale === 'vi' ? 'Xem kết quả' : 'View Results'}
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="mb-3 text-xl font-heading uppercase leading-tight tracking-widest text-foreground md:mb-4 md:text-2xl">{t('evolving_title')}</h2>
                                        <p className="mb-6 font-body text-[11px] leading-relaxed text-muted-foreground md:mb-8 md:text-sm">
                                            {t('evolving_desc')}
                                        </p>
                                        <Link
                                            href="/quiz"
                                            className="rounded-full bg-gold px-8 py-3.5 text-center font-heading text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105"
                                        >
                                            {t('refresh_btn')}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:gap-6 xs:grid-cols-2 lg:grid-cols-1">
                        <Link href="/dashboard/customer/loyalty">
                            <div className="glass group flex h-full flex-col justify-between rounded-[2rem] border-gold/10 p-6 transition-all hover:border-gold/30 md:rounded-[2.5rem] md:p-8">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="font-heading text-[8px] uppercase tracking-[0.4em] text-gold md:text-[10px]">{t('credits_label')}</h3>
                                    <ArrowUpRight size={12} className="text-muted-foreground transition-colors group-hover:text-gold" />
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold md:h-12 md:w-12 md:rounded-2xl">
                                        <Coins className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                    <p className="font-heading text-lg uppercase text-foreground md:text-2xl">
                                        {loading ? '---' : format.number(points ?? 0)} <span className="font-body text-[8px] text-muted-foreground md:text-sm">{t('credits_suffix')}</span>
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard/customer/promotions">
                            <div className="glass group flex h-full flex-col justify-between rounded-[2rem] border-gold/10 bg-gradient-to-br from-transparent to-gold/5 p-6 transition-all hover:border-gold/30 md:rounded-[2.5rem] md:p-8">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-gold/10 p-2 text-gold transition-transform group-hover:scale-110 md:rounded-2xl md:p-3">
                                        <Tag className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <span className="animate-pulse rounded-full bg-gold/20 px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-gold md:text-[8px]">{t('offers_new')}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-heading uppercase leading-tight tracking-widest text-foreground md:text-lg">{t('offers_title')}</h3>
                                    <p className="mt-1 text-[8px] uppercase text-muted-foreground md:text-[10px]">
                                        {offersLoading ? '...' : t('offers_desc', { count: offersCount })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[
                        { key: 'profile', icon: User, href: '/dashboard/profile', color: 'text-purple-400' },
                        { key: 'addresses', icon: MapPinned, href: '/dashboard/customer/addresses', color: 'text-green-400' },
                        { key: 'orders', icon: Inbox, href: '/dashboard/customer/orders', color: 'text-blue-400' },
                        { key: 'loyalty', icon: Coins, href: '/dashboard/customer/loyalty', color: 'text-gold' },
                        { key: 'ai_chat', icon: Zap, href: '/dashboard/chat', color: 'text-ai' },
                        { key: 'quiz', icon: Sparkles, href: '/quiz', color: 'text-gold' },
                    ].map((item, i) => (
                        <Link key={i} href={item.href}>
                            <div className="glass group flex items-center gap-4 rounded-2xl border-border px-5 py-4 transition-all hover:border-gold/30 md:rounded-3xl md:px-6 md:py-5">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 transition-transform group-hover:scale-110 md:h-12 md:w-12 md:rounded-2xl ${item.color}`}>
                                    <item.icon className="h-[18px] w-[18px] md:h-5 md:w-5" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground md:text-[10px]">{t(`modules.${item.key}`)}</h4>
                                    <p className="mt-0.5 text-[7px] uppercase tracking-tighter text-muted-foreground md:text-[8px]">{t('modules.explore')}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </AuthGuard>
    );
}
