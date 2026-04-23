'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function LogoutPage() {
    const t = useTranslations('auth.logout');

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-6 py-12 text-center text-[#f4efe5]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,195,160,0.12),transparent_26%),radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_54%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.66))]" />

            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-[640px]"
            >
                <div className="mx-auto rounded-[2rem] border border-white/8 bg-white/[0.03] px-6 py-10 shadow-[0_35px_120px_-70px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:px-10 sm:py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d7c3a0]/24 bg-[#d7c3a0]/6 text-[#d7c3a0]">
                        <Sparkles size={22} strokeWidth={1.6} />
                    </div>

                    <div className="mt-8 space-y-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7c3a0]/82">
                            Perfume GPT
                        </p>
                        <h1 className="font-serif text-[clamp(2.7rem,7vw,4.6rem)] leading-[0.96] tracking-[-0.04em] text-[#fbf7ef]">
                            {t('title')}
                        </h1>
                        <p className="mx-auto max-w-[34rem] text-sm leading-7 text-[#aaa39a] sm:text-[15px]">
                            {t('subtitle')}
                        </p>
                    </div>

                    <div className="mx-auto mt-8 max-w-[30rem] rounded-[1.6rem] border border-white/8 bg-white/[0.02] px-5 py-4">
                        <p className="text-sm italic leading-7 text-[#ddd4c6]">
                            "{t('quote')}"
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/login"
                            className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-[#d7c3a0] px-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#16120d] transition-all hover:bg-[#e2cfad]"
                        >
                            {t('return_portal')}
                            <ArrowRight size={16} />
                        </Link>

                        <Link
                            href="/"
                            className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-white/10 bg-white/[0.02] px-8 text-sm font-medium uppercase tracking-[0.18em] text-[#f4efe5] transition-all hover:border-[#d7c3a0]/36 hover:text-[#d7c3a0]"
                        >
                            {t('home')}
                        </Link>
                    </div>
                </div>
            </motion.section>
        </main>
    );
}
