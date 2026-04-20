'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Mail, Zap, TrendingUp, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AdminMarketing() {
    const t = useTranslations('dashboard.admin.marketing');

    return (
        <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-12 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-heading gold-gradient mb-1 uppercase tracking-tighter leading-none">{t('title')}</h1>
          <p className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-[.3em] font-bold">{t('subtitle')}</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 md:mb-12">
          {[
            { label: t('stats.subscribers'), value: '8.2k', icon: Users },
            { label: t('stats.open_rate'), value: '24.5%', icon: Mail },
            { label: t('stats.conversion'), value: '3.8%', icon: TrendingUp },
            { label: t('stats.roi'), value: '4.2x', icon: Zap }
          ].map((stat, i) => (
            <div key={i} className="glass p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 hover:border-gold/30 transition-all group relative active:scale-[0.98] sm:active:scale-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-muted-foreground text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-bold leading-none">{stat.label}</h3>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold opacity-80" />
              </div>
              <p className="text-xl sm:text-2xl font-heading text-foreground tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-10">
          <div className="lg:col-span-2 glass rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-base sm:text-lg uppercase tracking-widest mb-6 border-l-4 border-gold pl-4">{t('campaigns.title')}</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-secondary/10 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-secondary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-heading uppercase text-[10px] sm:text-xs tracking-wider leading-relaxed">Spring Royale Collection</h4>
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">{t('campaigns.ends_in', { days: 4 })}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[8px] uppercase tracking-[0.2em] font-bold px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">{t('campaigns.active')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6 sm:y-8">
            <div className="glass rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 p-6 sm:p-8 shadow-sm">
              <h2 className="font-heading text-base sm:text-lg uppercase tracking-widest mb-6 border-l-4 border-gold pl-4">{t('promotions.title')}</h2>
              <p className="text-xs text-muted-foreground font-body leading-relaxed mb-6 italic opacity-80">
                {t('promotions.desc')}
              </p>
              <Link href="/dashboard/admin/marketing/promotions" className="w-full py-4 glass bg-gold text-black dark:bg-transparent border border-gold/40 text-gold font-heading text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-all rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-gold/5 active:scale-95">
                <Tag size={14} className="group-hover:scale-110 transition-transform" />
                {t('promotions.manage_btn')}
              </Link>
            </div>

            <div className="glass rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 p-6 sm:p-8 shadow-sm">
              <h2 className="font-heading text-base sm:text-lg uppercase tracking-widest mb-6 border-l-4 border-gold pl-4">{t('suggestions.title')}</h2>
              <div className="space-y-6">
                <p className="text-xs text-muted-foreground font-body leading-relaxed italic opacity-80">
                  {t.rich('suggestions.desc', {
                    topic: (chunks) => <span className="text-gold font-bold">{chunks}</span>,
                    topicValue: 'Floral Notes'
                  })}
                </p>
                <button className="w-full py-4 glass border border-gold/40 text-gold font-heading text-[10px] uppercase tracking-widest hover:bg-gold/5 transition-all rounded-2xl shadow-lg shadow-gold/5 active:scale-95">
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
