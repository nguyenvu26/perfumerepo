'use client';

import { useEffect, useState } from 'react';
import { journalService, Journal } from '@/services/journal.service';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Breadcrumb } from '@/components/common/breadcrumb';

export default function JournalPublicPage() {
    const t = useTranslations('journal_page');
    const tCommon = useTranslations('common');
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        journalService.list().then(res => {
            setJournals(res);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const breadcrumbItems = [
        { label: tCommon('journal'), active: true }
    ];

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
            <BookOpen className="w-10 h-10 text-gold animate-bounce" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground animate-pulse font-bold">{t('loading')}</span>
        </div>
    );

    if (journals.length === 0) return (
        <div className="min-h-screen bg-background flex flex-col pt-32 items-center text-center container-responsive">
            <div className="w-20 h-20 rounded-full glass border-border mb-8 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h1 className="text-4xl font-serif mb-4">{t('empty_title')}</h1>
            <p className="text-muted-foreground">{t('empty_desc')}</p>
        </div>
    );

    const featured = journals[0];
    const rest = journals.slice(1);

    return (
        <div className="min-h-screen bg-background pb-32 pt-32 transition-colors">
            <div className="container-responsive">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />

                {/* Magazine Header */}
                <header className="pb-16 text-center border-b border-border/50">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-black">{t('header_badge')}</span>
                    <h1 className="text-fluid-4xl mt-6 font-serif text-foreground uppercase tracking-tighter leading-none italic">{t('header_title')}</h1>
                    <p className="mt-8 text-muted-foreground max-w-2xl mx-auto italic text-base md:text-lg leading-relaxed px-4">
                        {t('header_desc')}
                    </p>
                </header>

                {/* Featured Hero Article */}
                {featured && (
                    <section className="mt-16 mb-24">
                        <Link href={`/journal/${featured.id}`} className="group block relative overflow-hidden rounded-[2rem] md:rounded-[3rem] aspect-[4/3] md:aspect-[21/9] shadow-2xl shadow-gold/5 border border-border">
                            <Image
                                src={featured.mainImage}
                                alt={featured.title}
                                fill
                                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col justify-end text-white text-center md:text-left h-full">
                                <div className="max-w-4xl">
                                    <span className="text-[10px] uppercase tracking-widest text-gold font-black mb-4 flex items-center gap-3 justify-center md:justify-start">
                                        <div className="w-6 h-px bg-gold" />
                                        {t('featured_badge')} • {featured.category}
                                    </span>
                                    <h2 className="text-3xl md:text-6xl font-serif leading-tight mb-6 group-hover:text-gold transition-colors tracking-tight italic">{featured.title}</h2>
                                    <p className="hidden md:block max-w-2xl text-white/70 text-lg leading-relaxed line-clamp-2 italic font-serif">
                                        {featured.excerpt}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Grid Layout Articles (Magazine format) */}
                {rest.length > 0 && ( rest.length > 0 && (
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-16">
                            {rest.map((j, idx) => {
                                // Creates varied architectural layouts
                                // Large item occupies 8 cols, small item occupies 4 cols
                                const isLarge = idx % 3 === 0;
                                const spanClass = isLarge ? "md:col-span-12 lg:col-span-7 xl:col-span-8" : "md:col-span-12 lg:col-span-5 xl:col-span-4";

                                return (
                                    <motion.div
                                        key={j.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.8 }}
                                        className={spanClass}
                                    >
                                        <Link href={`/journal/${j.id}`} className="group block h-full flex flex-col">
                                            <div className={`relative overflow-hidden rounded-[2.5rem] bg-secondary/10 border border-border shadow-sm group-hover:shadow-xl group-hover:shadow-gold/5 transition-all duration-500 ${isLarge ? 'aspect-[3/2]' : 'aspect-square'}`}>
                                                <Image
                                                    src={j.mainImage}
                                                    alt={j.title}
                                                    fill
                                                    className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="pt-8 px-4 flex-grow flex flex-col">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-black">{j.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{new Date(j.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <h3 className="text-2xl md:text-3xl font-serif text-foreground leading-[1.2] mb-4 group-hover:text-gold transition-colors italic tracking-tight">{j.title}</h3>
                                                <p className="text-base text-muted-foreground leading-relaxed line-clamp-3 mb-8 italic flex-grow font-serif opacity-80">
                                                    {j.excerpt}
                                                </p>
                                                <div className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-foreground group-hover:text-gold transition-colors mt-auto border-t border-border/50 pt-6">
                                                    {t('read_more')} 
                                                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
