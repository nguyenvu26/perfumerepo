'use client';
 
import { AuthGuard } from '@/components/auth/auth-guard';
import { useTranslations } from 'next-intl';
import {
    BarChart3, TrendingUp, Users, Package, BrainCircuit,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
 
export default function AnalyticsPage() {
    const navT = useTranslations('navigation');
    const t = useTranslations('dashboard.admin.analytics');
 
    const stats = [
        { key: 'revenue', value: '$84,230', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-500' },
        { key: 'users', value: '4,284', change: '+8.2%', icon: Users, color: 'text-gold' },
        { key: 'acceptance', value: '94.2%', change: '-2.1%', icon: BrainCircuit, color: 'text-ai' },
        { key: 'inventory', value: '88%', change: '+0.5%', icon: Package, color: 'text-muted-foreground' },
    ];
 
    return (
        <AuthGuard allowedRoles= {['admin']}>
            <main className="p-8 pb-20">
                <header className="mb-12">
                    <div className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
                            {t('subtitle')}
                        </p>
                    </div>
                </header>
 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-secondary ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[9px] font-heading px-3 py-1.5 rounded-full glass border-border font-bold uppercase tracking-widest",
                                    stat.change.startsWith('+') ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading mb-2">{t(`stats.${stat.key}`)}</h3>
                            <p className="text-3xl font-heading text-foreground tracking-tighter">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>
 
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass p-10 rounded-[3rem] border-border relative overflow-hidden group">
                        <h3 className="text-lg font-heading mb-12 uppercase tracking-[0.2em] flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-gold" />
                            {t('performance.title')}
                        </h3>
                        <div className="overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="h-[300px] min-w-[600px] w-full border-b border-l border-border relative flex items-end justify-between px-8">
                                {[60, 45, 75, 50, 90, 65, 80, 55, 70, 40, 85, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.05, ease: "circOut" }}
                                        className="w-8 sm:w-10 group/bar relative"
                                    >
                                        <div className="h-full w-full bg-gradient-to-t from-gold/40 to-gold rounded-t-xl group-hover/bar:brightness-125 transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)]" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
 
                    <div className="glass p-10 rounded-[3rem] border-border bg-background/40">
                        <h3 className="text-lg font-heading mb-8 uppercase tracking-[0.2em]">{t('feed.title')}</h3>
                        <div className="space-y-6">
                            {[4932, 2819, 1042, 3812].map(id => (
                                <div key={id} className="flex gap-4 items-start pb-6 border-b border-border last:border-0 border-dashed">
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border group hover:bg-gold transition-colors">
                                        <BrainCircuit className="w-4 h-4 text-gold group-hover:text-primary-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-body text-foreground leading-relaxed uppercase tracking-tight">
                                            <span className="text-gold font-bold uppercase mr-1">{t('feed.event_label')}</span>
                                            {t('feed.sync_complete', { id })}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-[.2em] font-heading font-medium">{t('feed.active_now')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </AuthGuard>
    );
}
