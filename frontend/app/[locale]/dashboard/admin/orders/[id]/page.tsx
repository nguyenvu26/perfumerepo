'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/lib/i18n';
import { useTranslations, useFormatter } from 'next-intl';
import { orderService, Order } from '@/services/order.service';
import { shippingService, type Shipment } from '@/services/shipping.service';
import {
    Package,
    ArrowLeft,
    Loader2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Truck,
    ExternalLink,
    RefreshCw,
    XCircle,
    Plus,
} from 'lucide-react';

const TRACKING_URL = 'https://donhang.ghn.vn/?order_code=';

const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Chờ lấy hàng', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    PICKED_UP: { label: 'Đã lấy hàng', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    IN_TRANSIT: { label: 'Đang vận chuyển', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
    DELIVERED: { label: 'Đã giao', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    FAILED: { label: 'Thất bại / Hủy', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    RETURNED: { label: 'Hoàn hàng', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
};

export default function AdminOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [shippingAction, setShippingAction] = useState<string | null>(null);

    const tOrder = useTranslations('admin_orders_page');
    const tFeatured = useTranslations('featured');
    const format = useFormatter();

    const formatCurrency = (val: number) => format.number(val, { style: 'currency', currency: tFeatured('currency_code') || 'VND' });
    const formatDate = (val: string | Date | undefined) => val ? format.dateTime(new Date(val), { dateStyle: 'short', timeStyle: 'short' }) : '—';

    useEffect(() => {
        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    const loadOrder = async () => {
        setLoading(true);
        try {
            const [data, ships] = await Promise.all([
                orderService.getAdminById(orderId),
                shippingService.getAdminDetail(orderId).catch(() => []),
            ]);
            setOrder(data);
            setShipments(ships);
        } catch (error) {
            console.error('Failed to load order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async () => {
        setShippingAction('creating');
        try {
            await shippingService.createGhnShipmentAdmin(orderId);
            await loadOrder();
        } catch (e: any) {
            alert(e.response?.data?.message || e.message || 'Tạo đơn GHN thất bại');
        } finally {
            setShippingAction(null);
        }
    };

    const handleCancelShipment = async () => {
        if (!confirm('Bạn có chắc muốn hủy đơn vận chuyển GHN?')) return;
        setShippingAction('cancelling');
        try {
            await shippingService.cancelShipment(orderId);
            await loadOrder();
        } catch (e: any) {
            alert(e.response?.data?.message || e.message || 'Hủy đơn GHN thất bại');
        } finally {
            setShippingAction(null);
        }
    };

    const handleSyncStatus = async (shipmentId: string) => {
        setShippingAction('syncing');
        try {
            await shippingService.syncShipmentStatus(shipmentId);
            await loadOrder();
        } catch (e: any) {
            alert(e.response?.data?.message || e.message || 'Đồng bộ trạng thái thất bại');
        } finally {
            setShippingAction(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-stone-600 dark:text-stone-400 mb-4">Không tìm thấy đơn hàng</p>
                    <Link
                        href="/dashboard/admin/orders"
                        className="text-gold hover:underline font-bold"
                    >
                        Quay lại
                    </Link>
                </div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        PROCESSING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        CONFIRMED: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        SHIPPED: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
        COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };

    const paymentStatusColors: Record<string, string> = {
        PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        PAID: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        REFUNDED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    };

    const hasShipment = shipments.length > 0;
    const canCreateShipment = !hasShipment && order.shippingAddress && order.status !== 'CANCELLED';

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard/admin/orders"
                        className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition mb-4"
                    >
                        <ArrowLeft size={20} />
                        {tOrder('back')}
                    </Link>

                    <div className="flex items-center gap-3">
                        <Package className="text-gold" size={32} />
                        <h1 className="text-4xl font-serif text-luxury-black dark:text-white">
                            {tOrder('detail_title')}
                        </h1>
                    </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Order Code & Status */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10">
                        <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
                            {tOrder('order_code')}
                        </p>
                        <p className="text-2xl font-mono font-bold text-luxury-black dark:text-white mb-4">
                            {order.code}
                        </p>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                                    {tOrder('status')}
                                </p>
                                <span
                                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${statusColors[order.status] || statusColors.PENDING}`}
                                >
                                    {tOrder(`status_labels.${order.status}`)}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                                    {tOrder('payment_status')}
                                </p>
                                <span
                                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${paymentStatusColors[order.paymentStatus] || paymentStatusColors.PENDING}`}
                                >
                                    {tOrder(`payment_labels.${order.paymentStatus}`)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10">
                        <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-4">
                            {tOrder('customer_info')}
                        </p>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <Mail size={18} className="text-gold flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400">{tOrder('email')}</p>
                                    <p className="text-sm font-bold text-luxury-black dark:text-white">
                                        {order.user?.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Phone size={18} className="text-gold flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400">{tOrder('phone')}</p>
                                    <p className="text-sm font-bold text-luxury-black dark:text-white">
                                        {order.phone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Info */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10">
                        <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-4">
                            {tOrder('payment_info')}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{tOrder('subtotal')}</p>
                                <p className="text-xl font-bold text-luxury-black dark:text-white">
                                    {formatCurrency(order.totalAmount)}
                                </p>
                            </div>
                            {order.discountAmount > 0 && (
                                <div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{tOrder('discount')}</p>
                                    <p className="text-lg font-bold text-red-600">
                                        - {formatCurrency(order.discountAmount)}
                                    </p>
                                </div>
                            )}
                            {(order as any).shippingFee > 0 && (
                                <div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{tOrder('shipping_fee')}</p>
                                    <p className="text-lg font-bold text-stone-700 dark:text-stone-300">
                                        {formatCurrency((order as any).shippingFee)}
                                    </p>
                                </div>
                            )}
                            <div className="pt-3 border-t border-stone-200 dark:border-white/10">
                                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{tOrder('total')}</p>
                                <p className="text-2xl font-bold text-gold">
                                    {formatCurrency(order.finalAmount)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <MapPin className="text-gold" size={20} />
                        <h2 className="text-xl font-serif font-bold text-luxury-black dark:text-white">
                            {tOrder('shipping_address')}
                        </h2>
                    </div>
                    <p className="text-sm text-luxury-black dark:text-white">
                        {order.shippingAddress || tOrder('no_address')}
                    </p>
                </div>

                {/* Shipping / GHN Panel */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Truck className="text-gold" size={20} />
                            <h2 className="text-xl font-serif font-bold text-luxury-black dark:text-white">
                                {tOrder('ghn_shipping')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {canCreateShipment && (
                                <button
                                    onClick={handleCreateShipment}
                                    disabled={!!shippingAction}
                                    className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold/80 transition disabled:opacity-50"
                                >
                                    {shippingAction === 'creating' ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Plus size={14} />
                                    )}
                                    {tOrder('create_ghn')}
                                </button>
                            )}
                        </div>
                    </div>

                    {hasShipment ? (
                        <div className="space-y-4">
                            {shipments.map((s) => {
                                const statusStyle = SHIPMENT_STATUS_CONFIG[s.status] || SHIPMENT_STATUS_CONFIG.PENDING;
                                return (
                                    <div
                                        key={s.id}
                                        className="p-5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-white/5"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                                                    {tOrder('tracking_code')}
                                                </p>
                                                <p className="font-mono font-bold text-luxury-black dark:text-white text-lg">
                                                    {s.ghnOrderCode || s.trackingCode || '—'}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusStyle.color}`}>
                                                {tOrder(`shipment_status.${s.status}`)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{tOrder('provider')}</p>
                                                <p className="text-sm font-bold text-luxury-black dark:text-white">{s.provider}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{tOrder('shipping_fee')}</p>
                                                <p className="text-sm font-bold text-luxury-black dark:text-white">
                                                    {s.fee ? formatCurrency(s.fee) : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{tOrder('created_at')}</p>
                                                <p className="text-sm font-bold text-luxury-black dark:text-white">
                                                    {formatDate(s.createdAt)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{tOrder('updated_at')}</p>
                                                <p className="text-sm font-bold text-luxury-black dark:text-white">
                                                    {formatDate(s.updatedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-stone-200 dark:border-white/10">
                                            {(s.trackingCode || s.ghnOrderCode) && (
                                                <a
                                                    href={`${TRACKING_URL}${s.ghnOrderCode || s.trackingCode}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold/80 transition"
                                                >
                                                    <ExternalLink size={12} />
                                                    {tOrder('track_ghn')}
                                                </a>
                                            )}
                                            {s.status !== 'DELIVERED' && s.status !== 'FAILED' && s.status !== 'RETURNED' && (
                                                <>
                                                    <button
                                                        onClick={() => handleSyncStatus(s.id)}
                                                        disabled={!!shippingAction}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50"
                                                    >
                                                        {shippingAction === 'syncing' ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <RefreshCw size={12} />
                                                        )}
                                                        {tOrder('sync_status')}
                                                    </button>
                                                    {s.status === 'PENDING' && (
                                                        <button
                                                            onClick={handleCancelShipment}
                                                            disabled={!!shippingAction}
                                                            className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                                                        >
                                                            {shippingAction === 'cancelling' ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <XCircle size={12} />
                                                            )}
                                                            {tOrder('cancel_shipping')}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Truck size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-4" />
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {canCreateShipment
                                    ? tOrder('no_shipping')
                                    : tOrder('no_shipping_data')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Order Items */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-stone-100 dark:border-white/10">
                    <h2 className="text-xl font-serif font-bold text-luxury-black dark:text-white mb-6">
                        {tOrder('products_list')}
                    </h2>

                    {order.items && order.items.length > 0 ? (
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex justify-between items-center p-4 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-white/10"
                                >
                                    <div className="flex-1">
                                        <p className="font-bold text-luxury-black dark:text-white mb-1">
                                            {item.product?.name}
                                        </p>
                                        <p className="text-sm text-stone-600 dark:text-stone-400">
                                            {tOrder('qty')}: {item.quantity} ×{' '}
                                            {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-luxury-black dark:text-white">
                                            {formatCurrency(item.totalPrice)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-stone-600 dark:text-stone-400">{tOrder('no_products')}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-sm text-stone-600 dark:text-stone-400 grid grid-cols-2 gap-4">
                    <div>
                        <Calendar size={16} className="inline mr-2" />
                        {tOrder('created_at')}: {formatDate(order.createdAt)}
                    </div>
                    <div className="text-right">
                        {tOrder('updated_at')}: {formatDate(order.updatedAt)}
                    </div>
                </div>
            </div>
        </div>
    );
}
