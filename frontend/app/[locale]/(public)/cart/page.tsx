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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  const isPendingPayment = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('pending_payment');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return true;
        }
      } catch {}
    }
    return false;
  }, []);

  const fetchCart = useCallback(() => {
    if (!isAuthenticated) {
      setCart(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check if there is an active pending payment first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pending_payment');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
            const tempCart: Cart = {
              id: 'pending_cart',
              userId: '',
              items: parsed.cartItems || [],
            };
            setCart(tempCart);
            setSelectedIds(tempCart.items.map((item) => item.id));
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('pending_payment');
          }
        } catch (e) {
          localStorage.removeItem('pending_payment');
        }
      }
    }

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
    if (isPendingPayment()) {
      toast.error(
        isVi
          ? 'Đơn hàng đang trong quá trình thanh toán, không thể chỉnh sửa số lượng.'
          : 'Order is pending payment, cannot update quantity.'
      );
      return;
    }
    const quantity = Math.max(1, item.quantity + delta);
    try {
      const updated = await cartService.updateItem(item.id, quantity);
      setCart(updated);
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message || (error as Error).message;
      toast.error(msg || (isVi ? 'Không thể cập nhật số lượng.' : 'Failed to update quantity.'));
    }
  };

  const handleInputChange = async (item: CartItem, value: string, totalAvailable: number) => {
    if (isPendingPayment()) {
      toast.error(
        isVi
          ? 'Đơn hàng đang trong quá trình thanh toán, không thể chỉnh sửa số lượng.'
          : 'Order is pending payment, cannot update quantity.'
      );
      return;
    }

    if (value === '') {
      setInputValues((prev) => ({ ...prev, [item.id]: value }));
      return;
    }

    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly === '') return;

    const parsedQty = parseInt(digitsOnly, 10);
    setInputValues((prev) => ({ ...prev, [item.id]: digitsOnly }));

    if (parsedQty > totalAvailable) {
      return;
    }

    if (parsedQty >= 1) {
      try {
        const updated = await cartService.updateItem(item.id, parsedQty);
        setCart(updated);
      } catch (error) {
        const msg = (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message || (error as Error).message;
        toast.error(msg || (isVi ? 'Không thể cập nhật số lượng.' : 'Failed to update quantity.'));
      }
    }
  };

  const handleInputBlur = async (item: CartItem, totalAvailable: number) => {
    const tempVal = inputValues[item.id];
    if (tempVal === undefined) return;

    setInputValues((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    if (tempVal === '') {
      return;
    }

    const parsedQty = parseInt(tempVal, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      if (item.quantity !== 1) {
        try {
          const updated = await cartService.updateItem(item.id, 1);
          setCart(updated);
        } catch {}
      }
    } else if (parsedQty > totalAvailable) {
      toast.error(
        isVi
          ? `Số lượng nhập vượt quá hàng tồn kho (${totalAvailable}).`
          : `Quantity entered exceeds available stock (${totalAvailable}).`
      );
      if (item.quantity !== totalAvailable) {
        try {
          const updated = await cartService.updateItem(item.id, totalAvailable);
          setCart(updated);
        } catch {}
      }
    }
  };

  const remove = async (itemId: number) => {
    if (isPendingPayment()) {
      toast.error(
        isVi
          ? 'Đơn hàng đang trong quá trình thanh toán, không thể xóa sản phẩm.'
          : 'Order is pending payment, cannot remove item.'
      );
      return;
    }
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
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-[2.5rem] border border-black/5 bg-card/50 backdrop-blur-xl dark:border-white/5">
            <Loader2 className="h-12 w-12 animate-spin text-gold" />
            <p className="text-base text-muted-foreground/60 italic font-medium">{t('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 px-10 text-center"
          >
            <div className="relative mb-10">
              <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 text-gold shadow-2xl">
                <ShoppingBag className="h-10 w-10" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-4xl font-heading tracking-tight italic gold-gradient md:text-5xl">{t('empty')}</h1>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">{t('signin_required')}</p>
            <Link
              href="/collection"
              className="mt-12 inline-flex h-14 items-center justify-center rounded-full bg-gold px-12 text-sm font-black uppercase tracking-[0.2em] text-luxury-black transition-all hover:scale-[1.05] hover:shadow-xl hover:shadow-gold/20"
            >
              {t('continue_shopping')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-12 xl:grid-cols-[1fr_400px]">
            {/* Left side: Cart List */}
            <div className="space-y-10">
              <header className="flex items-end justify-between px-6 pb-2 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-6">
                   <button 
                    type="button" 
                    onClick={toggleSelectAll}
                    className="group flex h-8 w-8 items-center justify-center rounded-xl border border-gold/30 transition-all hover:border-gold shadow-lg"
                   >
                      <div className={cn(
                        "h-5 w-5 rounded-md transition-all duration-500 flex items-center justify-center",
                        selectedIds.length === items.length ? "bg-gold scale-100" : "bg-transparent scale-0"
                      )}>
                        <Check className="h-4 w-4 text-luxury-black" strokeWidth={3} />
                      </div>
                   </button>
                   <div className="space-y-1">
                    <h1 className="text-3xl font-heading italic gold-gradient tracking-tight">{t('title')}</h1>
                    <button onClick={toggleSelectAll} className="block text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-gold transition-colors">
                      {selectedIds.length === items.length ? t('deselect_all') : t('select_all')}
                    </button>
                   </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gold mb-1 opacity-80">{labels.selectedLabel}</p>
                  <p className="text-2xl font-heading italic">{selectedIds.length} {isVi ? 'sản phẩm' : 'selected'}</p>
                </div>
              </header>

              <div className="glass overflow-hidden rounded-[3.5rem] border border-black/5 bg-white/[0.01] shadow-2xl dark:border-white/5">
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="group relative grid gap-10 p-10 md:grid-cols-[auto_180px_1fr_auto] md:items-center"
                      >
                        {/* Selector */}
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          className="flex h-10 w-10 items-center justify-center"
                        >
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-xl border transition-all duration-500 shadow-sm",
                            selectedIds.includes(item.id) 
                              ? "border-gold bg-gold text-luxury-black" 
                              : "border-black/20 bg-transparent group-hover:border-gold/50 dark:border-white/20"
                          )}>
                             <Check className={cn("h-4 w-4 transition-all", selectedIds.includes(item.id) ? "scale-100" : "scale-0")} strokeWidth={3} />
                          </div>
                        </button>

                        {/* Image */}
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-black/5 shadow-inner dark:bg-white/5">
                           {item.variant.product.images?.[0]?.url ? (
                            <img
                              src={item.variant.product.images[0].url}
                              alt={item.variant.product.name}
                              className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gold/20">
                              <ShoppingBag className="h-12 w-12" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-center gap-5">
                           <div className="space-y-2">
                              <p className="text-xs font-black uppercase tracking-[0.35em] text-gold/70">{item.variant.product.brand?.name || 'Perfume GPT'}</p>
                              <Link 
                                href={`/product/${item.variant.product.slug}`}
                                className="text-3xl font-heading leading-tight hover:text-gold transition-colors block italic tracking-tight"
                              >
                                {item.variant.product.name}
                              </Link>
                           </div>
                           
                           <div className="flex flex-wrap items-center gap-4">
                              <span className="text-[11px] font-black uppercase tracking-widest bg-gold/10 text-gold px-4 py-1.5 rounded-full border border-gold/20 shadow-sm">
                                {item.variant.name}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground italic">
                                {labels.itemPrice}: <span className="text-foreground">{formatCurrency(item.variant.price)}</span>
                              </span>
                           </div>

                           <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-8">
                              {/* Integrated Quantity Selector */}
                              <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-1.5 rounded-full w-fit border border-black/5 dark:border-white/5 shadow-inner">
                                 <button
                                    type="button"
                                    onClick={() => updateQty(item, -1)}
                                    disabled={item.quantity <= 1}
                                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gold hover:text-luxury-black transition-all disabled:opacity-20 bg-background/50"
                                  >
                                    <span className="text-2xl font-light">-</span>
                                  </button>
                                  
                                  <div className="flex flex-col items-center px-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={inputValues[item.id] !== undefined ? inputValues[item.id] : String(item.quantity)}
                                      onChange={(e) => handleInputChange(item, e.target.value, item.variant.inventories?.[0]?.available ?? 99)}
                                      onBlur={() => handleInputBlur(item, item.variant.inventories?.[0]?.available ?? 99)}
                                      className="w-12 bg-transparent text-center text-base font-black text-foreground focus:outline-none"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => updateQty(item, 1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gold hover:text-luxury-black transition-all bg-background/50 shadow-sm"
                                  >
                                    <span className="text-2xl font-light">+</span>
                                  </button>
                              </div>

                              {/* Stock status */}
                              {(() => {
                                const totalAvailable = item.variant.inventories?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;
                                return totalAvailable > 0 && (
                                  <div className="flex items-center gap-2.5 py-1.5 px-4 rounded-full bg-emerald-500/5 border border-emerald-500/10 whitespace-nowrap min-w-fit">
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full animate-pulse",
                                      totalAvailable < 5 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                                      {isVi ? `Sẵn sàng: ${totalAvailable}` : `In Stock: ${totalAvailable}`}
                                    </span>
                                  </div>
                                )
                              })()}
                           </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex md:flex-col items-center md:items-end justify-between gap-6">
                           <div className="text-right">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1 leading-none">{isVi ? 'Tạm tính' : 'Subtotal'}</p>
                              <p className="text-4xl font-heading italic gold-gradient tracking-tighter leading-none">
                                {formatCurrency(item.variant.price * item.quantity)}
                              </p>
                           </div>
                           
                           <button
                              type="button"
                              onClick={() => remove(item.id)}
                              className="group/trash flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5 transition-transform group-hover/trash:scale-110" strokeWidth={1.5} />
                            </button>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right side: Sidebar Summary */}
            <aside className="xl:sticky xl:top-32 xl:self-start">
              <div className="glass overflow-hidden rounded-[3rem] border border-black/5 bg-white/[0.01] shadow-3xl dark:border-white/5">
                <div className="p-10 md:p-12">
                   <div className="mb-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold mb-3 opacity-70">{labels.summaryCard}</p>
                      <h2 className="text-5xl font-heading italic tracking-tighter leading-none mb-4">{t('summary')}</h2>
                      <p className="text-xs text-muted-foreground italic leading-relaxed opacity-60">
                        {labels.summaryHint}
                      </p>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between text-muted-foreground pb-4 border-b border-black/5 dark:border-white/5">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('subtotal')}</span>
                         <span className="text-xl font-heading italic text-foreground">{formatCurrency(subtotal)}</span>
                      </div>
                      
                      <div className="py-2">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">{t('total')}</span>
                            <p className="text-lg font-heading italic text-muted-foreground opacity-40">{isVi ? 'Tất cả' : 'Total'}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-7xl font-heading italic gold-gradient tracking-tighter leading-none mb-4">
                              {formatCurrency(subtotal)}
                            </p>
                            <div className="flex items-center justify-end gap-2 text-gold/60">
                               <ShieldCheck className="w-3.5 h-3.5" />
                               <span className="text-[9px] font-black uppercase tracking-widest leading-none">{isVi ? 'Giá đã bao gồm thuế & phí' : 'Inc. Taxes & Fees'}</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <Link
                          href={selectedIds.length > 0 ? `/checkout?items=${selectedIds.join(',')}` : '#'}
                          onClick={(e) => selectedIds.length === 0 && e.preventDefault()}
                          className={cn(
                            "flex h-16 w-full items-center justify-center gap-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 shadow-xl",
                            selectedIds.length > 0 
                              ? "bg-gold text-luxury-black hover:scale-[1.02] hover:shadow-gold/20" 
                              : "bg-white/5 text-muted-foreground opacity-30 cursor-not-allowed"
                          )}
                        >
                          {t('proceed_checkout')}
                          <ArrowRight className="h-4 w-4" strokeWidth={3} />
                        </Link>

                        <Link
                          href="/collection"
                          className="flex h-16 w-full items-center justify-center rounded-full border border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.1em] text-foreground transition-all hover:bg-gold hover:text-luxury-black hover:border-gold"
                        >
                          {labels.continue}
                        </Link>
                      </div>

                      <div className="pt-10 text-center border-t border-black/5 dark:border-white/5">
                         <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-40 mb-5">
                           {t('secure_checkout')}
                         </p>
                         <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-8 w-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group/pay relative overflow-hidden transition-all hover:border-gold/30">
                                 <div className="absolute inset-0 bg-gold/5 scale-0 group-hover/pay:scale-100 transition-transform duration-500 rounded-lg" />
                                 <div className="h-3 w-7 bg-muted-foreground/10 rounded-sm relative z-10" />
                              </div>
                            ))}
                         </div>
                         <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-gold/30 italic">Perfume GPT Security</p>
                      </div>
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
