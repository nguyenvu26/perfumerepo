'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Shield, ShieldAlert, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RBACAdmin() {
  const t = useTranslations('dashboard.admin.rbac');

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-8 pb-20 max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-gold/10 rounded-lg text-gold">
               <Shield size={24} />
            </div>
            <h1 className="text-4xl font-heading gold-gradient uppercase tracking-tighter">
              {t('title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[.3em] font-bold">
             {t('subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: t('stats.active_roles'), value: '3', icon: ShieldCheck, color: 'text-emerald-500' },
            { label: t('stats.pending'), value: '0', icon: Lock, color: 'text-muted-foreground' },
            { label: t('stats.alerts'), value: '2', icon: ShieldAlert, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="glass p-10 rounded-[3rem] border-border relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[60px] pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={20} className={stat.color} />
                <span className="text-2xl font-serif text-foreground">{stat.value}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-[4rem] border-border p-16 text-center bg-background/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-24 h-24 rounded-full glass border-gold/20 flex items-center justify-center animate-pulse">
               <Loader2 size={40} className="text-gold animate-spin" />
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-heading uppercase tracking-widest text-foreground mb-4">
                {t('matrix.title')}
              </h2>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[.2em] leading-relaxed">
                {t('matrix.sync_msg')}
              </p>
            </div>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
