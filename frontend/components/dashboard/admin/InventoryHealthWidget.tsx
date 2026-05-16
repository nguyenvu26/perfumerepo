'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';
import Image from 'next/image';

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

    if (loading) {
        return (
            <div className={cn(
                "glass bg-background/40 rounded-[2.5rem] border border-border/50 p-8 animate-pulse w-full",
                isExpanded ? "h-[500px]" : "h-[100px]"
            )} />
        );
    }

    const criticalCount = data.filter(i => i.status === 'CRITICAL').length;
    const warningCount = data.filter(i => i.status === 'WARNING').length;

    return (
        <div className={cn(
            "glass bg-background/40 rounded-[2.5rem] border border-border overflow-hidden flex flex-col w-full group/widget hover:border-gold/20 transition-all duration-500 shadow-xl",
            !isExpanded && "hover:bg-secondary/10 cursor-pointer"
        )} onClick={!isExpanded ? onToggle : undefined}>
            {/* Horizontal Header */}
            <div className="px-8 py-5 border-b border-border bg-secondary/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[.3em] gold-gradient">
                            Sức Khỏe Kho & Dự Báo Thông Minh
                        </h3>
                        {!isExpanded ? (
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", criticalCount > 0 ? "bg-red-500" : "bg-emerald-500")} />
                                    {criticalCount > 0 ? `Cảnh báo: ${criticalCount} mặt hàng cạn kiệt` : "Kho hàng ổn định"}
                                </p>
                                {warningCount > 0 && (
                                    <p className="text-[9px] text-amber-500/60 font-bold uppercase tracking-widest">
                                        • {warningCount} mặt hàng sắp hết
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Phân tích luồng bán hàng 30 ngày gần nhất
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/admin/stores/stock">
                        <button className="px-4 py-2 rounded-xl bg-secondary/20 hover:bg-secondary/30 border border-border transition-all text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                            Kho tổng
                        </button>
                    </Link>
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
                    className="overflow-hidden"
                >
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {data.length === 0 ? (
                                <div className="col-span-full h-32 flex flex-col items-center justify-center opacity-30 gap-2">
                                    <AlertCircle className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Dữ liệu đang được tổng hợp...</span>
                                </div>
                            ) : (
                                data.map((item, i) => (
                                    <motion.div
                                        key={item.variantId}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ 
                                            scale: 1.02, 
                                            zIndex: 10,
                                            backgroundColor: 'var(--secondary)',
                                            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)'
                                        }}
                                        transition={{ 
                                            delay: i * 0.04,
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25
                                        }}
                                        className="relative p-4 rounded-[1.8rem] bg-secondary/5 border border-border hover:border-gold transition-all duration-200 group/card cursor-pointer"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            {/* Thumbnail Area */}
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-secondary border border-border shrink-0 shadow-sm group-hover/card:scale-110 transition-transform duration-500">
                                                {item.imageUrl ? (
                                                    <Image 
                                                        src={item.imageUrl} 
                                                        alt="" 
                                                        width={48} 
                                                        height={48} 
                                                        className="w-full h-full object-cover grayscale group-hover/card:grayscale-0 transition-all duration-700" 
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-[11px] font-bold text-foreground truncate flex-1 pr-2 leading-tight group-hover/card:text-gold transition-colors">
                                                        {item.name}
                                                    </h4>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full shadow-[0_0_8px]",
                                                    item.status === 'CRITICAL' ? "bg-red-500 shadow-red-500/50" :
                                                    item.status === 'WARNING' ? "bg-amber-500 shadow-amber-500/50" :
                                                    "bg-emerald-500 shadow-emerald-500/50"
                                                )} />
                                            </div>
                                            <span className={cn(
                                                "text-[7px] font-black px-2 py-0.5 rounded-md border tracking-tighter uppercase",
                                                item.status === 'CRITICAL' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                item.status === 'WARNING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            )}>
                                                    {item.status === 'CRITICAL' ? 'Cạn kiệt' : item.status === 'WARNING' ? 'Sắp hết' : 'Ổn định'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4 p-2.5 bg-secondary/20 rounded-2xl border border-border">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] text-muted-foreground uppercase font-black tracking-tighter">Ngày cạn</span>
                                                <span className={cn(
                                                    "text-xs font-heading font-bold",
                                                    item.daysRemaining < 7 ? "text-red-500" : "text-foreground/80"
                                                )}>
                                                    {item.daysRemaining > 90 ? '> 90n' : `${item.daysRemaining} ngày`}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[7px] text-muted-foreground uppercase font-black tracking-tighter">Xoay vòng</span>
                                                <span className="text-xs font-heading font-bold text-gold">
                                                    {item.turnoverRate}x
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-tighter opacity-30 px-1">
                                                <span>Tồn: {item.currentStock}</span>
                                                <span>Bán: {item.monthlySales}/th</span>
                                            </div>
                                            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (item.monthlySales / Math.max(1, item.currentStock + item.monthlySales)) * 100)}%` }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        item.status === 'CRITICAL' ? "bg-red-400" :
                                                        item.status === 'WARNING' ? "bg-amber-400" :
                                                        "bg-emerald-400"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
