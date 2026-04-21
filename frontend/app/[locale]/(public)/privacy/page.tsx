'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
    const t = useTranslations('privacy_page');
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

                {/* Key Points */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    {[
                        { icon: Shield, title: t('key_points.protection_title'), desc: t('key_points.protection_desc') },
                        { icon: Lock, title: t('key_points.storage_title'), desc: t('key_points.storage_desc') },
                        { icon: Eye, title: t('key_points.transparency_title'), desc: t('key_points.transparency_desc') },
                        { icon: Database, title: t('key_points.control_title'), desc: t('key_points.control_desc') },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-4 p-6 glass dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                                <item.icon size={18} />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-luxury-black dark:text-white mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-luxury-black dark:text-white">
                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.collect_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.collect_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.use_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.use_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.ai_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.ai_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.security_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.security_desc')}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">{t('sections.rights_title')}</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {t('sections.rights_desc')}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
