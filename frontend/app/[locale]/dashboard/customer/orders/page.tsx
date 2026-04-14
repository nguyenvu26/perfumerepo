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
                                                    <div className="flex items-center gap-3">
                                                        {order.status === 'CANCELLED' && order.paymentStatus === 'PAID' && (
                                                            <button
                                                                onClick={() => openRefundModal(order.id)}
                                                                className="text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/5 transition-all"
                                                            >
                                                                Nhập TK hoàn tiền
                                                            </button>
                                                        )}
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
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {!loading && total > 0 && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                            {`${skip + 1}-${Math.min(skip + take, total)} / ${total}`}
                        </p>
                        <div className="flex items-center gap-3">
                            <select
                                value={take}
                                onChange={(e) => {
                                    const nextTake = Number(e.target.value);
                                    setTake(nextTake);
                                    setSkip(0);
                                }}
                                className="bg-background/60 border border-border rounded-full px-3 py-2 text-[10px] uppercase tracking-widest font-bold"
                            >
                                <option value={5}>5 / trang</option>
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => setSkip((s) => Math.max(0, s - take))}
                                disabled={skip === 0}
                                className="px-4 py-2 rounded-full border border-border text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground min-w-24 text-center">
                                {currentPage}/{totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSkip((s) => (s + take < total ? s + take : s))}
                                disabled={skip + take >= total}
                                className="px-4 py-2 rounded-full border border-border text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                            >
                                Sau
                            </button>
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
