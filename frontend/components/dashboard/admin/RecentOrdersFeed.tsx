'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Loader2, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';

import { useTranslations } from 'next-intl';

export interface RecentOrderDto {
    id: string;
    code: string;
    customerName: string | null;
    finalAmount: number;
    status: string;
    channel: string;
    createdAt: string;
}

function formatVND(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
    return `${value}₫`;
}

const STATUS_META_KEY: Record<string, string> = {
    COMPLETED: 'status.completed',
    CANCELLED: 'status.cancelled',
    PROCESSING: 'status.processing',
    PENDING: 'status.pending',
    CONFIRMED: 'status.confirmed',
    SHIPPED: 'status.shipped',
};

const STATUS_ICONS: Record<string, { icon: React.ComponentType<any>; color: string }> = {
    COMPLETED: { icon: CheckCircle2, color: 'text-emerald-500' },
    CANCELLED: { icon: XCircle, color: 'text-red-500' },
    PROCESSING: { icon: Loader2, color: 'text-gold' },
    PENDING: { icon: Clock, color: 'text-muted-foreground' },
    CONFIRMED: { icon: CheckCircle2, color: 'text-blue-400' },
    SHIPPED: { icon: ArrowUpRight, color: 'text-indigo-400' },
};

interface RecentOrdersFeedProps {
    data: RecentOrderDto[];
    loading?: boolean;
}

export function RecentOrdersFeed({ data, loading }: RecentOrdersFeedProps) {
    const t = useTranslations('admin_dashboard');

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8"
        >
            <div className="flex items-start justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 rounded-2xl bg-secondary text-foreground shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-heading uppercase tracking-widest text-foreground truncate">
                            {t('recent_orders')}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
                            {t('live_order_feed')}
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/admin/orders"
                    className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap pt-1"
                >
                    {t('view_all')} <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center py-8">
                    {t('no_data')}
                </p>
            ) : (
                <div className="space-y-3">
                    {data.map((order, i) => {
                        const meta = STATUS_ICONS[order.status] ?? STATUS_ICONS.PENDING;
                        const statusLabelKey = STATUS_META_KEY[order.status] ?? STATUS_META_KEY.PENDING;
                        const StatusIcon = meta.icon;
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-all group cursor-pointer"
                            >
                                <StatusIcon className={`w-4 h-4 shrink-0 ${meta.color}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground group-hover:text-gold transition-colors truncate">
                                            {order.code}
                                        </p>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0 ${order.channel === 'POS'
                                            ? 'bg-indigo-500/10 text-indigo-400'
                                            : 'bg-gold/10 text-gold'
                                            }`}>
                                            {order.channel}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground truncate">
                                        {order.customerName || t('guest')} · {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-0.5">
                                    <span className="text-[10px] font-bold text-foreground">
                                        {formatVND(order.finalAmount)}
                                    </span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest opacity-60`}>
                                        {t(statusLabelKey as any)}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
