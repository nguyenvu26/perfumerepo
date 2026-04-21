"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import {
  storesService,
  type StockOverview,
  type StockOverviewStore,
  type Store,
} from "@/services/stores.service";
import { productService, type Product } from "@/services/product.service";
import {
  adminInventoryRequestService,
  type InventoryRequest,
} from "@/services/staff-inventory.service";
import {
  Plus,
  ArrowRightLeft,
  Search,
  Trash2,
  Save,
  LayoutGrid,
  FileInput,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Check,
  X,
  ClipboardCheck,
  Tag,
  PackageSearch
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type BatchItem = {
  variantId: string;
  productName: string;
  variantName: string;
  brandName: string;
  quantity: number;
};

type TabType = "overview" | "batch-import" | "transfer" | "requests";

export default function AdminStockRedesignPage() {
  const t = useTranslations("dashboard.admin.stock");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [storeList, setStoreList] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Batch Import State
  const [importStoreId, setImportStoreId] = useState("");
  const [importItems, setImportItems] = useState<BatchItem[]>([]);
  const [importSearch, setImportSearch] = useState("");
  const [importReason, setImportReason] = useState("");

  // Transfer State
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferItems, setTransferItems] = useState<BatchItem[]>([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Inventory Requests State
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState<string>("PENDING");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, stores, prodRes] = await Promise.all([
        storesService.getStockOverview(),
        storesService.list(),
        productService.adminList({ take: 200 }),
      ]);
      setOverview(ov);
      setStoreList(stores);
      setProducts(prodRes.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await adminInventoryRequestService.list({
        status: requestFilter || undefined,
      });
      setRequests(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestFilter]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    }
  }, [activeTab, fetchRequests]);

  const handleApprove = async (id: number) => {
    setReviewingId(id);
    try {
      await adminInventoryRequestService.approve(id);
      setSuccess("Request approved successfully.");
      fetchRequests();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectNote.trim()) return;
    setReviewingId(id);
    try {
      await adminInventoryRequestService.reject(id, rejectNote.trim());
      setSuccess("Request rejected.");
      setShowRejectModal(null);
      setRejectNote("");
      fetchRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReviewingId(null);
    }
  };

  // --- Helpers ---
  const allVariants = useMemo(() => {
    return products.flatMap((p) =>
      (p.variants ?? []).map((v) => ({
        id: v.id,
        productName: p.name,
        variantName: v.name,
        brandName: p.brand?.name || "Unknown Brand",
        fullName: `${p.name} — ${v.name}`,
        sku: v.sku,
        price: v.price,
        imageUrl: p.images?.[0]?.url ?? null,
        stock: v.stock,
      })),
    );
  }, [products]);

  const filteredVariantsImport = useMemo(() => {
    if (!importSearch.trim()) return allVariants.slice(0, 15);
    return allVariants
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(importSearch.toLowerCase()) ||
          v.sku?.toLowerCase().includes(importSearch.toLowerCase()) ||
          v.brandName.toLowerCase().includes(importSearch.toLowerCase()),
      )
      .slice(0, 30);
  }, [allVariants, importSearch]);

  const filteredVariantsTransfer = useMemo(() => {
    if (!transferFromId || !overview) return [];
    const sourceStore = overview.stores.find(
      (s) => s.store.id === transferFromId,
    );
    if (!sourceStore) return [];

    const storeAssets = sourceStore.variants.map((v) => ({
      id: v.variantId,
      productName: v.productName,
      variantName: v.variantName,
      brandName: v.brandName || "Unknown Brand",
      fullName: `${v.productName} — ${v.variantName}`,
      quantity: v.quantity,
      sku: "",
    }));

    if (!transferSearch.trim()) return storeAssets.slice(0, 20);
    return storeAssets
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(transferSearch.toLowerCase()) ||
          v.brandName.toLowerCase().includes(transferSearch.toLowerCase()),
      )
      .slice(0, 30);
  }, [overview, transferFromId, transferSearch]);

  const addImportItem = (variant: (typeof allVariants)[0]) => {
    if (importItems.find((i) => i.variantId === variant.id)) return;
    setImportItems([
      ...importItems,
      {
        variantId: variant.id,
        productName: variant.productName,
        variantName: variant.variantName,
        brandName: variant.brandName,
        quantity: 1,
      },
    ]);
    setImportSearch("");
  };

  const addTransferItem = (variant: any) => {
    if (transferItems.find((i) => i.variantId === variant.id)) return;
    setTransferItems([
      ...transferItems,
      {
        variantId: variant.id,
        productName: variant.productName,
        variantName: variant.variantName,
        brandName: variant.brandName,
        quantity: 1,
      },
    ]);
    setTransferSearch("");
  };

  // --- Actions ---
  const handleBatchImport = async () => {
    if (!importStoreId || importItems.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const item of importItems) {
        await storesService.adminImportStock({
          storeId: importStoreId,
          variantId: item.variantId,
          quantity: item.quantity,
          reason: importReason || "Batch Import Session",
        });
      }
      setSuccess(`Successfully imported ${importItems.length} items.`);
      setImportItems([]);
      setImportReason("");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleBatchTransfer = async () => {
    if (!transferFromId || !transferToId || transferItems.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const item of transferItems) {
        await storesService.transferStock({
          fromStoreId: transferFromId,
          toStoreId: transferToId,
          variantId: item.variantId,
          quantity: item.quantity,
          reason: transferReason || "Batch Transfer Session",
        });
      }
      setSuccess(`Successfully transferred ${transferItems.length} items.`);
      setTransferItems([]);
      setTransferReason("");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="p-8 max-w-[1800px] mx-auto">
        <header className="mb-8 md:mb-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar">
            <div className="flex gap-2 bg-secondary/10 dark:bg-white/5 p-1.5 rounded-2xl sm:rounded-[2rem] border border-stone-200 dark:border-white/5 min-w-max">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-white dark:bg-zinc-900 shadow-xl text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Global View
              </button>
              <button
                onClick={() => setActiveTab("batch-import")}
                className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "batch-import" ? "bg-white dark:bg-zinc-900 shadow-xl text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
              >
                <FileInput className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Batch Import
              </button>
              <button
                onClick={() => setActiveTab("transfer")}
                className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "transfer" ? "bg-white dark:bg-zinc-900 shadow-xl text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Transfer
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === "requests" ? "bg-white dark:bg-zinc-900 shadow-xl text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Approval
              </button>
            </div>
          </div>
        </header>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-5 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-4"
            >
              <AlertCircle className="w-5 h-5" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-4"
            >
              <CheckCircle2 className="w-5 h-5" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-[700px]">
          {/* --- TAB 1: OVERVIEW GRID --- */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-8 sm:gap-12">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                  <Loader2 className="w-12 h-12 animate-spin text-gold/40" />
                  <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse italic">
                    Syncing Global Assets...
                  </p>
                </div>
              ) : (
                overview?.stores.map((storeData) => (
                  <section
                    key={storeData.store.id}
                    className="glass rounded-[2.5rem] sm:rounded-[4rem] border border-stone-200 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <div className="px-8 sm:px-12 py-8 sm:py-10 bg-secondary/10 dark:bg-white/[0.03] border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <Tag className="w-4 h-4 text-gold opacity-50" />
                          <h3 className="font-heading text-xl sm:text-3xl uppercase tracking-tighter text-foreground italic">
                            {storeData.store.name}
                          </h3>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.3em] pl-8 font-black opacity-40">
                          Boutique ID: {storeData.store.code || "SYS-DEFAULT"}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-10 bg-black/5 dark:bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none">
                        <div className="text-right">
                          <p className="font-heading text-3xl sm:text-4xl text-gold leading-none italic">
                            {storeData.totalUnits}
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-widest mt-2 font-black opacity-30">
                            Total SKU Units
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/20 text-muted-foreground bg-foreground/[0.01]">
                            <th className="pl-12 pr-4 py-6 text-[9px] uppercase tracking-widest font-black opacity-40 w-24">Media</th>
                            <th className="px-6 py-6 text-[9px] uppercase tracking-widest font-black opacity-40"> Olfactory Asset / Identifier</th>
                            <th className="px-6 py-6 text-[9px] uppercase tracking-widest font-black opacity-40 text-center">Edition / Size</th>
                            <th className="px-12 py-6 text-[9px] uppercase tracking-widest font-black opacity-40 text-right">Available Inventory</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {storeData.variants.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-12 py-32 text-center text-muted-foreground italic font-serif text-2xl opacity-20">
                                Empty Boutique. No inventory records established.
                              </td>
                            </tr>
                          ) : (
                            storeData.variants.map((v) => (
                              <tr key={v.variantId} className="group hover:bg-gold/[0.03] transition-all duration-500">
                                <td className="pl-12 pr-4 py-5">
                                  {v.imageUrl ? (
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 group-hover:scale-105 transition-all duration-700 shadow-md relative">
                                        <Image 
                                            src={v.imageUrl} 
                                            alt="" 
                                            fill
                                            sizes="64px"
                                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" 
                                        />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center border border-border/10">
                                      <PackageSearch className="w-6 h-6 text-muted-foreground/20" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-5">
                                  <p className="font-heading text-base uppercase tracking-tight group-hover:text-gold transition-colors leading-tight italic">
                                    {v.productName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-black opacity-40 italic">
                                    {v.brandName}
                                  </p>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span className="px-5 py-2 rounded-full bg-secondary/50 dark:bg-white/[0.03] text-[9px] uppercase tracking-widest font-black border border-border/10 group-hover:border-gold/30 transition-all">
                                    {v.variantName}
                                  </span>
                                </td>
                                <td className="px-12 py-5 text-right">
                                  <span className={`font-heading text-2xl italic ${v.quantity === 0 ? "text-destructive" : v.quantity <= 5 ? "text-amber-500" : "text-foreground"}`}>
                                    {v.quantity}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden p-6 space-y-4">
                        {storeData.variants.length === 0 ? (
                            <div className="py-20 text-center opacity-20 italic font-serif">Empty Boutique</div>
                        ) : (
                            storeData.variants.map((v) => (
                                <div key={v.variantId} className="flex items-center gap-5 p-5 rounded-[2rem] bg-secondary/10 dark:bg-white/[0.02] border border-border/5">
                                     <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border/10 shadow-sm">
                                         {v.imageUrl ? <img src={v.imageUrl} className="w-full h-full object-cover grayscale" /> : <PackageSearch size={24} className="m-auto opacity-10" />}
                                     </div>
                                     <div className="flex-1 min-w-0 space-y-1">
                                         <p className="text-[10px] font-heading uppercase text-foreground leading-tight truncate italic">{v.productName}</p>
                                         <div className="flex items-center gap-3">
                                            <span className="text-[8px] bg-secondary px-3 py-1 rounded-full uppercase font-black tracking-widest">{v.variantName}</span>
                                            <span className={`text-sm font-heading ${v.quantity <= 5 ? 'text-gold' : 'text-foreground'} italic`}>{v.quantity}</span>
                                         </div>
                                     </div>
                                </div>
                            ))
                        )}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}

          {/* --- TAB 2: BATCH IMPORT --- */}
          {activeTab === "batch-import" && (
            <div className="flex flex-col gap-8 sm:gap-12 animate-in fade-in duration-700">
              {/* Configuration Header */}
              <div className="glass p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border-stone-200 dark:border-white/10 flex flex-col lg:flex-row gap-8 sm:gap-12 items-stretch lg:items-center shadow-xl">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-4 font-black opacity-50 ml-2">
                    Destination Boutique
                  </label>
                  <select
                    value={importStoreId}
                    onChange={(e) => setImportStoreId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer hover:bg-gold/[0.03]"
                  >
                    <option value="">-- Choose Target Store --</option>
                    {storeList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || "POS"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-4 font-black opacity-50 ml-2">
                    Import Metadata / Reason
                  </label>
                  <input
                    type="text"
                    value={importReason}
                    onChange={(e) => setImportReason(e.target.value)}
                    placeholder="e.g. Q1 Seasonal Restock"
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-8 py-4 sm:py-5 text-sm font-serif italic outline-none focus:border-gold transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 items-start">
                {/* Product Selector */}
                <div className="lg:col-span-2 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3 mb-6">
                      <PackageSearch className="w-5 h-5 text-gold" />
                      <h3 className="font-heading text-sm uppercase tracking-widest">
                        Universal Product Catalog
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={importSearch}
                        onChange={(e) => setImportSearch(e.target.value)}
                        placeholder="Filter by name, brand or sku..."
                        className="w-full bg-background border border-border rounded-2xl pl-14 pr-6 py-4 text-sm outline-none focus:border-gold transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {filteredVariantsImport.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => addImportItem(v)}
                          className="flex items-center justify-between p-5 rounded-2xl bg-secondary/20 hover:bg-gold/10 border border-border hover:border-gold/30 transition-all text-left group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                            {v.imageUrl ? (
                              <img
                                src={v.imageUrl}
                                alt={v.productName}
                                className="w-12 h-12 rounded-xl object-cover border border-border group-hover:border-gold/30 transition-all shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                                <PackageSearch className="w-5 h-5 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-heading uppercase text-gold mb-1">
                                {v.brandName}
                              </p>
                              <p className="text-xs font-bold uppercase tracking-tight leading-tight group-hover:text-gold transition-colors">
                                {v.productName}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] px-3 py-0.5 bg-background border border-border rounded-full font-heading text-foreground uppercase tracking-widest">
                                  {v.variantName}
                                </span>
                                <span className="text-[8px] text-muted-foreground font-mono tracking-tighter">
                                  SKU: {v.sku || "N/A"}
                                </span>
                                <span
                                  className={`text-[8px] font-heading px-2 py-0.5 rounded-full ${v.stock === 0 ? "bg-destructive/10 text-destructive" : v.stock <= 5 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}
                                >
                                  Stock: {v.stock}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-background rounded-xl border border-border group-hover:bg-gold group-hover:text-primary-foreground transition-all">
                            <Plus className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Processing List */}
                <div className="lg:col-span-3 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                    <h3 className="font-heading text-sm uppercase tracking-widest">
                      Staging Manifest ({importItems.length})
                    </h3>
                    <button
                      onClick={() => setImportItems([])}
                      className="px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest font-heading text-muted-foreground hover:text-destructive transition-all"
                    >
                      Flush Session
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {importItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-6">
                        <FileInput className="w-20 h-20 stroke-[0.5px]" />
                        <p className="text-xs uppercase tracking-[0.5em] font-heading text-center max-w-xs leading-relaxed">
                          Search and add products to begin
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {importItems.map((item, idx) => (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              key={item.variantId}
                              className="flex items-center justify-between p-5 rounded-2xl bg-secondary/20 border border-border hover:border-gold/30 transition-all text-left group"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                                {(() => {
                                  const variant = allVariants.find(
                                    (v) => v.id === item.variantId,
                                  );
                                  const imgUrl = variant?.imageUrl;
                                  return imgUrl ? (
                                    <img
                                      src={imgUrl}
                                      alt={item.productName}
                                      className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                                      <PackageSearch className="w-4 h-4 text-muted-foreground/30" />
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-heading uppercase text-gold mb-1">
                                    {item.brandName}
                                  </p>
                                  <p className="text-xs font-bold uppercase tracking-tight leading-tight">
                                    {item.productName}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[9px] px-3 py-0.5 bg-background border border-border rounded-full font-heading text-foreground uppercase tracking-widest">
                                      {item.variantName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">
                                    Qty
                                  </label>
                                  <input
                                    type="number"
                                    value={item.quantity || ""}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === ""
                                          ? 0
                                          : parseInt(e.target.value, 10);
                                      setImportItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx
                                            ? { ...it, quantity: val }
                                            : it,
                                        ),
                                      );
                                    }}
                                    className="w-20 bg-background border border-border rounded-xl px-3 py-2 text-center font-heading text-xs focus:border-gold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                  />
                                </div>
                                <button
                                  onClick={() =>
                                    setImportItems((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="p-3 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  <div className="p-10 border-t border-border bg-secondary/5">
                    <button
                      onClick={handleBatchImport}
                      disabled={
                        saving || importItems.length === 0 || !importStoreId
                      }
                      className="w-full py-6 bg-gold text-primary font-heading font-bold uppercase tracking-[0.4em] text-[11px] rounded-full shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {saving ? "Processing..." : "Confirm Import Session"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 3: TRANSFER --- */}
          {activeTab === "transfer" && (
            <div className="flex flex-col gap-8 sm:gap-12 animate-in fade-in duration-700">
              {/* Transfer Matrix Header */}
              <div className="glass p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border-stone-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 sm:gap-12 items-center shadow-xl">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block font-black opacity-50 ml-2 leading-none">
                    Source Boutique
                  </label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose Origin --</option>
                    {storeList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-center relative py-4 md:py-0">
                  <div className="p-5 bg-background dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-full shadow-2xl text-gold z-10 rotate-90 md:rotate-0">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border/20 -z-0 hidden md:block"></div>
                  <div className="absolute top-0 left-1/2 w-[1px] h-full bg-border/20 -z-0 md:hidden"></div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block font-black opacity-50 ml-2 leading-none">
                    Target Boutique
                  </label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose Destination --</option>
                    {storeList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 items-start">
                {/* Asset Finder */}
                <div className="lg:col-span-2 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3 mb-6">
                      <Search className="w-5 h-5 text-gold" />
                      <h3 className="font-heading text-sm uppercase tracking-widest">
                        Asset Finder
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={transferSearch}
                        onChange={(e) => setTransferSearch(e.target.value)}
                        placeholder={
                          transferFromId
                            ? "Search in source..."
                            : "Select source first..."
                        }
                        disabled={!transferFromId}
                        className="w-full bg-background border border-border rounded-2xl pl-14 pr-6 py-4 text-sm outline-none focus:border-gold disabled:opacity-50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {!transferFromId ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                        <ArrowRightLeft className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest font-heading">
                          Select Source Boutique
                        </p>
                      </div>
                    ) : filteredVariantsTransfer.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                        <PackageSearch className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest font-heading">
                          No assets found
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {filteredVariantsTransfer.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => addTransferItem(v)}
                            className="flex items-center justify-between p-5 rounded-2xl bg-secondary/20 hover:bg-luxury-black hover:text-white border border-border transition-all text-left group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                              {(() => {
                                const storeVariant = overview?.stores
                                  .find((s) => s.store.id === transferFromId)
                                  ?.variants.find(
                                    (sv) => sv.variantId === v.id,
                                  );
                                const imgUrl = storeVariant?.imageUrl;
                                return imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={v.productName}
                                    className="w-12 h-12 rounded-xl object-cover border border-border group-hover:border-white/20 transition-all shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center shrink-0 group-hover:bg-white/10">
                                    <PackageSearch className="w-5 h-5 text-muted-foreground/30" />
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-heading uppercase text-gold mb-1 group-hover:text-gold/80">
                                  {v.brandName}
                                </p>
                                <p className="text-xs font-bold uppercase tracking-tight leading-tight">
                                  {v.productName}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[9px] px-3 py-0.5 bg-background text-luxury-black border border-border rounded-full font-heading group-hover:bg-white/10 group-hover:text-white">
                                    {v.variantName}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground group-hover:text-gold">
                                    In Stock: {v.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Send className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Manifest List */}
                <div className="lg:col-span-3 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                    <h3 className="font-heading text-sm uppercase tracking-widest">
                      Relocation Manifest ({transferItems.length})
                    </h3>
                    <button
                      onClick={() => setTransferItems([])}
                      className="text-[9px] uppercase tracking-widest font-heading text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {transferItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-6 opacity-50">
                        <ArrowRightLeft className="w-20 h-20 stroke-[0.5px]" />
                        <p className="text-xs uppercase tracking-[0.5em] font-heading">
                          Declare assets for movement
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transferItems.map((item, idx) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={item.variantId}
                            className="flex items-center justify-between p-5 rounded-2xl bg-secondary/20 border border-border hover:border-luxury-black/30 transition-all text-left group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                              {(() => {
                                const storeVariant = overview?.stores
                                  .find((s) => s.store.id === transferFromId)
                                  ?.variants.find(
                                    (sv) => sv.variantId === item.variantId,
                                  );
                                const imgUrl = storeVariant?.imageUrl;
                                return imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={item.productName}
                                    className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                                    <PackageSearch className="w-4 h-4 text-muted-foreground/30" />
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-heading uppercase text-gold mb-1">
                                  {item.brandName}
                                </p>
                                <p className="text-xs font-bold uppercase tracking-tight leading-tight">
                                  {item.productName}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[9px] px-3 py-0.5 bg-background border border-border rounded-full font-heading text-foreground uppercase tracking-widest">
                                    {item.variantName}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">
                                  Move
                                </label>
                                <input
                                  type="number"
                                  value={item.quantity || ""}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? 0
                                        : parseInt(e.target.value, 10);
                                    setTransferItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, quantity: val }
                                          : it,
                                      ),
                                    );
                                  }}
                                  className="w-20 bg-background border border-border rounded-xl px-3 py-2 text-center font-heading text-xs focus:border-gold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  setTransferItems((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                className="p-3 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-10 border-t border-border">
                    <button
                      onClick={handleBatchTransfer}
                      disabled={
                        saving ||
                        transferItems.length === 0 ||
                        !transferFromId ||
                        !transferToId
                      }
                      className="w-full py-6 bg-luxury-black text-white dark:bg-gold dark:text-primary font-heading font-bold uppercase tracking-[0.4em] text-[11px] rounded-full shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {saving ? "Processing..." : "Confirm Movement"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 4: APPROVAL QUEUE --- */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-8">
              {/* Filter Bar */}
              <div className="glass p-8 rounded-[3rem] border-border flex items-center gap-6">
                <ClipboardCheck className="w-6 h-6 text-gold" />
                <h3 className="font-heading text-sm uppercase tracking-widest mr-auto">
                  Inventory Requests
                </h3>
                <div className="flex gap-2 bg-secondary/20 p-1 rounded-xl border border-border">
                  {(["PENDING", "APPROVED", "REJECTED", ""] as const).map(
                    (s) => (
                      <button
                        key={s || "ALL"}
                        onClick={() => setRequestFilter(s)}
                        className={`px-5 py-2 rounded-lg text-[9px] font-heading uppercase tracking-widest transition-all ${requestFilter === s ? "bg-background shadow-lg text-gold" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {s || "All"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Request List */}
              <div className="glass rounded-[3rem] border-border overflow-hidden">
                {requestsLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-gold/50" />
                    <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse">
                      Loading requests...
                    </p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground/30">
                    <ClipboardCheck className="w-20 h-20 stroke-[0.5px]" />
                    <p className="text-xs uppercase tracking-[0.5em] font-heading">
                      No {requestFilter.toLowerCase() || ""} requests found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground">
                          <th className="pl-10 pr-4 py-5 text-[10px] uppercase tracking-widest font-heading w-16"></th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            Product / Variant
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            Store
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            Type
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            Quantity
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            Reason
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            Staff
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            Status
                          </th>
                          <th className="px-10 py-5 text-[10px] uppercase tracking-widest font-heading text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {requests.map((r) => (
                          <tr
                            key={r.id}
                            className="group hover:bg-gold/5 transition-all"
                          >
                            <td className="pl-10 pr-4 py-4">
                              {r.imageUrl ? (
                                <img
                                  src={r.imageUrl}
                                  alt={r.product ?? ""}
                                  className="w-11 h-11 rounded-xl object-cover border border-border"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-secondary/50 border border-border flex items-center justify-center">
                                  <PackageSearch className="w-4 h-4 text-muted-foreground/30" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-heading text-sm uppercase tracking-tight">
                                {r.product}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {r.variantName} · {r.brand}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs font-heading uppercase tracking-tight">
                                {r.store.name}
                              </p>
                              <p className="text-[9px] text-muted-foreground">
                                {r.store.code || "SYS"}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`text-[9px] px-3 py-1 rounded-full font-heading uppercase tracking-widest ${r.type === "IMPORT" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
                              >
                                {r.type === "IMPORT"
                                  ? "Nhập kho"
                                  : "Điều chỉnh"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`font-heading text-lg ${r.quantity > 0 ? "text-emerald-600" : "text-destructive"}`}
                              >
                                {r.quantity > 0 ? "+" : ""}
                                {r.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {r.reason || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs">
                                {r.staff?.name || r.staff?.email}
                              </p>
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(r.createdAt).toLocaleString("vi-VN")}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {r.status === "PENDING" && (
                                <span className="text-[9px] px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-heading uppercase tracking-widest animate-pulse">
                                  Pending
                                </span>
                              )}
                              {r.status === "APPROVED" && (
                                <div>
                                  <span className="text-[9px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-heading uppercase tracking-widest">
                                    Approved
                                  </span>
                                  {r.reviewer && (
                                    <p className="text-[8px] text-muted-foreground mt-1">
                                      by {r.reviewer.name || r.reviewer.email}
                                    </p>
                                  )}
                                </div>
                              )}
                              {r.status === "REJECTED" && (
                                <div>
                                  <span className="text-[9px] px-3 py-1 rounded-full bg-destructive/10 text-destructive font-heading uppercase tracking-widest">
                                    Rejected
                                  </span>
                                  {r.reviewNote && (
                                    <p
                                      className="text-[8px] text-destructive/70 mt-1 max-w-[120px] truncate"
                                      title={r.reviewNote}
                                    >
                                      {r.reviewNote}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-10 py-4 text-right">
                              {r.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApprove(r.id)}
                                    disabled={reviewingId === r.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[9px] font-heading uppercase tracking-widest transition-all disabled:opacity-50"
                                  >
                                    {reviewingId === r.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowRejectModal(r.id);
                                      setRejectNote("");
                                    }}
                                    disabled={reviewingId === r.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-[9px] font-heading uppercase tracking-widest transition-all disabled:opacity-50"
                                  >
                                    <X className="w-3 h-3" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reject Modal */}
              <AnimatePresence>
                {showRejectModal !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
                    onClick={() => setShowRejectModal(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-background/98 dark:bg-zinc-900 rounded-[2rem] border border-border max-w-lg w-full p-10 shadow-2xl"
                    >
                      <h3 className="font-heading text-lg uppercase tracking-widest mb-2 text-destructive">
                        Reject Request
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Provide a reason for rejection. This will be visible to
                        the staff member.
                      </p>
                      <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Reason for rejection..."
                        rows={3}
                        className="w-full bg-secondary/30 border border-border rounded-2xl px-6 py-4 text-sm font-body outline-none focus:border-destructive transition-all resize-none mb-6"
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowRejectModal(null)}
                          className="flex-1 py-4 border border-border rounded-full text-[10px] font-heading uppercase tracking-widest hover:bg-secondary/20 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(showRejectModal)}
                          disabled={
                            !rejectNote.trim() ||
                            reviewingId === showRejectModal
                          }
                          className="flex-1 py-4 bg-destructive text-white rounded-full text-[10px] font-heading uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                          {reviewingId === showRejectModal ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Confirm Rejection
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
