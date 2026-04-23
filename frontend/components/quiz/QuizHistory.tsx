'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';
import { 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  Target, 
  Briefcase, 
  User, 
  Zap, 
  Palette,
  CloudSun,
  LayoutGrid,
  History
} from 'lucide-react';
import { quizService } from '@/services/quiz.service';

interface QuizHistoryProps {
  onViewResult: (recommendations: any[], analysis?: string) => void;
  onBack: () => void;
}

export function QuizHistory({ onViewResult, onBack }: QuizHistoryProps) {
  const t = useTranslations('quiz');
  const format = useFormatter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizService.getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getTranslatedValue = (step: string, value: string) => {
    try {
      // Try to find the translation in quiz.steps.[step].options.[value]
      return t(`steps.${step}.options.${value.toLowerCase()}`);
    } catch {
      return value;
    }
  };

  const parseRecommendations = (item: any) => {
    const rawRecs = item.recommendation || item.recommendations || [];
    let recs = typeof rawRecs === 'string' ? JSON.parse(rawRecs) : rawRecs;
    
    // Handle nested format { recommendations: [...] }
    if (recs && !Array.isArray(recs) && Array.isArray(recs.recommendations)) {
      recs = recs.recommendations;
    }
    
    return Array.isArray(recs) ? recs : [];
  };

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12">
        <div className="relative">
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold/50 blur-sm rounded-full hidden lg:block" />
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-3">AI ARCHIVE</p>
          <h2 className="text-4xl md:text-5xl font-heading text-foreground flex items-center gap-4 tracking-tighter">
            <History className="text-gold" size={32} />
            Dấu Ấn Lưu Trữ
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed text-sm">
            Hệ thống đã lưu lại các phân tích khứu giác trước đây của bạn. Mỗi hồ sơ là một hành trình tinh hoa được cá nhân hóa bởi AI.
          </p>
        </div>
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-8 py-3 rounded-full border border-border bg-card/40 hover:bg-gold/5 hover:border-gold/30 transition-all text-xs font-bold uppercase tracking-widest text-foreground w-full sm:w-auto backdrop-blur-md"
        >
          <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={14} />
          Trở lại
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-gold/60 animate-pulse" size={20} />
            </div>
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Đang truy xuất kho dữ liệu...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-24 rounded-[3rem] border border-dashed border-border bg-muted/10 backdrop-blur-xl">
          <div className="h-20 w-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-8 border border-border/50">
            <LayoutGrid className="text-muted-foreground/30" size={40} />
          </div>
          <h3 className="text-xl font-heading text-foreground mb-4">Chưa có hồ sơ khứu giác</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-10 text-sm leading-relaxed">
            Bạn chưa thực hiện bất kỳ trắc nghiệm AI nào. Hãy bắt đầu ngay để khám phá mùi hương dành riêng cho bạn.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-3 text-gold hover:text-gold-dark font-bold uppercase tracking-widest text-xs transition-colors"
          >
            Bắt đầu thực hiện ngay <ArrowRight size={14} className="animate-bounce-x" />
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => {
              const recs = parseRecommendations(item);
              const date = new Date(item.createdAt);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8 }}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card/40 p-1 cursor-pointer transition-all hover:border-gold/30 hover:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                  onClick={() => onViewResult(recs, item.analysis)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative bg-card/80 rounded-[2.2rem] p-7 md:p-9 flex flex-col lg:flex-row lg:items-center gap-10">
                    {/* Time & Index Section */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-4 lg:min-w-[180px] pr-8 lg:border-r border-border/40">
                      <div>
                        <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest mb-3">
                          <Clock size={14} />
                          {format.dateTime(date, { hour: 'numeric', minute: 'numeric' })}
                        </div>
                        <div className="text-2xl font-heading text-foreground tracking-tight">
                          {format.dateTime(date, { day: 'numeric', month: 'long' })}
                        </div>
                        <div className="text-muted-foreground/60 text-xs font-medium mt-1">
                          Năm {date.getFullYear()}
                        </div>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-gold/10 flex items-center justify-center font-heading text-2xl text-gold-dark border border-gold/20">
                        {String(history.length - index).padStart(2, '0')}
                      </div>
                    </div>

                    {/* Attributes Section */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="px-5 py-2 rounded-full bg-muted/30 border border-border/50 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                          <User size={13} className="text-gold" />
                          {getTranslatedValue('gender', item.gender)}
                        </div>
                        <div className="px-5 py-2 rounded-full bg-muted/30 border border-border/50 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                          <Briefcase size={13} className="text-gold" />
                          {getTranslatedValue('occasion', item.occasion)}
                        </div>
                        <div className="px-5 py-2 rounded-full bg-muted/30 border border-border/50 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                          <Palette size={13} className="text-gold" />
                          {getTranslatedValue('scent_family', item.preferredFamily)}
                        </div>
                        <div className="px-5 py-2 rounded-full bg-muted/30 border border-border/50 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                          <Zap size={13} className="text-gold" />
                          {getTranslatedValue('longevity', item.longevity)}
                        </div>
                        {item.budgetMax && (
                          <div className="px-5 py-2 rounded-full bg-muted/30 border border-border/50 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                            <Target size={13} className="text-gold" />
                            {item.budgetMax > 10000000 
                              ? `> ${format.number(5000000)}đ` 
                              : `${format.number(item.budgetMin)}đ - ${format.number(item.budgetMax)}đ`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Trạng thái hồ sơ</p>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {recs.slice(0, 3).map((rec: any, i: number) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-gold/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-gold">
                                  {rec.name?.[0] || 'P'}
                                </div>
                              ))}
                              {recs.length > 3 && (
                                <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  +{recs.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground/60 italic">
                               {recs.length > 0 ? `${recs.length} lựa chọn phù hợp` : 'Chưa có gợi ý'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/40 lg:pl-10 lg:min-w-[160px]">
                      <div className="lg:hidden text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
                        XEM CHI TIẾT
                      </div>
                      <div className="h-14 w-14 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 group-hover:bg-gold group-hover:border-gold group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] transition-all duration-500">
                        <ChevronRight size={24} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
