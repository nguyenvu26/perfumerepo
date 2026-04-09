'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Globe, Shield, Bell, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminSettings() {
    const t = useTranslations('dashboard.admin.settings');

    return (
        <AuthGuard allowedRoles={['admin']}>
            <main className="p-8">
                <header className="mb-12">
                    <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">{t('subtitle')}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    {[
                        { title: t('sections.localization.title'), desc: t('sections.localization.desc'), icon: Globe },
                        { title: t('sections.security.title'), desc: t('sections.security.desc'), icon: Shield },
                        { title: t('sections.notifications.title'), desc: t('sections.notifications.desc'), icon: Bell },
                        { title: t('sections.data.title'), desc: t('sections.data.desc'), icon: Database },
                    ].map((setting, i) => (
                        <div key={i} className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all cursor-pointer group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                                    <setting.icon className="w-6 h-6 text-gold" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-foreground uppercase tracking-widest text-sm mb-1">{setting.title}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">{setting.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 max-w-4xl flex justify-between items-center text-muted-foreground">
                    <span className="text-[10px] uppercase font-heading tracking-widest">{t('footer.version', { version: '2.0.4-AI' })}</span>
                    <button className="text-[10px] uppercase font-heading tracking-widest text-gold hover:underline underline-offset-4">{t('footer.reload')}</button>
                </div>
            </main>
        </AuthGuard>
    );
}
