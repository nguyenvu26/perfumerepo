import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n';
import { ThemeProvider } from '@/components/common/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { beVietnamPro } from '@/lib/fonts';
import { Metadata } from 'next';
import { ScentDNAInitializer } from '@/components/product/scent-dna-initializer';

export const metadata: Metadata = {
    title: {
        default: 'PerfumeGPT | Luxury Fragrance & AI Scent Consultant',
        template: '%s | PerfumeGPT'
    },
    description: 'Find your perfect signature scent with PerfumeGPT. Our AI-powered fragrance consultant analyzes your style to find the perfect luxury perfume.',
    keywords: [
        'perfume', 'fragrance', 'luxury perfume', 'AI fragrance consultant', 
        'scent recommendation', 'niche perfume', 'perfume shop', 'PerfumeGPT',
        'nước hoa', 'nước hoa cao cấp', 'tư vấn nước hoa AI', 'nước hoa chính hãng'
    ],
    metadataBase: new URL('https://perfumegpt.site'),
    alternates: {
        canonical: '/',
        languages: {
            'en-US': '/en',
            'vi-VN': '/vi',
        },
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'vi_VN',
        url: 'https://perfumegpt.site',
        siteName: 'PerfumeGPT',
        title: 'PerfumeGPT | Luxury Fragrance & AI Scent Consultant',
        description: 'Explore our curated collection of luxury fragrances and experience our AI Scent Consultant.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'PerfumeGPT Luxury Fragrance',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PerfumeGPT | Luxury Fragrance & AI Scent Consultant',
        description: 'Find your perfect scent with our AI Scent Consultant.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: '/logo-dark.png',
        shortcut: '/logo-dark.png',
        apple: '/logo-dark.png',
    },
};

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
                        <ScentDNAInitializer />
                        <Toaster />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
