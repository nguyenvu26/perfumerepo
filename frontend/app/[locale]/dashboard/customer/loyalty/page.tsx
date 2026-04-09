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
