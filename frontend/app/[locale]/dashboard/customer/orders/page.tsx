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
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [take, setTake] = useState(10);
    const [loading, setLoading] = useState(true);
    const [refundModalOrderId, setRefundModalOrderId] = useState<string | null>(null);
    const [loadingRefundInfo, setLoadingRefundInfo] = useState(false);
    const [savingRefundInfo, setSavingRefundInfo] = useState(false);
    const [refundInfo, setRefundInfo] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        note: '',
    });
 
    const STATUS_CONFIG = {
        PENDING: { label: t('status.pending'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
        CONFIRMED: { label: t('status.confirmed'), color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: PackageCheck },
        PROCESSING: { label: t('status.processing'), color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: PackageCheck },
        SHIPPED: { label: t('status.shipped'), color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: Truck },
        COMPLETED: { label: t('status.completed'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: PackageCheck },
        CANCELLED: { label: t('status.cancelled'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    };
 
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await orderService.listMy({ skip, take });
            setOrders(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error('Failed to fetch my orders:', error);
        } finally {
            setLoading(false);
        }
    }, [skip, take]);
 
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const currentPage = Math.floor(skip / take) + 1;
    const totalPages = Math.max(1, Math.ceil(total / take));

    const formatCurrency = (amount: number) => {
        return format.number(amount, {
            style: 'currency',
            currency: tFeatured('currency_code') || 'VND',
            maximumFractionDigits: 0
        });
    };
 
    const tCommon = useTranslations('common');

    const openRefundModal = async (orderId: string) => {
        setRefundModalOrderId(orderId);
        setLoadingRefundInfo(true);
        setRefundInfo({
            bankName: '',
            accountNumber: '',
            accountHolder: '',
            note: '',
        });
        try {
            const existing = await orderService.getRefundBankInfo(orderId);
            if (existing) {
                setRefundInfo({
                    bankName: existing.bankName || '',
                    accountNumber: existing.accountNumber || '',
                    accountHolder: existing.accountHolder || '',
                    note: existing.note || '',
                });
            }
        } catch {
            // keep empty form
        } finally {
            setLoadingRefundInfo(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['customer', 'staff', 'admin']}>
            <div className="flex flex-col gap-10 py-10 px-8">
                <header className="mb-4 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
                        {t('title')}
                    </h1>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
                        {t('subtitle')}
                    </p>
                </header>

                <div className="space-y-6 md:space-y-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-gold" size={32} />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-16 md:py-20 text-center space-y-6 glass rounded-[2.5rem] md:rounded-[3rem] border border-border bg-background/40">
                            <Receipt className="mx-auto text-muted-foreground/20 w-[60px] h-[60px] md:w-[80px] md:h-[80px]" strokeWidth={1} />
                            <div className="space-y-2 px-6">
                                <h3 className="text-lg md:text-xl font-heading text-foreground uppercase tracking-widest">{t('empty_title')}</h3>
                                <p className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('empty_desc')}</p>
                            </div>
                        </div>
                    ) : (
                        orders.map((order, i) => {
                            const style = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                            const StatusIcon = style.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass bg-background/40 rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 border border-border shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className="flex flex-col gap-6">
                                        {/* Order Brief */}
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 md:mb-6">
                                                <div className="w-full sm:w-auto">
                                                    <span className="text-[10px] font-black text-gold uppercase tracking-[.4em] mb-2 block leading-none">
                                                        {t('order_label')} #{order.code}
                                                    </span>
                                                    <h2 className="text-lg md:text-xl font-heading text-stone-900 dark:text-stone-100 mb-1.5 uppercase tracking-wide leading-snug">
                                                        {order.items?.[0]?.product?.name || t('fragrance_acquisition')}
                                                        {order.items && order.items.length > 1 && <span className="text-[10px] md:text-xs italic text-stone-500 ml-2"> {t('more_suffix', { count: order.items.length - 1 })}</span>}
                                                    </h2>
                                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar size={12} className="text-gold/60" />
                                                        {new Date(order.createdAt!).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-border/10 pt-3 sm:pt-0">
                                                    <span className="text-xl font-heading text-stone-900 dark:text-stone-100 block sm:mb-2 tracking-tighter">
                                                        {formatCurrency(order.finalAmount)}
                                                    </span>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 text-[7px] md:text-[8px] px-3 md:px-4 py-1 rounded-full font-bold uppercase tracking-widest border transition-all",
                                                        style.color
                                                    )}>
                                                        <StatusIcon size={10} />
                                                        {style.label}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-border/50 pt-5 mt-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 sm:p-2.5 bg-secondary/50 rounded-xl md:rounded-2xl text-muted-foreground border border-border shrink-0">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('destination')}</h4>
                                                        <p className="text-[9px] md:text-[10px] text-foreground font-medium uppercase tracking-tight line-clamp-1 md:line-clamp-2 italic">
                                                            {order.shippingAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 shrink-0">
                                                    {order.status === 'CANCELLED' && order.paymentStatus === 'PAID' && (
                                                        <button
                                                            onClick={() => openRefundModal(order.id)}
                                                            className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500/5 transition-all text-center"
                                                        >
                                                            TK hoàn tiền
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/dashboard/customer/orders/${order.id}`}
                                                        className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-gold transition-colors group min-h-[32px]"
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

                {!loading && total > 0 && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                        <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center md:text-left">
                            {`${skip + 1}-${Math.min(skip + take, total)} / ${total}`}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <select
                                value={take}
                                onChange={(e) => {
                                    const nextTake = Number(e.target.value);
                                    setTake(nextTake);
                                    setSkip(0);
                                }}
                                className="bg-background/60 border border-border rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-widest outline-none focus:border-gold transition-colors"
                            >
                                <option value={5}>5 / trang</option>
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                            </select>
                            <div className="flex items-center gap-1.5 ml-2">
                                <button
                                    type="button"
                                    onClick={() => setSkip((s) => Math.max(0, s - take))}
                                    disabled={skip === 0}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-[9px] font-bold uppercase disabled:opacity-30 hover:bg-gold/5 transition-all active:scale-90"
                                >
                                    <ChevronRight className="rotate-180" size={14} />
                                </button>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground w-12 text-center">
                                    {currentPage}/{totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSkip((s) => (s + take < total ? s + take : s))}
                                    disabled={skip + take >= total}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-[9px] font-bold uppercase disabled:opacity-30 hover:bg-gold/5 transition-all active:scale-90"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <footer className="mt-10 pt-10 border-t border-border text-center">
                    <p className="text-[8px] font-bold uppercase tracking-[.4em] text-muted-foreground">
                        {tCommon('engine_version')}
                    </p>
                </footer>
            </div>

            {refundModalOrderId && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 p-8 space-y-4">
                        <h3 className="text-lg font-heading uppercase tracking-widest text-foreground">
                            Thông tin tài khoản nhận hoàn tiền
                        </h3>
                        {loadingRefundInfo ? (
                            <div className="py-10 flex items-center justify-center">
                                <Loader2 className="animate-spin text-gold" size={24} />
                            </div>
                        ) : (
                            <>
                                <input
                                    value={refundInfo.bankName}
                                    onChange={(e) => setRefundInfo((p) => ({ ...p, bankName: e.target.value }))}
                                    placeholder="Tên ngân hàng"
                                    className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                                />
                                <input
                                    value={refundInfo.accountNumber}
                                    onChange={(e) => setRefundInfo((p) => ({ ...p, accountNumber: e.target.value }))}
                                    placeholder="Số tài khoản"
                                    className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                                />
                                <input
                                    value={refundInfo.accountHolder}
                                    onChange={(e) => setRefundInfo((p) => ({ ...p, accountHolder: e.target.value }))}
                                    placeholder="Tên chủ tài khoản"
                                    className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
                                />
                                <textarea
                                    value={refundInfo.note}
                                    onChange={(e) => setRefundInfo((p) => ({ ...p, note: e.target.value }))}
                                    placeholder="Ghi chú (không bắt buộc)"
                                    className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold min-h-24"
                                />
                            </>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setRefundModalOrderId(null)}
                                className="flex-1 py-3 rounded-full border border-border text-muted-foreground hover:bg-secondary/50 text-[10px] font-bold uppercase tracking-widest"
                            >
                                Đóng
                            </button>
                            <button
                                disabled={
                                    loadingRefundInfo ||
                                    savingRefundInfo ||
                                    !refundInfo.bankName.trim() ||
                                    !refundInfo.accountNumber.trim() ||
                                    !refundInfo.accountHolder.trim()
                                }
                                onClick={async () => {
                                    setSavingRefundInfo(true);
                                    try {
                                        await orderService.submitRefundBankInfo(refundModalOrderId, refundInfo);
                                        setRefundModalOrderId(null);
                                    } catch (e: any) {
                                        alert(e?.response?.data?.message || e?.message || 'Không thể gửi thông tin hoàn tiền');
                                    } finally {
                                        setSavingRefundInfo(false);
                                    }
                                }}
                                className="flex-1 py-3 rounded-full bg-gold text-primary-foreground text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                            >
                                {savingRefundInfo ? 'Đang gửi...' : 'Gửi thông tin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthGuard>
    );
}
