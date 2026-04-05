'use client';

import { useEffect, useState } from 'react';
import { journalService, Journal } from '@/services/journal.service';
import { Link } from '@/lib/i18n';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function JournalPublicPage() {
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

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">Loading Editorial...</span>
        </div>
    );

    if (journals.length === 0) return (
        <div className="min-h-screen bg-background flex flex-col pt-32 items-center text-center">
            <h1 className="text-4xl font-serif mb-4">The Aura Journal</h1>
            <p className="text-muted-foreground">Hiện chưa có ấn bản nào được xuất bản.</p>
        </div>
    );

    const featured = journals[0];
    const rest = journals.slice(1);

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Magazine Header */}
            <div className="pt-32 pb-16 text-center border-b border-border/50">
                <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-bold">Editorial</span>
                <h1 className="text-6xl md:text-8xl mt-4 font-serif text-foreground uppercase tracking-tighter">The Edition</h1>
                <p className="mt-6 text-muted-foreground max-w-xl mx-auto px-6 italic text-lg leading-relaxed">
                    Khám phá nghệ thuật chế tác hương thơm, câu chuyện lịch sử và nguồn cảm hứng bất tận đằng sau mỗi giọt nước hoa.
                </p>
            </div>

            {/* Featured Hero Article */}
            {featured && (
                <section className="container mx-auto px-6 mt-16 mb-24">
                    <Link href={`/journal/${featured.id}`} className="group block relative overflow-hidden rounded-3xl aspect-[16/9] md:aspect-[21/9]">
                        <Image
                            src={featured.mainImage}
                            alt={featured.title}
                            fill
                            className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col justify-end text-white text-center md:text-left">
                            <span className="text-[10px] uppercase tracking-widest text-gold font-bold mb-4">Tiêu Điểm • {featured.category}</span>
                            <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-4 group-hover:text-gold transition-colors">{featured.title}</h2>
                            <p className="hidden md:block max-w-3xl text-white/80 text-lg leading-relaxed line-clamp-2 italic">{featured.excerpt}</p>
                        </div>
                    </Link>
                </section>
            )}

            {/* Grid Layout Articles (Magazine format) */}
            {rest.length > 0 && (
                <section className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {rest.map((j, idx) => {
                            // Creates varied architectural layouts
                            // Large item occupies 8 cols, small item occupies 4 cols
                            const isLarge = idx % 3 === 0;
                            const spanClass = isLarge ? "md:col-span-7 xl:col-span-8" : "md:col-span-5 xl:col-span-4";

                            return (
                                <motion.div
                                    key={j.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8 }}
                                    className={spanClass}
                                >
                                    <Link href={`/journal/${j.id}`} className="group block h-full flex flex-col">
                                        <div className={`relative overflow-hidden rounded-[2rem] bg-secondary/10 ${isLarge ? 'aspect-[4/3]' : 'aspect-square'}`}>
                                            <Image
                                                src={j.mainImage}
                                                alt={j.title}
                                                fill
                                                className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="pt-6 px-2 flex-grow flex flex-col">
                                            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">{j.category} • {new Date(j.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <h3 className="text-2xl md:text-3xl font-serif text-foreground leading-[1.2] mb-3 group-hover:text-gold transition-colors">{j.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6 italic flex-grow">
                                                {j.excerpt}
                                            </p>
                                            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground group-hover:text-gold transition-colors mt-auto">
                                                Đọc Ký Sự <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
