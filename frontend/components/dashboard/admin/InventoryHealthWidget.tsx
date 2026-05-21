'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, ShoppingCart, ArrowRight, Activity } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { toast } from 'sonner';

interface HealthItem {
    variantId: string;
    name: string;
    currentStock: number;
    monthlySales: number;
    daysRemaining: number;
    turnoverRate: number;
    status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
    imageUrl?: string | null;
}

interface InventoryHealthWidgetProps {
    isExpanded?: boolean;
    onToggle?: () => void;
}

export function InventoryHealthWidget({ isExpanded = false, onToggle }: InventoryHealthWidgetProps) {
    const [data, setData] = useState<HealthItem[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/analytics/inventory-health');
                setData(data);
            } catch (e) {
                console.error('Inventory health error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    const groupedData = useMemo(() => {
        const groups = {
            critical: data.filter(i => i.status === 'CRITICAL'),
            warning: data.filter(i => i.status === 'WARNING'),
            healthy: data.filter(i => i.status === 'HEALTHY'),
        };
        return groups;
    }, [data]);

    const handleReorder = (item: HealthItem) => {
        toast.success(`Đã thêm ${item.name} vào danh sách dự thảo nhập hàng`, {
            icon: <ShoppingCart className="w-4 h-4" />,
        });
    };

    if (loading) {
        return (
            <div className={cn(
                "glass bg-background/40 rounded-[2.5rem] border border-border/50 p-8 animate-pulse w-full",
                isExpanded ? "min-h-[500px]" : "h-[100px]"
            )} />
        );
    }

    const criticalCount = groupedData.critical.length;
    const warningCount = groupedData.warning.length;

    return (
        <div className={cn(
            "glass dark:bg-background/40 rounded-[3rem] border border-border overflow-hidden flex flex-col w-full group/widget hover:border-gold/20 transition-all duration-700 shadow-2xl",
            !isExpanded && "hover:bg-secondary/10 cursor-pointer"
        )} onClick={!isExpanded ? onToggle : undefined}>
            
            {/* Action Header */}
            <div className="px-10 py-6 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-500 shadow-lg",
                        criticalCount > 0 ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" : "bg-gold/10 text-gold border-gold/20"
                    )}>
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[.3em] gold-gradient">
                            Sức Khỏe Kho & Dự Báo Thông Minh
                        </h3>
                        {!isExpanded ? (
                            <div className="flex items-center gap-4 mt-1.5">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", criticalCount > 0 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                                    {criticalCount > 0 ? `${criticalCount} mặt hàng cần nhập gấp` : "Nguồn cung ổn định"}
                                </p>
                                {warningCount > 0 && (
                                    <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest">
                                        • {warningCount} hàng sắp hết
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Tự động tối ưu sản lượng nhập kho theo vận tốc bán
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/stores/stock">
                        <button className="px-6 py-2.5 rounded-xl bg-secondary/30 hover:bg-gold/10 border border-border transition-all text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-gold">
                            Kho tổng
                        </button>
                    </Link>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        className="px-6 py-2.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 transition-all text-[10px] font-black uppercase tracking-widest text-gold shadow-lg"
                    >
                        {isExpanded ? 'Thu gọn' : 'Phóng to'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                >
                    <div className="p-10 space-y-12">
                        {/* 1. Critical Section */}
                        {criticalCount > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/20">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-[.25em] text-red-500">
                                            Lệnh Nhập Hàng Khẩn Cấp (<span className="text-foreground">{criticalCount}</span>)
                                        </h4>
                                    </div>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors">
                                        Tạo đơn nhập hàng loạt <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {groupedData.critical.map((item, i) => (
                                        <HealthCard key={item.variantId} item={item} index={i} onReorder={() => handleReorder(item)} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Warning Section */}
                        {warningCount > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/20">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-[.25em] text-amber-500">
                                        Cảnh Báo Sắp Hết Hàng ({warningCount})
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {groupedData.warning.map((item, i) => (
                                        <HealthCard 
                                            key={item.variantId} 
                                            item={item} 
                                            index={i} 
                                            isSmall 
                                            onReorder={() => handleReorder(item)} 
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State for Action Cockpit */}
                        {(criticalCount === 0 && warningCount === 0) && (
                            <div className="h-56 flex flex-col items-center justify-center text-muted-foreground/40 gap-4 border border-dashed border-border/30 rounded-[3rem] bg-secondary/5 relative overflow-hidden p-8 text-center">
                                <div className="absolute -inset-x-20 -inset-y-20 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] animate-pulse" />
                                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative z-10 animate-bounce">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="space-y-1 relative z-10">
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">Logistics Vận Hành Hoàn Hảo</h5>
                                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest max-w-md mx-auto">
                                        Hệ thống không ghi nhận bất kỳ cảnh báo cạn kiệt hay tồn kho an toàn nào. Tất cả sản phẩm đều đang ở trạng thái lý tưởng!
                                    </p>
                                </div>
                            </div>
                        )}

                        {data.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                                <Package className="w-12 h-12" />
                                <span className="text-[12px] font-black uppercase tracking-[.4em]">Đang đồng bộ dữ liệu kho vật lý...</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function HealthCard({ item, index, isSmall = false, onReorder }: { item: HealthItem, index: number, isSmall?: boolean, onReorder: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
                y: -8,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'var(--gold)'
            }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                "relative rounded-[2.5rem] bg-secondary/20 dark:bg-secondary/5 border border-border/80 p-6 flex flex-col group/card transition-all duration-300",
                item.status === 'CRITICAL' && "border-red-500/20 shadow-xl shadow-red-500/5",
                isSmall && "rounded-[2rem] p-5"
            )}
        >
            <div className="flex gap-5 mb-6">
                <div className={cn(
                    "rounded-[1.8rem] overflow-hidden bg-secondary/50 dark:bg-secondary border border-border/50 shrink-0 shadow-xl group-hover/card:scale-110 transition-transform duration-500",
                    isSmall ? "w-14 h-14" : "w-16 h-16"
                )}>
                    {item.imageUrl ? (
                        <Image 
                            src={item.imageUrl} 
                            alt="" 
                            width={64} 
                            height={64} 
                            className="w-full h-full object-cover grayscale opacity-80 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-700" 
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className={cn(
                            "font-bold text-foreground leading-tight group-hover/card:text-gold transition-colors truncate",
                            isSmall ? "text-[12px]" : "text-[14px]"
                        )}>
                            {item.name}
                        </h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[8px] font-black px-2.5 py-1 rounded-lg border tracking-tighter uppercase",
                            item.status === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            item.status === 'WARNING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                            {item.status === 'CRITICAL' ? 'Cạn kiệt' : item.status === 'WARNING' ? 'Sắp hết' : 'Lý tưởng'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2.5 mb-6 p-4 bg-secondary/40 dark:bg-secondary/30 rounded-3xl border border-border/50 shadow-inner text-[11px]">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-wider">Vận tốc bán</span>
                    <span className="font-heading font-black text-xs text-foreground">
                        {item.monthlySales}<span className="text-[8px] text-muted-foreground/40 ml-1">/th</span>
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-wider">Thời gian còn lại (Days Remaining)</span>
                    <span className={cn(
                        "font-heading font-black text-xs",
                        item.daysRemaining < 7 ? "text-red-500" : "text-gold"
                    )}>
                        {item.daysRemaining} ngày
                    </span>
                </div>
            </div>

            <div className="mt-auto flex items-center gap-3">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-50 px-1">
                        <span>Tồn kho: {item.currentStock}</span>
                        <span>Vòng quay: {Math.round(item.turnoverRate * 10) / 10}x</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 dark:bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-border/50">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (item.monthlySales / Math.max(1, item.currentStock + (item.monthlySales/2))) * 100)}%` }}
                            className={cn(
                                "h-full rounded-full shadow-[0_0_10px]",
                                item.status === 'CRITICAL' ? "bg-red-500 shadow-red-500/30" :
                                item.status === 'WARNING' ? "bg-amber-500 shadow-amber-500/30" :
                                "bg-emerald-500 shadow-emerald-500/30"
                            )}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(); }}
                    className={cn(
                        "p-3 rounded-2xl transition-all duration-300 shadow-lg shrink-0",
                        item.status === 'CRITICAL' 
                            ? "bg-red-500 text-white hover:bg-white hover:text-black" 
                            : "bg-gold/10 text-gold hover:bg-gold hover:text-black border border-gold/10"
                    )}
                >
                    <ShoppingCart className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
