'use client';
 
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Trophy, History, ArrowUpRight, Zap, Gift, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { loyaltyService } from '@/services/loyalty.service';
import { AuthGuard } from '@/components/auth/auth-guard';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
 
export default function LoyaltyDashboard() {
    const t = useTranslations('dashboard.customer.loyalty');
    const { locale } = useParams();
    const dateLocale = locale === 'vi' ? vi : enUS;
    const [data, setData] = useState<{ points: number; history: any[] }>({ points: 0, history: [] });
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        loyaltyService.getStatus()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);
 
    const tiers = [
        { name: t('tiers.bronze'), min: 0, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { name: t('tiers.silver'), min: 500, color: 'text-stone-300', bg: 'bg-stone-300/10' },
        { name: t('tiers.gold'), min: 2000, color: 'text-gold', bg: 'bg-gold/10' },
        { name: t('tiers.platinum'), min: 5000, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ];
 
    const currentTier = [...tiers].reverse().find(t => data.points >= t.min) || tiers[0];
    const nextTier = tiers[tiers.indexOf(currentTier) + 1];
    const progress = nextTier ? (data.points / nextTier.min) * 100 : 100;
 
    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="p-8 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">{t('subtitle')}</p>
                </header>
 
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Points Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-1 bg-gradient-to-br from-gold/30 via-transparent to-gold/5 rounded-[3rem]"
                        >
                            <div className="bg-background/60 backdrop-blur-3xl p-10 rounded-[2.9rem] flex flex-col md:flex-row items-center gap-10">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-gold/20 flex items-center justify-center relative">
                                        <Coins size={48} className="text-gold animate-pulse" />
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle
                                                cx="64" cy="64" r="60"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                className="text-gold"
                                                strokeDasharray={377}
                                                strokeDashoffset={377 - (377 * Math.min(progress, 100)) / 100}
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-5xl font-heading text-foreground mb-2">
                                        {data.points} <span className="text-sm font-body text-muted-foreground tracking-[0.3em] uppercase">{t('credits_suffix')}</span>
                                    </h2>
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${currentTier.bg} ${currentTier.color} border border-current/20`}>
                                            {currentTier.name} {t('member_suffix')}
                                        </span>
                                        {nextTier && (
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                {t('to_next_tier', { count: nextTier.min - data.points, name: nextTier.name })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button className="bg-gold text-primary-foreground px-8 py-4 rounded-full font-heading text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-xl shadow-gold/20">
                                    {t('redeem_btn')}
                                </button>
                            </div>
                        </motion.div>
 
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
                                                            return t(`reasons.${r}`);
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
 
                    {/* Sidebar Rewards */}
                    <div className="space-y-6">
                        <div className="glass p-8 rounded-[2.5rem] border-gold/10">
                            <h3 className="font-heading text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Trophy size={16} className="text-gold" /> {t('perks_title')}
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'free_shipping', points: 500, icon: ArrowUpRight },
                                    { key: 'discount_10', points: 1000, icon: Gift },
                                    { key: 'rare_case', points: 2500, icon: ShieldCheck },
                                ].map((perk, i) => (
                                    <div key={i} className="p-4 rounded-2xl border border-border bg-white/[0.02] group cursor-pointer hover:border-gold/30 transition-all">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-foreground">{t(`perks_list.${perk.key}`)}</p>
                                                <p className="text-[10px] text-gold uppercase font-bold mt-1">{perk.points} {t('credits_suffix')}</p>
                                            </div>
                                            <perk.icon size={14} className="text-muted-foreground group-hover:text-gold transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
 
                        <div className="glass p-8 rounded-[2.5rem] border-ai/10 bg-ai/5">
                            <h3 className="font-heading text-[10px] text-ai uppercase tracking-[.4em] mb-4">{t('ai_insight_title')}</h3>
                            <p className="text-xs text-muted-foreground font-body leading-relaxed">
                                {t('ai_insight_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </AuthGuard>
    );
}
