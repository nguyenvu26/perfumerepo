'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingDown,
  Coins,
  Filter,
  ChevronDown
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

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CENTRAL' | 'STORE'>('ALL');

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
      setTotalValue(valRes.global.totalCostValue);
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
      <main className="px-4 py-8 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => router.push(`/${locale}/dashboard/admin/stores/stock`)}
              className="p-3 sm:p-4 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-gold hover:text-white transition-all active:scale-95 shadow-xl w-fit group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading gold-gradient uppercase tracking-tighter italic leading-tight">
                {t('audit.title')}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative flex items-center justify-center gap-3 bg-gold text-white px-6 sm:px-10 py-4 sm:py-5 rounded-full font-heading text-[10px] sm:text-[12px] uppercase tracking-[.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/40 self-start sm:self-center"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('audit.create_btn')}
          </button>
        </header>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
           <div className="glass p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-white/5 flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 truncate">{t('audit.analytics.low_stock')}</p>
                <h4 className="text-2xl sm:text-3xl font-heading italic text-rose-500">{lowStockCount} <span className="text-xs sm:text-sm opacity-50 not-italic">SKUs</span></h4>
              </div>
           </div>
           
           <div className="glass p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-white/5 flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 truncate">{t('audit.analytics.total_value')}</p>
                <h4 className="text-2xl sm:text-3xl font-heading italic gold-gradient truncate">
                  {format.number(totalValue || 0, { style: 'currency', currency: 'VND' })}
                </h4>
              </div>
           </div>

           <div className="glass p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-white/5 flex items-center gap-4 sm:gap-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 truncate">{t('audit.score')}</p>
                <h4 className="text-2xl sm:text-3xl font-heading italic text-blue-500">98.5%</h4>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-2 bg-secondary/15 dark:bg-white/5 p-1.5 rounded-full border border-border dark:border-white/5 overflow-x-auto custom-scrollbar whitespace-nowrap scrollbar-none w-full lg:w-auto">
              {[
                { id: 'ALL', label: 'Tất cả trạng thái' },
                { id: 'IN_PROGRESS', label: 'Đang tiến hành' },
                { id: 'COMPLETED', label: 'Hoàn tất' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={cn(
                    "px-4 sm:px-6 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                    statusFilter === f.id ? "bg-gold text-white shadow-lg shadow-gold/20" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-2 bg-secondary/15 dark:bg-white/5 p-1.5 rounded-full border border-border dark:border-white/5 overflow-x-auto custom-scrollbar whitespace-nowrap scrollbar-none w-full lg:w-auto">
              {[
                { id: 'ALL', label: 'Tất cả kho' },
                { id: 'CENTRAL', label: 'Kho Tổng' },
                { id: 'STORE', label: 'Cửa hàng' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id as any)}
                  className={cn(
                    "px-4 sm:px-6 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                    typeFilter === f.id ? "bg-white text-black shadow-lg shadow-white/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
           </div>
        </div>

        {/* Audit List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse font-black italic">{t('audit.syncing')}</p>
            </div>
          ) : audits.filter(a => (statusFilter === 'ALL' || a.status === statusFilter) && (typeFilter === 'ALL' || a.warehouse.type === typeFilter)).length === 0 ? (
            <div className="glass py-40 rounded-[1.5rem] sm:rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <ClipboardCheck className="w-10 h-10 text-muted-foreground opacity-20" />
              </div>
              <p className="text-xl font-serif italic text-muted-foreground/40">Không tìm thấy bản kê nào.</p>
            </div>
          ) : (
            audits
              .filter(a => (statusFilter === 'ALL' || a.status === statusFilter) && (typeFilter === 'ALL' || a.warehouse.type === typeFilter))
              .map((audit, idx) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/${locale}/dashboard/admin/inventory/audit/${audit.id}`)}
                className="group glass bg-white dark:bg-zinc-900/40 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 hover:border-gold/30 transition-all duration-500 shadow-xl overflow-hidden cursor-pointer"
              >
                <div className="p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
                  <div className="w-full lg:w-64 space-y-3">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      audit.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                      audit.status === 'IN_PROGRESS' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse' :
                      'text-muted-foreground bg-white/5 border-white/10'
                    )}>
                      {audit.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {t(`audit.status.${audit.status}`)}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-1">{t('audit.code')}</p>
                      <h3 className="font-heading text-xl italic group-hover:text-gold transition-colors">{audit.code}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row flex-1 w-full gap-6 lg:gap-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground opacity-40">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-black tracking-widest">{t('audit.warehouse')}</span>
                      </div>
                      <p className="text-base font-bold uppercase tracking-tight truncate">{audit.warehouse.name}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground opacity-40">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-black tracking-widest">{t('audit.started_on')}</span>
                      </div>
                      <p className="text-sm font-bold">{format.dateTime(new Date(audit.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-8 lg:border-l border-border dark:border-white/10 lg:pl-8 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border dark:border-white/5 shrink-0">
                     <div className="text-left">
                        <p className="text-3xl font-heading italic text-gold">{audit._count?.items || 0}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest opacity-30">{t('audit.badge_skus', { defaultValue: 'Mã hàng (SKUs)' })}</p>
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
              className="fixed inset-0 bg-black/60 dark:bg-black/85 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-xl w-full shadow-2xl relative overflow-hidden text-zinc-900 dark:text-zinc-100"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h3 className="text-2xl sm:text-3xl font-heading italic gold-gradient uppercase mb-3">{t('audit.create_btn')}</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                   {t('audit.create_modal_desc', { defaultValue: 'Hệ thống sẽ tạo bản chụp (Snapshot) số lượng tồn kho hiện tại của tất cả sản phẩm trong kho bạn chọn. Bạn có thể cập nhật số lượng thực tế sau đó.' })}
                </p>

                <div className="space-y-3 mb-8">
                   <label className="text-[10px] uppercase font-black tracking-widest text-gold/80 dark:text-gold/60 ml-2">{t('audit.select_warehouse_label', { defaultValue: 'Chọn kho hàng' })}</label>
                   <div className="relative">
                     <select
                       className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 pr-12 text-sm outline-none focus:border-gold transition-all appearance-none cursor-pointer text-zinc-900 dark:text-zinc-100"
                       value={selectedWarehouseId}
                       onChange={(e) => setSelectedWarehouseId(e.target.value)}
                     >
                       <option value="" disabled className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{t('audit.select_warehouse_placeholder', { defaultValue: '--- Vui lòng chọn kho ---' })}</option>
                       {stores.map(s => (
                         <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{s.name} ({s.type})</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                   </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 sm:py-5 rounded-full border border-zinc-200 dark:border-white/10 font-heading text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-all"
                  >
                    {commonT('cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!selectedWarehouseId || creating}
                    className="flex-1 py-4 sm:py-5 bg-gold text-white rounded-full font-heading text-[9px] sm:text-[10px] uppercase tracking-widest font-black shadow-xl shadow-gold/20 flex items-center justify-center gap-2.5 disabled:opacity-50 hover:opacity-90 transition-all"
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
