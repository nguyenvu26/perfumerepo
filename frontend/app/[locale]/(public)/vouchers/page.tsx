'use client';

import { promotionService } from '@/services/promotion.service';
import { loyaltyService } from '@/services/loyalty.service';
import { Tag, Zap, Timer, Sparkles, Plus, Wallet, Coins, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Breadcrumb } from '@/components/common/breadcrumb';

export default function VoucherMarketplace() {
  const t = useTranslations('vouchers');
  const tDashboard = useTranslations('dashboard.customer.promotions');
  const tFeatured = useTranslations('featured');
  const tCommon = useTranslations('common');
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

  const breadcrumbItems = [
    { label: tCommon('vouchers'), active: true }
  ];

  return (
    <main className="min-h-screen pt-32 pb-24 bg-background relative overflow-hidden transition-colors">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gold/5 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gold/5 blur-[150px] -z-10 rounded-full" />

      <div className="container-responsive">
        <Breadcrumb items={breadcrumbItems} className="mb-12" />

        <header className="mb-20 flex flex-col lg:flex-row justify-between lg:items-end gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 text-gold mb-6 uppercase tracking-[.4em] font-black text-[10px]">
              <Sparkles size={16} />
              <span>{t('badge')}</span>
            </div>
            <h1 className="text-fluid-4xl font-serif gold-gradient uppercase tracking-tighter leading-none italic">
              {t('title')}
            </h1>
            <p className="mt-8 text-muted-foreground font-body text-[10px] md:text-xs uppercase tracking-[0.4em] font-medium max-w-xl leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {user && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass px-8 md:px-12 py-6 md:py-8 rounded-[2.5rem] border-gold/20 flex items-center gap-6 shadow-2xl shadow-gold/10 w-full lg:w-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center text-black shrink-0 transition-transform hover:scale-110">
                <Coins size={28} />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-2">{t('your_points')}</p>
                <p className="text-3xl md:text-4xl font-serif text-gold leading-none">{format.number(userPoints)} <span className="text-xs md:text-sm text-gold/60">pts</span></p>
              </div>
            </motion.div>
          )}
        </header>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-gold" />
            <p className="text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground animate-pulse">{t('loading')}</p>
          </div>
        ) : (
          <div className="space-y-32">
            {/* Public Vouchers */}
            <section>
              <div className="flex items-center gap-6 mb-16">
                <div className="h-[1px] flex-1 bg-linear-to-r from-transparent to-border/50" />
                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-widest italic flex items-center gap-4 shrink-0">
                  <Tag className="text-emerald-500" />
                  {t('public_section')}
                </h2>
                <div className="h-[1px] flex-1 bg-linear-to-l from-transparent to-border/50" />
              </div>

              {publicPromos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
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
              <div className="flex items-center gap-6 mb-16">
                <div className="h-[1px] flex-1 bg-linear-to-r from-transparent to-border/50" />
                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-widest italic flex items-center gap-4 shrink-0">
                  <Wallet className="text-gold" />
                  {t('redeemable_section')}
                </h2>
                <div className="h-[1px] flex-1 bg-linear-to-l from-transparent to-border/50" />
              </div>

              {redeemablePromos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
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
      </div>
    </main>
  );
}

function VoucherCard({ promo, type, onAction, loading, t, tDashboard, tFeatured, format }: any) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass rounded-[3rem] md:rounded-[4rem] border border-white/5 bg-linear-to-br from-white/5 to-transparent overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-gold/5 transition-all duration-500"
    >
      <div className="p-8 md:p-12 flex flex-col h-full relative">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${type === 'public' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
             {type === 'public' ? <Tag size={28} /> : <Coins size={28} />}
          </div>
          <div className="w-full sm:w-auto">
             <div className="px-5 py-3 rounded-full glass border-white/10 text-[8px] md:text-[9px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-3 backdrop-blur-xl">
                <Timer size={14} className="text-gold" />
                {tDashboard('time_left', { time: format.dateTime(new Date(promo.endDate), { month: 'short', day: 'numeric' }) })}
             </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-3xl md:text-4xl font-serif uppercase tracking-tighter mb-4 group-hover:text-gold transition-colors leading-none italic">{promo.code}</h3>
          <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium italic mb-10 leading-relaxed opacity-80">{promo.description || tDashboard('fallback_desc')}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-10 border-t border-white/10 mt-auto gap-10">
          <div>
            <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-3">{tDashboard('benefit_label')}</p>
            <p className="text-3xl md:text-5xl font-serif text-gold leading-none italic">
               {promo.discountType === 'PERCENTAGE' 
                  ? tDashboard('discount_off', { value: promo.discountValue }) 
                  : `-${format.number(promo.discountValue)} ${tFeatured('currency_symbol') || 'đ'}`}
            </p>
          </div>

          <button
            onClick={onAction}
            disabled={loading}
            className={`h-16 px-10 rounded-2xl md:rounded-[2rem] font-heading text-[10px] uppercase tracking-[0.2em] font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl w-full sm:w-auto ${
              type === 'public' 
                ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                : 'bg-gold text-black hover:bg-gold/80'
            }`}
          >
            {loading ? (
                <Loader2 size={18} className="animate-spin text-black" />
            ) : type === 'public' ? (
              <>
                <Plus size={18} strokeWidth={4} />
                {t('claim_btn')}
              </>
            ) : (
              <>
                <Zap size={18} strokeWidth={4} />
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
    <div className="glass p-20 rounded-[3rem] md:rounded-[4rem] text-center bg-background/20 border-border/50">
      <Icon className="w-16 h-16 text-muted-foreground/10 mx-auto mb-8" />
      <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[.4em] font-black italic opacity-60">{message}</p>
    </div>
  );
}
