'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors pt-32">
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <h1 className="text-6xl font-serif text-luxury-black dark:text-white mb-6">
                        Privacy Policy
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400">
                        Last updated: January 2026
                    </p>
                </motion.div>

                {/* Key Points */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    {[
                        { icon: Shield, title: 'Data Protection', desc: 'Your data is encrypted and secure' },
                        { icon: Lock, title: 'Secure Storage', desc: 'Industry-standard encryption' },
                        { icon: Eye, title: 'Transparency', desc: 'Clear data usage policies' },
                        { icon: Database, title: 'Data Control', desc: 'You own your data' },
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
                        <h2 className="text-3xl font-serif mb-4">Information We Collect</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            We collect information you provide directly to us, including your name, email address, preferences, and AI consultation responses to provide personalized fragrance recommendations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">How We Use Your Data</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            We use your data to improve our AI algorithms, provide personalized experiences, process orders, and send you relevant updates about products and services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">AI & Machine Learning</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            Your consultation data helps train our AI models. All data is anonymized and aggregated for machine learning purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">Data Security</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">Your Rights</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            You have the right to access, update, or delete your personal data at any time. Contact our support team for assistance.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
