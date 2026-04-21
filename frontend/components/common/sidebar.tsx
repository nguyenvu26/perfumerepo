'use client';

import { useTranslations } from 'next-intl';
import {
    LayoutDashboard, Users, User, Settings, LogOut, Package,
    MessageSquare, BrainCircuit, Heart, History, Coins, Tag,
    Monitor, Box, ClipboardList, BarChart3, ShieldCheck,
    Globe, Mail, FileText, Settings2, Smartphone, Receipt, FolderTree,
    Sparkles, Zap, Store, Warehouse, BookOpen, RotateCcw, X
} from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitch } from './language-switch';
import { MoreHorizontal } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export const Sidebar = ({ 
    onClose, 
    onOpenMore, 
    variant = 'default',
    isCollapsed = false
}: { 
    onClose?: () => void; 
    onOpenMore?: () => void; 
    variant?: 'default' | 'drawer'; 
    isCollapsed?: boolean;
}) => {
    const commonT = useTranslations('common');
    const navT = useTranslations('navigation');
    const tUser = useTranslations('dashboard.user');
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { isModalOpen } = useUIStore();
    const role = user?.role || 'customer';
    const isDrawer = variant === 'drawer';

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
            // { icon: Warehouse, label: navT('admin.stock'), href: '/dashboard/admin/stores/stock' },
            { icon: Package, label: navT('admin.products'), href: '/dashboard/admin/products' },
            // { icon: FolderTree, label: navT('admin.catalog'), href: '/dashboard/admin/catalog' },
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
        <>
            {/* Desktop & Tablet Sidebar */}
            <aside className={cn(
                "h-screen bg-white/95 dark:bg-background/20 backdrop-blur-3xl border-r border-border flex flex-col transition-all duration-500 fixed left-0 top-0 z-50 overflow-y-auto custom-scrollbar no-print",
                isDrawer ? "w-full border-none shadow-none" : "hidden md:flex", 
                !isDrawer && (isCollapsed ? "w-20" : "w-20 lg:w-72")
            )}>
                <Link href="/" className={cn(
                    "flex items-center mb-10 mt-8 px-4 group cursor-pointer shrink-0 transition-all duration-500",
                    isDrawer ? "justify-start px-8" : (isCollapsed ? "justify-center px-0 lg:px-0" : "justify-center lg:justify-start lg:px-8")
                )}>
                    <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                        {mounted && (
                            <img 
                                src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
                                className="w-full h-full object-contain rounded-full border border-gold/10 shadow-lg group-hover:scale-110 transition-transform" 
                                alt="Perfume GPT" 
                            />
                        )}
                        {!mounted && <div className="w-full h-full rounded-full bg-secondary/20 animate-pulse" />}
                    </div>
                    {(isDrawer || (!isCollapsed)) && (
                        <span className={cn(
                            "ml-4 font-heading text-lg gold-gradient uppercase tracking-widest font-black transition-all duration-500",
                            isDrawer ? "block" : "hidden lg:block whitespace-nowrap"
                        )}>
                            Perfume GPT
                        </span>
                    )}
                </Link>
                
                {/* Close button for drawer variant */}
                {isDrawer && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-3 text-gold hover:bg-gold/10 rounded-full transition-all z-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Close Sidebar"
                    >
                        <X size={24} />
                    </button>
                )}

                <nav className="flex-1 space-y-2 px-3 lg:px-4">
                    {items.map((item, index) => {
                        const matchingItems = items.filter(i =>
                            pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/'))
                        );

                        const mostSpecificMatch = matchingItems.length > 0
                            ? matchingItems.reduce((prev, current) =>
                                current.href.length > prev.href.length ? current : prev
                            )
                            : null;

                        const isActive = mostSpecificMatch?.href === item.href;

                        return (
                            <div key={item.href} className="relative group/item">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 px-3 lg:px-4 py-4 lg:py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "bg-gold text-primary-foreground shadow-lg shadow-gold/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-white/5",
                                        isDrawer ? "px-6" : (isCollapsed ? "justify-center lg:px-0" : "")
                                    )}
                                    onClick={() => {
                                        if (onClose) onClose();
                                    }}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                                        isActive ? "text-primary-foreground" : "text-gold"
                                    )} />
                                    <span className={cn(
                                        "font-heading text-[10px] lg:text-[11px] uppercase tracking-[0.2em] font-medium truncate transition-all duration-300",
                                        isDrawer ? "block text-sm sm:text-base" : (isCollapsed ? "hidden" : "hidden lg:block")
                                    )}>
                                        {item.label}
                                    </span>
                                    {isActive && !isDrawer && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 w-1 h-5 bg-primary-foreground rounded-full lg:hidden"
                                        />
                                    )}
                                </Link>
                                
                                {/* Tooltip (collapsed state only) */}
                                {!isDrawer && (
                                    <div className={cn(
                                        "absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/90 text-white text-[10px] uppercase tracking-widest font-bold border border-white/10 rounded-lg whitespace-nowrap opacity-0 translate-x-[-10px] pointer-events-none group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 z-[100] shadow-xl backdrop-blur-md",
                                        isCollapsed ? "block" : "lg:hidden"
                                    )}>
                                        {item.label}
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-l border-b border-white/10" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                <div className="mt-auto px-3 lg:px-6 py-8 border-t border-border space-y-6 shrink-0">
                    <div className="px-2 lg:px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-gold/10 flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white dark:bg-secondary flex items-center justify-center text-[10px] font-heading border border-gold/5 uppercase shrink-0">
                            {user?.name?.substring(0, 2) || 'AI'}
                        </div>
                        <div className={cn(
                            "flex-1 overflow-hidden transition-all duration-300",
                            isDrawer ? "block" : (isCollapsed ? "hidden" : "hidden lg:block")
                        )}>
                            <p className="text-xs font-heading text-foreground truncate uppercase tracking-tighter">
                                {user?.name || tUser('explorer')}
                            </p>
                        </div>
                    </div>

                    <div className={cn(
                        "flex items-center justify-center gap-4",
                        isDrawer ? "flex-row justify-between px-4" : "flex-col lg:flex-row"
                    )}>
                        {!isDrawer && <ThemeToggle />}
                        <button
                            onClick={logout}
                            className="p-3 text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all rounded-xl group"
                            title={commonT('logout')}
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation (For Customers only) */}
            {role === 'CUSTOMER' && !isDrawer && (
                <nav className={cn(
                    "md:hidden fixed bottom-6 left-6 right-6 h-20 glass-dark backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-2 z-[100] shadow-2xl transition-all duration-500",
                    isModalOpen ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
                )}>
                    {items.slice(0, 4).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 min-w-[50px] min-h-[64px] transition-all",
                                    isActive ? "text-gold" : "text-white/40"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform",
                                    isActive && "scale-110 shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                                )} />
                                <span className="text-[7px] font-bold uppercase tracking-[0.1em] truncate max-w-[60px]">
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="w-1 h-1 rounded-full bg-gold mt-0.5"
                                    />
                                )}
                            </Link>
                        );
                    })}
                    {/* "More" Trigger for the rest of items */}
                    <button
                        onClick={onOpenMore}
                        className="flex flex-col items-center justify-center gap-1 min-w-[50px] min-h-[64px] text-white/40 hover:text-gold transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[7px] font-bold uppercase tracking-[0.1em]">
                            {commonT('more') || 'More'}
                        </span>
                    </button>
                </nav>
            )}
        </>
    );
};
