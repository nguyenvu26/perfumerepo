'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Tag, Zap, Timer, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { promotionService } from '@/services/promotion.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function CustomerPromotions() {
    const t = useTranslations('dashboard.customer.promotions');
    const tFeatured = useTranslations('featured');
    const [promos, setPromos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        promotionService.getActive()
            .then(setPromos)
            .finally(() => setLoading(false));
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const formatTimeRemaining = (endDate: string) => {
        const remaining = new Date(endDate).getTime() - new Date().getTime();
        if (remaining <= 0) return t('expired');

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return t('time_left', { time: `${hours}h ${minutes}m` });
    };

    return (
        <AuthGuard allowedRoles={['customer']}>
            <main className="p-8 max-w-7xl mx-auto pb-32">
                <header className="mb-16">
                    <h1 className="text-5xl font-heading gold-gradient mb-2 uppercase tracking-tighter italic">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[.4em] font-bold">
                        {t('subtitle')}
                    </p>
                </header>

                {loading ? (
                    <div className="py-32 flex justify-center">
                        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : promos.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {promos.map((promo, i) => (
                            <motion.div
                                key={promo.id}
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
                                        <div className="text-right">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/10 text-gold text-[8px] uppercase tracking-[.3em] font-bold">
                                                <Timer size={14} />
                                                {formatTimeRemaining(promo.endDate)}
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-3xl font-heading text-foreground uppercase tracking-wider mb-3 leading-tight group-hover:text-gold transition-colors">
                                        {promo.code}
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground font-body leading-relaxed mb-8 flex-1 italic uppercase tracking-widest">
                                        {promo.description || t('fallback_desc')}
                                    </p>

                                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-[.3em] font-bold">
                                                {t('benefit_label')}
                                            </p>
                                            <p className="text-2xl font-serif text-gold">
                                                {promo.discountType === 'PERCENTAGE' 
                                                  ? t('discount_off', { value: promo.discountValue }) 
                                                  : t('discount_fixed', { 
                                                      value: new Intl.NumberFormat(tFeatured('currency_code') === 'USD' ? 'en-US' : 'vi-VN').format(promo.discountValue),
                                                      currency: tFeatured('currency_code') === 'USD' ? 'USD' : 'VND'
                                                    })}
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

                                    {/* Abstract Decor */}
                                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/10 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass p-24 rounded-[4rem] text-center bg-background/20 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
                        <Sparkles className="w-16 h-16 text-gold/20 mx-auto mb-8" />
                        <h2 className="text-3xl font-heading text-muted-foreground uppercase tracking-widest mb-4">
                            {t('no_promos')}
                        </h2>
                        <p className="text-[11px] text-muted-foreground font-body uppercase tracking-[.3em] font-bold">
                            {t('no_promos_desc')}
                        </p>
                    </div>
                )}

                {/* Referral Card */}
                <motion.div 
                   initial={{ opacity: 0 }}
                   whileInView={{ opacity: 1 }}
                   className="mt-16 glass p-12 rounded-[4rem] border-gold/10 bg-gradient-to-r from-background to-gold/5 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-full bg-gold/5 blur-[100px] pointer-events-none" />
                    
                    <div className="w-24 h-24 rounded-[2rem] bg-gold flex items-center justify-center shadow-2xl shadow-gold/30 relative z-10">
                        <Zap className="text-black" size={40} />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left relative z-10">
                        <h3 className="text-2xl font-heading uppercase tracking-tighter mb-3 italic">
                            {t('referral.title')}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-body leading-relaxed uppercase tracking-[.1em]">
                            {t('referral.desc')}
                        </p>
                    </div>
                    
                    <button className="bg-foreground dark:bg-gold text-background dark:text-foreground px-12 py-5 rounded-full font-heading text-[10px] uppercase tracking-[.3em] font-bold hover:scale-105 transition-all shadow-xl shadow-gold/10 relative z-10">
                        {t('referral.cta')}
                    </button>
                </motion.div>
            </main>
        </AuthGuard>
    );
}
