'use client';

import { useTranslations, useFormatter } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle, User, Award, Store, Phone, Mail, MapPin } from 'lucide-react';
import type { PosOrder } from '@/services/staff-pos.service';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PosOrder | null;
    loyaltyInfo?: {
        registered: boolean;
        userId: string | null;
        fullName: string | null;
        phone: string;
        email: string | null;
        loyaltyPoints: number;
        transactionCount?: number;
    } | null;
    onNewOrder?: () => void;
}

function formatVND(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export function ReceiptModal({ isOpen, onClose, order, loyaltyInfo, onNewOrder }: ReceiptModalProps) {
    const t = useTranslations('dashboard.pos');
    const format = useFormatter();

    if (!order) return null;

    const subtotal = order.totalAmount;
    const discount = order.discountAmount;
    const finalTotal = order.finalAmount;
    const earnedPoints = Math.floor(finalTotal / 10000);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg max-w-sm w-full shadow-2xl relative overflow-hidden receipt-modal"
                            style={{ maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gold to-yellow-500 p-6 text-white text-center">
                                <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h2 className="font-bold text-lg uppercase tracking-wide">PerfumeGPT</h2>
                                <p className="text-sm opacity-90">Hệ thống tư vấn nước hoa AI</p>
                            </div>

                            {/* Store Info */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Store className="w-4 h-4 text-gold" />
                                    <span className="font-semibold text-sm">{order.store?.name || 'Cửa hàng PerfumeGPT'}</span>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600 dark:text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3" />
                                        <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        <span>1900 XXX XXX</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        <span>contact@perfumegpt.vn</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
                                    Mã số thuế: 0123456789
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="px-6 py-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium">Mã đơn hàng:</span>
                                    <span className="font-mono text-sm font-bold">{order.code}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm">Ngày giờ:</span>
                                    <span className="text-sm">{format.dateTime(new Date(), { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>

                                {/* Customer Info */}
                                {(order.user || loyaltyInfo) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="font-medium text-sm">Thông tin khách hàng</span>
                                        </div>
                                        {order.user ? (
                                            <div>
                                                <p className="text-sm font-medium">{order.user.fullName || order.user.phone}</p>
                                                <p className="text-xs text-gray-600 dark:text-zinc-400">{order.user.phone}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Award className="w-3 h-3 text-gold" />
                                                    <span className="text-xs text-gold">+{earnedPoints} điểm thưởng</span>
                                                </div>
                                            </div>
                                        ) : loyaltyInfo && !loyaltyInfo.registered ? (
                                            <div>
                                                <p className="text-sm font-medium">Khách vãng lai</p>
                                                <p className="text-xs text-gray-600 dark:text-zinc-400">{loyaltyInfo.phone}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Award className="w-3 h-3 text-gold" />
                                                    <span className="text-xs text-gold">+{earnedPoints} điểm (đăng ký để sử dụng)</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Items */}
                                <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                                    <h3 className="font-medium text-sm mb-3 uppercase tracking-wide">Chi tiết sản phẩm</h3>
                                    <div className="space-y-2">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-tight">{item.variant.product?.name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-zinc-400">{item.variant.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                                                        {formatVND(item.unitPrice)} x {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">{formatVND(item.totalPrice)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 dark:border-zinc-700 pt-4 mt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Tạm tính:</span>
                                            <span>{formatVND(subtotal)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                                <span>Giảm giá:</span>
                                                <span>-{formatVND(discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-zinc-700">
                                            <span>Tổng cộng:</span>
                                            <span className="text-gold">{formatVND(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span>Phương thức thanh toán:</span>
                                        <span className="font-medium">
                                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700">
                                <p className="text-center text-xs text-gray-600 dark:text-zinc-400 mb-4">
                                    Cảm ơn quý khách đã mua hàng tại PerfumeGPT!
                                </p>
                                <p className="text-center text-xs text-gray-500 dark:text-zinc-500">
                                    Hàng hóa đã được kiểm tra kỹ trước khi giao.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 flex gap-3 no-print">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="flex items-center justify-center gap-2 py-2 px-4 bg-gold text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    In hóa đơn
                                </button>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors no-print"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}