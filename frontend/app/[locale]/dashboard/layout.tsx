'use client';

import { Sidebar } from '@/components/common/sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from '@/lib/i18n';
import { useLocale } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const locale = useLocale();
    const { user } = useAuth();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { isSidebarCollapsed: isCollapsed, toggleSidebar: toggleUI } = useUIStore();

    const role = user?.role || 'CUSTOMER';

    const pathSegments = pathname.split('/').filter(Boolean);
    const currentSegment = pathSegments[pathSegments.length - 1];
    const formatSegment = (value?: string) => {
        if (!value || ['dashboard', role.toLowerCase()].includes(value.toLowerCase())) {
            return 'Dashboard';
        }

        return value
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    // Lock scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileSidebarOpen]);

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileSidebarOpen(true);
        } else {
            toggleUI();
        }
    };

    return (
        <AuthGuard>
            <div className="relative flex min-h-screen overflow-hidden bg-[#f6f1e8] text-foreground transition-colors duration-500 dark:bg-[#0b0c0d]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.66),rgba(246,241,232,0.95))] dark:bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.14),transparent_26%),linear-gradient(180deg,#101114,#0b0c0d)]" />
                    <div className="absolute right-[-6rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-[120px]" />
                    <div className="absolute bottom-[-10rem] left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-gold/10 blur-[120px]" />
                </div>

                <Sidebar
                    isCollapsed={isCollapsed}
                    onOpenMore={() => setIsMobileSidebarOpen(true)}
                />

                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 top-0 z-[120] w-[320px] overflow-hidden bg-background shadow-2xl md:hidden"
                            >
                                <div className="h-full w-full overflow-y-auto custom-scrollbar p-0">
                                    <div className="flex h-full w-full">
                                        <div className="h-full w-full [&>aside]:flex [&>aside]:w-full [&>aside]:md:hidden [&>aside]:border-none shadow-none">
                                            <Sidebar
                                                variant="drawer"
                                                onClose={() => setIsMobileSidebarOpen(false)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div
                    className={cn(
                        'relative z-10 flex min-w-0 flex-1 flex-col transition-all duration-500',
                        'pl-0 md:pl-[88px]',
                        !isCollapsed && 'lg:pl-[320px]',
                        role === 'CUSTOMER' ? 'pb-32 md:pb-0' : '',
                    )}
                >
                    <header className="sticky top-0 z-30 flex min-h-[92px] items-center justify-between border-b border-black/6 bg-white/70 px-4 backdrop-blur-2xl dark:border-white/8 dark:bg-[rgba(12,13,15,0.72)] md:px-8">
                        <div className="flex items-center gap-4 md:gap-6">
                            <button
                                onClick={toggleSidebar}
                                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-black/6 bg-white/85 text-foreground transition-colors hover:text-gold dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <Menu size={22} />
                            </button>

                            {/* Removed role and segment title as per user request */}


                            <div className="hidden min-h-[52px] items-center gap-3 rounded-[1.25rem] border border-gold/15 bg-white/80 px-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.4)] dark:bg-white/[0.04] md:flex">
                                <div className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_12px_rgba(197,160,89,0.55)]" />
                                <span className="text-sm font-medium text-stone-500 dark:text-stone-300">
                                    {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="mx-1 h-8 w-px bg-border/50 md:mx-2 md:h-10" />
                            <ThemeToggle />
                        </div>
                    </header>

                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="dashboard-shell flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:px-6 md:py-8"
                    >
                        <div className="mx-auto max-w-[1700px]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AuthGuard>
    );
}

