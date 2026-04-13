'use client';
 
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Trophy, History, ArrowUpRight, Zap, Gift, ShieldCheck, Tag, Plus, Loader2, Wallet, Copy, CheckCircle2, Timer } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import { loyaltyService } from '@/services/loyalty.service';
import { promotionService } from '@/services/promotion.service';
import { AuthGuard } from '@/components/auth/auth-guard';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n';
 
export default function LoyaltyDashboard() {
    const t = useTranslations('dashboard.customer.loyalty');
    const tMarket = useTranslations('vouchers');
    const tPromo = useTranslations('dashboard.customer.promotions');
    const nf = useFormatter();
    const { locale } = useParams();
    const dateLocale = locale === 'vi' ? vi : enUS;
    const [data, setData] = useState<{ points: number; history: any[] }>({ points: 0, history: [] });
    const [myPromos, setMyPromos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [status, my] = await Promise.all([
                loyaltyService.getStatus(),
                promotionService.getMyPromotions(),
            ]);
            setData(status);
            setMyPromos(my);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
        if (remaining <= 0) return tPromo('expired') || 'Expired';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return tPromo('time_left', { time: `${hours}h ${minutes}m` }) || `${hours}h ${minutes}m left`;
    };


    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="p-8 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">{t('subtitle')}</p>
                </header>
 
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Points Card */}
                    <div className="lg:col-span-3 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-1 bg-gradient-to-br from-gold/30 via-transparent to-gold/5 rounded-[3rem]"
                        >
                            <div className="bg-background/60 backdrop-blur-3xl p-10 rounded-[2.9rem] flex flex-col md:flex-row items-center gap-10">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-gold/20 flex items-center justify-center relative">
                                        <Coins size={48} className="text-gold animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-5xl font-heading text-foreground mb-2">
                                        {data.points} <span className="text-sm font-body text-muted-foreground tracking-[0.3em] uppercase">{t('credits_suffix')}</span>
                                    </h2>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                                            {t('ai_insight_desc')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                     <Link href="/dashboard/customer/promotions" className="px-8 py-4 rounded-full glass border-gold/20 text-gold font-heading text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
                                        {t('discover_market')}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
 
                        {/* Olfactory Incentives (Owned Vouchers) */}
                        <div className="glass bg-white/5 rounded-[2.5rem] border-border overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Wallet size={18} className="text-gold" />
                                    <h3 className="font-heading uppercase tracking-widest">{tPromo('title')}</h3>
                                </div>
                            </div>
                            <div className="p-8">
                                {loading ? (
                                    <div className="py-10 text-center flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-gold" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{tMarket('loading')}</p>
                                    </div>
                                ) : myPromos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myPromos.map((userPromo, i) => {
                                            const promo = userPromo.promotion || {};
                                            return (
                                                <motion.div 
                                                    key={userPromo.id} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="glass p-6 rounded-[2rem] bg-background/40 border border-white/5 flex flex-col h-full group hover:border-gold/30 transition-all font-body"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-3 rounded-xl bg-gold/10 text-gold">
                                                            <Tag size={16} />
                                                        </div>
                                                        {promo.endDate && (
                                                            <div className="px-3 py-1.5 rounded-full bg-gold/5 border border-gold/10 text-gold text-[8px] uppercase tracking-widest font-bold flex items-center gap-2">
                                                                <Timer size={12} />
                                                                {formatTimeRemaining(promo.endDate)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className="text-xl font-heading text-foreground uppercase tracking-wider mb-2 line-clamp-1 group-hover:text-gold transition-colors">{promo.code}</h4>
                                                    <p className="text-[10px] text-muted-foreground uppercase mt-1 mb-6 flex-1 line-clamp-2 italic tracking-widest leading-loose">
                                                        {promo.description || tPromo('fallback_desc')}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div>
                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{tPromo('benefit_label')}</p>
                                                            <p className="text-lg font-serif text-gold">
                                                                {promo.discountType === 'PERCENTAGE' 
                                                                    ? `${promo.discountValue}% OFF`
                                                                    : `-${nf.number(promo.discountValue)} đ`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(promo.code)}
                                                            className="p-3 rounded-xl glass border-white/10 text-gold hover:bg-gold hover:text-black transition-all"
                                                            title={tPromo('copy_btn')}
                                                        >
                                                            {copiedCode === promo.code ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center opacity-50">
                                        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{tPromo('no_promos')}</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* History */}
                        <div className="glass bg-white/5 rounded-[2.5rem] border-border overflow-hidden">
                            <div className="p-8 border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <History size={18} className="text-gold" />
                                    <h3 className="font-heading uppercase tracking-widest">{t('history_title')}</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {loading ? (
                                    <div className="p-10 text-center text-muted-foreground uppercase text-[10px] tracking-widest">{t('syncing')}</div>
                                ) : data.history.length > 0 ? (
                                    data.history.map((tx, i) => (
                                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${tx.points > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {tx.points > 0 ? <Zap size={16} /> : <Gift size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                                                        {(() => {
                                                            const r = tx.reason.toLowerCase();
                                                            if (r.startsWith('earned_from_order')) {
                                                                const id = tx.reason.split('_').pop();
                                                                return t('reasons.earned_from_order', { id });
                                                            }
                                                            if (r.startsWith('exchanged_for_voucher')) {
                                                                const code = tx.reason.split('_').pop()?.toUpperCase();
                                                                return t('reasons.exchanged_for_voucher_generic', { code });
                                                            }
                                                            try {
                                                                return t(`reasons.${r}`);
                                                            } catch (e) {
                                                                return r.replace(/_/g, ' ').toUpperCase();
                                                            }
                                                        })()}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                                                        {format(new Date(tx.createdAt), 'MMM dd, yyyy • HH:mm', { locale: dateLocale })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`font-heading ${tx.points > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {tx.points > 0 ? '+' : ''}{tx.points}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-20 text-center">
                                        <p className="text-muted-foreground uppercase text-[10px] tracking-widest">{t('empty')}</p>
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
