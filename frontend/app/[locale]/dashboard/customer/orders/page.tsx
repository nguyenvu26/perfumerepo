'use client';
 
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import {
    MapPin,
    Truck,
    PackageCheck,
    Calendar,
    ChevronRight,
    Loader2,
    Clock,
    XCircle,
    Receipt
} from 'lucide-react';
import { orderService, type Order } from '@/services/order.service';
import { AuthGuard } from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';
 
export default function CustomerOrdersPage() {
    const t = useTranslations('dashboard.customer.orders');
    const tFeatured = useTranslations('featured');
    const locale = useLocale();
    const format = useFormatter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
 
    const STATUS_CONFIG = {
        PENDING: { label: t('status.pending'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
        CONFIRMED: { label: t('status.confirmed'), color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: PackageCheck },
        PROCESSING: { label: t('status.processing'), color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: PackageCheck },
        SHIPPED: { label: t('status.shipped'), color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: Truck },
        COMPLETED: { label: t('status.completed'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: PackageCheck },
        CANCELLED: { label: t('status.cancelled'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    };
 
    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderService.listMy();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch my orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);
 
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const formatCurrency = (amount: number) => {
        return format.number(amount, {
            style: 'currency',
            currency: tFeatured('currency_code') || 'VND',
            maximumFractionDigits: 0
        });
    };
 
    const tCommon = useTranslations('common');

    return (
        <AuthGuard allowedRoles={['customer', 'staff', 'admin']}>
            <div className="flex flex-col gap-10 py-10 px-8">
                <header className="mb-2">
                    <h1 className="text-4xl md:text-5xl font-heading gold-gradient mb-2 uppercase tracking-tighter transition-colors">
                        {t('title')}
                    </h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold">
                        {t('subtitle')}
                    </p>
                </header>

                <div className="space-y-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-gold" size={40} />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-20 text-center space-y-6 glass rounded-[3rem] border border-border bg-background/40">
                            <Receipt className="mx-auto text-muted-foreground/20" size={80} strokeWidth={1} />
                            <div className="space-y-2">
                                <h3 className="text-xl font-heading text-foreground uppercase tracking-widest">{t('empty_title')}</h3>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('empty_desc')}</p>
                            </div>
                        </div>
                    ) : (
                        orders.map((order, i) => {
                            const style = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                            const StatusIcon = style.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass bg-background/40 rounded-[3rem] p-8 border border-border shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Order Brief */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                                <div>
                                                    <span className="text-[9px] font-bold text-gold uppercase tracking-[.4em] mb-2 block">
                                                        {t('order_label')} {order.code}
                                                    </span>
                                                    <h2 className="text-2xl font-heading text-foreground mb-1 transition-colors uppercase tracking-widest">
                                                        {order.items?.[0]?.product?.name || t('fragrance_acquisition')}
                                                        {order.items && order.items.length > 1 && <span className="text-sm italic text-muted-foreground ml-2"> {t('more_suffix', { count: order.items.length - 1 })}</span>}
                                                    </h2>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        {new Date(order.createdAt!).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-heading text-foreground block mb-2">
                                                        {formatCurrency(order.finalAmount)}
                                                    </span>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 text-[8px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border",
                                                        style.color
                                                    )}>
                                                        <StatusIcon size={12} />
                                                        {style.label}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6 border-t border-border pt-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2.5 bg-secondary/50 rounded-2xl text-muted-foreground border border-border">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('destination')}</h4>
                                                        <p className="text-[10px] text-foreground font-medium leading-relaxed uppercase tracking-tight line-clamp-2">
                                                            {order.shippingAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-end justify-end">
                                                    <Link
                                                        href={`/dashboard/customer/orders/${order.id}`}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-gold transition-colors group"
                                                    >
                                                        {t('view_details')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                <footer className="mt-10 pt-10 border-t border-border text-center">
                    <p className="text-[8px] font-bold uppercase tracking-[.4em] text-muted-foreground">
                        {tCommon('engine_version')}
                    </p>
                </footer>
            </div>
        </AuthGuard>
    );
}
