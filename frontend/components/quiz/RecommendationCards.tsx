'use client';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Gem,
  RotateCcw,
  Sparkles,
  Tag,
} from 'lucide-react';

import { Link } from '@/lib/i18n';
import { type QuizRecommendation } from '@/services/quiz.service';

interface RecommendationCardsProps {
  recommendations: QuizRecommendation[];
  analysis?: string | null;
  onRetake: () => void;
}

export function RecommendationCards({ recommendations, analysis, onRetake }: RecommendationCardsProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();

  const copy =
    locale === 'vi'
      ? {
          matchingLabel: 'Mức độ phù hợp',
          matchingDetail: 'Độ khớp ước tính dựa trên hồ sơ hiện tại.',
          featuredLabel: 'Lựa chọn nổi bật',
          featuredDetail: 'Gợi ý dẫn đầu trong shortlist dành cho bạn.',
          summaryLabel: 'Số gợi ý',
          summaryDetail: 'Danh sách đã được tinh lọc để dễ so sánh.',
          collectionLabel: 'Các lựa chọn tiếp theo',
          collectionDetail: 'Những gợi ý còn lại vẫn bám sát gu mùi và nhu cầu sử dụng của bạn.',
          featuredReasonLabel: 'Vì sao phù hợp',
          fallbackPriceSuffix: 'đ',
        }
      : {
          matchingLabel: 'Match level',
          matchingDetail: 'Estimated alignment based on the current profile.',
          featuredLabel: 'Featured selection',
          featuredDetail: 'The leading recommendation inside your shortlist.',
          summaryLabel: 'Recommendations',
          summaryDetail: 'The list has been refined for easier comparison.',
          collectionLabel: 'More curated matches',
          collectionDetail: 'The remaining recommendations still stay close to your taste and intended use.',
          featuredReasonLabel: 'Why it fits',
          fallbackPriceSuffix: 'VND',
        };

  const formatPrice = (price: number | string) => {
    const amount = Number(price || 0);

    return `${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(amount)} ${copy.fallbackPriceSuffix}`;
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-8 text-center shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_36px_90px_-54px_rgba(0,0,0,0.88)] lg:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gold/10 text-gold">
            <Sparkles size={32} />
          </div>
          <h3 className="mt-6 font-heading text-3xl tracking-[-0.03em] text-foreground">{t('results.no_results_title')}</h3>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-muted-foreground">{t('results.no_results_desc')}</p>
          <button
            onClick={onRetake}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c5a059]/22 bg-gold/10 px-8 text-sm font-semibold text-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/10"
          >
            <RotateCcw size={16} />
            {t('results.retake')}
          </button>
        </div>
      </div>
    );
  }

  const [featured, ...rest] = recommendations;

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_38px_100px_-58px_rgba(0,0,0,0.9)] lg:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.14),transparent_28%)]" />
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-48 w-48 rounded-full bg-gold/10 blur-[90px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
              <Sparkles size={15} />
              {t('results.ai_picked')}
            </div>
            <h2 className="mt-5 font-heading text-[clamp(2.4rem,4vw,4.3rem)] leading-[0.94] tracking-[-0.05em] text-foreground">
              {t('results.title')}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{t('results.subtitle')}</p>
          </div>

          <button
            onClick={onRetake}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-6 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold"
          >
            <RotateCcw size={16} />
            {t('results.retake')}
          </button>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border bg-secondary px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{copy.summaryLabel}</p>
            <p className="mt-3 font-heading text-4xl leading-none tracking-[-0.04em] text-foreground">
              {recommendations.length.toString().padStart(2, '0')}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.summaryDetail}</p>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-secondary px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{copy.featuredLabel}</p>
            <p className="mt-3 text-xl font-semibold text-foreground">{featured.name}</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.featuredDetail}</p>
          </div>

          <div className="rounded-[1.5rem] border border-gold/20 bg-gold/10 px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{copy.matchingLabel}</p>
            <p className="mt-3 font-heading text-4xl leading-none tracking-[-0.04em] text-foreground">
              {featured.matchScore ? Math.min(99.9, Math.round((featured.matchScore / 120) * 100 * 10) / 10) : 98.4}%
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.matchingDetail}</p>
          </div>
        </div>
      </motion.section>

      <motion.article
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06 }}
        className="mt-6 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_100px_-60px_rgba(0,0,0,0.9)]"
      >
        <div className="grid h-full gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[340px] overflow-hidden bg-secondary lg:min-h-[480px]">
            {featured.imageUrl ? (
              <img
                src={featured.imageUrl}
                alt={featured.name}
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold/5 via-secondary to-secondary dark:from-gold/10 text-gold">
                <Sparkles size={54} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/25 px-4 py-2 text-sm text-foreground backdrop-blur">
              <CheckCircle2 size={15} className="text-gold" />
              {copy.featuredLabel}
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              {featured.brand ? <p className="text-sm text-white/70">{featured.brand}</p> : null}
              <h3 className="mt-2 font-heading text-4xl leading-[0.95] tracking-[-0.04em] text-foreground lg:text-5xl">
                {featured.name}
              </h3>
            </div>
          </div>

          <div className="flex flex-col p-6 lg:p-8 xl:p-10">
            <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gold">{t('results.ai_picked')}</p>
                <p className="mt-2 font-heading text-4xl tracking-[-0.04em] text-foreground">{formatPrice(featured.price)}</p>
              </div>

              <Link
                href={`/products/${featured.productId}`}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c5a059]/28 hover:text-gold"
              >
                <ArrowUpRight size={24} />
              </Link>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-border bg-secondary px-5 py-5">
              <div className="flex items-center gap-3">
                <Gem size={18} className="text-gold" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{copy.featuredReasonLabel}</p>
              </div>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{featured.reason}</p>
            </div>

            {featured.tags && featured.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <Tag size={12} className="text-gold" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">{copy.collectionDetail}</p>

              <Link
                href={`/products/${featured.productId}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#d6b36d,#b68948)] px-6 text-sm font-semibold text-luxury-black shadow-[0_24px_55px_-24px_rgba(197,160,89,0.55)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <ExternalLink size={16} />
                {t('results.view_detail')}
              </Link>
            </div>
          </div>
        </div>
      </motion.article>

      {rest.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{copy.collectionLabel}</p>
              <h3 className="mt-2 font-heading text-3xl tracking-[-0.03em] text-foreground">{copy.featuredLabel}</h3>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{copy.collectionDetail}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((rec, index) => (
              <motion.article
                key={rec.productId}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                whileHover={{ y: -6 }}
                className="overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]"
              >
                <div className="relative min-h-[220px] overflow-hidden bg-secondary">
                  {rec.imageUrl ? (
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gold">
                      <Sparkles size={30} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {rec.brand ? (
                    <div className="absolute left-4 top-4 rounded-full border border-white/14 bg-secondary px-3 py-1.5 text-sm text-foreground backdrop-blur shadow-md">
                      {rec.brand}
                    </div>
                  ) : null}
                  {rec.matchScore ? (
                    <div className="absolute right-4 top-4 rounded-full border border-gold/30 bg-gold/90 px-2.5 py-1 text-xs font-bold text-luxury-black backdrop-blur shadow-lg flex items-center gap-1">
                      <Sparkles size={10} />
                      {Math.min(99, Math.round((rec.matchScore / 120) * 100))}% Match
                    </div>
                  ) : null}
                </div>

                <div className="p-5">
                  <h4 className="font-heading text-2xl leading-tight tracking-[-0.03em] text-foreground">{rec.name}</h4>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted-foreground">{rec.reason}</p>

                  {rec.tags && rec.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {rec.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground"
                        >
                          <Tag size={10} className="text-gold" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-lg font-semibold text-foreground">{formatPrice(rec.price)}</p>
                    <Link
                      href={`/products/${rec.productId}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-secondary px-4 text-sm font-medium text-foreground transition-all duration-300 hover:border-gold/20 hover:text-gold"
                    >
                      {t('results.view_detail')}
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
