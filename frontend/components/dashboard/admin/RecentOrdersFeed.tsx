'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Loader2, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';

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

const STATUS_META: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
    COMPLETED: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
    CANCELLED: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
    PROCESSING: { icon: Loader2, color: 'text-gold', label: 'Processing' },
    PENDING: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
    CONFIRMED: { icon: CheckCircle2, color: 'text-blue-400', label: 'Confirmed' },
    SHIPPED: { icon: ArrowUpRight, color: 'text-indigo-400', label: 'Shipped' },
};

interface RecentOrdersFeedProps {
    data: RecentOrderDto[];
    loading?: boolean;
}

export function RecentOrdersFeed({ data, loading }: RecentOrdersFeedProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="glass bg-background/40 rounded-[3rem] border border-border p-8 md:p-10"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-secondary text-foreground">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">Recent Orders</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Live order feed</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/admin/orders"
                    className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                    View all <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center py-8">
                    No orders yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {data.map((order, i) => {
                        const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
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
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground group-hover:text-gold transition-colors">
                                            {order.code}
                                        </p>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${order.channel === 'POS'
                                            ? 'bg-indigo-500/10 text-indigo-400'
                                            : 'bg-gold/10 text-gold'
                                            }`}>
                                            {order.channel}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground truncate">
                                        {order.customerName || 'Guest'} · {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-foreground shrink-0">
                                    {formatVND(order.finalAmount)}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
