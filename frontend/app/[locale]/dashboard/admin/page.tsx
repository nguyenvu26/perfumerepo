'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Users, BrainCircuit, ShoppingBag, RefreshCw,
    CheckCircle, RotateCcw, Coins, Sparkles, Filter, ChevronDown, Calendar, Store as StoreIcon, Globe, XCircle,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SalesChart, SalesTrendPoint } from '@/components/dashboard/admin/SalesChart';
import { TopProductsList, TopProductDto } from '@/components/dashboard/admin/TopProductsList';
import { ChannelDonutChart } from '@/components/dashboard/admin/ChannelDonutChart';
import { AiConversionWidget } from '@/components/dashboard/admin/AiConversionWidget';
import { RecentOrdersFeed, RecentOrderDto } from '@/components/dashboard/admin/RecentOrdersFeed';
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

    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'all' | 'ONLINE' | 'POS'>('all');
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // ── Fetchers ────────────────────────────────────────────────────────────
    const fetchOverview = useCallback(async (p: string, start?: string, end?: string, storeId?: string, channel?: 'ONLINE' | 'POS') => {
        try {
            setOverviewLoading(true);
            const { data } = await api.get<OverviewData>('/analytics/overview', {
                params: { 
                    period: p,
                    startDate: start, 
                    endDate: end,
                    storeId: storeId || selectedChartStoreId,
                    channel: channel || (selectedChannel === 'all' ? undefined : selectedChannel)
                }
            });
            setOverview(data);
        } catch (e) {
            console.error('Analytics overview error:', e);
        } finally {
            setOverviewLoading(false);
        }
    }, [selectedChartStoreId, selectedChannel]);

    const fetchTrend = useCallback(async (p: string, start?: string, end?: string, storeId?: string, channel?: 'ONLINE' | 'POS') => {
        try {
            setTrendLoading(true);
            const { data } = await api.get<SalesTrendPoint[]>('/analytics/sales-trend', {
                params: { 
                    period: p === 'custom' ? 'month' : p, 
                    startDate: start, 
                    endDate: end,
                    storeId: storeId || selectedChartStoreId,
                    channel: channel || (selectedChannel === 'all' ? undefined : selectedChannel)
                } 
            });
            setTrend(data);
        } catch (e) {
            console.error('Sales trend error:', e);
        } finally {
            setTrendLoading(false);
        }
    }, [selectedChartStoreId, selectedChannel]);

    const fetchTopProducts = useCallback(async (p: string, start?: string, end?: string, storeId?: string, channel?: 'ONLINE' | 'POS') => {
        try {
            setTopLoading(true);
            const { data } = await api.get<TopProductDto[]>('/analytics/top-products', { 
                params: { 
                    limit: 4,
                    period: p,
                    startDate: start,
                    endDate: end,
                    storeId: storeId || selectedChartStoreId,
                    channel: channel || (selectedChannel === 'all' ? undefined : selectedChannel)
                } 
            });
            setTopProducts(data);
        } catch (e) {
            console.error('Top products error:', e);
        } finally {
            setTopLoading(false);
        }
    }, [selectedChartStoreId, selectedChannel]);

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

    const fetchRecentOrders = useCallback(async (p: string, start?: string, end?: string, storeId?: string, channel?: 'ONLINE' | 'POS') => {
        try {
            setRecentLoading(true);
            const { data } = await api.get<RecentOrderDto[]>('/analytics/recent-orders', { 
                params: { 
                    limit: 5,
                    period: p,
                    startDate: start,
                    endDate: end,
                    storeId: storeId || selectedChartStoreId,
                    channel: channel || (selectedChannel === 'all' ? undefined : selectedChannel)
                } 
            });
            setRecentOrders(data);
        } catch (e) {
            console.error('Recent orders error:', e);
        } finally {
            setRecentLoading(false);
        }
    }, [selectedChartStoreId, selectedChannel]);

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
        const chan = selectedChannel === 'all' ? undefined : selectedChannel;
        fetchOverview(period, dateRange.start, dateRange.end, selectedChartStoreId, chan);
        fetchTrend(period, dateRange.start, dateRange.end, selectedChartStoreId, chan);
        fetchTopProducts(period, dateRange.start, dateRange.end, selectedChartStoreId, chan);
        fetchChannel();
        fetchRecentOrders(period, dateRange.start, dateRange.end, selectedChartStoreId, chan);
        fetchAiConversion(period, dateRange.start, dateRange.end);
        fetchStores();
        setLastRefreshed(new Date());
    }, [fetchOverview, fetchTrend, period, dateRange, selectedChartStoreId, selectedChannel, fetchTopProducts, fetchChannel, fetchRecentOrders, fetchAiConversion, fetchStores]);

    // Initial load & Re-fetch when dateRange, period or selectedChartStoreId changes
    useEffect(() => {
        const chan = selectedChannel === 'all' ? undefined : selectedChannel;
        if (period !== 'custom') {
            fetchOverview(period, undefined, undefined, selectedChartStoreId, chan);
            fetchTrend(period, undefined, undefined, selectedChartStoreId, chan);
            fetchTopProducts(period, undefined, undefined, selectedChartStoreId, chan);
            fetchRecentOrders(period, undefined, undefined, selectedChartStoreId, chan);
            fetchAiConversion(period, undefined, undefined);
        } else if (dateRange.start && dateRange.end) {
            fetchOverview('custom', dateRange.start, dateRange.end, selectedChartStoreId, chan);
            fetchTrend('custom', dateRange.start, dateRange.end, selectedChartStoreId, chan);
            fetchTopProducts('custom', dateRange.start, dateRange.end, selectedChartStoreId, chan);
            fetchRecentOrders('custom', dateRange.start, dateRange.end, selectedChartStoreId, chan);
            fetchAiConversion('custom', dateRange.start, dateRange.end);
        }
    }, [period, dateRange, selectedChartStoreId, selectedChannel, fetchOverview, fetchTrend, fetchTopProducts, fetchRecentOrders, fetchAiConversion]);

    useEffect(() => {
        fetchChannel();
        fetchStores();
    }, [fetchChannel, fetchStores]);

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
                label: t('home.stats.customers'),
                value: overview.totalCustomers.toLocaleString(),
                change: null,
                icon: Users,
                color: 'bg-blue-500/10 text-blue-400',
                href: '/dashboard/admin/customers',
            },
            {
                label: t('home.stats.inventory_value'),
                value: formatVND(overview.inventoryValue),
                change: null,
                icon: RefreshCw,
                color: 'bg-violet-500/10 text-violet-400',
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
                icon: XCircle,
                color: 'bg-rose-500/10 text-rose-400',
                href: { pathname: '/dashboard/admin/orders', query: { status: 'CANCELLED' } },
            },
            {
                label: t('home.stats.return_rate'),
                value: `${(overview.returnRate || 0).toFixed(1)}%`,
                change: null,
                icon: RotateCcw,
                color: 'bg-amber-500/10 text-amber-500',
                href: '/dashboard/admin/returns',
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

                {/* ── Header & Consolidanted Filters ─────────────────────────────── */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                        <header className="space-y-3">
                            <h1 className="text-7xl sm:text-8xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-[0.8]">
                                {t('home.title')}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium opacity-50 italic max-w-xl leading-relaxed">
                                {t('home.subtitle')}
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-gold not-italic">
                                    Cập nhật: {lastRefreshed.toLocaleTimeString()}
                                </span>
                            </p>
                        </header>

                        <div className="flex items-center gap-4">
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className={cn(
                                    "group flex items-center gap-4 px-8 py-4 rounded-full border transition-all duration-500 active:scale-95",
                                    isFilterExpanded 
                                        ? "bg-gold text-white border-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                        : "bg-white/5 border-white/10 text-foreground hover:border-gold/50"
                                )}
                            >
                                <Filter className={cn("w-4 h-4 transition-transform duration-500", isFilterExpanded && "rotate-180")} />
                                <div className="flex flex-col items-start leading-none gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Cấu hình báo cáo</span>
                                    {!isFilterExpanded && (
                                        <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest">
                                            {period === 'custom' ? 'Tùy chọn' : (
                                                period === 'today' ? 'Hôm nay' : 
                                                period === 'week' ? '7 Ngày' :
                                                period === 'month' ? '30 Ngày' :
                                                period === 'quarter' ? 'Quý này' : '1 Năm'
                                            )} • {selectedChannel === 'all' ? 'Toàn hệ thống' : (selectedChannel === 'ONLINE' ? 'Trực tuyến' : 'Tại quầy')}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className={cn("w-4 h-4 opacity-30 transition-transform duration-500", isFilterExpanded && "rotate-180")} />
                            </button>

                            <button
                                onClick={refreshAll}
                                disabled={overviewLoading}
                                className="p-4 rounded-full bg-white/5 border border-white/10 text-foreground/50 hover:text-gold hover:border-gold/30 transition-all active:scale-95 group"
                                title={t('home.stats.refresh')}
                            >
                                <RefreshCw className={cn("w-5 h-5 transition-transform duration-700", overviewLoading && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isFilterExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -20, scale: 0.98 }}
                                animate={{ height: 'auto', opacity: 1, y: 0, scale: 1 }}
                                exit={{ height: 0, opacity: 0, y: -20, scale: 0.98 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                className="overflow-hidden z-20 relative"
                            >
                                <div className="glass bg-zinc-900/40 border border-white/10 rounded-[3rem] p-10 sm:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl mt-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                                        
                                        {/* 1. Time Presets */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/20">
                                                    <Calendar className="w-4 h-4 text-gold" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Khoảng thời gian</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Chọn nhanh tiến độ</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                                                {[
                                                    { id: 'today', label: 'Hôm nay' },
                                                    { id: 'week', label: '7 Ngày qua' },
                                                    { id: 'month', label: '30 Ngày qua' },
                                                    { id: 'quarter', label: 'Quý này' },
                                                    { id: 'year', label: '1 Năm qua' },
                                                    { id: 'custom', label: 'Tùy chọn' },
                                                ].map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setPeriod(p.id as any)}
                                                        className={cn(
                                                            "px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-500 uppercase border text-center",
                                                            period === p.id 
                                                                ? "bg-gold text-white border-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                                                                : "bg-white/5 border-white/5 text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20"
                                                        )}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Custom Date Range or Status Information */}
                                        <div className="space-y-8 min-h-[160px]">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                    <Filter className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Chi tiết tùy chỉnh</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Thời gian & Trạng thái</span>
                                                </div>
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {period === 'custom' ? (
                                                    <motion.div 
                                                        key="custom-date"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="flex flex-col gap-4 p-6 bg-white/5 rounded-3xl border border-white/10"
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Từ ngày</label>
                                                            <input 
                                                                type="date" 
                                                                className="bg-black/40 text-gold font-heading text-xs outline-none cursor-pointer p-3 rounded-xl border border-white/5 focus:border-gold/50 transition-all w-full"
                                                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Đến ngày</label>
                                                            <input 
                                                                type="date" 
                                                                className="bg-black/40 text-gold font-heading text-xs outline-none cursor-pointer p-3 rounded-xl border border-white/5 focus:border-gold/50 transition-all w-full"
                                                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div 
                                                        key="period-info"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="flex items-center justify-center h-full p-8 rounded-3xl border-2 border-dashed border-white/5"
                                                    >
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold text-center leading-relaxed">
                                                            Đang áp dụng bộ lọc<br/>
                                                            <span className="text-gold font-black mt-2 inline-block">
                                                                {period === 'today' ? 'Hôm nay' : 
                                                                 period === 'week' ? '7 Ngày qua' :
                                                                 period === 'month' ? '30 Ngày qua' :
                                                                 period === 'quarter' ? 'Quý này' : '1 Năm qua'}
                                                            </span>
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* 3. Distribution & Apply */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                                    <Globe className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Phạm vi dữ liệu</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Khu vực & Kênh</span>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/10">
                                                    {[
                                                        { id: 'all', label: 'Hệ thống' },
                                                        { id: 'ONLINE', label: 'Online' },
                                                        { id: 'POS', label: 'Tại quầy' }
                                                    ].map(chan => (
                                                        <button
                                                            key={chan.id}
                                                            onClick={() => setSelectedChannel(chan.id as any)}
                                                            className={cn(
                                                                "flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                                selectedChannel === chan.id 
                                                                    ? "bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] ring-1 ring-white/10" 
                                                                    : "text-muted-foreground hover:text-white"
                                                            )}
                                                        >
                                                            {chan.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <AnimatePresence>
                                                    {selectedChannel === 'POS' && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="relative flex flex-col gap-2"
                                                        >
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chọn chi nhánh</label>
                                                            <div className="relative group">
                                                                <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold opacity-50 group-hover:opacity-100 transition-opacity z-10" />
                                                                <select 
                                                                    value={selectedChartStoreId}
                                                                    onChange={(e) => setSelectedChartStoreId(e.target.value)}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gold focus:outline-none focus:border-gold/50 cursor-pointer appearance-none hover:bg-black/60 transition-all shadow-inner"
                                                                >
                                                                    <option value="all" className="bg-zinc-950 text-white">Tất cả chi nhánh</option>
                                                                    {stores.filter(s => s.type !== 'CENTRAL').map(s => (
                                                                        <option key={s.id} value={s.id} className="bg-zinc-950 text-white">{s.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/30 pointer-events-none" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <button 
                                                    onClick={() => setIsFilterExpanded(false)}
                                                    className="w-full mt-6 px-10 py-5 rounded-2xl bg-gold text-white text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                                >
                                                    Áp dụng bộ lọc
                                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── KPI Stats ──────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-4">
                    {overviewLoading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="glass bg-background/40 rounded-[2rem] border border-border p-8 animate-pulse h-40" />
                        ))
                        : statCards.map((card: any, i) => {
                            // Helper to split value and unit for better alignment
                            const splitValue = (val: string) => {
                                const unitRegex = /([₫%]|lượt|B₫|M₫|K₫)$/;
                                const match = val.match(unitRegex);
                                if (match) {
                                    return { 
                                        number: val.replace(unitRegex, '').trim(), 
                                        unit: match[0] 
                                    };
                                }
                                return { number: val, unit: '' };
                            };

                            const { number, unit } = splitValue(card.value);

                            const CardContent = (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass bg-background/40 rounded-[2rem] border border-border hover:border-gold/20 hover:shadow-2xl hover:shadow-gold/5 transition-all group flex flex-col h-full overflow-hidden"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-all duration-500 shadow-xl shadow-black/10 flex items-center justify-center relative`}>
                                                <div className="absolute inset-0 rounded-2xl bg-current opacity-0 group-hover:opacity-10 blur-md transition-opacity" />
                                                <card.icon className="w-5 h-5 relative z-10" />
                                            </div>
                                            {card.change !== null && card.change !== undefined && (
                                                <div className="pt-1">
                                                    <ChangeChip value={card.change} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 group-hover:text-muted-foreground/60 transition-colors">
                                                {card.label}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <h4 className="text-3xl sm:text-3xl font-heading text-foreground tracking-tighter leading-none group-hover:text-gold transition-colors duration-500">
                                                    {number}
                                                </h4>
                                                {unit && (
                                                    <span className="text-xs font-heading text-muted-foreground/40 uppercase tracking-widest group-hover:text-gold/50 transition-colors">
                                                        {unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer area with fixed height for alignment */}
                                    <div className="px-6 pb-5 pt-3 flex items-center border-t border-white/[0.03]">
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
                                                    "text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-black opacity-30 transition-all text-left",
                                                    card.subtextHref && "hover:text-gold hover:opacity-100 cursor-pointer"
                                                )}
                                            >
                                                {card.subtext}
                                            </button>
                                        ) : (
                                            <div className="h-0.5 w-6 bg-white/5 rounded-full" />
                                        )}
                                    </div>

                                    {card.href && (
                                        <Link
                                            href={(card.href as any)}
                                            className="absolute inset-0 z-0"
                                            aria-label={card.label}
                                        />
                                    )}
                                </motion.div>
                            );

                            return CardContent;

                            return CardContent;
                        })
                    }
                </section>


                {/* ── Sales Chart + Top Products ────────────────────────── */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <SalesChart
                            data={trend}
                            period={period}
                            loading={trendLoading}
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

                {/* Extra spacing */}
                <div className="h-4" />
            </div>
        </AuthGuard>
    );
}
