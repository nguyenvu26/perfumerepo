'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, ShoppingCart, ArrowRight, Activity, Store, HelpCircle, X, Zap, ChevronDown, Check } from 'lucide-react';
import api from '@/lib/axios';
import { storesService } from '@/services/stores.service';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/lib/i18n';
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
    const router = useRouter();
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
    const [showAlgorithm, setShowAlgorithm] = useState(false);
    const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
    const storeMenuRef = useRef<HTMLDivElement>(null);

    // Click outside to close store menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (storeMenuRef.current && !storeMenuRef.current.contains(event.target as Node)) {
                setIsStoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchHealth = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/analytics/inventory-health', {
                params: { storeId: selectedStoreId }
            });
            setData(data);
        } catch (e) {
            console.error('Inventory health error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        storesService.list().then(res => setStores(res.filter((s: any) => s.type !== 'CENTRAL'))).catch(console.error);
    }, []);

    useEffect(() => {
        fetchHealth();
    }, [selectedStoreId]);

    const groupedData = useMemo(() => {
        const groups = {
            critical: data.filter(i => i.status === 'CRITICAL'),
            warning: data.filter(i => i.status === 'WARNING'),
            healthy: data.filter(i => i.status === 'HEALTHY'),
        };
        return groups;
    }, [data]);

    const handleReorder = (item: HealthItem) => {
        // Redirect to stock page with batch-import tab and pre-selected variant/store
        const query = new URLSearchParams({
            tab: 'batch-import',
            variantId: item.variantId
        });
        
        if (selectedStoreId !== 'all') {
            query.append('storeId', selectedStoreId);
        }
        
        router.push(`/dashboard/admin/stores/stock?${query.toString()}`);
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
            <div className="px-6 sm:px-10 py-5 sm:py-6 border-b border-border/50 bg-secondary/30 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 xl:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full">
                    <div className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-500 shadow-lg",
                        criticalCount > 0 ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" : "bg-gold/10 text-gold border-gold/20"
                    )}>
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[.2em] sm:tracking-[.3em] gold-gradient leading-tight">
                                Sức Khỏe Kho & Dự Báo Thông Minh
                            </h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowAlgorithm(true); }}
                                className="p-1 rounded-full hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors shrink-0"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {!isExpanded ? (
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", criticalCount > 0 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                                    {criticalCount > 0 ? `${criticalCount} mặt hàng cần nhập gấp` : "Nguồn cung ổn định"}
                                </p>
                                {warningCount > 0 && (
                                    <p className="text-[9px] sm:text-[10px] text-amber-500/80 font-bold uppercase tracking-widest">
                                        • {warningCount} hàng sắp hết
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 flex items-start sm:items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1 sm:mt-0 shrink-0" />
                                <span className="leading-relaxed">Tự động tối ưu sản lượng nhập kho theo vận tốc bán</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full xl:w-auto">
                    {/* Custom Store Selector */}
                    <div className="relative w-full sm:w-auto shrink-0" ref={storeMenuRef}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsStoreMenuOpen(!isStoreMenuOpen); }}
                        className={cn(
                          "flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-2xl border transition-all duration-500 w-full sm:min-w-[200px] group/btn",
                          isStoreMenuOpen 
                            ? "bg-gold/10 border-gold/40 shadow-gold/10 shadow-lg" 
                            : "bg-white/5 border-white/10 hover:border-gold/20"
                        )}
                      >
                        <Store className={cn("w-4 h-4 transition-colors", isStoreMenuOpen ? "text-gold" : "text-muted-foreground")} />
                        <span className="flex-1 text-left text-[10px] font-black uppercase tracking-widest leading-none">
                          {selectedStoreId === 'all' ? 'Toàn hệ thống' : stores.find(s => s.id === selectedStoreId)?.name || 'Chọn chi nhánh'}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isStoreMenuOpen && "rotate-180 text-gold")} />
                      </button>

                      <AnimatePresence>
                        {isStoreMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-3 right-0 w-[240px] glass rounded-[2rem] border border-white/10 shadow-3xl z-[100] overflow-hidden"
                          >
                            <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar border-t border-white/5">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedStoreId('all'); setIsStoreMenuOpen(false); }}
                                className={cn(
                                  "w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all mb-1 group/item",
                                  selectedStoreId === 'all' ? "bg-gold/10 text-gold" : "hover:bg-white/5 text-muted-foreground font-medium"
                                )}
                              >
                                <span className={cn("text-[10px] uppercase tracking-widest font-black", selectedStoreId === 'all' ? "text-gold" : "group-hover/item:text-foreground")}>Toàn hệ thống</span>
                                {selectedStoreId === 'all' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              {stores.map(s => (
                                <button
                                  key={s.id}
                                  onClick={(e) => { e.stopPropagation(); setSelectedStoreId(s.id); setIsStoreMenuOpen(false); }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all mb-1 group/item text-left",
                                    selectedStoreId === s.id ? "bg-gold/10 text-gold" : "hover:bg-white/5 text-muted-foreground font-medium"
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className={cn("text-[10px] uppercase tracking-widest font-black", selectedStoreId === s.id ? "text-gold" : "group-hover/item:text-foreground")}>{s.name}</span>
                                    <span className="text-[8px] opacity-40 uppercase tracking-tighter mt-0.5">{s.type === 'BOUTIQUE' ? 'Cửa hàng' : 'Kho'}</span>
                                  </div>
                                  {selectedStoreId === s.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link href="/dashboard/admin/stores/stock" className="flex-1 sm:flex-none">
                        <button className="w-full px-4 sm:px-6 py-2.5 rounded-xl bg-secondary/30 hover:bg-gold/10 border border-border transition-all text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-gold shrink-0">
                            Kho tổng
                        </button>
                    </Link>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        className="flex-1 sm:flex-none w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gold shadow-lg shrink-0"
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
                    <div className="p-6 sm:p-10 space-y-8 sm:space-y-12">
                        {/* 1. Critical Section */}
                        {criticalCount > 0 && (
                            <section className="space-y-4 sm:space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/20">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-[.2em] sm:tracking-[.25em] text-red-500">
                                            Lệnh Nhập Hàng Khẩn Cấp (<span className="text-foreground">{criticalCount}</span>)
                                        </h4>
                                    </div>
                                    <button className="flex w-fit items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors bg-red-500/10 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl sm:rounded-none">
                                        Tạo đơn nhập hàng loạt <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {groupedData.critical.map((item, i) => (
                                        <HealthCard key={item.variantId} item={item} index={i} onReorder={() => handleReorder(item)} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Warning Section */}
                        {warningCount > 0 && (
                            <section className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/20">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-[.2em] sm:tracking-[.25em] text-amber-500">
                                        Cảnh Báo Sắp Hết Hàng ({warningCount})
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
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
                            <div className="py-12 sm:h-64 flex flex-col items-center justify-center text-muted-foreground/40 gap-4 sm:gap-6 border border-dashed border-border/30 rounded-[2.5rem] sm:rounded-[3rem] bg-secondary/5 relative overflow-hidden px-6 sm:px-8 text-center mt-4">
                                <div className="absolute -inset-x-20 -inset-y-20 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] animate-pulse" />
                                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative z-10 animate-bounce mt-4 sm:mt-0">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">Logistics Vận Hành Hoàn Hảo</h5>
                                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
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

            {/* Algorithm Explanation - Side Drawer */}
            <AnimatePresence>
                {showAlgorithm && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAlgorithm(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        />
                        {/* Side Panel */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                            className="fixed top-0 right-0 h-full w-full max-w-xl bg-zinc-950 border-l border-gold/20 shadow-2xl shadow-black/50 z-[201] flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-900/80 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[.2em] gold-gradient">
                                            Thuật Toán Vận Hành
                                        </h2>
                                        <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-0.5">
                                            Sức Khỏe Kho & Dự Báo Thông Minh
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowAlgorithm(false)}
                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">

                                {/* Section 1: DSR */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[11px] font-black">01</div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gold/80">
                                            Vận tốc bán (Daily Sales Rate)
                                        </h4>
                                    </div>
                                    <p className="text-[13px] leading-relaxed text-stone-400 mb-4">
                                        Hệ thống phân tích dữ liệu bán hàng trong <span className="text-white font-bold">30 ngày gần nhất</span> để tính trung bình số lượng tiêu thụ mỗi ngày cho từng sản phẩm.
                                    </p>
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-center">
                                        <span className="text-gold/70 text-[12px]">DSR = Tổng số lượng bán (30 ngày) / 30 ngày</span>
                                    </div>
                                </section>

                                <div className="border-t border-white/5" />

                                {/* Section 2: Days Remaining */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[11px] font-black">02</div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400">
                                            Thời gian còn lại (Days Remaining)
                                        </h4>
                                    </div>
                                    <p className="text-[13px] leading-relaxed text-stone-400 mb-4">
                                        Ước tính số ngày còn lại trước khi sản phẩm cháy hàng dựa trên tồn kho khả dụng hiện tại.
                                    </p>
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-center">
                                        <span className="text-blue-400/70 text-[12px]">Số ngày còn lại = Tồn kho hiện tại / DSR</span>
                                    </div>
                                    <p className="text-[12px] text-stone-500 mt-3 leading-relaxed">
                                        Nếu DSR = 0 (không có lịch sử bán), hệ thống mặc định hiển thị <span className="text-white/70 font-bold">999 ngày</span> để tránh cảnh báo nhầm.
                                    </p>
                                </section>

                                <div className="border-t border-white/5" />

                                {/* Section 3: Thresholds */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-[11px] font-black">03</div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-red-400">
                                            Cơ chế Cảnh Báo (Status Thresholds)
                                        </h4>
                                    </div>
                                    <div className="space-y-2.5">
                                        {[
                                            { bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500', label: 'CẠN KIỆT (CRITICAL)', color: 'text-red-400', desc: 'Dưới 7 ngày tồn kho – cần nhập hàng khẩn cấp' },
                                            { bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', label: 'SẮP HẾT (WARNING)', color: 'text-amber-400', desc: 'Từ 7–15 ngày – nên chuẩn bị đơn nhập hàng' },
                                            { bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'LÝ TƯỞNG (HEALTHY)', color: 'text-emerald-400', desc: 'Trên 15 ngày – tồn kho ở mức an toàn' },
                                        ].map(item => (
                                            <div key={item.label} className={`flex items-start gap-3 p-4 rounded-2xl border ${item.bg}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${item.dot} mt-1 shrink-0`} />
                                                <div>
                                                    <span className={`text-[11px] font-black uppercase tracking-wider block ${item.color}`}>{item.label}</span>
                                                    <span className="text-[11px] text-stone-500">{item.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="border-t border-white/5" />

                                {/* Section 4: Vòng quay */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-[11px] font-black">04</div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                            Vòng Quay Tồn Kho (Turnover Rate)
                                        </h4>
                                    </div>
                                    <p className="text-[13px] leading-relaxed text-stone-400 mb-4">
                                        Đo lường hiệu quả luân chuyển vốn của sản phẩm trong kỳ.
                                    </p>
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-center">
                                        <span className="text-white/40 text-[12px]">Vòng quay = Tổng bán (30 ngày) / Tồn kho hiện tại</span>
                                    </div>
                                    <p className="text-[12px] text-stone-500 mt-3 leading-relaxed">
                                        Ví dụ: Vòng quay <span className="text-white/70 font-bold">2.1x</span> nghĩa là lượng bán ra trong tháng gấp 2.1 lần tồn kho hiện có – sản phẩm đang bán rất chạy.
                                    </p>
                                </section>

                                {/* Footer */}
                                <p className="text-[10px] italic text-stone-600 text-center pb-4">
                                    * Dữ liệu cập nhật thời gian thực sau mỗi giao dịch thành công
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
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
