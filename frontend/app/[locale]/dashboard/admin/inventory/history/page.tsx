'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { History, Package, Calendar, User, Info, ArrowLeft, ArrowUpDown, Tag, Database, ClipboardList } from 'lucide-react';
import { productService } from '@/services/product.service';
import { useEffect, useState } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function InventoryHistoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [filterType, setFilterType] = useState<string>('');
  const take = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await productService.adminGetInventoryLogs({ 
        skip, 
        take,
        type: filterType || undefined
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [skip, filterType]);

  useEffect(() => {
    setSkip(0);
  }, [filterType]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'ADJUST': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'SALE_POS':
      case 'SALE_ONLINE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'RETURN': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-secondary/30 border-white/5';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'IMPORT': return t('type_import');
      case 'ADJUST': return t('type_adjust');
      case 'SALE':
      case 'SALE_POS':
      case 'SALE_ONLINE': return t('type_sale');
      case 'RETURN': return t('type_return');
      default: return type;
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-10 max-w-[1400px] mx-auto min-h-screen">
        <header className="mb-10 md:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[.3em] font-black text-muted-foreground hover:text-gold transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                {tCommon('back')}
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-gold" />
                <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80">{t('history_title')}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
                {t('history_title')}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {t('history_subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-secondary/20 backdrop-blur-md border border-white/5 p-4 rounded-[2rem]">
               <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                 <ClipboardList className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[10px] uppercase tracking-widest font-black opacity-40 leading-none mb-1">Total Logs</p>
                 <p className="text-xl font-heading italic leading-none">{total}</p>
               </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
             <button
               onClick={() => setFilterType('')}
               className={cn(
                 "px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-black border transition-all",
                 filterType === '' 
                  ? "bg-gold text-white border-gold shadow-lg shadow-gold/20" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-gold/30 hover:bg-gold/5"
               )}
             >
               {tCommon('all') || 'Tất cả'}
             </button>
             {['IMPORT', 'ADJUST', 'SALE', 'RETURN'].map((type) => (
               <button
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={cn(
                   "px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-black border transition-all",
                   filterType === type 
                    ? "bg-gold text-white border-gold shadow-lg shadow-gold/20" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-gold/30 hover:bg-gold/5"
                 )}
               >
                 {getTypeText(type)}
               </button>
             ))}
          </div>
        </header>

        <section className="glass bg-white/50 dark:bg-zinc-900/40 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-secondary/10">
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_product')}</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_type')}</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_quantity')}</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_staff')}</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_date')}</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('table_reason')}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-white/5 last:border-none">
                      <td colSpan={6} className="p-8">
                        <div className="h-12 bg-secondary/20 rounded-2xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log, i) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={log.id}
                      className="border-b border-white/5 last:border-none hover:bg-white/5 dark:hover:bg-zinc-950/20 transition-colors group"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-secondary/10 shrink-0 border border-white/5 shadow-md">
                            {log.variant?.product?.images?.[0] ? (
                              <Image 
                                src={log.variant.product.images[0].url} 
                                alt={log.variant.product.name} 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                            ) : (
                              <Package className="w-6 h-6 m-auto absolute inset-0 text-gold/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-gold uppercase tracking-widest font-black opacity-60 leading-none mb-1">
                              {log.variant?.product?.brand?.name}
                            </p>
                            <p className="font-bold text-sm leading-tight">{log.variant?.product?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">{log.variant?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-wider border whitespace-nowrap",
                          getTypeColor(log.type)
                        )}>
                          {getTypeText(log.type)}
                        </span>
                      </td>
                      <td className="p-8">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-lg font-heading italic leading-none",
                            log.quantity > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center border border-white/10">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                             <p className="text-xs font-bold leading-none mb-1">{log.staff?.fullName || 'System'}</p>
                             <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{log.staff?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 opacity-50" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {format.dateTime(new Date(log.createdAt), {
                               year: 'numeric',
                               month: 'short',
                               day: '2-digit',
                               hour: '2-digit',
                               minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-start gap-2 max-w-[250px]">
                           <Info className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                           <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                             {log.reason || '---'}
                           </p>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <History className="w-12 h-12" />
                        <p className="text-sm font-heading uppercase tracking-widest">{t('empty_history')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-4">
           <button
             disabled={skip === 0}
             onClick={() => setSkip(Math.max(0, skip - take))}
             className="px-8 py-3 rounded-full border border-white/10 font-heading text-[10px] uppercase tracking-widest hover:bg-gold hover:text-white transition-all disabled:opacity-30"
           >
             {tCommon('previous')}
           </button>
           <div className="px-6 py-3 rounded-full bg-secondary/10 border border-white/5 font-bold text-[10px] tracking-widest">
              {Math.floor(skip / take) + 1} / {Math.ceil(total / take) || 1}
           </div>
           <button
             disabled={skip + take >= total}
             onClick={() => setSkip(skip + take)}
             className="px-8 py-3 rounded-full border border-white/10 font-heading text-[10px] uppercase tracking-widest hover:bg-gold hover:text-white transition-all disabled:opacity-30"
           >
             {tCommon('next')}
           </button>
        </div>
      </main>
    </AuthGuard>
  );
}
