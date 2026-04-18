'use client';

import { useTranslations } from 'next-intl';
import {
    LayoutDashboard, Users, User, Settings, LogOut, Package,
    MessageSquare, BrainCircuit, Heart, History, Coins, Tag,
    Monitor, Box, ClipboardList, BarChart3, ShieldCheck,
    Globe, Mail, FileText, Settings2, Smartphone, Receipt, FolderTree,
    Sparkles, Zap, Store, Warehouse, BookOpen, RotateCcw
} from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitch } from './language-switch';

export const Sidebar = () => {
    const commonT = useTranslations('common');
    const navT = useTranslations('navigation');
    const tUser = useTranslations('dashboard.user');
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const role = user?.role || 'customer';

    const getMenuItems = () => {
        const publicPages = [
            { icon: Globe, label: commonT('home'), href: '/' },
            { icon: Package, label: commonT('collection'), href: '/collection' },
        ];

        const shared = [
            { icon: LayoutDashboard, label: commonT('dashboard'), href: `/dashboard/${role.toLowerCase()}` },
            { icon: User, label: commonT('profile'), href: '/dashboard/profile' },
            { icon: MessageSquare, label: navT('shared.chat'), href: '/dashboard/chat' },
        ];

        const customer = [

            { icon: Heart, label: commonT('favorites'), href: '/dashboard/customer/favorite' },
            { icon: ClipboardList, label: commonT('orders'), href: '/dashboard/customer/orders' },
            { icon: RotateCcw, label: navT('customer.returns'), href: '/dashboard/customer/returns' },
            { icon: Coins, label: navT('customer.loyalty'), href: '/dashboard/customer/loyalty' },
            { icon: Tag, label: navT('customer.promotions'), href: '/dashboard/customer/promotions' },
        ];

        const staff = [
            { icon: Smartphone, label: navT('staff.pos'), href: '/dashboard/staff/pos' },
            { icon: Box, label: navT('staff.inventory'), href: '/dashboard/staff/inventory' },
            { icon: ClipboardList, label: navT('staff.orders'), href: '/dashboard/staff/orders' },
            { icon: RotateCcw, label: navT('staff.returns'), href: '/dashboard/staff/returns' },
            { icon: BarChart3, label: navT('staff.kpi'), href: '/dashboard/staff/kpi' },
        ];

        const admin = [
            { icon: Users, label: navT('admin.users'), href: '/dashboard/admin/users' },
            // { icon: ShieldCheck, label: navT('admin.rbac'), href: '/dashboard/admin/rbac' },
            { icon: Store, label: navT('admin.stores'), href: '/dashboard/admin/stores' },
            { icon: Warehouse, label: navT('admin.stock'), href: '/dashboard/admin/stores/stock' },
            { icon: Package, label: navT('admin.products'), href: '/dashboard/admin/products' },
            { icon: FolderTree, label: navT('admin.catalog'), href: '/dashboard/admin/catalog' },
            { icon: MessageSquare, label: navT('admin.reviews'), href: '/dashboard/admin/reviews' },
            { icon: BookOpen, label: navT('admin.manage_journal'), href: '/dashboard/admin/manage-journal' },
            { icon: Tag, label: navT('admin.promotions'), href: '/dashboard/admin/marketing/promotions' },
            { icon: Receipt, label: commonT('orders'), href: '/dashboard/admin/orders' },
            { icon: RotateCcw, label: navT('admin.returns'), href: '/dashboard/admin/returns' },
            // { icon: BarChart3, label: navT('admin.analytics'), href: '/dashboard/admin/analytics' },
            // { icon: Mail, label: navT('admin.marketing'), href: '/dashboard/admin/marketing' },
            { icon: Sparkles, label: navT('admin.manage_banner'), href: '/dashboard/admin/manage-banner' },
            // { icon: Settings2, label: commonT('settings'), href: '/dashboard/admin/settings' },
        ];

        if (role === 'ADMIN') return [...publicPages.filter(p => p.href !== '/collection'), ...shared, ...admin];
        if (role === 'STAFF') return [...publicPages, ...shared, ...staff];
        return [...publicPages, ...shared, ...customer];
    };

    const items = getMenuItems();

    return (
        <aside className="w-72 h-screen glass border-r border-border flex flex-col px-4 py-8 fixed left-0 top-0 z-50 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <Link href="/" className="flex items-center justify-center mb-10 px-4 group cursor-pointer">
                <img src="/logo-dark.png" className="h-14 w-14 object-contain rounded-full border border-gold/10 shadow-lg group-hover:scale-110 transition-transform" alt="Perfume GPT" />
            </Link>

            <nav className="flex-1 space-y-1.5 px-0">
                {items.map((item, index) => {
                    // Find all items that match the current pathname
                    const matchingItems = items.filter(i =>
                        pathname === i.href || pathname.startsWith(i.href + '/')
                    );

                    // Get the most specific match (longest href)
                    const mostSpecificMatch = matchingItems.length > 0
                        ? matchingItems.reduce((prev, current) =>
                            current.href.length > prev.href.length ? current : prev
                        )
                        : null;

                    // Only this item is active if it's the most specific match
                    const isActive = mostSpecificMatch?.href === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden mx-1",
                                isActive
                                    ? "bg-gold text-primary-foreground shadow-lg shadow-gold/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                                isActive ? "text-primary-foreground" : "text-gold"
                            )} />
                            <span className="font-heading text-[11px] uppercase tracking-[0.2em] font-medium truncate">
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-5 bg-primary-foreground rounded-full"
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-8 pt-6 border-t border-border space-y-4">
                <div className="px-4 py-3 rounded-2xl glass border-gold/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-heading border border-white/5 uppercase">
                        {user?.name?.substring(0, 2) || 'AI'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-heading text-foreground truncate uppercase tracking-tighter">
                            {user?.name || tUser('explorer')}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest mt-0.5">
                            {tUser(role.toLowerCase())}
                        </p>
                    </div>
                </div>

                {/* Theme and Language Controls */}
                <div className="flex items-center justify-center gap-3 px-2">
                    <ThemeToggle />
                    {/* <LanguageSwitch /> */}
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-4 px-4 py-3.5 w-full text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all rounded-2xl font-heading text-[10px] uppercase tracking-[0.2em] group"
                >
                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    {commonT('logout')}
                </button>
            </div>
        </aside>
    );
};
