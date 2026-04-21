'use client';

import { useState, useEffect } from 'react';
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
            value: stats?.total || 0, 
            icon: Activity, 
            color: 'text-gold',
            desc: '+5.2% from last week' 
        },
        { 
            key: 'success_rate', 
            value: `${stats?.successRate?.toFixed(1) || 0}%`, 
            icon: BrainCircuit, 
            color: 'text-emerald-500',
            desc: 'Optimal Performance'
        },
        { 
            key: 'avg_latency', 
            value: `${stats?.avgDuration || 0}ms`, 
            icon: Clock, 
            color: 'text-blue-500',
            desc: 'Under 500ms target'
        },
        { 
            key: 'failed_requests', 
            value: (stats?.total - (stats?.total * stats?.successRate / 100))?.toFixed(0) || 0, 
            icon: AlertCircle, 
            color: 'text-red-500',
            desc: 'Requires intervention'
        },
    ];

    const typeData = stats?.typeBreakdown ? Object.entries(stats.typeBreakdown).map(([name, value]) => ({
        name: t(`types.${name}` as any),
        value
    })) : [];

    return (
        <AuthGuard allowedRoles={['admin']}>
            <main className="p-4 sm:p-8 pb-20 max-w-[1600px] mx-auto">
                <header className="mb-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">
                            {t('title')}
                        </h1>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
                            {t('subtitle')}
                        </p>
                    </motion.div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-secondary ${stat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-heading px-3 py-1.5 rounded-full glass border-border font-bold uppercase tracking-widest text-muted-foreground">
                                    {stat.desc}
                                </div>
                            </div>
                            <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading mb-2">
                                {t(`stats.${stat.key}` as any)}
                            </h3>
                            <p className="text-3xl font-heading text-foreground tracking-tighter">
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#ffffff40" 
                                        fontSize={10} 
                                        tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                                    />
                                    <YAxis stroke="#ffffff40" fontSize={10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #C5A05930', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px' }}
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
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
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
                    className="glass p-10 rounded-[3rem] border-border bg-background/20 mb-8"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                        <h3 className="text-xl font-heading uppercase tracking-[0.2em] flex items-center gap-3">
                            <Activity className="w-6 h-6 text-gold" />
                            {t('recent_logs')}
                        </h3>
                        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                            <select 
                                className="glass px-4 py-2 rounded-xl text-xs uppercase tracking-widest outline-none border-border focus:border-gold"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="">{t('table.type')}</option>
                                {Object.keys(t.raw('types')).map(type => (
                                    <option key={type} value={type}>{t(`types.${type}` as any)}</option>
                                ))}
                            </select>
                            <select 
                                className="glass px-4 py-2 rounded-xl text-xs uppercase tracking-widest outline-none border-border focus:border-gold"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">{t('table.status')}</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILED">FAILED</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
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
                                            No logs found matching filters
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
                    <div className="flex items-center justify-between mt-10 px-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
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
                    <DialogContent className="glass border-gold/20 max-w-4xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-[2rem]">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-heading gold-gradient uppercase tracking-widest">
                                {t('detail.title')}
                            </DialogTitle>
                            <div className="flex gap-4 mt-2">
                                <Badge variant="outline" className="font-mono text-[10px]">ID: {selectedLog?.id}</Badge>
                                <Badge className={cn(
                                    selectedLog?.status === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                                )}>
                                    {selectedLog?.status}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase tracking-[0.3em] font-heading text-gold flex items-center gap-2">
                                    <Cpu className="w-4 h-4" />
                                    {t('detail.request')}
                                </h4>
                                <div className="glass p-6 rounded-2xl border-white/5 bg-black/40 overflow-hidden">
                                    <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed no-scrollbar max-h-[400px] overflow-y-auto">
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(selectedLog?.request || '{}');
                                                return JSON.stringify(parsed, null, 2);
                                            } catch (e) {
                                                return selectedLog?.request;
                                            }
                                        })()}
                                    </pre>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase tracking-[0.3em] font-heading text-emerald-500 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    {selectedLog?.status === 'SUCCESS' ? t('detail.response') : t('detail.error')}
                                </h4>
                                <div className={cn(
                                    "glass p-6 rounded-2xl border-white/5 overflow-hidden",
                                    selectedLog?.status === 'FAILED' ? "bg-red-500/5 border-red-500/20" : "bg-black/40"
                                )}>
                                    {selectedLog?.status === 'FAILED' ? (
                                        <p className="text-[11px] font-mono text-red-400 break-all leading-relaxed">
                                            {selectedLog?.errorMessage || 'Unknown Error Event'}
                                        </p>
                                    ) : (
                                        <div className="text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap break-all leading-relaxed no-scrollbar max-h-[400px] overflow-y-auto italic">
                                            {selectedLog?.response || 'No output generated'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 flex gap-12">
                            <div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Execution Velocity</span>
                                <span className="text-xl font-heading text-gold italic">{selectedLog?.duration}ms</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Neural Model</span>
                                <span className="text-xl font-heading text-foreground italic uppercase tracking-tighter">{selectedLog?.model}</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Temporal Origin</span>
                                <span className="text-xl font-heading text-muted-foreground italic">
                                    {selectedLog?.createdAt ? format(new Date(selectedLog.createdAt), 'HH:mm:ss dd MMM yyyy') : '-'}
                                </span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </main>
        </AuthGuard>
    );
}

