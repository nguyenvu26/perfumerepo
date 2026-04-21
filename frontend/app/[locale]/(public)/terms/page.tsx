'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function TermsPage() {
    const t = useTranslations('terms_page');
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors pt-32">
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <h1 className="text-fluid-4xl font-serif text-luxury-black dark:text-white mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400">
                        {t('last_updated')}
                    </p>
                </motion.div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-luxury-black dark:text-white">
                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.acceptance_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.acceptance_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.license_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.license_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.ai_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.ai_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.product_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.product_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.liability_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.liability_desc')}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
