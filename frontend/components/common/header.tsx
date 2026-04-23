'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    ShoppingBag,
    Bell,
    Menu,
    X,
    ChevronRight,
    LogOut,
    Globe,
    LayoutDashboard,
    ShieldCheck,
    UserCircle
} from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitch } from './language-switch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { cartService } from '@/services/cart.service';
import { notificationService } from '@/services/notification.service';
import { getNotificationSocket } from '@/lib/socket';
import { BrandMegaMenu } from './brand-mega-menu';

export const Header = () => {
    const t = useTranslations('common');
    const tNav = useTranslations('navigation');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated, user, logout } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setCartCount(0);
            setUnreadCount(0);
            return;
        }

        let mounted = true;

        const syncCartCount = async () => {
            try {
                const cart = await cartService.getCart();
                const count = (cart.items ?? []).reduce((acc, item) => acc + (item.quantity || 0), 0);
                if (mounted) setCartCount(count);
            } catch {
                if (mounted) setCartCount(0);
            }
        };

        const syncUnreadCount = async () => {
            try {
                const count = await notificationService.getUnreadCount();
                if (mounted) setUnreadCount(count);
            } catch {
                if (mounted) setUnreadCount(0);
            }
        };

        void syncCartCount();
        void syncUnreadCount();

        // Socket logic for real-time notifications
        const socket = getNotificationSocket();
        const notificationHandler = () => {
            void syncUnreadCount();
        };
        socket.on('notification', notificationHandler);
        socket.on('unread-count', (count: number) => {
           if (mounted) setUnreadCount(count);
        });

        window.addEventListener(cartService.eventName, syncCartCount);
        // We'll trigger this custom event when a new notification arrives via socket
        window.addEventListener('notification-update', syncUnreadCount);

        return () => {
            mounted = false;
            socket.off('notification', notificationHandler);
            socket.off('unread-count');
            window.removeEventListener(cartService.eventName, syncCartCount);
            window.removeEventListener('notification-update', syncUnreadCount);
        };
    }, [isAuthenticated]);

    const menuLeft = [
        { name: t('home'), href: '/' },
        { name: t('collection'), href: '/collection' },
        { name: t('boutiques'), href: '/boutiques' },
        { name: tNav('customer.quiz'), href: '/quiz' },
    ];

    const menuRight = [
        { name: t('about'), href: '/story' },
        { name: t('journal'), href: '/journal' },
    ];

    const role = user?.role || 'CUSTOMER';
    const isAdmin = role === 'ADMIN';
    const isStaff = role === 'STAFF';
    const navItemClass = (isActive: boolean) =>
        cn(
            "rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer relative group",
            isActive
                ? "bg-[linear-gradient(135deg,rgba(197,160,89,0.18),rgba(197,160,89,0.08))] text-gold shadow-[0_14px_30px_-24px_rgba(197,160,89,0.95)] ring-1 ring-gold/20"
                : isScrolled
                    ? "text-foreground/88 hover:-translate-y-[1px] hover:bg-black/4 hover:text-gold dark:text-white/88 dark:hover:bg-white/6"
                    : "text-white/92 hover:-translate-y-[1px] hover:bg-white/10 hover:text-gold"
        );
    const iconButtonClass = cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:border-gold hover:text-gold",
        isScrolled
            ? "border-black/6 bg-white/70 text-foreground dark:border-white/10 dark:bg-white/5"
            : "border-white/14 bg-white/10 text-white"
    );
    const profilePanelClass = cn(
        "hidden md:flex flex-col items-end rounded-[1.2rem] px-3 py-2 transition-colors",
        isScrolled
            ? "hover:bg-black/4 dark:hover:bg-white/6"
            : "hover:bg-white/10"
    );
    const profileNameClass = isScrolled ? "text-xs font-semibold text-foreground dark:text-white" : "text-xs font-semibold text-white";
    const authDividerClass = isScrolled ? "border-l border-border/70" : "border-l border-white/12";
    const loginButtonClass = cn(
        "ml-1 flex min-w-[44px] items-center justify-center rounded-full border px-4 py-2.5 text-xs font-semibold shadow-sm transition-all hover:border-gold hover:bg-gold hover:text-luxury-black md:ml-4 md:px-5",
        isScrolled
            ? "border-black/8 bg-white/78 text-foreground dark:border-white/10 dark:bg-white/6 dark:text-white"
            : "border-white/14 bg-white/10 text-white"
    );
    const mobileMenuButtonClass = cn(
        "ml-1 -mr-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border cursor-pointer transition-all lg:hidden",
        isScrolled
            ? "border-black/8 bg-white/70 text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white"
            : "border-white/14 bg-white/10 text-white"
    );
    const logoutButtonClass = cn(
        "flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:border-red-200 hover:text-red-500",
        isScrolled
            ? "border-black/6 bg-white/70 text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
            : "border-white/14 bg-white/10 text-white/78"
    );

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 no-print",
                    isScrolled 
                        ? "py-3 bg-transparent" 
                        : "py-5 bg-transparent"
                )}
            >
                <div className="mx-auto w-full max-w-[1540px] px-2 sm:px-3 lg:px-4">
                    <div
                        className={cn(
                            "grid grid-cols-[1fr_auto_1fr] items-center rounded-full border px-4 py-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] transition-all duration-500 lg:px-7 lg:py-4",
                            isScrolled
                                ? "border-black/8 bg-background/84 backdrop-blur-2xl dark:border-white/10"
                                : "border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.56),rgba(9,9,11,0.3))] backdrop-blur-xl"
                        )}
                    >
                        <div className="hidden lg:flex items-center gap-2 justify-start">
                            {menuLeft.map((item) => {
                                const isBoutiques = item.href === '/boutiques';
                                return isBoutiques ? (
                                    <div key={item.href} className="group/mega relative flex items-center">
                                        <Link
                                            href={item.href}
                                            className={navItemClass(pathname === item.href)}
                                        >
                                            {item.name}
                                        </Link>
                                        <div className="absolute top-[calc(100%+24px)] left-0 opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-300 translate-y-4 group-hover/mega:translate-y-0 before:absolute before:-top-8 before:left-0 before:w-full before:h-8">
                                            <BrandMegaMenu />
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={navItemClass(pathname === item.href)}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Center Logo (always centered) */}
                        <div className="flex items-center justify-center">
                            <Link
                                href="/"
                                className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,238,225,0.88))] text-background shadow-[0_20px_38px_-24px_rgba(197,160,89,0.7)] transition-all hover:scale-[1.02] hover:shadow-[0_24px_44px_-24px_rgba(197,160,89,0.9)]"
                                aria-label="Perfume GPT Home"
                            >
                                <img src="/logo-light.png" className="h-11 w-11 object-contain rounded-full border border-gold/10 shadow-sm" alt="Perfume GPT" />
                            </Link>
                        </div>

                        {/* Right (menu + actions) */}
                        <div className="flex items-center justify-end gap-3 lg:gap-4">
                            <div className="hidden lg:flex items-center gap-2">
                                {menuRight.filter(item => item.href).map((item) => (
                                    <Link
                                        key={item.href!}
                                        href={item.href!}
                                        className={navItemClass(pathname === item.href)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-2">
                                <Link
                                    href={isAuthenticated ? '/notifications' : '/login'}
                                    className={cn("hidden md:flex", iconButtonClass)}
                                    title={('notifications')}
                                >
                                    <Bell size={20} strokeWidth={1.5} />
                                    {unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-0 right-0 w-4 h-4 bg-gold text-white text-[8px] flex items-center justify-center rounded-full shadow-lg font-bold"
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </motion.span>
                                    )}
                                </Link>

                                <div className="hidden md:block">
                                    <ThemeToggle />
                                </div>
                                {/* <LanguageSwitch /> */}

                                <Link
                                    href="/cart"
                                    className={iconButtonClass}
                                >
                                    <ShoppingBag size={20} strokeWidth={1.5} />
                                    {cartCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-0 right-0 w-4 h-4 bg-gold text-white text-[8px] flex items-center justify-center rounded-full shadow-lg font-bold"
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </Link>

                                {isAuthenticated ? (
                                    <div className={cn("ml-1 flex items-center gap-2 pl-3 transition-colors md:ml-2 md:gap-4 md:pl-4", authDividerClass)}>
                                        <Link
                                            href="/dashboard/profile"
                                            className={profilePanelClass}
                                        >
                                            <span className={profileNameClass}>
                                                {user?.name?.split(' ')[0] || t('member')}
                                            </span>
                                            <span className="text-[11px] text-gold font-medium">
                                                {t('view_profile')}
                                            </span>
                                        </Link>
                                        <button
                                            onClick={() => logout()}
                                            className={logoutButtonClass}
                                            title={t('logout')}
                                        >
                                            <LogOut size={18} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className={loginButtonClass}
                                    >
                                        <span className="hidden sm:inline">{t('login')}</span>
                                        <UserCircle className="sm:hidden" size={20} strokeWidth={1.5} />
                                    </Link>
                                )}

                                <button
                                    className={mobileMenuButtonClass}
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
                                >
                                    <motion.div
                                        animate={isMobileMenuOpen ? "open" : "closed"}
                                        className="relative w-6 h-6 flex items-center justify-center"
                                    >
                                        <motion.span
                                            variants={{
                                                closed: { rotate: 0, y: -6 },
                                                open: { rotate: 45, y: 0 }
                                            }}
                                            className="absolute w-6 h-0.5 bg-current rounded-full"
                                        />
                                        <motion.span
                                            variants={{
                                                closed: { opacity: 1 },
                                                open: { opacity: 0 }
                                            }}
                                            className="absolute w-6 h-0.5 bg-current rounded-full"
                                        />
                                        <motion.span
                                            variants={{
                                                closed: { rotate: 0, y: 6 },
                                                open: { rotate: -45, y: 0 }
                                            }}
                                            className="absolute w-6 h-0.5 bg-current rounded-full"
                                        />
                                    </motion.div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-full left-0 right-0 bg-background border-b border-border p-8 flex flex-col gap-6 lg:hidden shadow-2xl transition-colors"
                        >
                            {isAuthenticated && (
                                <Link
                                    href="/notifications"
                                    className="text-[10px] font-bold tracking-[.3em] uppercase text-luxury-black dark:text-white hover:text-gold transition-colors flex items-center justify-between group py-5 px-2 border-b border-border/10 min-h-[48px]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-3">
                                        {t('notifications')}
                                        {unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-gold text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-gold" />
                                </Link>
                            )}

                            {[...menuLeft, ...menuRight].filter(item => item.href).map((item) => (
                                <Link
                                    key={item.href!}
                                    href={item.href!}
                                    className="text-[10px] font-bold tracking-[.3em] uppercase text-luxury-black dark:text-white hover:text-gold transition-colors flex items-center justify-between group py-5 px-2 border-b border-border/10 min-h-[48px]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-gold" />
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <Link
                                    href="/login"
                                    className="mt-4 px-8 py-4 bg-luxury-black dark:bg-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase text-center shadow-xl"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('login')} / {t('register')}
                                </Link>
                            )}

                            {/* Mobile Language Switch & Theme Toggle */}
                            <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-white/10">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">{t('settings')}</span>
                                <div className="flex items-center gap-4">
                                    {/* <LanguageSwitch /> */}
                                    <ThemeToggle />
                                </div>
                            </div>
                            {isAuthenticated && (
                                <>
                                    {isAdmin && (
                                        <Link
                                            href="/dashboard/admin"
                                            className="text-xs font-bold tracking-[.3em] uppercase text-gold hover:text-gold/80 transition-colors flex items-center justify-between group pt-4 border-t border-stone-100 dark:border-white/10"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {t('admin_dashboard')}
                                            <ChevronRight size={14} />
                                        </Link>
                                    )}
                                    {isStaff && !isAdmin && (
                                        <Link
                                            href="/dashboard/staff"
                                            className="text-xs font-bold tracking-[.3em] uppercase text-gold hover:text-gold/80 transition-colors flex items-center justify-between group pt-4 border-t border-stone-100 dark:border-white/10"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {t('staff_dashboard')}
                                            <ChevronRight size={14} />
                                        </Link>
                                    )}
                                    <Link
                                        href="/dashboard/profile"
                                        className="text-xs font-bold tracking-[.3em] uppercase text-luxury-black dark:text-white hover:text-gold transition-colors flex items-center justify-between group pt-4 border-t border-stone-100 dark:border-white/10"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {user?.name || t('my_profile')}
                                        <ChevronRight size={14} />
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-xs font-bold tracking-[.3em] uppercase text-red-500 hover:text-red-600 transition-colors flex items-center justify-between group"
                                    >
                                        {t('logout')}
                                        <LogOut size={14} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};
