'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { BarChart3, Target, Award, TrendingUp, Package, DollarSign, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { staffReportsService, type DailyReport } from '@/services/staff-reports.service';
import { useTranslations, useFormatter } from 'next-intl';

export default function StaffKPI() {
    const t = useTranslations('dashboard.kpi');
    const format = useFormatter();
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await staffReportsService.getDailyReport();
                setReport(data);
            } catch (e: any) {
                setError(e.message || t('errors.load_failed'));
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [t]);

    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <main className="p-4 sm:p-8">
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-[10px] md:text-sm text-muted-foreground font-body uppercase tracking-widest leading-loose">
                        {t('subtitle_prefix')} {report?.date ? format.dateTime(new Date(report.date), { dateStyle: 'medium' }) : format.dateTime(new Date(), { dateStyle: 'medium' })}
                    </p>
                </header>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl border border-red-500/40 bg-red-500/5 text-[10px] text-red-500">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('loading')}
                    </div>
                ) : report ? (
                    <div className="space-y-8 md:space-y-12">
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.revenue')}</h3>
                                    <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-gold truncate">{format.number(report.totalRevenue, { style: 'currency', currency: 'VND' })}</p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.total_orders')}</h3>
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-foreground">{report.totalOrders}</p>
                                <div className="grid grid-cols-3 gap-1 md:gap-2 mt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-bold">{t('cards.successful')}</span>
                                        <span className="text-[10px] md:text-xs font-heading text-success">{report.completedOrders}</span>
                                    </div>
                                    <div className="flex flex-col border-x border-border/30 px-1 md:px-2">
                                        <span className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-bold">{t('cards.cancelled')}</span>
                                        <span className="text-[10px] md:text-xs font-heading text-red-400">{report.cancelledOrders}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-bold">{t('cards.refunded')}</span>
                                        <span className="text-[10px] md:text-xs font-heading text-amber-400">{report.refundedOrders}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.avg_order_value')}</h3>
                                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-foreground truncate">{format.number(report.avgOrderValue, { style: 'currency', currency: 'VND' })}</p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.completion_rate')}</h3>
                                    <Target className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-foreground">
                                    {report.completionRate}%
                                </p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.cancel_rate')}</h3>
                                    <Award className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-red-400">
                                    {report.cancelRate}%
                                </p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('cards.refund_amount')}</h3>
                                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-2xl md:text-3xl font-heading text-amber-400 truncate">
                                    {format.number(report.totalRefundedAmount, { style: 'currency', currency: 'VND' })}
                                </p>
                            </div>
                        </div>

                        {/* Top products */}
                        <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-border p-6 md:p-10">
                            <div className="flex items-center gap-3 mb-6 md:mb-8">
                                <BarChart3 className="w-5 h-5 text-gold" />
                                <h2 className="font-heading text-sm md:text-lg uppercase tracking-widest">{t('top_products.title')}</h2>
                            </div>
                            {report.topProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">{t('top_products.empty')}</p>
                            ) : (
                                <div className="space-y-6 md:space-y-10">
                                    {report.topProducts.map((p, i) => {
                                        const maxQty = report.topProducts[0].totalQuantity;
                                        const pct = maxQty > 0 ? (p.totalQuantity / maxQty) * 100 : 0;
                                        return (
                                            <div key={i} className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden bg-secondary/20 border border-border/50 shrink-0">
                                                            {p.imageUrl ? (
                                                                <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                                    <Package className="w-4 h-4 md:w-5 md:h-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-heading text-[10px] md:text-sm uppercase tracking-wider block leading-tight">{p.productName}</span>
                                                            <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">{p.variantName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:flex-col sm:items-end">
                                                        <span className="font-heading text-gold text-sm md:text-xl block leading-tight">{p.totalQuantity} {t('top_products.sold_suffix')}</span>
                                                        <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">{format.number(p.totalRevenue, { style: 'currency', currency: 'VND' })}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1 md:h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gold rounded-full transition-all duration-1000 ease-out"
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
                ) : null}
            </main>
        </AuthGuard>
    );
}
