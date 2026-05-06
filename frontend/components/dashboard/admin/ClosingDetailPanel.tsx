'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShoppingBag, Box, TrendingUp, 
    ArrowRight, Clock, User, Banknote, CreditCard,
    DollarSign, Percent, AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface ClosingDetailProps {
    id: string | null;
    onClose: () => void;
}

export function ClosingDetailPanel({ id, onClose }: ClosingDetailProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const { data } = await api.get(`/daily-closing/${id}/details`);
                    setData(data);
                } catch (e) {
                    console.error('Failed to fetch closing details', e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [id]);

    const formatVND = (v: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    };

    if (!id) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Panel */}
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border-l border-white/10 h-full shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                                <Box className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-heading text-white uppercase tracking-tight">Chi tiết ca chốt</h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    {data?.closing?.store?.name} • {data?.closing?.closingDate && new Date(data.closing.closingDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-gold uppercase tracking-[.3em] animate-pulse">Đang tải dữ liệu...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4 p-6">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Lợi nhuận gộp</span>
                                    </div>
                                    <p className="text-xl font-heading text-emerald-400">{formatVND(data.stats.profit)}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase">AOV (Đơn TB)</span>
                                    </div>
                                    <p className="text-xl font-heading text-white">{formatVND(data.stats.avgOrderValue)}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-6 flex items-center gap-6 border-b border-white/10 mb-6">
                                <button 
                                    onClick={() => setActiveTab('products')}
                                    className={cn(
                                        "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                        activeTab === 'products' ? "text-gold" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    Sản phẩm đã bán ({data.soldProducts.length})
                                    {activeTab === 'products' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('orders')}
                                    className={cn(
                                        "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                        activeTab === 'orders' ? "text-gold" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    Danh sách đơn hàng ({data.orders.length})
                                    {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="px-6 pb-10">
                                {activeTab === 'products' ? (
                                    <div className="space-y-4">
                                        {data.soldProducts.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 group hover:bg-white/[0.05] transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 group-hover:text-gold transition-colors">
                                                        {p.sku.slice(-2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors">{p.name}</h4>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-tighter">SKU: {p.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white">{formatVND(p.revenue)}</p>
                                                    <p className="text-[10px] font-bold text-white/40 uppercase">Số lượng: {p.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.orders.map((o: any) => (
                                            <div key={o.id} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white/80 uppercase">#{o.id.slice(-8)}</span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                                                            o.paymentMethod === 'CASH' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                                        )}>
                                                            {o.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-white/40 font-bold">{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-white/20" />
                                                        <span className="text-xs text-white/60 font-medium">{o.user?.fullName || 'Khách vãng lai'}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-white">{formatVND(o.finalAmount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-white/5">
                        <div className="flex items-center gap-3 text-gold">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase tracking-wider">Dữ liệu được trích xuất trực tiếp từ hệ thống đối soát thời gian thực.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
