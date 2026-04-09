'use client';

import { Sidebar } from '@/components/common/sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { LanguageSwitch } from '@/components/common/language-switch';
import { motion } from 'framer-motion';
import { usePathname } from '@/lib/i18n';
import { useLocale } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const locale = useLocale();

    return (
        <AuthGuard>
        <div className="flex min-h-screen bg-background transition-colors duration-500 overflow-hidden relative">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-background/40 backdrop-blur-2xl sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="h-10 px-5 rounded-2xl glass border-gold/10 flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer group hover:border-gold/30">
                            <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
                            <span className="text-[10px] uppercase font-heading tracking-[0.2em] font-medium">
                                {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-px bg-border/50 mx-2" />
                        <ThemeToggle />
                        <LanguageSwitch />
                    </div>
                </header>

                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 overflow-y-auto custom-scrollbar"
                >
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
        </AuthGuard>
    );
}
