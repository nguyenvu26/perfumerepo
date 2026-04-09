'use client';

import { promotionService } from '@/services/promotion.service';
import { loyaltyService } from '@/services/loyalty.service';
import { Tag, Zap, Timer, Sparkles, Plus, Wallet, Coins, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function VoucherMarketplace() {
  const t = useTranslations('vouchers');
  const tDashboard = useTranslations('dashboard.customer.promotions');
  const tFeatured = useTranslations('featured');
  const format = useFormatter();
  const { user } = useAuthStore();
  
  const [publicPromos, setPublicPromos] = useState<any[]>([]);
  const [redeemablePromos, setRedeemablePromos] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pub, red] = await Promise.all([
        promotionService.getPublic(),
        promotionService.getRedeemable(),
      ]);
      setPublicPromos(pub);
      setRedeemablePromos(red);
      
      if (user) {
        const loyalty = await loyaltyService.getStatus();
        setUserPoints(loyalty.points);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async (id: string) => {
    if (!user) {
        toast.error(t('login_required'));
        return;
    }
    setActionLoading(id);
    try {
      await promotionService.claim(id);
      toast.success(t('claim_success'));
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('action_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRedeem = async (id: string, cost: number) => {
    if (!user) {
        toast.error(t('login_required'));
        return;
    }
    if (userPoints < cost) {
      toast.error(t('insufficient_points'));
      return;
    }
    
    if (!confirm(t('confirm_redeem', { points: cost }))) return;

    setActionLoading(id);
    try {
      await promotionService.redeem(id);
      toast.success(t('redeem_success'));
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('action_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-20 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gold/5 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gold/5 blur-[150px] -z-10 rounded-full" />

      <header className="max-w-7xl mx-auto mb-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <div className="flex items-center gap-3 text-gold mb-4 uppercase tracking-[.4em] font-bold text-[10px]">
            <Sparkles size={16} />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-6xl font-heading gold-gradient uppercase tracking-tighter italic">
            {t('title')}
          </h1>
          <p className="mt-4 text-muted-foreground font-body text-[11px] uppercase tracking-[.3em] font-medium max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        {user && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass px-10 py-6 rounded-[2.5rem] border-gold/20 flex items-center gap-6 shadow-2xl shadow-gold/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gold flex items-center justify-center text-black">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('your_points')}</p>
              <p className="text-3xl font-serif text-gold">{format.number(userPoints)} <span className="text-sm">pts</span></p>
            </div>
          </motion.div>
        )}
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-gold" />
          <p className="text-[10px] uppercase tracking-[.4em] font-bold text-muted-foreground">{t('loading')}</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Public Vouchers */}
          <section>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border" />
              <h2 className="text-2xl font-heading uppercase tracking-widest italic flex items-center gap-4">
                <Tag className="text-emerald-500" />
                {t('public_section')}
              </h2>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border" />
            </div>

            {publicPromos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {publicPromos.map((promo, i) => (
                  <VoucherCard 
                    key={promo.id} 
                    promo={promo} 
                    type="public" 
                    onAction={() => handleClaim(promo.id)}
                    loading={actionLoading === promo.id}
                    t={t}
                    tDashboard={tDashboard}
                    tFeatured={tFeatured}
                    format={format}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message={t('no_public')} icon={Tag} />
            )}
          </section>

          {/* Redeemable Vouchers */}
          <section>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border" />
              <h2 className="text-2xl font-heading uppercase tracking-widest italic flex items-center gap-4">
                <Wallet className="text-gold" />
                {t('redeemable_section')}
              </h2>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border" />
            </div>

            {redeemablePromos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {redeemablePromos.map((promo, i) => (
                  <VoucherCard 
                    key={promo.id} 
                    promo={promo} 
                    type="redeemable" 
                    onAction={() => handleRedeem(promo.id, promo.pointsCost)}
                    loading={actionLoading === promo.id}
                    t={t}
                    tDashboard={tDashboard}
                    tFeatured={tFeatured}
                    format={format}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message={t('no_redeemable')} icon={Wallet} />
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function VoucherCard({ promo, type, onAction, loading, t, tDashboard, tFeatured, format }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent overflow-hidden group"
    >
      <div className="p-10 flex flex-col h-full relative">
        <div className="flex justify-between items-start mb-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${type === 'public' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
             {type === 'public' ? <Tag size={24} /> : <Coins size={24} />}
          </div>
          <div className="text-right">
             <div className="px-5 py-2 rounded-full glass border-white/10 text-[8px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                <Timer size={14} />
                {tDashboard('time_left', { time: format.dateTime(new Date(promo.endDate), { month: 'short', day: 'numeric' }) })}
             </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-3xl font-heading uppercase tracking-wider mb-2 group-hover:text-gold transition-colors">{promo.code}</h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-body italic mb-8">{promo.description || tDashboard('fallback_desc')}</p>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-auto">
          <div>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{tDashboard('benefit_label')}</p>
            <p className="text-3xl font-serif text-gold">
               {promo.discountType === 'PERCENTAGE' 
                  ? tDashboard('discount_off', { value: promo.discountValue }) 
                  : `-${format.number(promo.discountValue)} ${tFeatured('currency_symbol') || 'đ'}`}
            </p>
          </div>

          <button
            onClick={onAction}
            disabled={loading}
            className={`h-16 px-10 rounded-[1.8rem] font-heading text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 transition-all active:scale-95 shadow-2xl ${
              type === 'public' 
                ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                : 'bg-gold text-black hover:bg-gold/80'
            }`}
          >
            {loading ? (
                <Loader2 size={18} className="animate-spin text-black" />
            ) : type === 'public' ? (
              <>
                <Plus size={18} strokeWidth={3} />
                {t('claim_btn')}
              </>
            ) : (
              <>
                <Zap size={18} strokeWidth={3} />
                {t('redeem_btn', { points: promo.pointsCost })}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ message, icon: Icon }: any) {
  return (
    <div className="glass p-20 rounded-[4rem] text-center bg-background/20">
      <Icon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
      <p className="text-[11px] text-muted-foreground uppercase tracking-[.4em] font-medium">{message}</p>
    </div>
  );
}
