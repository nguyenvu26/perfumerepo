'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  TrendingDown,
  Coins,
  ArrowLeft,
  Building2,
  Package,
  AlertCircle,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Info
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAnalyticsService, type InventoryValueReport, type LowStockItem } from '@/services/inventory-analytics.service';
import { useRouter } from 'next/navigation';

export default function InventoryReportsPage() {
  const t = useTranslations('inventory');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [valueData, setValueData] = useState<InventoryValueReport | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [low, val] = await Promise.all([
        inventoryAnalyticsService.getLowStock(10),
        inventoryAnalyticsService.getInventoryValue()
      ]);
      setLowStock(low);
      setValueData(val);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pie Chart Calculation
  const pieData = useMemo(() => {
    if (!valueData?.byWarehouse) return [];
    const total = valueData.global.totalCostValue || 1;
    let currentAngle = 0;
    
    return valueData.byWarehouse.map((w, i) => {
      const percentage = (w.totalCostValue / total) * 100;
      const angle = (w.totalCostValue / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      return {
        ...w,
        percentage,
        startAngle,
        endAngle: currentAngle,
        color: `hsl(${20 + i * 40}, 70%, 60%)` // Elegant variants of gold/warm tones
      };
    });
  }, [valueData]);

  if (loading) return null;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="px-0 py-4 sm:px-8 sm:py-10 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-6 sm:mb-10 lg:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-8">
           <div className="space-y-6">
          <div className="space-y-6">
            <button 
              onClick={() => router.push(`/${locale}/dashboard/admin/stores/stock`)}
              className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/70 dark:bg-white/5 border border-gold/10 text-muted-foreground hover:bg-gold hover:text-luxury-black transition-all active:scale-95 shadow-xl group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading gold-gradient mb-2 sm:mb-4 italic leading-tight">
                Báo Cáo Tồn Kho
              </h1>
            </div>
          </div>
          </div>

          <div className="w-full lg:w-auto">
             <div className="glass w-full lg:w-auto px-5 sm:px-8 py-4 sm:py-5 rounded-3xl sm:rounded-[2rem] border-emerald-500/15 bg-emerald-500/10 flex flex-col sm:items-end shadow-2xl">
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500 opacity-60 italic mb-1">Lợi nhuận tiềm năng</span>
                <span className="text-2xl sm:text-3xl font-heading italic text-emerald-600 dark:text-emerald-400 break-words">
                  +{format.number(valueData?.global.potentialProfit || 0, { style: 'currency', currency: 'VND' })}
                </span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 xl:gap-16">
           {/* Section 1: Valuation & Pie Chart */}
           <div className="space-y-5 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                        <Coins className="w-6 h-6 text-gold" />
                    </div>
                    <h2 className="text-2xl font-heading italic uppercase">Giá trị kho hàng</h2>
                 </div>
                  <div className="flex items-center gap-2 [font-size:0.78rem] font-bold text-muted-foreground">
                    <Info className="w-3 h-3 text-gold" /> Dựa trên giá nhập gần nhất
                 </div>
              </div>

              {/* Main Stat Card */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div className={cn(
                    "glass p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gold/10 relative overflow-hidden group transition-all duration-700",
                    (valueData?.global.totalCostValue || 0) > 0 ? "bg-gradient-to-br from-gold/10 to-transparent" : "bg-white/55 dark:bg-zinc-900/50"
                 )}>
                     <div className="absolute top-0 right-0 p-4 text-stone-300/40 dark:text-white/10 group-hover:opacity-70 transition-opacity">
                       <Wallet className="w-20 h-20" />
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Tổng vốn tài sản</p>
                     <h3 className="text-2xl sm:text-4xl font-heading italic gold-gradient break-words">
                      {format.number(valueData?.global.totalCostValue || 0, { style: 'currency', currency: 'VND' })}
                    </h3>
                    {(valueData?.global.totalCostValue || 0) === 0 && (
                      <p className="text-[8px] text-amber-500/60 uppercase font-black mt-2 animate-pulse italic">⚠️ Chưa cập nhật giá nhập lô</p>
                    )}
                 </div>
                  <div className="glass p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 text-stone-300/40 dark:text-white/10 group-hover:opacity-70 transition-opacity">
                       <TrendingUp className="w-20 h-20" />
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Giá trị niêm yết</p>
                     <h3 className="text-2xl sm:text-4xl font-heading italic text-emerald-600 dark:text-emerald-400 break-words">
                      {format.number(valueData?.global.totalSellingValue || 0, { style: 'currency', currency: 'VND' })}
                    </h3>
                 </div>
              </div>

              {/* Pie Chart Visualization */}
               <div className="glass p-5 sm:p-8 lg:p-10 rounded-3xl sm:rounded-[3rem] border-white/5 flex flex-col md:flex-row items-center gap-6 sm:gap-10 lg:gap-12">
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                       {pieData.map((d, i) => {
                          const x1 = 50 + 40 * Math.cos((Math.PI * d.startAngle) / 180);
                          const y1 = 50 + 40 * Math.sin((Math.PI * d.startAngle) / 180);
                          const x2 = 50 + 40 * Math.cos((Math.PI * d.endAngle) / 180);
                          const y2 = 50 + 40 * Math.sin((Math.PI * d.endAngle) / 180);
                          const largeArc = d.percentage > 50 ? 1 : 0;
                          
                          return (
                             <motion.path
                                key={d.name}
                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={d.color}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                  opacity: activeSegment === null || activeSegment === i ? 1 : 0.4,
                                  scale: activeSegment === i ? 1.05 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                onHoverStart={() => setActiveSegment(i)}
                                onHoverEnd={() => setActiveSegment(null)}
                                className="cursor-pointer"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.2))' }}
                             />
                          );
                       })}
                       <circle cx="50" cy="50" r="25" className="fill-background" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[8px] uppercase font-black opacity-30 tracking-widest">Phân bổ</span>
                       <span className="text-xs font-heading italic text-gold">Kho</span>
                    </div>
                 </div>

                 <div className="flex-1 space-y-4 w-full">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-white/5 pb-2">Theo kho hàng</h4>
                    <div className="space-y-3">
                       {pieData.map((w, i) => (
                          <div 
                            key={w.name} 
                            className={cn(
                               "flex items-center justify-between gap-3 p-3 rounded-xl transition-all",
                               activeSegment === i ? "bg-gold/10 scale-[1.02]" : "opacity-85"
                            )}
                            onMouseEnter={() => setActiveSegment(i)}
                            onMouseLeave={() => setActiveSegment(null)}
                          >
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                                 <span className="text-sm font-medium text-foreground">{w.name}</span>
                             </div>
                             <div className="text-right">
                                 <span className="text-sm font-semibold block text-foreground">
                                  {format.number(w.totalCostValue, { style: 'currency', currency: 'VND' })}
                                </span>
                                <span className="text-[8px] opacity-40 font-black">{w.percentage.toFixed(1)}%</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Low Stock Alerts */}
            <div className="space-y-5 sm:space-y-8">
              <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <TrendingDown className="w-6 h-6 text-rose-500" />
                 </div>
                 <h2 className="text-2xl font-heading italic uppercase">Cảnh báo hết hàng</h2>
              </div>

               <div className="glass rounded-3xl sm:rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl h-auto lg:h-[calc(100vh-400px)] min-h-[360px] flex flex-col">
                  <div className="p-4 sm:p-8 border-b border-rose-500/10 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <p className="[font-size:0.78rem] font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                       <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                       Mức độ nghiêm trọng: Dưới ngưỡng tồn kho tối thiểu
                    </p>
                    <span className="text-[10px] px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-500 font-bold border border-rose-500/20 shadow-lg">{lowStock.length} Sản phẩm</span>
                 </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    <AnimatePresence>
                      {lowStock.length === 0 ? (
                         <motion.div 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="py-20 flex flex-col items-center justify-center opacity-20 italic"
                         >
                            <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500" />
                            <p>All stock levels are optimal.</p>
                         </motion.div>
                      ) : (
                          <div className="divide-y divide-border/50">
                            {lowStock.map((item, idx) => (
                               <motion.div 
                                 key={`${item.sku}-${item.warehouse}`}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                                  className="p-4 sm:p-6 lg:p-8 hover:bg-gold/[0.03] transition-colors group relative"
                               >
                                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                         <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/60 dark:bg-white/5 overflow-hidden border border-border/60 flex items-center justify-center group-hover:scale-105 transition-transform relative shrink-0">
                                           {item.imageUrl ? (
                                             <img src={item.imageUrl} alt={item.product} className="w-full h-full object-cover" />
                                           ) : (
                                             <Package className="w-6 h-6 text-muted-foreground/30" />
                                           )}
                                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse ring-4 ring-background" />
                                        </div>
                                         <div className="min-w-0">
                                            <p className="font-heading italic text-base sm:text-xl group-hover:text-gold transition-colors leading-snug">{item.product}</p>
                                            <p className="[font-size:0.78rem] font-bold text-muted-foreground">
                                              {item.variant} · <span className="text-gold/60">{item.warehouse}</span>
                                           </p>
                                            <p className="[font-size:0.72rem] font-mono mt-1 text-muted-foreground">{item.sku}</p>
                                        </div>
                                     </div>
                                      <div className="sm:text-right rounded-2xl bg-rose-500/10 border border-rose-500/15 px-4 py-3">
                                         <p className="text-2xl sm:text-3xl font-heading italic text-rose-600 dark:text-rose-400">{item.available}</p>
                                        <p className="text-[8px] uppercase font-black tracking-widest text-rose-500/40">Tồn kho</p>
                                     </div>
                                  </div>
                               </motion.div>
                            ))}
                         </div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </AuthGuard>
  );
}
