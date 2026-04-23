'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
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
        bannerService
            .list()
            .then((res) => {
                if (res.length > 0) setBanners(res);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [banners.length]);

    const { scrollYProgress } = useScroll({
        target: isMounted && !parentHeroY ? containerRef : undefined,
        offset: ['start start', 'end start'],
    });

    const localHeroY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
    const localHeroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
    const localHeroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.15]);
    const headlineY = useTransform(scrollYProgress, [0, 0.45], ['0px', '70px']);

    const heroY = parentHeroY || localHeroY;
    const heroScale = parentHeroScale || localHeroScale;
    const heroOpacity = parentHeroOpacity || localHeroOpacity;
    const currentBanner = banners[currentIndex];
    const bannerTitle = currentBanner?.title || t('title');
    const bannerSubtitle = currentBanner?.subtitle || t('subtitle');
    const bannerHref = currentBanner?.linkUrl || '/quiz';

    return (
        <section
            ref={containerRef}
            className="relative flex min-h-screen items-center overflow-hidden pt-20 pb-12 md:pt-32 md:pb-24"
        >
            <motion.div
                style={{ y: heroY, scale: heroScale }}
                className="absolute inset-0 z-0"
            >
                {banners.length > 0 ? (
                    banners.map((banner, index) => (
                        <Image
                            key={banner.id}
                            src={banner.imageUrl}
                            alt={banner.title || 'Luxury fragrance'}
                            fill
                            priority={index === 0}
                            className={cn(
                                'object-cover transition-opacity duration-1000',
                                index === currentIndex ? 'opacity-100' : 'opacity-0',
                            )}
                        />
                    ))
                ) : (
                    <Image
                        src="/luxury_perfume_hero_cinematic.png"
                        alt="Luxury fragrance"
                        fill
                        priority
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,9,11,0.84)_0%,rgba(9,9,11,0.58)_42%,rgba(9,9,11,0.28)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.28),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.12),transparent_20%)]" />
            </motion.div>

            <div className="container-responsive relative z-10">
                <div className="grid gap-8">
                    <motion.div
                        style={{ opacity: heroOpacity, y: headlineY }}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl text-white"
                    >
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-xl">
                            <Sparkles className="h-4 w-4 text-gold" />
                            <span>{t('badge')}</span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentBanner?.id || 'default-banner'}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: 0.55 }}
                            >
                                <h1 className="max-w-[18ch] sm:max-w-[22ch] lg:max-w-none text-[clamp(2.1rem,6vw,3.3rem)] font-heading leading-[1.1] md:leading-tight tracking-[-0.04em] text-white lg:whitespace-nowrap">
                                    {bannerTitle}
                                </h1>
                                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86 md:text-xl">
                                    {bannerSubtitle}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link
                                href={bannerHref}
                                className="group inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-gold px-7 text-base font-semibold text-luxury-black transition-all hover:scale-[1.01]"
                            >
                                {currentBanner?.linkUrl ? 'Xem ngay' : t('cta')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/collection"
                                className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-white/18 bg-white/8 px-7 text-base font-medium text-white backdrop-blur-xl transition-all hover:border-gold hover:text-gold"
                            >
                                {t('explore')}
                            </Link>
                        </div>

                    </motion.div>

                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-4 md:flex"
            >
                <span className="text-sm font-medium text-white/78">{t('scroll_to_discover')}</span>
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-12 w-px bg-gradient-to-b from-gold to-transparent"
                />
            </motion.div>
        </section>
    );
};
