'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Tag, Zap, Timer, Sparkles, Copy, CheckCircle2, Wallet, Coins, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { promotionService } from '@/services/promotion.service';
import { loyaltyService } from '@/services/loyalty.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Link } from '@/lib/i18n';

export default function CustomerPromotions() {
    const t = useTranslations('dashboard.customer.promotions');
    const tMarket = useTranslations('vouchers');
    const tFeatured = useTranslations('featured');
    const tLoyalty = useTranslations('dashboard.customer.loyalty');
    const format = useFormatter();
    const { user } = useAuthStore();

    const [publicPromos, setPublicPromos] = useState<any[]>([]);
    const [redeemablePromos, setRedeemablePromos] = useState<any[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pub, red] = await Promise.all([
                promotionService.getPublic(),
                promotionService.getRedeemable()
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
        setActionLoading(id);
        try {
            await promotionService.claim(id);
            toast.success(tMarket('claim_success'));
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || tMarket('action_failed'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRedeem = async (id: string, cost: number) => {
        if (userPoints < cost) {
            toast.error(tMarket('insufficient_points'));
            return;
        }
        
        if (!confirm(tMarket('confirm_redeem', { points: cost }))) return;

        setActionLoading(id);
        try {
            await promotionService.redeem(id);
            toast.success(tMarket('redeem_success'));
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || tMarket('action_failed'));
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const formatTimeRemaining = (endDate: string) => {
        if (!endDate) return '';
        const date = new Date(endDate);
        if (isNaN(date.getTime())) return '';

        const remaining = date.getTime() - new Date().getTime();
        if (remaining <= 0) return t('expired');

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return t('time_left', { time: `${hours}h ${minutes}m` });
    };

    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="p-8 max-w-7xl mx-auto pb-32">
                <header className="mb-20 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 text-gold mb-4 uppercase tracking-[.4em] font-bold text-[10px]">
                            <Sparkles size={16} />
                            <span>{tMarket('badge')}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                        <p className="mt-4 text-muted-foreground font-body text-[11px] uppercase tracking-[.3em] font-medium max-w-xl">
                            {t('subtitle')}
                        </p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass px-10 py-6 rounded-[2.5rem] border-gold/20 flex items-center gap-6 shadow-2xl shadow-gold/10"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-gold flex items-center justify-center text-black">
                            <Coins size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{tMarket('your_points')}</p>
                            <p className="text-3xl font-serif text-gold">{format.number(userPoints)} <span className="text-sm">pts</span></p>
                        </div>
                    </motion.div>
                </header>

                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-gold" />
                        <p className="text-[10px] uppercase tracking-[.4em] font-bold text-muted-foreground">{tMarket('loading')}</p>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {/* Available Marketplace Section */}
                        <section>
                            <div className="flex items-center gap-6 mb-12">
                                <h2 className="text-2xl font-heading uppercase tracking-widest italic flex items-center gap-4">
                                    <Tag className="text-emerald-500" />
                                    {t('marketplace_title')}
                                </h2>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                                {publicPromos.map((promo) => (
                                    <OfferCard 
                                        key={promo.id} 
                                        promo={promo} 
                                        type="public"
                                        onAction={() => handleClaim(promo.id)}
                                        loading={actionLoading === promo.id}
                                        tMarket={tMarket}
                                        t={t}
                                        tFeatured={tFeatured}
                                        format={format}
                                        formatTimeRemaining={formatTimeRemaining}
                                    />
                                ))}
                                {redeemablePromos.map((promo) => (
                                    <OfferCard 
                                        key={promo.id} 
                                        promo={promo} 
                                        type="redeemable"
                                        onAction={() => handleRedeem(promo.id, promo.pointsCost)}
                                        loading={actionLoading === promo.id}
                                        tMarket={tMarket}
                                        t={t}
                                        tFeatured={tFeatured}
                                        format={format}
                                        formatTimeRemaining={formatTimeRemaining}
                                    />
                                ))}
                            </div>
                            {publicPromos.length === 0 && redeemablePromos.length === 0 && (
                                <EmptyState message={tMarket('no_public')} icon={Tag} />
                            )}
                        </section>
                    </div>
                )}
            </main>
        </AuthGuard>
    );
}

function OfferCard({ promo, type, onAction, loading, tMarket, t, tFeatured, format, formatTimeRemaining }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative h-full"
        >
            <div className="glass rounded-[2.5rem] bg-background/40 border border-white/5 overflow-hidden h-full relative z-10 transition-all duration-300 group-hover:border-gold/30">
                <div className="p-6 flex flex-col h-full relative z-20">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${type === 'public' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
                                {type === 'public' ? <Tag size={18} /> : <Coins size={18} />}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="px-3 py-1.5 rounded-full bg-background/60 border border-white/5 text-[8px] uppercase tracking-[.3em] font-bold text-muted-foreground flex items-center backdrop-blur-md">
                                {formatTimeRemaining(promo.endDate)}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-xl font-heading uppercase tracking-wider mb-2 group-hover:text-gold transition-colors duration-300">{promo.code}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-body italic mb-6 leading-relaxed max-w-full line-clamp-2">{promo.description || t('fallback_desc')}</p>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: promo.usageLimit ? `${Math.max(0, Math.min(100, ((promo.usageLimit - promo.usedCount) / promo.usageLimit) * 100))}%` : '100%' }}
                                    className="h-full bg-gold/40"
                                />
                            </div>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/80 whitespace-nowrap">
                                {promo.usageLimit 
                                    ? t('remaining_slots', { remaining: Math.max(0, promo.usageLimit - promo.usedCount), limit: promo.usageLimit })
                                    : t('unlimited')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                        <div className="space-y-1">
                            <p className="text-[7px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">{t('benefit_label')}</p>
                            <p className="text-xl font-serif text-gold leading-none">
                                {promo.discountType === 'PERCENTAGE' 
                                    ? <>{promo.discountValue}% OFF</>
                                    : <>{format.number(promo.discountValue)} <span className="text-[10px]">đ</span></>}
                            </p>
                        </div>

                        <button
                            onClick={onAction}
                            disabled={loading}
                            className={`w-full h-12 rounded-xl font-heading text-[9px] uppercase tracking-[.2em] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                                type === 'public' 
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                                    : 'bg-gold text-black hover:bg-gold/80'
                            }`}
                        >
                            {loading ? (
                                <Loader2 size={14} className="animate-spin block" />
                            ) : (
                                <>
                                    {type === 'public' ? <Plus size={16} strokeWidth={3} /> : <Zap size={16} strokeWidth={3} />}
                                    <span>{type === 'public' ? tMarket('claim_btn') : tMarket('redeem_btn', { points: promo.pointsCost })}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function OwnedVoucherCard({ promo: userPromo, i, copyToClipboard, copiedCode, formatTimeRemaining, t, tFeatured }: any) {
    const promo = userPromo.promotion || {};
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-1 bg-gradient-to-br from-gold/20 via-transparent to-gold/5 rounded-[3.5rem] group"
        >
            <div className="bg-background/40 backdrop-blur-3xl p-10 rounded-[3.4rem] h-full flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 glass rounded-2xl border-gold/20 flex items-center justify-center text-gold">
                        <Tag size={24} />
                    </div>
                    {promo.endDate && (
                        <div className="text-right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/10 text-gold text-[8px] uppercase tracking-[.3em] font-bold">
                                <Timer size={14} />
                                {formatTimeRemaining(promo.endDate)}
                            </div>
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-heading text-foreground uppercase tracking-wider mb-3 leading-tight group-hover:text-gold transition-colors">
                    {promo.code || 'UNKNOWN'}
                </h2>
                <p className="text-[11px] text-muted-foreground font-body leading-relaxed mb-8 flex-1 italic uppercase tracking-widest">
                    {promo.description || t('fallback_desc')}
                </p>

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[.3em] font-bold">{t('benefit_label')}</p>
                        <p className="text-2xl font-serif text-gold">
                            {promo.discountValue ? (
                                promo.discountType === 'PERCENTAGE' 
                                    ? t('discount_off', { value: promo.discountValue }) 
                                    : `-${new Intl.NumberFormat().format(promo.discountValue)} ${tFeatured('currency_symbol') || 'đ'}`
                            ) : '---'}
                        </p>
                    </div>
                    <button
                        onClick={() => copyToClipboard(promo.code)}
                        className="h-14 px-8 rounded-2xl glass border-gold/20 text-gold font-heading text-[10px] uppercase tracking-[.3em] font-bold hover:bg-gold hover:text-black transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-gold/5"
                    >
                        {copiedCode === promo.code ? (
                            <>
                                <CheckCircle2 size={16} className="animate-in zoom-in" />
                                {t('copied')}
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                {t('copy_btn')}
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
        <div className="glass p-20 rounded-[4rem] text-center bg-background/20 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
            <Icon className="w-16 h-16 text-gold/20 mx-auto mb-8" />
            <p className="text-[11px] text-muted-foreground font-body uppercase tracking-[.3em] font-bold">{message}</p>
        </div>
    );
}
