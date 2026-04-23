'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';

import { Link } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { cartService, type Cart, type CartItem } from '@/services/cart.service';

export default function CartPage() {
  const t = useTranslations('cart');
  const tFeatured = useTranslations('featured');
  const locale = useLocale();
  const format = useFormatter();
  const { isAuthenticated } = useAuth();

  const isVi = locale === 'vi';
  const labels = useMemo(
    () =>
      isVi
        ? {
            selectedLabel: '\u0110\u00e3 ch\u1ecdn',
            summaryHint: 'T\u1ed5ng k\u1ebft ng\u1eafn g\u1ecdn \u0111\u1ec3 b\u1ea1n ki\u1ec3m tra tr\u01b0\u1edbc khi thanh to\u00e1n.',
            quantity: 'S\u1ed1 l\u01b0\u1ee3ng',
            itemPrice: '\u0110\u01a1n gi\u00e1',
            remove: 'X\u00f3a',
            cartPreview: 'Danh s\u00e1ch s\u1ea3n ph\u1ea9m',
            summaryCard: 'T\u00f3m t\u1eaft \u0111\u01a1n h\u00e0ng',
            continue: 'Ti\u1ebfp t\u1ee5c mua s\u1eafm',
          }
        : {
            selectedLabel: 'Selected',
            summaryHint: 'A cleaner summary to review before completing your order.',
            quantity: 'Quantity',
            itemPrice: 'Unit price',
            remove: 'Remove',
            cartPreview: 'Selected products',
            summaryCard: 'Order summary',
            continue: 'Continue shopping',
          },
    [isVi]
  );

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchCart = useCallback(() => {
    if (!isAuthenticated) {
      setCart(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    cartService
      .getCart()
      .then((nextCart) => {
        setCart(nextCart);
        if (nextCart.items.length > 0) {
          setSelectedIds((prev) => {
            const validIds = prev.filter((id) => nextCart.items.some((item) => item.id === id));
            return prev.length > 0 ? validIds : nextCart.items.map((item) => item.id);
          });
        } else {
          setSelectedIds([]);
        }
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQty = async (item: CartItem, delta: number) => {
    const quantity = Math.max(1, item.quantity + delta);
    try {
      const updated = await cartService.updateItem(item.id, quantity);
      setCart(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async (itemId: number) => {
    try {
      const updated = await cartService.removeItem(itemId);
      setCart(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== itemId));
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) =>
    format.number(amount, {
      style: 'currency',
      currency: tFeatured('currency_code') || 'VND',
      maximumFractionDigits: 0,
    });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#ffffff_40%,#fbfaf7_100%)] transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c10_38%,#09090b_100%)]">
        <main className="container-responsive flex min-h-screen items-center justify-center py-24">
          <div className="w-full max-w-2xl rounded-[2.8rem] border border-black/6 bg-card p-10 text-center shadow-[0_30px_90px_-48px_rgba(15,23,42,0.4)] dark:border-white/10 md:p-14">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 text-gold">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h1 className="mt-8 text-4xl font-semibold text-foreground md:text-5xl">{t('title')}</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted-foreground">{t('signin_required')}</p>
            <Link
              href="/login"
              className="mt-10 inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-gold px-8 text-base font-semibold text-luxury-black transition-all hover:scale-[1.01]"
            >
              {t('signin_btn')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const subtotal = selectedItems.reduce((total, item) => total + item.variant.price * item.quantity, 0);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#ffffff_36%,#fbfaf7_100%)] transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c10_35%,#09090b_100%)]">
      <main className="container-responsive py-24 md:py-32">
        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-[2.4rem] border border-black/6 bg-card dark:border-white/10">
            <Loader2 className="h-12 w-12 animate-spin text-gold" />
            <p className="text-base text-muted-foreground">{t('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2.8rem] border border-black/6 bg-card p-10 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.3)] dark:border-white/10 md:p-16"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-8 text-3xl font-semibold text-foreground">{t('empty')}</p>
            <Link
              href="/collection"
              className="mt-10 inline-flex min-h-[56px] items-center justify-center rounded-full border border-gold/30 bg-gold/10 px-8 text-base font-semibold text-gold transition-all hover:border-gold hover:bg-gold hover:text-luxury-black"
            >
              {t('continue_shopping')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[2.2rem] border border-black/6 bg-card p-5 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.25)] dark:border-white/10 md:flex-row md:items-center md:justify-between md:p-6">
                <button type="button" onClick={toggleSelectAll} className="flex items-center gap-4 text-left">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                      selectedIds.length === items.length
                        ? 'border-gold bg-gold text-luxury-black'
                        : 'border-black/10 bg-background text-transparent dark:border-white/10'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gold">{labels.selectedLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedIds.length === items.length ? t('deselect_all') : t('select_all')}
                    </p>
                  </div>
                </button>
                <p className="text-sm font-medium text-muted-foreground">{t('items_selected', { count: selectedIds.length })}</p>
              </div>

              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="overflow-hidden rounded-[2.5rem] border border-black/6 bg-card shadow-[0_26px_80px_-54px_rgba(15,23,42,0.28)] transition-all hover:border-gold/35 dark:border-white/10"
                  >
                    <div className="grid gap-6 p-5 md:grid-cols-[auto_132px_minmax(0,1fr)_auto] md:items-center md:p-6 lg:p-7">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                            selectedIds.includes(item.id)
                              ? 'border-gold bg-gold text-luxury-black'
                              : 'border-black/10 bg-background text-transparent dark:border-white/10'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>

                      <div className="relative aspect-square overflow-hidden rounded-[1.8rem] border border-black/6 bg-background dark:border-white/10">
                        {item.variant.product.images?.[0]?.url ? (
                          <img
                            src={item.variant.product.images[0].url}
                            alt={item.variant.product.name}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gold/30">
                            <Sparkles className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gold">{labels.cartPreview}</p>
                        <h3 className="mt-2 text-2xl leading-tight text-foreground md:text-3xl">
                          {item.variant.product.name}
                        </h3>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold">
                            {item.variant.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {labels.itemPrice}: {formatCurrency(item.variant.price)}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-3 rounded-full border border-black/8 bg-background px-3 py-2 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => updateQty(item, -1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:text-gold"
                            >
                              -
                            </button>
                            <div className="min-w-[72px] text-center">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{labels.quantity}</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{item.quantity}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateQty(item, 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:text-gold"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-5">
                            <p className="text-3xl font-semibold text-foreground">
                              {formatCurrency(item.variant.price * item.quantity)}
                            </p>
                            <button
                              type="button"
                              onClick={() => remove(item.id)}
                              aria-label={labels.remove}
                              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/8 bg-background text-muted-foreground transition-all hover:border-red-300 hover:text-red-500 dark:border-white/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { icon: Truck, title: t('perks.delivery_title'), desc: t('perks.delivery_desc') },
                  { icon: ShieldCheck, title: t('perks.auth_title'), desc: t('perks.auth_desc') },
                  { icon: RotateCcw, title: t('perks.refill_title'), desc: t('perks.refill_desc') },
                ].map((perk) => (
                  <div
                    key={perk.title}
                    className="rounded-[2rem] border border-black/6 bg-card p-6 text-center shadow-[0_18px_50px_-40px_rgba(15,23,42,0.24)] dark:border-white/10"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                      <perk.icon className="h-6 w-6" />
                    </div>
                    <h4 className="mt-5 text-base font-semibold text-foreground">{perk.title}</h4>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{perk.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="overflow-hidden rounded-[2.8rem] border border-black/6 bg-card shadow-[0_28px_80px_-48px_rgba(15,23,42,0.3)] dark:border-white/10">
                <div className="border-b border-border/60 p-6 md:p-8">
                  <p className="text-sm font-medium text-gold">{labels.summaryCard}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">{t('summary')}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{labels.summaryHint}</p>
                </div>

                <div className="space-y-5 p-6 md:p-8">
                  <div className="space-y-3 rounded-[1.8rem] border border-black/6 bg-background p-5 dark:border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{t('subtotal')}</span>
                      <span className="text-xl font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                    </div>

                  </div>

                  <div className="rounded-[1.8rem] border border-black/6 bg-[linear-gradient(135deg,rgba(197,160,89,0.12),rgba(197,160,89,0.05))] p-5 dark:border-white/10">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('total')}</p>
                        <p className="mt-2 text-4xl font-semibold text-gold">{formatCurrency(subtotal)}</p>
                      </div>
                      <div className="rounded-full bg-gold/10 p-3 text-gold">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={selectedIds.length > 0 ? `/checkout?items=${selectedIds.join(',')}` : '#'}
                    onClick={(event) => {
                      if (selectedIds.length === 0) event.preventDefault();
                    }}
                    className={`inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-full px-6 text-base font-semibold transition-all ${
                      selectedIds.length > 0
                        ? 'bg-gold text-luxury-black hover:scale-[1.01]'
                        : 'cursor-not-allowed bg-muted text-muted-foreground opacity-60'
                    }`}
                  >
                    {t('proceed_checkout')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/collection"
                    className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-black/8 bg-background px-6 text-base font-semibold text-foreground transition-all hover:border-gold hover:text-gold dark:border-white/10"
                  >
                    {labels.continue}
                  </Link>

                  <div className="rounded-[1.8rem] border border-black/6 bg-background p-5 text-center dark:border-white/10">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t('secure_checkout')}
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">{t('intelligence')}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
