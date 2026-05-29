'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
    BrainCircuit, Activity, Clock, AlertCircle, 
    Search, Filter, ChevronLeft, ChevronRight,
    Eye, Cpu, ArrowUpRight, ArrowDownRight,
    BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell
} from 'recharts';
import { AuthGuard } from '@/components/auth/auth-guard';
import { aiService } from '@/services/ai.service';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = ['#C5A059', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

function prettyJson(raw: string | undefined | null, fallback = '{}'): string {
    if (!raw?.trim()) return fallback;
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
}

function colorizeJsonLine(line: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let key = 0;

    const push = (text: string, className: string) => {
        if (text) nodes.push(<span key={key++} className={className}>{text}</span>);
    };

    const indent = line.match(/^\s*/)?.[0] ?? '';
    push(indent, '');
    let rest = line.slice(indent.length);

    const keyMatch = rest.match(/^("(?:\\.|[^"\\])*")(\s*:\s*)([\s\S]*)$/);
    if (keyMatch) {
        push(keyMatch[1], 'text-sky-700 dark:text-sky-400 font-medium');
        push(keyMatch[2], 'text-stone-400 dark:text-stone-500');
        rest = keyMatch[3];
    }

    const tokenRe = /("(?:\\.|[^"\\])*")|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[[\]{}(),]|,|\s+/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRe.exec(rest)) !== null) {
        const token = match[0];
        if (/^\s+$/.test(token)) push(token, '');
        else if (token.startsWith('"')) push(token, 'text-emerald-700 dark:text-emerald-400');
        else if (/^(true|false|null)$/.test(token)) push(token, 'text-violet-600 dark:text-violet-400');
        else if (/^-?\d/.test(token)) push(token, 'text-amber-700 dark:text-amber-400');
        else if (/^[[\]{}(),]$/.test(token)) push(token, 'text-stone-400 dark:text-stone-500');
        else push(token, 'text-stone-700 dark:text-stone-300');
    }

    return nodes;
}

function JsonBlock({ content, tone = 'neutral' }: { content: string; tone?: 'neutral' | 'error' }) {
    const formatted = prettyJson(content, tone === 'error' ? '' : '{}');

    if (tone === 'error' && !formatted.trim()) {
        return (
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed break-words">
                {content || '—'}
            </p>
        );
    }

    return (
        <pre className="text-[12px] sm:text-[13px] font-mono leading-[1.65] overflow-auto max-h-[42vh] sm:max-h-[48vh] custom-scrollbar whitespace-pre-wrap break-words">
            {formatted.split('\n').map((line, i) => (
                <span key={i} className="block hover:bg-black/[0.03] dark:hover:bg-white/[0.03] -mx-1 px-1 rounded">
                    {colorizeJsonLine(line)}
                </span>
            ))}
        </pre>
    );
}

export default function AiLogsPage() {
    const t = useTranslations('dashboard.ai_logs');
    const commonT = useTranslations('common');
    
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes] = await Promise.all([
                aiService.getStats(),
                aiService.getLogs({ page, type: filterType, status: filterStatus })
            ]);
            setStats(statsRes);
            setLogs(logsRes.data);
            setTotal(logsRes.meta.total);
        } catch (error) {
            console.error('Failed to fetch AI logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, filterType, filterStatus]);

    const statCards = [
        { 
            key: 'total_requests', 
            variant: 'total_requests_desc',
            value: stats?.total || 0, 
            icon: Activity, 
            color: 'text-gold'
        },
        { 
            key: 'success_rate', 
            variant: 'success_rate_desc',
            value: `${stats?.successRate?.toFixed(1) || 0}%`, 
            icon: BrainCircuit, 
            color: 'text-emerald-500'
        },
        { 
            key: 'avg_latency', 
            variant: 'avg_latency_desc',
            value: `${stats?.avgDuration || 0}ms`, 
            icon: Clock, 
            color: 'text-blue-500'
        },
        { 
            key: 'failed_requests', 
            variant: 'failed_requests_desc',
            value: (stats?.total - (stats?.total * stats?.successRate / 100))?.toFixed(0) || 0, 
            icon: AlertCircle, 
            color: 'text-red-500'
        },
    ];

    const typeData = stats?.typeBreakdown ? Object.entries(stats.typeBreakdown).map(([name, value]) => ({
        name: t(`types.${name}` as any),
        value
    })) : [];

    return (
        <AuthGuard allowedRoles={['admin']}>
            <main className="p-4 sm:p-8 pb-20 max-w-[1600px] mx-auto">
                <header className="mb-8 sm:mb-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">
                            {t('title')}
                        </h1>

                    </motion.div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-4 sm:p-6 lg:p-8 rounded-[1.75rem] sm:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group relative overflow-hidden min-h-[150px]"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                            <div className="flex justify-between items-start gap-2 mb-5 sm:mb-6">
                                <div className={`p-3 sm:p-4 rounded-2xl bg-secondary ${stat.color} group-hover:scale-110 transition-transform shadow-sm shrink-0`}>
                                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="hidden sm:flex items-center gap-1 text-[9px] font-heading px-3 py-1.5 rounded-full glass border-border font-bold uppercase tracking-widest text-muted-foreground">
                                    {t(`stats.${stat.variant}` as any)}
                                </div>
                            </div>
                            <h3 className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-widest sm:tracking-[0.3em] font-heading mb-2 leading-snug">
                                {t(`stats.${stat.key}` as any)}
                            </h3>
                            <p className="text-2xl sm:text-3xl font-heading text-foreground tracking-tighter break-all">
                                {loading ? '...' : stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Usage Trend */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 glass p-8 rounded-[3rem] border-border overflow-hidden"
                    >
                        <h3 className="text-lg font-heading mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-gold" />
                            {t('usage_trend')}
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.chartData || []}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#888888" 
                                        fontSize={10} 
                                        tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                                    />
                                    <YAxis stroke="#888888" fontSize={10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#C5A059" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorTotal)" 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="success" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        fillOpacity={0}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Type Distribution */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass p-8 rounded-[3rem] border-border"
                    >
                        <h3 className="text-lg font-heading mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <PieIcon className="w-5 h-5 text-gold" />
                            {t('type_distribution')}
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {typeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Logs Table */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass p-4 sm:p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border-border bg-background/20 mb-8"
                >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 sm:mb-10">
                        <h3 className="text-lg sm:text-xl font-heading uppercase tracking-tight sm:tracking-[0.2em] flex items-center gap-3">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-gold shrink-0" />
                            {t('recent_logs')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto">
                            <select 
                                className="glass w-full px-4 py-3 sm:py-2 rounded-xl text-xs uppercase tracking-widest outline-none border-border focus:border-gold bg-white/70 dark:bg-background"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="">{t('table.type')}</option>
                                {Object.keys(t.raw('types')).map(type => (
                                    <option key={type} value={type}>{t(`types.${type}` as any)}</option>
                                ))}
                            </select>
                            <select 
                                className="glass w-full px-4 py-3 sm:py-2 rounded-xl text-xs uppercase tracking-widest outline-none border-border focus:border-gold bg-white/70 dark:bg-background"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">{t('table.status')}</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILED">FAILED</option>
                            </select>
                        </div>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {loading && logs.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-36 rounded-[1.5rem] bg-white/50 dark:bg-white/5 border border-border animate-pulse" />
                            ))
                        ) : logs.length === 0 ? (
                            <div className="h-40 rounded-[1.5rem] border border-border bg-white/50 dark:bg-white/[0.03] flex items-center justify-center text-muted-foreground uppercase tracking-widest text-xs text-center px-4">
                                {t('no_logs')}
                            </div>
                        ) : logs.map((log) => (
                            <article
                                key={log.id}
                                className="rounded-[1.5rem] border border-border bg-white/80 dark:bg-white/[0.03] p-4 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.75)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-mono text-muted-foreground">
                                            {format(new Date(log.createdAt), 'HH:mm:ss dd/MM')}
                                        </p>
                                        <h4 className="mt-2 text-sm font-heading font-bold uppercase tracking-wide text-foreground leading-snug">
                                            {t(`types.${log.type}` as any)}
                                        </h4>
                                    </div>
                                    <Badge className={cn(
                                        "shrink-0 text-[9px] uppercase tracking-wide rounded-full px-3",
                                        log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                    )}>
                                        {log.status}
                                    </Badge>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl border border-border/60 bg-stone-50/80 dark:bg-white/[0.04] p-3 min-w-0">
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">{t('table.model')}</p>
                                        <p className="mt-1 text-[11px] font-mono font-bold text-foreground break-all">
                                            {log.model}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-stone-50/80 dark:bg-white/[0.04] p-3 min-w-0">
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">{t('table.duration')}</p>
                                        <p className={cn(
                                            "mt-1 text-[12px] font-mono font-bold",
                                            log.duration > 2000 ? "text-amber-500" : "text-emerald-500"
                                        )}>
                                            {log.duration}ms
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="min-w-0 text-[11px] text-muted-foreground truncate">
                                        {log.user?.fullName || commonT('anonymous_user') || 'Guest'}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedLog(log)}
                                        className="shrink-0 hover:text-gold transition-colors px-3"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[980px]">
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('table.time')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('table.type')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('table.model')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('table.user')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center">{t('table.duration')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center">{t('table.status')}</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-right">{t('table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell colSpan={7} className="h-16 bg-white/5 rounded-xl my-2" />
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground uppercase tracking-widest text-xs">
                                            {t('no_logs')}
                                        </TableCell>
                                    </TableRow>
                                ) : logs.map((log) => (
                                    <TableRow key={log.id} className="border-border hover:bg-white/5 transition-colors group">
                                        <TableCell className="text-[11px] font-mono whitespace-nowrap text-muted-foreground">
                                            {format(new Date(log.createdAt), 'HH:mm:ss dd/MM')}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-foreground">
                                                {t(`types.${log.type}` as any)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] uppercase font-mono tracking-tighter bg-secondary/30">
                                                {log.model}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[11px] text-muted-foreground max-w-[150px] truncate">
                                            {log.user?.fullName || commonT('anonymous_user') || 'Guest'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={cn(
                                                    "text-[11px] font-mono font-bold",
                                                    log.duration > 2000 ? "text-amber-500" : "text-emerald-500"
                                                )}>
                                                    {log.duration}ms
                                                </span>
                                                <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn("h-full", log.duration > 2000 ? "bg-amber-500" : "bg-emerald-500")}
                                                        style={{ width: `${Math.min(100, (log.duration / 5000) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "text-[9px] uppercase tracking-widest rounded-full px-3",
                                                log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                                className="hover:text-gold transition-colors p-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-10 px-1 sm:px-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium text-center sm:text-left">
                            {t('showing_count', { 
                                start: (page - 1) * 10 + 1, 
                                end: Math.min(page * 10, total), 
                                total 
                            } as any)}
                        </p>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-xl border-border hover:bg-gold hover:text-primary-foreground disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 10 >= total}
                                className="rounded-xl border-border hover:bg-gold hover:text-primary-foreground disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Detail Dialog */}
                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="w-[calc(100vw-1.25rem)] sm:w-full max-w-3xl max-h-[92vh] p-5 sm:p-8 gap-0 overflow-hidden flex flex-col rounded-2xl sm:rounded-[2rem] border-border bg-white dark:bg-zinc-950 shadow-2xl">
                        <DialogHeader className="shrink-0 mb-4 sm:mb-5 pr-10 text-left space-y-3">
                            <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                                {t('detail.title')}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[10px] max-w-full truncate bg-stone-50 dark:bg-zinc-900 border-border"
                                    title={selectedLog?.id}
                                >
                                    ID: {selectedLog?.id}
                                </Badge>
                                <Badge className={cn(
                                    'text-[10px] uppercase tracking-wide shrink-0',
                                    selectedLog?.status === 'SUCCESS'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                                        : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25'
                                )}>
                                    {selectedLog?.status}
                                </Badge>
                                {selectedLog?.type && (
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide shrink-0">
                                        {t(`types.${selectedLog.type}` as any)}
                                    </Badge>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6 pr-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                <section className="space-y-2.5 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                            <Cpu className="w-3.5 h-3.5" />
                                        </span>
                                        {t('detail.request')}
                                    </h4>
                                    <div className="rounded-xl border border-stone-200/90 dark:border-white/10 bg-stone-50/95 dark:bg-zinc-900/80 p-4 sm:p-5 shadow-inner">
                                        <JsonBlock content={selectedLog?.request} />
                                    </div>
                                </section>

                                <section className="space-y-2.5 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                                        <span className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-lg',
                                            selectedLog?.status === 'FAILED'
                                                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                        )}>
                                            <Activity className="w-3.5 h-3.5" />
                                        </span>
                                        {selectedLog?.status === 'SUCCESS' ? t('detail.response') : t('detail.error')}
                                    </h4>
                                    <div className={cn(
                                        'rounded-xl border p-4 sm:p-5 shadow-inner',
                                        selectedLog?.status === 'FAILED'
                                            ? 'border-red-200/80 dark:border-red-500/25 bg-red-50/80 dark:bg-red-950/30'
                                            : 'border-stone-200/90 dark:border-white/10 bg-stone-50/95 dark:bg-zinc-900/80'
                                    )}>
                                        {selectedLog?.status === 'FAILED' ? (
                                            <JsonBlock
                                                tone="error"
                                                content={selectedLog?.errorMessage || t('detail.unknown_error')}
                                            />
                                        ) : selectedLog?.response ? (
                                            <JsonBlock content={selectedLog.response} />
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">{t('detail.no_output')}</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-border">
                                <div className="rounded-xl border border-border/70 bg-stone-50/80 dark:bg-zinc-900/50 px-4 py-3">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                                        {t('detail.velocity')}
                                    </span>
                                    <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                                        {selectedLog?.duration}
                                        <span className="text-sm font-medium text-muted-foreground ml-0.5">ms</span>
                                    </span>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-stone-50/80 dark:bg-zinc-900/50 px-4 py-3 min-w-0">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                                        {t('detail.model')}
                                    </span>
                                    <span className="text-sm sm:text-base font-mono font-semibold text-foreground break-all">
                                        {selectedLog?.model}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-stone-50/80 dark:bg-zinc-900/50 px-4 py-3 sm:col-span-1">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                                        {t('detail.origin')}
                                    </span>
                                    <span className="text-sm sm:text-base font-medium text-foreground">
                                        {selectedLog?.createdAt
                                            ? format(new Date(selectedLog.createdAt), 'HH:mm:ss dd/MM/yyyy')
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </main>
        </AuthGuard>
    );
}

