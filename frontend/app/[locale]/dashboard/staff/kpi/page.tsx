'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { BarChart3, Target, Award, TrendingUp, Package, DollarSign, Loader2, History, Store, Wallet, CreditCard, ChevronRight, MessageSquareQuote, Calculator } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { staffReportsService, type DailyReport, type DailyClosingHistory } from '@/services/staff-reports.service';
import { storesService, type Store as StoreType } from '@/services/stores.service';
import { DailyClosingWebDialog } from '@/components/dashboard/staff/DailyClosingWebDialog';
import { useTranslations, useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';

export default function StaffKPI() {
    const t = useTranslations('dashboard.kpi');
    const format = useFormatter();
    const [report, setReport] = useState<DailyReport | null>(null);
    const [history, setHistory] = useState<DailyClosingHistory[]>([]);
    const [stores, setStores] = useState<StoreType[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClosingOpen, setIsClosingOpen] = useState(false);

    const loadData = useCallback(async (storeId?: string) => {
        setLoading(true);
        try {
            const [reportData, historyData] = await Promise.all([
                staffReportsService.getDailyReport(undefined, storeId),
                staffReportsService.getClosingHistory(storeId)
            ]);
            setReport(reportData);
            setHistory(historyData);
        } catch (e: any) {
            setError(e.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const myStores = await storesService.getMyStores();
                setStores(myStores);
                if (myStores.length > 0) {
                    setSelectedStoreId(myStores[0].id);
                    void loadData(myStores[0].id);
                } else {
                    void loadData();
                }
            } catch (e) {
                void loadData();
            }
        };
        void init();
    }, [loadData]);

    const handleStoreChange = (id: string) => {
        setSelectedStoreId(id);
        void loadData(id);
    };

    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <main className="p-4 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
                <header className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px w-8 bg-gold/50" />
                            <span className="text-[10px] text-gold font-heading uppercase tracking-[0.4em]">{t('analytics_label') || 'PERFORMANCE ANALYTICS'}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter leading-none">{t('title')}</h1>
                        <p className="text-[10px] md:text-sm text-muted-foreground font-body uppercase tracking-widest leading-loose max-w-xl">
                            {t('subtitle_prefix')} {report?.date ? format.dateTime(new Date(report.date), { dateStyle: 'long' }) : format.dateTime(new Date(), { dateStyle: 'long' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsClosingOpen(true)}
                            className="flex items-center gap-3 bg-gold text-black px-6 py-3 rounded-xl font-heading text-[10px] uppercase tracking-[0.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20"
                        >
                            <Calculator className="w-4 h-4" />
                            {t('action_close') || 'CHỐT DOANH THU'}
                        </button>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/20 to-gold/0 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center gap-3 bg-background/50 backdrop-blur-xl border border-white/5 p-2 pr-4 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-gold" />
                                </div>
                                <select 
                                    className="bg-transparent border-none focus:ring-0 text-xs font-heading uppercase tracking-widest outline-none cursor-pointer min-w-[160px]"
                                    value={selectedStoreId}
                                    onChange={(e) => handleStoreChange(e.target.value)}
                                >
                                    <option value="" className="bg-black text-white">{t('all_stores') || 'TẤT CẢ CỬA HÀNG'}</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id} className="bg-black text-white">{s.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="mb-8 p-4 rounded-2xl border border-red-500/40 bg-red-500/5 text-xs text-red-500 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 text-muted-foreground text-sm gap-4">
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
                        <span className="font-heading uppercase tracking-widest text-[10px] animate-pulse">{t('loading')}</span>
                    </div>
                ) : report ? (
                    <div className="space-y-12 md:space-y-20">
                        {/* KPI Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Revenue Card */}
                            <div className="glass-premium p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group col-span-1 md:col-span-2">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-gold/10" />
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading mb-1">{t('cards.revenue')}</h3>
                                        <p className="text-4xl md:text-5xl font-heading gold-gradient tracking-tighter">
                                            {format.number(report.totalRevenue, { style: 'currency', currency: 'VND' })}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-gold" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 relative z-10 pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Wallet className="w-3.5 h-3.5" />
                                            <span className="text-[9px] uppercase tracking-widest font-bold">{t('cards.cash') || 'TIỀN MẶT'}</span>
                                        </div>
                                        <p className="text-xl font-heading text-foreground/80">{format.number(report.cashRevenue || 0, { style: 'currency', currency: 'VND' })}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span className="text-[9px] uppercase tracking-widest font-bold">{t('cards.transfer') || 'CHUYỂN KHOẢN'}</span>
                                        </div>
                                        <p className="text-xl font-heading text-foreground/80">{format.number(report.transferRevenue || 0, { style: 'currency', currency: 'VND' })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Card */}
                            <div className="glass-premium p-8 rounded-[2.5rem] border-white/5 group">
                                <div className="flex justify-between items-start mb-8">
                                    <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.completion_rate')}</h3>
                                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-gold" />
                                    </div>
                                </div>
                                <p className="text-4xl font-heading text-foreground mb-4">{report.completionRate}%</p>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gold rounded-full" style={{ width: `${report.completionRate}%` }} />
                                </div>
                            </div>

                            {/* Orders Card */}
                            <div className="glass-premium p-8 rounded-[2.5rem] border-white/5 group">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.total_orders')}</h3>
                                    <Package className="w-5 h-5 text-gold" />
                                </div>
                                <p className="text-4xl font-heading text-foreground mb-6">{report.totalOrders}</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] uppercase font-bold">
                                        <span className="text-success">{t('cards.successful')}</span>
                                        <span>{report.completedOrders}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] uppercase font-bold">
                                        <span className="text-red-400">{t('cards.cancelled')}</span>
                                        <span>{report.cancelledOrders}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
                            {/* Top Products */}
                            <div className="xl:col-span-2 space-y-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <BarChart3 className="w-6 h-6 text-gold" />
                                    <h2 className="font-heading text-2xl uppercase tracking-widest">{t('top_products.title')}</h2>
                                </div>
                                <div className="glass-premium rounded-[2.5rem] border-white/5 p-8 md:p-12">
                                    {report.topProducts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                                            <Package className="w-12 h-12 opacity-10" />
                                            <p className="text-[10px] uppercase tracking-widest">{t('top_products.empty')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10 md:space-y-14">
                                            {report.topProducts.map((p, i) => {
                                                const maxQty = report.topProducts[0].totalQuantity;
                                                const pct = maxQty > 0 ? (p.totalQuantity / maxQty) * 100 : 0;
                                                return (
                                                    <div key={i} className="group cursor-default">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-4">
                                                            <div className="flex items-center gap-6">
                                                                <span className="font-heading text-gold/30 text-2xl">0{i+1}</span>
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                                                    {p.imageUrl ? (
                                                                        <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                                            <Package className="w-6 h-6" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="font-heading text-sm md:text-lg uppercase tracking-wider block leading-tight mb-1 group-hover:text-gold transition-colors">{p.productName}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{p.variantName}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                                                                <span className="font-heading text-gold text-lg md:text-2xl block leading-none">{p.totalQuantity} <span className="text-[10px] text-gold/50">{t('top_products.sold_suffix')}</span></span>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{format.number(p.totalRevenue, { style: 'currency', currency: 'VND' })}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Closing History */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <History className="w-6 h-6 text-gold" />
                                    <h2 className="font-heading text-2xl uppercase tracking-widest">{t('history_title') || 'LỊCH SỬ CHỐT CA'}</h2>
                                </div>
                                <div className="space-y-4">
                                    {history.length === 0 ? (
                                        <div className="glass-premium p-12 rounded-[2rem] border-white/5 text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('history_empty') || 'CHƯA CÓ LỊCH SỬ CHỐT CA'}</p>
                                        </div>
                                    ) : (
                                        history.slice(0, 10).map((h, i) => (
                                            <div key={h.id} className="glass-premium p-6 rounded-[2rem] border-white/5 hover:border-gold/30 transition-all group animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-heading text-gold uppercase tracking-widest mb-1">
                                                            {format.dateTime(new Date(h.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-gold/50" />
                                                            {h.staff.fullName}
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest",
                                                        h.difference === 0 ? "bg-success/10 text-success" : "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {h.difference === 0 ? t('history.matched') : t('history.discrepant')}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                                    <div>
                                                        <span className="text-[8px] text-muted-foreground uppercase block mb-1">{t('history.actual_revenue')}</span>
                                                        <span className="font-heading text-sm">{format.number(h.actualCash, { style: 'currency', currency: 'VND' })}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                                                </div>
                                                {h.note && (
                                                    <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex gap-3">
                                                        <MessageSquareQuote className="w-3 h-3 text-gold shrink-0" />
                                                        <p className="text-[9px] text-muted-foreground italic leading-relaxed">{h.note}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {report && (
                    <DailyClosingWebDialog
                        isOpen={isClosingOpen}
                        onClose={() => setIsClosingOpen(false)}
                        report={{
                            totalRevenue: report.totalRevenue,
                            totalOrders: report.totalOrders,
                            cashRevenue: report.cashRevenue,
                            transferRevenue: report.transferRevenue
                        }}
                        onSuccess={() => loadData(selectedStoreId)}
                        storeId={selectedStoreId}
                    />
                )}
            </main>
        </AuthGuard>
    );
}
