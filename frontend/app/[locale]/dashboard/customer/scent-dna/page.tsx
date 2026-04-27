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

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 max-w-md">
            <button
              onClick={() => setActiveTab('preferred')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'preferred' ? "bg-white dark:bg-zinc-800 shadow-xl text-gold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles size={16} />
              {t('preferred_tab')}
            </button>
            <button
              onClick={() => setActiveTab('avoided')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'avoided' ? "bg-white dark:bg-zinc-800 shadow-xl text-red-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertCircle size={16} />
              {t('avoided_tab')}
            </button>
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
                className="w-full pl-16 pr-8 py-6 rounded-[2rem] border border-black/10 bg-white dark:bg-zinc-900 dark:border-white/10 text-lg outline-none focus:border-gold/50 transition-all shadow-lg"
              />
            </div>

            <AnimatePresence>
              {(isFocused || search.trim()) && filteredNotes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-3 p-3 rounded-3xl border border-black/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl dark:border-white/10 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredNotes.map(note => (
                      <button
                        key={note}
                        onClick={() => handleAddNote(note)}
                        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
                      >
                        <span className="font-medium">{note}</span>
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100",
                          activeTab === 'preferred' ? "bg-gold/10 text-gold" : "bg-red-500/10 text-red-500"
                        )}>
                          <Plus size={18} />
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
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {activeTab === 'preferred' ? <Sparkles size={20} className="text-gold" /> : <AlertCircle size={20} className="text-red-500" />}
                  {t('your_list_title', { type: t(activeTab === 'preferred' ? 'preferred_label' : 'avoided_label') })}
                </h3>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('notes_count', { count: (activeTab === 'preferred' ? preferences?.preferredNotes.length : preferences?.avoidedNotes.length) || 0 })}
                </span>
             </div>

             <div className="flex flex-wrap gap-3">
                {activeTab === 'preferred' ? (
                  preferences?.preferredNotes.map(note => (
                    <motion.div
                      layout
                      key={note}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="group flex items-center gap-2 pl-5 pr-3 py-3 rounded-full bg-gold/10 border border-gold/20 text-gold font-bold text-sm"
                    >
                      {note}
                      <button 
                        onClick={() => handleRemoveNote(note, 'preferred')}
                        className="p-1 rounded-full hover:bg-gold/20 transition-all text-gold/60 hover:text-gold"
                      >
                        <X size={14} />
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
                      className="group flex items-center gap-2 pl-5 pr-3 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm"
                    >
                      {note}
                      <button 
                        onClick={() => handleRemoveNote(note, 'avoided')}
                        className="p-1 rounded-full hover:bg-red-500/20 transition-all text-red-500/60 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
                
                {((activeTab === 'preferred' && preferences?.preferredNotes.length === 0) || 
                  (activeTab === 'avoided' && preferences?.avoidedNotes.length === 0)) && (
                  <div className="w-full py-20 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-black/5 dark:border-white/5 text-muted-foreground">
                    <Dna size={48} className="opacity-20 mb-4" />
                    <p>{t('no_notes', { type: t(activeTab === 'preferred' ? 'search_preferred' : 'search_avoided') })}</p>
                    <p className="text-sm mt-1">{t('start_typing')}</p>
                  </div>
                )}
             </div>
          </div>

          <div className="pt-10 border-t border-black/5 dark:border-white/5">
             <ScentDNASuggestions />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-card shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h4 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-8 text-muted-foreground relative">
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

          {preferences && preferences.preferredNotes.length > 0 && (
            <div className="p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-card shadow-xl overflow-hidden">
              <h4 className="font-bold mb-4">{t('scent_profile_chart')}</h4>
              <ScentDNARadar />
            </div>
          )}

          <div className="p-8 rounded-[2.5rem] bg-[linear-gradient(135deg,#d6b36d,#b68948)] text-luxury-black shadow-2xl">
            <h3 className="text-2xl font-black leading-tight">{t('how_it_works')}</h3>
            <p className="mt-4 text-sm font-medium leading-relaxed opacity-90">
              {t('how_it_works_desc')}
            </p>
            
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-bold">{t('base_match')}</p>
                  <p className="text-xs font-medium opacity-80 mt-1">{t('base_match_desc')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="font-bold">{t('bonus_score')}</p>
                  <p className="text-xs font-medium opacity-80 mt-1">{t('bonus_score_desc')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="font-bold">{t('penalty_system')}</p>
                  <p className="text-xs font-medium opacity-80 mt-1">{t('penalty_system_desc')}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-card shadow-xl">
             <h4 className="font-bold">{t('pro_tip')}</h4>
             <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
               {t('pro_tip_desc')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
