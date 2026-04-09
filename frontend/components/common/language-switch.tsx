'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export const LanguageSwitch = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = React.useState(false);
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) {
        return <div className="w-[120px] h-[34px]" />;
    }

    const toggleLocale = () => {
        const nextLocale = locale === 'en' ? 'vi' : 'en';
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 dark:border-white/10 hover:border-gold transition-all bg-white/5 hover:bg-gold/5 group ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Switch language"
        >
            <Languages className="w-3.5 h-3.5 text-stone-400 group-hover:text-gold transition-colors" />
            <span className="text-[9px] uppercase font-bold tracking-[.2em] text-luxury-black dark:text-zinc-400 group-hover:text-gold transition-colors">
                {locale === 'en' ? 'EN' : 'VI'}
            </span>
        </button>
    );
};
