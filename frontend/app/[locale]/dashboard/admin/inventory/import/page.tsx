'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Search, Package, Plus, ArrowRight, History, CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';
import { productService, type Product, type ProductVariant } from '@/services/product.service';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function InventoryImportPage() {
  const t = useTranslations('inventory');
  const navT = useTranslations('navigation');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await productService.adminList({ search: query, take: 100 });
      setProducts(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setSearch('');
    setProducts([]);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || quantity <= 0) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedVariant = await productService.adminImportWarehouse({
        variantId: selectedVariant.id,
        quantity,
        reason: reason.trim() || undefined,
      });

      setSuccess(true);
      // Update local state with new stock
      setSelectedVariant(updatedVariant);
      setQuantity(1);
      setReason('');
      
      // Auto hide success message
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-10 max-w-[1200px] mx-auto min-h-screen">
        <header className="mb-10 md:mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[1px] bg-gold" />
              <span className="text-[10px] uppercase tracking-[.4em] font-black text-gold/80">{navT('admin.inventory')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {t('subtitle')}
            </p>
          </div>
          
          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/inventory/history`)}
            className="flex items-center gap-3 bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full font-heading text-[10px] uppercase tracking-[.2em] font-bold hover:bg-gold hover:text-white transition-all shadow-xl"
          >
            <History className="w-4 h-4 opacity-60" />
            {t('history_title')}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Selection */}
          <div className="lg:col-span-7 space-y-8">
            <section className="glass bg-white/50 dark:bg-zinc-900/40 rounded-[2.5rem] border border-white/10 p-8 shadow-xl">
              <h3 className="text-xl font-heading uppercase mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-gold" />
                {t('search_placeholder').split('...')[0]}
              </h3>
              
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-gold transition-colors" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  className="w-full bg-white dark:bg-zinc-950/50 border border-border/50 rounded-2xl py-5 pl-14 pr-4 text-sm outline-none focus:border-gold/50 transition-all font-bold uppercase tracking-widest placeholder:text-muted-foreground/30"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <AnimatePresence>
                  {(products.length > 0 && search.trim() !== '') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-20 max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      {products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-gold/5 transition-colors border-b border-border last:border-none group/item"
                        >
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0">
                            {p.images?.[0] ? (
                              <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                            ) : (
                              <Package className="w-6 h-6 m-auto absolute inset-0 text-gold/20" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-gold uppercase tracking-widest font-black opacity-60 leading-none mb-1">{p.brand?.name}</p>
                            <p className="font-bold text-sm group-hover/item:text-gold transition-colors">{p.name}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover/item:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {loading && search.trim() !== '' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                  {commonT('loading')}
                </div>
              )}

              {/* Default product list when not searching */}
              {!search.trim() && products.length > 0 && (
                <div className="mt-8 space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group/item",
                        selectedProduct?.id === p.id 
                          ? "bg-gold/10 border-gold/30" 
                          : "bg-white/50 dark:bg-zinc-950/20 border-white/5 hover:border-gold/20 hover:bg-gold/5"
                      )}
                    >
                      <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-secondary/20 flex-shrink-0">
                        {p.images?.[0] ? (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover group-hover/item:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package className="w-6 h-6 m-auto absolute inset-0 text-gold/20" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[9px] text-gold uppercase tracking-[.2em] font-black opacity-60 leading-none mb-1.5">{p.brand?.name}</p>
                        <p className="font-bold text-sm truncate group-hover/item:text-gold transition-colors">{p.name}</p>
                        <div className="flex gap-2 mt-1">
                          {p.variants?.map((v, i) => (
                            <span key={i} className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground">
                              {v.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {loading && !search.trim() && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                   <div className="w-10 h-10 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
                   <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">{commonT('loading')}</p>
                </div>
              )}
            </section>

            {selectedProduct && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-gold/20 p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col sm:flex-row gap-8 relative z-10">
                  <div className="w-32 h-40 relative rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    {selectedProduct.images?.[0] ? (
                      <Image src={selectedProduct.images[0].url} alt={selectedProduct.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gold/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[10px] text-gold uppercase tracking-[.4em] font-black mb-2">{selectedProduct.brand?.name}</p>
                      <h3 className="text-2xl font-heading uppercase leading-tight">{selectedProduct.name}</h3>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black block">
                        {t('select_variant')}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedProduct.variants?.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={cn(
                              "flex flex-col p-4 rounded-2xl border transition-all text-left group",
                              selectedVariant?.id === v.id
                                ? "bg-gold border-gold text-white shadow-lg shadow-gold/20"
                                : "bg-white/50 dark:bg-zinc-950/30 border-white/10 hover:border-gold/50"
                            )}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider mb-1">{v.name}</span>
                            <span className={cn(
                              "text-[10px] opacity-60 font-medium",
                              selectedVariant?.id === v.id ? "text-white" : "text-muted-foreground"
                            )}>
                              {t('current_stock', { count: v.stock })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedVariant ? (
                <motion.section
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass bg-white dark:bg-zinc-900/60 rounded-[3rem] border border-white/10 p-10 shadow-2xl sticky top-8"
                >
                  <form onSubmit={handleImport} className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-gold" />
                        <h3 className="text-xl font-heading uppercase tracking-tight">{t('import_btn')}</h3>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                        {selectedVariant.name}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-1">
                        {t('quantity')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-8 outline-none focus:border-gold transition-all text-2xl font-heading italic"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                           <button 
                             type="button" 
                             onClick={() => setQuantity(q => q + 1)}
                             className="p-1 hover:text-gold transition-colors"
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-1">
                        {t('reason')}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-secondary/10 border border-border rounded-2xl py-5 px-8 outline-none focus:border-gold transition-all text-sm font-medium placeholder:text-muted-foreground/30 resize-none"
                        placeholder={t('reason_placeholder')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold uppercase tracking-widest"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {t('success')}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || quantity <= 0}
                      className="w-full bg-gold text-white py-6 rounded-[2rem] font-heading text-[12px] uppercase tracking-[.3em] font-extrabold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gold/30 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          {t('import_btn')}
                        </>
                      )}
                    </button>

                    <div className="pt-6 border-t border-white/10">
                       <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/20 border border-white/5">
                         <Info className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                         <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {t('import_confirm', { quantity: quantity })}
                         </p>
                       </div>
                    </div>
                  </form>
                </motion.section>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 glass bg-white/30 dark:bg-zinc-900/20 rounded-[3rem] border border-white/5 border-dashed p-10">
                   <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
                     <Package className="w-10 h-10 text-muted-foreground opacity-30" />
                   </div>
                   <div className="max-w-xs space-y-2">
                     <h3 className="font-heading uppercase text-lg text-muted-foreground/60">{t('select_variant')}</h3>
                     <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">{t('search_placeholder')}</p>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
