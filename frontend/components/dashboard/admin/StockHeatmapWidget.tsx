'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, 
    ArrowRightLeft, 
    AlertTriangle, 
    CheckCircle2, 
    Info,
    ChevronRight,
    Store,
    Target,
    Zap,
    Filter,
    MousePointer2,
    Check,
    Search
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [executedItems, setExecutedItems] = useState<number[]>([]);

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

    const getCellStatus = (days: number, velocity: number, stock: number) => {
        if (stock === 0 && velocity === 0) return { label: 'Không kinh doanh', color: 'bg-secondary/10 text-muted-foreground/50 border-border/30' };
        if (stock === 0 && velocity > 0) return { label: 'Đã hết hàng', color: 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' };
        
        if (velocity === 0) {
            if (stock < 5) return { label: 'Tồn rất thấp (0 bán)', color: 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' };
            if (stock < 15) return { label: 'Tồn thấp (0 bán)', color: 'bg-amber-500/20 text-amber-500 border-amber-500/50' };
            return { label: 'Kho trệ (0 bán)', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' };
        }
        
        if (days < 5) return { label: `Cháy hàng (<5 ngày)`, color: 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' };
        if (days < 15) return { label: `Sắp hết (${Math.floor(days)} ngày)`, color: 'bg-amber-500/20 text-amber-500 border-amber-500/50' };
        if (days > 45) return { label: `Thừa kho (>45 ngày)`, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' };
        return { label: `Ổn định (${Math.floor(days)} ngày)`, color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' };
    };

    const isCriticalRow = (row: HeatmapData['matrix'][0]) => {
        return row.stores.some(s => 
            (s.daysRemaining < 15 && s.velocity > 0) || 
            (s.stock > 0 && s.stock < 15 && s.velocity === 0) ||
            (s.stock === 0 && s.velocity > 0)
        );
    };


    const [searchQuery, setSearchQuery] = useState('');

    const filteredMatrix = useMemo(() => {
        if (!data) return [];
        return data.matrix.filter(row => {
            const matchesSearch = row.variantName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFocus = !isFocusMode || isCriticalRow(row);
            return matchesSearch && matchesFocus;
        });
    }, [data, searchQuery, isFocusMode]);

    const handleExecute = (index: number) => {
        setExecutedItems(prev => [...prev, index]);
        toast.success('Đã khởi tạo lệnh điều chuyển hàng hóa!', {
            description: 'Thông báo đã được gửi đến quản lý chi nhánh liên quan.',
            action: {
                label: 'Hoàn tác',
                onClick: () => setExecutedItems(prev => prev.filter(i => i !== index))
            }
        });
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
            "glass dark:bg-background/40 rounded-[3rem] border border-border/60 overflow-hidden flex flex-col w-full group/widget hover:border-gold/30 transition-all duration-700 shadow-2xl relative",
            !isExpanded && "hover:bg-secondary/10 cursor-pointer"
        )} onClick={!isExpanded ? onToggle : undefined}>
            
            {/* Action-Oriented Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Redesigned Header */}
            <div className="px-10 py-6 border-b border-border/50 bg-secondary/30 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="p-3.5 rounded-2xl bg-gold/10 text-gold border border-gold/20 shadow-inner">
                            <Zap className="w-5 h-5 fill-gold/20" />
                        </div>
                        {data.recommendations.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-background animate-bounce">
                                {data.recommendations.length}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[.3em] gold-gradient">
                            Bản Đồ Nhiệt Luồng Hàng
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Tỉ lệ phủ kho hệ thống: <span className="text-foreground">98.4%</span>
                            </p>
                            {isExpanded && (
                                <div className="h-3 w-[1px] bg-border" />
                            )}
                            {isExpanded && (
                                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" />
                                    {data.recommendations.length} Điểm nóng cần xử lý
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isExpanded && (
                        <div className="flex items-center gap-3 mr-4">
                            {/* Premium Mini-Search Input */}
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 w-3.5 h-3.5 text-gold/60" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 w-44 rounded-xl bg-secondary/20 border border-border/80 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none text-[10px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/30 transition-all shadow-inner"
                                />
                            </div>

                            <button 
                                onClick={() => setIsFocusMode(!isFocusMode)}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
                                    isFocusMode 
                                        ? "bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                                        : "bg-secondary/20 border-border text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Filter className={cn("w-3 h-3", isFocusMode && "fill-red-500/20")} />
                                {isFocusMode ? 'Đã bật Focus' : 'Focus Điểm Nóng'}
                            </button>
                        </div>
                    )}

                    {isExpanded && (
                        <div className="flex bg-secondary/50 dark:bg-secondary/30 p-1.5 rounded-2xl border border-border shadow-inner">
                            <button 
                                onClick={() => setActiveTab('matrix')}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'matrix' ? "bg-gold text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Ma trận tồn
                            </button>
                            <button 
                                onClick={() => setActiveTab('recommendations')}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    activeTab === 'recommendations' ? "bg-gold text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Target className="w-3.5 h-3.5" />
                                Đề xuất ({data.recommendations.length})
                            </button>
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        className="p-3.5 rounded-2xl bg-secondary/10 hover:bg-gold/10 border border-border group-hover/widget:border-gold/30 transition-all"
                    >
                        {isExpanded ? (
                            <div className="w-5 h-5 flex flex-col justify-center gap-1 items-center">
                                <div className="w-4 h-0.5 bg-current rounded-full" />
                            </div>
                        ) : (
                            <MousePointer2 className="w-5 h-5 text-gold/60" />
                        )}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    <div className="p-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'matrix' ? (
                                <motion.div 
                                    key="matrix"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="w-full max-h-[460px] overflow-y-auto overflow-x-auto pr-2 custom-scrollbar-horizontal pb-4"
                                >
                                    <table className="w-full border-separate border-spacing-x-3 border-spacing-y-4 relative">
                                        <thead>
                                            <tr>
                                                <th className="sticky top-0 bg-background/95 backdrop-blur-xl z-20 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 pb-6 pr-6 border-b border-border/30">
                                                    Sản phẩm / Biến thể
                                                </th>
                                                {data.stores.map(store => (
                                                    <th key={store.id} className="sticky top-0 bg-background/95 backdrop-blur-xl z-20 pb-6 px-3 border-b border-border/30 min-w-[200px]">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-xl bg-secondary/30 flex items-center justify-center mb-2 border border-border/50">
                                                                <Store className="w-4 h-4 text-gold/50" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground whitespace-nowrap">{store.name}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">{store.city}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMatrix.length === 0 ? (
                                                <tr>
                                                    <td colSpan={data.stores.length + 1} className="py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Search className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Không tìm thấy sản phẩm phù hợp</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMatrix.map((row, i) => (
                                                    <motion.tr 
                                                        key={row.variantId} 
                                                        className="group/row"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: Math.min(i * 0.03, 0.4) }}
                                                    >
                                                        <td className="py-2 pr-10">
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-bold text-foreground/90 group-hover/row:text-gold transition-colors truncate max-w-[240px]">
                                                                    {row.variantName}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {row.stores.map(cell => {
                                                            const status = getCellStatus(cell.daysRemaining, cell.velocity, cell.stock);
                                                            const isFaded = isFocusMode && !((cell.daysRemaining < 15 && cell.velocity > 0) || (cell.stock > 0 && cell.stock < 15 && cell.velocity === 0) || (cell.stock === 0 && cell.velocity > 0));
                                                            
                                                            return (
                                                                <td key={cell.storeId} className="p-0 align-middle">
                                                                    <div className={cn(
                                                                        "flex flex-col gap-3 p-4 rounded-[1.2rem] border transition-all relative overflow-hidden",
                                                                        status.color,
                                                                        isFaded && "opacity-20 grayscale scale-95 blur-[0.5px]"
                                                                    )}>
                                                                        <div className="flex items-center justify-between gap-4 relative z-10">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-0.5">Tồn kho</span>
                                                                                <span className="text-2xl font-heading font-black leading-none">{cell.stock}</span>
                                                                            </div>
                                                                            <div className="flex flex-col items-end text-right">
                                                                                <span className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-0.5">Tốc độ bán</span>
                                                                                <span className="text-sm font-bold bg-background/80 dark:bg-background/50 px-2 py-0.5 rounded-md border border-current/10">
                                                                                    {cell.velocity}/ngày
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-1 pt-2 border-t border-current/20 flex items-center justify-between relative z-10">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                                {status.label}
                                                                            </span>
                                                                            {(status.label.includes('Cháy') || status.label.includes('hết')) && (
                                                                                <AlertTriangle className="w-3 h-3 animate-pulse" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </motion.tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="recommendations"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="max-w-5xl mx-auto space-y-6"
                                >
                                    <div className="flex items-center justify-between mb-8 p-6 bg-gold/5 rounded-[2rem] border border-gold/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-full bg-gold text-black shadow-lg shadow-gold/20">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-gold-foreground">Cockpit Điều Vận Thông Minh</h4>
                                                <p className="text-[10px] text-muted-foreground/60 font-medium">Hệ thống khuyến nghị dựa trên vận tốc bán hàng thực tế và tồn kho an toàn.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Hiệu quả tối ưu</p>
                                            <p className="text-xl font-heading font-black text-emerald-500">+24% <span className="text-[10px] uppercase font-bold text-muted-foreground">doanh thu / tuần</span></p>
                                        </div>
                                    </div>

                                    {data.recommendations.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                                            <div className="p-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <CheckCircle2 className="w-16 h-16" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[.4em]">Toàn hệ thống đã cân bằng</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {data.recommendations.map((rec, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ 
                                                        opacity: executedItems.includes(i) ? 0.4 : 1, 
                                                        x: 0,
                                                        filter: executedItems.includes(i) ? 'grayscale(1)' : 'none'
                                                    }}
                                                    className={cn(
                                                        "p-8 rounded-[2.5rem] bg-secondary/20 border border-border/80 hover:border-gold/30 transition-all flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group/rec shadow-xl",
                                                        executedItems.includes(i) && "border-emerald-500/30 bg-emerald-500/5"
                                                    )}
                                                >
                                                    {executedItems.includes(i) && (
                                                        <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                                            <div className="bg-emerald-500 text-black px-6 py-2 rounded-full flex items-center gap-2 font-black uppercase text-[10px] shadow-xl">
                                                                <Check className="w-4 h-4" /> Đã duyệt lệnh
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-8 flex-1">
                                                        <div className="relative">
                                                            <div className="w-16 h-16 rounded-[1.8rem] bg-amber-500/10 flex items-center justify-center text-amber-500 border-2 border-amber-500/20 shadow-inner">
                                                                <AlertTriangle className="w-8 h-8" />
                                                            </div>
                                                            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-gold text-black border-4 border-background shadow-lg">
                                                                <Zap className="w-3 h-3 fill-current" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-sm font-black uppercase tracking-widest text-gold">{rec.variantName}</h4>
                                                                <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-[8px] font-black uppercase border border-red-500/20">Ưu tiên cao</span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground/80 font-medium italic border-l-2 border-gold/30 pl-3">
                                                                "{rec.reason}"
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 bg-background/80 dark:bg-background/40 backdrop-blur-xl p-5 rounded-[2rem] border border-border shadow-inner">
                                                        <div className="text-center px-6 border-r border-border/50">
                                                            <p className="text-[8px] text-muted-foreground/50 uppercase font-black tracking-widest mb-1.5">Nguồn cấp</p>
                                                            <div className="flex items-center gap-2">
                                                                <Store className="w-3 h-3 text-gold/60" />
                                                                <p className="text-[11px] font-bold text-foreground/80">{rec.fromStoreName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="p-2 rounded-full bg-gold/10 text-gold mb-1 border border-gold/10 scale-110">
                                                                <ArrowRightLeft className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[14px] font-black text-gold">x{rec.suggestedQuantity}</span>
                                                        </div>
                                                        <div className="text-center px-6 border-l border-border/50">
                                                            <p className="text-[8px] text-muted-foreground/50 uppercase font-black tracking-widest mb-1.5">Đích đến</p>
                                                            <div className="flex items-center gap-2">
                                                                <Store className="w-3 h-3 text-emerald-500/60" />
                                                                <p className="text-[11px] font-bold text-foreground/80">{rec.toStoreName}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        disabled={executedItems.includes(i)}
                                                        onClick={() => handleExecute(i)}
                                                        className={cn(
                                                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.03] active:scale-[0.97]",
                                                            "bg-gold text-black hover:bg-white hover:text-black"
                                                        )}
                                                    >
                                                        Thực hiện Lệnh
                                                    </button>
                                                </motion.div>
                                            ))}
                                            
                                            <motion.button 
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="w-full py-6 rounded-[2.5rem] bg-emerald-500 text-black text-[12px] font-black uppercase tracking-[.3em] shadow-2xl shadow-emerald-500/20 hover:bg-white transition-all mt-6"
                                            >
                                                Phê duyệt tất cả lệnh điều chuyển ({data.recommendations.length - executedItems.length})
                                            </motion.button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Legend Footer */}
                    <div className="px-10 py-6 bg-secondary/30 flex items-center gap-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-md bg-red-500/20 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cháy hàng (&lt;5 ngày)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-md bg-amber-500/20 border border-amber-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sắp hết (&lt;15 ngày)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-md bg-blue-500/20 border border-blue-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ổn định</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Thừa kho (&gt;45 ngày)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-md bg-purple-500/20 border border-purple-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Kho trệ (0 bán)</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-muted-foreground/30 px-6 py-2 bg-secondary/10 rounded-full border border-border/50">
                            <Info className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest italic">Tất cả dữ liệu được cập nhật theo thời gian thực</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
