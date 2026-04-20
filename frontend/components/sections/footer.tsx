'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';

export const Footer = () => {
    const t = useTranslations('footer');
    const commonT = useTranslations('common');

    const navigation = [
        { label: t('navigation_labels.products'), href: '/products' },
        { label: t('navigation_labels.consultation'), href: '/consultation' },
        { label: t('navigation_labels.journal'), href: '/journal' },
        { label: t('navigation_labels.boutiques'), href: '/boutiques' },
        { label: t('navigation_labels.gifting'), href: '/gifting' }
    ];

    const support = [
        { label: t('support_labels.story'), href: '/story' },
        { label: t('support_labels.ingredients'), href: '/ingredients' },
        { label: t('support_labels.terms'), href: '/terms' },
        { label: t('support_labels.privacy'), href: '/privacy' },
        { label: t('support_labels.support'), href: '/support' }
    ];

    const social = ['Instagram', 'Pinterest', 'LinkedIn', 'YouTube'];

    return (
        <footer className="bg-ebony text-muted-foreground section-py border-t border-white/5">
            <div className="container-responsive">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20 lg:mb-32">
                    {/* Brand Column */}
                    <div className="flex flex-col">
                        <Link href="/">
                            <h2 className="text-fluid-2xl font-serif text-white tracking-[0.3em] font-bold mb-8 lg:mb-10 uppercase transition-colors">
                                PERFUME GPT
                            </h2>
                        </Link>
                        <p className="text-xs lg:text-sm leading-relaxed mb-8 lg:mb-10 font-light italic max-w-sm">
                            {t('desc')}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-auto">
                            {social.map(name => (
                                <a
                                    key={name}
                                    href="#"
                                    className="text-[9px] uppercase tracking-[0.3em] text-stone-700 hover:text-gold transition-colors font-bold"
                                >
                                    {name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="text-white font-bold mb-8 lg:mb-10 uppercase text-[10px] lg:text-[11px] tracking-[0.4em]">
                            {t('column_exploration')}
                        </h4>
                        <ul className="space-y-4 lg:space-y-6 text-[10px] uppercase tracking-[0.2em] font-bold">
                            {navigation.map(item => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="hover:text-gold transition-colors block py-1"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h4 className="text-white font-bold mb-8 lg:mb-10 uppercase text-[10px] lg:text-[11px] tracking-[0.4em]">
                            {t('column_house')}
                        </h4>
                        <ul className="space-y-4 lg:space-y-6 text-[10px] uppercase tracking-[0.2em] font-bold">
                            {support.map(item => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="hover:text-gold transition-colors block py-1"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="text-white font-bold mb-8 lg:mb-10 uppercase text-[10px] lg:text-[11px] tracking-[0.4em]">
                            {t('newsletter_title')}
                        </h4>
                        <p className="text-xs mb-6 lg:mb-8 italic max-w-xs">
                            {t('newsletter_desc')}
                        </p>
                        <div className="flex border-b border-white/10 pb-2 lg:pb-4 group focus-within:border-gold transition-colors min-h-[44px] items-center">
                            <input
                                type="email"
                                placeholder={t('email_placeholder')}
                                className="bg-transparent text-xs w-full outline-none placeholder:text-stone-800 text-white transition-all uppercase tracking-widest h-10"
                            />
                            <button className="text-stone-700 hover:text-gold transition-colors p-2 min-w-[44px] flex items-center justify-center">
                                <ArrowRight size={20} strokeWidth={1} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 text-[9px] tracking-[0.3em] uppercase font-bold text-stone-800">
                    <span>{t('copyright')}</span>
                    <div className="flex gap-12 mt-8 md:mt-0 italic">
                        <span>{t('engine')}</span>
                        <span>{t('location')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
