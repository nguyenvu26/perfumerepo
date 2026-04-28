'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Users, BrainCircuit, ShoppingBag, RefreshCw,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SalesChart, SalesTrendPoint } from '@/components/dashboard/admin/SalesChart';
import { TopProductsList, TopProductDto } from '@/components/dashboard/admin/TopProductsList';
import { ChannelDonutChart } from '@/components/dashboard/admin/ChannelDonutChart';
import { LowStockWidget } from '@/components/dashboard/admin/LowStockWidget';
import { RecentOrdersFeed, RecentOrderDto } from '@/components/dashboard/admin/RecentOrdersFeed';
import { StoreRevenueWidget } from '@/components/dashboard/admin/StoreRevenueWidget';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OverviewData {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    newCustomersToday: number;
    aiConsultations: number;
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

    // Overview state
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Chart state
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);

    // Widgets state
    const [topProducts, setTopProducts] = useState<TopProductDto[]>([]);
    const [topLoading, setTopLoading] = useState(true);

    const [channelData, setChannelData] = useState<{ online: number; pos: number }>({ online: 0, pos: 0 });
    const [channelLoading, setChannelLoading] = useState(true);

    const [lowStock, setLowStock] = useState<any[]>([]);
    const [lowStockLoading, setLowStockLoading] = useState(true);

    const [recentOrders, setRecentOrders] = useState<RecentOrderDto[]>([]);
    const [recentLoading, setRecentLoading] = useState(true);

    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // ── Fetchers ────────────────────────────────────────────────────────────
    const fetchOverview = useCallback(async () => {
        try {
            setOverviewLoading(true);
            const { data } = await api.get<OverviewData>('/analytics/overview');
            setOverview(data);
        } catch (e) {
            console.error('Analytics overview error:', e);
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    const fetchTrend = useCallback(async (p: 'week' | 'month' | 'year') => {
        try {
            setTrendLoading(true);
            const { data } = await api.get<SalesTrendPoint[]>('/analytics/sales-trend', { params: { period: p } });
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
            const { data } = await api.get<TopProductDto[]>('/analytics/top-products', { params: { limit: 5 } });
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

    const fetchLowStock = useCallback(async () => {
        try {
            setLowStockLoading(true);
            const { data } = await api.get('/analytics/low-stock');
            setLowStock(data);
        } catch (e) {
            console.error('Low stock error:', e);
        } finally {
            setLowStockLoading(false);
        }
    }, []);

    const fetchRecentOrders = useCallback(async () => {
        try {
            setRecentLoading(true);
            const { data } = await api.get<RecentOrderDto[]>('/analytics/recent-orders', { params: { limit: 8 } });
            setRecentOrders(data);
        } catch (e) {
            console.error('Recent orders error:', e);
        } finally {
            setRecentLoading(false);
        }
    }, []);

    const refreshAll = useCallback(() => {
        fetchOverview();
        fetchTrend(period);
        fetchTopProducts();
        fetchChannel();
        fetchLowStock();
        fetchRecentOrders();
        setLastRefreshed(new Date());
    }, [fetchOverview, fetchTrend, period, fetchTopProducts, fetchChannel, fetchLowStock, fetchRecentOrders]);

    // Initial load
    useEffect(() => {
        fetchOverview();
        fetchTopProducts();
        fetchChannel();
        fetchLowStock();
        fetchRecentOrders();
    }, [fetchOverview, fetchTopProducts, fetchChannel, fetchLowStock, fetchRecentOrders]);

    // Re-fetch when period changes
    useEffect(() => {
        fetchTrend(period);
    }, [period, fetchTrend]);

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
                label: t('home.stats.orders'),
                value: overview.totalOrders.toLocaleString(),
                change: overview.ordersChange,
                icon: ShoppingBag,
                color: 'bg-gold/10 text-gold',
            },
            {
                label: t('home.stats.members'),
                value: overview.totalCustomers.toLocaleString(),
                change: null,
                icon: Users,
                color: 'bg-blue-500/10 text-blue-400',
                subtext: t('home.stats.today', { count: overview.newCustomersToday }),
            },
            {
                label: t('home.stats.consultations'),
                value: overview.aiConsultations.toLocaleString(),
                change: null,
                icon: BrainCircuit,
                color: 'bg-violet-500/10 text-violet-400',
                subtext: t('home.stats.ai_suffix'),
            },
        ]
        : [];

    return (
        <AuthGuard allowedRoles={['admin']}>
            <div className="flex flex-col gap-6 md:gap-7 py-6 md:py-8 px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-4">
                    <header className="space-y-1">
                        <h1 className="text-fluid-3xl font-heading gold-gradient uppercase tracking-tighter leading-none">
                            {t('home.title')}
                        </h1>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[.3em] sm:tracking-[.4em] font-bold">
                            {t('home.subtitle')}
                        </p>
                    </header>
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest block opacity-70">
                            {t('home.stats.updated_at')} {lastRefreshed.toLocaleTimeString('vi-VN')}
                        </span>
                        <button
                            onClick={refreshAll}
                            className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-widest border border-gold/20 bg-gold/5 text-gold rounded-full px-5 py-2.5 hover:bg-gold hover:text-black transition-all active:scale-95"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {t('home.stats.refresh')}
                        </button>
                    </div>
                </div>

                {/* ── KPI Stats ──────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {overviewLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="glass bg-background/40 rounded-[2rem] border border-border p-8 animate-pulse h-40" />
                        ))
                        : statCards.map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass bg-background/40 rounded-[2rem] border border-border p-6 hover:border-gold/20 hover:shadow-xl hover:shadow-gold/5 transition-all group flex flex-col justify-between min-h-[160px]"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    {card.change !== null && card.change !== undefined && (
                                        <ChangeChip value={card.change} />
                                    )}
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1 opacity-70">
                                        {card.label}
                                    </p>
                                    <h4 className="text-2xl sm:text-3xl font-heading text-foreground tracking-tight leading-none mb-2">
                                        {card.value}
                                    </h4>
                                    {card.subtext && (
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium opacity-40">
                                            {card.subtext}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))
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
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ChannelDonutChart
                        online={channelData.online}
                        pos={channelData.pos}
                        loading={channelLoading}
                    />
                    <LowStockWidget data={lowStock} loading={lowStockLoading} />
                    <RecentOrdersFeed data={recentOrders} loading={recentLoading} />
                </section>

            </div>
        </AuthGuard>
    );
}
