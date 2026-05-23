'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Users, BrainCircuit, ShoppingBag, RefreshCw,
    CheckCircle, RotateCcw, Coins, Sparkles,
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
import { Link, useRouter } from '@/lib/i18n';

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
    const router = useRouter();

    // Period and Date state
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'quarter' | 'custom'>('month');
    const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

    // Overview state
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Chart state
    const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);
    const [selectedChartStoreId, setSelectedChartStoreId] = useState<string>('all');
    const [stores, setStores] = useState<any[]>([]);

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
    const fetchOverview = useCallback(async (p: string, start?: string, end?: string, storeId?: string) => {
        try {
            setOverviewLoading(true);
            const { data } = await api.get<OverviewData>('/analytics/overview', {
                params: { 
                    period: p,
                    startDate: start, 
                    endDate: end,
                    storeId: storeId || selectedChartStoreId
                }
            });
            setOverview(data);
        } catch (e) {
            console.error('Analytics overview error:', e);
        } finally {
            setOverviewLoading(false);
        }
    }, [selectedChartStoreId]);

    const fetchTrend = useCallback(async (p: string, start?: string, end?: string, storeId?: string) => {
        try {
            setTrendLoading(true);
            const { data } = await api.get<SalesTrendPoint[]>('/analytics/sales-trend', {
                params: { 
                    period: p === 'custom' ? 'month' : p, 
                    startDate: start, 
                    endDate: end,
                    storeId: storeId || selectedChartStoreId
                } 
            });
            setTrend(data);
        } catch (e) {
            console.error('Sales trend error:', e);
        } finally {
            setTrendLoading(false);
        }
    }, [selectedChartStoreId]);

    const fetchTopProducts = useCallback(async (storeId?: string) => {
        try {
            setTopLoading(true);
            const { data } = await api.get<TopProductDto[]>('/analytics/top-products', { 
                params: { 
                    limit: 4,
                    storeId: storeId || selectedChartStoreId
                } 
            });
            setTopProducts(data);
        } catch (e) {
            console.error('Top products error:', e);
        } finally {
            setTopLoading(false);
        }
    }, [selectedChartStoreId]);

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

    const fetchAiConversion = useCallback(async (p: string, start?: string, end?: string) => {
        try {
            setAiConversionLoading(true);
            const { data } = await api.get('/analytics/ai-conversion', {
                params: {
                    period: p,
                    startDate: start,
                    endDate: end
                }
            });
            setAiConversion(data);
        } catch (e) {
            console.error('AI conversion error:', e);
        } finally {
            setAiConversionLoading(false);
        }
    }, []);

    const fetchStores = useCallback(async () => {
        try {
            const { data } = await api.get('/stores');
            setStores(data);
        } catch (e) {
            console.error('Fetch stores list error:', e);
        }
    }, []);

    const refreshAll = useCallback(() => {
        fetchOverview(period, dateRange.start, dateRange.end, selectedChartStoreId);
        fetchTrend(period, dateRange.start, dateRange.end, selectedChartStoreId);
        fetchTopProducts(selectedChartStoreId);
        fetchChannel();
        fetchRecentOrders();
        fetchAiConversion(period, dateRange.start, dateRange.end);
        fetchStores();
        setLastRefreshed(new Date());
    }, [fetchOverview, fetchTrend, period, dateRange, selectedChartStoreId, fetchTopProducts, fetchChannel, fetchRecentOrders, fetchAiConversion, fetchStores]);

    // Initial load & Re-fetch when dateRange, period or selectedChartStoreId changes
    useEffect(() => {
        if (period !== 'custom') {
            fetchOverview(period, undefined, undefined, selectedChartStoreId);
            fetchTrend(period, undefined, undefined, selectedChartStoreId);
            fetchTopProducts(selectedChartStoreId);
            fetchAiConversion(period, undefined, undefined);
        } else if (dateRange.start && dateRange.end) {
            fetchOverview('custom', dateRange.start, dateRange.end, selectedChartStoreId);
            fetchTrend('custom', dateRange.start, dateRange.end, selectedChartStoreId);
            fetchTopProducts(selectedChartStoreId);
            fetchAiConversion('custom', dateRange.start, dateRange.end);
        }
    }, [period, dateRange, selectedChartStoreId, fetchOverview, fetchTrend, fetchTopProducts]);

    useEffect(() => {
        fetchChannel();
        fetchRecentOrders();
        fetchStores();
    }, [fetchChannel, fetchRecentOrders, fetchStores]);

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
                label: 'Giá trị đơn hàng TB (AOV)',
                value: overview.totalOrders > 0 ? formatVND(Math.round(overview.totalRevenue / overview.totalOrders)) : '0₫',
                change: null,
                icon: Coins,
                color: 'bg-amber-500/10 text-amber-400',
            },
            {
                label: 'Phiên tư vấn AI',
                value: `${(overview.aiConsultations || 0).toLocaleString()} lượt`,
                change: null,
                icon: Sparkles,
                color: 'bg-purple-500/10 text-purple-400',
                href: '/dashboard/admin/ai-logs',
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
                label: t('home.stats.success_rate'),
                value: `${(overview.successRate || 0).toFixed(1)}%`,
                change: null,
                icon: CheckCircle,
                color: 'bg-emerald-500/10 text-emerald-400',
                href: { pathname: '/dashboard/admin/orders', query: { status: 'COMPLETED' } },
            },
            {
                label: t('home.stats.cancellation_rate'),
                value: `${(overview.cancellationRate || 0).toFixed(1)}%`,
                change: null,
                icon: RotateCcw,
                color: 'bg-red-500/10 text-red-400',
                href: { pathname: '/dashboard/admin/orders', query: { status: 'CANCELLED' } },
                subtext: `Tỉ lệ Hoàn trả: ${(overview.returnRate || 0).toFixed(1)}%`,
                subtextHref: '/dashboard/admin/returns',
            },
        ]
        : [];

    const activeStoreObj = stores.find(s => s.id === selectedChartStoreId);
    const activeStoreName = activeStoreObj 
        ? (activeStoreObj.type === 'CENTRAL' ? `${activeStoreObj.name} - Bán Online` : activeStoreObj.name)
        : (selectedChartStoreId === 'all' ? 'Toàn Hệ Thống' : undefined);

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

                    <div className="flex flex-wrap items-center gap-4 bg-background/40 p-2 rounded-[2rem] border border-border shadow-2xl backdrop-blur-xl">
                        {[
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'week', label: '7 Ngày' },
                            { id: 'month', label: '30 Ngày' },
                            { id: 'quarter', label: 'Quý này' },
                            { id: 'year', label: '1 Năm' },
                            { id: 'custom', label: 'Tùy chọn' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id as any)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 uppercase",
                                    period === p.id 
                                        ? "bg-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}

                        {period === 'custom' && (
                            <div className="flex items-center gap-2 px-2 border-l border-border animate-in fade-in slide-in-from-left-2 duration-300">
                                <input 
                                    type="date" 
                                    className="bg-background/60 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-gold/50 cursor-pointer"
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                                <span className="text-muted-foreground/50 text-[10px]">đến</span>
                                <input 
                                    type="date" 
                                    className="bg-background/60 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-gold/50 cursor-pointer"
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

                        <button
                            onClick={refreshAll}
                            disabled={overviewLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/40 text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition-all border border-border active:scale-95 group"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-700", overviewLoading && "animate-spin")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('home.stats.refresh')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── KPI Stats ──────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {overviewLoading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="glass bg-background/40 rounded-[2rem] border border-border p-8 animate-pulse h-40" />
                        ))
                        : statCards.map((card: any, i) => {
                            const CardContent = (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass bg-background/40 rounded-[2.5rem] border border-border hover:border-gold/20 hover:shadow-2xl hover:shadow-gold/5 transition-all group flex flex-col h-full min-h-[200px]"
                                >
                                    <Link
                                        href={card.href || ''}
                                        className={cn(
                                            "p-8 flex-1 flex flex-col justify-between",
                                            !card.href && "pointer-events-none"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`p-4 rounded-2xl ${card.color} group-hover:scale-110 transition-all duration-500 shadow-xl shadow-black/10 flex items-center justify-center relative`}>
                                                <div className="absolute inset-0 rounded-2xl bg-current opacity-0 group-hover:opacity-10 blur-md transition-opacity" />
                                                <card.icon className="w-6 h-6 relative z-10" />
                                            </div>
                                            {card.change !== null && card.change !== undefined && (
                                                <ChangeChip value={card.change} />
                                            )}
                                        </div>
                                        
                                        <div className="mt-6 flex flex-col">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 opacity-50 group-hover:opacity-80 transition-opacity">
                                                {card.label}
                                            </p>
                                            <h4 className="text-3xl sm:text-4xl font-heading text-foreground tracking-tight leading-none group-hover:text-gold transition-colors duration-300">
                                                {card.value}
                                            </h4>
                                        </div>
                                    </Link>

                                    {/* Footer area with fixed height for alignment */}
                                    <div className="px-8 pb-7 min-h-[36px] flex items-center">
                                        {card.subtext ? (
                                            <button 
                                                onClick={(e) => {
                                                    if (card.subtextHref) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        router.push(card.subtextHref);
                                                    }
                                                }}
                                                className={cn(
                                                    "text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium opacity-30 transition-all text-left",
                                                    card.subtextHref && "hover:text-gold hover:opacity-100 hover:tracking-[0.2em] cursor-pointer"
                                                )}
                                            >
                                                {card.subtext}
                                            </button>
                                        ) : (
                                            <div className="h-px w-8 bg-border/20" /> /* Placeholder line */
                                        )}
                                    </div>
                                </motion.div>
                            );

                            return CardContent;
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
                            stores={stores}
                            selectedStoreId={selectedChartStoreId}
                            onStoreChange={(id) => setSelectedChartStoreId(id)}
                        />
                    </div>
                    <TopProductsList data={topProducts} loading={topLoading} selectedStoreName={activeStoreName} />
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
