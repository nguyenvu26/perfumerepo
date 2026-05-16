'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, 
    ArrowRightLeft, 
    AlertTriangle, 
    CheckCircle2, 
    Info,
    ChevronRight,
    TrendingUp,
    Store
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface HeatmapData {
    stores: Array<{ id: string; name: string; city: string }>;
    matrix: Array<{
        variantId: string;
        variantName: string;
        stores: Array<{
            storeId: string;
            stock: number;
            velocity: number;
            daysRemaining: number;
        }>;
    }>;
    recommendations: Array<{
        variantId: string;
        variantName: string;
        fromStoreId: string;
        fromStoreName: string;
        toStoreId: string;
        toStoreName: string;
        suggestedQuantity: number;
        reason: string;
    }>;
}

interface StockHeatmapWidgetProps {
    isExpanded?: boolean;
    onToggle?: () => void;
}

export function StockHeatmapWidget({ isExpanded = false, onToggle }: StockHeatmapWidgetProps) {
    const [data, setData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'matrix' | 'recommendations'>('matrix');

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/analytics/stock-heatmap');
                setData(data);
            } catch (e) {
                console.error('Heatmap error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    const getHeatColor = (days: number, velocity: number) => {
        if (velocity === 0) return 'bg-secondary/20 border-border text-muted-foreground';
        if (days < 5) return 'bg-red-500/80 border-red-600 text-white font-black shadow-sm';
        if (days < 15) return 'bg-amber-500/80 border-amber-600 text-white font-black shadow-sm';
        if (days > 45) return 'bg-emerald-500/80 border-emerald-600 text-white font-black shadow-sm';
        return 'bg-blue-500/70 border-blue-600 text-white font-black';
    };

    if (loading || !data) {
        return (
            <div className={cn(
                "glass bg-background/40 rounded-[2.5rem] border border-border/50 p-8 animate-pulse w-full",
                isExpanded ? "h-[500px]" : "h-[100px]"
            )} />
        );
    }

    return (
        <div className={cn(
            "glass bg-background/40 rounded-[2.5rem] border border-border overflow-hidden flex flex-col w-full group/widget hover:border-gold/20 transition-all duration-500 shadow-xl",
            !isExpanded && "hover:bg-secondary/10 cursor-pointer"
        )} onClick={!isExpanded ? onToggle : undefined}>
            {/* Header */}
            <div className="px-8 py-5 border-b border-border bg-secondary/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[.3em] gold-gradient">
                            Bản Đồ Nhiệt Luồng Hàng
                        </h3>
                        {!isExpanded ? (
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {data.recommendations.length > 0 
                                        ? `Có ${data.recommendations.length} đề xuất luân chuyển hàng`
                                        : "Tỉ lệ phủ kho toàn hệ thống: 98%"}
                                </p>
                                <div className="flex gap-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={cn(
                                            "w-3 h-1.5 rounded-full",
                                            i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : "bg-emerald-500/40"
                                        )} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                Phân tích vận tốc bán vs Tồn kho chi nhánh
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isExpanded && (
                        <div className="flex bg-secondary/30 p-1 rounded-xl border border-border">
                            <button 
                                onClick={() => setActiveTab('matrix')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'matrix' ? "bg-gold text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Ma trận
                            </button>
                            <button 
                                onClick={() => setActiveTab('recommendations')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    activeTab === 'recommendations' ? "bg-gold text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Đề xuất ({data.recommendations.length})
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        className="px-5 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 transition-all text-[9px] font-black uppercase tracking-widest text-gold"
                    >
                        {isExpanded ? 'Thu gọn' : 'Phóng to'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    <div className="p-8 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'matrix' ? (
                                <motion.div 
                                    key="matrix"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full overflow-x-auto custom-scrollbar"
                                >
                                    <table className="w-full border-separate border-spacing-2">
                                        <thead>
                                            <tr>
                                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 pb-4 pr-8">Sản phẩm / Biến thể</th>
                                                {data.stores.map(store => (
                                                    <th key={store.id} className="pb-4 px-2">
                                                        <div className="flex flex-col items-center">
                                                            <Store className="w-3 h-3 text-gold mb-1" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-foreground whitespace-nowrap">{store.name}</span>
                                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{store.city}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.matrix.map((row, i) => (
                                                <tr key={row.variantId} className="group/row">
                                                    <td className="py-2 pr-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-foreground/80 group-hover/row:text-gold transition-colors truncate max-w-[200px]">
                                                                {row.variantName}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1 opacity-30">
                                                                <TrendingUp className="w-2.5 h-2.5" />
                                                                <span className="text-[7px] font-black uppercase tracking-widest">Analytics Active</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {row.stores.map(cell => (
                                                        <td key={cell.storeId} className="p-0">
                                                            <motion.div 
                                                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                                                className={cn(
                                                                    "h-16 w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group/cell",
                                                                    getHeatColor(cell.daysRemaining, cell.velocity)
                                                                )}
                                                            >
                                                                <div className="absolute inset-0 bg-white opacity-0 group-hover/cell:opacity-5 transition-opacity" />
                                                                <span className="text-[14px] font-heading font-black text-white">{cell.stock}</span>
                                                                <div className="flex items-baseline gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                                                                    <span className="text-[8px] font-black uppercase text-gold">v:</span>
                                                                    <span className="text-[10px] font-black text-white">{cell.velocity}</span>
                                                                </div>
                                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20" />
                                                            </motion.div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="recommendations"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    {data.recommendations.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                                            <CheckCircle2 className="w-12 h-12" />
                                            <p className="text-[10px] font-black uppercase tracking-[.3em]">Hệ thống cân bằng - Không có đề xuất</p>
                                        </div>
                                    ) : (
                                        data.recommendations.map((rec, i) => (
                                            <div 
                                                key={i}
                                                className="p-6 rounded-[2rem] bg-secondary/10 border border-border hover:border-gold/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                                            >
                                                <div className="flex items-center gap-6 flex-1">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                                        <AlertTriangle className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-gold">{rec.variantName}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-medium italic">"{rec.reason}"</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-2xl border border-border">
                                                    <div className="text-center px-4 border-r border-white/10">
                                                        <p className="text-[7px] text-muted-foreground uppercase font-black tracking-widest mb-1">Từ Kho</p>
                                                        <p className="text-[10px] font-bold text-foreground/80">{rec.fromStoreName}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <ArrowRightLeft className="w-4 h-4 text-gold mb-1" />
                                                        <span className="text-[10px] font-black text-gold">x{rec.suggestedQuantity}</span>
                                                    </div>
                                                    <div className="text-center px-4 border-l border-white/10">
                                                        <p className="text-[7px] text-muted-foreground uppercase font-black tracking-widest mb-1">Đến Kho</p>
                                                        <p className="text-[10px] font-bold text-foreground/80">{rec.toStoreName}</p>
                                                    </div>
                                                </div>

                                                <button className="px-6 py-3 rounded-xl bg-gold text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                    Thực hiện Lệnh
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Legend Footer */}
                    <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 flex items-center gap-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/50" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Cháy hàng (&lt;5 ngày)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/50" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sắp hết (&lt;15 ngày)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500/50" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Thừa tồn kho (&gt;45 ngày)</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-muted-foreground/30">
                            <Info className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase tracking-widest italic">V: vận tốc bán (sp/ngày)</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
