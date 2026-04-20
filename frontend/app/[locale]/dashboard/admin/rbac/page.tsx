'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Shield, ShieldAlert, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RBACAdmin() {
  const t = useTranslations('dashboard.admin.rbac');

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="p-2 sm:p-2.5 bg-gold/10 rounded-xl text-gold shadow-sm">
               <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading gold-gradient uppercase tracking-tighter leading-none">
              {t('title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-[.3em] font-bold opacity-70">
             {t('subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-8 md:mb-12">
          {[
            { label: t('stats.active_roles'), value: '3', icon: ShieldCheck, color: 'text-emerald-500' },
            { label: t('stats.pending'), value: '0', icon: Lock, color: 'text-muted-foreground' },
            { label: t('stats.alerts'), value: '2', icon: ShieldAlert, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className={`glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-stone-200 dark:border-white/5 relative overflow-hidden group shadow-sm ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
               <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gold/5 blur-[40px] sm:blur-[60px] pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={20} className={`${stat.color} sm:w-6 sm:h-6`} />
                <span className="text-xl sm:text-2xl font-serif text-foreground italic">{stat.value}</span>
              </div>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 leading-none">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-[2.5rem] sm:rounded-[4rem] border border-stone-200 dark:border-white/5 p-10 sm:p-16 text-center bg-background/50 relative overflow-hidden shadow-sm">
           <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full glass border border-gold/20 flex items-center justify-center animate-pulse shadow-inner">
               <Loader2 size={32} className="text-gold animate-spin sm:w-10 sm:h-10" />
            </div>
            <div className="max-w-md space-y-4">
              <h2 className="text-xl sm:text-2xl font-heading uppercase tracking-widest text-foreground leading-relaxed">
                {t('matrix.title')}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.2em] leading-relaxed italic opacity-60">
                {t('matrix.sync_msg')}
              </p>
            </div>
            <div className="h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
