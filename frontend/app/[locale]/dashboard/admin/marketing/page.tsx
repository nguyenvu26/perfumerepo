'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Mail, Zap, TrendingUp, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AdminMarketing() {
    const t = useTranslations('dashboard.admin.marketing');

    return (
        <AuthGuard allowedRoles={['admin']}>
            <main className="p-8">
                <header className="mb-12">
                    <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">{t('subtitle')}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: t('stats.subscribers'), value: '8.2k', icon: Users },
                        { label: t('stats.open_rate'), value: '24.5%', icon: Mail },
                        { label: t('stats.conversion'), value: '3.8%', icon: TrendingUp },
                        { label: t('stats.roi'), value: '4.2x', icon: Zap }
                    ].map((stat, i) => (
                        <div key={i} className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">{stat.label}</h3>
                                <stat.icon className="w-5 h-5 text-gold" />
                            </div>
                            <p className="text-2xl font-heading text-foreground">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass rounded-[2.5rem] border-border p-8">
                        <h2 className="font-heading text-lg uppercase tracking-widest mb-6">{t('campaigns.title')}</h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-6 rounded-3xl bg-secondary/20 border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="font-heading uppercase text-xs tracking-wider">Spring Royale Collection</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t('campaigns.ends_in', { days: 4 })}</p>
                                        </div>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full border border-emerald-500/20">{t('campaigns.active')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="glass rounded-[2.5rem] border-border p-8">
                            <h2 className="font-heading text-lg uppercase tracking-widest mb-6">{t('promotions.title')}</h2>
                            <p className="text-xs text-muted-foreground font-body leading-relaxed mb-6">
                                {t('promotions.desc')}
                            </p>
                            <Link href="/dashboard/admin/marketing/promotions" className="w-full py-4 glass border-gold/20 text-gold font-heading text-[10px] uppercase tracking-widest hover:bg-gold/5 transition-all rounded-2xl flex items-center justify-center gap-3">
                                <Tag size={14} />
                                {t('promotions.manage_btn')}
                            </Link>
                        </div>

                        <div className="glass rounded-[2.5rem] border-border p-8">
                            <h2 className="font-heading text-lg uppercase tracking-widest mb-6">{t('suggestions.title')}</h2>
                            <div className="space-y-6">
                                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                                    {t.rich('suggestions.desc', {
                                        topic: (chunks) => <span className="text-gold">{chunks}</span>,
                                        topicValue: 'Floral Notes'
                                    })}
                                </p>
                                <button className="w-full py-4 glass border-gold/20 text-gold font-heading text-[10px] uppercase tracking-widest hover:bg-gold/5 transition-all rounded-2xl">
                                    {t('suggestions.generate_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </AuthGuard>
    );
}
