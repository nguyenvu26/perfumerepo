'use client';

import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { Link } from '@/lib/i18n';

export const Discovery = () => {
    const locale = useLocale();
    const isVi = locale === 'vi';

    const copy = isVi
        ? {
            eyebrow: 'Khám Phá Hương Thơm',
            title: 'Hành Trình Tìm Kiếm Bản Ngã',
            subtitle: 'Mỗi nhóm hương mang một câu chuyện riêng, phản chiếu những khía cạnh ẩn sâu trong tâm hồn bạn. Hãy để chúng tôi dẫn lối cho bạn.',
            cta: 'Tư Vấn Hương Thơm Cá Nhân',
        }
        : {
            eyebrow: 'Discover Fragrances',
            title: 'The Journey to Your True Self',
            subtitle: 'Every scent family carries its own story, reflecting the hidden facets of your soul. Let us guide your senses.',
            cta: 'Personal Scent Consultation',
        };

    const families = [
        {
            name: isVi ? 'Hương Gỗ (Woody)' : 'Woody',
            desc: isVi ? 'Trầm ấm, sâu lắng và đầy mê hoặc.' : 'Warm, deep, and enchanting.',
            image: '/lelabo33.png',
            href: '/collection?scentFamily=Woody'
        },
        {
            name: isVi ? 'Hương Hoa (Floral)' : 'Floral',
            desc: isVi ? 'Ngọt ngào, nữ tính và lãng mạn.' : 'Sweet, feminine, and romantic.',
            image: '/roja1.png',
            href: '/collection?scentFamily=Floral'
        },
        {
            name: isVi ? 'Hương Tươi Mát (Fresh)' : 'Fresh',
            desc: isVi ? 'Sảng khoái, tràn đầy năng lượng.' : 'Invigorating and full of energy.',
            image: '/narciso.png',
            href: '/collection?scentFamily=Fresh'
        }
    ];

    return (
        <section className="section-py relative overflow-hidden bg-[var(--section-alt)] transition-colors">
            <div className="container-responsive relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold">{copy.eyebrow}</p>
                    <h2 className="mt-4 text-3xl font-serif leading-tight text-foreground md:text-5xl">
                        {copy.title}
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        {copy.subtitle}
                    </p>
                </motion.div>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {families.map((family, index) => (
                        <motion.div
                            key={family.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: index * 0.15 }}
                        >
                            <Link href={family.href} className="group block h-full">
                                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted">
                                    <Image
                                        src={family.image}
                                        alt={family.name}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                                    
                                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                                        <h3 className="text-2xl font-serif text-white">{family.name}</h3>
                                        <p className="mt-2 text-sm text-white/80 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4">
                                            {family.desc}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="mt-20 text-center"
                >
                    <Link
                        href="/quiz"
                        className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border border-foreground/20 bg-transparent px-8 text-sm font-medium text-foreground transition-all hover:border-foreground hover:bg-foreground hover:text-background"
                    >
                        {copy.cta}
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
