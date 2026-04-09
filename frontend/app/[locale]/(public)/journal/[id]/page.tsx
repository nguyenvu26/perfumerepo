'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { journalService, Journal, JournalSection } from '@/services/journal.service';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from '@/lib/i18n';

export default function JournalDetailPage() {
    const { id } = useParams() as { id: string };
    const [journal, setJournal] = useState<Journal | null>(null);
    const [latestJournals, setLatestJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);

    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

    useEffect(() => {
        Promise.all([
            journalService.getById(id),
            journalService.list()
        ])
        .then(([jRes, listRes]) => {
            setJournal(jRes);
            setLatestJournals(listRes.filter(j => j.id !== id).slice(0, 3));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">Loading Manuscript...</span>
        </div>
    );

    if (!journal) return <div className="pt-32 text-center text-foreground font-serif text-2xl">Bài viết không tồn tại.</div>;

    const sections = journal.sections || [];
    
    return (
        <article className="min-h-screen bg-background">
            {/* Parallax Hero */}
            <div className="relative h-screen flex items-center overflow-hidden">
                <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
                    <Image 
                        src={journal.mainImage} 
                        alt={journal.title} 
                        fill 
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
                
                <motion.div style={{ opacity }} className="relative z-10 w-full text-center px-6 pt-32">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold bg-background/20 px-4 py-2 rounded-full backdrop-blur-md">
                        {journal.category || 'Editorial'} • {new Date(journal.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <h1 className="mt-8 text-5xl md:text-8xl font-serif text-white max-w-5xl mx-auto leading-[1.1] drop-shadow-xl">{journal.title}</h1>
                </motion.div>
                
                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/80 animate-bounce">
                    <span className="text-[10px] tracking-[0.3em] uppercase font-bold">Cuộn Xuống</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="relative z-20 bg-background pt-24 pb-32">
                <div className="container mx-auto px-6">
                    {journal.excerpt && (
                        <div className="max-w-3xl mx-auto mb-24">
                            <p className="text-2xl md:text-3xl font-serif text-muted-foreground italic text-center leading-relaxed">
                                "{journal.excerpt}"
                            </p>
                        </div>
                    )}
                    
                    {/* Render Dynamic Sections */}
                    <div className="space-y-32 md:space-y-48">
                        {sections.map((section, idx) => {
                            // index 1 is "Nội dung 2" (0-indexed)
                            const isContent2 = idx === 1;

                            if (isContent2) {
                                // Hình bên phải, nội dung bên trái
                                return (
                                    <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
                                        <div className="order-2 md:order-1">
                                            {section.subtitle && (
                                                section.productId ? (
                                                    <Link href={`/collection/${section.productId}`} className="group inline-flex items-center gap-3 mb-6 transition-all hover:-translate-y-1">
                                                        <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold group-hover:underline underline-offset-4">
                                                            {section.subtitle}
                                                        </h2>
                                                        <span className="p-1.5 rounded-full bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-6">
                                                        {section.subtitle}
                                                    </h2>
                                                )
                                            )}
                                            <div className="prose prose-stone dark:prose-invert prose-lg md:prose-xl max-w-none font-serif leading-[1.8] whitespace-pre-wrap">
                                                {section.content}
                                            </div>
                                        </div>
                                        <div className="order-1 md:order-2">
                                            {section.imageUrl && (
                                                <div className="relative rounded-[2rem] overflow-hidden group">
                                                    <Image 
                                                        src={section.imageUrl} 
                                                        alt={section.subtitle || `Section image ${idx}`} 
                                                        width={1200}
                                                        height={1600}
                                                        className="w-full h-auto object-cover transition-transform duration-[2s] group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // Còn lại: Từ trên xuống dưới (Vertical Layout)
                            return (
                                <div key={section.id} className="max-w-4xl mx-auto flex flex-col gap-12">
                                    <div className="text-center">
                                        {section.subtitle && (
                                            section.productId ? (
                                                <Link href={`/collection/${section.productId}`} className="group inline-flex items-center gap-3 mb-8 transition-all hover:-translate-y-1 justify-center">
                                                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold group-hover:underline underline-offset-4">
                                                        {section.subtitle}
                                                    </h2>
                                                    <span className="p-1.5 rounded-full bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                                    </span>
                                                </Link>
                                            ) : (
                                                <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-8">
                                                    {section.subtitle}
                                                </h2>
                                            )
                                        )}
                                        <div className="prose prose-stone dark:prose-invert prose-lg md:prose-xl max-w-none font-serif leading-[1.8] whitespace-pre-wrap text-left mx-auto">
                                            {section.content}
                                        </div>
                                    </div>
                                    {section.imageUrl && (
                                        <div className="relative rounded-[2rem] overflow-hidden w-full group mt-4">
                                            <Image 
                                                src={section.imageUrl} 
                                                alt={section.subtitle || `Section image ${idx}`} 
                                                width={1920}
                                                height={1080}
                                                className="w-full h-auto object-cover transition-transform duration-[2s] group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>
            <div className="bg-stone-50 dark:bg-zinc-900 py-32 rounded-t-[4rem]">
                <div className="container mx-auto px-6">
                    <h3 className="text-4xl font-serif mb-16 text-center text-foreground font-medium">Bản tin liên quan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-20">
                        {latestJournals.map(j => (
                            <Link key={j.id} href={`/journal/${j.id}`} className="group block">
                                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-6 pointer-events-none group-hover:shadow-2xl transition-all duration-700">
                                    <Image src={j.mainImage} alt={j.title} fill className="object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <span className="text-[9px] text-gold uppercase tracking-[0.3em] font-bold mb-4">{j.category || 'Editorial'}</span>
                                    <h4 className="text-2xl font-serif text-foreground group-hover:italic transition-all duration-500 line-clamp-2 leading-snug">{j.title}</h4>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link href="/journal" className="inline-flex items-center justify-center border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.3em]">
                            Khám phá tất cả ấn phẩm
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
