'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
    Users, Plus, Search, Package, TrendingUp, ArrowUpRight, 
    History, Database, Percent, Star, Sparkles, BrainCircuit
} from 'lucide-react';
import { Link } from '@/lib/i18n';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AdminDashboard() {
    const t = useTranslations('dashboard.admin');
    const tDash = useTranslations('admin_dashboard_page');

    return (
        <AuthGuard allowedRoles={['admin']}>
            <div className="flex flex-col gap-10 py-10 px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <header>
                        <h1 className="text-4xl md:text-5xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
                            {t('home.title')}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold">
                            {t('home.subtitle')}
                        </p>
                    </header>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <input
                                type="text"
                                placeholder={t('home.search_placeholder')}
                                className="glass bg-background/50 border border-border rounded-2xl py-3 pl-12 pr-6 text-xs outline-none focus:border-gold transition-all w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { key: "revenue", value: tDash('stats.revenue_val'), icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600", delay: 0.1 },
                        { key: "consultations", value: tDash('stats.consultations_val'), icon: Sparkles, color: "bg-gold/10 text-gold", delay: 0.2 },
                        { key: "members", value: tDash('stats.members_val'), icon: Users, color: "bg-blue-500/10 text-blue-600", delay: 0.3 },
                        { key: "delivery", value: tDash('stats.delivery_val'), icon: History, color: "bg-secondary text-muted-foreground", delay: 0.4 }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: stat.delay }}
                            className="glass bg-background/40 p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="p-2 border border-border rounded-full text-muted-foreground hover:text-gold cursor-pointer transition-colors">
                                    <ArrowUpRight size={14} />
                                </div>
                            </div>
                            <h3 className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{t(`home.stats.${stat.key}`)}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-heading text-foreground tracking-tighter">{stat.value}</span>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Management Consoles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[
                        { key: 'products', icon: Package, href: '/dashboard/admin/products' },
                        { key: 'catalog', icon: Database, href: '/dashboard/admin/catalog' },
                        { key: 'orders', icon: History, href: '/dashboard/admin/orders' },
                        { key: 'discounts', icon: Percent, href: '/dashboard/admin/marketing/promotions' },
                        { key: 'users', icon: Users, href: '/dashboard/admin/users' },
                        { key: 'reviews', icon: Star, href: '/dashboard/admin/reviews' },
                    ].map((mod, i) => (
                        <Link
                            key={i}
                            href={mod.href}
                            className="glass bg-background/40 rounded-[2.5rem] p-8 border border-border group hover:border-gold/30 hover:scale-[1.02] transition-all"
                        >
                            <div className="flex gap-6 items-center">
                                <div className="p-4 rounded-2xl bg-secondary group-hover:bg-gold group-hover:text-primary-foreground transition-all">
                                    <mod.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground group-hover:text-gold transition-colors">{t(`home.management.${mod.key}`)}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-0.5 opacity-50">{t(`home.management.${mod.key}_desc`)}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="glass bg-background/40 rounded-[3rem] border border-border overflow-hidden p-10">
                    <header className="flex justify-between items-center mb-10 border-b border-border pb-8">
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-5 h-5 text-gold" />
                            <h3 className="text-xl font-heading uppercase tracking-widest">{t('home.feed.title')}</h3>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest border border-gold/20 px-6 py-2.5 rounded-full hover:bg-gold hover:text-black transition-all">
                            {t('home.feed.cta')}
                        </button>
                    </header>

                    <div className="space-y-8">
                        {[4932, 2819, 1042].map(id => (
                            <div key={id} className="flex gap-6 items-start">
                                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border">
                                    <BrainCircuit className="w-4 h-4 text-gold" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground uppercase tracking-tight">
                                            {t('home.feed.sequence', { id })}
                                        </p>
                                        <span className="text-[12px] font-heading text-gold">{t('home.feed.match_score')}: 98%</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">{tDash('feed_active')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
