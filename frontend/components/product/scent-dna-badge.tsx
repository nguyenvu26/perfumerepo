'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Product } from '@/services/product.service';
import { useScentDNAStore } from '@/store/scent-dna.store';
import { calculateScentDNA } from '@/lib/scent-dna';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScentDNABadgeProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

export function ScentDNABadge({ product, className, showText = true }: ScentDNABadgeProps) {
  const t = useTranslations('dashboard.scent_dna');
  const { preferences } = useScentDNAStore();

  const dna = useMemo(() => {
    if (!preferences) return null;
    return calculateScentDNA(product, preferences.preferredNotes, preferences.avoidedNotes);
  }, [product, preferences]);

  if (!dna) return null;

  const colorClasses = {
    gold: 'border-gold/50 bg-gold text-luxury-black shadow-[0_0_20px_rgba(197,160,89,0.4)]',
    amber: 'border-amber-500/50 bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    red: 'border-red-500/50 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  };

  const icon = dna.status === 'warning' ? (
    <AlertTriangle size={14} className="animate-pulse" />
  ) : (
    <Sparkles size={14} className={cn(dna.status === 'excellent' && 'animate-spin-slow')} />
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md transition-all hover:scale-105',
              colorClasses[dna.color],
              className
            )}
          >
            {icon}
            <span>{dna.score}% DNA</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="start"
          sideOffset={8}
          className="w-72 p-5 rounded-[1.5rem] border-black/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-black/95 shadow-2xl z-[100]"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t('badge_tooltip_title')}</span>
              <span className={cn('text-sm font-black', dna.color === 'gold' ? 'text-gold' : dna.color === 'amber' ? 'text-amber-500' : 'text-red-500')}>
                {dna.score}%
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dna.status === 'excellent' && t('badge_tooltip_desc_excellent')}
              {dna.status === 'caution' && t('badge_tooltip_desc_caution')}
              {dna.status === 'warning' && t('badge_tooltip_desc_warning')}
            </p>

            {dna.matchingNotes.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('preferred_found')}</p>
                <div className="flex flex-wrap gap-1">
                  {dna.matchingNotes.map(note => (
                    <span key={note} className="px-1.5 py-0.5 rounded-md bg-gold/5 text-gold text-[10px] border border-gold/10">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dna.avoidedNotesFound.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-red-500/70">{t('conflicting_found')}</p>
                <div className="flex flex-wrap gap-1">
                  {dna.avoidedNotesFound.map(note => (
                    <span key={note} className="px-1.5 py-0.5 rounded-md bg-red-500/5 text-red-500 text-[10px] border border-red-500/10">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
