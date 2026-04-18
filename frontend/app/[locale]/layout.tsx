import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n';
import { ThemeProvider } from '@/components/common/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { beVietnamPro } from '@/lib/fonts';

/**
 * Root Layout for Locale-based routes
 * Ensures lang={locale} is passed. Forced Be Vietnam Pro for Vietnamese stability.
 */
export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html
            lang={locale}
            suppressHydrationWarning
            className={beVietnamPro.variable}
        >
            <body 
                className="antialiased bg-white dark:bg-zinc-950 transition-colors duration-500 font-sans"
                style={{ 
                    fontFeatureSettings: "'liga' 1, 'calt' 1, 'kern' 1",
                    fontVariantLigatures: "common-ligatures"
                }}
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
