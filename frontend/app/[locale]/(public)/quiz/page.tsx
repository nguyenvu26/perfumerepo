'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Gem,
  LogIn,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { QuizForm } from '@/components/quiz/QuizForm';
import { RecommendationCards } from '@/components/quiz/RecommendationCards';
import { QuizHistory } from '@/components/quiz/QuizHistory';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/lib/i18n';
import { quizService, type QuizAnswers, type QuizRecommendation } from '@/services/quiz.service';

type QuizState = 'intro' | 'quiz' | 'analyzing' | 'results' | 'history';

export default function QuizPage() {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<QuizState>('intro');
  const [recommendations, setRecommendations] = useState<QuizRecommendation[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageCopy = useMemo(
    () =>
      locale === 'vi'
        ? {
          introPanelTitle: 'Quy trình gợi ý',
          introPanelHeading: 'Khám Phá Mùi Hương Phù Hợp Với Bạn',
          introPanelText:
            'Trả lời 5 câu hỏi ngắn để hệ thống chắt lọc nhóm hương, dịp dùng và mức chi phù hợp với bạn.',
          introSummaryTitle: 'Bạn sẽ nhận được gì',
          introSummaryText:
            'Một shortlist rõ ràng, dễ so sánh và đủ thông tin để đi thẳng tới sản phẩm phù hợp.',
          introAssuranceTitle: 'Trải nghiệm dễ tiếp cận',
          introAssurance:
            'Không cần kiến thức chuyên sâu về nước hoa, chỉ cần chọn theo cảm nhận và nhu cầu thật của bạn.',
          heroMetrics: [
            { value: '05', label: 'Câu hỏi tinh gọn' },
            { value: '~02', label: 'Phút để hoàn tất' },
            { value: '01', label: 'Hồ sơ mùi hương rõ ràng' },
          ],
          analyzeTitle: 'Đang xây dựng hồ sơ mùi hương của bạn',
          analyzeText:
            'Hệ thống đang ghép câu trả lời với nhóm hương, độ lưu hương, dịp dùng và mức giá phù hợp nhất.',
          analyzeBadge: 'Đang phân tích',
          analyzePanelTitle: 'Tiến trình xử lý',
          analyzePanelText:
            'Mọi lựa chọn của bạn vẫn được giữ nguyên. Chúng tôi chỉ đang tinh chỉnh thứ tự gợi ý để danh sách cuối cùng rõ ràng và dễ chọn hơn.',
        }
        : {
          introPanelTitle: 'Recommendation flow',
          introPanelHeading: 'Curated by Perfume GPT',
          introPanelText:
            'Answer 5 short questions so we can narrow down scent family, occasion, longevity, and budget.',
          introSummaryTitle: 'What you will get',
          introSummaryText:
            'A clean shortlist that is easy to compare and detailed enough to move straight into product pages.',
          introAssuranceTitle: 'Easy to use',
          introAssurance:
            'No fragrance expertise required. Just answer based on your instinct, style, and daily routine.',
          heroMetrics: [
            { value: '05', label: 'Focused questions' },
            { value: '~02', label: 'Minutes to finish' },
            { value: '01', label: 'Refined scent profile' },
          ],
          analyzeTitle: 'Building your scent profile',
          analyzeText:
            'We are matching your answers against scent family, longevity, occasion, and budget signals.',
          analyzeBadge: 'Analyzing',
          analyzePanelTitle: 'Processing flow',
          analyzePanelText:
            'Your answers remain intact. We are only refining the shortlist so the final result feels clearer and easier to act on.',
        },
    [locale],
  );

  const ritualHighlights = [
    {
      icon: Sparkles,
      title: t('steps.gender.title'),
      description: t('steps.gender.subtitle'),
    },
    {
      icon: FlaskConical,
      title: t('steps.scent_family.title'),
      description: t('steps.scent_family.subtitle'),
    },
    {
      icon: Clock3,
      title: t('steps.longevity.title'),
      description: t('intro.time_estimate'),
    },
  ];

  const introBenefits = [
    {
      icon: ShieldCheck,
      title: pageCopy.introSummaryTitle,
      description: pageCopy.introSummaryText,
    },
    {
      icon: BadgeCheck,
      title: pageCopy.introAssuranceTitle,
      description: pageCopy.introAssurance,
    },
  ];

  const analysisSteps = [
    t('analyzing.step1'),
    t('analyzing.step2'),
    t('analyzing.step3'),
    t('analyzing.step4'),
  ];

  const handleStart = () => {
    setState('quiz');
  };

  const handleViewHistory = () => {
    setState('history');
  };

  const handleShowResultFromHistory = (recs: QuizRecommendation[], analysisText?: string) => {
    setRecommendations(recs);
    setAnalysis(analysisText || null);
    setState('results');
  };

  const handleSubmit = async (answers: QuizAnswers) => {
    setIsSubmitting(true);
    setError(null);
    setState('analyzing');

    try {
      const result = await quizService.submitQuiz(answers);
      setRecommendations(result.recommendations);
      setAnalysis(result.analysis);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setState('results');
    } catch (err: any) {
      console.error('Quiz submission failed:', err);
      setError(err.message || t('error.generic'));
      setState('quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setRecommendations([]);
    setAnalysis(null);
    setError(null);
    setState('quiz');
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.08),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(164,122,69,0.08),transparent_18%),linear-gradient(180deg,#fdfdfd_0%,#f8f7f4_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.16),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(164,122,69,0.18),transparent_18%),linear-gradient(180deg,#0b0c0f_0%,#07080a_100%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="pointer-events-none absolute left-[-12rem] top-24 h-[24rem] w-[24rem] rounded-full bg-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#8f6b3f]/10 blur-[140px]" />

      <main className="container-responsive relative z-10 pb-16 pt-16 sm:pt-20 lg:pb-24 lg:pt-28">
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.28 }}
                  className="group relative overflow-hidden rounded-[2.2rem] border border-border bg-card p-7 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_36px_90px_-50px_rgba(0,0,0,0.85)] sm:p-9 lg:p-12"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_38%)]" />
                  <div className="pointer-events-none absolute -right-16 top-8 h-60 w-60 rounded-full bg-gold/10 blur-[110px] transition-transform duration-500 group-hover:scale-110" />

                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
                      <Sparkles size={15} />
                      {t('intro.label')}
                    </div>

                    <div className="mt-7 max-w-4xl">
                      <h1 className="font-heading text-[clamp(3.1rem,6vw,5.6rem)] leading-[0.92] tracking-[-0.05em] text-foreground">
                        {t('intro.title')}
                      </h1>
                      <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                        {t('intro.description')}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      {isAuthenticated ? (
                        <>
                          <button
                            onClick={handleStart}
                            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#d6b36d,#b68948)] px-8 text-sm font-semibold text-luxury-black shadow-[0_22px_55px_-22px_rgba(197,160,89,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_75px_-24px_rgba(197,160,89,0.6)]"
                          >
                            <FlaskConical size={18} />
                            {locale === 'vi' ? 'Bắt Đầu Trả Lời' : 'Start Answering'}
                          </button>
                          <button
                            onClick={handleViewHistory}
                            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-border bg-secondary px-8 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-gold/5"
                          >
                            <Clock3 size={18} />
                            {locale === 'vi' ? 'Xem Lịch Sử' : 'View History'}
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#d6b36d,#b68948)] px-8 text-sm font-semibold text-luxury-black shadow-[0_22px_55px_-22px_rgba(197,160,89,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_75px_-24px_rgba(197,160,89,0.6)]"
                        >
                          <LogIn size={18} />
                          {t('intro.login_btn')}
                        </Link>
                      )}

                      <div className="inline-flex min-h-14 items-center rounded-full border border-border bg-secondary px-5 text-sm text-[#d2ccc2] backdrop-blur">
                        {t('intro.time_estimate')}
                      </div>
                    </div>

                    {!isAuthenticated && (
                      <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                        {t('intro.login_required')}
                      </p>
                    )}

                    <div className="mt-10 grid gap-4 lg:grid-cols-3">
                      {pageCopy.heroMetrics.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
                          whileHover={{ y: -4 }}
                          className="rounded-[1.5rem] border border-border bg-secondary px-5 py-5 backdrop-blur"
                        >
                          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-4 font-heading text-3xl leading-none tracking-[-0.04em] text-foreground">
                            {item.value}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-10 grid gap-4 lg:grid-cols-3">
                      {ritualHighlights.map((item, index) => {
                        const Icon = item.icon;

                        return (
                          <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.16 + index * 0.08, duration: 0.35 }}
                            whileHover={{ y: -4 }}
                            className="rounded-[1.7rem] border border-border bg-card p-5"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gold/10 text-gold">
                              <Icon size={20} strokeWidth={1.7} />
                            </div>
                            <p className="mt-4 text-base font-semibold text-foreground">{item.title}</p>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                <div className="grid gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-[2.2rem] border border-gold/20 bg-card p-7 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_36px_90px_-50px_rgba(0,0,0,0.85)] lg:p-9"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_24%)]" />

                    <div className="relative flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm font-medium text-gold">{pageCopy.introPanelTitle}</p>
                        <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3.1rem)] leading-[1.02] tracking-[-0.04em] text-foreground">
                          {pageCopy.introPanelHeading}
                        </h2>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-gold/20 bg-secondary text-gold">
                        <ScanSearch size={22} />
                      </div>
                    </div>

                    <p className="relative mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
                      {pageCopy.introPanelText}
                    </p>

                    <div className="relative mt-8 space-y-4">
                      {analysisSteps.slice(0, 3).map((item, index) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12 + index * 0.1, duration: 0.35 }}
                          whileHover={{ x: 4 }}
                          className="flex items-start gap-4 rounded-[1.35rem] border border-border bg-secondary px-4 py-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-semibold text-luxury-black">
                            {index + 1}
                          </div>
                          <p className="pt-0.5 text-sm leading-7 text-foreground">{item}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="relative mt-7 rounded-[1.5rem] border border-border bg-secondary px-5 py-4">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                        {t('results.ai_picked')}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-foreground">
                        {pageCopy.introAssurance}
                      </p>
                    </div>
                  </motion.div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {introBenefits.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 + index * 0.08, duration: 0.35 }}
                          whileHover={{ y: -4 }}
                          className="rounded-[1.8rem] border border-border bg-card p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_70px_-48px_rgba(0,0,0,0.9)]"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-gold/10 text-gold">
                            <Icon size={20} strokeWidth={1.75} />
                          </div>
                          <p className="mt-4 text-base font-semibold text-foreground">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {state === 'quiz' && (
            <motion.section
              key="quiz"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mb-6 max-w-4xl rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-100 shadow-[0_26px_60px_-40px_rgba(239,68,68,0.5)]"
                >
                  {error}
                </motion.div>
              ) : null}

              <QuizForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </motion.section>
          )}

          {state === 'analyzing' && (
            <motion.section
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto w-full max-w-[1440px]"
            >
              <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42 }}
                  className="relative overflow-hidden rounded-[2.2rem] border border-border bg-card p-7 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_90px_-54px_rgba(0,0,0,0.88)] lg:p-10"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.16),transparent_30%)]" />
                  <div className="pointer-events-none absolute right-8 top-8 h-32 w-32 rounded-full bg-gold/10 blur-[70px]" />

                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
                      <Sparkles size={15} />
                      {pageCopy.analyzeBadge}
                    </div>

                    <h2 className="mt-6 max-w-2xl font-heading text-[clamp(2.35rem,4vw,4rem)] leading-[0.96] tracking-[-0.04em] text-foreground">
                      {pageCopy.analyzeTitle}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                      {pageCopy.analyzeText}
                    </p>

                    <div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.8, ease: 'easeInOut' }}
                        className="h-full rounded-full bg-gold-btn-gradient"
                      />
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {pageCopy.heroMetrics.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + index * 0.08, duration: 0.3 }}
                          className="rounded-[1.4rem] border border-border bg-secondary px-4 py-4"
                        >
                          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-3 font-heading text-2xl text-foreground">{item.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border border-border bg-secondary px-5 py-5">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                        {pageCopy.analyzePanelTitle}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-foreground">{pageCopy.analyzePanelText}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.06 }}
                  className="relative overflow-hidden rounded-[2.2rem] border border-border bg-card p-7 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_90px_-54px_rgba(0,0,0,0.88)] lg:p-10"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_36%)]" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gold">{pageCopy.analyzePanelTitle}</p>
                        <h3 className="mt-3 font-heading text-3xl leading-tight tracking-[-0.03em] text-foreground">
                          {t('results.ai_picked')}
                        </h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-border bg-secondary text-gold">
                        <Gem size={20} />
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      {analysisSteps.map((item, index) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.16, duration: 0.35 }}
                          className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-secondary px-5 py-5"
                        >
                          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-semibold text-luxury-black">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
                              <p className="text-sm leading-7 text-foreground">{item}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-7 rounded-[1.5rem] border border-gold/20 bg-gold/10 px-5 py-5">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-gold" />
                        <p className="text-sm leading-7 text-foreground">{t('analyzing.message')}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>
          )}

          {state === 'results' && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <RecommendationCards 
                recommendations={recommendations} 
                analysis={analysis}
                onRetake={handleRetake} 
              />
            </motion.section>
          )}

          {state === 'history' && (
            <motion.section
              key="history"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <QuizHistory onViewResult={handleShowResultFromHistory} onBack={() => setState('intro')} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
