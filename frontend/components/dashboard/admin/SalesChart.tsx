'use client';

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useState } from 'react';

import { useTranslations } from 'next-intl';

export interface SalesTrendPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface SalesChartProps {
    data: SalesTrendPoint[];
    period: 'week' | 'month' | 'year';
    onPeriodChange: (p: 'week' | 'month' | 'year') => void;
    loading?: boolean;
}

const PERIODS = [
    { key: 'week', label: '7D' },
    { key: 'month', label: '30D' },
    { key: 'year', label: '1Y' },
] as const;

/** Format a date key (YYYY-MM-DD or YYYY-MM) to a short readable label */
function formatDateLabel(dateStr: string, period: 'week' | 'month' | 'year'): string {
    if (period === 'year') {
        const [, month] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[parseInt(month) - 1] ?? dateStr;
    }
    // For week/month, show MM/DD
    const parts = dateStr.split('-');
    return `${parts[1]}/${parts[2]}`;
}

/** Format currency in compact VND */
function formatVND(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
}

// Custom tooltip with dark glassmorphism style
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass bg-background/90 border border-border rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground capitalize">{entry.name}:</span>
                    <span className="font-bold text-foreground">
                        {entry.name === 'revenue' ? `₫${formatVND(entry.value)}` : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

export function SalesChart({ data, period, onPeriodChange, loading }: SalesChartProps) {
    const t = useTranslations('admin_dashboard');
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');

    const formatted = data.map(d => ({
        ...d,
        label: formatDateLabel(d.date, period),
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gold/10 text-gold">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">
                            {t('sales_overview')}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {t('revenue_trend')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Chart type toggle */}
                    <div className="flex rounded-xl border border-border overflow-hidden">
                        <button
                            onClick={() => setChartType('area')}
                            className={`p-2 transition-all ${chartType === 'area' ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Area chart"
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-2 transition-all ${chartType === 'bar' ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Bar chart"
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Period selector */}
                    <div className="flex rounded-xl border border-border overflow-hidden">
                        {PERIODS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onPeriodChange(key)}
                                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${period === key
                                    ? 'bg-gold text-black'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart area */}
            {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {t('loading')}
                        </p>
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                        {t('no_sales_data')}
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'area' ? (
                        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 9, fill: '#888', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                yAxisId="revenue"
                                orientation="left"
                                tick={{ fontSize: 9, fill: '#888', fontFamily: 'inherit' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₫${formatVND(v)}`}
                                width={55}
                            />
                            <YAxis
                                yAxisId="orders"
                                orientation="right"
                                tick={{ fontSize: 9, fill: '#888', fontFamily: 'inherit' }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '16px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                            <Area
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#C5A059"
                                strokeWidth={2}
                                fill="url(#revenueGrad)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#C5A059', stroke: '#000', strokeWidth: 2 }}
                            />
                            <Area
                                yAxisId="orders"
                                type="monotone"
                                dataKey="orders"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#ordersGrad)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#6366f1', stroke: '#000', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 9, fill: '#888', fontFamily: 'inherit' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                yAxisId="revenue"
                                orientation="left"
                                tick={{ fontSize: 9, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₫${formatVND(v)}`}
                                width={55}
                            />
                            <YAxis
                                yAxisId="orders"
                                orientation="right"
                                tick={{ fontSize: 9, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '16px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                            <Bar
                                yAxisId="revenue"
                                dataKey="revenue"
                                fill="#C5A059"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                                opacity={0.8}
                            />
                            <Bar
                                yAxisId="orders"
                                dataKey="orders"
                                fill="#6366f1"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                                opacity={0.8}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            )}
        </motion.div>
    );
}
