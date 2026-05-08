'use client';

import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const Discovery = () => {
    const locale = useLocale();
    const isVi = locale === 'vi';

    const copy = isVi
        ? {
            eyebrow: 'Quy Trình Mua Hàng',
            title: 'Tìm Mùi Hương Phù Hợp Qua Từng Bước Rõ Ràng',
            subtitle:
                'Một tiến trình đơn giản giúp bạn đi từ nhu cầu ban đầu đến lựa chọn nước hoa phù hợp, dễ theo dõi và không cần thử quá nhiều mẫu.',
            cta: 'Bắt Đầu Tìm Nước Hoa',
            finalTitle: 'Mua nước hoa dễ hơn khi mọi bước đều được sắp xếp rõ ràng.',
            finalDesc:
                'Bạn có thể bắt đầu bằng trắc nghiệm, xem gợi ý, so sánh sản phẩm và hoàn tất đơn hàng trong cùng một trải nghiệm liền mạch.',
            steps: [
                'Xác Định Nhu Cầu',
                'Chọn Nhóm Hương',
                'Xem Danh Sách Gợi Ý',
                'Đọc Chi Tiết Sản Phẩm',
                'Thêm Vào Giỏ Hàng',
                'Thanh Toán & Nhận Hàng',
            ],
        }
        : {
            eyebrow: 'Shopping Flow',
            title: 'Find The Right Fragrance Through A Clear Step-By-Step Path',
            subtitle:
                'A simple process that takes you from your initial need to a confident fragrance choice without testing too many samples.',
            cta: 'Begin Your Scent Journey',
            finalTitle: 'Fragrance shopping feels easier when every step is clear.',
            finalDesc:
                'Start with a short quiz, review recommendations, compare products, and complete your order in one consistent flow.',
            steps: [
                'Define Your Need',
                'Pick A Scent Family',
                'Review Matches',
                'Read Product Details',
                'Add To Cart',
                'Pay & Receive',
            ],
        };

    const colorForStep = (index: number) => {
        if (index % 3 === 0) {
            return {
                circle: 'border-[#4a4b23] text-[#4a4b23] dark:border-[#8f9250] dark:text-[#c8cb8b]',
                line: 'bg-[#4a4b23] dark:bg-[#8f9250]',
                glow: 'shadow-[0_18px_45px_-24px_rgba(74,75,35,0.65)] dark:shadow-[0_18px_45px_-24px_rgba(200,203,139,0.45)]',
                arrowDown: 'border-t-[#4a4b23] dark:border-t-[#8f9250]',
                arrowUp: 'border-b-[#4a4b23] dark:border-b-[#8f9250]',
            };
        }
        if (index % 3 === 1) {
            return {
                circle: 'border-[#91ba88] text-[#668f5d] dark:border-[#a8d2a0] dark:text-[#c7e8c0]',
                line: 'bg-[#91ba88] dark:bg-[#a8d2a0]',
                glow: 'shadow-[0_18px_45px_-24px_rgba(102,143,93,0.55)] dark:shadow-[0_18px_45px_-24px_rgba(168,210,160,0.42)]',
                arrowDown: 'border-t-[#91ba88] dark:border-t-[#a8d2a0]',
                arrowUp: 'border-b-[#91ba88] dark:border-b-[#a8d2a0]',
            };
        }
        return {
            circle: 'border-[#5aa0b5] text-[#3f8699] dark:border-[#83c5d8] dark:text-[#b8e5f1]',
            line: 'bg-[#5aa0b5] dark:bg-[#83c5d8]',
            glow: 'shadow-[0_18px_45px_-24px_rgba(63,134,153,0.58)] dark:shadow-[0_18px_45px_-24px_rgba(131,197,216,0.42)]',
            arrowDown: 'border-t-[#5aa0b5] dark:border-t-[#83c5d8]',
            arrowUp: 'border-b-[#5aa0b5] dark:border-b-[#83c5d8]',
        };
    };

    return (
        <section className="section-py relative overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_48%,#fbf8f1_100%)] transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#10100d_52%,#09090b_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(197,160,89,0.14),transparent_28%),radial-gradient(circle_at_86%_78%,rgba(90,160,181,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_12%_12%,rgba(197,160,89,0.1),transparent_28%),radial-gradient(circle_at_86%_78%,rgba(131,197,216,0.1),transparent_24%)]" />
            <div className="pointer-events-none absolute left-8 top-10 hidden h-28 w-28 rounded-full border border-gold/10 md:block dark:border-gold/15" />
            <div className="pointer-events-none absolute bottom-12 right-8 hidden h-32 w-32 rounded-full border border-[#5aa0b5]/12 md:block dark:border-[#83c5d8]/15" />
            <div className="container-responsive relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65 }}
                    className="mx-auto max-w-4xl text-center"
                >
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">{copy.eyebrow}</p>
                    <h2 className="mt-4 text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl">
                        {copy.title}
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                        {copy.subtitle}
                    </p>
                </motion.div>

                <div className="mt-16 hidden lg:block">
                    <div className="relative mx-auto max-w-6xl px-6 py-6">
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="absolute left-10 right-10 top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-[#9ca0b3] shadow-[0_0_28px_rgba(156,160,179,0.25)] dark:bg-white/28 dark:shadow-[0_0_28px_rgba(255,255,255,0.12)]"
                        />

                        <div className="grid grid-cols-6 gap-4">
                            {copy.steps.map((title, index) => {
                                const isTop = index % 2 === 0;
                                const colors = colorForStep(index);

                                return (
                                    <motion.div
                                        key={title}
                                        initial={{ opacity: 0, y: isTop ? -18 : 18 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.08 }}
                                        whileHover={{ y: isTop ? -4 : 4 }}
                                        className="group relative h-[420px] text-center"
                                    >
                                        {isTop ? (
                                            <>
                                                <motion.div
                                                    whileHover={{ scale: 1.08 }}
                                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[54px] z-10 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-[10px] bg-white text-lg font-semibold transition-colors duration-300 group-hover:bg-[#fffaf0] dark:bg-[#111113] dark:group-hover:bg-[#171713]',
                                                        colors.circle,
                                                        colors.glow,
                                                    )}
                                                >
                                                    {String(index + 1).padStart(2, '0')}
                                                </motion.div>
                                                <motion.div
                                                    initial={{ scaleY: 0 }}
                                                    whileInView={{ scaleY: 1 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.45, delay: 0.2 + index * 0.08 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[130px] h-[82px] w-2 origin-top -translate-x-1/2 rounded-full',
                                                        colors.line,
                                                    )}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.35, delay: 0.35 + index * 0.08 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[226px] h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[20px] border-x-transparent',
                                                        colors.arrowDown,
                                                    )}
                                                />
                                                <h3 className="absolute left-1/2 top-[280px] w-full max-w-[175px] -translate-x-1/2 text-lg font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-gold">
                                                    {title}
                                                </h3>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="absolute left-1/2 top-[82px] w-full max-w-[175px] -translate-x-1/2 text-lg font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-gold">
                                                    {title}
                                                </h3>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.35, delay: 0.25 + index * 0.08 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[174px] h-0 w-0 -translate-x-1/2 border-x-[14px] border-b-[20px] border-x-transparent',
                                                        colors.arrowUp,
                                                    )}
                                                />
                                                <motion.div
                                                    initial={{ scaleY: 0 }}
                                                    whileInView={{ scaleY: 1 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.45, delay: 0.35 + index * 0.08 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[212px] h-[82px] w-2 origin-bottom -translate-x-1/2 rounded-full',
                                                        colors.line,
                                                    )}
                                                />
                                                <motion.div
                                                    whileHover={{ scale: 1.08 }}
                                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                                    className={cn(
                                                        'absolute left-1/2 top-[286px] z-10 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-[10px] bg-white text-lg font-semibold transition-colors duration-300 group-hover:bg-[#fffaf0] dark:bg-[#111113] dark:group-hover:bg-[#171713]',
                                                        colors.circle,
                                                        colors.glow,
                                                    )}
                                                >
                                                    {String(index + 1).padStart(2, '0')}
                                                </motion.div>
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid gap-4 lg:hidden">
                    {copy.steps.map((title, index) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: index * 0.06 }}
                            whileTap={{ scale: 0.99 }}
                            className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-[1.25rem] border border-black/6 bg-white/80 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur transition-colors dark:border-white/10 dark:bg-white/[0.045]"
                        >
                            {index < copy.steps.length - 1 && (
                                <div className="absolute left-[43px] top-[72px] h-[calc(100%-42px)] w-px bg-border" />
                            )}
                            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-gold/35 bg-background text-sm font-semibold text-gold shadow-[0_12px_30px_-20px_rgba(197,160,89,0.85)]">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                            <h3 className="self-center text-lg font-semibold text-foreground">{title}</h3>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="mx-auto mt-12 max-w-4xl rounded-[1.5rem] border border-gold/18 bg-[linear-gradient(135deg,rgba(197,160,89,0.14),rgba(90,160,181,0.06),rgba(255,255,255,0.62))] p-6 text-center shadow-[0_24px_70px_-46px_rgba(197,160,89,0.42)] backdrop-blur md:p-8 dark:border-gold/20 dark:bg-[linear-gradient(135deg,rgba(197,160,89,0.12),rgba(131,197,216,0.08),rgba(255,255,255,0.04))]"
                >
                    <h3 className="text-2xl leading-tight text-foreground md:text-3xl">
                        {copy.finalTitle}
                    </h3>
                    <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                        {copy.finalDesc}
                    </p>
                    <div className="mt-7">
                        <Link
                            href="/quiz"
                            className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-gold px-7 text-sm font-semibold text-luxury-black shadow-[0_18px_42px_-28px_rgba(197,160,89,0.9)] transition-all hover:scale-[1.02] hover:shadow-[0_22px_54px_-30px_rgba(197,160,89,1)] md:text-base"
                        >
                            {copy.cta}
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
