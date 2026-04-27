'use client';

import { useEffect, useState, useMemo } from 'react';
import { useScentDNAStore } from '@/store/scent-dna.store';
import { calculateScentDNA } from '@/lib/scent-dna';
import { productService, type Product } from '@/services/product.service';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';

export function ScentDNASuggestions() {
  const t = useTranslations('dashboard.scent_dna');
  const format = useFormatter();
  const { preferences } = useScentDNAStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.list({ take: 20 })
      .then(res => setProducts(res.items))
      .finally(() => setLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    if (!preferences || products.length === 0) return [];

    return products
      .map(p => ({
        product: p,
        dna: calculateScentDNA(p, preferences.preferredNotes, preferences.avoidedNotes)
      }))
      .filter(item => item.dna !== null && item.dna.score > 60)
      .sort((a, b) => (b.dna?.score || 0) - (a.dna?.score || 0))
      .slice(0, 3);
  }, [products, preferences]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles size={20} className="text-gold" />
          {t('suggestions_title')}
        </h3>
        <Link href="/collection" className="text-sm font-bold text-gold hover:underline flex items-center gap-1">
          {t('view_all')}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4">
        {suggestions.map(({ product, dna }, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              href={`/collection/${product.id}`}
              className="flex items-center gap-4 p-4 rounded-3xl border border-black/5 dark:border-white/5 bg-card hover:border-gold/30 transition-all group"
            >
              <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-secondary/50">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gold/20 font-bold">DNA</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gold uppercase tracking-wider">{product.brand?.name}</p>
                <h4 className="font-bold text-sm truncate group-hover:text-gold transition-colors">{product.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                    dna!.score > 85 ? "bg-gold text-black" : "bg-gold/10 text-gold"
                  )}>
                    {dna!.score > 85 ? t('must_have') : t('safe_buy')}
                  </span>
                  <span className="text-xs font-black text-foreground/70">{dna?.score}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground line-clamp-1 italic">
                    {dna?.matchingNotes.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
