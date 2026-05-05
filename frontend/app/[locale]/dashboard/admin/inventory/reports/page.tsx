'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  BarChart3,
  TrendingDown,
  Coins,
  ArrowLeft,
  Building2,
  Package,
  ArrowRight,
  PieChart,
  LayoutGrid,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { inventoryAuditService } from '@/services/inventory-audit.service';
import { useRouter } from 'next/navigation';

export default function InventoryReportsPage() {
  const t = useTranslations('inventory');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [valueData, setValueData] = useState<{ global: any, byWarehouse: any[] } | null>(null);

  const fetchData = async () => {
    try {
      const [low, val] = await Promise.all([
        inventoryAuditService.getLowStock(10),
        inventoryAuditService.getInventoryValue()
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

  if (loading) return null;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="space-y-6">
            <button 
              onClick={() => router.push(`/${locale}/dashboard/admin/stores/stock`)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {commonT('back')}
            </button>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[1px] bg-gold" />
                <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80 italic">Intelligence & Analytics</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
                {t('analytics.title')}
              </h1>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Section 1: Valuation */}
           <div className="space-y-8">
              <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                    <Coins className="w-6 h-6 text-gold" />
                 </div>
                 <h2 className="text-2xl font-heading italic uppercase">{t('analytics.value')}</h2>
              </div>

              <div className="glass p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-gold/5 to-transparent">
                 <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">{t('analytics.global_value')}</p>
                 <h3 className="text-6xl font-heading italic gold-gradient">
                   {format.number(valueData?.global.totalValue || 0, { style: 'currency', currency: 'VND' })}
                 </h3>
                 <p className="text-sm font-medium opacity-40 mt-4 italic">Computed across {valueData?.global.totalUnits} items global</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {valueData?.byWarehouse.map((w, idx) => (
                    <motion.div 
                      key={w.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                             <Building2 className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                          <div>
                             <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{w.name}</p>
                             <p className="text-sm font-bold opacity-40">{w.totalUnits} items</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-heading italic text-gold">
                            {format.number(w.totalValue, { style: 'currency', currency: 'VND' })}
                          </p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

           {/* Section 2: Low Stock */}
           <div className="space-y-8">
              <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <TrendingDown className="w-6 h-6 text-rose-500" />
                 </div>
                 <h2 className="text-2xl font-heading italic uppercase">{t('analytics.low_stock')}</h2>
              </div>

              <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl h-full flex flex-col">
                 <div className="p-8 border-b border-white/5 bg-rose-500/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic flex items-center gap-2">
                       <AlertCircle className="w-3.5 h-3.5" />
                       Critical: Stock below 10 units
                    </p>
                 </div>
                 <div className="overflow-y-auto no-scrollbar flex-1">
                    {lowStock.length === 0 ? (
                       <div className="py-20 flex flex-col items-center justify-center opacity-20 italic">
                          <CheckCircle2 className="w-12 h-12 mb-4" />
                          <p>All stock levels are optimal.</p>
                       </div>
                    ) : (
                       <div className="divide-y divide-white/5">
                          {lowStock.map((item, idx) => (
                             <div key={idx} className="p-8 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-6">
                                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                         <Package className="w-5 h-5 text-muted-foreground/30" />
                                      </div>
                                      <div>
                                         <p className="font-heading italic uppercase text-lg group-hover:text-gold transition-colors">{item.product}</p>
                                         <p className="text-[10px] font-black uppercase tracking-tighter opacity-30">{item.variant} · {item.warehouse}</p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-2xl font-heading italic text-rose-500">{item.available}</p>
                                      <p className="text-[8px] uppercase font-black tracking-widest text-rose-500/40">Units left</p>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </AuthGuard>
  );
}
