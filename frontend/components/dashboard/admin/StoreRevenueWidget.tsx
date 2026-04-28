'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, TrendingUp, Calendar, Clock, ChevronDown, History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface StoreDto {
    id: string;
    name: string;
}

interface StoreRevenueData {
    today: number;
    week: number;
    month: number;
}

export function StoreRevenueWidget() {
    const t = useTranslations('admin_dashboard');
    const [stores, setStores] = useState<StoreDto[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [revenue, setRevenue] = useState<StoreRevenueData | null>(null);
    const [loading, setLoading] = useState(false);
    const [storesLoading, setStoresLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data } = await api.get<StoreDto[]>('/stores');
                setStores(data);
                if (data.length > 0) {
                    setSelectedStoreId(data[0].id);
                }
            } catch (e) {
                console.error('Failed to fetch stores', e);
            } finally {
                setStoresLoading(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        if (!selectedStoreId) return;

        const fetchRevenue = async () => {
            try {
                setLoading(true);
                const { data } = await api.get<StoreRevenueData>('/analytics/store-revenue', {
                    params: { storeId: selectedStoreId }
                });
                setRevenue(data);
            } catch (e) {
                console.error('Failed to fetch store revenue', e);
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, [selectedStoreId]);

    const formatPrice = (v: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    };

    if (storesLoading) return (
        <div className="glass bg-background/40 rounded-[2.5rem] border border-border p-8 animate-pulse h-64" />
    );

    return (
        <div className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8 hover:border-gold/20 transition-all flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/5">
                        <Store className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                            {t('revenue_by_store')}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-60">
                            {t('revenue_by_store_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="relative min-w-[200px] flex items-center gap-3">
                    <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="flex-1 appearance-none bg-background/40 border border-gold/10 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-gold/40 transition-all cursor-pointer pr-10"
                    >
                        {stores.map(s => (
                            <option key={s.id} value={s.id} className="bg-background text-foreground uppercase">{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gold/40 absolute right-[68px] top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    <Link 
                        href="/dashboard/admin/daily-closing"
                        className="p-3 rounded-xl bg-gold text-black hover:bg-gold/80 transition-colors shadow-lg shadow-gold/20"
                        title={t('view_closing_history')}
                    >
                        <History className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
                        ))
                    ) : revenue && (
                        <>
                            <RevenueCard 
                                label={t('today')} 
                                value={revenue.today} 
                                icon={Clock} 
                                color="text-emerald-400" 
                                delay={0.1}
                            />
                            <RevenueCard 
                                label={t('this_week')} 
                                value={revenue.week} 
                                icon={Calendar} 
                                color="text-gold" 
                                delay={0.2}
                            />
                            <RevenueCard 
                                label={t('this_month')} 
                                value={revenue.month} 
                                icon={TrendingUp} 
                                color="text-violet-400" 
                                delay={0.3}
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function RevenueCard({ label, value, icon: Icon, color, delay }: { label: string, value: number, icon: any, color: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay }}
            className="p-6 rounded-[2rem] bg-background/20 border border-white/5 hover:border-gold/10 transition-all group"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-xl bg-background/40", color)}>
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                    {label}
                </span>
            </div>
            <div className="text-lg font-heading tracking-tighter leading-none group-hover:scale-105 transition-transform origin-left">
                {new Intl.NumberFormat('vi-VN').format(value)}<span className="text-[10px] ml-1 opacity-50">₫</span>
            </div>
        </motion.div>
    );
}
