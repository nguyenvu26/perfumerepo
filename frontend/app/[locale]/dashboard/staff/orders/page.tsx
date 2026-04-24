'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Search, Eye, CheckCircle2, Clock, AlertCircle,
    Loader2, X, CreditCard, User, Calendar, RotateCcw, History
} from 'lucide-react';
import { staffOrdersService, type StaffPosOrder } from '@/services/staff-orders.service';
import { AuthGuard } from '@/components/auth/auth-guard';

function getStatusBadge(order: StaffPosOrder, t: any) {
    if (order.status === 'COMPLETED') {
        if (order.paymentStatus === 'REFUNDED') return { label: 'Hoàn trả toàn bộ', color: 'bg-red-500/10 border-red-500/20 text-red-500', icon: RotateCcw };
        if (order.paymentStatus === 'PARTIALLY_REFUNDED') return { label: 'Hoàn trả 1 phần', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500', icon: RotateCcw };
        return { label: t('status.completed'), color: 'bg-success/10 border-success/20 text-success', icon: CheckCircle2 };
    }
    if (order.paymentStatus === 'PAID') return { label: t('status.paid'), color: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: CreditCard };
    if (order.status === 'CANCELLED') return { label: t('status.cancelled'), color: 'bg-muted border-border text-muted-foreground', icon: AlertCircle };
    return { label: t('status.pending'), color: 'bg-warning/10 border-warning/20 text-warning', icon: Clock };
}

export default function StaffOrdersPage() {
    const t = useTranslations('dashboard.staff.orders');
    const format = useFormatter();
    const [orders, setOrders] = useState<StaffPosOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<StaffPosOrder | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadOrders = useCallback(async (search?: string, date?: string) => {
        setLoading(true);
        setError(null);
        try {
            let startDate: string | undefined;
            let endDate: string | undefined;

            if (date) {
                // date is YYYY-MM-DD from input[type=date]
                // Create dates in local time then convert to ISO (UTC)
                const start = new Date(`${date}T00:00:00`);
                const end = new Date(`${date}T23:59:59`);
                startDate = start.toISOString();
                endDate = end.toISOString();
            }

            const res = await staffOrdersService.list({ 
                take: 50, 
                search: search || undefined,
                startDate,
                endDate,
            });
            setOrders(res.data);
            setTotal(res.total);
        } catch (e: any) {
            setError(e.message || 'Lỗi tải danh sách');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadOrders(searchTerm, filterDate);
    }, [loadOrders, filterDate]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            void loadOrders(value);
        }, 400);
    };

    const handleViewDetail = async (orderId: string) => {
        setLoadingDetail(true);
        try {
            const detail = await staffOrdersService.getDetail(orderId);
            setSelectedOrder(detail);
        } catch {
            // fallback to the inline data
            const found = orders.find(o => o.id === orderId);
            if (found) setSelectedOrder(found);
        } finally {
            setLoadingDetail(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <div className="flex flex-col gap-6 md:gap-10 p-4 sm:p-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-tighter gold-gradient">{t('title')}</h1>
                        <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest leading-loose">{t('subtitle')}</p>
                    </div>
                </header>

                {error && (
                    <div className="mb-4 text-xs text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">
                        {error}
                    </div>
                )}

                {/* Orders Section */}
                <section className="glass rounded-[2rem] md:rounded-[3rem] border border-border shadow-sm overflow-hidden transition-all">
                    <div className="p-6 md:p-10 border-b border-border/50 flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                        <div className="w-full md:flex-1 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-12 md:pl-16 pr-4 py-3 md:py-4 bg-secondary/30 border border-border rounded-xl md:rounded-2xl text-[10px] md:text-xs outline-none focus:border-gold/50 transition-all font-heading"
                            />
                        </div>
                        <div className="flex w-full md:w-auto gap-3 items-center">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-secondary/30 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer"
                                />
                            </div>
                            <button 
                                onClick={() => { setFilterDate(''); setSearchTerm(''); loadOrders('', ''); }}
                                className="p-3 text-muted-foreground hover:text-gold hover:bg-gold/5 rounded-xl transition-all border border-transparent hover:border-gold/20 shrink-0"
                                title="Xóa bộ lọc"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto hidden md:block">
                        {loading ? (
                            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('loading')}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                {t('no_orders')}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground border-b border-border/50 transition-colors">
                                        <th className="p-10 pb-6">{t('table.code')}</th>
                                        <th className="pb-6">Ảnh</th>
                                        <th className="pb-6">{t('table.date')}</th>
                                        <th className="pb-6">{t('table.items')}</th>
                                        <th className="pb-6 text-center">{t('table.status')}</th>
                                        <th className="pb-6">{t('table.total')}</th>
                                        <th className="p-10 pb-6 text-right">{t('table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30 transition-colors">
                                    {orders.map((order) => {
                                        const firstItem = order.items[0];
                                        const itemSummary = firstItem
                                            ? `${firstItem.product?.name ?? t('table.product_fallback')} x${firstItem.quantity}${order.items.length > 1 ? ` ${t('table.more', { count: order.items.length - 1 })}` : ''
                                            }`
                                            : '—';
                                        const badge = getStatusBadge(order, t);
                                        const BadgeIcon = badge.icon;

                                        return (
                                            <tr key={order.id} className="group hover:bg-secondary/20 transition-all">
                                                <td className="p-10">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold tracking-widest font-heading">
                                                            {order.code}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold tracking-tight mt-1 uppercase">
                                                            {t('table.pos')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex -space-x-3 overflow-hidden p-1">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="relative w-10 h-10 rounded-full border-2 border-background overflow-hidden glass bg-secondary/50">
                                                                {item.variant?.product?.images?.[0]?.url ? (
                                                                    <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-full h-full p-2.5 text-muted-foreground/50" />
                                                                )}
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <div className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center bg-secondary/50 glass text-[10px] font-bold text-muted-foreground">
                                                                +{order.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm font-heading">
                                                        {format.dateTime(new Date(order.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-sm text-muted-foreground italic">
                                                        {itemSummary}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`inline-flex items-center gap-2 text-[9px] px-4 py-1.5 rounded-full font-bold uppercase border transition-all ${badge.color}`}>
                                                        <BadgeIcon size={12} />
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold font-heading tracking-wider">
                                                            {format.number(order.finalAmount - (order.refundAmount || 0), { style: 'currency', currency: 'VND' })}
                                                        </span>
                                                        {order.refundAmount > 0 && (
                                                            <span className="text-[9px] text-red-500 font-bold decoration-slice">
                                                                (-{format.number(order.refundAmount, { style: 'currency', currency: 'VND' })})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-10 text-right">
                                                    <button
                                                        onClick={() => handleViewDetail(order.id)}
                                                        className="p-3 text-muted-foreground hover:text-gold hover:bg-gold/5 rounded-2xl transition-all cursor-pointer"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-border/30">
                        {orders.map((order) => {
                            const badge = getStatusBadge(order, t);
                            const BadgeIcon = badge.icon;
                            return (
                                <div key={order.id} className="p-6 space-y-4 bg-secondary/10" onClick={() => handleViewDetail(order.id)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-widest text-gold uppercase mb-1">POS Order</p>
                                            <h3 className="font-heading text-sm uppercase tracking-wider">{order.code}</h3>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-[8px] px-3 py-1 rounded-full font-bold uppercase border ${badge.color}`}>
                                            <BadgeIcon size={10} />
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                        <span>{format.dateTime(new Date(order.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        <span className="text-foreground">{format.number(order.finalAmount - (order.refundAmount || 0), { style: 'currency', currency: 'VND' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2 overflow-hidden flex-1">
                                            {order.items.slice(0, 5).map((item, idx) => (
                                                <div key={idx} className="relative w-8 h-8 rounded-full border border-background overflow-hidden glass bg-secondary/50">
                                                    {item.variant?.product?.images?.[0]?.url ? (
                                                        <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-full h-full p-2 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                            ))}
                                            {order.items.length > 5 && (
                                                <div className="w-8 h-8 rounded-full border border-background flex items-center justify-center bg-secondary/50 glass text-[8px] font-bold text-muted-foreground">
                                                    +{order.items.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        <Eye className="text-gold opacity-50" size={14} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <footer className="p-6 md:p-10 pt-6 md:pt-8 border-t border-border/50 flex justify-between items-center text-[9px] md:text-[10px] font-bold uppercase tracking-[.2em] md:tracking-[.3em] text-muted-foreground">
                        <span className="tracking-widest">
                            {t('stats.showing', { count: orders.length, total: total })}
                        </span>
                    </footer>
                </section>

                {/* Order Detail Modal */}
                <AnimatePresence>
                    {selectedOrder && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedOrder(null)}
                        >
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-background border border-border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 m-4 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                            >
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>

                                {loadingDetail ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-gold" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-8">
                                            <h2 className="font-heading text-2xl uppercase tracking-tighter mb-1">
                                                {t('detail.title')} {selectedOrder.code}
                                            </h2>
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const badge = getStatusBadge(selectedOrder, t);
                                                    const BadgeIcon = badge.icon;
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 text-[9px] px-3 py-1 rounded-full font-bold uppercase border ${badge.color}`}>
                                                            <BadgeIcon size={10} />
                                                            {badge.label}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                    {format.dateTime(new Date(selectedOrder.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Customer / Staff Info */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {selectedOrder.staff && (
                                                <div className="glass rounded-2xl p-4 border-border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User className="w-3 h-3 text-gold" />
                                                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-heading">{t('detail.staff')}</span>
                                                    </div>
                                                    <p className="text-xs font-heading">{selectedOrder.staff.fullName ?? selectedOrder.staff.email}</p>
                                                </div>
                                            )}
                                            {selectedOrder.store && (
                                                <div className="glass rounded-2xl p-4 border-border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Package className="w-3 h-3 text-gold" />
                                                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-heading">{t('detail.store')}</span>
                                                    </div>
                                                    <p className="text-xs font-heading">{selectedOrder.store.name}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Items */}
                                        <div className="mb-6">
                                            <h3 className="font-heading text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{t('detail.items')}</h3>
                                            <div className="space-y-2">
                                                {selectedOrder.items.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-4 border-b border-border/20 pb-4">
                                                            <div className="w-12 h-12 rounded-xl border border-border/50 overflow-hidden glass flex-shrink-0">
                                                                {item.variant?.product?.images?.[0]?.url ? (
                                                                    <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-full h-full p-3 text-muted-foreground/30" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="font-heading text-[10px] uppercase tracking-widest block mb-0.5">
                                                                            {item.product?.name ?? item.variant?.product?.name ?? 'Product'}
                                                                        </span>
                                                                        {item.variant && (
                                                                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-tighter">
                                                                                {item.variant.name} • x{item.quantity}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-heading text-gold text-sm">
                                                                        {format.number(item.totalPrice, { style: 'currency', currency: 'VND' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="border-t border-border pt-4 mb-6 space-y-2">
                                            <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-heading">
                                                <span>{t('detail.subtotal')}</span>
                                                <span>{format.number(selectedOrder.totalAmount, { style: 'currency', currency: 'VND' })}</span>
                                            </div>
                                            {selectedOrder.discountAmount > 0 && (
                                                <div className="flex justify-between text-[10px] uppercase tracking-widest text-success font-heading">
                                                    <span>{t('detail.discount')}</span>
                                                    <span>-{format.number(selectedOrder.discountAmount, { style: 'currency', currency: 'VND' })}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-lg font-heading pt-2">
                                                <span className="uppercase tracking-tighter">{t('detail.total')}</span>
                                                <span className="text-gold">{format.number(selectedOrder.finalAmount, { style: 'currency', currency: 'VND' })}</span>
                                            </div>
                                        </div>

                                        {/* Payments */}
                                        {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="font-heading text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{t('detail.payments')}</h3>
                                                <div className="space-y-2">
                                                    {selectedOrder.payments.map((p) => (
                                                        <div key={p.id} className="flex justify-between items-center text-xs glass rounded-xl p-3 border-border">
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="w-3 h-3 text-gold" />
                                                                <span className="font-heading uppercase tracking-widest text-[10px]">{p.provider}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`text-[9px] uppercase font-bold ${p.status === 'PAID' ? 'text-success' : 'text-warning'
                                                                    }`}>{p.status}</span>
                                                                <span className="font-heading">{format.number(p.amount, { style: 'currency', currency: 'VND' })}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AuthGuard>
    );
}
