'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Save,
  Package,
  Building2,
  Calendar,
  Search,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAuditService, type Stocktake, type StocktakeItem } from '@/services/inventory-audit.service';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';

export default function AuditDetailPage() {
  const t = useTranslations('inventory');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams();

  const [audit, setAudit] = useState<Stocktake | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const res = await inventoryAuditService.getById(id as string);
      setAudit(res);
    } catch (err) {
      toast.error(commonT('error'));
      router.push(`/${locale}/dashboard/admin/inventory/audit`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredItems = useMemo(() => {
    if (!audit) return [];
    return audit.items.filter(item => 
      item.variant.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.variant.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [audit, search]);

  const handleUpdateQty = async (itemId: string, qty: number) => {
    if (!audit || audit.status !== 'IN_PROGRESS') return;
    setSaving(itemId);
    try {
      const updatedItem = await inventoryAuditService.updateItem(audit.id, itemId, { countedQty: qty });
      setAudit(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? { ...i, ...updatedItem } : i)
        };
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || commonT('error'));
    } finally {
      setSaving(null);
    }
  };

  const handleComplete = async () => {
    if (!audit) return;
    setCompleting(true);
    try {
      await inventoryAuditService.complete(audit.id);
      toast.success(t('audit.success_complete'));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || commonT('error'));
    } finally {
      setCompleting(false);
    }
  };

  const stats = useMemo(() => {
    if (!audit) return { total: 0, counted: 0, variance: 0 };
    const counted = audit.items.filter(i => i.countedQty !== null).length;
    const variance = audit.items.reduce((acc, i) => acc + (i.variance || 0), 0);
    return { total: audit.items.length, counted, variance };
  }, [audit]);
  const progress = stats.total > 0 ? Math.round((stats.counted / stats.total) * 100) : 0;

  if (loading) return null;
  if (!audit) return null;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="px-0 py-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-6 sm:mb-10 lg:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <button 
              onClick={() => router.push(`/${locale}/dashboard/admin/inventory/audit`)}
              className="flex min-h-10 items-center gap-2 [font-size:0.82rem] font-bold text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {commonT('back')}
            </button>
            <div>
               <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <span className={cn(
                    "px-3 py-1.5 sm:px-4 rounded-full border [font-size:0.74rem] font-black leading-none",
                    audit.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                  )}>
                    {t(`audit.status.${audit.status}`)}
                  </span>
                  <span className="break-all [font-size:0.78rem] text-muted-foreground font-bold">#{audit.code}</span>
               </div>
               <h1 className="text-2xl sm:text-5xl font-heading italic gold-gradient leading-tight">
                 {t('audit.manifest')}
               </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 bg-white/45 dark:bg-white/[0.03] border border-gold/10 p-4 sm:p-5 rounded-2xl sm:rounded-[2.5rem] w-full lg:w-auto shadow-[0_18px_45px_-34px_rgba(15,23,42,0.7)]">
             <div className="flex items-center gap-3 sm:gap-4 border-b sm:border-b-0 sm:border-r border-gold/10 pb-3 sm:pb-0 sm:pr-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-white/5 flex items-center justify-center shrink-0">
                   <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-gold/40" />
                </div>
                <div className="min-w-0">
                   <p className="[font-size:0.72rem] font-bold text-muted-foreground">{t('audit.warehouse')}</p>
                   <p className="text-sm font-bold truncate">{audit.warehouse.name}</p>
                </div>
             </div>
             <div className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-white/5 flex items-center justify-center shrink-0">
                   <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gold/40" />
                </div>
                <div>
                   <p className="[font-size:0.72rem] font-bold text-muted-foreground">{t('audit.started_date')}</p>
                   <p className="text-sm font-bold">{format.dateTime(new Date(audit.createdAt), { dateStyle: 'medium' })}</p>
                </div>
             </div>
          </div>
        </header>

        {/* Progress & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-12">
           <div className="lg:col-span-3 glass p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border-white/5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 md:gap-8">
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-end mb-2">
                       <p className="[font-size:0.8rem] font-black text-gold">{t('audit.progress')}</p>
                       <p className="text-lg sm:text-xl font-semibold">{progress}%</p>
                    </div>
                    <div className="h-2.5 sm:h-3 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className="h-full bg-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                       />
                    </div>
                    <p className="[font-size:0.78rem] sm:text-sm text-muted-foreground font-medium">
                       {t('audit.summary', { counted: stats.counted, total: stats.total, variance: stats.variance })}
                    </p>
                 </div>
                 
                 <div className="flex gap-4 shrink-0">
                    {audit.status === 'IN_PROGRESS' && (
                      <button
                        onClick={handleComplete}
                        disabled={stats.counted < stats.total || completing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-10 py-3.5 sm:py-5 rounded-full [font-size:0.82rem] font-black shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 disabled:opacity-30 transition-all w-full md:w-auto"
                      >
                        {completing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {t('audit.complete_btn')}
                      </button>
                    )}
                 </div>
              </div>
           </div>

           <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border-white/5 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 text-muted-foreground">
                 <Search className="w-4 h-4" />
                 <span className="[font-size:0.78rem] font-black">{t('audit.asset_search')}</span>
              </div>
              <input 
                type="text"
                placeholder={t('audit.asset_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-base sm:text-xl w-full text-gold placeholder:opacity-30"
              />
           </div>
        </div>

        {/* Audit List Table and Mobile Cards */}
        <div className="space-y-6">
          {/* Desktop View (hidden below lg) */}
          <div className="hidden lg:block glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-white/5 text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 italic">
                      <th className="pl-12 py-8">{t('audit.table_asset')}</th>
                      <th className="px-6 py-8 text-center">{t('audit.system_qty')}</th>
                      <th className="px-6 py-8 text-center">{t('audit.counted_qty')}</th>
                      <th className="px-6 py-8 text-center">{t('audit.variance')}</th>
                      <th className="pr-12 py-8 text-right">{t('audit.table_action')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {filteredItems.map((item) => (
                      <tr key={item.id} className="group hover:bg-white/[0.02] transition-all duration-500">
                         <td className="pl-12 py-8">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                                  {item.variant.product.images?.length > 0 ? (
                                    <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-6 h-6 text-muted-foreground/30" />
                                  )}
                               </div>
                               <div>
                                  <p className="font-heading text-lg italic uppercase leading-none group-hover:text-gold transition-colors">{item.variant.product.name}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-30">{item.variant.name}</p>
                                    {(item.variance || 0) !== 0 && item.reason && (
                                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold uppercase tracking-widest border border-rose-500/20">
                                        Lý do: {item.reason}
                                      </span>
                                    )}
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <span className="font-heading text-2xl italic opacity-40">{item.systemQty}</span>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-1 pr-6 group-hover:border-gold/30 transition-all">
                               <input 
                                 type="number"
                                 disabled={audit.status !== 'IN_PROGRESS'}
                                 defaultValue={item.countedQty ?? 0}
                                 onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val !== item.countedQty) handleUpdateQty(item.id, val);
                                 }}
                                 className="w-20 bg-zinc-900 border border-white/5 rounded-xl py-3 text-center font-heading text-xl text-gold outline-none focus:border-gold disabled:opacity-50"
                               />
                               {saving === item.id && <div className="w-4 h-4 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />}
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            {item.countedQty !== null && (
                              <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black",
                                (item.variance || 0) === 0 ? "text-emerald-500 border-emerald-500/10 bg-emerald-500/5" :
                                (item.variance || 0) > 0 ? "text-blue-500 border-blue-500/10 bg-blue-500/5" :
                                "text-rose-500 border-rose-500/10 bg-rose-500/5"
                              )}>
                                 {(item.variance || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : (item.variance || 0) < 0 ? <TrendingDown className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                 {item.variance || 0}
                              </div>
                            )}
                         </td>
                         <td className="pr-12 py-8 text-right">
                            <div className="flex justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                               <div className="p-3 rounded-full hover:bg-white/5 text-muted-foreground transition-all">
                                  <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Mobile Card List (hidden on lg and above) */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredItems.map((item) => (
               <div 
                 key={item.id}
                 className="glass rounded-2xl p-4 border border-white/5 space-y-4 hover:border-gold/30 transition-all duration-300"
               >
                  <div className="flex items-start gap-3">
                     <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                        {item.variant.product.images?.length > 0 ? (
                          <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        )}
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-foreground">{item.variant.product.name}</p>
                        <p className="[font-size:0.78rem] font-bold text-muted-foreground mt-0.5">{item.variant.name}</p>
                        {(item.variance || 0) !== 0 && item.reason && (
                          <span className="inline-block [font-size:0.72rem] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 mt-1">
                            Lý do: {item.reason}
                          </span>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 pt-3 border-t border-white/5 items-end">
                     <div className="text-center">
                        <p className="[font-size:0.72rem] font-medium text-muted-foreground">{t('audit.system_qty')}</p>
                        <p className="text-base font-semibold mt-1">{item.systemQty}</p>
                     </div>
                     <div className="flex flex-col items-center">
                        <p className="[font-size:0.72rem] font-medium text-muted-foreground mb-1">{t('audit.counted_qty')}</p>
                        <div className="inline-flex items-center gap-2 bg-black/[0.03] dark:bg-white/5 border border-white/10 rounded-full p-0.5 w-[78px]">
                           <input 
                             type="number"
                             disabled={audit.status !== 'IN_PROGRESS'}
                             defaultValue={item.countedQty ?? 0}
                             onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (val !== item.countedQty) handleUpdateQty(item.id, val);
                             }}
                             className="h-9 min-h-9 w-full rounded-full border border-transparent bg-white/85 py-1 text-center text-sm font-semibold text-gold outline-none focus:border-gold disabled:opacity-50 dark:bg-zinc-900"
                           />
                           {saving === item.id && <div className="w-3 h-3 border-2 border-gold/20 border-t-gold rounded-full animate-spin shrink-0" />}
                        </div>
                     </div>
                     <div className="text-center">
                        <p className="[font-size:0.72rem] font-medium text-muted-foreground">{t('audit.variance')}</p>
                        {item.countedQty !== null ? (
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border [font-size:0.78rem] font-bold mt-1",
                            (item.variance || 0) === 0 ? "text-emerald-500 border-emerald-500/10 bg-emerald-500/5" :
                            (item.variance || 0) > 0 ? "text-blue-500 border-blue-500/10 bg-blue-500/5" :
                            "text-rose-500 border-rose-500/10 bg-rose-500/5"
                          )}>
                             {(item.variance || 0) > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : (item.variance || 0) < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                             {item.variance || 0}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">-</span>
                        )}
                     </div>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
