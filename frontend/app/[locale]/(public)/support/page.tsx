'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors pt-32">
            <div className="container mx-auto px-6 py-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-24"
                >
                    <span className="text-[10px] font-bold tracking-[.5em] uppercase text-gold mb-6 block">
                        Concierge Service
                    </span>
                    <h1 className="text-6xl md:text-8xl font-serif text-luxury-black dark:text-white mb-6">
                        How Can We Assist?
                    </h1>
                    <p className="text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
                        Our dedicated team is here to guide you through your olfactory journey
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: 'Email', value: 'concierge@auraai.com' },
                                { icon: Phone, label: 'Phone', value: '+84 (028) 3925 xxxx' },
                                { icon: MapPin, label: 'Atelier', value: 'District 1, Ho Chi Minh City' },
                                { icon: Clock, label: 'Hours', value: 'Mon-Sat: 10AM - 8PM' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-6 p-6 glass dark:bg-white/5 rounded-3xl border border-stone-200 dark:border-white/5"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">
                                            {item.label}
                                        </h3>
                                        <p className="text-lg font-medium text-luxury-black dark:text-white">
                                            {item.value}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass dark:bg-white/5 p-10 rounded-3xl border border-stone-200 dark:border-white/5"
                    >
                        <h2 className="text-2xl font-serif text-luxury-black dark:text-white mb-8">
                            Send Us a Message
                        </h2>
                        <form className="space-y-6">
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-3 block">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 text-luxury-black dark:text-white outline-none focus:border-gold transition-all"
                                    placeholder="Alexander Dupont"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-3 block">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 text-luxury-black dark:text-white outline-none focus:border-gold transition-all"
                                    placeholder="alexander@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-3 block">
                                    Message
                                </label>
                                <textarea
                                    rows={6}
                                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 text-luxury-black dark:text-white outline-none focus:border-gold transition-all resize-none"
                                    placeholder="How can we help you today?"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-luxury-black dark:bg-gold text-white rounded-full font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-stone-800 dark:hover:bg-gold/80 transition-all"
                            >
                                <Send size={18} /> Send Message
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
