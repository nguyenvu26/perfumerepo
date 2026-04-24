'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useTranslations, useFormatter } from 'next-intl';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Search, ShoppingCart, CreditCard, Plus, Minus, Receipt, QrCode,
    Store, CheckCircle, AlertTriangle, X, Printer, Sparkles,
    ChevronDown, ChevronUp, Loader2, Phone, User, Award, Camera, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffPosService, type PosOrder } from '@/services/staff-pos.service';
import { PosBarcodeCameraDialog } from '@/components/staff/pos-barcode-camera-dialog';
import { ReceiptModal } from '@/components/staff/receipt-modal';
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
        productId: string; productName: string; variantId?: string; variantName?: string; price: number; stock: number; reason: string; imageUrl?: string;
    }[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog');


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
                storeId: selectedStoreId || undefined,
            });
            setAiResults(res.recommendations);
            if (res.recommendations.length > 0) setShowAiModal(true);
            if (res.recommendations.length === 0) setAiError(t('ai.no_results'));
        } catch (e: any) {
            setAiError(e?.response?.data?.message || e.message || 'AI consultation failed');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAddAiRecommendation = async (variantId?: string) => {
        if (!variantId) return;

        // Try to find the stock in the current products catalog first
        let stock = -1;
        for (const p of products) {
            const v = p.variants?.find(v => v.id === variantId);
            if (v) { stock = v.stock; break; }
        }

        // If not found in catalog, get it from the AI recommendation data
        if (stock === -1) {
            const rec = aiResults.find(r => r.variantId === variantId);
            if (rec) stock = rec.stock;
        }

        // Fallback to a safe number if STILL not found, but we prefer 0 to block adding out-of-stock
        if (stock === -1) stock = 0;

        await handleAddVariant(variantId, stock);
    };

    // ─── Helper: get first product image URL ───
    const getProductImage = (p: Product) => {
        const img = p.images?.[0];
        return img?.url ?? null;
    };

    return (
        <AuthGuard allowedRoles={['staff', 'admin']}>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden relative bg-background">
                {/* Stock Warning Toast */}
                <AnimatePresence>
                    {stockWarning && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-heading uppercase tracking-widest shadow-xl backdrop-blur-md"
                        >
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {stockWarning}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══════════ Mobile Tab Navigation ═══════════ */}
                <div className="lg:hidden flex bg-secondary/20 border-b border-border p-1 mx-4 mt-4 rounded-2xl shrink-0 z-20">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-heading text-[10px] uppercase tracking-widest ${activeTab === 'catalog' ? 'bg-background text-gold shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <Store className="w-4 h-4" />
                        {t('catalog_tab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-heading text-[10px] uppercase tracking-widest relative ${activeTab === 'cart' ? 'bg-background text-gold shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {t('cart.title')}
                        {order?.items.length ? (
                            <span className="absolute top-2 right-1/4 w-4 h-4 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-[8px]">
                                {order.items.length}
                            </span>
                        ) : null}
                    </button>
                </div>

                {/* ═══════════ Catalog Area ═══════════ */}
                <div className={`flex-1 flex flex-col border-r border-border min-w-0 ${activeTab !== 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
                    <header className="p-4 md:p-6 border-b border-border flex flex-col gap-2 bg-secondary/10 shrink-0">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 shrink-0">
                                    <Store className="w-4 h-4 text-gold" />
                                    {/* <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">{t('store')}:</label>
                                    <select
                                        value={order?.storeId ?? selectedStoreId}
                                        onChange={(e) => {
                                            if (!order) setSelectedStoreId(e.target.value);
                                        }}
                                        disabled={!!order}
                                        className="rounded-lg border border-border bg-background px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-heading uppercase tracking-wider focus:border-gold/60 disabled:opacity-70"
                                    >
                                        <option value="">{t('select_store')}</option>
                                        {myStores.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select> */}
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
                                            className="w-full bg-background border border-border rounded-full py-2.5 md:py-3.5 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:border-gold/50 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        title={t('scan_camera_btn')}
                                        aria-label={t('scan_camera_btn')}
                                        onClick={() => setCameraScannerOpen(true)}
                                        disabled={!selectedStoreId || isOrderCompleted}
                                        className="shrink-0 p-2.5 md:p-3 rounded-full border border-border bg-background text-gold hover:bg-gold/10 hover:border-gold/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
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
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 custom-scrollbar">
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
                                            className={`glass p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border-border cursor-pointer group transition-all ${isOut ? 'opacity-50 hover:border-red-500/30' : 'hover:border-gold/30'}`}
                                        >
                                            <div className="aspect-square bg-secondary/50 rounded-xl md:rounded-2xl mb-3 md:mb-4 overflow-hidden relative">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent flex items-center justify-center text-muted-foreground text-[8px] md:text-[10px] uppercase tracking-widest">No Image</div>
                                                )}
                                                <div className={`absolute bottom-2 left-2 md:bottom-3 md:left-3 px-1.5 md:px-2 py-0.5 md:py-1 bg-background/80 backdrop-blur-md rounded-lg text-[7px] md:text-[9px] uppercase font-heading border ${isOut ? 'text-error border-error/20' : isLow ? 'text-warning border-warning/20' : 'text-gold border-gold/10'}`}>
                                                    {isOut ? `⛔ ${t('out_of_stock')}` : isLow ? `⚠ ${t('low_stock_warning', { count: v.stock })}` : `Stock: ${v.stock}`}
                                                </div>
                                            </div>
                                            <h3 className="font-heading text-[10px] md:text-sm mb-0.5 line-clamp-1 uppercase tracking-tight">{p.name}</h3>
                                            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-0.5">{p.brand?.name ?? '—'}</p>
                                            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                                                {v.name}
                                                {v.barcode && <span className="ml-1 text-gold/40 truncate inline-block max-w-[50%] align-bottom">BC: {v.barcode}</span>}
                                            </p>
                                            <div className="flex justify-between items-center mt-2 md:mt-4">
                                                <span className="font-heading text-gold text-xs md:text-lg">{formatVND(v.price)}</span>
                                                <button
                                                    onClick={() => handleAddVariant(v.id, v.stock)}
                                                    disabled={creatingOrder || isOrderCompleted || isOut}
                                                    className={`p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all disabled:opacity-50 ${isOut ? 'bg-error/10 text-error cursor-not-allowed' : 'bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary-foreground'}`}
                                                >
                                                    <Plus className="w-3 h-3 md:w-4 h-4" />
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
                                            <input type="number" value={aiBudget || ''} onChange={e => setAiBudget(Number(e.target.value) || 0)} onFocus={e => e.target.select()} placeholder={t('ai.budget')} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60" />
                                            <input type="text" value={aiNotes} onChange={e => setAiNotes(e.target.value)} placeholder={t('ai.notes')} className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60" />
                                        </div>
                                        <button onClick={handleAiConsult} disabled={aiLoading} className="w-full py-2.5 rounded-full bg-gold text-primary-foreground text-[10px] font-heading uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                                            {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> {t('ai.consulting')}</> : <><Sparkles className="w-3 h-3" /> {t('ai.consult_btn')}</>}
                                        </button>
                                        {aiError && <p className="text-[10px] text-red-500">{aiError}</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ═══════════ Cart Area ═══════════ */}
                <div className={`w-full lg:w-[420px] flex flex-col bg-secondary/10 shrink-0 p-4 md:p-6 shadow-2xl z-10 transition-all ${activeTab !== 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <ShoppingCart className="w-5 h-5 md:w-6 h-6 text-gold" />
                        <h2 className="font-heading text-sm md:text-lg uppercase tracking-[0.2em]">{t('cart.title')}</h2>
                        {isOrderCompleted && (
                            <span className="ml-auto px-2 md:px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-[8px] md:text-[9px] font-heading uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {t('cart.paid')}
                            </span>
                        )}
                    </div>

                    {/* Customer Phone / Loyalty Section */}
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gold" />
                            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-heading">{t('cart.customer')}</span>
                        </div>
                        {!isOrderCompleted && (
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => { setCustomerPhone(e.target.value); setLoyaltyInfo(null); }}
                                    placeholder={t('cart.phone_placeholder')}
                                    disabled={isOrderCompleted}
                                    className="flex-1 bg-background border border-border rounded-xl py-1.5 md:py-2 px-3 md:px-4 text-[10px] md:text-xs outline-none focus:border-gold/50 transition-all font-body"
                                />
                                <button
                                    onClick={handleSetCustomer}
                                    disabled={!customerPhone.trim() || isOrderCompleted || lookingUpCustomer}
                                    className="px-3 md:px-4 py-1.5 rounded-xl bg-gold/10 text-gold text-[8px] md:text-[9px] font-heading uppercase tracking-widest hover:bg-gold/20 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
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
                    <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar mb-3 pr-1 md:pr-2 min-h-[120px]">
                        <AnimatePresence>
                            {order?.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="glass group p-3.5 rounded-2xl border-border flex gap-4 hover:border-gold/30 hover:bg-gold/[0.03] transition-all relative overflow-hidden"
                                >
                                    {/* Image Section */}
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-secondary border border-border shrink-0 overflow-hidden relative">
                                        {item.variant.product?.images?.[0]?.url ? (
                                            <img
                                                src={item.variant.product.images[0].url}
                                                alt={item.variant.product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <Package className="w-8 h-8" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="pr-6">
                                            <p className="text-[9px] text-gold uppercase tracking-[0.25em] font-black mb-1">
                                                {item.variant.product?.brand?.name ?? 'Aura Perfume'}
                                            </p>
                                            <h3 className="font-heading text-xs uppercase tracking-tight text-foreground line-clamp-1 leading-tight mb-1">
                                                {item.variant.product?.name ?? 'Product'}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                                                {item.variant.name}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-end mt-auto pt-2">
                                            <div className="flex items-center gap-1.5 p-1 glass rounded-full border-border bg-background/60 shadow-sm">
                                                <button
                                                    onClick={() => handleChangeQuantity(item.variantId, -1)}
                                                    disabled={isOrderCompleted}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-[11px] font-heading w-6 text-center text-foreground">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleChangeQuantity(item.variantId, 1)}
                                                    disabled={isOrderCompleted}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[9px] text-muted-foreground/50 font-medium mb-0.5">
                                                    {formatVND(item.unitPrice)}/1
                                                </p>
                                                <span className="font-heading text-sm text-gold tracking-tighter">
                                                    {formatVND(item.totalPrice)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleChangeQuantity(item.variantId, 0, true)}
                                        disabled={isOrderCompleted}
                                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 disabled:hidden z-10"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {!order?.items.length && (
                            <div className="text-xs text-muted-foreground text-center mt-8">{t('cart.no_items')}</div>
                        )}
                    </div>

                    {/* Totals & Payment */}
                    <div className="space-y-2 border-t border-border pt-4 mt-auto">
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
                                <button onClick={() => { setCompletedOrder(order); setShowReceipt(true); }} className="py-3 glass border-border rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] hover:border-gold/50 transition-all flex flex-col items-center gap-2">
                                    <Printer className="w-4 h-4 text-gold" /> {t('cart.receipt_btn')}
                                </button>
                                <button onClick={handleNewOrder} className="py-3 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-2">
                                    <Plus className="w-4 h-4" /> {t('cart.new_order_btn')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mt-4 flex gap-2 text-[8px] md:text-[9px] font-heading uppercase tracking-[0.2em]">
                                    <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-1.5 rounded-full border ${paymentMethod === 'CASH' ? 'border-gold bg-gold/10 text-gold shadow-[0_4px_12px_rgba(197,160,89,0.1)]' : 'border-border text-muted-foreground'}`}>{t('cart.cash_btn')}</button>
                                    <button type="button" onClick={() => setPaymentMethod('QR')} className={`flex-1 py-1.5 rounded-full border flex items-center justify-center gap-1 ${paymentMethod === 'QR' ? 'border-gold bg-gold/10 text-gold shadow-[0_4px_12px_rgba(197,160,89,0.1)]' : 'border-border text-muted-foreground'}`}><QrCode className="w-3 h-3" /> {t('cart.qr_btn')}</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button className="py-2.5 glass border-border rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] hover:border-gold/50 transition-all flex flex-col items-center gap-1.5" disabled>
                                        <Receipt className="w-3.5 h-3.5 text-gold" /> {t('cart.hold_btn')}
                                    </button>
                                    {paymentMethod === 'CASH' ? (
                                        <button onClick={handlePayCash} disabled={!order || !order.items.length || paying} className="py-2.5 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-1.5 disabled:opacity-50">
                                            <CreditCard className="w-3.5 h-3.5" /> {paying ? t('cart.processing') : t('cart.charge_cash')}
                                        </button>
                                    ) : (
                                        <button onClick={handleCreateQrPayment} disabled={!order || !order.items.length || paying} className="py-2.5 bg-gold text-primary-foreground font-heading font-bold rounded-2xl text-[9px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex flex-col items-center gap-1.5 disabled:opacity-50">
                                            <QrCode className="w-3.5 h-3.5" /> {paying ? t('cart.generating') : qrPayment ? t('cart.show_qr_again') : t('cart.generate_qr')}
                                        </button>
                                    )}
                                </div>
                                {paymentMethod === 'QR' && qrPayment && (
                                    <div className="mt-4 space-y-2 text-[10px]">
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
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    order={completedOrder}
                    loyaltyInfo={loyaltyInfo}
                    onNewOrder={handleNewOrder}
                />

                <PosBarcodeCameraDialog
                    open={cameraScannerOpen}
                    onOpenChange={setCameraScannerOpen}
                    onDetected={(text) => { void tryAddByBarcode(text); }}
                    onError={() => setError(t('errors.camera_scan_failed'))}
                    title={t('scan_camera_title')}
                    description={t('scan_camera_desc')}
                />

                {/* AI Results Modal */}
                <AnimatePresence>
                    {showAiModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] border-border shadow-2xl flex flex-col overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-secondary/10 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gold/10 text-gold">
                                            <Sparkles className="w-5 h-5 md:w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="font-heading text-sm md:text-lg uppercase tracking-[0.2em]">{t('ai.results_title')}</h2>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('ai.desc')}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowAiModal(false)}
                                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-4">
                                        {aiResults.map((r, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="glass group p-4 md:p-6 rounded-[2rem] border-border hover:border-gold/30 transition-all flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex gap-4 mb-4">
                                                        {/* Product Image */}
                                                        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl overflow-hidden bg-secondary/50 border border-border group-hover:border-gold/40 transition-colors">
                                                            {r.imageUrl ? (
                                                                <img 
                                                                    src={r.imageUrl} 
                                                                    alt={r.productName}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                    <Package className="w-8 h-8 opacity-20" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-[9px] text-gold uppercase tracking-[0.2em] font-black">Expert Choice</p>
                                                                <div className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] uppercase font-heading border ${r.stock > 0 ? 'bg-success/5 text-success border-success/20' : 'bg-error/5 text-error border-error/20'}`}>
                                                                    Stock: {r.stock}
                                                                </div>
                                                            </div>
                                                            <h4 className="font-heading text-sm md:text-base uppercase tracking-tight text-foreground line-clamp-2 leading-tight mb-1">
                                                                {r.productName}
                                                            </h4>
                                                            {r.variantName && (
                                                                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                                                                    {r.variantName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-3 md:p-4 rounded-2xl bg-secondary/30 border border-border/50 mb-4 group-hover:bg-gold/5 transition-colors">
                                                        <p className="text-[10px] md:text-xs text-foreground/80 italic leading-relaxed">
                                                            "{r.reason}"
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="font-heading text-xs md:text-lg text-gold">{formatVND(r.price)}</span>
                                                    <button
                                                        onClick={() => {
                                                            handleAddAiRecommendation(r.variantId);
                                                        }}
                                                        disabled={r.stock <= 0 || isOrderCompleted}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold hover:text-primary-foreground transition-all text-[9px] md:text-[10px] font-heading uppercase tracking-widest disabled:opacity-50"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {t('cart.add_btn') || 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-border bg-secondary/5 flex justify-end">
                                    <button 
                                        onClick={() => setShowAiModal(false)}
                                        className="px-8 py-2 rounded-full border border-border text-[10px] font-heading uppercase tracking-widest hover:bg-secondary transition-all"
                                    >
                                        {t('cart.receipt_close') || 'Close'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AuthGuard>
    );
}
