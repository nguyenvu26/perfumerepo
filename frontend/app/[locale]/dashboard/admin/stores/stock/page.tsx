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
  PackageSearch,
  Globe,
  Layers,
  BarChart3,
  ChevronDown,
  Truck,
  Building2,
  Filter,
  History,
  User,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { inventoryTransferService } from "@/services/inventory-transfer.service";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type BatchItem = {
  variantId: string;
  productName: string;
  variantName: string;
  brandName: string;
  quantity: number;
  costPrice: number; // New field for Purchase Price
  sku?: string;
};

type TabType = "overview" | "batch-import" | "transfer" | "requests" | "history";

export default function AdminStockRedesignPage() {
  const t = useTranslations("dashboard.admin.stock");
  const tInv = useTranslations("inventory");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
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
  const [viewMode, setViewMode] = useState<"matrix" | "store">("matrix");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [matrixSearch, setMatrixSearch] = useState("");

  // History State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [historyFilterType, setHistoryFilterType] = useState<string>("");
  const historyTake = 20;

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

  const searchParams = useSearchParams();

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
        purchasePrice: v.purchasePrice,
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
      quantity: v.available,
      sku: v.sku || "",
    }));

    if (!transferSearch.trim()) return storeAssets.slice(0, 20);
    return storeAssets
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(transferSearch.toLowerCase()) ||
          v.brandName.toLowerCase().includes(transferSearch.toLowerCase()) ||
          v.sku.toLowerCase().includes(transferSearch.toLowerCase()),
      )
      .slice(0, 30);
  }, [overview, transferFromId, transferSearch]);

  const stockMatrix = useMemo(() => {
    if (!overview) return [];
    const variantMap = new Map<string, any>();
    
    overview.stores.forEach(storeData => {
      storeData.variants.forEach(v => {
        if (!variantMap.has(v.variantId)) {
          variantMap.set(v.variantId, {
            id: v.variantId,
            productName: v.productName,
            variantName: v.variantName,
            brandName: v.brandName,
            sku: v.sku,
            barcode: v.barcode,
            imageUrl: v.imageUrl,
            stocks: {}, // storeId -> quantity
            total: 0
          });
        }
        const entry = variantMap.get(v.variantId);
        const qty = Number(v.available) || 0;
        entry.stocks[storeData.store.id] = qty;
        entry.total += qty;
      });
    });
    
    let result = Array.from(variantMap.values());
    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase();
      result = result.filter(v => 
        v.productName.toLowerCase().includes(q) || 
        v.brandName?.toLowerCase().includes(q) ||
        v.variantName.toLowerCase().includes(q) ||
        v.sku?.toLowerCase().includes(q) ||
        v.barcode?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [overview, matrixSearch]);

  const stats = useMemo(() => {
    if (!overview) return { totalSku: 0, globalUnits: 0, lowStockAlerts: 0, activeHubs: 0 };
    const lowStockThreshold = 10;
    let lowStockAlerts = 0;
    
    // Total SKU is unique variants in the matrix
    const totalSku = stockMatrix.length;
    const globalUnits = overview.summary.totalUnits;
    const activeHubs = overview.stores.length;
    
    // Check for variants that are low in ANY store
    stockMatrix.forEach(v => {
      const isLow = Object.values(v.stocks).some((qty: any) => qty <= lowStockThreshold);
      if (isLow) lowStockAlerts++;
    });

    return { totalSku, globalUnits, lowStockAlerts, activeHubs };
  }, [overview, stockMatrix]);

  const warehouses = useMemo(() => {
    if (!overview) return [];
    // Sort Central first
    return [...overview.stores].sort((a, b) => {
      if (a.store.type === 'CENTRAL') return -1;
      if (b.store.type === 'CENTRAL') return 1;
      return 0;
    }).map(s => s.store);
  }, [overview]);

  useEffect(() => {
    fetchData();
    const tab = searchParams.get('tab');
    if (tab === 'transfer' || tab === 'batch-import' || tab === 'requests' || tab === 'overview' || tab === 'history') {
      setActiveTab(tab as TabType);
    }
  }, [fetchData, searchParams]);

  // Handle auto-adding variant from URL (e.g. from Products page)
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    if (variantId && products.length > 0 && activeTab === 'batch-import') {
      const v = allVariants.find(av => av.id === variantId);
      if (v && !importItems.find(i => i.variantId === v.id)) {
        setImportItems(prev => [...prev, {
          variantId: v.id,
          productName: v.productName,
          variantName: v.variantName,
          brandName: v.brandName,
          quantity: 1,
          costPrice: v.purchasePrice || 0
        }]);
      }
    }
  }, [searchParams, products, activeTab, allVariants, importItems]);

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
      setSuccess(t("requests.success_approve"));
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
      setSuccess(t("requests.success_reject"));
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
        costPrice: variant.purchasePrice || 0,
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
        costPrice: 0,
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
      await storesService.batchImportStock({
        storeId: importStoreId,
        items: importItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          purchasePrice: item.costPrice
        })),
        reason: importReason || t("import.default_reason"),
      });
      setSuccess(t("import.success", { count: importItems.length }));
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
      await inventoryTransferService.create({
        fromStoreId: transferFromId,
        toStoreId: transferToId,
        items: transferItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      setSuccess(t("transfer.success", { count: transferItems.length }));
      setTransferItems([]);
      setTransferReason("");
      fetchData();
      
      // Navigate to the transfers page to see the new order
      setTimeout(() => {
        setSuccess(null);
        router.push(`/${locale}/dashboard/admin/inventory/transfers`);
      }, 2000);
    } catch (e: any) {
      setError(e.response?.data?.message || (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await productService.adminGetInventoryLogs({
        skip: historySkip,
        take: historyTake,
        type: historyFilterType || undefined,
      });
      setHistoryLogs(res.items);
      setHistoryTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setHistoryLoading(false);
    }
  }, [historySkip, historyFilterType]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'ADJUST': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'TRANSFER_IN': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'TRANSFER_OUT': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'SALE_POS':
      case 'SALE_ONLINE': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'RETURN': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-muted-foreground bg-secondary/30 border-white/5';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'Nhập kho lô';
      case 'ADJUST': return 'Điều chỉnh';
      case 'TRANSFER_IN': return 'Nhập điều chuyển';
      case 'TRANSFER_OUT': return 'Xuất điều chuyển';
      case 'SALE':
      case 'SALE_POS':
      case 'SALE_ONLINE': return 'Bán hàng';
      case 'RETURN': return 'Trả hàng';
      default: return type;
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="p-8 max-w-[1800px] mx-auto space-y-12">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
          <div className="space-y-8">
            <button
              onClick={() => router.push(`/${locale}/dashboard/admin/stores`)}
              className="group flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 border border-white/20 text-[11px] uppercase tracking-[.3em] font-black hover:bg-gold hover:text-white transition-all active:scale-95 shadow-2xl shadow-gold/5 w-fit hover:border-gold/50"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-2" />
              Quay lại hệ thống cửa hàng
            </button>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-[1px] bg-gold/50" />
                <span className="text-[11px] uppercase tracking-[.5em] font-black text-gold italic">Global Logistics Intelligence</span>
              </div>
              <h1 className="text-7xl sm:text-8xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-[0.8]">
                {t('title')}
              </h1>
              <p className="text-sm text-muted-foreground font-medium opacity-50 italic max-w-xl leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Action Buttons Hub */}
            <div className="flex flex-wrap gap-4 justify-end">
              <button
                onClick={() => router.push(`/${locale}/dashboard/admin/inventory/transfers`)}
                className="flex items-center gap-3 bg-secondary/20 hover:bg-gold/10 border border-white/10 hover:border-gold/30 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all"
              >
                <ArrowRightLeft className="w-4 h-4 text-gold" />
                Phiếu Điều Chuyển
              </button>
              <button
                className="flex items-center gap-3 bg-secondary/20 hover:bg-gold/10 border border-white/10 hover:border-gold/30 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all"
              >
                <ClipboardCheck className="w-4 h-4 text-gold" />
                Kiểm Kê Kho
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard/admin/inventory/cost-setup`)}
                className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest text-emerald-400 transition-all shadow-lg shadow-emerald-500/5"
              >
                <Wallet className="w-4 h-4" />
                Thiết lập Giá Vốn
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard/admin/inventory/reports`)}
                className="flex items-center gap-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest text-blue-400 transition-all shadow-lg shadow-blue-500/5"
              >
                <BarChart3 className="w-4 h-4" />
                Báo Cáo Tồn Kho
              </button>
            </div>

            <div className="flex gap-2 bg-white/5 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl shadow-3xl overflow-x-auto no-scrollbar">
              {[
                { id: "overview", icon: LayoutGrid, label: t('tabs.overview') },
                { id: "batch-import", icon: FileInput, label: t('tabs.import') },
                { id: "transfer", icon: ArrowRightLeft, label: t('tabs.transfer') },
                { id: "requests", icon: ClipboardCheck, label: t('tabs.requests') },
                { id: "history", icon: History, label: tInv('history_title') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                    activeTab === tab.id 
                      ? "bg-gold text-white shadow-[0_10px_30px_rgba(212,175,55,0.3)] scale-105" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
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
          {/* --- TAB 1: OVERVIEW & MATRIX --- */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-1000">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                  <Loader2 className="w-12 h-12 animate-spin text-gold/40" />
                  <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse italic">
                    {t('status.syncing')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                      { label: tInv('matrix.stats.total_sku'), value: stats.totalSku, icon: Layers, color: "text-blue-500", bg: "from-blue-500/10" },
                      { label: tInv('matrix.stats.global_stock'), value: stats.globalUnits, icon: Globe, color: "text-emerald-500", bg: "from-emerald-500/10" },
                      { label: tInv('matrix.stats.low_stock_alerts'), value: stats.lowStockAlerts, icon: AlertCircle, color: "text-amber-500", highlight: stats.lowStockAlerts > 0, bg: "from-amber-500/10" },
                      { label: tInv('matrix.stats.active_warehouses'), value: stats.activeHubs, icon: Building2, color: "text-gold", bg: "from-gold/10" },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "relative overflow-hidden glass p-8 rounded-[3rem] border-white/5 group hover:border-gold/30 transition-all duration-700",
                          "bg-gradient-to-br to-transparent"
                        )}
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", stat.bg)} />
                        
                        <div className="relative z-10 flex flex-col gap-8">
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl",
                              stat.color
                            )}>
                              <stat.icon className="w-7 h-7" />
                            </div>
                            {stat.highlight && (
                              <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 animate-pulse">Critical Alert</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-[10px] uppercase tracking-[.3em] font-black text-muted-foreground opacity-50 mb-2 group-hover:text-foreground transition-colors">{stat.label}</p>
                            <div className="flex items-end gap-3">
                              <span className={cn(
                                "font-heading text-5xl italic tracking-tighter leading-none",
                                stat.highlight ? "text-amber-500" : "text-foreground group-hover:text-gold transition-colors"
                              )}>
                                {stat.value}
                              </span>
                              <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest mb-1 italic">Records</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Matrix Controls */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 glass p-6 rounded-[3rem] border border-white/10 bg-zinc-900/40 backdrop-blur-2xl sticky top-8 z-40 shadow-3xl">
                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                      {[
                        { id: "matrix", icon: Layers, label: tInv('matrix.view_comparison') },
                        { id: "store", icon: Building2, label: tInv('matrix.view_store') },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setViewMode(mode.id as any)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                            viewMode === mode.id 
                              ? "bg-gold text-white shadow-lg shadow-gold/20" 
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <mode.icon className="w-3.5 h-3.5" />
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                        <input
                          type="text"
                          value={matrixSearch}
                          onChange={(e) => setMatrixSearch(e.target.value)}
                          placeholder="Search global assets by SKU, brand, or name..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-gold/50 focus:bg-white/[0.07] transition-all placeholder:text-muted-foreground/30 shadow-inner"
                        />
                      </div>
                      
                      {viewMode === "store" && (
                        <select
                          value={selectedStoreId || ""}
                          onChange={(e) => setSelectedStoreId(e.target.value || null)}
                          className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-gold/50 transition-all cursor-pointer hover:bg-white/10 min-w-[200px]"
                        >
                          <option value="">All Locations</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {viewMode === "matrix" ? (
                    /* --- MATRIX VIEW --- */
                    <section className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl bg-white/[0.01]">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.03] backdrop-blur-md">
                              <th className="pl-12 pr-4 py-10 text-[10px] uppercase tracking-[.3em] font-black opacity-40 min-w-[350px]">
                                {tInv('matrix.product_info')}
                              </th>
                              {warehouses.map((w) => (
                                <th key={w.id} className="px-6 py-10 text-[10px] uppercase tracking-[.3em] font-black opacity-40 text-center min-w-[140px] border-l border-white/5">
                                  <div className="flex flex-col items-center gap-1">
                                    {w.type === 'CENTRAL' && <Globe className="w-3 h-3 text-gold mb-1" />}
                                    <span className={cn(w.type === 'CENTRAL' ? "text-gold" : "text-muted-foreground")}>{w.name}</span>
                                    <span className="text-[7px] opacity-30 font-bold">{w.code || "HUB"}</span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-12 py-10 text-[10px] uppercase tracking-[.3em] font-black text-gold text-right min-w-[180px] border-l border-white/5 bg-gold/5">
                                {tInv('matrix.global_total')}
                              </th>
                              <th className="px-8 py-10 text-[10px] uppercase tracking-[.3em] font-black opacity-40 text-center min-w-[100px]">
                                Ops
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {stockMatrix.length === 0 ? (
                              <tr>
                                <td colSpan={warehouses.length + 3} className="px-12 py-40 text-center">
                                  <div className="flex flex-col items-center justify-center opacity-20 italic">
                                    <PackageSearch className="w-20 h-20 mb-6" />
                                    <p className="text-3xl font-heading uppercase tracking-widest">No assets discovered</p>
                                    <p className="text-xs mt-2 font-black">Refine your search parameters or check warehouse sync</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              stockMatrix.map((v, idx) => (
                                <motion.tr 
                                  key={v.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: Math.min(idx * 0.05, 1) }}
                                  className="group/row hover:bg-white/[0.04] transition-all duration-500"
                                >
                                  <td className="pl-12 pr-4 py-8">
                                    <div className="flex items-center gap-8">
                                      <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/10 group-hover/row:scale-110 group-hover/row:rotate-3 transition-all duration-700 shadow-2xl">
                                          {v.imageUrl ? (
                                            <Image src={v.imageUrl} alt="" fill sizes="64px" className="object-cover grayscale group-hover/row:grayscale-0 transition-all duration-1000" />
                                          ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                              <PackageSearch className="w-6 h-6 text-muted-foreground/20" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-2xl">
                                          <Tag className="w-3 h-3 text-gold" />
                                        </div>
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1.5">
                                          <p className="font-heading text-xl uppercase tracking-tighter group-hover/row:text-gold transition-colors italic truncate">
                                            {v.productName}
                                          </p>
                                          <span className="px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20 text-gold text-[8px] font-black uppercase tracking-widest">
                                            {v.variantName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[9px] text-muted-foreground uppercase tracking-[.2em] font-black opacity-40 italic">{v.brandName}</span>
                                          {v.sku && (
                                            <>
                                              <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                              <span className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">{v.sku}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  {warehouses.map((w) => {
                                    const qty = v.stocks[w.id] || 0;
                                    return (
                                      <td key={w.id} className="px-6 py-8 text-center border-l border-white/[0.03]">
                                        <div className="flex flex-col items-center gap-1">
                                          <span className={cn(
                                            "font-heading text-2xl italic transition-all duration-500",
                                            qty === 0 ? "text-white/10" : qty <= 5 ? "text-amber-500 scale-110" : "text-foreground/90 group-hover/row:text-foreground"
                                          )}>
                                            {qty}
                                          </span>
                                          {qty > 0 && qty <= 5 && (
                                            <span className="text-[8px] uppercase font-black tracking-tighter text-amber-500/50">Low Stock</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="px-12 py-8 text-right border-l border-white/[0.03] bg-gold/[0.02] group-hover/row:bg-gold/[0.05] transition-colors">
                                    <div className="flex flex-col items-end">
                                      <span className={cn(
                                        "font-heading text-4xl italic gold-gradient tracking-tighter",
                                        v.total === 0 && "opacity-20"
                                      )}>
                                        {v.total}
                                      </span>
                                      <span className="text-[9px] uppercase font-black tracking-[.3em] opacity-30 italic">Total Global</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-8 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveTab("transfer");
                                        addTransferItem(v);
                                        if (!transferFromId) {
                                          const sourceEntry = Object.entries(v.stocks as Record<string, number>).find(
                                            ([_, qty]) => qty > 0
                                          );
                                          if (sourceEntry) setTransferFromId(sourceEntry[0]);
                                        }
                                      }}
                                      className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-gold text-muted-foreground hover:text-white transition-all duration-500 shadow-xl border border-white/10 hover:border-gold/30 group-hover/row:scale-110 flex items-center justify-center"
                                    >
                                      <ArrowRightLeft className="w-5 h-5" />
                                    </button>
                                  </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : (
                    /* --- STORE DETAIL LIST (Original View) --- */
                    <div className="grid grid-cols-1 gap-8">
                       <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          <select
                            value={selectedStoreId || ""}
                            onChange={(e) => setSelectedStoreId(e.target.value || null)}
                            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold min-w-[300px]"
                          >
                            <option value="">{t('status.all')}</option>
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                       </div>

                       {overview?.stores
                        .filter(s => !selectedStoreId || s.store.id === selectedStoreId)
                        .map((storeData) => (
                        <motion.section
                          layout
                          key={storeData.store.id}
                          className="glass group/store rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl bg-white/[0.01]"
                        >
                          <div className="px-10 py-10 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-[2rem] bg-gold/10 flex items-center justify-center border border-gold/20 shadow-2xl shadow-gold/10 group-hover/store:scale-110 transition-transform duration-700">
                                <Building2 className="w-7 h-7 text-gold" />
                              </div>
                              <div>
                                <h3 className="font-heading text-4xl uppercase tracking-tighter italic gold-gradient leading-none mb-1">
                                  {storeData.store.name}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[.4em] text-muted-foreground opacity-40">{storeData.store.code || "Branch Node"}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="glass px-8 py-5 rounded-[1.5rem] border-white/10 text-center min-w-[150px] shadow-xl">
                                <p className="font-heading text-3xl text-gold leading-none italic">{storeData.totalUnits}</p>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40 mt-2">Active Assets</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setTransferFromId(storeData.store.id);
                                  setActiveTab("transfer");
                                }}
                                className="w-16 h-16 rounded-[1.5rem] bg-white/5 hover:bg-gold text-white transition-all duration-500 border border-white/10 hover:border-gold/30 flex items-center justify-center shadow-xl"
                              >
                                <ArrowRightLeft className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-muted-foreground bg-white/[0.02]">
                                  <th className="pl-12 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">{t('table.media')}</th>
                                  <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">{t('table.identifier')}</th>
                                  <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40 text-center">{t('table.edition')}</th>
                                  <th className="px-12 py-8 text-[10px] uppercase tracking-[.3em] font-black text-gold text-right">{t('table.inventory')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {storeData.variants.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-12 py-32 text-center text-muted-foreground italic font-serif text-2xl opacity-20">
                                      {t('status.empty_boutique')}
                                    </td>
                                  </tr>
                                ) : (
                                  storeData.variants
                                    .filter(v => !matrixSearch || v.productName.toLowerCase().includes(matrixSearch.toLowerCase()))
                                    .map((v) => (
                                    <tr key={v.variantId} className="group/item hover:bg-white/[0.03] transition-all duration-500">
                                      <td className="pl-12 py-6">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 relative shadow-xl group-hover/item:scale-105 transition-transform duration-700">
                                          {v.imageUrl ? (
                                            <Image src={v.imageUrl} alt="" fill sizes="64px" className="object-cover grayscale group-hover/item:grayscale-0 transition-all duration-1000" />
                                          ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                              <PackageSearch className="w-6 h-6 text-muted-foreground/10" />
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-8 py-6">
                                        <p className="font-heading text-xl uppercase italic group-hover/item:text-gold transition-colors leading-tight mb-1">{v.productName}</p>
                                        <div className="flex items-center gap-3">
                                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40 italic">{v.brandName}</p>
                                          {v.sku && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-white/10" />
                                              <span className="text-[9px] font-mono text-white/30 tracking-tighter uppercase">{v.sku}</span>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                        <span className="px-4 py-1.5 rounded-xl bg-white/5 text-[9px] uppercase font-black border border-white/5 shadow-inner">{v.variantName}</span>
                                      </td>
                                      <td className="px-12 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className={cn(
                                            "font-heading text-4xl italic tracking-tighter leading-none",
                                            v.available <= 5 ? "text-amber-500" : "text-foreground/90 group-hover/item:text-foreground transition-colors"
                                          )}>
                                            {v.available}
                                          </span>
                                          {v.available <= 5 && <span className="text-[8px] uppercase font-black text-amber-500/50 mt-1">Low Stock</span>}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.section>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* --- TAB 2: BATCH IMPORT --- */}
          {activeTab === "batch-import" && (
            <div className="flex flex-col gap-8 sm:gap-12 animate-in fade-in duration-700">
              {/* Configuration Header */}
              <div className="glass p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border-stone-200 dark:border-white/10 flex flex-col 2xl:flex-row gap-8 sm:gap-12 items-stretch 2xl:items-center shadow-xl">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-4 font-black opacity-50 ml-2">
                    {t('import.destination')}
                  </label>
                  <select
                    value={importStoreId}
                    onChange={(e) => setImportStoreId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer hover:bg-gold/[0.03]"
                  >
                    <option value="">{t('import.choose_target')}</option>
                    {storeList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || "POS"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-4 font-black opacity-50 ml-2">
                    {t('import.metadata_label')}
                  </label>
                  <input
                    type="text"
                    value={importReason}
                    onChange={(e) => setImportReason(e.target.value)}
                    placeholder={t('import.reason_placeholder')}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-8 py-4 sm:py-5 text-sm font-serif italic outline-none focus:border-gold transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-5 gap-8 sm:gap-12 items-start">
                {/* Product Selector */}
                <div className="2xl:col-span-2 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3 mb-6">
                      <PackageSearch className="w-5 h-5 text-gold" />
                      <h3 className="font-heading text-sm uppercase tracking-widest">
                        {t('import.catalog_title')}
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={importSearch}
                        onChange={(e) => setImportSearch(e.target.value)}
                        placeholder={t('import.filter_placeholder')}
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
                                  {t('import.stock_label', { count: v.stock })}
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
                <div className="2xl:col-span-3 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                    <h3 className="font-heading text-sm uppercase tracking-widest">
                      {t('import.staging_manifest', { count: importItems.length })}
                    </h3>
                    <button
                      onClick={() => setImportItems([])}
                      className="px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest font-heading text-muted-foreground hover:text-destructive transition-all"
                    >
                      {t('import.flush_session')}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {importItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-6">
                        <FileInput className="w-20 h-20 stroke-[0.5px]" />
                        <p className="text-xs uppercase tracking-[0.5em] font-heading text-center max-w-xs leading-relaxed">
                          {t('import.empty_manifest')}
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
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">
                                    Giá nhập (VNĐ)
                                  </label>
                                  <div className="relative group/price">
                                    <input
                                      type="number"
                                      value={item.costPrice || ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                        setImportItems((prev) =>
                                          prev.map((it, i) =>
                                            i === idx ? { ...it, costPrice: val } : it,
                                          ),
                                        );
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      placeholder="0"
                                      className="w-32 bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-right font-heading text-xs focus:border-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] opacity-30 font-black">đ</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">
                                    {t('import.qty_label')}
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
                                    onFocus={(e) => e.target.select()}
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
                      {saving ? t('import.processing') : t('import.confirm_import')}
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
                    {t('transfer.source')}
                  </label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">{t('transfer.choose_origin')}</option>
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
                    {t('transfer.target')}
                  </label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-secondary/10 dark:bg-white/[0.03] border border-stone-200 dark:border-white/5 rounded-2xl px-6 py-4 sm:py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">{t('transfer.choose_dest')}</option>
                    {storeList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-5 gap-8 sm:gap-12 items-start">
                {/* Asset Finder */}
                <div className="2xl:col-span-2 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3 mb-6">
                      <Search className="w-5 h-5 text-gold" />
                      <h3 className="font-heading text-sm uppercase tracking-widest">
                        {t('transfer.asset_finder')}
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
                            ? t('transfer.search_source')
                            : t('transfer.select_source_first')
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
                          {t('transfer.select_source_prompt')}
                        </p>
                      </div>
                    ) : filteredVariantsTransfer.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                        <PackageSearch className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest font-heading">
                          {t('transfer.no_assets')}
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
                                    {t('transfer.in_stock', { count: v.quantity })}
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
                <div className="2xl:col-span-3 glass rounded-[3rem] border-border overflow-hidden flex flex-col h-[800px]">
                  <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                    <h3 className="font-heading text-sm uppercase tracking-widest">
                      {t('transfer.relocation_manifest', { count: transferItems.length })}
                    </h3>
                    <button
                      onClick={() => setTransferItems([])}
                      className="text-[9px] uppercase tracking-widest font-heading text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {t('transfer.clear_all')}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {transferItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-6 opacity-50">
                        <ArrowRightLeft className="w-20 h-20 stroke-[0.5px]" />
                        <p className="text-xs uppercase tracking-[0.5em] font-heading">
                          {t('transfer.declare_assets')}
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
                                  {t('transfer.move_label')}
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
                                  onFocus={(e) => e.target.select()}
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
                      {saving ? t('import.processing') : t('transfer.confirm_movement')}
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
                  {t('requests.title')}
                </h3>
                <div className="flex gap-2 bg-secondary/20 p-1 rounded-xl border border-border">
                  {(["PENDING", "APPROVED", "REJECTED", ""] as const).map(
                    (s) => (
                      <button
                        key={s || "ALL"}
                        onClick={() => setRequestFilter(s)}
                        className={`px-5 py-2 rounded-lg text-[9px] font-heading uppercase tracking-widest transition-all ${requestFilter === s ? "bg-background shadow-lg text-gold" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {t('status.' + (s.toLowerCase() || "all"))}
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
                      {t('status.loading_requests')}
                    </p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground/30">
                    <ClipboardCheck className="w-20 h-20 stroke-[0.5px]" />
                    <p className="text-xs uppercase tracking-[0.5em] font-heading">
                      {t('status.no_requests', { 
                        filter: requestFilter 
                          ? t('status.' + requestFilter.toLowerCase()) 
                          : t('status.all') 
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground">
                          <th className="pl-10 pr-4 py-5 text-[10px] uppercase tracking-widest font-heading w-16"></th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            {t('table.product_variant')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            {t('table.store')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            {t('table.type')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            {t('table.quantity')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            {t('table.reason')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading">
                            {t('table.staff')}
                          </th>
                          <th className="px-4 py-5 text-[10px] uppercase tracking-widest font-heading text-center">
                            {t('table.status')}
                          </th>
                          <th className="px-10 py-5 text-[10px] uppercase tracking-widest font-heading text-right">
                            {t('table.actions')}
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
                                  ? t('requests.import_type')
                                  : t('requests.adjust_type')}
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
                                {format.dateTime(new Date(r.createdAt), {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {r.status === "PENDING" && (
                                <span className="text-[9px] px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-heading uppercase tracking-widest animate-pulse">
                                  {t('status.pending')}
                                </span>
                              )}
                              {r.status === "APPROVED" && (
                                <div>
                                  <span className="text-[9px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-heading uppercase tracking-widest">
                                    {t('status.approved')}
                                  </span>
                                  {r.reviewer && (
                                    <p className="text-[8px] text-muted-foreground mt-1">
                                      {t("requests.reviewer_by")} {r.reviewer.name || r.reviewer.email}
                                    </p>
                                  )}
                                </div>
                              )}
                              {r.status === "REJECTED" && (
                                <div>
                                  <span className="text-[9px] px-3 py-1 rounded-full bg-destructive/10 text-destructive font-heading uppercase tracking-widest">
                                    {t('status.rejected')}
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
                                    {t('requests.approve')}
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
                                    {t('requests.reject')}
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
                        {t('requests.reject_modal_title')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('requests.reject_modal_desc')}
                      </p>
                      <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder={t('requests.reject_reason_placeholder')}
                        rows={3}
                        className="w-full bg-secondary/30 border border-border rounded-2xl px-6 py-4 text-sm font-body outline-none focus:border-destructive transition-all resize-none mb-6"
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowRejectModal(null)}
                          className="flex-1 py-4 border border-border rounded-full text-[10px] font-heading uppercase tracking-widest hover:bg-secondary/20 transition-all"
                        >
                          {t('requests.cancel')}
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
                          {t('requests.confirm_reject')}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* --- TAB 4: REQUESTS --- */}
          {activeTab === "requests" && (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* ... existing requests content ... */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
                <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                    <button
                      key={f}
                      onClick={() => setRequestFilter(f)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        requestFilter === f ? "bg-gold text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {requestsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass h-64 rounded-[2.5rem] animate-pulse" />
                  ))
                ) : requests.length === 0 ? (
                  <div className="xl:col-span-2 py-32 text-center opacity-20 italic font-serif text-3xl">No inventory requests found</div>
                ) : (
                  requests.map(req => (
                    <motion.div
                      layout
                      key={req.id}
                      className="glass rounded-[2.5rem] border-white/5 overflow-hidden group/req"
                    >
                      <div className="p-8 border-b border-white/5 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                            <ClipboardCheck className="w-6 h-6 text-gold" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Request #{req.id}</p>
                            <p className="font-heading text-xl italic">{req.staff?.name || 'System'}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          req.status === 'PENDING' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                          req.status === 'APPROVED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        )}>
                          {req.status}
                        </span>
                      </div>
                      <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Source</span>
                          <span className="font-bold">{req.store.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Items</span>
                          <span className="font-bold">{req.quantity} units</span>
                        </div>
                        {req.reason && (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-[11px] text-muted-foreground">
                            "{req.reason}"
                          </div>
                        )}
                        {req.status === 'PENDING' && (
                          <div className="flex gap-3 pt-4">
                            <button 
                              onClick={() => handleApprove(req.id)}
                              disabled={reviewingId === req.id}
                              className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => setShowRejectModal(req.id)}
                              disabled={reviewingId === req.id}
                              className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- TAB 5: HISTORY --- */}
          {activeTab === "history" && (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                   <button
                     onClick={() => setHistoryFilterType('')}
                     className={cn(
                       "px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-black transition-all",
                       historyFilterType === '' ? "bg-gold text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                     )}
                   >
                     Tất cả
                   </button>
                   {['IMPORT', 'ADJUST', 'SALE', 'RETURN'].map((type) => (
                     <button
                       key={type}
                       onClick={() => setHistoryFilterType(type)}
                       className={cn(
                         "px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-black transition-all",
                         historyFilterType === type ? "bg-gold text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                       )}
                     >
                       {getTypeText(type)}
                     </button>
                   ))}
                </div>

                <div className="glass px-8 py-4 rounded-[2rem] flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                      <History className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[9px] uppercase tracking-widest font-black opacity-40 leading-none mb-1">Audit Records</p>
                      <p className="text-2xl font-heading italic leading-none">{historyTotal}</p>
                   </div>
                </div>
              </div>

              <section className="glass bg-white/[0.01] rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.03] backdrop-blur-md">
                        <th className="pl-12 pr-4 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">Sản phẩm</th>
                        <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">Cửa hàng / Kho</th>
                        <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40 text-center">Loại</th>
                        <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40 text-center">Số lượng</th>
                        <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">Nhân viên</th>
                        <th className="px-8 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">Ngày thực hiện</th>
                        <th className="pl-8 pr-12 py-8 text-[10px] uppercase tracking-[.3em] font-black opacity-40">Lý do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {historyLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={7} className="px-12 py-8">
                              <div className="h-10 bg-white/5 rounded-2xl w-full" />
                            </td>
                          </tr>
                        ))
                      ) : historyLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-12 py-32 text-center text-muted-foreground italic font-serif text-3xl opacity-20">
                            {tInv('empty_history')}
                          </td>
                        </tr>
                      ) : (
                        historyLogs.map((log, i) => (
                          <tr key={log.id} className="group/log hover:bg-white/[0.02] transition-colors duration-500">
                            <td className="pl-12 pr-4 py-6">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 relative rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover/log:scale-105 transition-transform duration-700">
                                  {log.variant?.product?.images?.[0] ? (
                                    <Image 
                                      src={log.variant.product.images[0].url} 
                                      alt="" 
                                      fill 
                                      className="object-cover grayscale group-hover/log:grayscale-0 transition-all duration-1000" 
                                    />
                                  ) : (
                                    <PackageSearch className="w-6 h-6 m-auto absolute inset-0 text-muted-foreground/10" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-heading text-lg uppercase italic group-hover/log:text-gold transition-colors leading-tight mb-0.5">{log.variant?.product?.name}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40">{log.variant?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <p className="text-[11px] font-black uppercase tracking-widest text-gold leading-none mb-1">{log.store?.name || '---'}</p>
                                <p className="text-[9px] text-muted-foreground font-medium opacity-40 uppercase">{log.store?.type || 'WAREHOUSE'}</p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={cn(
                                "inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm",
                                getTypeColor(log.type)
                              )}>
                                {getTypeText(log.type)}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={cn(
                                "font-heading text-3xl italic tracking-tighter leading-none",
                                log.quantity > 0 ? "text-emerald-500" : "text-rose-500"
                              )}>
                                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                   <User className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black uppercase tracking-widest text-foreground/80 leading-none mb-1">{log.staff?.fullName || 'System'}</p>
                                   <p className="text-[9px] text-muted-foreground font-medium opacity-40">{log.staff?.email || 'automated.process'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-foreground/60 uppercase tracking-tighter italic">
                                  {format.dateTime(new Date(log.createdAt), {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono opacity-30">
                                  {format.dateTime(new Date(log.createdAt), {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="pl-8 pr-12 py-6">
                               <p className="text-[11px] text-muted-foreground leading-relaxed italic opacity-60 line-clamp-2 max-w-[300px]">
                                 {log.reason || '---'}
                               </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Pagination */}
              {historyTotal > historyTake && (
                <div className="flex items-center justify-center gap-4 pb-10">
                   <button
                     disabled={historySkip === 0}
                     onClick={() => setHistorySkip(Math.max(0, historySkip - historyTake))}
                     className="px-10 py-4 rounded-full border border-white/10 font-heading text-[10px] uppercase tracking-[0.3em] font-black hover:bg-gold hover:text-white transition-all disabled:opacity-30 bg-white/[0.02]"
                   >
                     Previous
                   </button>
                   <div className="px-8 py-4 rounded-full bg-white/5 border border-white/10 font-heading text-[10px] tracking-widest italic gold-gradient">
                      {Math.floor(historySkip / historyTake) + 1} <span className="mx-2 opacity-30">/</span> {Math.ceil(historyTotal / historyTake)}
                   </div>
                   <button
                     disabled={historySkip + historyTake >= historyTotal}
                     onClick={() => setHistorySkip(historySkip + historyTake)}
                     className="px-10 py-4 rounded-full border border-white/10 font-heading text-[10px] uppercase tracking-[0.3em] font-black hover:bg-gold hover:text-white transition-all disabled:opacity-30 bg-white/[0.02]"
                   >
                     Next
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
