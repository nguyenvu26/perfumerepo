'use client';

import { motion } from 'framer-motion';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors pt-32">
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <h1 className="text-6xl font-serif text-luxury-black dark:text-white mb-6">
                        Terms of Service
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400">
                        Last updated: January 2026
                    </p>
                </motion.div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-luxury-black dark:text-white">
                    <section>
                        <h2 className="text-3xl font-serif mb-4">1. Acceptance of Terms</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            By accessing and using Aura AI services, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">2. Use License</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            Permission is granted to temporarily access the materials on Aura AI's website for personal, non-commercial transitory viewing only.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">3. AI-Generated Content</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            Our AI consultation service provides personalized fragrance recommendations. Results are based on algorithmic analysis and should be considered as suggestions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">4. Product Information</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-serif mb-4">5. Limitation of Liability</h2>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            In no event shall Aura AI or its suppliers be liable for any damages arising out of the use or inability to use our services.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
