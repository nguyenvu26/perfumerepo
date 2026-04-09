'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, ShieldCheck, Truck, RotateCcw, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { cartService, type Cart, type CartItem } from '@/services/cart.service';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations, useLocale, useFormatter } from 'next-intl';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(() => {
    if (!isAuthenticated) {
      setCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    cartService
      .getCart()
      .then(setCart)
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQty = async (item: CartItem, delta: number) => {
    const q = Math.max(1, item.quantity + delta);
    try {
      const updated = await cartService.updateItem(item.id, q);
      setCart(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (itemId: number) => {
    try {
      const updated = await cartService.removeItem(itemId);
      setCart(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const format = useFormatter();
  const tFeatured = useTranslations('featured');

  const formatCurrency = (amount: number) => {
    return format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background transition-colors flex items-center justify-center">
        <main className="container mx-auto px-6 py-32 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-gold/20 shadow-2xl">
              <ShoppingBag className="text-gold w-10 h-10" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif text-foreground italic mb-6 tracking-tight">{t('title')}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[.6em] font-black opacity-60 mb-12">{t('signin_required')}</p>
            <Link href="/login" className="inline-flex items-center gap-4 bg-gold text-primary-foreground px-12 py-5 rounded-full font-black tracking-[.3em] uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/20 text-[10px]">
              {t('signin_btn')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce((acc, i) => acc + i.variant.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-background transition-colors">
      <main className="container mx-auto px-6 py-40">
        <header className="mb-24 space-y-4">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[9px] text-gold font-black uppercase tracking-[.8em] block"
          >
            {tCommon('curation')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-7xl md:text-9xl font-serif text-foreground italic tracking-tighter"
          >
            {t('title')}
          </motion.h1>
        </header>

        {loading ? (
          <div className="py-40 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gold opacity-30" />
            <p className="text-[10px] uppercase tracking-[.6em] font-black text-muted-foreground">{t('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-40 text-center glass bg-foreground/[0.02] rounded-[4rem] border border-dashed border-border/50"
          >
            <Sparkles className="mx-auto h-16 w-16 text-gold/20 mb-10" />
            <p className="font-serif italic text-muted-foreground text-3xl mb-12 opacity-60">{t('empty')}</p>
            <Link href="/collection" className="inline-flex items-center gap-4 border border-gold/30 text-gold px-12 py-5 rounded-full font-black tracking-[.3em] uppercase hover:bg-gold hover:text-white transition-all text-[10px] shadow-xl">
              {t('continue_shopping')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            <div className="lg:col-span-8 space-y-10">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex flex-col sm:flex-row gap-10 p-10 glass bg-foreground/[0.02] rounded-[3.5rem] border border-border/50 items-center group hover:border-gold/30 hover:bg-gold/[0.02] transition-all duration-700 shadow-sm"
                  >
                    <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden bg-background/50 border border-border/30 flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                      {item.variant.product.images?.[0]?.url ? (
                        <img src={item.variant.product.images[0].url} alt={item.variant.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold/20">
                          <Sparkles size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <h3 className="text-3xl font-serif text-foreground group-hover:text-gold transition-colors duration-500 tracking-tight">{item.variant.product.name}</h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                        <span className="glass px-4 py-1.5 rounded-full text-[9px] text-gold uppercase tracking-[.2em] font-black border-gold/20 shadow-sm bg-gold/5">
                          {item.variant.name}
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
                          {formatCurrency(item.variant.price)} {t('each')}
                        </p>
                      </div>

                      <div className="pt-6 flex items-center justify-center sm:justify-start gap-10">
                        <div className="flex items-center gap-6 glass px-6 py-3 rounded-full border border-border/50 shadow-inner group-hover:border-gold/20 transition-all">
                          <button
                            onClick={() => updateQty(item, -1)}
                            className="text-muted-foreground hover:text-gold transition-colors font-serif text-lg p-1"
                          >
                            —
                          </button>
                          <span className="text-xs font-black tracking-widest text-foreground w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item, 1)}
                            className="text-muted-foreground hover:text-gold transition-colors font-serif text-lg p-1"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-muted-foreground/30 hover:text-red-500 hover:rotate-12 transition-all duration-500"
                        >
                          <Trash2 size={22} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <div className="text-3xl font-serif italic text-foreground tracking-tight group-hover:text-gold transition-colors duration-500">
                      {formatCurrency(item.variant.price * item.quantity)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-12">
                {[
                  { icon: Truck, title: t('perks.delivery_title'), desc: t('perks.delivery_desc') },
                  { icon: ShieldCheck, title: t('perks.auth_title'), desc: t('perks.auth_desc') },
                  { icon: RotateCcw, title: t('perks.refill_title'), desc: t('perks.refill_desc') },
                ].map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center p-8 glass bg-foreground/[0.01] rounded-[3rem] border border-border/30 hover:border-gold/20 transition-all duration-700 shadow-sm"
                  >
                    <div className="w-14 h-14 bg-gold/5 rounded-2xl flex items-center justify-center mb-6 border border-gold/10">
                      <g.icon className="text-gold" size={24} strokeWidth={1} />
                    </div>
                    <h5 className="text-[10px] font-black tracking-[.3em] uppercase mb-3 text-foreground">{g.title}</h5>
                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-[.1em] font-medium opacity-60">{g.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="glass bg-background/50 p-12 rounded-[4rem] border border-border/50 shadow-2xl sticky top-40 transition-all backdrop-blur-3xl overflow-hidden group/summary">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShoppingBag size={120} className="text-gold" />
                </div>

                <h2 className="text-4xl font-serif text-foreground italic mb-12 tracking-tight">{t('summary')}</h2>

                <div className="space-y-6 mb-12 relative z-10">
                  <div className="flex justify-between items-center group/line">
                    <span className="text-muted-foreground uppercase tracking-[.4em] text-[9px] font-black opacity-50">{t('subtotal')}</span>
                    <span className="font-serif text-2xl text-foreground text-right">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/line">
                    <span className="text-muted-foreground uppercase tracking-[.4em] text-[9px] font-black opacity-50">{t('shipping')}</span>
                    <span className="text-gold text-[9px] font-black uppercase tracking-[.3em] bg-gold/5 px-4 py-1.5 rounded-full border border-gold/10 animate-pulse">
                      {t('complimentary')}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-10" />
                  <div className="flex justify-between items-baseline group/line">
                    <span className="text-foreground font-black uppercase tracking-[.5em] text-[11px]">{t('total')}</span>
                    <span className="text-5xl font-serif text-gold tracking-tighter">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <Link
                    href="/checkout"
                    className="block w-full bg-gold text-primary-foreground py-6 rounded-full font-black tracking-[.4em] uppercase flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-gold/30 text-[10px]"
                  >
                    {t('proceed_checkout')} <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/collection"
                    className="block w-full border border-border text-muted-foreground/60 py-6 rounded-full font-black tracking-[.4em] uppercase text-center text-[9px] hover:border-gold hover:text-gold transition-all"
                  >
                    {t('continue_shopping')}
                  </Link>
                </div>

                <div className="mt-12 text-center pt-8 border-t border-border/30 relative z-10">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-[.5em] font-medium leading-loose opacity-40">
                    {t('secure_checkout')} <br />
                    <span className="text-foreground font-black opacity-100">{t('intelligence')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
