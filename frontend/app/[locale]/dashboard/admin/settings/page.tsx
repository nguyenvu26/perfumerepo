'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Globe, Shield, Bell, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminSettings() {
    const t = useTranslations('dashboard.admin.settings');

    return (
        <AuthGuard allowedRoles={['admin']}>
            <main className="p-4 sm:p-6 md:p-8 pb-20 max-w-5x; mx-auto">
                <header className="mb-8 md:mb-12 space-y-1">
                    <h1 className="text-3xl sm:text-4xl font-heading gold-gradient mb-1 uppercase tracking-tighter leading-none">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-[.3em] font-extrabold opacity-70">{t('subtitle')}</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
                    {[
                        { title: t('sections.localization.title'), desc: t('sections.localization.desc'), icon: Globe },
                        { title: t('sections.security.title'), desc: t('sections.security.desc'), icon: Shield },
                        { title: t('sections.notifications.title'), desc: t('sections.notifications.desc'), icon: Bell },
                        { title: t('sections.data.title'), desc: t('sections.data.desc'), icon: Database },
                    ].map((setting, i) => (
                        <div key={i} className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 hover:border-gold/30 transition-all cursor-pointer group active:scale-[0.98] shadow-sm">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary/10 dark:bg-white/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors shrink-0">
                                    <setting.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-foreground uppercase tracking-widest text-[11px] sm:text-sm mb-1 group-hover:text-gold transition-colors">{setting.title}</h3>
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60 line-clamp-2">{setting.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 max-w-4xl flex flex-col sm:flex-row justify-between items-center text-muted-foreground gap-4">
                    <span className="text-[9px] sm:text-[10px] uppercase font-heading tracking-widest opacity-40">{t('footer.version', { version: '2.0.4-AI' })}</span>
                    <button className="text-[9px] sm:text-[10px] uppercase font-heading tracking-widest text-gold hover:underline underline-offset-8 font-extrabold p-3 -m-3 sm:p-0 sm:m-0 shrink-0">{t('footer.reload')}</button>
                </div>
            </main>
        </AuthGuard>
    );
}
