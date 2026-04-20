'use client';
 
import { AuthGuard } from '@/components/auth/auth-guard';
import { useTranslations, useFormatter } from 'next-intl';
import { useEffect, useState } from 'react';
import { DollarSign, Package, TrendingUp, Loader2 } from 'lucide-react';
import { staffReportsService, type DailyReport } from '@/services/staff-reports.service';

export default function StaffDashboard() {
    const t = useTranslations('dashboard.staff.home');
    const format = useFormatter();
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        const load = async () => {
            try {
                const data = await staffReportsService.getDailyReport();
                setReport(data);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);
 
    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <main className="p-4 sm:p-8">
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest leading-loose">{t('subtitle')}</p>
                </header>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center py-10 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('loading')}
                        </div>
                    ) : (
                        <>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('total_orders')}</h3>
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-gold/50" />
                                </div>
                                <p className="text-3xl md:text-4xl font-heading text-foreground">{report?.totalOrders ?? 0}</p>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">{report?.completedOrders ?? 0} {t('completed_suffix')}</p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('avg_order_value')}</h3>
                                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gold/50" />
                                </div>
                                <p className="text-3xl md:text-4xl font-heading text-foreground">{format.number(report?.avgOrderValue ?? 0, { style: 'currency', currency: 'VND' })}</p>
                            </div>
                            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-border hover:border-gold/30 transition-all bg-gold/5">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <h3 className="text-gold text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-heading">{t('today_revenue')}</h3>
                                    <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                </div>
                                <p className="text-3xl md:text-4xl font-heading text-gold">{format.number(report?.totalRevenue ?? 0, { style: 'currency', currency: 'VND' })}</p>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </AuthGuard>
    );
}
