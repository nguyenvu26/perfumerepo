'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { QuizForm } from '@/components/quiz/QuizForm';
import { RecommendationCards } from '@/components/quiz/RecommendationCards';
import { QuizHistory } from '@/components/quiz/QuizHistory';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/lib/i18n';
import { quizService, type QuizAnswers, type QuizRecommendation } from '@/services/quiz.service';
import { ProcessTimeline } from '@/components/quiz/ProcessTimeline';
import { cn } from '@/lib/utils';


type QuizState = 'intro' | 'quiz' | 'analyzing' | 'results' | 'history';

export default function QuizPage() {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const isVi = locale === 'vi';
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<QuizState>('intro');
  const [recommendations, setRecommendations] = useState<QuizRecommendation[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [lastAnswers, setLastAnswers] = useState<QuizAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      isVi
        ? {
          eyebrow: 'Tư vấn chọn mùi',
          title: 'Tìm nước hoa phù hợp với phong cách của bạn',
          description:
            'Một buổi tư vấn ngắn giúp bạn xác định nhóm hương, dịp sử dụng, mức giá và độ lưu hương phù hợp trước khi mua.',
          start: 'Bắt đầu tư vấn',
          history: 'Xem lịch sử',
          login: 'Đăng nhập để bắt đầu',
          loginNote: 'Bạn cần đăng nhập để lưu kết quả tư vấn và xem lại các lần chọn trước.',
          duration: 'Khoảng 2 phút',
          questions: '5 câu hỏi',
          outcome: 'Gợi ý rõ ràng',
          sideLabel: 'Nội dung tư vấn',
          sideTitle: 'Một quy trình ngắn, dễ trả lời và dễ ra quyết định.',
          sideDescription:
            'Bạn chỉ cần chọn theo cảm nhận thực tế. Kết quả sẽ ưu tiên các sản phẩm dễ so sánh và phù hợp với nhu cầu đã chọn.',
          steps: [
            'Xác định người dùng và hoàn cảnh sử dụng',
            'Thu hẹp nhóm hương bạn dễ yêu thích',
            'Chọn mức giá và độ lưu hương mong muốn',
            'Nhận danh sách sản phẩm phù hợp để xem chi tiết',
          ],
          noteTitle: 'Lời khuyên từ Perfume GPT',
          note:
            'Nếu bạn chưa quen với nước hoa, hãy chọn theo cảm giác thường ngày: đi làm, đi chơi, hẹn hò hoặc dùng hằng ngày. Kết quả sẽ dễ chính xác hơn.',
          benefitTitle: 'Bạn sẽ nhận được',
          benefits: [
            'Danh sách nước hoa phù hợp với nhu cầu',
            'Lý do gợi ý ngắn gọn, dễ hiểu',
            'Đường dẫn để xem chi tiết và mua hàng',
          ],
          analyzingTitle: 'Đang chuẩn bị gợi ý cho bạn',
          analyzingText:
            'Chúng tôi đang sắp xếp lại lựa chọn theo nhóm hương, dịp dùng, mức giá và độ lưu hương bạn vừa chọn.',
          analyzingNote:
            'Kết quả cuối cùng sẽ tập trung vào những sản phẩm dễ mua, dễ so sánh và phù hợp nhất với hồ sơ tư vấn.',
        }
        : {
          eyebrow: 'Fragrance consultation',
          title: 'Find a fragrance that fits your style',
          description:
            'A short consultation helps define scent family, occasion, budget, and longevity before you buy.',
          start: 'Start consultation',
          history: 'View history',
          login: 'Sign in to start',
          loginNote: 'Sign in to save consultation results and revisit previous sessions.',
          duration: 'About 2 minutes',
          questions: '5 questions',
          outcome: 'Clear shortlist',
          sideLabel: 'Consultation flow',
          sideTitle: 'A short process that is easy to answer and act on.',
          sideDescription:
            'Choose based on your real preferences. The result prioritizes products that are easy to compare and relevant to your needs.',
          steps: [
            'Define wearer and wearing context',
            'Narrow down preferred scent families',
            'Set budget and longevity expectations',
            'Receive a focused product shortlist',
          ],
          noteTitle: 'Consultant note',
          note:
            'If you are new to fragrance, answer from daily use cases: work, casual wear, dates, or special occasions. The result will be easier to trust.',
          benefitTitle: 'What you get',
          benefits: [
            'A shortlist matched to your needs',
            'Concise reasons for each recommendation',
            'Direct paths to product detail and checkout',
          ],
          analyzingTitle: 'Preparing your recommendations',
          analyzingText:
            'We are organizing your choices by scent family, occasion, budget, and longevity.',
          analyzingNote:
            'The final result will focus on products that are easy to buy, easy to compare, and closest to your consultation profile.',
        },
    [isVi],
  );

  const handleStart = () => setState('quiz');
  const handleViewHistory = () => setState('history');

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
      setLastAnswers(answers);
      const result = await quizService.submitQuiz(answers);
      setRecommendations(result.recommendations);
      setAnalysis(result.analysis);
      await new Promise((resolve) => setTimeout(resolve, 2200));
      setState('results');
    } catch (err: unknown) {
      setError((err as Error).message || t('error.generic'));
      setState('quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setRecommendations([]);
    setAnalysis(null);
    setLastAnswers(null);
    setError(null);
    setState('quiz');
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfaf7_0%,#ffffff_45%,#f6f1e8_100%)] text-foreground transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#11100d_52%,#09090b_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(197,160,89,0.16),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(118,151,132,0.12),transparent_22%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(197,160,89,0.13),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(118,151,132,0.1),transparent_22%)]" />

      <main className="container-responsive relative z-10 pb-16 pt-16 sm:pt-20 lg:pb-24 lg:pt-28">
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.section
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Hero Section */}
              <div className="text-center max-w-4xl mx-auto px-4 mb-16">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-base font-bold uppercase tracking-[0.4em] text-gold mb-6"
                >
                  {copy.eyebrow}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.7 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-heading leading-[1.05] tracking-tight text-foreground mb-8"
                >
                  {copy.title.split(' ').map((word, i) => (
                    <span key={i} className={cn(i > 2 && "gold-gradient block sm:inline")}>
                      {word}{' '}
                    </span>
                  ))}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
                >
                  {copy.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={handleStart}
                        className="group relative inline-flex min-h-16 items-center justify-center gap-3 rounded-full bg-gold px-10 text-base font-bold text-luxury-black shadow-[0_20px_50px_-15px_rgba(197,160,89,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_25px_60px_-15px_rgba(197,160,89,0.7)] active:scale-95"
                      >
                        {copy.start}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button
                        onClick={handleViewHistory}
                        className="inline-flex min-h-16 items-center justify-center rounded-full border-2 border-gold/20 bg-background/50 backdrop-blur-sm px-10 text-base font-bold text-foreground transition-all hover:border-gold hover:text-gold active:scale-95"
                      >
                        {copy.history}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <Link
                        href="/login"
                        className="group relative inline-flex min-h-16 items-center justify-center gap-3 rounded-full bg-gold px-10 text-base font-bold text-luxury-black shadow-[0_20px_50px_-15px_rgba(197,160,89,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_25px_60px_-15px_rgba(197,160,89,0.7)]"
                      >
                        {copy.login}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                      <p className="text-sm text-muted-foreground max-w-xs">{copy.loginNote}</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Info Bar */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-24 px-4"
              >
                {[
                  { label: copy.questions, icon: "01" },
                  { label: copy.duration, icon: "02" },
                  { label: copy.outcome, icon: "03" }
                ].map((item, index) => (
                  <div key={index} className="group relative p-6 rounded-3xl border border-gold/10 bg-white/20 dark:bg-white/5 backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-white/60 dark:hover:bg-white/10">
                    <span className="absolute top-4 right-6 text-4xl font-heading font-bold text-gold/100 group-hover:text-gold/150 transition-colors">
                      {item.icon}
                    </span>

                    <p className="text-lg font-semibold text-foreground mt-2">{item.label}</p>
                    <div className="h-1 w-8 bg-gold mt-4 rounded-full transition-all group-hover:w-16" />
                  </div>
                ))}
              </motion.div>

              {/* Process Timeline Section */}
              <div className="w-full bg-stone-50 dark:bg-zinc-950/50 py-24 mb-24 relative overflow-hidden border-y border-gold/5">

                <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-[120px]" />
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-[120px]" />
                </div>

                <div className="container-responsive relative z-10 text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-heading mb-6">{copy.sideTitle}</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">{copy.sideDescription}</p>
                </div>

                <ProcessTimeline steps={copy.steps} className="container-responsive" />
              </div>

              {/* Supplemental Info */}
              <div className="container-responsive grid gap-8 md:grid-cols-2 max-w-5xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2rem] border border-gold/10 bg-white/40 dark:bg-white/5 backdrop-blur-md"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm">✦</span>
                    {copy.benefitTitle}
                  </h3>
                  <ul className="space-y-4">
                    {copy.benefits.map((benefit, i) => (
                      <li key={i} className="flex gap-4 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2rem] border border-secondary/10 bg-secondary/5 backdrop-blur-md"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-sm">?</span>
                    {copy.noteTitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{copy.note}"
                  </p>
                </motion.div>
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
                  className="mx-auto mb-6 max-w-4xl rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-500"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45 }}
              className="mx-auto max-w-4xl rounded-[1.8rem] border border-black/6 bg-white/78 p-8 text-center shadow-[0_26px_80px_-58px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/[0.045] md:p-12"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">{copy.eyebrow}</p>
              <h2 className="mt-5 text-4xl leading-tight text-foreground md:text-5xl">{copy.analyzingTitle}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                {copy.analyzingText}
              </p>

              <div className="mx-auto mt-9 h-2 max-w-xl overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                  className="h-full rounded-full bg-gold"
                />
              </div>

              <div className="mx-auto mt-9 grid max-w-2xl gap-3 text-left">
                {copy.steps.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.12, duration: 0.35 }}
                    className="flex gap-3 rounded-[1rem] border border-black/6 bg-background/72 px-4 py-4 dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>

              <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-muted-foreground">{copy.analyzingNote}</p>
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
                answers={lastAnswers || undefined}
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
