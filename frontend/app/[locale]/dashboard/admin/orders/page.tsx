'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, Search, Filter, Eye, Printer,
    CheckCircle2, Clock, Truck, PackageCheck,
    XCircle, ChevronRight, User, MapPin, Phone,
    CreditCard, Loader2, ArrowLeft
} from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import { orderService, type Order } from '@/services/order.service';
import { AuthGuard } from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';

export default function AdminOrders() {
    const t = useTranslations('dashboard.admin.orders');
    const format = useFormatter();

    const STATUS_CONFIG = {
        PENDING: { label: t('status.pending'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
        CONFIRMED: { label: t('status.confirmed'), color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle2 },
        PROCESSING: { label: t('status.processing'), color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: PackageCheck },
        SHIPPED: { label: t('status.shipped'), color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: Truck },
        COMPLETED: { label: t('status.completed'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
        CANCELLED: { label: t('status.cancelled'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    };

    const PAYMENT_CONFIG = {
        PENDING: { label: t('payment_status.pending'), color: 'text-amber-500' },
        PAID: { label: t('payment_status.paid'), color: 'text-emerald-500' },
        FAILED: { label: t('payment_status.failed'), color: 'text-red-500' },
        REFUNDED: { label: t('payment_status.refunded'), color: 'text-blue-500' },
    };
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [take, setTake] = useState(20);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUND_REQUIRED'>('ALL');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);
    const [refundInfo, setRefundInfo] = useState<any>(null);
    const [loadingRefundInfo, setLoadingRefundInfo] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await orderService.listAll(skip, take);
            setOrders(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    }, [skip, take]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setSkip(0);
    }, [take]);

    useEffect(() => {
        const loadRefundInfo = async () => {
            if (!selectedOrder) {
                setRefundInfo(null);
                return;
            }
            const needsRefund =
                selectedOrder.status === 'CANCELLED' &&
                (selectedOrder.paymentStatus === 'PAID' ||
                    selectedOrder.paymentStatus === 'PARTIALLY_REFUNDED');
            if (!needsRefund) {
                setRefundInfo(null);
                return;
            }
            setLoadingRefundInfo(true);
            try {
                const data = await orderService.getRefundBankInfoAdmin(selectedOrder.id);
                setRefundInfo(data);
            } catch {
                setRefundInfo(null);
            } finally {
                setLoadingRefundInfo(false);
            }
        };
        void loadRefundInfo();
    }, [selectedOrder]);

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdating(true);
        try {
            await orderService.updateStatus(id, { status });
            // Update local state or re-fetch
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            if (selectedOrder?.id === id) {
                setSelectedOrder(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePaymentStatus = async (id: string, paymentStatus: string) => {
        setUpdating(true);
        try {
            await orderService.updateStatus(id, { paymentStatus });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus } : o));
            if (selectedOrder?.id === id) {
                setSelectedOrder(prev => prev ? { ...prev, paymentStatus } : null);
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>${t('print.title')}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
                        .label { border: 2px solid #000; padding: 30px; border-radius: 8px; max-width: 500px; margin: auto; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                        .brand { font-size: 24px; font-weight: bold; letter-spacing: 4px; }
                        .section { margin-bottom: 20px; }
                        .title { font-[10px] uppercase font-bold text-gray-500 mb-5; }
                        .info { font-size: 16px; margin-bottom: 5px; }
                        .footer { border-top: 1px dashed #ccc; pt-20 mt-20 text-center text-xs text-gray-400; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="header">
                            <div class="brand">AURA AI</div>
                            <div style="text-align: right; font-size: 12px">
                                ${selectedOrder?.code}<br/>
                                ${format.dateTime(new Date())}
                            </div>
                        </div>
                        <div class="section">
                            <div class="title">${t('print.recipient')}</div>
                            <div class="info"><strong>${selectedOrder?.user?.name || t('print.guest')}</strong></div>
                            <div class="info">${selectedOrder?.phone}</div>
                            <div class="info">${selectedOrder?.shippingAddress}</div>
                        </div>
                        <div class="section">
                            <div class="title">${t('print.content')}</div>
                            ${selectedOrder?.items?.map(item => `
                                <div class="info">• ${item.product?.name} x ${item.quantity}</div>
                            `).join('')}
                        </div>
                        <div class="section" style="border-top: 1px solid #eee; padding-top: 10px">
                            <div style="display: flex; justify-content: space-between">
                                <span>${t('print.payment')}</span>
                                <strong>${format.number(selectedOrder?.finalAmount || 0, { style: 'currency', currency: 'VND' })}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between">
                                <span>${t('print.method')}</span>
                                <strong>${selectedOrder?.paymentStatus === 'PAID' ? t('print.paid') : t('print.cod')}</strong>
                            </div>
                        </div>
                        <div class="footer">${t('print.footer')}</div>
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const baseFilteredOrders = (orders || []).filter(o =>
        o.code.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.phone?.includes(search)
    );
    const filteredOrders = baseFilteredOrders.filter((o) => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'REFUND_REQUIRED') {
            return o.status === 'CANCELLED' && (o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIALLY_REFUNDED');
        }
        return o.status === activeTab;
    });

    const currentPage = Math.floor(skip / take) + 1;
    const totalPages = Math.max(1, Math.ceil(total / take));

    return (
        <AuthGuard allowedRoles={['admin', 'staff']}>
            <div className="flex flex-col gap-10 py-10 px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-serif text-luxury-black dark:text-white mb-2 transition-colors">
                            {t('title')}
                        </h1>
                        <p className="text-[10px] text-stone-500 uppercase tracking-[.4em] font-bold">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-gold transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs outline-none focus:border-gold transition-all w-80 shadow-sm"
                            />
                        </div>
                        <div className="p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-gold transition-all shadow-sm">
                            <Filter size={18} className="text-stone-500" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'ALL', label: 'Tất cả' },
                        { id: 'PENDING', label: 'Chờ xử lý' },
                        { id: 'PROCESSING', label: 'Đang xử lý' },
                        { id: 'COMPLETED', label: 'Hoàn thành' },
                        { id: 'CANCELLED', label: 'Đã hủy' },
                        { id: 'REFUND_REQUIRED', label: 'Cần hoàn tiền' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                                activeTab === tab.id
                                    ? "bg-gold text-primary-foreground border-gold"
                                    : "bg-white dark:bg-zinc-900 border-stone-200 dark:border-white/10 text-stone-500 hover:border-gold/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-200 dark:border-white/10 overflow-hidden shadow-xl transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.id')}</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.customer')}</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.total')}</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.fulfillment')}</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.payment')}</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.date')}</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{t('table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-8 py-10 h-24 bg-stone-50/10 dark:bg-white/[0.01]" />
                                        </tr>
                                    ))
                                ) : filteredOrders.map((order) => {
                                    const StatusIcon = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
                                    const statusStyle = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                                    const paymentStyle = PAYMENT_CONFIG[order.paymentStatus as keyof typeof PAYMENT_CONFIG] || PAYMENT_CONFIG.PENDING;

                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-stone-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-luxury-black dark:text-white transition-colors">{order.code}</span>
                                                    <span className="text-[8px] uppercase tracking-tighter text-stone-400 mt-1">Ref ID: {order.id.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-luxury-black dark:text-white">{order.user?.name || t('print.guest')}</span>
                                                    <span className="text-[9px] text-stone-500 mt-0.5">{order.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-serif text-luxury-black dark:text-white">
                                                    {format.number(order.finalAmount, { style: 'currency', currency: 'VND' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                                                    statusStyle.color
                                                )}>
                                                    <StatusIcon size={12} strokeWidth={2.5} />
                                                    {statusStyle.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", paymentStyle.color.replace('text', 'bg'))} />
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", paymentStyle.color)}>
                                                        {paymentStyle.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                                                {format.dateTime(new Date(order.createdAt || ''))}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2.5 rounded-xl border border-stone-200 dark:border-white/10 hover:border-gold hover:text-gold transition-all">
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {!loading && filteredOrders.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <Receipt className="mx-auto text-stone-200 dark:text-white/5" size={64} strokeWidth={1} />
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">{t('table.no_orders')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                        {total === 0 ? '0' : `${skip + 1}-${Math.min(skip + take, total)} / ${total}`}
                    </p>
                    <div className="flex items-center gap-3">
                        <select
                            value={take}
                            onChange={(e) => setTake(Number(e.target.value))}
                            className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-full px-3 py-2 text-[10px] uppercase tracking-widest font-bold"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setSkip((s) => Math.max(0, s - take))}
                            disabled={skip === 0}
                            className="px-4 py-2 rounded-full border border-stone-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 min-w-24 text-center">
                            {currentPage}/{totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setSkip((s) => (s + take < total ? s + take : s))}
                            disabled={skip + take >= total}
                            className="px-4 py-2 rounded-full border border-stone-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setSelectedOrder(null)}
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-2xl h-full bg-white dark:bg-zinc-950 shadow-2xl overflow-y-auto custom-scrollbar flex flex-col border-l border-border transition-colors"
                            >
                                {/* Modal Header */}
                                <div className="h-20 flex items-center justify-between px-10 border-b border-border sticky top-0 bg-white dark:bg-zinc-950 z-10 transition-colors">
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="text-stone-400 hover:text-luxury-black dark:hover:text-white transition-colors p-2 -ml-2 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="text-center">
                                        <p className="text-[8px] font-bold text-gold tracking-[.4em] uppercase mb-1">{t('modal.header_prefix')}</p>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-luxury-black dark:text-white">{selectedOrder.code}</h2>
                                    </div>
                                    <button
                                        onClick={handlePrint}
                                        className="p-2.5 rounded-xl border border-stone-200 dark:border-white/10 hover:border-gold hover:text-gold transition-all"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-10 space-y-12">
                                    {/* Quick Actions / Status Update */}
                                    <section>
                                        <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-stone-400 mb-6">{t('modal.transformation')}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                const isActive = selectedOrder.status === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleUpdateStatus(selectedOrder.id, key)}
                                                        disabled={updating || isActive}
                                                        className={cn(
                                                            "p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all",
                                                            isActive
                                                                ? "bg-gold border-gold text-white shadow-lg shadow-gold/20"
                                                                : "border-stone-100 dark:border-white/5 hover:border-gold/50 text-stone-500 hover:text-luxury-black dark:hover:text-white"
                                                        )}
                                                    >
                                                        <config.icon size={18} />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">{config.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    {/* Customer & Shipping Info */}
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-stone-400 flex items-center gap-2">
                                                <User size={12} /> {t('modal.identity')}
                                            </h3>
                                            <div className="glass p-6 rounded-3xl border border-stone-100 dark:border-white/5 space-y-2">
                                                <p className="text-sm font-bold text-luxury-black dark:text-white">{selectedOrder.user?.name || t('print.guest')}</p>
                                                <p className="text-xs text-stone-500">{selectedOrder.user?.email}</p>
                                                <div className="flex items-center gap-2 text-xs text-gold font-bold mt-2">
                                                    <Phone size={12} />
                                                    {selectedOrder.phone}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-stone-400 flex items-center gap-2">
                                                <MapPin size={12} /> {t('modal.destination')}
                                            </h3>
                                            <div className="glass p-6 rounded-3xl border border-stone-100 dark:border-white/5">
                                                <p className="text-xs leading-relaxed text-stone-500 uppercase tracking-tight">
                                                    {selectedOrder.shippingAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Order Content */}
                                    <section className="space-y-6">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-stone-400 flex items-center gap-2">
                                            <PackageCheck size={12} /> {t('modal.manifesto')}
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedOrder.items?.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-stone-100 dark:border-white/10 flex items-center justify-center text-xs text-stone-400">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-luxury-black dark:text-white">{item.product?.name || t('table.product_fallback', { fallback: 'Unknown Product' })}</p>
                                                            <p className="text-[10px] text-stone-400 italic">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-luxury-black dark:text-white font-serif">
                                                        {format.number(item.totalPrice, { style: 'currency', currency: 'VND' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Payment Ledger */}
                                    <section className="bg-luxury-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard size={20} className="text-gold" />
                                                    <h3 className="text-[10px] font-bold uppercase tracking-[.3em]">{t('modal.financial_matrix')}</h3>
                                                </div>
                                                <select
                                                    value={selectedOrder.paymentStatus}
                                                    onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                                                    disabled={updating}
                                                    className="bg-white/5 border border-white/10 rounded-xl text-[9px] uppercase font-bold tracking-widest px-4 py-2 outline-none focus:border-gold h-auto"
                                                >
                                                    {Object.entries(PAYMENT_CONFIG).map(([k, v]) => (
                                                        <option key={k} value={k} className="bg-zinc-900">{v.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                                                    <span>{t('modal.revenue_base')}</span>
                                                    <span>{format.number(selectedOrder.finalAmount, { style: 'currency', currency: 'VND' })}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                                                    <span>{t('modal.delivery_fee')}</span>
                                                    <span className="text-gold">{t('modal.complimentary')}</span>
                                                </div>
                                                <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-baseline">
                                                    <span className="text-[10px] font-bold uppercase tracking-[.5em] text-stone-400">{t('modal.liquid_settlement')}</span>
                                                    <span className="text-3xl font-serif text-white italic">
                                                        {format.number(selectedOrder.finalAmount, { style: 'currency', currency: 'VND' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Luxury Graphics */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-[60px] rounded-full" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full" />
                                    </section>

                                    {/* Refund Bank Info (only cancelled + paid) */}
                                    {selectedOrder.status === 'CANCELLED' &&
                                        (selectedOrder.paymentStatus === 'PAID' ||
                                            selectedOrder.paymentStatus === 'PARTIALLY_REFUNDED') && (
                                            <section className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                                                <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-red-500 mb-4">
                                                    Thông tin nhận hoàn tiền
                                                </h3>
                                                {loadingRefundInfo ? (
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Đang tải thông tin
                                                    </div>
                                                ) : refundInfo ? (
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Ngân hàng</span>
                                                            <span className="font-bold text-foreground">{refundInfo.bankName || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Số tài khoản</span>
                                                            <span className="font-bold text-foreground">{refundInfo.accountNumber || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Chủ tài khoản</span>
                                                            <span className="font-bold text-foreground">{refundInfo.accountHolder || '—'}</span>
                                                        </div>
                                                        {refundInfo.note && (
                                                            <div className="pt-2 border-t border-border mt-2">
                                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ghi chú</p>
                                                                <p className="text-xs text-foreground">{refundInfo.note}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        Khách hàng chưa gửi thông tin nhận hoàn tiền
                                                    </p>
                                                )}
                                            </section>
                                        )}
                                </div>

                                {updating && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 size={32} className="text-gold animate-spin" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">{t('modal.syncing')}</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Hidden Print Container */}
                            <div ref={printRef} className="hidden" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AuthGuard>
    );
}
