'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useTranslations, useFormatter } from 'next-intl';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Search, ShoppingCart, CreditCard, Plus, Minus, Receipt, QrCode,
    Store, CheckCircle, AlertTriangle, X, Printer, Sparkles,
    ChevronDown, ChevronUp, Loader2, Phone, User, Award, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffPosService, type PosOrder } from '@/services/staff-pos.service';
import { PosBarcodeCameraDialog } from '@/components/staff/pos-barcode-camera-dialog';
import { storesService, type Store as StoreType } from '@/services/stores.service';
import type { Product } from '@/services/product.service';
import type { PayOSPaymentResponse } from '@/services/payment.service';

type PaymentMethod = 'CASH' | 'QR';
const LOW_STOCK_THRESHOLD = 5;

/** Heuristic: USB scanners send compact codes; free-text product search usually has spaces or is short. */
function isPlausibleBarcodeScan(value: string): boolean {
    const t = value.trim();
    if (t.length < 4) return false;
    if (/\s/.test(t)) return false;
    if (/^\d{4,24}$/.test(t)) return true;
    if (/^[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]$/.test(t) && t.length <= 48) return true;
    return false;
}

function formatVND(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function PosPage() {
    const t = useTranslations('dashboard.pos');
    const format = useFormatter();
    // Store
    const [myStores, setMyStores] = useState<StoreType[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    // Products
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);
    // Order
    const [order, setOrder] = useState<PosOrder | null>(null);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stockWarning, setStockWarning] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [qrPayment, setQrPayment] = useState<PayOSPaymentResponse | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);
    const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Customer / Loyalty
    const [customerPhone, setCustomerPhone] = useState('');
    const [loyaltyInfo, setLoyaltyInfo] = useState<{
        registered: boolean;
        userId: string | null;
        fullName: string | null;
        phone: string;
        email: string | null;
        loyaltyPoints: number;
        transactionCount?: number;
    } | null>(null);
    const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
    // AI Panel
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiGender, setAiGender] = useState('');
    const [aiOccasion, setAiOccasion] = useState('');
    const [aiBudget, setAiBudget] = useState<number>(0);
    const [aiNotes, setAiNotes] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<{
        productId: string; productName: string; variantId?: string; variantName?: string; price: number; reason: string;
    }[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);


    const subtotal = order?.items?.reduce((acc, item) => acc + item.totalPrice, 0) ?? 0;
    const discount = order?.discountAmount ?? 0;
    const finalTotal = order?.finalAmount ?? subtotal;
    const isOrderCompleted = order?.paymentStatus === 'PAID' || order?.status === 'COMPLETED';

    // ─── Store loading ───
    const loadMyStores = useCallback(async () => {
        try {
            const list = await storesService.getMyStores();
            setMyStores(list);
            if (list.length && !selectedStoreId) setSelectedStoreId(list[0].id);
        } catch { /* optional */ }
    }, []);

    useEffect(() => { void loadMyStores(); }, [loadMyStores]);

    // ─── Product loading (filtered by store) ───
    const loadProducts = useCallback(async (term: string, storeId?: string) => {
        setLoadingProducts(true);
        setError(null);
        try {
            const list = await staffPosService.searchProducts(term, storeId || undefined);
            setProducts(list);
        } catch (e: any) {
            setError(e.message || t('errors.load_products'));
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    // Reload products when store changes
    useEffect(() => {
        if (selectedStoreId) loadProducts(search, selectedStoreId);
    }, [selectedStoreId]);

    // Focus product search when entering POS or changing store / starting a new order
    useEffect(() => {
        const id = window.setTimeout(() => searchInputRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
    }, [selectedStoreId, order?.id]);

    // F2 — focus ô tìm sản phẩm (POS)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'F2') return;
            e.preventDefault();
            searchInputRef.current?.focus();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ─── QR polling cleanup ───
    useEffect(() => {
        return () => { if (qrPollRef.current) clearInterval(qrPollRef.current); };
    }, []);

    const startQrPolling = (orderId: string) => {
        if (qrPollRef.current) clearInterval(qrPollRef.current);
        qrPollRef.current = setInterval(async () => {
            try {
                const updated = await staffPosService.getOrder(orderId);
                if (updated.paymentStatus === 'PAID' || updated.status === 'COMPLETED') {
                    if (qrPollRef.current) clearInterval(qrPollRef.current);
                    setOrder(updated);
                    setCompletedOrder(updated);
                    setShowReceipt(true);
                    setQrPayment(null);
                }
            } catch { /* ignore */ }
        }, 3000);
    };

    // ─── Order helpers ───
    const ensureOrder = async () => {
        if (order) return order;
        setCreatingOrder(true);
        setError(null);
        try {
            const created = await staffPosService.createDraft(
                selectedStoreId || undefined,
                customerPhone || undefined,
            );
            setOrder(created);
            return created;
        } catch (e: any) {
            setError(e.message || t('errors.create_draft'));
            throw e;
        } finally {
            setCreatingOrder(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        loadProducts(value, selectedStoreId || undefined);
    };

    const handleAddVariant = async (variantId: string, variantStock: number) => {
        if (variantStock <= 0) {
            setStockWarning(t('product_out_warning'));
            setTimeout(() => setStockWarning(null), 3000);
            return;
        }
        try {
            const current = await ensureOrder();
            const existingItem = current.items?.find(i => i.variantId === variantId);
            const nextQty = (existingItem?.quantity ?? 0) + 1;
            if (nextQty > variantStock) {
                setStockWarning(t('low_stock_warning', { count: variantStock }));
                setTimeout(() => setStockWarning(null), 3000);
                return;
            }
            const updated = await staffPosService.upsertItem(current.id, variantId, nextQty);
            setOrder(updated);
            setError(null);
        } catch (e: any) {
            if (e?.response?.data?.message?.includes('stock') || e?.response?.data?.message?.includes('kho')) {
                setStockWarning(e.response.data.message);
                setTimeout(() => setStockWarning(null), 3000);
            } else {
                setError(e?.response?.data?.message || e.message || t('errors.add_item'));
            }
        }
    };

    const tryAddByBarcode = async (rawCode: string) => {
        const code = rawCode.trim();
        if (!code) return;
        if (!selectedStoreId) {
            setError(t('errors.barcode_no_store'));
            return;
        }
        if (isOrderCompleted) return;

        setLoadingProducts(true);
        setError(null);
        try {
            const list = await staffPosService.searchProductsByBarcode(code, selectedStoreId);
            if (!list.length) {
                setError(t('errors.barcode_not_found'));
                return;
            }
            let matched: { id: string; stock: number } | null = null;
            for (const p of list) {
                for (const v of p.variants ?? []) {
                    if (v.barcode === code) {
                        matched = { id: v.id, stock: v.stock };
                        break;
                    }
                }
                if (matched) break;
            }
            if (!matched) {
                setError(t('errors.barcode_not_found'));
                return;
            }
            await handleAddVariant(matched.id, matched.stock);
            setSearch('');
            await loadProducts('', selectedStoreId);
            searchInputRef.current?.focus();
        } catch (e: any) {
            setError(e?.response?.data?.message || e.message || t('errors.load_products'));
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleChangeQuantity = async (variantId: string, deltaOrValue: number, isAbsolute = false) => {
        if (!order) return;
        const item = order.items.find(i => i.variantId === variantId);
        const currentQty = item?.quantity ?? 0;
        const nextQty = isAbsolute ? Math.max(0, deltaOrValue) : Math.max(0, currentQty + deltaOrValue);

        try {
            const updated = await staffPosService.upsertItem(order.id, variantId, nextQty);
            setOrder(updated);
            setError(null);
            setStockWarning(null);
        } catch (e: any) {
            if (e?.response?.data?.message?.includes('stock') || e?.response?.data?.message?.includes('kho')) {
                setStockWarning(e.response.data.message);
                setTimeout(() => setStockWarning(null), 3000);
            } else {
                setError(e?.response?.data?.message || e.message || t('errors.update_qty'));
            }
        }
    };

    const handlePayCash = async () => {
        if (!order) return;
        setPaying(true);
        setError(null);
        try {
            const paid = await staffPosService.payCash(order.id);
            setOrder(paid);
            setCompletedOrder(paid);
            setShowReceipt(true);
        } catch (e: any) {
            setError(e?.response?.data?.message || e.message || t('errors.pay_cash'));
        } finally {
            setPaying(false);
        }
    };

    const handleCreateQrPayment = async () => {
        if (!order || !order.items.length) return;
        setPaying(true);
        setError(null);
        try {
            const payment = await staffPosService.createQrPayment(order.id);
            setQrPayment(payment);
            startQrPolling(order.id);
        } catch (e: any) {
            setError(e?.response?.data?.message || e.message || t('errors.create_qr'));
        } finally {
            setPaying(false);
        }
    };

    const handleNewOrder = () => {
        if (qrPollRef.current) clearInterval(qrPollRef.current);
        setOrder(null);
        setCompletedOrder(null);
        setShowReceipt(false);
        setQrPayment(null);
        setPaymentMethod('CASH');
        setError(null);
        setStockWarning(null);
        setCustomerPhone('');
        setLoyaltyInfo(null);
        // Reload products for current store
        if (selectedStoreId) loadProducts('', selectedStoreId);
    };

    const handleSetCustomer = async () => {
        if (!customerPhone.trim()) return;
        setLookingUpCustomer(true);
        setError(null);
        setLoyaltyInfo(null);
        try {
            // Lookup loyalty info (registered user or guest)
            const info = await staffPosService.lookupLoyalty(customerPhone.trim());
            setLoyaltyInfo(info);

            // If order exists, attach customer phone to it
            if (order) {
                const updated = await staffPosService.setCustomer(order.id, customerPhone.trim());
                setOrder(updated);
            }
        } catch (e: any) {
            setError(e?.response?.data?.message || e.message || t('errors.lookup_customer'));
        } finally {
            setLookingUpCustomer(false);
        }
    };


    // ─── AI ───
    const handleAiConsult = async () => {
        setAiLoading(true); setAiError(null); setAiResults([]);
        try {
            const res = await staffPosService.aiConsult({
                gender: aiGender || undefined,
                occasion: aiOccasion || undefined,
                budget: aiBudget > 0 ? aiBudget : undefined,
                notes: aiNotes || undefined,
            });
            setAiResults(res.recommendations);
            if (res.recommendations.length === 0) setAiError(t('ai.no_results'));
        } catch (e: any) {
            setAiError(e?.response?.data?.message || e.message || 'AI consultation failed');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAddAiRecommendation = async (variantId?: string) => {
        if (!variantId) return;
        let stock = 999;
        for (const p of products) {
            const v = p.variants?.find(v => v.id === variantId);
            if (v) { stock = v.stock; break; }
        }
        await handleAddVariant(variantId, stock);
    };

    // ─── Helper: get first product image URL ───
    const getProductImage = (p: Product) => {
        const img = p.images?.[0];
        return img?.url ?? null;
    };

    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
                {/* Stock Warning Toast */}
                <AnimatePresence>
                    {stockWarning && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-heading uppercase tracking-widest shadow-xl backdrop-blur-md"
                        >
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {stockWarning}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══════════ Catalog Area ═══════════ */}
                <div className="flex-1 flex flex-col border-r border-border min-w-0">
                    <header className="p-8 border-b border-border flex flex-col gap-2 bg-secondary/10 shrink-0">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 shrink-0">
                                    <Store className="w-4 h-4 text-gold" />
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('store')}:</label>
                                    <select
                                        value={order?.storeId ?? selectedStoreId}
                                        onChange={(e) => {
                                            if (!order) setSelectedStoreId(e.target.value);
                                        }}
                                        disabled={!!order}
                                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-heading uppercase tracking-wider focus:border-gold/60 disabled:opacity-70"
                                    >
                                        <option value="">{t('select_store')}</option>
                                        {myStores.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 flex-1 max-w-xl min-w-0">
                                    <div className="relative flex-1 min-w-0">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={search}
                                            onChange={handleSearchChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (isPlausibleBarcodeScan(search)) {
                                                        void tryAddByBarcode(search);
                                                    }
                                                }
                                            }}
                                            placeholder={t('search_placeholder')}
                                            autoComplete="off"
                                            className="w-full bg-background border border-border rounded-full py-3.5 pl-12 pr-4 text-sm focus:border-gold/50 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        title={t('scan_camera_btn')}
                                        aria-label={t('scan_camera_btn')}
                                        onClick={() => setCameraScannerOpen(true)}
                                        disabled={!selectedStoreId || isOrderCompleted}
                                        className="shrink-0 p-3 rounded-full border border-border bg-background text-gold hover:bg-gold/10 hover:border-gold/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                            {t('barcode_hint')}
                        </p>
                    </header>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar">
                        {loadingProducts ? (
                            <div className="col-span-full text-center text-muted-foreground text-sm">{t('loading_products')}</div>
                        ) : products.length === 0 ? (
                            <div className="col-span-full text-center text-muted-foreground text-sm">
                                {selectedStoreId ? t('no_products.empty_store') : t('no_products.select_store')}
                            </div>
                        ) : (
                            products.flatMap((p) =>
                                (p.variants ?? []).map((v) => {
                                    const isLow = v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD;
                                    const isOut = v.stock <= 0;
                                    const imageUrl = getProductImage(p);
                                    return (
                                        <motion.div
                                            key={v.id}
                                            whileHover={{ y: -5 }}
                                            className={`glass p-5 rounded-[2rem] border-border cursor-pointer group transition-all ${isOut ? 'opacity-50 hover:border-red-500/30' : 'hover:border-gold/30'}`}
                                        >
                                            <div className="aspect-square bg-secondary/50 rounded-2xl mb-4 overflow-hidden relative">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-widest">No Image</div>
                                                )}
                                                <div className={`absolute bottom-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-md rounded-lg text-[9px] uppercase font-heading border ${isOut ? 'text-error border-error/20' : isLow ? 'text-warning border-warning/20' : 'text-gold border-gold/10'}`}>
                                                    {isOut ? `⛔ ${t('out_of_stock')}` : isLow ? `⚠ ${t('low_stock_warning', { count: v.stock })}` : `Stock: ${v.stock}`}
                                                </div>
                                            </div>
                                            <h3 className="font-heading text-sm mb-1 line-clamp-1 uppercase tracking-tight">{p.name}</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">{p.brand?.name ?? '—'}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">{v.name}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="font-heading text-gold text-lg">{formatVND(v.price)}</span>
                                                <button
                                                    onClick={() => handleAddVariant(v.id, v.stock)}
                                                    disabled={creatingOrder || isOrderCompleted || isOut}
                                                    className={`p-3 rounded-xl transition-all disabled:opacity-50 ${isOut ? 'bg-error/10 text-error cursor-not-allowed' : 'bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary-foreground'}`}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )
                        )}
                    </div>

                    {/* AI Consultation Panel */}
                    <div className="border-t border-border bg-secondary/10 shrink-0">
                        <button type="button" onClick={() => setShowAiPanel(!showAiPanel)} className="w-full px-8 py-3 flex items-center justify-between text-[10px] font-heading uppercase tracking-[0.2em] text-gold hover:bg-gold/5 transition-all">
                            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t('ai.title')}</span>
                            {showAiPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <AnimatePresence>
                            {showAiPanel && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-8 pb-6 space-y-3">
                                        <p className="text-[10px] text-muted-foreground">{t('ai.desc')}</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select value={aiGender} onChange={e => setAiGender(e.target.value)} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60">
                                                <option value="">{t('ai.gender')}</option>
                                                <option value="male">{t('ai.genders.male')}</option>
                                                <option value="female">{t('ai.genders.female')}</option>
                                                <option value="unisex">{t('ai.genders.unisex')}</option>
                                            </select>
                                            <select value={aiOccasion} onChange={e => setAiOccasion(e.target.value)} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60">
                                                <option value="">{t('ai.occasion')}</option>
                                                <option value="daily">{t('ai.occasions.daily')}</option>
                                                <option value="office">{t('ai.occasions.office')}</option>
                                                <option value="date">{t('ai.occasions.date')}</option>
                                                <option value="party">{t('ai.occasions.party')}</option>
                                                <option value="gift">{t('ai.occasions.gift')}</option>
                                                <option value="sport">{t('ai.occasions.sport')}</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" value={aiBudget || ''} onChange={e => setAiBudget(Number(e.target.value) || 0)} placeholder={t('ai.budget')} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60" />
                                            <input type="text" value={aiNotes} onChange={e => setAiNotes(e.target.value)} placeholder={t('ai.notes')} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60" />
                                        </div>
                                        <button onClick={handleAiConsult} disabled={aiLoading} className="w-full py-2.5 rounded-full bg-gold text-primary-foreground text-[10px] font-heading uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                                            {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> {t('ai.consulting')}</> : <><Sparkles className="w-3 h-3" /> {t('ai.consult_btn')}</>}
                                        </button>
                                        {aiError && <p className="text-[10px] text-red-500">{aiError}</p>}
                                        {aiResults.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-heading">{t('ai.results_title')}</p>
                                                {aiResults.map((r, i) => (
                                                    <div key={i} className="glass rounded-2xl p-3 border-border space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-heading text-[10px] uppercase tracking-widest">{r.productName}</p>
                                                                {r.variantName && <p className="text-[9px] text-muted-foreground">{r.variantName}</p>}
                                                            </div>
                                                            <span className="font-heading text-gold text-sm">{formatVND(r.price)}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground italic">{r.reason}</p>
                                                        <button onClick={() => handleAddAiRecommendation(r.variantId)} disabled={!r.variantId || isOrderCompleted} className="text-[9px] font-heading uppercase tracking-widest text-gold hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1 pt-1">
                                                            <Plus className="w-3 h-3" /> {t('ai.add_to_bill')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ═══════════ Cart Area ═══════════ */}
                <div className="w-[420px] flex flex-col bg-secondary/10 shrink-0 p-8 shadow-2xl z-10 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <ShoppingCart className="w-6 h-6 text-gold" />
                        <h2 className="font-heading text-lg uppercase tracking-[0.2em]">{t('cart.title')}</h2>
                        {isOrderCompleted && (
                            <span className="ml-auto px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-[9px] font-heading uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {t('cart.paid')}
                            </span>
                        )}
                    </div>

                    {/* Customer Phone / Loyalty Section */}
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gold" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading">{t('cart.customer')}</span>
                        </div>
                        {!isOrderCompleted && (
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => { setCustomerPhone(e.target.value); setLoyaltyInfo(null); }}
                                    placeholder={t('cart.phone_placeholder')}
                                    disabled={isOrderCompleted}
                                    className="flex-1 bg-background border border-border rounded-xl py-2 px-3 text-xs outline-none focus:border-gold/50 transition-all"
                                />
                                <button
                                    onClick={handleSetCustomer}
                                    disabled={!customerPhone.trim() || isOrderCompleted || lookingUpCustomer}
                                    className="px-3 py-2 rounded-xl bg-gold/10 text-gold text-[9px] font-heading uppercase tracking-widest hover:bg-gold/20 disabled:opacity-50 transition-all flex items-center gap-1"
                                >
                                    {lookingUpCustomer ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    {t('cart.lookup_btn')}
                                </button>
                            </div>
                        )}
                        {loyaltyInfo && (
                            <div className="glass rounded-xl p-3 border-border flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loyaltyInfo.registered ? 'bg-gold/10' : 'bg-blue-500/10'}`}>
                                    <User className={`w-4 h-4 ${loyaltyInfo.registered ? 'text-gold' : 'text-blue-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {loyaltyInfo.registered ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <p className="font-heading text-xs uppercase tracking-widest truncate">{loyaltyInfo.fullName ?? loyaltyInfo.phone}</p>
                                                <span className="px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[8px] font-heading uppercase">{t('cart.member')}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Award className="w-3 h-3 text-gold" />
                                                <span className="text-[10px] text-gold font-heading">{t('cart.points', { count: loyaltyInfo.loyaltyPoints })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <p className="font-heading text-xs uppercase tracking-widest">{t('cart.guest')}</p>
                                                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-heading uppercase">{t('cart.guest')}</span>
                                            </div>
                                            {loyaltyInfo.loyaltyPoints > 0 ? (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Award className="w-3 h-3 text-gold" />
                                                    <span className="text-[10px] text-gold font-heading">{t('cart.pending_points', { count: loyaltyInfo.loyaltyPoints })}</span>
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-muted-foreground mt-0.5">{t('cart.guest_desc')}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 text-xs text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar mb-8 pr-2">
                        <AnimatePresence>
                            {order?.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="glass p-5 rounded-2xl border-border flex gap-4 hover:border-gold/20 transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-secondary border border-border shrink-0 overflow-hidden">
                                        {/* Item thumbnail — future: load from variant.product.images */}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-heading text-[10px] uppercase tracking-widest truncate">
                                            {item.variant.product?.name ?? 'Product'} — {item.variant.name}
                                        </p>
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center gap-3 glass rounded-lg p-1 border-border">
                                                <button onClick={() => handleChangeQuantity(item.variantId, -1)} disabled={isOrderCompleted} className="p-1 hover:text-gold transition-colors disabled:opacity-50"><Minus className="w-3 h-3" /></button>
                                                <span className="text-xs font-heading w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => handleChangeQuantity(item.variantId, 1)} disabled={isOrderCompleted} className="p-1 hover:text-gold transition-colors disabled:opacity-50"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <span className="font-heading text-sm text-gold">{formatVND(item.totalPrice)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {!order?.items.length && (
                            <div className="text-xs text-muted-foreground text-center mt-8">{t('cart.no_items')}</div>
                        )}
                    </div>

                    {/* Totals & Payment */}
                    <div className="space-y-4 border-t border-border pt-8 mt-auto">
                        <div className="flex justify-between text-muted-foreground text-[10px] uppercase tracking-widest font-heading">
                            <span>{t('cart.subtotal')}</span><span>{formatVND(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-gold text-[10px] uppercase tracking-widest font-heading">
                                <span>{t('receipt.discount')}</span><span>-{formatVND(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-2xl font-heading pt-4 text-foreground border-t border-border/50">
                            <span className="tracking-tighter uppercase">{t('cart.total')}</span>
                            <span className="text-gold">{formatVND(finalTotal)}</span>
                        </div>

                        {isOrderCompleted ? (
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <button onClick={() => { setCompletedOrder(order); setShowReceipt(true); }} className="py-4 glass border-border rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] hover:border-gold/50 transition-all flex flex-col items-center gap-2">
                                    <Printer className="w-4 h-4 text-gold" /> {t('cart.receipt_btn')}
                                </button>
                                <button onClick={handleNewOrder} className="py-4 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-2">
                                    <Plus className="w-4 h-4" /> {t('cart.new_order_btn')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mt-6 flex gap-2 text-[9px] font-heading uppercase tracking-[0.2em]">
                                    <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-2 rounded-full border ${paymentMethod === 'CASH' ? 'border-gold bg-gold/10 text-gold shadow-[0_4px_12px_rgba(197,160,89,0.1)]' : 'border-border text-muted-foreground'}`}>{t('cart.cash_btn')}</button>
                                    <button type="button" onClick={() => setPaymentMethod('QR')} className={`flex-1 py-2 rounded-full border flex items-center justify-center gap-1 ${paymentMethod === 'QR' ? 'border-gold bg-gold/10 text-gold shadow-[0_4px_12px_rgba(197,160,89,0.1)]' : 'border-border text-muted-foreground'}`}><QrCode className="w-3 h-3" /> {t('cart.qr_btn')}</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <button className="py-4 glass border-border rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] hover:border-gold/50 transition-all flex flex-col items-center gap-2" disabled>
                                        <Receipt className="w-4 h-4 text-gold" /> {t('cart.hold_btn')}
                                    </button>
                                    {paymentMethod === 'CASH' ? (
                                        <button onClick={handlePayCash} disabled={!order || !order.items.length || paying} className="py-4 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-2 disabled:opacity-50">
                                            <CreditCard className="w-4 h-4" /> {paying ? t('cart.processing') : t('cart.charge_cash')}
                                        </button>
                                    ) : (
                                        <button onClick={handleCreateQrPayment} disabled={!order || !order.items.length || paying} className="py-4 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-2 disabled:opacity-50">
                                            <QrCode className="w-4 h-4" /> {paying ? t('cart.generating') : qrPayment ? t('cart.show_qr_again') : t('cart.generate_qr')}
                                        </button>
                                    )}
                                </div>
                                {paymentMethod === 'QR' && qrPayment && (
                                    <div className="mt-6 space-y-2 text-[10px]">
                                        <div className="flex items-center gap-2 text-success">
                                            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
                                            <span className="font-heading uppercase tracking-[0.2em]">{t('cart.waiting_payment')}</span>
                                        </div>
                                        <a href={qrPayment.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-gold text-gold text-[9px] font-heading uppercase tracking-[0.2em] hover:bg-gold/10 group"><Sparkles className="w-3 h-3 mr-2 group-hover:animate-spin" /> {t('cart.open_payos')}</a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ═══════════ Receipt Modal ═══════════ */}
                <AnimatePresence>
                    {showReceipt && completedOrder && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReceipt(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
                                <button onClick={() => setShowReceipt(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-success" /></div>
                                    <h2 className="font-heading text-2xl uppercase tracking-tighter mb-1">{t('receipt.complete')}</h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{t('receipt.order')} {completedOrder.code}</p>
                                </div>
                                {/* Customer info on receipt */}
                                {(completedOrder.user || loyaltyInfo) && (
                                    <div className="glass rounded-xl p-3 border-border flex items-center gap-3 mb-4">
                                        <User className={`w-4 h-4 ${completedOrder.user ? 'text-gold' : 'text-blue-500'}`} />
                                        <div>
                                            {completedOrder.user ? (
                                                <>
                                                    <p className="font-heading text-[10px] uppercase tracking-widest">{completedOrder.user.fullName ?? completedOrder.user.phone}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Award className="w-3 h-3 text-gold" />
                                                        <span className="text-[10px] text-gold font-heading">{t('receipt.earned_points', { count: Math.floor(completedOrder.finalAmount / 10000) })}</span>
                                                    </div>
                                                </>
                                            ) : loyaltyInfo && !loyaltyInfo.registered ? (
                                                <>
                                                    <p className="font-heading text-[10px] uppercase tracking-widest">{t('cart.guest')} — {loyaltyInfo.phone}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Award className="w-3 h-3 text-gold" />
                                                        <span className="text-[10px] text-gold font-heading">{t('receipt.earned_points', { count: Math.floor(completedOrder.finalAmount / 10000) })} {t('receipt.reg_to_use')}</span>
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {completedOrder.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-border/20 pb-2">
                                            <div>
                                                <span className="font-heading text-[10px] uppercase tracking-widest">{item.variant.product?.name}</span>
                                                <span className="text-muted-foreground text-[10px]"> — {item.variant.name}</span>
                                                <span className="text-muted-foreground text-[10px]"> x{item.quantity}</span>
                                            </div>
                                            <span className="font-heading text-gold text-sm">{formatVND(item.totalPrice)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-heading"><span>{t('receipt.subtotal')}</span><span>{formatVND(completedOrder.totalAmount)}</span></div>
                                    {completedOrder.discountAmount > 0 && (
                                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-success font-heading"><span>{t('receipt.discount')}</span><span>-{formatVND(completedOrder.discountAmount)}</span></div>
                                    )}
                                    <div className="flex justify-between text-xl font-heading pt-2"><span className="uppercase tracking-tighter">{t('receipt.total')}</span><span className="text-gold">{formatVND(completedOrder.finalAmount)}</span></div>
                                </div>
                                <div className="mt-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-heading">
                                    {completedOrder.store?.name ?? 'POS'} • {format.dateTime(new Date(), { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowReceipt(false)} className="py-3 glass border-border rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] hover:border-gold/50 transition-all">{t('receipt.close_btn')}</button>
                                    <button onClick={() => { setShowReceipt(false); handleNewOrder(); }} className="py-3 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20">{t('receipt.new_order_btn')}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <PosBarcodeCameraDialog
                    open={cameraScannerOpen}
                    onOpenChange={setCameraScannerOpen}
                    onDetected={(text) => { void tryAddByBarcode(text); }}
                    onError={() => setError(t('errors.camera_scan_failed'))}
                    title={t('scan_camera_title')}
                    description={t('scan_camera_desc')}
                />
            </div>
        </AuthGuard>
    );
}
