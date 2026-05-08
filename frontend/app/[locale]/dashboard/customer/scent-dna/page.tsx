'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Sparkles, 
  Search, 
  Plus, 
  X, 
  Dna, 
  Trash2, 
  RotateCcw, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useScentDNAStore } from '@/store/scent-dna.store';
import { catalogService } from '@/services/catalog.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScentDNARadar } from '@/components/product/scent-dna-radar';
import { ScentDNASuggestions } from '@/components/product/scent-dna-suggestions';
import { analyzeScentPersona } from '@/lib/scent-persona';
import { ThumbsUp, History, Quote } from 'lucide-react';

export default function ScentDNAPage() {
  const t = useTranslations('dashboard.scent_dna');
  const { preferences, loading, fetchPreferences, updatePreferences, resetPreferences } = useScentDNAStore();
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'preferred' | 'avoided'>('preferred');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchPreferences();
    catalogService.getScentNotes().then(setAllNotes).catch(console.error);
  }, [fetchPreferences]);

  const filteredNotes = useMemo(() => {
    const available = allNotes.filter(
      note => !preferences?.preferredNotes.includes(note) && !preferences?.avoidedNotes.includes(note)
    );

    if (!search.trim()) return available;

    return available
      .filter(note => note.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 50);
  }, [search, allNotes, preferences]);

  const handleAddNote = (note: string) => {
    if (!preferences) return;
    
    const nextPrefs = {
      preferredNotes: [...preferences.preferredNotes],
      avoidedNotes: [...preferences.avoidedNotes],
    };

    if (activeTab === 'preferred') {
      if (nextPrefs.preferredNotes.includes(note)) return;
      nextPrefs.preferredNotes.push(note);
    } else {
      if (nextPrefs.avoidedNotes.includes(note)) return;
      nextPrefs.avoidedNotes.push(note);
    }

    updatePreferences(nextPrefs);
    setSearch('');
    toast.success(t('add_success', { note, type: t(activeTab === 'preferred' ? 'search_preferred' : 'search_avoided') }));
  };

  const handleRemoveNote = (note: string, type: 'preferred' | 'avoided') => {
    if (!preferences) return;

    const nextPrefs = {
      preferredNotes: preferences.preferredNotes.filter(n => n !== note),
      avoidedNotes: preferences.avoidedNotes.filter(n => n !== note),
    };

    updatePreferences(nextPrefs);
    toast.info(t('remove_info', { note }));
  };

  const handleReset = async () => {
    if (confirm(t('reset_confirm'))) {
      await resetPreferences();
      toast.success(t('reset_success'));
    }
  };

  const handleRiskChange = (value: number) => {
    if (!preferences) return;
    updatePreferences({ riskLevel: value });
  };

  const riskLevel = preferences?.riskLevel ?? 0.3;
  const riskInfo = useMemo(() => {
    if (riskLevel < 0.35) return { text: t('ai_safe_suggestion'), color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
    if (riskLevel < 0.7) return { text: t('ai_balanced_suggestion'), color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' };
    return { text: t('ai_daring_suggestion'), color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
  }, [riskLevel, t]);

  const persona = useMemo(() => {
    if (!preferences) return null;
    return analyzeScentPersona(preferences.preferredNotes, riskLevel);
  }, [preferences, riskLevel]);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest">
            <Dna size={14} />
            {t('badge')}
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-black text-foreground leading-tight">
            {t('title_line1')} <br /> {t('title_line2')}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl text-lg">
            {t('description')}
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-secondary transition-all text-sm font-semibold"
        >
          <RotateCcw size={16} className={cn(loading && "animate-spin")} />
          {t('reset_profile')}
        </button>
      </div>

      {/* Row 1: The Result & Visualization */}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          {persona && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full p-8 md:p-10 rounded-[3rem] border border-gold/30 bg-gradient-to-br from-gold/10 via-background to-transparent shadow-2xl relative overflow-hidden group flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-1000">
                <Dna size={200} className="text-gold" />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-3 text-gold mb-6">
                  <div className="h-px w-8 bg-gold/50" />
                  <Sparkles size={18} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{persona.name}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">{persona.archetype}</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed italic mb-8 max-w-2xl">
                  "{persona.description}"
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {persona.traits.map(trait => (
                    <span key={trait} className="px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold shadow-sm">
                      #{trait}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="lg:col-span-5">
          {preferences && preferences.preferredNotes.length > 0 ? (
            <div className="h-full p-8 rounded-[3rem] border border-black/10 dark:border-white/10 bg-card shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gold/5 opacity-50" />
               <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-6 relative">{t('scent_profile_chart')}</h4>
               <div className="relative w-full aspect-square max-w-[280px]">
                 <ScentDNARadar />
               </div>
            </div>
          ) : (
            <div className="h-full p-10 rounded-[3rem] border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-center text-muted-foreground">
               <Dna size={40} className="opacity-20 mb-4" />
               <p className="text-sm font-medium">Thêm ít nhất 1 nốt hương để khởi tạo biểu đồ DNA</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Management & Controls */}
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="p-8 rounded-[3rem] border border-black/10 dark:border-white/10 bg-card/50 backdrop-blur-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">{t('manage_dna_title')}</h3>
              {/* Tabs */}
              <div className="flex p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <button
                  onClick={() => setActiveTab('preferred')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    activeTab === 'preferred' ? "bg-white dark:bg-zinc-800 shadow-md text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t('preferred_tab')}
                </button>
                <button
                  onClick={() => setActiveTab('avoided')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    activeTab === 'avoided' ? "bg-white dark:bg-zinc-800 shadow-md text-red-500" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t('avoided_tab')}
                </button>
              </div>
            </div>

            {/* Search Area */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  placeholder={t('search_placeholder', { type: t(activeTab === 'preferred' ? 'search_preferred' : 'search_avoided') })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className="w-full pl-16 pr-8 py-5 rounded-2xl border border-black/10 bg-white dark:bg-zinc-900 dark:border-white/10 text-base outline-none focus:border-gold/50 transition-all shadow-inner"
                />
              </div>

              <AnimatePresence>
                {(isFocused || search.trim()) && filteredNotes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 top-full mt-2 p-2 rounded-2xl border border-black/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl dark:border-white/10 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {filteredNotes.map(note => (
                        <button
                          key={note}
                          onClick={() => handleAddNote(note)}
                          className="w-full flex items-center justify-between px-5 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
                        >
                          <span className="font-medium text-sm">{note}</span>
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100",
                            activeTab === 'preferred' ? "bg-gold/10 text-gold" : "bg-red-500/10 text-red-500"
                          )}>
                            <Plus size={16} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active List */}
            <div className="space-y-4">
               <div className="flex flex-wrap gap-2.5">
                  {activeTab === 'preferred' ? (
                    preferences?.preferredNotes.map(note => (
                      <motion.div
                        layout
                        key={note}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold font-bold text-xs"
                      >
                        {note}
                        <button 
                          onClick={() => handleRemoveNote(note, 'preferred')}
                          className="p-1 rounded-full hover:bg-gold/20 transition-all text-gold/60 hover:text-gold"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    preferences?.avoidedNotes.map(note => (
                      <motion.div
                        layout
                        key={note}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs"
                      >
                        {note}
                        <button 
                          onClick={() => handleRemoveNote(note, 'avoided')}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all text-red-500/60 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))
                  )}
                  
                  {((activeTab === 'preferred' && preferences?.preferredNotes.length === 0) || 
                    (activeTab === 'avoided' && preferences?.avoidedNotes.length === 0)) && (
                    <div className="w-full py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/5 dark:border-white/5 text-muted-foreground/60">
                      <p className="text-xs">{t('no_notes', { type: t(activeTab === 'preferred' ? 'search_preferred' : 'search_avoided') })}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-[3rem] border border-black/10 dark:border-white/10 bg-card shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-8 text-muted-foreground relative">
              <div className="h-1 w-4 bg-gold rounded-full" />
              {t('suggestion_mode')}
            </h4>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={riskInfo.text}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                className={cn(
                  "p-5 rounded-3xl border shadow-lg backdrop-blur-md relative transition-all duration-500 min-h-[100px] flex items-center justify-center text-center",
                  riskInfo.bg, riskInfo.color, riskInfo.border
                )}
              >
                <p className="text-[13px] font-bold leading-relaxed tracking-tight italic">
                  {riskInfo.text}
                </p>
                <div className={cn("absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center border animate-pulse", riskInfo.bg, riskInfo.border)}>
                   <Sparkles size={12} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 space-y-6 relative">
              <div className="relative h-12 flex items-center">
                {/* Custom Slider Track */}
                <div className="absolute inset-0 h-2 my-auto rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${riskLevel * 100}%` }}
                    className={cn("h-full transition-colors duration-500", 
                      riskLevel < 0.35 ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
                      riskLevel < 0.7 ? "bg-gold shadow-[0_0_15px_rgba(214,179,109,0.5)]" : 
                      "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                    )}
                  />
                </div>
                
                {/* Transparent Actual Input */}
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={riskLevel}
                  onChange={(e) => handleRiskChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />

                {/* Animated Thumb */}
                <motion.div 
                  initial={false}
                  animate={{ left: `${riskLevel * 100}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white dark:bg-zinc-800 border-2 border-gold shadow-[0_0_20px_rgba(214,179,109,0.4)] pointer-events-none z-10 flex items-center justify-center"
                >
                  <div className="h-2 w-2 rounded-full bg-gold animate-ping" />
                </motion.div>
              </div>

              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('classic')}</span>
                  <span className="text-[10px] font-bold mt-0.5">0% Risk</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", riskLevel > 0.7 ? "text-orange-500" : "text-muted-foreground")}>{t('daring')}</span>
                  <span className="text-[10px] font-bold mt-0.5">100% Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Learning Insight */}
          <div className="p-6 rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-500">
              <History size={60} className="text-white" />
            </div>
            <div className="flex items-start gap-4 relative">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                <ThumbsUp size={18} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Feedback Intelligence</h4>
                <p className="text-[11px] text-white/80 leading-relaxed italic">
                  "AI đã tự động tinh chỉnh <strong>Risk Level</strong> của bạn dựa trên các phản hồi tích cực trong Chat."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Output & Guide */}
      <div className="grid gap-8 lg:grid-cols-12 pt-10 border-t border-black/5 dark:border-white/5">
        <div className="lg:col-span-8">
           <ScentDNASuggestions />
        </div>
        <div className="lg:col-span-4">
          <div className="p-8 rounded-[3rem] bg-[linear-gradient(135deg,#d6b36d,#b68948)] text-luxury-black shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black leading-tight">{t('how_it_works')}</h3>
              <p className="mt-4 text-sm font-medium leading-relaxed opacity-90">
                {t('how_it_works_desc')}
              </p>
            </div>
            
            <ul className="mt-8 space-y-4">
              <li className="flex gap-4 items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-xs font-bold">{t('base_match')}</p>
              </li>
              <li className="flex gap-4 items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <Plus size={16} />
                </div>
                <p className="text-xs font-bold">{t('bonus_score')}</p>
              </li>
              <li className="flex gap-4 items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <AlertCircle size={16} />
                </div>
                <p className="text-xs font-bold">{t('penalty_system')}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
