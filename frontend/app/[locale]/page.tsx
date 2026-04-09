'use client';

import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import { Header } from '@/components/common/header';
import { Hero } from '@/components/sections/hero';
import { Story } from '@/components/sections/story';
import { FeaturedProducts } from '@/components/sections/featured-products';
import { Discovery } from '@/components/sections/discovery';
import { Membership } from '@/components/sections/membership';
import { Footer } from '@/components/sections/footer';

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { scrollYProgress } = useScroll({
        target: isMounted ? containerRef : undefined,
        offset: ['start start', 'end start']
    });

    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <div
            className="relative min-h-screen bg-background transition-colors"
            ref={containerRef}
        >
            <Header />

            <main>
                <Hero
                    heroY={heroY}
                    heroScale={heroScale}
                    heroOpacity={heroOpacity}
                />
                <Story />
                <FeaturedProducts />
                <Discovery />
                <Membership />
            </main>

            <Footer />
        </div>
    );
}
