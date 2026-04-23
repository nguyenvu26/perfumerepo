'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    LayoutDashboard,
    Users,
    User,
    LogOut,
    Package,
    MessageSquare,
    BrainCircuit,
    Heart,
    Coins,
    Tag,
    Smartphone,
    Receipt,
    Sparkles,
    Store,
    BookOpen,
    RotateCcw,
    X,
    Globe,
    ClipboardList,
    BarChart3,
    MoreHorizontal,
} from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';

type SidebarItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
};

type SidebarSection = {
    id: string;
    label: string;
    items: SidebarItem[];
};

export const Sidebar = ({
    onClose,
    onOpenMore,
    variant = 'default',
    isCollapsed = false,
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
    const { isModalOpen } = useUIStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const role = user?.role || 'CUSTOMER';
    const isDrawer = variant === 'drawer';
    const showExpandedContent = isDrawer || !isCollapsed;

    const publicItems: SidebarItem[] = [
        { icon: Globe, label: commonT('home'), href: '/' },
        { icon: Package, label: commonT('collection'), href: '/collection' },
    ];

    const sharedItems: SidebarItem[] = [
        { icon: LayoutDashboard, label: commonT('dashboard'), href: `/dashboard/${role.toLowerCase()}` },
        { icon: User, label: commonT('profile'), href: '/dashboard/profile' },
        { icon: MessageSquare, label: navT('shared.chat'), href: '/dashboard/chat' },
    ];

    const customerItems: SidebarItem[] = [
        { icon: Heart, label: commonT('favorites'), href: '/dashboard/customer/favorite' },
        { icon: ClipboardList, label: commonT('orders'), href: '/dashboard/customer/orders' },
        { icon: RotateCcw, label: navT('customer.returns'), href: '/dashboard/customer/returns' },
        { icon: Coins, label: navT('customer.loyalty'), href: '/dashboard/customer/loyalty' },
        { icon: Tag, label: navT('customer.promotions'), href: '/dashboard/customer/promotions' },
    ];

    const staffItems: SidebarItem[] = [
        { icon: Smartphone, label: navT('staff.pos'), href: '/dashboard/staff/pos' },
        { icon: Package, label: navT('staff.inventory'), href: '/dashboard/staff/inventory' },
        { icon: ClipboardList, label: navT('staff.orders'), href: '/dashboard/staff/orders' },
        { icon: RotateCcw, label: navT('staff.returns'), href: '/dashboard/staff/returns' },
        { icon: BarChart3, label: navT('staff.kpi'), href: '/dashboard/staff/kpi' },
    ];

    const adminItems: SidebarItem[] = [
        { icon: Users, label: navT('admin.users'), href: '/dashboard/admin/users' },
        { icon: Store, label: navT('admin.stores'), href: '/dashboard/admin/stores' },
        { icon: Package, label: navT('admin.products'), href: '/dashboard/admin/products' },
        { icon: MessageSquare, label: navT('admin.reviews'), href: '/dashboard/admin/reviews' },
        { icon: BookOpen, label: navT('admin.manage_journal'), href: '/dashboard/admin/manage-journal' },
        { icon: Tag, label: navT('admin.promotions'), href: '/dashboard/admin/marketing/promotions' },
        { icon: Receipt, label: commonT('orders'), href: '/dashboard/admin/orders' },
        { icon: RotateCcw, label: navT('admin.returns'), href: '/dashboard/admin/returns' },
        { icon: BrainCircuit, label: navT('admin.ai_logs'), href: '/dashboard/admin/ai-logs' },
        { icon: Sparkles, label: navT('admin.manage_banner'), href: '/dashboard/admin/manage-banner' },
    ];

    const sections: SidebarSection[] =
        role === 'ADMIN'
            ? [
                  { id: 'explore', label: commonT('home'), items: publicItems.filter((item) => item.href !== '/collection') },
                  { id: 'workspace', label: commonT('dashboard'), items: sharedItems },
                  { id: 'management', label: commonT('admin_dashboard'), items: adminItems },
              ]
            : role === 'STAFF'
              ? [
                    { id: 'explore', label: commonT('catalog'), items: publicItems },
                    { id: 'workspace', label: commonT('dashboard'), items: sharedItems },
                    { id: 'operations', label: commonT('staff_dashboard'), items: staffItems },
                ]
              : [
                    { id: 'explore', label: commonT('catalog'), items: publicItems },
                    { id: 'workspace', label: commonT('dashboard'), items: sharedItems },
                    { id: 'personal', label: commonT('my_profile'), items: customerItems },
                ];

    const flatItems = sections.flatMap((section) => section.items);

    const getIsActive = (href: string) => {
        const matchingItems = flatItems.filter(
            (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')),
        );

        const mostSpecificMatch =
            matchingItems.length > 0
                ? matchingItems.reduce((prev, current) => (current.href.length > prev.href.length ? current : prev))
                : null;

        return mostSpecificMatch?.href === href;
    };

    return (
        <>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-black/6 bg-[rgba(255,252,247,0.92)] backdrop-blur-3xl transition-all duration-500 dark:border-white/8 dark:bg-[rgba(14,15,17,0.94)] no-print',
                    isDrawer ? 'w-full border-none shadow-none' : 'hidden md:flex',
                    !isDrawer && (isCollapsed ? 'w-[88px]' : 'w-[88px] lg:w-[320px]'),
                )}
            >
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(197,160,89,0.18),transparent_68%)] pointer-events-none" />

                <Link
                    href="/"
                    className={cn(
                        'relative mt-6 flex items-center px-4 transition-all duration-500',
                        isDrawer ? 'justify-start px-8' : isCollapsed ? 'justify-center px-0' : 'justify-center lg:justify-start lg:px-6',
                    )}
                >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] border border-gold/20 bg-white/85 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)] dark:bg-white/[0.05]">
                        {mounted ? (
                            <img
                                src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'}
                                className="h-11 w-11 rounded-full object-contain"
                                alt="Perfume GPT"
                            />
                        ) : (
                            <div className="h-11 w-11 animate-pulse rounded-full bg-secondary/20" />
                        )}
                    </div>

                    {showExpandedContent && (
                        <div className={cn('ml-4 min-w-0', !isDrawer && 'hidden lg:block')}>
                            <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-gold/80">
                                Perfume GPT
                            </p>
                            <p className="truncate text-base font-semibold text-foreground">
                                {role === 'ADMIN'
                                    ? commonT('admin_dashboard')
                                    : role === 'STAFF'
                                      ? commonT('staff_dashboard')
                                      : commonT('dashboard')}
                            </p>
                        </div>
                    )}
                </Link>

                {isDrawer && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gold transition-all hover:bg-gold/10"
                        aria-label="Close Sidebar"
                    >
                        <X size={22} />
                    </button>
                )}

                <div className="mt-8 flex-1 space-y-6 px-3 lg:px-4">
                    {sections.map((section) => (
                        <div key={section.id} className="space-y-2">
                            {showExpandedContent && (
                                <div className={cn('px-3 pb-1', !isDrawer && 'hidden lg:block')}>
                                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                                        {section.label}
                                    </p>
                                </div>
                            )}

                            {section.items.map((item) => {
                                const isActive = getIsActive(item.href);

                                return (
                                    <div key={item.href} className="group/item relative">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'group flex min-h-[58px] items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300',
                                                isActive
                                                    ? 'bg-gold text-luxury-black shadow-[0_22px_44px_-24px_rgba(197,160,89,0.75)]'
                                                    : 'text-stone-600 hover:bg-white/85 hover:text-foreground dark:text-stone-300 dark:hover:bg-white/[0.06]',
                                                isDrawer ? 'px-6' : isCollapsed ? 'justify-center px-0' : '',
                                            )}
                                            onClick={() => {
                                                if (onClose) onClose();
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                                                    isActive
                                                        ? 'border-black/8 bg-white/55 text-luxury-black'
                                                        : 'border-black/6 bg-white/85 text-gold dark:border-white/10 dark:bg-white/[0.05]',
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                            </div>

                                            <span
                                                className={cn(
                                                    'truncate text-sm font-medium leading-6 transition-all lg:text-[15px]',
                                                    isDrawer ? 'block' : isCollapsed ? 'hidden' : 'hidden lg:block',
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </Link>

                                        {!isDrawer && isCollapsed && (
                                            <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[100] -translate-y-1/2 translate-x-[-8px] whitespace-nowrap rounded-xl border border-white/10 bg-black/90 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-300 group-hover/item:translate-x-0 group-hover/item:opacity-100">
                                                {item.label}
                                                <div className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-black/90" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="mt-auto border-t border-black/6 px-4 py-6 dark:border-white/8">
                    <div className="rounded-[1.5rem] border border-black/6 bg-white/85 p-4 shadow-[0_18px_32px_-24px_rgba(15,23,42,0.45)] dark:border-white/8 dark:bg-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-sm font-semibold text-gold">
                                {user?.name?.substring(0, 2) || 'AI'}
                            </div>

                            {showExpandedContent && (
                                <div className={cn('min-w-0 flex-1', !isDrawer && 'hidden lg:block')}>
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {user?.name || tUser('explorer')}
                                    </p>
                                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                                        {role === 'ADMIN'
                                            ? commonT('admin_dashboard')
                                            : role === 'STAFF'
                                              ? commonT('staff_dashboard')
                                              : commonT('member')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div
                            className={cn(
                                'mt-4 flex items-center justify-between gap-3',
                                !showExpandedContent && !isDrawer ? 'flex-col' : '',
                            )}
                        >
                            {!isDrawer && <ThemeToggle />}
                            <button
                                onClick={logout}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-black/8 px-3 text-stone-500 transition-all hover:border-gold hover:text-gold dark:border-white/10 dark:text-stone-300"
                                title={commonT('logout')}
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {role === 'CUSTOMER' && !isDrawer && (
                <nav
                    className={cn(
                        'md:hidden fixed bottom-5 left-4 right-4 z-[100] flex h-[84px] items-center justify-around rounded-[2rem] border border-white/10 bg-[rgba(15,15,17,0.92)] px-2 shadow-2xl backdrop-blur-2xl transition-all duration-500',
                        isModalOpen ? 'pointer-events-none translate-y-32 opacity-0' : 'translate-y-0 opacity-100',
                    )}
                >
                    {flatItems.slice(0, 4).map((item) => {
                        const isActive = getIsActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex min-h-[64px] min-w-[54px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 transition-all',
                                    isActive ? 'text-gold' : 'text-white/55',
                                )}
                            >
                                <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                                <span className="max-w-[68px] truncate text-[11px] font-medium leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={onOpenMore}
                        className="flex min-h-[64px] min-w-[54px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-white/55 transition-colors hover:text-gold"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[11px] font-medium leading-none">{commonT('more') || 'More'}</span>
                    </button>
                </nav>
            )}
        </>
    );
};
