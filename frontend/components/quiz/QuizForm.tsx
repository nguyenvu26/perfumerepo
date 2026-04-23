'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Briefcase,
  CalendarHeart,
  Check,
  Clock,
  Flame,
  Flower2,
  Heart,
  Hourglass,
  type LucideIcon,
  PartyPopper,
  Sparkles,
  Star,
  Timer,
  TreePine,
  User,
  Users,
  Wallet,
  Wind,
  Zap,
  Leaf,
} from 'lucide-react';

import { type QuizAnswers } from '@/services/quiz.service';

interface QuizOption {
  label: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
}

interface QuizStep {
  id: number;
  titleKey: string;
  subtitleKey: string;
  key: keyof QuizAnswers;
  stepIcon: LucideIcon;
  options: QuizOption[];
}

interface QuizFormProps {
  onSubmit: (answers: QuizAnswers) => void;
  isSubmitting: boolean;
}

export function QuizForm({ onSubmit, isSubmitting }: QuizFormProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const helperCopy = useMemo(
    () =>
      locale === 'vi'
        ? {
          progressLabel: 'Tiến độ hồ sơ',
          currentLabel: 'Đang trả lời',
          selectionsLabel: 'Tóm tắt lựa chọn',
          pendingLabel: 'Trạng thái hiện tại',
          pickHint: 'Chọn một phương án để chuyển sang bước tiếp theo.',
          answerPlaceholder: 'Chưa chọn',
          selectedLabel: 'Đã chọn',
          nextLabel: 'Bước kế tiếp',
          nextFallback: 'Hoàn tất để nhận shortlist',
          stageLabel: 'Lộ trình gợi ý',
          summaryHint: 'Mỗi lựa chọn đều được dùng để tinh chỉnh danh sách gợi ý cuối cùng.',
          submittingLabel: 'Hệ thống đang gửi hồ sơ mùi hương của bạn...',
          durationLabel: 'Khoảng 2 phút để hoàn tất',
          backHint: 'Bạn có thể quay lại bước trước để thay đổi lựa chọn.',
          completedLabel: 'Đã hoàn thành',
        }
        : {
          progressLabel: 'Profile progress',
          currentLabel: 'Current step',
          selectionsLabel: 'Selection summary',
          pendingLabel: 'Current status',
          pickHint: 'Choose one option to move to the next step.',
          answerPlaceholder: 'Not selected',
          selectedLabel: 'Selected',
          nextLabel: 'Up next',
          nextFallback: 'Finish to receive the shortlist',
          stageLabel: 'Recommendation flow',
          summaryHint: 'Each answer is used to refine the final shortlist.',
          submittingLabel: 'Sending your scent profile to the system...',
          durationLabel: 'About 2 minutes to finish',
          backHint: 'You can return to the previous step and adjust your selection.',
          completedLabel: 'Completed',
        },
    [locale],
  );

  const optionNotes = useMemo<Record<string, Record<string, string>>>(
    () =>
      locale === 'vi'
        ? {
          gender: {
            MALE: 'Tập trung vào cảm giác nam tính, chỉn chu và lịch lãm.',
            FEMALE: 'Ưu tiên nét mềm mại, thanh lịch và nữ tính hơn.',
            UNISEX: 'Giữ sự cân bằng để dễ dùng và linh hoạt trong nhiều dịp.',
          },
          occasion: {
            daily: 'Thiên về cảm giác sạch sẽ, dễ dùng và không gây mệt.',
            office: 'Ưu tiên sự chuyên nghiệp, gọn gàng và tinh tế.',
            date: 'Nghiêng về độ cuốn hút và cảm giác gần gũi hơn.',
            party: 'Phù hợp môi trường đông người với cá tính rõ ràng.',
            special_event: 'Dành cho những dịp cần dấu ấn nổi bật hơn thường ngày.',
          },
          budgetMin: {
            '0-500000': 'Mức dễ tiếp cận, phù hợp để bắt đầu tìm đúng gu.',
            '500000-1000000': 'Khoảng giá cân bằng giữa chất lượng và độ linh hoạt.',
            '1000000-2000000': 'Phù hợp nếu bạn muốn trải nghiệm cao cấp hơn.',
            '2000000-5000000': 'Tập trung vào các lựa chọn có chiều sâu và hoàn thiện tốt.',
            '5000000-99999999': 'Dành cho trải nghiệm sưu tầm hoặc gu mùi nổi bật.',
          },
          preferredFamily: {
            Fresh: 'Sáng, sạch, dễ chịu và phù hợp nhiều hoàn cảnh sử dụng.',
            Floral: 'Mềm mại, nữ tính hoặc thanh lịch tùy cách phối tầng hương.',
            Woody: 'Ấm, sang, có chiều sâu và thường tạo cảm giác trưởng thành.',
            Oriental: 'Đậm hơn, bí ẩn hơn và để lại dấu ấn rõ ràng.',
            Aromatic: 'Thảo mộc, xanh và có cảm giác gọn gàng, hiện đại.',
          },
          longevity: {
            light: 'Phù hợp nhu cầu nhẹ nhàng, thoáng và dễ làm mới trong ngày.',
            moderate: 'Cân bằng giữa độ hiện diện và sự dễ chịu khi dùng thường xuyên.',
            long_lasting: 'Giữ mùi đủ lâu cho ngày dài hoặc các cuộc hẹn quan trọng.',
            very_long: 'Ưu tiên độ bám tỏa rõ rệt và cảm giác đậm dấu ấn hơn.',
          },
        }
        : {
          gender: {
            MALE: 'Leans into a clean, tailored, and masculine profile.',
            FEMALE: 'Prioritizes a softer, elegant, and more feminine feel.',
            UNISEX: 'Keeps the profile balanced and versatile across occasions.',
          },
          occasion: {
            daily: 'Aims for something clean, easy to wear, and never tiring.',
            office: 'Keeps the tone polished, composed, and understated.',
            date: 'Moves toward a more intimate and magnetic impression.',
            party: 'Built for energy, presence, and clearer personality.',
            special_event: 'Reserved for moments that call for extra impact.',
          },
          budgetMin: {
            '0-500000': 'Accessible options to start defining your taste.',
            '500000-1000000': 'A balanced zone between quality and flexibility.',
            '1000000-2000000': 'Ideal if you want a more premium experience.',
            '2000000-5000000': 'Focused on depth, richness, and better finish.',
            '5000000-99999999': 'Best for collectors or standout signatures.',
          },
          preferredFamily: {
            Fresh: 'Bright, clean, and easy to wear in most routines.',
            Floral: 'Soft, elegant, and expressive depending on composition.',
            Woody: 'Warm, refined, and usually more grounded in character.',
            Oriental: 'Deeper, richer, and more memorable in presence.',
            Aromatic: 'Herbal, green, and clean with a modern edge.',
          },
          longevity: {
            light: 'Best for a softer, airy presence during the day.',
            moderate: 'Balanced for comfort and steady presence.',
            long_lasting: 'Suitable for long workdays and important plans.',
            very_long: 'Prioritizes stronger projection and lasting impact.',
          },
        },
    [locale],
  );

  const steps: QuizStep[] = [
    {
      id: 1,
      titleKey: 'steps.gender.title',
      subtitleKey: 'steps.gender.subtitle',
      key: 'gender',
      stepIcon: User,
      options: [
        { label: t('steps.gender.options.male'), value: 'MALE', icon: User },
        { label: t('steps.gender.options.female'), value: 'FEMALE', icon: Heart },
        { label: t('steps.gender.options.unisex'), value: 'UNISEX', icon: Users },
      ],
    },
    {
      id: 2,
      titleKey: 'steps.occasion.title',
      subtitleKey: 'steps.occasion.subtitle',
      key: 'occasion',
      stepIcon: Briefcase,
      options: [
        { label: t('steps.occasion.options.daily'), value: 'daily', icon: Star },
        { label: t('steps.occasion.options.office'), value: 'office', icon: Briefcase },
        { label: t('steps.occasion.options.date'), value: 'date', icon: CalendarHeart },
        { label: t('steps.occasion.options.party'), value: 'party', icon: PartyPopper },
        { label: t('steps.occasion.options.special_event'), value: 'special_event', icon: Sparkles },
      ],
    },
    {
      id: 3,
      titleKey: 'steps.budget.title',
      subtitleKey: 'steps.budget.subtitle',
      key: 'budgetMin',
      stepIcon: Wallet,
      options: [
        { label: t('steps.budget.options.under_500k'), value: '0-500000', icon: Wallet },
        { label: t('steps.budget.options.500k_1m'), value: '500000-1000000', icon: Wallet },
        { label: t('steps.budget.options.1m_2m'), value: '1000000-2000000', icon: Wallet },
        { label: t('steps.budget.options.2m_5m'), value: '2000000-5000000', icon: Wallet },
        { label: t('steps.budget.options.over_5m'), value: '5000000-99999999', icon: Wallet },
      ],
    },
    {
      id: 4,
      titleKey: 'steps.scent_family.title',
      subtitleKey: 'steps.scent_family.subtitle',
      key: 'preferredFamily',
      stepIcon: Flower2,
      options: [
        { label: t('steps.scent_family.options.fresh'), value: 'Fresh', icon: Wind },
        { label: t('steps.scent_family.options.floral'), value: 'Floral', icon: Flower2 },
        { label: t('steps.scent_family.options.woody'), value: 'Woody', icon: TreePine },
        { label: t('steps.scent_family.options.oriental'), value: 'Oriental', icon: Flame },
        { label: t('steps.scent_family.options.aromatic'), value: 'Aromatic', icon: Leaf },
      ],
    },
    {
      id: 5,
      titleKey: 'steps.longevity.title',
      subtitleKey: 'steps.longevity.subtitle',
      key: 'longevity',
      stepIcon: Timer,
      options: [
        { label: t('steps.longevity.options.light'), value: 'light', icon: Clock },
        { label: t('steps.longevity.options.moderate'), value: 'moderate', icon: Timer },
        { label: t('steps.longevity.options.long_lasting'), value: 'long_lasting', icon: Hourglass },
        { label: t('steps.longevity.options.very_long'), value: 'very_long', icon: Zap },
      ],
    },
  ];

  const totalSteps = steps.length;
  const currentStep = steps[step];
  const currentChoice = answers[currentStep.key];
  const progress = ((step + 1) / totalSteps) * 100;
  const completedCount = steps.filter((item) => Boolean(answers[item.key])).length;
  const nextStep = steps[step + 1] ?? null;
  const CurrentStepIcon = currentStep.stepIcon;

  const selectionSummary = steps.map((item) => {
    const selectedValue = answers[item.key];
    const selectedOption = item.options.find((option) => option.value === selectedValue);

    return {
      id: item.id,
      title: t(item.titleKey),
      value: selectedOption?.label ?? helperCopy.answerPlaceholder,
      completed: Boolean(selectedOption),
    };
  });

  const currentSelectionLabel =
    currentStep.options.find((option) => option.value === currentChoice)?.label ??
    helperCopy.answerPlaceholder;

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentStep.key]: value };
    setAnswers(newAnswers);

    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    const quizAnswers: QuizAnswers = {
      gender: (newAnswers.gender as QuizAnswers['gender']) || undefined,
      occasion: newAnswers.occasion || undefined,
      preferredFamily: newAnswers.preferredFamily || undefined,
      longevity: newAnswers.longevity || undefined,
    };

    const budgetVal = newAnswers.budgetMin;
    if (budgetVal) {
      const [min, max] = budgetVal.split('-').map(Number);
      quizAnswers.budgetMin = min;
      quizAnswers.budgetMax = max;
    }

    onSubmit(quizAnswers);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const getGridClass = (count: number) => {
    if (count <= 3) return 'grid-cols-1 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
    if (count === 5) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5';
    return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  };

  const getOptionNote = (stepKey: keyof QuizAnswers, value: string) =>
    optionNotes[String(stepKey)]?.[value] ?? '';

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-border bg-card p-5 xl:sticky xl:top-24 xl:self-start sm:p-6">
          <p className="text-sm text-muted-foreground">{helperCopy.currentLabel}</p>
          <p className="mt-1 font-heading text-5xl leading-none text-foreground">{String(step + 1).padStart(2, '0')}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-[linear-gradient(90deg,#8f6b3f,#d6b36d,#f0d7a1)]"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{Math.round(progress)}%</p>
          <div className="mt-5 space-y-2">
            {selectionSummary.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary p-3">
                <p className="text-xs text-muted-foreground">{item.title}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-border bg-card p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold">
            <CurrentStepIcon size={14} />
            {t('step_label')} {currentStep.id} / {totalSteps}
          </div>
          <h2 className="mt-4 font-heading text-4xl text-foreground">{t(currentStep.titleKey)}</h2>
          <p className="mt-2 text-base text-muted-foreground">{t(currentStep.subtitleKey)}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className={`mt-6 grid gap-4 ${getGridClass(currentStep.options.length)}`}
            >
              {currentStep.options.map((opt, index) => {
                const Icon = opt.icon;
                const isSelected = answers[currentStep.key] === opt.value;
                const supportText = opt.description || getOptionNote(currentStep.key, opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    disabled={isSubmitting}
                    className={`rounded-[1.4rem] border p-5 text-left transition-all ${
                      isSelected ? 'border-gold bg-gold/5' : 'border-border bg-secondary hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {Icon ? <Icon size={18} /> : null}
                        <p className="text-base font-semibold text-foreground">{opt.label}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{supportText}</p>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">{isSubmitting ? helperCopy.submittingLabel : helperCopy.pickHint}</p>
            {step > 0 ? (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-secondary px-5 text-sm font-medium text-foreground"
              >
                <ArrowLeft size={16} />
                {t('prev_step')}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
