'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    ArrowLeft,
    Sparkles,
    User,
    Users,
    Heart,
    Briefcase,
    PartyPopper,
    CalendarHeart,
    Star,
    Wallet,
    Flower2,
    TreePine,
    Flame,
    Wind,
    Leaf,
    Clock,
    Timer,
    Hourglass,
    Zap,
    LucideIcon,
} from 'lucide-react';
import { QuizAnswers } from '@/services/quiz.service';

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
    options: QuizOption[];
    isBudget?: boolean;
}

interface QuizFormProps {
    onSubmit: (answers: QuizAnswers) => void;
    isSubmitting: boolean;
}

export function QuizForm({ onSubmit, isSubmitting }: QuizFormProps) {
    const t = useTranslations('quiz');
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const steps: QuizStep[] = [
        {
            id: 1,
            titleKey: 'steps.gender.title',
            subtitleKey: 'steps.gender.subtitle',
            key: 'gender',
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
            options: [
                { label: t('steps.occasion.options.daily'), value: 'daily', icon: Star },
                { label: t('steps.occasion.options.office'), value: 'office', icon: Briefcase },
                { label: t('steps.occasion.options.date'), value: 'date', icon: CalendarHeart },
                { label: t('steps.occasion.options.party'), value: 'party', icon: PartyPopper },
                { label: t('steps.occasion.options.special'), value: 'special_event', icon: Sparkles },
            ],
        },
        {
            id: 3,
            titleKey: 'steps.budget.title',
            subtitleKey: 'steps.budget.subtitle',
            key: 'budgetMin' as keyof QuizAnswers,
            isBudget: true,
            options: [
                { label: t('steps.budget.options.under_500k'), value: '0-500000', icon: Wallet, description: '< 500K VND' },
                { label: t('steps.budget.options.500k_1m'), value: '500000-1000000', icon: Wallet, description: '500K – 1M' },
                { label: t('steps.budget.options.1m_2m'), value: '1000000-2000000', icon: Wallet, description: '1M – 2M' },
                { label: t('steps.budget.options.2m_5m'), value: '2000000-5000000', icon: Wallet, description: '2M – 5M' },
                { label: t('steps.budget.options.over_5m'), value: '5000000-99999999', icon: Wallet, description: '> 5M' },
            ],
        },
        {
            id: 4,
            titleKey: 'steps.scent_family.title',
            subtitleKey: 'steps.scent_family.subtitle',
            key: 'preferredFamily',
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
            options: [
                { label: t('steps.longevity.options.light'), value: 'light', icon: Clock, description: '2-4h' },
                { label: t('steps.longevity.options.moderate'), value: 'moderate', icon: Timer, description: '4-6h' },
                { label: t('steps.longevity.options.long'), value: 'long_lasting', icon: Hourglass, description: '6-8h' },
                { label: t('steps.longevity.options.very_long'), value: 'very_long', icon: Zap, description: '8h+' },
            ],
        },
    ];

    const totalSteps = steps.length;
    const currentStep = steps[step];

    const handleSelect = (value: string) => {
        const newAnswers = { ...answers, [currentStep.key]: value };
        setAnswers(newAnswers);

        if (step < totalSteps - 1) {
            setStep(step + 1);
        } else {
            // Last step — build structured answers and submit
            const quizAnswers: QuizAnswers = {
                gender: (newAnswers.gender as QuizAnswers['gender']) || undefined,
                occasion: newAnswers.occasion || undefined,
                preferredFamily: newAnswers.preferredFamily || undefined,
                longevity: newAnswers.longevity || undefined,
            };

            // Parse budget range
            const budgetVal = newAnswers.budgetMin;
            if (budgetVal) {
                const [min, max] = budgetVal.split('-').map(Number);
                quizAnswers.budgetMin = min;
                quizAnswers.budgetMax = max;
            }

            onSubmit(quizAnswers);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center justify-center gap-2 lg:gap-3 mb-10 lg:mb-16">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 lg:gap-3">
                        <div className="relative">
                            <div
                                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold tracking-widest transition-all duration-500 ${
                                    step > i
                                        ? 'bg-gold text-white shadow-[0_0_20px_rgba(197,160,89,0.4)]'
                                        : step === i
                                          ? 'bg-gold/20 text-gold ring-2 ring-gold/50 shadow-[0_0_30px_rgba(197,160,89,0.2)]'
                                          : 'bg-stone-200 dark:bg-white/5 text-stone-400 dark:text-stone-600'
                                }`}
                            >
                                {step > i ? '✓' : s.id}
                            </div>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`w-4 lg:w-14 h-px transition-colors duration-500 ${
                                    step > i ? 'bg-gold' : 'bg-stone-300 dark:bg-white/10'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                >
                    {/* Step Label */}
                    <div className="flex items-center justify-center gap-2 text-gold mb-4">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-bold tracking-[.4em] uppercase">
                            {t('step_label')} {currentStep.id} / {totalSteps}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-fluid-3xl font-serif text-luxury-black dark:text-white mb-2 lg:mb-3">
                        {t(currentStep.titleKey)}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 mb-8 lg:mb-12 max-w-lg mx-auto leading-relaxed">
                        {t(currentStep.subtitleKey)}
                    </p>

                    {/* Options Grid */}
                    <div
                        className={`grid gap-3 lg:gap-4 ${
                            currentStep.options.length <= 3
                                ? 'grid-cols-1 sm:grid-cols-3'
                                : currentStep.options.length <= 4
                                  ? 'grid-cols-2 sm:grid-cols-4'
                                  : 'grid-cols-2 lg:grid-cols-5'
                        }`}
                    >
                        {currentStep.options.map((opt, i) => {
                            const Icon = opt.icon;
                            const isSelected = answers[currentStep.key] === opt.value;
                            return (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.4 }}
                                    onClick={() => handleSelect(opt.value)}
                                    disabled={isSubmitting}
                                    className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isSelected
                                            ? 'bg-gold/10 border-gold shadow-[0_0_20px_rgba(197,160,89,0.15)]'
                                            : 'bg-white dark:bg-white/[0.03] border-stone-200 dark:border-white/10 hover:border-gold/50 hover:bg-gold/5 hover:shadow-lg'
                                    }`}
                                >
                                    {Icon && (
                                        <div
                                            className={`p-3 rounded-xl transition-colors ${
                                                isSelected
                                                    ? 'bg-gold/20'
                                                    : 'bg-stone-100 dark:bg-white/5 group-hover:bg-gold/10'
                                            }`}
                                        >
                                            <Icon
                                                size={24}
                                                strokeWidth={1.5}
                                                className={`transition-colors ${
                                                    isSelected
                                                        ? 'text-gold'
                                                        : 'text-stone-400 dark:text-stone-500 group-hover:text-gold'
                                                }`}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <span
                                            className={`text-xs font-bold tracking-widest uppercase block transition-colors ${
                                                isSelected
                                                    ? 'text-gold'
                                                    : 'text-luxury-black dark:text-white group-hover:text-gold'
                                            }`}
                                        >
                                            {opt.label}
                                        </span>
                                        {opt.description && (
                                            <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
                                                {opt.description}
                                            </span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Back Button */}
                    {step > 0 && (
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className="mt-10 text-xs font-bold tracking-widest uppercase text-stone-500 dark:text-stone-400 hover:text-luxury-black dark:hover:text-white flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft size={14} /> {t('prev_step')}
                        </button>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
