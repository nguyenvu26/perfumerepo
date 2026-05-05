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

  if (loading) return null;
  if (!audit) return null;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-6">
            <button 
              onClick={() => router.push(`/${locale}/dashboard/admin/inventory/audit`)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {commonT('back')}
            </button>
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                    audit.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                  )}>
                    {audit.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold">#{audit.code}</span>
               </div>
               <h1 className="text-5xl font-heading italic gold-gradient uppercase tracking-tighter">
                 Audit manifest
               </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 bg-white/5 border border-white/5 p-6 rounded-[2.5rem]">
             <div className="flex items-center gap-4 border-r border-white/5 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                   <Building2 className="w-6 h-6 text-gold/40" />
                </div>
                <div>
                   <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">Warehouse</p>
                   <p className="text-sm font-bold uppercase">{audit.warehouse.name}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                   <Calendar className="w-6 h-6 text-gold/40" />
                </div>
                <div>
                   <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">Started Date</p>
                   <p className="text-sm font-bold">{format.dateTime(new Date(audit.createdAt), { dateStyle: 'medium' })}</p>
                </div>
             </div>
          </div>
        </header>

        {/* Progress & Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
           <div className="xl:col-span-3 glass p-10 rounded-[3rem] border-white/5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-end mb-2">
                       <p className="text-[10px] uppercase font-black tracking-widest text-gold italic">Audit Progress</p>
                       <p className="text-xl font-heading italic">{Math.round((stats.counted / stats.total) * 100)}%</p>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(stats.counted / stats.total) * 100}%` }}
                         className="h-full bg-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                       />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                       {stats.counted} of {stats.total} SKUs counted · {stats.variance > 0 ? '+' : ''}{stats.variance} Variance
                    </p>
                 </div>
                 
                 <div className="flex gap-4">
                    {audit.status === 'IN_PROGRESS' && (
                      <button
                        onClick={handleComplete}
                        disabled={stats.counted < stats.total || completing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-full font-heading text-[12px] uppercase tracking-[.2em] font-black shadow-2xl shadow-emerald-500/20 flex items-center gap-3 disabled:opacity-30 transition-all"
                      >
                        {completing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {t('audit.complete_btn')}
                      </button>
                    )}
                 </div>
              </div>
           </div>

           <div className="glass p-8 rounded-[3rem] border-white/5 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 text-muted-foreground">
                 <Search className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Global Asset Search</span>
              </div>
              <input 
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none font-heading italic text-xl w-full text-gold placeholder:opacity-20"
              />
           </div>
        </div>

        {/* Audit Table */}
        <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-white/5 text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 italic">
                    <th className="pl-12 py-8">Product Asset</th>
                    <th className="px-6 py-8 text-center">{t('audit.system_qty')}</th>
                    <th className="px-6 py-8 text-center">{t('audit.counted_qty')}</th>
                    <th className="px-6 py-8 text-center">{t('audit.variance')}</th>
                    <th className="pr-12 py-8 text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {filteredItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-all duration-500">
                       <td className="pl-12 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-muted-foreground/30" />
                             </div>
                             <div>
                                <p className="font-heading text-lg italic uppercase leading-none group-hover:text-gold transition-colors">{item.variant.product.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-30 mt-1.5">{item.variant.name}</p>
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
      </main>
    </AuthGuard>
  );
}
