'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  ArrowRight,
  Building2,
  Package,
  Calendar,
  Layers
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryTransferService, type TransferOrder, type TransferStatus } from '@/services/inventory-transfer.service';
import { storesService } from '@/services/stores.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function TransferOrdersPage() {
  const t = useTranslations('inventory');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransferStatus | 'ALL'>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await inventoryTransferService.list({ 
        take: 50,
        status: activeTab === 'ALL' ? undefined : activeTab
      });
      setOrders(res.items);
    } catch (err) {
      console.error(err);
      toast.error(commonT('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleAction = async (id: string, action: 'ship' | 'cancel') => {
    try {
      if (action === 'ship') await inventoryTransferService.ship(id);
      if (action === 'cancel') await inventoryTransferService.cancel(id);
      
      toast.success(t(`transfers.success_${action}`));
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || commonT('error'));
    }
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'IN_TRANSIT': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELLED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING': return Clock;
      case 'IN_TRANSIT': return Truck;
      case 'COMPLETED': return CheckCircle2;
      case 'CANCELLED': return XCircle;
      default: return MoreHorizontal;
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[1px] bg-gold" />
              <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80 italic">Logistics & Supply</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
              {t('transfers.title')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl font-medium opacity-70">
              {t('transfers.subtitle')}
            </p>
          </div>

          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/stores/stock?tab=transfer`)}
            className="group relative flex items-center gap-4 bg-gold text-white px-10 py-5 rounded-full font-heading text-[12px] uppercase tracking-[.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/40"
          >
            <Plus className="w-5 h-5" />
            {t('transfers.create_btn')}
            <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500" />
          </button>
        </header>

        {/* Tabs / Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xử lý' },
            { id: 'IN_TRANSIT', label: 'Đang vận chuyển' },
            { id: 'COMPLETED', label: 'Hoàn tất' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                activeTab === tab.id 
                  ? "bg-white dark:bg-zinc-900 border-gold/50 text-gold shadow-lg" 
                  : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse font-black italic">Syncing Logistics...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass py-40 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <ArrowRightLeft className="w-10 h-10 text-muted-foreground opacity-20" />
              </div>
              <p className="text-xl font-serif italic text-muted-foreground/40">{t('transfers.empty')}</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group glass bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-white/5 hover:border-gold/30 transition-all duration-500 shadow-xl overflow-hidden"
              >
                <div className="p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                  {/* Status & Code */}
                  <div className="w-full lg:w-64 space-y-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      getStatusColor(order.status)
                    )}>
                      {(() => {
                        const Icon = getStatusIcon(order.status);
                        const label = {
                          PENDING: 'Chờ xử lý',
                          IN_TRANSIT: 'Đang vận chuyển',
                          COMPLETED: 'Hoàn tất',
                          CANCELLED: 'Đã hủy'
                        }[order.status] || order.status;
                        return (
                          <>
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-1">{t('transfers.code')}</p>
                      <h3 className="font-heading text-xl italic group-hover:text-gold transition-colors">{order.code}</h3>
                    </div>
                  </div>

                  {/* Flow: From -> To */}
                  <div className="flex-1 flex items-center gap-6 sm:gap-12 w-full">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground opacity-40">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-black tracking-widest">{t('transfers.from_store')}</span>
                      </div>
                      <p className="text-sm font-bold uppercase tracking-tight">{order.fromStore.name}</p>
                    </div>
                    
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="w-10 h-[1px] bg-white/10" />
                      <div className="absolute p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-gold group-hover:bg-gold transition-all">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-right lg:text-left">
                      <div className="flex items-center lg:justify-start justify-end gap-2 text-muted-foreground opacity-40">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-black tracking-widest">{t('transfers.to_store')}</span>
                      </div>
                      <p className="text-sm font-bold uppercase tracking-tight">{order.toStore.name}</p>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-6 lg:border-l border-white/10 lg:pl-8">
                    <div className="text-center lg:text-right space-y-1">
                      <div className="flex items-center lg:justify-end justify-center gap-2 text-muted-foreground opacity-40">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-black tracking-widest">Date</span>
                      </div>
                      <p className="text-[10px] font-bold">{format.dateTime(new Date(order.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>

                    <div className="flex gap-3">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(order.id, 'ship')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            {t('transfers.ship_btn')}
                          </button>
                          <button
                            onClick={() => handleAction(order.id, 'cancel')}
                            className="bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            {t('transfers.cancel_btn')}
                          </button>
                        </>
                      )}

                      {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-20">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-white/[0.02] border-t border-white/5 p-6 flex flex-wrap gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2">
                      <div className="w-1 h-1 rounded-full bg-gold/50" />
                      <span className="text-[10px] font-bold">{item.variant.product.name}</span>
                      <span className="text-[10px] opacity-40">{item.variant.name}</span>
                      <span className="text-[10px] font-black text-gold ml-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
