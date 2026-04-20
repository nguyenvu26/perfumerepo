'use client';

import { ChevronRight, Home } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
    const t = useTranslations('common.breadcrumbs');

    return (
        <nav 
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center w-full overflow-x-auto no-scrollbar py-2",
                className
            )}
        >
            <ol className="flex items-center gap-3 min-w-max">
                <li className="flex items-center">
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-heading text-muted-foreground hover:text-gold transition-colors min-h-[44px] px-2"
                        aria-label={t('home')}
                    >
                        <Home size={14} strokeWidth={1.5} />
                        <span className="hidden sm:inline">{t('home')}</span>
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        {item.href && !item.active ? (
                            <Link 
                                href={item.href}
                                className="text-[10px] uppercase tracking-widest font-heading text-muted-foreground hover:text-gold transition-colors min-h-[44px] px-2 flex items-center"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span 
                                className={cn(
                                    "text-[10px] uppercase tracking-widest font-heading px-2 min-h-[44px] flex items-center shrink-0",
                                    item.active ? "text-gold font-bold" : "text-muted-foreground"
                                )}
                                aria-current={item.active ? "page" : undefined}
                            >
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};
