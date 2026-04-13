'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, MotionValue, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/i18n';
import { useRef, useEffect, useState } from 'react';
import { bannerService, Banner } from '@/services/banner.service';
import { cn } from '@/lib/utils';

interface HeroProps {
    heroY?: MotionValue<string>;
    heroScale?: MotionValue<number>;
    heroOpacity?: MotionValue<number>;
}

export const Hero = ({ heroY: parentHeroY, heroScale: parentHeroScale, heroOpacity: parentHeroOpacity }: HeroProps) => {
    const t = useTranslations('hero');
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        bannerService.list().then(res => {
            if (res.length > 0) setBanners(res);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 3000); // 3 second interval
        return () => clearInterval(timer);
    }, [banners.length]);

    // Use parent props if provided, otherwise create own scroll transforms
    const { scrollYProgress } = useScroll({
        target: isMounted && !parentHeroY ? containerRef : undefined,
        offset: ["start start", "end start"]
    });

    const localHeroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const localHeroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const localHeroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const heroY = parentHeroY || localHeroY;
    const heroScale = parentHeroScale || localHeroScale;
    const heroOpacity = parentHeroOpacity || localHeroOpacity;

    const currentBanner = banners[currentIndex];

    return (
        <section
            ref={containerRef}
            className="relative h-screen flex items-center overflow-hidden pt-24" // Added pt-24 so content doesn't get hidden behind the fixed transparent navbar
        >
            {/* Parallax Background Slider */}
            <motion.div
                style={{ y: heroY, scale: heroScale }}
                className="absolute inset-0 z-0"
            >
                {banners.length > 0 ? (
                    banners.map((b, i) => (
                        <Image
                            key={b.id}
                            src={b.imageUrl}
                            alt={b.title || 'Luxury Fragrance'}
                            fill
                            className={cn(
                                "object-cover transition-opacity duration-1000",
                                i === currentIndex ? "opacity-100" : "opacity-0"
                            )}
                            priority={i === 0}
                        />
                    ))
                ) : (
                    <Image
                        src="/luxury_perfume_hero_cinematic.png"
                        alt="Luxury Fragrance Default"
                        fill
                        className="object-cover"
                        priority
                    />
                )}
                {/* Overlay gradient to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 transition-colors" />
            </motion.div>

            {/* Content Context */}
            <div className="container mx-auto px-6 relative z-10 w-full flex flex-col justify-center h-full">
                <motion.div
                    style={{ opacity: heroOpacity }}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                    className="max-w-2xl text-white"
                >
                    {/* Badge */}
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="inline-block px-4 py-1.5 glass rounded-full text-[10px] font-bold tracking-[.4em] uppercase mb-8 shadow-md"
                    >
                        {t('badge')}
                    </motion.span>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner?.id || 'default-banner'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Headline */}
                            <h1 className="text-7xl md:text-9xl font-serif mb-8 leading-[1.1] tracking-normal drop-shadow-2xl">
                                {currentBanner?.title || t('title')}
                            </h1>

                            {/* Subtitle */}
                            <p className="text-xl md:text-2xl text-white/90 mb-12 font-light leading-relaxed max-w-lg italic drop-shadow-md">
                                {currentBanner?.subtitle || t('subtitle')}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-6 mt-8">
                        <Link
                            href={currentBanner?.linkUrl || "/quiz"}
                            className="group px-10 py-5 bg-gold hover:bg-gold-light text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] flex items-center gap-4 transition-all shadow-xl"
                        >
                            {currentBanner?.linkUrl ? 'Xem Ngay' : t('cta')}
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link
                            href="/collection"
                            className="px-10 py-5 glass hover:bg-white/20 text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] transition-all shadow-lg"
                        >
                            {t('explore')}
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none z-10"
            >
                <span className="text-[10px] uppercase tracking-[0.5em] text-white/80 font-bold drop-shadow-md">
                    {t('scroll_to_discover')}
                </span>
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-px h-16 bg-gradient-to-b from-gold to-transparent"
                />
            </motion.div>
        </section>
    );
};
