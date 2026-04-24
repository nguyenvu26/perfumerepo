'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Banknote, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    report: {
        totalRevenue: number;
        totalOrders: number;
    };
    onSuccess?: () => void;
}

export function DailyClosingWebDialog({ isOpen, onClose, report, onSuccess }: Props) {
    const [actualCash, setActualCash] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Demo logic: Giả định 40% tiền mặt, 60% chuyển khoản
    const systemCash = report.totalRevenue * 0.4;
    const systemTransfer = report.totalRevenue * 0.6;
    
    const actualCashNum = parseFloat(actualCash) || 0;
    const difference = actualCashNum - systemCash;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/daily-closing', {
                systemTotal: report.totalRevenue,
                systemCash: systemCash,
                systemTransfer: systemTransfer,
                actualCash: actualCashNum,
                difference: difference,
                note: note,
                orderCount: report.totalOrders,
                // storeId sẽ được backend lấy từ user nếu không truyền
            });
            onSuccess?.();
            onClose();
        } catch (e) {
            console.error('Closing failed', e);
            alert('Có lỗi xảy ra khi chốt doanh thu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const formatVND = (v: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glass"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gold/10 text-gold">
                                    <Calculator className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-heading gold-gradient uppercase tracking-tighter italic">Chốt doanh thu cuối ngày</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">Đối soát tiền mặt thực tế tại quầy</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Doanh thu hệ thống</p>
                                    <p className="text-xl font-heading tracking-tight">{formatVND(report.totalRevenue)}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tổng đơn hàng</p>
                                    <p className="text-xl font-heading tracking-tight">{report.totalOrders} đơn</p>
                                </div>
                            </div>

                            {/* Detail Breakdown */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-gold opacity-60" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tiền mặt (Hệ thống)</span>
                                    </div>
                                    <span className="text-sm font-bold font-heading">{formatVND(systemCash)}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-gold opacity-60" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Chuyển khoản (Hệ thống)</span>
                                    </div>
                                    <span className="text-sm font-bold font-heading">{formatVND(systemTransfer)}</span>
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Inputs */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[.3em] font-black text-gold ml-2 italic">Tiền mặt thực tế tại quầy</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            required
                                            value={actualCash}
                                            onChange={(e) => setActualCash(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-20 px-8 text-3xl font-heading tracking-tight outline-none focus:border-gold transition-all"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground font-bold tracking-widest opacity-40 uppercase">VNĐ</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[.3em] font-black text-muted-foreground ml-2 italic">Ghi chú / Lý do chênh lệch</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Nhập lý do nếu có chênh lệch tiền mặt so với hệ thống..."
                                        rows={3}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-sm font-medium outline-none focus:border-gold/50 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Difference Info */}
                            {actualCash && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-6 rounded-3xl border flex items-center justify-between",
                                        difference === 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{difference === 0 ? 'Khớp dữ liệu hoàn hảo' : 'Phát hiện chênh lệch'}</span>
                                    </div>
                                    <span className="text-sm font-bold font-heading">{difference > 0 ? '+' : ''}{formatVND(difference)}</span>
                                </motion.div>
                            )}

                            {/* Action */}
                            <div className="pt-4">
                                <button
                                    disabled={loading}
                                    className="w-full h-16 bg-gold text-black rounded-full font-heading uppercase tracking-[.2em] text-xs font-black shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận chốt doanh thu'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
