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
        {},
        { name: t('about'), href: '/story' },
        { name: t('journal'), href: '/journal' },
    ];

    const role = user?.role || 'CUSTOMER';
    const isAdmin = role === 'ADMIN';
    const isStaff = role === 'STAFF';

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 no-print",
                    isScrolled 
                        ? "py-3 bg-background/90 backdrop-blur-2xl border-b border-border shadow-lg" 
                        : "py-6 bg-transparent border-b border-white/5"
                )}
            >
                <div className="container-responsive">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                        {/* Left */}
                        <div className="hidden lg:flex items-center gap-10 justify-start">
                            {menuLeft.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "text-[10px] font-bold tracking-[.3em] uppercase transition-all cursor-pointer relative group",
                                        pathname === item.href
                                            ? "text-gold"
                                            : "text-foreground hover:text-gold"
                                    )}
                                >
                                    {item.name}
                                    <span className={cn(
                                        "absolute -bottom-1 left-0 h-px bg-gold transition-all duration-500",
                                        pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                                    )} />
                                </Link>
                            ))}
                        </div>

                        {/* Center Logo (always centered) */}
                        <div className="flex items-center justify-center">
                            <Link
                                href="/"
                                className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-serif text-[10px] tracking-[0.4em] font-bold uppercase shadow-sm hover:shadow-md transition-shadow"
                                aria-label="Perfume GPT Home"
                            >
                                <img src="/logo-light.png" className="h-10 w-10 object-contain rounded-full border border-gold/10 shadow-sm" alt="Perfume GPT" />
                            </Link>
                        </div>

                        {/* Right (menu + actions) */}
                        <div className="flex items-center justify-end gap-6">
                            <div className="hidden lg:flex items-center gap-10">
                                {menuRight.filter(item => item.href).map((item) => (
                                    <Link
                                        key={item.href!}
                                        href={item.href!}
                                        className={cn(
                                            "text-[10px] font-bold tracking-[.3em] uppercase transition-all cursor-pointer relative group",
                                            pathname === item.href
                                                ? "text-gold"
                                                : "text-foreground hover:text-gold"
                                        )}
                                    >
                                        {item.name}
                                        <span className={cn(
                                            "absolute -bottom-1 left-0 h-px bg-gold transition-all duration-500",
                                            pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                                        )} />
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-1 md:gap-2">
                                <Link
                                    href={isAuthenticated ? '/notifications' : '/login'}
                                    className="hidden md:flex p-2 text-foreground hover:text-gold transition-colors cursor-pointer relative"
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
                                    className="p-2 text-foreground hover:text-gold transition-colors relative cursor-pointer"
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
                                    <div className="flex items-center gap-1 md:gap-4 pl-1 md:pl-4 border-l border-border transition-colors ml-1 md:ml-2">
                                        <Link
                                            href="/dashboard/profile"
                                            className="hidden md:flex flex-col items-end group"
                                        >
                                            <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">
                                                {user?.name?.split(' ')[0] || t('member')}
                                            </span>
                                            <span className="text-[8px] text-gold font-bold uppercase tracking-tighter opacity-100">
                                                {t('view_profile')}
                                            </span>
                                        </Link>
                                        <button
                                            onClick={() => logout()}
                                            className="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                                            title={t('logout')}
                                        >
                                            <LogOut size={18} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="ml-1 md:ml-4 px-3 md:px-5 py-1.5 md:py-1.5 border border-border rounded-full text-[10px] md:text-[11px] font-bold tracking-[.1em] md:tracking-[.2em] uppercase text-foreground hover:bg-foreground hover:text-background dark:hover:bg-foreground dark:hover:text-background transition-all shadow-sm flex items-center justify-center min-w-[32px]"
                                    >
                                        <span className="hidden sm:inline">{t('login')}</span>
                                        <UserCircle className="sm:hidden" size={20} strokeWidth={1.5} />
                                    </Link>
                                )}

                                <button
                                    className="lg:hidden p-3 text-foreground cursor-pointer ml-1 -mr-2 flex items-center justify-center min-w-[44px] min-h-[44px]"
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
