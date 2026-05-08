'use client';

import { motion } from 'framer-motion';
import { User, Search, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  icon: React.ElementType;
  color: string;
}

interface ProcessTimelineProps {
  steps: string[];
  className?: string;
}

export function ProcessTimeline({ steps, className }: ProcessTimelineProps) {
  const stepIcons = [User, Search, Zap, CheckCircle2];
  const stepColors = [
    'bg-gold/20 text-gold border-gold/30',
    'bg-secondary/20 text-secondary border-secondary/30',
    'bg-gold-light/20 text-gold-light border-gold-light/30',
    'bg-success/20 text-success border-success/30',
  ];
  const dotColors = [
    'bg-gold',
    'bg-gold',
    'bg-gold',
    'bg-gold',
  ];


  return (
    <div className={cn("relative py-24 overflow-visible", className)}>
      {/* Central Horizontal Line (Dashed) */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 bg-transparent overflow-hidden">
        <div className="absolute inset-0 border-t-2 border-dashed border-gold/30 w-[200%] animate-slide-infinite" />
      </div>

      {/* Steps Container */}
      <div className="relative flex justify-between items-center max-w-6xl mx-auto px-4 lg:px-8">

        {steps.map((step, index) => {
          const Icon = stepIcons[index] || Search;
          const isTop = index % 2 === 0;

          return (
            <div key={index} className="relative flex flex-col items-center group w-1/4">
              {/* Content Box (Top/Bottom) */}
              <motion.div
                initial={{ opacity: 0, y: isTop ? -20 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                className={cn(
                  "absolute w-48 p-4 rounded-2xl border border-gold/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xl text-center",
                  isTop ? "bottom-12" : "top-12",
                  "group-hover:border-gold/50 transition-colors duration-300"
                )}

              >
                <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">Step {index + 1}</p>
                <p className="text-sm font-semibold leading-relaxed text-foreground">{step}</p>
              </motion.div>

              {/* Vertical Connector Line */}
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: 48 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                className={cn(
                  "absolute w-px bg-gold/40",
                  isTop ? "bottom-0" : "top-0"
                )}
              />

              {/* Node (Circle on the line) */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: index * 0.1 
                }}
                className={cn(
                  "relative z-10 w-12 h-12 flex items-center justify-center rounded-full border-2 border-white dark:border-ebony shadow-xl",
                  dotColors[index]
                )}
              >
                <Icon className="w-6 h-6 text-stone-900" />

                
                {/* Pulsing effect */}
                <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-20" />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
