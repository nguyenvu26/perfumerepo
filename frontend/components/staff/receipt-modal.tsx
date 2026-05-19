'use client';

import { useTranslations, useFormatter } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle, User, Award, Store, Phone, Mail, MapPin, QrCode } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
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
    autoPrint?: boolean;
}

function formatVND(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

/** Build the public receipt URL from an order code */
function getReceiptUrl(orderCode: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${base}/vi/receipt/${encodeURIComponent(orderCode)}`;
}

export function ReceiptModal({ isOpen, onClose, order, loyaltyInfo, onNewOrder, autoPrint }: ReceiptModalProps) {
    const t = useTranslations('dashboard.pos');
    const format = useFormatter();
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

    const orderCode = order?.code ?? '';
    const receiptUrl = orderCode ? getReceiptUrl(orderCode) : '';

    // Derived values
    const subtotal = order?.totalAmount ?? 0;
    const discount = order?.discountAmount ?? 0;
    const finalTotal = order?.finalAmount ?? 0;
    const earnedPoints = Math.floor(finalTotal / 10000);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            document.body.classList.remove('print-mode-label');
            const addedStyle = document.getElementById('print-label-page-style');
            if (addedStyle) addedStyle.remove();
        };
    }, []);

    // Reset auto-print state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasAutoPrinted(false);
        }
    }, [isOpen]);

    // Generate QR code when modal opens
    useEffect(() => {
        if (!isOpen || !orderCode) {
            setQrDataUrl(null);
            return;
        }
        QRCode.toDataURL(receiptUrl, {
            width: 250,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => setQrDataUrl(url))
            .catch(() => setQrDataUrl(null));
    }, [isOpen, orderCode, receiptUrl]);

    /** Print QR label using main window state-swap to bypass security and iframe blocks */
    const printLabel = useCallback((qrUrl: string, code: string) => {
        // Inject page style dynamically so A4 print settings aren't polluted permanently
        let style = document.getElementById('print-label-page-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'print-label-page-style';
            document.head.appendChild(style);
        }
        style.innerHTML = `@page { size: 40mm 30mm !important; margin: 0 !important; }`;

        // Add class to trigger CSS override
        document.body.classList.add('print-mode-label');

        // Trigger print immediately after styles take effect
        setTimeout(() => {
            window.print();
            
            // Clean up styles shortly after print dialog pops up
            setTimeout(() => {
                document.body.classList.remove('print-mode-label');
                const addedStyle = document.getElementById('print-label-page-style');
                if (addedStyle) addedStyle.remove();
            }, 1000);
        }, 150);
    }, []);

    // Automatic print trigger when payment succeeds
    useEffect(() => {
        if (isOpen && autoPrint && qrDataUrl && orderCode && !hasAutoPrinted) {
            printLabel(qrDataUrl, orderCode);
            setHasAutoPrinted(true);
        }
    }, [isOpen, autoPrint, qrDataUrl, orderCode, hasAutoPrinted, printLabel]);

    /** Manual trigger for print label */
    const handlePrintQrLabel = useCallback(() => {
        if (qrDataUrl && orderCode) {
            printLabel(qrDataUrl, orderCode);
        }
    }, [qrDataUrl, orderCode, printLabel]);

    // ─── Early return AFTER all hooks ───
    if (!order) return null;

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

                                {/* QR Code Section */}
                                {qrDataUrl && (
                                    <div className="mt-4 flex flex-col items-center border-t border-gray-200 dark:border-zinc-700 pt-4">
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Quét QR để xem hóa đơn</p>
                                        <img
                                            src={qrDataUrl}
                                            alt="QR Code hóa đơn"
                                            className="w-28 h-28 rounded-lg border border-gray-200 dark:border-zinc-700 p-1 bg-white"
                                        />
                                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 font-mono">{order.code}</p>
                                    </div>
                                )}
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
                            <div className="px-6 py-4 flex gap-2 no-print">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 px-3 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handlePrintQrLabel}
                                    disabled={!qrDataUrl}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    title="In nhãn QR nhỏ (Clabel)"
                                >
                                    <QrCode className="w-4 h-4" />
                                    In QR
                                </button>
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gold text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
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

            {/* Global style overrides specifically for label print mode */}
            <style dangerouslySetInnerHTML={{ __html: `
                #qr-label-print-area {
                    display: none;
                }
                @media print {
                    body.print-mode-label {
                        width: 40mm !important;
                        height: 30mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #ffffff !important;
                    }
                    /* Hide all direct children of body except the QR label print area */
                    body.print-mode-label > *:not(#qr-label-print-area) {
                        display: none !important;
                    }
                    body.print-mode-label #qr-label-print-area {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 40mm !important;
                        height: 30mm !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    body.print-mode-label #qr-label-print-area .qr-container {
                        width: 22mm !important;
                        height: 22mm !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    body.print-mode-label #qr-label-print-area .qr-img {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: contain !important;
                        display: block !important;
                    }
                    body.print-mode-label #qr-label-print-area .code {
                        font-size: 6.5pt !important;
                        font-weight: bold !important;
                        margin-top: 0.5mm !important;
                        text-align: center !important;
                        line-height: 1 !important;
                        color: #000000 !important;
                    }
                    body.print-mode-label #qr-label-print-area .brand {
                        font-size: 4.5pt !important;
                        color: #333333 !important;
                        margin-top: 0.5mm !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.3px !important;
                        line-height: 1 !important;
                    }
                }
            `}} />

            {/* Portal to body root so it isn't nested inside overflow-hidden layout divs */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <div id="qr-label-print-area">
                    <div className="qr-container">
                        {qrDataUrl && (
                            <img src={qrDataUrl} className="qr-img" alt="QR Code" />
                        )}
                    </div>
                    <div className="code">{orderCode}</div>
                    <div className="brand">PerfumeGPT</div>
                </div>,
                document.body
            )}
        </>
    );
}