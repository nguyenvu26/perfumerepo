'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Store, Phone, Mail, MapPin, CheckCircle, XCircle, Clock,
    ShoppingBag, Receipt, Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function formatVND(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

type ReceiptData = {
    code: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    channel: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    store: { id: string; name: string; code?: string | null; address?: string | null } | null;
    customer: { fullName: string | null; phone: string | null } | null;
    items: {
        productName: string;
        brandName: string | null;
        variantName: string;
        imageUrl: string | null;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }[];
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PAID: { label: 'Đã thanh toán', color: 'text-emerald-600', icon: <CheckCircle className="w-5 h-5" /> },
    COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-600', icon: <CheckCircle className="w-5 h-5" /> },
    PENDING: { label: 'Chờ xử lý', color: 'text-amber-500', icon: <Clock className="w-5 h-5" /> },
    CANCELLED: { label: 'Đã hủy', color: 'text-red-500', icon: <XCircle className="w-5 h-5" /> },
};

export default function PublicReceiptPage() {
    const params = useParams();
    const code = params.code as string;
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;
        setLoading(true);
        fetch(`${API_URL}/public/receipt/${encodeURIComponent(code)}`)
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || 'Không tìm thấy hóa đơn');
                }
                return res.json();
            })
            .then((data) => {
                setReceipt(data);
                setError(null);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    <p className="text-muted-foreground text-sm">Đang tải hóa đơn...</p>
                </div>
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="glass max-w-md w-full rounded-3xl p-8 text-center border-border">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-heading font-semibold mb-2">Không tìm thấy hóa đơn</h2>
                    <p className="text-muted-foreground text-sm">{error || 'Mã hóa đơn không hợp lệ hoặc đã bị xóa.'}</p>
                    <p className="text-xs text-muted-foreground/60 mt-4">Mã: {code}</p>
                </div>
            </div>
        );
    }

    const paymentInfo = statusMap[receipt.paymentStatus] || statusMap[receipt.status] || statusMap.PENDING;
    const date = new Date(receipt.createdAt);

    return (
        <div className="min-h-[60vh] py-8 md:py-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto"
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#C5A059] via-[#D4B06A] to-[#9A7B3F] rounded-t-3xl p-6 md:p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                    <div className="relative z-10">
                        <div className="w-14 h-14 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                            <Receipt className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wide mb-1">HÓA ĐƠN ĐIỆN TỬ</h1>
                        <p className="text-sm opacity-80">PerfumeGPT — Hệ thống tư vấn nước hoa AI</p>
                    </div>
                </div>

                {/* Receipt Body */}
                <div className="bg-white dark:bg-zinc-900 border-x border-b border-gray-200 dark:border-zinc-700 rounded-b-3xl shadow-2xl overflow-hidden">
                    {/* Store Info */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Store className="w-4 h-4 text-[#C5A059]" />
                            <span className="font-semibold text-sm">{receipt.store?.name || 'PerfumeGPT'}</span>
                        </div>
                        {receipt.store?.address && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{receipt.store.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>contact@perfumegpt.vn</span>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Order Meta */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] uppercase text-gray-400 dark:text-zinc-500 tracking-wider mb-0.5">Mã đơn hàng</p>
                                <p className="text-sm font-mono font-bold">{receipt.code}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-gray-400 dark:text-zinc-500 tracking-wider mb-0.5">Ngày giờ</p>
                                <p className="text-sm">{date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                        </div>

                        {/* Payment Status Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${paymentInfo.color} bg-current/5`}
                            style={{ backgroundColor: 'color-mix(in srgb, currentColor 8%, transparent)' }}>
                            {paymentInfo.icon}
                            <span className="text-sm font-semibold">{paymentInfo.label}</span>
                        </div>

                        {/* Customer */}
                        {receipt.customer && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Khách hàng</p>
                                <p className="text-sm font-semibold">{receipt.customer.fullName || 'Khách hàng'}</p>
                                {receipt.customer.phone && (
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">{receipt.customer.phone}</p>
                                )}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-dashed border-gray-200 dark:border-zinc-700" />

                        {/* Items */}
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                                Chi tiết sản phẩm
                            </h3>
                            <div className="space-y-3">
                                {receipt.items.map((item, i) => (
                                    <div key={i} className="flex gap-3">
                                        {item.imageUrl ? (
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
                                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                                                <ShoppingBag className="w-5 h-5 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight truncate">{item.productName}</p>
                                            {item.brandName && (
                                                <p className="text-[10px] text-[#C5A059] font-semibold">{item.brandName}</p>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-zinc-400">{item.variantName}</p>
                                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                                                {formatVND(item.unitPrice)} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold">{formatVND(item.totalPrice)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-zinc-400">
                                <span>Tạm tính</span>
                                <span>{formatVND(receipt.totalAmount)}</span>
                            </div>
                            {receipt.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Giảm giá</span>
                                    <span>-{formatVND(receipt.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-zinc-700">
                                <span>Tổng cộng</span>
                                <span className="text-[#C5A059]">{formatVND(receipt.finalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 text-center border-t border-gray-200 dark:border-zinc-700">
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Cảm ơn quý khách đã mua hàng tại PerfumeGPT!
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                            Hàng hóa đã được kiểm tra kỹ trước khi giao.
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                perfumegpt.vn • contact@perfumegpt.vn
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
