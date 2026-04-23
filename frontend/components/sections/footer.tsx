'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';

type FooterLinkItem = {
    label: string;
    href: string;
};

function FooterLinkGroup({
    title,
    items,
}: {
    title: string;
    items: FooterLinkItem[];
}) {
    return (
        <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d7c3a0]">
                {title}
            </p>

            <ul className="space-y-3.5">
                {items.map((item) => (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className="group inline-flex items-center text-sm text-[#f3eee2] transition-colors hover:text-[#d7c3a0]"
                        >
                            <span className="relative">
                                {item.label}
                                <span className="absolute left-0 top-full mt-1 h-px w-full origin-left scale-x-0 bg-[#d7c3a0] transition-transform duration-300 group-hover:scale-x-100" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const Footer = () => {
    const t = useTranslations('footer');

    const exploreLinks = [
        { label: t('navigation_labels.products'), href: '/collection' },
        { label: t('navigation_labels.consultation'), href: '/quiz' },
        { label: t('navigation_labels.journal'), href: '/journal' },
        { label: t('navigation_labels.boutiques'), href: '/boutiques' },
    ];

    const aboutLinks = [
        { label: t('support_labels.story'), href: '/story' },
        { label: t('support_labels.terms'), href: '/terms' },
        { label: t('support_labels.privacy'), href: '/privacy' },
    ];

    const socialLinks = [
        { label: 'Instagram', href: '#' },
        { label: 'Pinterest', href: '#' },
        { label: 'LinkedIn', href: '#' },
        { label: 'YouTube', href: '#' },
    ];

    return (
        <footer className="border-t border-white/6 bg-[#040404] text-[#f3eee2]">
            <div className="container-responsive py-16 sm:py-20 lg:py-24">
                <div className="grid gap-12 border-b border-white/6 pb-14 sm:gap-14 lg:grid-cols-[1.2fr_0.7fr_0.7fr_1fr] lg:pb-16">
                    <div className="max-w-md space-y-7">
                        <Link href="/" className="inline-block">
                            <h2 className="font-serif text-[2rem] font-semibold uppercase tracking-[0.12em] text-[#f8f3e8] sm:text-[2.3rem]">
                                Perfume GPT
                            </h2>
                        </Link>

                        <p className="max-w-sm text-sm leading-7 text-[#a8a29a] sm:text-[15px]">
                            {t('desc')}
                        </p>

                        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                            {socialLinks.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="group inline-flex items-center text-xs uppercase tracking-[0.2em] text-[#8e877d] transition-colors hover:text-[#d7c3a0]"
                                >
                                    <span className="relative">
                                        {item.label}
                                        <span className="absolute left-0 top-full mt-1 h-px w-full origin-left scale-x-0 bg-[#d7c3a0] transition-transform duration-300 group-hover:scale-x-100" />
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <FooterLinkGroup title={t('column_exploration')} items={exploreLinks} />

                    <FooterLinkGroup title={t('column_house')} items={aboutLinks} />

                    <div className="space-y-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d7c3a0]">
                            {t('newsletter_title')}
                        </p>

                        <p className="max-w-sm text-sm leading-7 text-[#a8a29a] sm:text-[15px]">
                            {t('newsletter_desc')}
                        </p>

                        <form className="space-y-4">
                            <div className="group flex min-h-[58px] items-center gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.02] px-4 transition-all focus-within:border-[#d7c3a0]/45 focus-within:bg-white/[0.04]">
                                <input
                                    type="email"
                                    placeholder={t('email_placeholder')}
                                    className="h-12 w-full bg-transparent text-sm text-[#f3eee2] outline-none placeholder:text-[#69635d]"
                                />
                                <button
                                    type="submit"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#d7c3a0] transition-all hover:border-[#d7c3a0]/40 hover:bg-[#d7c3a0]/10"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="flex flex-col gap-4 pt-6 text-xs text-[#7d776e] sm:pt-7 lg:flex-row lg:items-center lg:justify-between">
                    <p className="tracking-[0.08em]">
                        {t('copyright')}
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5 lg:gap-8">
                        <span className="tracking-[0.12em]">{t('engine')}</span>
                        <span className="tracking-[0.12em]">{t('location')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
