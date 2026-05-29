'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShoppingBag, Box, TrendingUp, 
    ArrowRight, Clock, User, Banknote, CreditCard,
    DollarSign, Percent, AlertCircle, ExternalLink, Eye
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';

interface ClosingDetailProps {
    id: string | null;
    onClose: () => void;
}

export function ClosingDetailPanel({ id, onClose }: ClosingDetailProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [orderDetail, setOrderDetail] = useState<any>(null);
    const [orderLoading, setOrderLoading] = useState(false);

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

    useEffect(() => {
        if (selectedOrderId) {
            const fetchOrder = async () => {
                setOrderLoading(true);
                try {
                    const { data } = await api.get(`/orders/admin/${selectedOrderId}`);
                    setOrderDetail(data);
                } catch (e) {
                    console.error('Failed to fetch order', e);
                } finally {
                    setOrderLoading(false);
                }
            };
            fetchOrder();
        } else {
            setOrderDetail(null);
        }
    }, [selectedOrderId]);

    const formatVND = (v: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    };

    return (
        <>
            {/* ── Main Detail Side Panel ────────────────────────────────── */}
            <AnimatePresence>
                {id && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
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
                            className="relative w-full max-w-2xl bg-white text-foreground dark:bg-zinc-950 border-l border-border h-full shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-stone-50/90 dark:bg-white/[0.04]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading text-foreground uppercase tracking-tight">Chi tiết ca chốt</h2>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            {data?.closing?.store?.name} • {data?.closing?.closingDate && new Date(data.closing.closingDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
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
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-50/35 dark:bg-transparent">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-4 p-6">
                                        <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-4 border border-border shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Lợi nhuận gộp</span>
                                            </div>
                                            <p className="text-xl font-heading text-emerald-400">{formatVND(data.stats.profit)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-4 border border-border shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                                    <TrendingUp className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">AOV (Đơn TB)</span>
                                            </div>
                                            <p className="text-xl font-heading text-foreground">{formatVND(data.stats.avgOrderValue)}</p>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="px-6 flex items-center gap-6 border-b border-border mb-6">
                                        <button 
                                            onClick={() => setActiveTab('products')}
                                            className={cn(
                                                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                                activeTab === 'products' ? "text-gold" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Sản phẩm đã bán ({data.soldProducts.length})
                                            {activeTab === 'products' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('orders')}
                                            className={cn(
                                                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                                activeTab === 'orders' ? "text-gold" : "text-muted-foreground hover:text-foreground"
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
                                                    <Link 
                                                        key={p.id} 
                                                        href={`/dashboard/admin/products?search=${p.sku}`}
                                                        className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.04] rounded-2xl border border-border group hover:bg-gold/[0.04] hover:border-gold/30 transition-all shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:text-gold transition-colors">
                                                                {p.image ? (
                                                                    <img 
                                                                        src={p.image} 
                                                                        alt={p.name}
                                                                        className="w-full h-full object-cover rounded-xl"
                                                                    />
                                                                ) : (
                                                                    p.sku.slice(-2)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground group-hover:text-gold transition-colors">{p.name}</h4>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">SKU: {p.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4">
                                                            <div>
                                                                <p className="text-sm font-black text-foreground">{formatVND(p.revenue)}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Số lượng: {p.quantity}</p>
                                                            </div>
                                                            <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-gold/50 transition-all" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {data.orders.map((o: any) => (
                                                    <button 
                                                        key={o.id} 
                                                        onClick={() => setSelectedOrderId(o.id)}
                                                        className="w-full text-left p-4 bg-white dark:bg-white/[0.04] rounded-2xl border border-border space-y-3 hover:bg-gold/[0.04] hover:border-gold/30 transition-all group shadow-sm"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-foreground uppercase group-hover:text-gold transition-colors">#{o.id.slice(-8)}</span>
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                                                                    o.paymentMethod === 'CASH' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                                                )}>
                                                                    {o.paymentMethod}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</span>
                                                                <Eye className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-gold transition-colors" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[8px] font-bold text-muted-foreground/40 group-hover:text-gold/50 transition-colors">
                                                                    {o.user?.fullName?.[0] || '?'}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">{o.user?.fullName || 'Khách vãng lai'}</span>
                                                            </div>
                                                            <span className="text-sm font-black text-foreground group-hover:text-gold transition-colors">{formatVND(o.finalAmount)}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-stone-50/90 dark:bg-white/[0.04]">
                                <div className="flex items-center gap-3 text-gold">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Dữ liệu được trích xuất trực tiếp từ hệ thống đối soát thời gian thực.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Quick Order Modal View ───────────────────────────────── */}
            <AnimatePresence>
                {selectedOrderId && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrderId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white text-foreground dark:bg-zinc-950 border border-border rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            {orderLoading ? (
                                <div className="p-20 flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest animate-pulse">Chi tiết đơn hàng...</span>
                                </div>
                            ) : orderDetail ? (
                                <div className="flex flex-col">
                                    <div className="p-6 border-b border-border flex items-center justify-between bg-stone-50/90 dark:bg-white/[0.04] text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                        <span>Mã Đơn: #{orderDetail.id.slice(-8)}</span>
                                        <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:text-foreground transition-colors"><X size={18}/></button>
                                    </div>
                                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                        {/* Products in order */}
                                        <div className="space-y-3">
                                            {orderDetail.items?.map((item: any) => (
                                                <div key={item.id} className="flex gap-4 p-3 bg-stone-50 dark:bg-white/[0.04] rounded-2xl border border-border">
                                                    <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-white/5 flex-shrink-0 overflow-hidden border border-border">
                                                        {item.variant?.product?.images?.[0]?.url ? (
                                                            <img 
                                                                src={item.variant.product.images[0].url} 
                                                                alt={item.product?.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-muted-foreground">IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[11px] font-bold text-foreground truncate">{item.product?.name || item.variant?.product?.name}</div>
                                                        <div className="text-[9px] text-muted-foreground uppercase tracking-tighter">{item.variant?.name}</div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] font-bold text-gold">{formatVND(item.unitPrice)}</span>
                                                            <span className="text-[9px] font-black text-muted-foreground">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="pt-4 border-t border-border flex items-center justify-between">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tổng Thanh Toán</span>
                                            <span className="text-lg font-heading text-foreground">{formatVND(orderDetail.finalAmount)}</span>
                                        </div>
                                        
                                        <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-muted-foreground">Thanh toán</span>
                                                <span className="text-gold">{orderDetail.paymentMethod}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-muted-foreground">Khách hàng</span>
                                                <span className="text-foreground">{orderDetail.user?.fullName || 'Khách vãng lai'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-stone-50/90 dark:bg-white/[0.04] border-t border-border">
                                        <Link 
                                            href={`/dashboard/admin/orders/${orderDetail.id}`}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-white/5 border border-border rounded-xl text-[10px] font-black text-muted-foreground hover:text-gold hover:border-gold/50 transition-all uppercase tracking-[0.2em]"
                                        >
                                            Xem Hồ Sơ Đơn Hàng Đầy Đủ <ArrowRight size={14}/>
                                        </Link>
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
