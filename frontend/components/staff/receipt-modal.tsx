'use client';

import { useFormatter } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle, User, Award, Store, Phone, Mail, MapPin, QrCode } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
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

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getReceiptUrl(orderCode: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${base}/vi/receipt/${encodeURIComponent(orderCode)}`;
}

/** Label printer paper 40×60 mm in portrait (40 mm wide × 60 mm tall). */
const LABEL_PAGE_CSS = 'size: 40mm 60mm portrait; margin: 0;';
const LABEL_WIDTH_MM = 40;
const LABEL_HEIGHT_MM = 60;

function buildQrLabelHtml(qrUrl: string, code: string): string {
    const safeCode = escapeHtml(code);
    return `
<style>
@media print {
    @page { ${LABEL_PAGE_CSS} }
    body > *:not(#print-mount) { display: none !important; }
    body { margin: 0; padding: 0; background: #fff; }
    #print-mount { display: block !important; width: ${LABEL_WIDTH_MM}mm; height: ${LABEL_HEIGHT_MM}mm; background: #fff; }
}
.qr-print-body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 2mm;
  color: #000;
  width: ${LABEL_WIDTH_MM}mm;
  height: ${LABEL_HEIGHT_MM}mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1mm;
}
.qr-print-img {
  width: 34mm;
  height: 34mm;
  flex-shrink: 0;
  display: block;
}
.qr-print-code {
  font-size: 7pt;
  font-weight: bold;
  line-height: 1.2;
  word-break: break-all;
  max-width: 36mm;
}
.qr-print-brand {
  font-size: 6pt;
  font-weight: bold;
  text-transform: uppercase;
}
</style>
<div class="qr-print-body">
  <img class="qr-print-img" src="${qrUrl}" alt="QR" />
  <div class="qr-print-code">${safeCode}</div>
  <div class="qr-print-brand">PerfumeGPT</div>
</div>`;
}

function buildReceiptHtml(
    order: PosOrder,
    opts: { earnedPoints: number; loyaltyPhone?: string; loyaltyGuest?: boolean },
): string {
    const itemsHtml = order.items
        .map(
            (item) => `
        <tr>
          <td style="padding:4px 0;border-bottom:1px solid #eee">
            <div style="font-weight:600;font-size:12px">${escapeHtml(item.variant.product?.name ?? '')}</div>
            <div style="font-size:10px;color:#666">${escapeHtml(item.variant.name)}</div>
            <div style="font-size:10px;color:#888">${formatVND(item.unitPrice)} x ${item.quantity}</div>
          </td>
          <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:12px;vertical-align:top">
            ${formatVND(item.totalPrice)}
          </td>
        </tr>`,
        )
        .join('');

    const discount = order.discountAmount ?? 0;
    const customerBlock = order.user
        ? `<p style="margin:0;font-weight:600">${escapeHtml(order.user.fullName || order.user.phone || '')}</p>
           <p style="margin:2px 0 0;font-size:11px;color:#666">${escapeHtml(order.user.phone || '')}</p>
           <p style="margin:4px 0 0;font-size:11px;color:#b8860b">+${opts.earnedPoints} điểm thưởng</p>`
        : opts.loyaltyPhone
            ? `<p style="margin:0;font-weight:600">Khách vãng lai</p>
             <p style="margin:2px 0 0;font-size:11px;color:#666">${escapeHtml(opts.loyaltyPhone)}</p>`
            : '';

    return `
<style>
@media print {
    @page { margin: 8mm; size: portrait; }
    body > *:not(#print-mount) { display: none !important; }
    body { margin: 0; padding: 0; background: #fff; }
    #print-mount { display: block !important; width: 100%; }
}
.receipt-print-body { font-family: Arial, sans-serif; font-size: 12px; color: #111; max-width: 80mm; margin: 0 auto; padding: 8px; }
.receipt-print-body h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
.receipt-print-body .sub { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
.receipt-print-body .store { background: #f5f5f5; padding: 8px; border-radius: 4px; margin-bottom: 12px; font-size: 10px; }
.receipt-print-body .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.receipt-print-body table { width: 100%; border-collapse: collapse; }
.receipt-print-body .total { font-size: 14px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
.receipt-print-body .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; }
</style>
<div class="receipt-print-body">
<h1>PerfumeGPT</h1>
<p class="sub">Hệ thống tư vấn nước hoa AI</p>
<div class="store">
  <strong>${escapeHtml(order.store?.name || 'Cửa hàng PerfumeGPT')}</strong><br/>
  123 Đường ABC, Quận XYZ, TP.HCM<br/>
  1900 XXX XXX · contact@perfumegpt.vn
</div>
<div class="row"><span>Mã đơn:</span><strong>${escapeHtml(order.code)}</strong></div>
<div class="row"><span>Ngày:</span><span>${new Date().toLocaleString('vi-VN')}</span></div>
${customerBlock ? `<div style="margin:12px 0;padding:8px;background:#f0f7ff;border-radius:4px">${customerBlock}</div>` : ''}
<p style="font-weight:bold;font-size:11px;margin:12px 0 6px;text-transform:uppercase">Chi tiết sản phẩm</p>
<table>${itemsHtml}</table>
<div class="row" style="margin-top:8px"><span>Tạm tính:</span><span>${formatVND(order.totalAmount)}</span></div>
${discount > 0 ? `<div class="row"><span>Giảm giá:</span><span style="color:green">-${formatVND(discount)}</span></div>` : ''}
<div class="row total"><span>Tổng cộng:</span><span>${formatVND(order.finalAmount)}</span></div>
<div class="row" style="margin-top:8px"><span>Thanh toán:</span><span>${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></div>
<p class="footer">Cảm ơn quý khách đã mua hàng tại PerfumeGPT!</p>
</div>`;
}

export function ReceiptModal({ isOpen, onClose, order, loyaltyInfo, autoPrint }: ReceiptModalProps) {
    const format = useFormatter();
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
    
    // Manage print states directly in the main window
    const [printMode, setPrintMode] = useState<'none' | 'qr' | 'receipt'>('none');
    const [isMounted, setIsMounted] = useState(false);
    
    const autoPrintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const orderCode = order?.code ?? '';
    const receiptUrl = orderCode ? getReceiptUrl(orderCode) : '';
    const subtotal = order?.totalAmount ?? 0;
    const discount = order?.discountAmount ?? 0;
    const finalTotal = order?.finalAmount ?? 0;
    const earnedPoints = Math.floor(finalTotal / 10000);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            if (autoPrintTimerRef.current) clearTimeout(autoPrintTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setHasAutoPrinted(false);
            setPrintMode('none');
        }
    }, [isOpen]);

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

    const executePrint = useCallback(() => {
        // Wait for React to render the portal and browser to load images
        setTimeout(() => {
            window.print();
            // Restore modal after print dialog closes
            setTimeout(() => setPrintMode('none'), 1000);
        }, 500);
    }, []);

    const handlePrintQrLabel = useCallback(() => {
        if (!qrDataUrl || !orderCode) return;
        setPrintMode('qr');
        executePrint();
    }, [qrDataUrl, orderCode, executePrint]);

    const handlePrintReceipt = useCallback(() => {
        if (!order) return;
        setPrintMode('receipt');
        executePrint();
    }, [order, executePrint]);

    // Auto-print QR label exactly once
    useEffect(() => {
        if (!isOpen || !autoPrint || !qrDataUrl || !orderCode || hasAutoPrinted) return;

        autoPrintTimerRef.current = setTimeout(() => {
            setPrintMode('qr');
            executePrint();
            setHasAutoPrinted(true);
        }, 800);

        return () => {
            if (autoPrintTimerRef.current) clearTimeout(autoPrintTimerRef.current);
        };
    }, [isOpen, autoPrint, qrDataUrl, orderCode, hasAutoPrinted, executePrint]);

    if (!order) return null;

    const portalContent = printMode === 'qr'
        ? buildQrLabelHtml(qrDataUrl || '', orderCode)
        : printMode === 'receipt'
        ? buildReceiptHtml(order, {
            earnedPoints,
            loyaltyPhone: loyaltyInfo?.phone,
            loyaltyGuest: loyaltyInfo ? !loyaltyInfo.registered : false,
        })
        : null;

    return (
        <>
            {/* 1. Modal View (Visible when not printing) */}
            <AnimatePresence>
                {isOpen && printMode === 'none' && (
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
                            <div className="bg-gradient-to-r from-gold to-yellow-500 p-6 text-white text-center">
                                <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h2 className="font-bold text-lg uppercase tracking-wide">PerfumeGPT</h2>
                                <p className="text-sm opacity-90">Hệ thống tư vấn nước hoa AI</p>
                            </div>

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

                            <div className="px-6 py-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium">Mã đơn hàng:</span>
                                    <span className="font-mono text-sm font-bold">{order.code}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm">Ngày giờ:</span>
                                    <span className="text-sm">{format.dateTime(new Date(), { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>

                                {(order.user || loyaltyInfo) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="font-medium text-sm">Thông khách hàng</span>
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

                                <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span>Thanh toán:</span>
                                        <span className="font-medium">
                                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span>
                                    </div>
                                </div>

                                {qrDataUrl && (
                                    <div className="mt-4 flex flex-col items-center border-t border-gray-200 dark:border-zinc-700 pt-4">
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Quét QR xem hóa đơn</p>
                                        <img
                                            src={qrDataUrl}
                                            alt="QR"
                                            className="w-28 h-28 rounded-lg border border-gray-200 dark:border-zinc-700 p-1 bg-white"
                                        />
                                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 font-mono">{order.code}</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700">
                                <p className="text-center text-xs text-gray-600 dark:text-zinc-400 mb-4">
                                    Cảm ơn quý khách đã mua hàng tại PerfumeGPT!
                                </p>
                            </div>

                            <div className="px-6 py-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2 px-3 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintQrLabel}
                                    disabled={!qrDataUrl}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    title="In nhãn QR"
                                >
                                    <QrCode className="w-4 h-4" />
                                    In QR
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintReceipt}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gold text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                                    title="In hóa đơn"
                                >
                                    <Printer className="w-4 h-4" />
                                    In bill
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Print Content (Mounted dynamically to body) */}
            {isMounted && printMode !== 'none' && portalContent && typeof document !== 'undefined' && createPortal(
                <div id="print-mount" dangerouslySetInnerHTML={{ __html: portalContent }} />,
                document.body
            )}
        </>
    );
}
