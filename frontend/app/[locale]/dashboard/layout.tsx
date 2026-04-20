'use client';

import { Sidebar } from '@/components/common/sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from '@/lib/i18n';
import { useLocale } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const locale = useLocale();
    const { user } = useAuth();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const role = user?.role || 'CUSTOMER';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

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
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <AuthGuard>
        <div className="flex min-h-screen bg-background transition-colors duration-500 overflow-hidden relative">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
            </div>

            <Sidebar 
                isCollapsed={isCollapsed} 
                onOpenMore={() => setIsMobileSidebarOpen(true)} 
            />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-[120] md:hidden shadow-2xl overflow-hidden"
                        >
                            <div className="h-full w-full overflow-y-auto custom-scrollbar p-0">
                                <div className="w-full flex h-full">
                                    <div className="w-full h-full [&>aside]:flex [&>aside]:w-full [&>aside]:md:hidden [&>aside]:border-none shadow-none">
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

            <div className={cn(
                "flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-500",
                "pl-0 md:pl-20",
                !isCollapsed && "lg:pl-72",
                role === 'CUSTOMER' ? "pb-32 md:pb-0" : "" 
            )}>
                <header className="h-20 border-b border-border/50 flex items-center justify-between px-4 md:px-8 bg-background/40 backdrop-blur-2xl sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Integrated Toggle (Always visible except possibly for Customers if they don't have a sidebar) */}
                        <button
                            onClick={toggleSidebar}
                            className="p-3 -ml-2 text-foreground hover:text-gold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-secondary/10 md:bg-transparent rounded-xl"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="h-10 px-3 md:px-5 rounded-2xl glass border-gold/10 flex items-center gap-2 md:gap-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer group hover:border-gold/30">
                            <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
                            <span className="text-[9px] md:text-[10px] uppercase font-heading tracking-[0.2em] font-medium truncate max-w-[150px] md:max-w-none">
                                {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="h-6 md:h-10 w-px bg-border/50 mx-1 md:mx-2" />
                        <ThemeToggle />
                    </div>
                </header>

                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-0"
                >
                    <div className="max-w-[1600px] mx-auto py-8 md:py-12">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
        </AuthGuard>
    );
}

