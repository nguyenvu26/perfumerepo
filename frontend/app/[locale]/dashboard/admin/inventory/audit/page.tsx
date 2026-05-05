'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingDown,
  Coins
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAuditService, type Stocktake } from '@/services/inventory-audit.service';
import { storesService, type Store } from '@/services/stores.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function InventoryAuditPage() {
  const t = useTranslations('inventory');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [audits, setAudits] = useState<Stocktake[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [creating, setCreating] = useState(false);

  // Analytics State
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditRes, storeRes, lowRes, valRes] = await Promise.all([
        inventoryAuditService.list({ take: 50 }),
        storesService.list(),
        inventoryAuditService.getLowStock(5),
        inventoryAuditService.getInventoryValue()
      ]);
      setAudits(auditRes.items);
      setStores(storeRes);
      setLowStockCount(lowRes.length);
      setTotalValue(valRes.global.totalValue);
    } catch (err) {
      console.error(err);
      toast.error(commonT('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!selectedWarehouseId) return;
    setCreating(true);
    try {
      const newAudit = await inventoryAuditService.create({ warehouseId: selectedWarehouseId });
      toast.success(t('audit.create_btn'));
      router.push(`/${locale}/dashboard/admin/inventory/audit/${newAudit.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || commonT('error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[1px] bg-gold" />
              <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80 italic">Audit & Compliance</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
              {t('audit.title')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl font-medium opacity-70">
              {t('audit.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative flex items-center gap-4 bg-gold text-white px-10 py-5 rounded-full font-heading text-[12px] uppercase tracking-[.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/40"
          >
            <Plus className="w-5 h-5" />
            {t('audit.create_btn')}
          </button>
        </header>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <TrendingDown className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{t('analytics.low_stock')}</p>
                <h4 className="text-3xl font-heading italic text-rose-500">{lowStockCount} <span className="text-sm opacity-50 not-italic">SKUs</span></h4>
              </div>
           </div>
           
           <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                <Coins className="w-8 h-8 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{t('analytics.value')}</p>
                <h4 className="text-3xl font-heading italic gold-gradient">
                  {format.number(totalValue, { style: 'currency', currency: 'VND' })}
                </h4>
              </div>
           </div>

           <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Audit Score</p>
                <h4 className="text-3xl font-heading italic text-blue-500">98.5%</h4>
              </div>
           </div>
        </div>

        {/* Audit List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse font-black italic">Synchronizing Audits...</p>
            </div>
          ) : audits.length === 0 ? (
            <div className="glass py-40 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <ClipboardCheck className="w-10 h-10 text-muted-foreground opacity-20" />
              </div>
              <p className="text-xl font-serif italic text-muted-foreground/40">{t('audit.empty')}</p>
            </div>
          ) : (
            audits.map((audit, idx) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/${locale}/dashboard/admin/inventory/audit/${audit.id}`)}
                className="group glass bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-white/5 hover:border-gold/30 transition-all duration-500 shadow-xl overflow-hidden cursor-pointer"
              >
                <div className="p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                  <div className="w-full lg:w-64 space-y-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      audit.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                      audit.status === 'IN_PROGRESS' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse' :
                      'text-muted-foreground bg-white/5 border-white/10'
                    )}>
                      {audit.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {audit.status}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-1">Audit Code</p>
                      <h3 className="font-heading text-xl italic group-hover:text-gold transition-colors">{audit.code}</h3>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground opacity-40">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase font-black tracking-widest">Warehouse</span>
                    </div>
                    <p className="text-lg font-bold uppercase tracking-tight">{audit.warehouse.name}</p>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground opacity-40">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase font-black tracking-widest">Started On</span>
                    </div>
                    <p className="text-sm font-bold">{format.dateTime(new Date(audit.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>

                  <div className="w-full lg:w-auto flex items-center gap-8 lg:border-l border-white/10 lg:pl-8">
                     <div className="text-center">
                        <p className="text-3xl font-heading italic text-gold">{audit._count?.items || 0}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest opacity-30">SKUs</p>
                     </div>
                     <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-gold group-hover:translate-x-2 transition-all duration-500" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-3xl font-heading italic gold-gradient uppercase mb-4">{t('audit.create_btn')}</h3>
                <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                   Hệ thống sẽ tạo bản chụp (Snapshot) số lượng tồn kho hiện tại của tất cả sản phẩm trong kho bạn chọn. Bạn có thể cập nhật số lượng thực tế sau đó.
                </p>

                <div className="space-y-4 mb-10">
                   <label className="text-[10px] uppercase font-black tracking-widest text-gold/60 ml-2">Chọn kho hàng</label>
                   <select
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-gold transition-all appearance-none cursor-pointer"
                     value={selectedWarehouseId}
                     onChange={(e) => setSelectedWarehouseId(e.target.value)}
                   >
                     <option value="" disabled>--- Vui lòng chọn kho ---</option>
                     {stores.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                     ))}
                   </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-5 rounded-full border border-white/10 font-heading text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    {commonT('cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!selectedWarehouseId || creating}
                    className="flex-1 py-5 bg-gold text-white rounded-full font-heading text-[10px] uppercase tracking-widest font-black shadow-xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {creating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t('audit.create_btn')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}
