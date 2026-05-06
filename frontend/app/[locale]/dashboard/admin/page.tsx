'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Users, BrainCircuit, ShoppingBag, RefreshCw,
    CheckCircle, RotateCcw,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SalesChart, SalesTrendPoint } from '@/components/dashboard/admin/SalesChart';
import { TopProductsList, TopProductDto } from '@/components/dashboard/admin/TopProductsList';
import { ChannelDonutChart } from '@/components/dashboard/admin/ChannelDonutChart';
import { AiConversionWidget } from '@/components/dashboard/admin/AiConversionWidget';
import { InventoryHealthWidget } from '@/components/dashboard/admin/InventoryHealthWidget';
import { StockHeatmapWidget } from '@/components/dashboard/admin/StockHeatmapWidget';
import { RecentOrdersFeed, RecentOrderDto } from '@/components/dashboard/admin/RecentOrdersFeed';
import { StoreRevenueWidget } from '@/components/dashboard/admin/StoreRevenueWidget';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';

// ── Types ─────────────────────────────────────────────────────────────────────
interface OverviewData {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    newCustomersToday: number;
    aiConsultations: number;
    totalProfit: number;
    inventoryValue: number;
    successRate: number;
    returnRate: number;
    cancellationRate: number;
    revenueChange: number;
    ordersChange: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVND(v: number): string {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B₫`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K₫`;
    return `${v}₫`;
}

function ChangeChip({ value }: { value: number }) {
    const positive = value >= 0;
    return (
        <span className={cn(
            'flex items-center gap-0.5 text-[9px] font-bold px-2 py-1 rounded-full border uppercase tracking-widest',
            positive
                ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                : 'text-red-500 border-red-500/20 bg-red-500/10',
        )}>
            {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {Math.abs(value)}%
        </span>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const t = useTranslations('dashboard.admin');

    // Period and Date state
    const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'quarter' | 'custom'>('month');
    const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

    // Overview state
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Chart state
    const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);

    // Widgets state
    const [topProducts, setTopProducts] = useState<TopProductDto[]>([]);
    const [topLoading, setTopLoading] = useState(true);

    const [channelData, setChannelData] = useState<{ online: number; pos: number }>({ online: 0, pos: 0 });
    const [channelLoading, setChannelLoading] = useState(true);

    const [recentOrders, setRecentOrders] = useState<RecentOrderDto[]>([]);
    const [recentLoading, setRecentLoading] = useState(true);

    const [aiConversion, setAiConversion] = useState<any>(null);
    const [aiConversionLoading, setAiConversionLoading] = useState(true);

    const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);
    const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);

    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // ── Fetchers ────────────────────────────────────────────────────────────
    const fetchOverview = useCallback(async (start?: string, end?: string) => {
        try {
            setOverviewLoading(true);
            const { data } = await api.get<OverviewData>('/analytics/overview', {
                params: { startDate: start, endDate: end }
            });
            setOverview(data);
        } catch (e) {
            console.error('Analytics overview error:', e);
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    const fetchTrend = useCallback(async (p: string, start?: string, end?: string) => {
        try {
            setTrendLoading(true);
            const { data } = await api.get<SalesTrendPoint[]>('/analytics/sales-trend', {
                params: { 
                    period: p === 'custom' ? 'month' : p, 
                    startDate: start, 
                    endDate: end 
                } 
            });
            setTrend(data);
        } catch (e) {
            console.error('Sales trend error:', e);
        } finally {
            setTrendLoading(false);
        }
    }, []);

    const fetchTopProducts = useCallback(async () => {
        try {
            setTopLoading(true);
            const { data } = await api.get<TopProductDto[]>('/analytics/top-products', { params: { limit: 4 } });
            setTopProducts(data);
        } catch (e) {
            console.error('Top products error:', e);
        } finally {
            setTopLoading(false);
        }
    }, []);

    const fetchChannel = useCallback(async () => {
        try {
            setChannelLoading(true);
            const { data } = await api.get<{ online: number; pos: number }>('/analytics/channel-breakdown');
            setChannelData(data);
        } catch (e) {
            console.error('Channel breakdown error:', e);
        } finally {
            setChannelLoading(false);
        }
    }, []);

    const fetchRecentOrders = useCallback(async () => {
        try {
            setRecentLoading(true);
            const { data } = await api.get<RecentOrderDto[]>('/analytics/recent-orders', { params: { limit: 5 } });
            setRecentOrders(data);
        } catch (e) {
            console.error('Recent orders error:', e);
        } finally {
            setRecentLoading(false);
        }
    }, []);

    const fetchAiConversion = useCallback(async () => {
        try {
            setAiConversionLoading(true);
            const { data } = await api.get('/analytics/ai-conversion');
            setAiConversion(data);
        } catch (e) {
            console.error('AI conversion error:', e);
        } finally {
            setAiConversionLoading(false);
        }
    }, []);

    const refreshAll = useCallback(() => {
        fetchOverview(dateRange.start, dateRange.end);
        fetchTrend(period, dateRange.start, dateRange.end);
        fetchTopProducts();
        fetchChannel();
        fetchRecentOrders();
        fetchAiConversion();
        setLastRefreshed(new Date());
    }, [fetchOverview, fetchTrend, period, dateRange, fetchTopProducts, fetchChannel, fetchRecentOrders, fetchAiConversion]);

    // Initial load & Re-fetch when dateRange or period changes
    useEffect(() => {
        if (period !== 'custom') {
            fetchOverview(undefined, undefined);
            fetchTrend(period, undefined, undefined);
        } else if (dateRange.start && dateRange.end) {
            fetchOverview(dateRange.start, dateRange.end);
            fetchTrend('custom', dateRange.start, dateRange.end);
        }
    }, [period, dateRange, fetchOverview, fetchTrend]);

    useEffect(() => {
        fetchTopProducts();
        fetchChannel();
        fetchRecentOrders();
        fetchAiConversion();
    }, [fetchTopProducts, fetchChannel, fetchRecentOrders, fetchAiConversion]);

    // ── Stat card definitions ────────────────────────────────────────────────
    const statCards = overview
        ? [
            {
                label: t('home.stats.revenue'),
                value: formatVND(overview.totalRevenue),
                change: overview.revenueChange,
                icon: TrendingUp,
                color: 'bg-emerald-500/10 text-emerald-500',
            },
            {
                label: t('home.stats.profit'),
                value: formatVND(overview.totalProfit),
                change: null,
                icon: BrainCircuit,
                color: 'bg-blue-500/10 text-blue-400',
            },
            {
                label: t('home.stats.success_rate'),
                value: `${(overview.successRate || 0).toFixed(1)}%`,
                change: null,
                icon: CheckCircle,
                color: 'bg-emerald-500/10 text-emerald-400',
                href: '/dashboard/admin/orders',
            },
            {
                label: t('home.stats.orders'),
                value: overview.totalOrders.toLocaleString(),
                change: overview.ordersChange,
                icon: ShoppingBag,
                color: 'bg-gold/10 text-gold',
            },
            {
                label: t('home.stats.inventory_value'),
                value: formatVND(overview.inventoryValue),
                change: null,
                icon: RefreshCw,
                color: 'bg-violet-500/10 text-violet-400',
                subtext: t('home.stats.stock_value_suffix'),
            },
            {
                label: t('home.stats.cancellation_rate'),
                value: `${(overview.cancellationRate || 0).toFixed(1)}%`,
                change: null,
                icon: RotateCcw,
                color: 'bg-red-500/10 text-red-400',
                href: '/dashboard/admin/orders',
                subtext: `Tỉ lệ Hoàn trả: ${(overview.returnRate || 0).toFixed(1)}%`,
            },
        ]
        : [];

    return (
        <AuthGuard allowedRoles={['admin']}>
            <div className="flex flex-col gap-6 md:gap-7 py-6 md:py-8 px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <header className="space-y-1">
                        <h1 className="text-fluid-3xl font-heading gold-gradient uppercase tracking-tighter leading-none">
                            {t('home.title')}
                        </h1>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[.3em] sm:tracking-[.4em] font-bold">
                            {t('home.subtitle')}
                        </p>
                    </header>

                    <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                        {[
                            { id: 'week', label: '7D' },
                            { id: 'month', label: '30D' },
                            { id: 'quarter', label: 'Quarter' },
                            { id: 'year', label: '1Y' },
                            { id: 'custom', label: 'Custom' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id as any)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 uppercase",
                                    period === p.id 
                                        ? "bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}

                        {period === 'custom' && (
                            <div className="flex items-center gap-2 px-2 border-l border-white/10 animate-in fade-in slide-in-from-left-2 duration-300">
                                <input 
                                    type="date" 
                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                                <span className="text-white/20 text-[10px]">to</span>
                                <input 
                                    type="date" 
                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

                        <button
                            onClick={refreshAll}
                            disabled={overviewLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10 active:scale-95 group"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-700", overviewLoading && "animate-spin")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('home.stats.refresh')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── KPI Stats ──────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {overviewLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="glass bg-background/40 rounded-[2rem] border border-border p-8 animate-pulse h-40" />
                        ))
                        : statCards.map((card: any, i) => {
                            const CardContent = (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={cn(
                                        "glass bg-background/40 rounded-[2rem] border border-border p-6 hover:border-gold/20 hover:shadow-xl hover:shadow-gold/5 transition-all group flex flex-col justify-between h-full min-h-[165px]",
                                        card.href && "cursor-pointer"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                                            <card.icon className="w-5 h-5" />
                                        </div>
                                        {card.change !== null && card.change !== undefined && (
                                            <ChangeChip value={card.change} />
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col justify-end flex-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1 opacity-70">
                                            {card.label}
                                        </p>
                                        <h4 className="text-2xl sm:text-3xl font-heading text-foreground tracking-tight leading-none">
                                            {card.value}
                                        </h4>
                                        <div className="min-h-[14px] mt-1">
                                            {card.subtext && (
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium opacity-40">
                                                    {card.subtext}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );

                            return card.href ? (
                                <Link key={i} href={card.href}>
                                    {CardContent}
                                </Link>
                            ) : (
                                <div key={i}>{CardContent}</div>
                            );
                        })
                    }
                </section>

                {/* ── Per-Store Analytics ────────────────────────────────── */}
                <section>
                    <StoreRevenueWidget />
                </section>

                {/* ── Sales Chart + Top Products ────────────────────────── */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <SalesChart
                            data={trend}
                            period={period}
                            onPeriodChange={setPeriod}
                            loading={trendLoading}
                        />
                    </div>
                    <TopProductsList data={topProducts} loading={topLoading} />
                </section>

                {/* ── Channel + Low Stock + Recent Orders ───────────────── */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <ChannelDonutChart
                        online={channelData.online}
                        pos={channelData.pos}
                        loading={channelLoading}
                    />
                    <AiConversionWidget data={aiConversion} loading={aiConversionLoading} />
                    <div className="xl:col-span-2">
                        <RecentOrdersFeed data={recentOrders} loading={recentLoading} />
                    </div>
                </section>

                {/* Full Width Inventory Sections */}
                <section className="mt-8 space-y-8">
                    <InventoryHealthWidget 
                        isExpanded={isInventoryExpanded} 
                        onToggle={() => setIsInventoryExpanded(!isInventoryExpanded)} 
                    />
                    <StockHeatmapWidget 
                        isExpanded={isHeatmapExpanded} 
                        onToggle={() => setIsHeatmapExpanded(!isHeatmapExpanded)} 
                    />
                </section>
            </div>
        </AuthGuard>
    );
}
