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
  Zap,
  Barcode,
  Calendar,
  PackagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { inventoryTransferService } from "@/services/inventory-transfer.service";
import { BarcodePrintModal } from "@/components/staff/barcode-print-modal";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { InventoryHealthWidget } from "@/components/dashboard/admin/InventoryHealthWidget";
import { StockHeatmapWidget } from "@/components/dashboard/admin/StockHeatmapWidget";
import { ExpiryAlertWidget } from "@/components/dashboard/admin/ExpiryAlertWidget";

type SelectedBatch = {
  batchId: string;
  quantity: number;
  batchCode: string | null;
  expiryDate: string | null;
  currentAvailable?: number;
};

type BatchItem = {
  variantId: string;
  productName: string;
  variantName: string;
  brandName: string;
  quantity: number;
  costPrice: number; // New field for Purchase Price
  batchCode?: string;
  mfgDate?: string;
  expiryDate?: string;
  sku?: string;
  selectedBatches?: SelectedBatch[];
  requestId?: number; // Linked staff request ID
};

type TabType = "overview" | "batch-import" | "transfer" | "requests" | "history" | "health" | "heatmap" | "expiry";

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
  const [showTransferBatchModal, setShowTransferBatchModal] = useState(false);
  const [inspectingTransferItemIdx, setInspectingTransferItemIdx] = useState<number | null>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [transferReason, setTransferReason] = useState("");

  // Inventory Requests State
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState<string>("PENDING");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestTotal, setRequestTotal] = useState(0);
  const requestLimit = 20;
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "store">("matrix");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [matrixSearch, setMatrixSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // History State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [historyFilterType, setHistoryFilterType] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const historyTake = 20;

  // AI Toolbox State
  const [isAiToolboxExpanded, setIsAiToolboxExpanded] = useState(true);
  const [activeAiTool, setActiveAiTool] = useState<"health" | "heatmap" | "expiry">("health");

  // Barcode Print State
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);
  const utilityRef = useRef<HTMLDivElement>(null);

  // Close utility menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (utilityRef.current && !utilityRef.current.contains(event.target as Node)) {
        setShowUtilityMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [barcodeVariantIds, setBarcodeVariantIds] = useState<string[]>([]);
  const [barcodeInitialQuantities, setBarcodeInitialQuantities] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, stores, prodRes] = await Promise.all([
        storesService.getStockOverview(),
        storesService.list(),
        productService.adminList({ take: 1000 }),
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

  const variantStockMapping = useMemo(() => {
    const mapping = new Map<string, { globalTotal: number; storeStocks: Record<string, number> }>();
    if (!overview) return mapping;
    
    overview.stores.forEach((storeData) => {
      const storeId = storeData.store.id;
      storeData.variants.forEach((v) => {
        const variantId = v.variantId;
        const qty = Number(v.available) || 0;
        if (!mapping.has(variantId)) {
          mapping.set(variantId, { globalTotal: 0, storeStocks: {} });
        }
        const entry = mapping.get(variantId)!;
        entry.globalTotal += qty;
        entry.storeStocks[storeId] = qty;
      });
    });
    return mapping;
  }, [overview]);

  const filteredVariantsImport = useMemo(() => {
    if (!importSearch.trim()) return allVariants;
    return allVariants
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(importSearch.toLowerCase()) ||
          v.sku?.toLowerCase().includes(importSearch.toLowerCase()) ||
          v.brandName.toLowerCase().includes(importSearch.toLowerCase()),
      );
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

    if (!transferSearch.trim()) return storeAssets;
    return storeAssets
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(transferSearch.toLowerCase()) ||
          v.brandName.toLowerCase().includes(transferSearch.toLowerCase()) ||
          v.sku.toLowerCase().includes(transferSearch.toLowerCase()),
      );
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
  }, [overview, stockMatrix, lowStockThreshold]);

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

  // Handle auto-adding variant from URL (e.g. from Products page or Inventory Health widget)
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    const storeId = searchParams.get('storeId');
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
        if (storeId) setImportStoreId(storeId);
        toast.success(`Đã thêm ${v.productName} vào danh sách nhập kho`);
      }
    }
  }, [searchParams, products, activeTab, allVariants, importItems]);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await adminInventoryRequestService.list({
        status: requestFilter || undefined,
        q: requestSearch || undefined,
        skip: (requestPage - 1) * requestLimit,
        take: requestLimit,
      });
      setRequests(data.items);
      setRequestTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestFilter, requestSearch, requestPage, requestLimit]);

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
        batchCode: "",
        mfgDate: "",
        expiryDate: "",
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
          purchasePrice: item.costPrice,
          batchCode: item.batchCode,
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
        })),
        requestIds: importItems.map(item => item.requestId).filter(Boolean) as number[],
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

  const openBatchSelection = async (index: number) => {
    const item = transferItems[index];
    if (!transferFromId) return;
    
    setInspectingTransferItemIdx(index);
    setLoadingBatches(true);
    setShowTransferBatchModal(true);
    
    try {
      const batches = await inventoryTransferService.getVariantBatches(transferFromId, item.variantId);
      // Map existing selections
      const mapped = batches.map((b: any) => ({
        ...b,
        selectedQuantity: item.selectedBatches?.find(sb => sb.batchId === b.id)?.quantity || 0
      }));
      setAvailableBatches(mapped);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingBatches(false);
    }
  };

  const saveBatchSelection = () => {
    if (inspectingTransferItemIdx === null) return;
    
    const selected = availableBatches
      .filter(b => b.selectedQuantity > 0)
      .map(b => ({
        batchId: b.id,
        quantity: b.selectedQuantity,
        batchCode: b.batchCode,
        expiryDate: b.expiryDate
      }));
      
    const totalQty = selected.reduce((s, b) => s + b.quantity, 0);
    
    setTransferItems(prev => prev.map((it, i) => 
      i === inspectingTransferItemIdx 
        ? { ...it, quantity: totalQty, selectedBatches: selected } 
        : it
    ));
    
    setShowTransferBatchModal(false);
    setInspectingTransferItemIdx(null);
  };

  const updateBatchSelectionQuantity = (batchId: string, qty: number) => {
    setAvailableBatches(prev => prev.map(b => b.id === batchId ? { ...b, selectedQuantity: qty } : b));
  };

  const handleBatchTransfer = async () => {
    if (!transferFromId || !transferToId || transferItems.length === 0) return;

    // Validation: All items must have batches selected if we're enforcing tracked transfers
    const unselected = transferItems.filter(it => !it.selectedBatches || it.selectedBatches.length === 0);
    if (unselected.length > 0) {
      setError(`Vui lòng chọn lô hàng cho sản phẩm: ${unselected.map(it => it.productName).join(', ')}`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await inventoryTransferService.create({
        fromStoreId: transferFromId,
        toStoreId: transferToId,
        items: transferItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          selectedBatches: item.selectedBatches!.map(sb => ({
            batchId: sb.batchId,
            quantity: sb.quantity
          }))
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
        <header className="flex flex-col gap-10">
          {/* Row 1: Identity */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push(`/${locale}/dashboard/admin/stores`)}
                className="group flex items-center justify-center w-14 h-14 rounded-full border border-white/10 hover:border-gold/50 hover:bg-gold/5 transition-all shadow-xl"
                title="Quay lại hệ thống cửa hàng"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </button>
              <h1 className="text-6xl sm:text-7xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                {t('title')}
              </h1>
            </div>
          </div>
          
          {/* Row 2: Navigation Tabs & Utilities */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            <nav className="flex-1 flex items-center gap-2 bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-2xl shadow-3xl overflow-hidden">
              {[
                { id: "overview", icon: LayoutGrid, label: t('tabs.overview') },
                { id: "batch-import", icon: FileInput, label: "Nhập kho" },
                { id: "transfer", icon: ArrowRightLeft, label: t('tabs.transfer') },
                { id: "requests", icon: ClipboardCheck, label: "Phê duyệt" },
                { id: "history", icon: History, label: "Lịch sử" },
                { id: "health", icon: BarChart3, label: "Sức khỏe" },
                { id: "heatmap", icon: Globe, label: "Heatmap" },
                { id: "expiry", icon: Calendar, label: "Lô & HSD" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2.5 px-5 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-700 whitespace-nowrap",
                    activeTab === tab.id 
                      ? "text-primary z-10" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gold rounded-full -z-10 shadow-[0_10px_40px_rgba(212,175,55,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-primary" : "text-gold/60")} /> 
                  <span className="inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div ref={utilityRef} className="relative shrink-0">
              <button 
                onClick={() => setShowUtilityMenu(!showUtilityMenu)}
                className={cn(
                  "flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-full text-[10px] uppercase font-black tracking-widest hover:border-gold/30 hover:bg-gold/5 transition-all shadow-lg",
                  showUtilityMenu && "border-gold bg-gold/5"
                )}
              >
                <LayoutGrid className="w-4 h-4 text-gold" strokeWidth={2.5} />
                Công cụ & Tiện ích
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 opacity-40 transition-transform duration-500",
                  showUtilityMenu ? "rotate-180 opacity-100" : ""
                )} />
              </button>
              
              <AnimatePresence>
                {showUtilityMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-4 w-72 glass bg-zinc-950/90 border border-gold/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
                  >
                    <div className="p-4 space-y-1">
                      {[
                        { href: `/${locale}/dashboard/admin/inventory/transfers`, icon: ArrowRightLeft, label: "DS Phiếu Điều Chuyển" },
                        { href: `/${locale}/dashboard/admin/inventory/audit`, icon: ClipboardCheck, label: "Kiểm Kê Kho" },
                        { href: `/${locale}/dashboard/admin/inventory/cost-setup`, icon: Wallet, label: "Thiết lập Giá Vốn" },
                        { href: `/${locale}/dashboard/admin/inventory/reports`, icon: BarChart3, label: "Báo Cáo Tồn Kho" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            router.push(item.href);
                            setShowUtilityMenu(false);
                          }}
                          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gold text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-all text-left"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {[
                      { label: "Mã hàng đang quản lý", value: stats.totalSku, icon: Layers, color: "text-blue-500", bg: "from-blue-500/10", unit: "SKU" },
                      { label: "Tổng sản phẩm tồn kho", value: stats.globalUnits, icon: Globe, color: "text-emerald-500", bg: "from-emerald-500/10", unit: "Sản phẩm" },
                      { label: "Cảnh báo hết hàng", value: stats.lowStockAlerts, icon: AlertCircle, color: "text-amber-500", highlight: stats.lowStockAlerts > 0, bg: "from-amber-500/10", unit: "Mục" },
                      { label: "Trung tâm đang vận hành", value: stats.activeHubs, icon: Building2, color: "text-gold", bg: "from-gold/10", unit: "Kho/Hub" },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "relative overflow-hidden glass p-10 rounded-[3.5rem] border-white/5 group hover:border-gold/30 transition-all duration-700 bg-zinc-900/20"
                        )}
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", stat.bg)} />
                        
                        <div className="relative z-10 flex flex-col gap-10">
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl",
                              stat.color
                            )}>
                              <stat.icon className="w-8 h-8" />
                            </div>
                            {stat.highlight && (
                              <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 animate-pulse">Chú ý quan trọng</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[.4em] font-black text-muted-foreground opacity-50 group-hover:text-gold transition-colors">{stat.label}</p>
                            <div className="flex items-end gap-3">
                              <span className={cn(
                                "font-heading text-6xl italic tracking-tighter leading-none",
                                stat.highlight ? "text-amber-500" : "text-foreground group-hover:text-white transition-colors"
                              )}>
                                {stat.value.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest mb-2 italic">{stat.unit}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Matrix Controls Row */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-[2rem] border border-white/10 shadow-3xl">
                      {[
                        { id: "matrix", icon: Layers, label: "Ma trận so sánh" },
                        { id: "store", icon: Building2, label: "Xem theo kho" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setViewMode(mode.id as any)}
                          className={cn(
                            "flex items-center gap-4 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-700",
                            viewMode === mode.id 
                              ? "bg-gold text-white shadow-xl shadow-gold/20 scale-[1.02]" 
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <mode.icon className="w-4 h-4" />
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-center gap-8">
                      <div className="relative flex-1 group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gold opacity-40 group-focus-within:opacity-100 transition-opacity" />
                        <input
                          type="text"
                          value={matrixSearch}
                          onChange={(e) => setMatrixSearch(e.target.value)}
                          placeholder="Tìm mã SKU, tên nước hoa hoặc thương hiệu..."
                          className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold tracking-wider outline-none focus:border-gold/50 focus:bg-white/10 transition-all placeholder:opacity-20 shadow-inner"
                        />
                      </div>
                      
                      {viewMode === "store" && (
                         <select
                            value={selectedStoreId || ""}
                            onChange={(e) => setSelectedStoreId(e.target.value || null)}
                            className="bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-gold min-w-[280px] hover:bg-white/10 transition-all cursor-pointer shadow-3xl"
                          >
                            <option value="">Tất cả kho bãi</option>
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                      )}
                    </div>
                  </div>

                  {viewMode === "matrix" ? (
                    /* --- MATRIX VIEW --- */
                    <section className="glass rounded-[4rem] border-white/10 overflow-hidden shadow-3xl bg-zinc-900/10">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.05] border-b border-white/5">
                              <th className="pl-12 pr-4 py-12 text-[10px] uppercase tracking-[.4em] font-black text-gold/60 min-w-[380px]">
                                Danh mục tài sản / Sản phẩm
                              </th>
                              {warehouses.map((w) => (
                                <th key={w.id} className="px-6 py-12 text-[10px] uppercase tracking-[.4em] font-black opacity-30 text-center min-w-[150px] border-l border-white/5">
                                  <div className="flex flex-col items-center gap-1.5">
                                    {w.type === 'CENTRAL' && <Globe className="w-4 h-4 text-gold shadow-glow-sm" strokeWidth={2.5} />}
                                    <span className={cn(w.type === 'CENTRAL' ? "text-gold opacity-100" : "")}>{w.name}</span>
                                    <span className="text-[8px] opacity-40 font-black tracking-tighter">{w.code || "HUB"}</span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-12 py-12 text-[11px] uppercase tracking-[.5em] font-black text-gold text-right min-w-[200px] border-l border-white/10 bg-gold/5 italic">
                                Tồn hệ thống
                              </th>
                              <th className="px-8 py-12 text-[10px] uppercase tracking-[.4em] font-black opacity-30 text-center min-w-[100px]">
                                Điều vận
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {stockMatrix.length === 0 ? (
                              <tr>
                                <td colSpan={warehouses.length + 3} className="px-12 py-40 text-center">
                                  <div className="flex flex-col items-center justify-center opacity-20 italic">
                                    <PackageSearch className="w-20 h-20 mb-6" />
                                    <p className="text-3xl font-heading uppercase tracking-widest">Không tìm thấy tài sản nào</p>
                                    <p className="text-xs mt-2 font-black">Hãy điều chỉnh bộ lọc tìm kiếm hoặc kiểm tra đồng bộ kho</p>
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
                                            qty === 0 ? "text-white/10" : qty <= lowStockThreshold ? "text-amber-500 scale-110" : "text-foreground/90 group-hover/row:text-foreground"
                                          )}>
                                            {qty}
                                          </span>
                                          {qty > 0 && qty <= lowStockThreshold && (
                                            <span className="text-[8px] uppercase font-black tracking-tighter text-amber-500/50">Sắp Hết</span>
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
                                      <span className="text-[9px] uppercase font-black tracking-[.3em] opacity-30 italic">Tổng Toàn Hệ Thống</span>
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
                    <div className="grid grid-cols-1 gap-8 mt-12">

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
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40 mt-2">Tổng Tồn Kho</p>
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
                                          {v.available <= 5 && <span className="text-[8px] uppercase font-black text-amber-500/50 mt-1">Sắp Hết</span>}
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
                      {filteredVariantsImport.map((v) => {
                        const stockInfo = variantStockMapping.get(v.id) || { globalTotal: 0, storeStocks: {} };
                        const globalTotal = stockInfo.globalTotal;
                        const destStock = importStoreId ? (stockInfo.storeStocks[importStoreId] || 0) : 0;

                        return (
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
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                  <span className="text-[9px] px-3 py-0.5 bg-background border border-border rounded-full font-heading text-foreground uppercase tracking-widest">
                                    {v.variantName}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground font-mono tracking-tighter">
                                    SKU: {v.sku || "N/A"}
                                  </span>
                                  
                                  {/* Global Stock Badge */}
                                  <span
                                    className={`text-[8px] font-heading px-2 py-0.5 rounded-full border ${
                                      globalTotal === 0
                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                        : globalTotal <= 5
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    }`}
                                  >
                                    Hệ thống: {globalTotal}
                                  </span>

                                  {/* Destination Stock Badge (when store is selected) */}
                                  {importStoreId && (
                                    <span
                                      className={`text-[8px] font-heading px-2 py-0.5 rounded-full border ${
                                        destStock === 0
                                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                                          : destStock <= 5
                                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                      }`}
                                    >
                                      Kho đích: {destStock}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-background rounded-xl border border-border group-hover:bg-gold group-hover:text-primary-foreground transition-all">
                              <Plus className="w-4 h-4" />
                            </div>
                          </button>
                        );
                      })}
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
                              className="flex flex-col p-5 rounded-2xl bg-secondary/20 border border-border hover:border-gold/30 transition-all text-left group"
                            >
                              <div className="flex items-center justify-between">
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
                              </div>

                              <div className="grid grid-cols-3 gap-6 mt-5 pt-5 border-t border-border/10">
                                <div>
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1 block">
                                    Mã lô (Batch Code)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.batchCode || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setImportItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, batchCode: val } : it,
                                        ),
                                      );
                                    }}
                                    placeholder="BATCH-001"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 font-heading text-[10px] focus:border-gold outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1 block">
                                    Ngày sản xuất
                                  </label>
                                  <input
                                    type="date"
                                    value={item.mfgDate || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setImportItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, mfgDate: val } : it,
                                        ),
                                      );
                                    }}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 font-heading text-[10px] focus:border-gold outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1 block">
                                    Hạn sử dụng
                                  </label>
                                  <input
                                    type="date"
                                    value={item.expiryDate || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setImportItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, expiryDate: val } : it,
                                        ),
                                      );
                                    }}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 font-heading text-[10px] focus:border-gold outline-none transition-all"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  <div className="p-10 border-t border-border bg-secondary/5 flex flex-col gap-4">
                    <button
                      onClick={() => {
                        const variantIds = importItems.map(i => i.variantId);
                        const initialQuantities = Object.fromEntries(
                          importItems.map(i => [i.variantId, i.quantity])
                        );
                        setBarcodeVariantIds(variantIds);
                        setBarcodeInitialQuantities(initialQuantities);
                        setShowBarcodeModal(true);
                      }}
                      disabled={importItems.length === 0}
                      className="w-full py-4 glass text-foreground border border-gold/30 hover:border-gold/60 font-heading font-bold uppercase tracking-[0.2em] text-[10px] rounded-full shadow-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                      <Barcode className="w-5 h-5" />
                      In {importItems.length} mã vạch thuộc lô nhập này
                    </button>
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
                                  <span className="text-[10px] px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-lg font-black uppercase tracking-widest group-hover:bg-gold group-hover:text-primary transition-all">
                                    {v.variantName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground group-hover:text-gold font-bold">
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
                                  Lô hàng & Số lượng
                                </label>
                                <button
                                  onClick={() => openBatchSelection(idx)}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                    item.selectedBatches && item.selectedBatches.length > 0
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                      : "bg-gold/10 text-gold border-gold/20 hover:bg-gold/20"
                                  )}
                                >
                                  {item.selectedBatches && item.selectedBatches.length > 0 
                                    ? `Đã chọn ${item.quantity} SP (${item.selectedBatches.length} lô)`
                                    : "Chọn Lô Hàng"
                                  }
                                </button>
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-heading gold-gradient uppercase tracking-tighter">
                    {t('requests.title')}
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                    Quản lý và phê duyệt yêu cầu nhập kho từ nhân viên
                  </p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
                  {(["PENDING", "APPROVED", "REJECTED", ""] as const).map(
                    (s) => (
                      <button
                        key={s || "ALL"}
                        onClick={() => {
                          setRequestFilter(s);
                          setRequestPage(1);
                        }}
                        className={cn(
                          "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                          requestFilter === s 
                            ? "bg-gold text-white shadow-2xl" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        {t('status.' + (s.toLowerCase() || "all"))}
                      </button>
                    ),
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-gold transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm, nhân viên, lý do..."
                    value={requestSearch}
                    onChange={(e) => {
                      setRequestSearch(e.target.value);
                      setRequestPage(1);
                    }}
                    className="bg-white/5 border border-white/10 rounded-[1.5rem] py-3 pl-12 pr-6 text-xs focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all w-[300px] backdrop-blur-md"
                  />
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
                  <div className="overflow-x-auto custom-scrollbar shadow-2xl">
                    <table className="w-full min-w-[1200px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-muted-foreground/60">
                          <th className="pl-10 pr-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black w-24"></th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black min-w-[200px]">
                            {t('table.product_variant')}
                          </th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black min-w-[150px]">
                            {t('table.store')}
                          </th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black text-center min-w-[80px]">
                            {t('table.type')}
                          </th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black min-w-[250px]">
                            {t('table.reason')}
                          </th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black min-w-[180px]">
                            {t('table.staff')}
                          </th>
                          <th className="px-4 py-4 text-[9px] uppercase tracking-[0.2em] font-black text-center min-w-[140px]">
                            {t('table.status')}
                          </th>
                          <th className="px-10 py-4 text-[9px] uppercase tracking-[0.2em] font-black text-right min-w-[150px]">
                            {t('table.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {requests.map((r) => (
                          <tr
                            key={r.id}
                            className="group hover:bg-gold/[0.03] transition-all border-b border-border/5"
                          >
                            <td className="pl-10 pr-4 py-4 shrink-0">
                              {r.imageUrl ? (
                                <img
                                  src={r.imageUrl}
                                  alt={r.product ?? ""}
                                  className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                                  <PackageSearch className="w-4 h-4 text-muted-foreground/30" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-[11px] font-heading text-foreground group-hover:text-gold transition-colors line-clamp-1 uppercase tracking-tight">
                                {r.product}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">
                                  {r.variantName}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[8px] text-gold/60 uppercase tracking-tighter">
                                  {r.brand}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                  <Building2 className="w-3 h-3 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-0">
                                  <p className="text-[10px] font-heading uppercase tracking-tight text-foreground/70 leading-none">
                                    {r.store.name}
                                  </p>
                                  <p className="text-[8px] text-muted-foreground/40 mt-1 uppercase tracking-widest leading-none">
                                    {r.store.code || "SYS"}
                                  </p>
                                </div>
                              </div>
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
                            <td className="px-4 py-4 max-w-[250px]">
                              <div 
                                className={cn(
                                  "relative cursor-pointer transition-all duration-300 group/reason",
                                  expandedRequestId === r.id ? "max-h-[500px]" : "max-h-[32px] overflow-hidden"
                                )}
                                onClick={() => setExpandedRequestId(expandedRequestId === r.id ? null : r.id)}
                              >
                                <p className={cn(
                                  "text-[10px] text-muted-foreground/80 leading-relaxed italic",
                                  expandedRequestId !== r.id && "line-clamp-2"
                                )}>
                                  {r.reason || "—"}
                                </p>
                                {r.reason && r.reason.length > 50 && expandedRequestId !== r.id && (
                                  <div className="absolute bottom-0 right-0 bg-gradient-to-l from-background via-background/80 to-transparent pl-4 opacity-0 group-hover/reason:opacity-100">
                                    <span className="text-[8px] text-gold font-bold uppercase tracking-tighter cursor-pointer">... Xem thêm</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                  <User className="w-3 h-3 text-gold/30" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] text-foreground/80 font-bold truncate max-w-[150px]">
                                    {r.staff?.name || r.staff?.email}
                                  </p>
                                  <p className="text-[8px] text-muted-foreground/30 uppercase tracking-tighter">
                                    {format.dateTime(new Date(r.createdAt), {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                {r.status === "PENDING" && (
                                  <span className="flex items-center gap-2 text-[10px] px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black uppercase tracking-widest animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                    {t('status.pending')}
                                  </span>
                                )}
                                {r.status === "APPROVED" && (
                                  <>
                                    <span className="flex items-center gap-2 text-[10px] px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {t('status.approved')}
                                    </span>
                                  </>
                                )}
                                {r.status === "REJECTED" && (
                                  <>
                                    <span className="flex items-center gap-2 text-[10px] px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md">
                                      <X className="w-3 h-3" />
                                      {t('status.rejected')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-10 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {r.status === "PENDING" ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setImportItems([{
                                          variantId: r.variantId,
                                          productName: r.product || "",
                                          variantName: r.variantName || "",
                                          brandName: r.brand || "",
                                          quantity: r.quantity,
                                          costPrice: 0,
                                          requestId: r.id
                                        }]);
                                        setActiveTab("batch-import");
                                        setImportStoreId(r.store.id);
                                        setImportReason(`${r.reason || ""}`);
                                      }}
                                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/10 hover:border-gold transition-all text-[8px] font-black uppercase tracking-[0.1em] shadow-xl active:scale-95"
                                    >
                                      <PackagePlus className="w-3 h-3" />
                                      Xử lý
                                    </button>
                                    <button
                                      onClick={() => setShowRejectModal(r.id)}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 border border-white/5 hover:border-rose-500/20 transition-all active:scale-95"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-muted-foreground/20 px-3 py-1 rounded-lg border border-white/5 bg-white/[0.01]">
                                    <Check className="w-2.5 h-2.5" />
                                    <span className="text-[7px] font-black uppercase tracking-widest italic opacity-40">DONE</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {requestTotal > requestLimit && (
                  <div className="flex items-center justify-between px-10 py-6 glass rounded-[2.5rem] border border-white/5 mt-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.02] to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                      <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                        Page <span className="text-foreground">{requestPage}</span> <span className="mx-1 opacity-20">/</span> {Math.ceil(requestTotal / requestLimit)}
                        <span className="ml-4 opacity-40 font-medium tracking-normal text-[8px] normal-case">Showing {requests.length} of {requestTotal} entries</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 relative z-10">
                      <button
                        onClick={() => setRequestPage(p => Math.max(1, p - 1))}
                        disabled={requestPage === 1}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all duration-300"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRequestPage(p => Math.min(Math.ceil(requestTotal / requestLimit), p + 1))}
                        disabled={requestPage >= Math.ceil(requestTotal / requestLimit)}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all duration-300"
                      >
                        <ArrowRightLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
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


          {/* --- TAB 5: HISTORY --- */}
          {activeTab === "history" && (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3 bg-secondary/30 dark:bg-white/5 p-1.5 rounded-[2rem] border border-border dark:border-white/10 backdrop-blur-xl">
                   <button
                     onClick={() => setHistoryFilterType('')}
                     className={cn(
                       "px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-black transition-all",
                       historyFilterType === '' ? "bg-gold text-white shadow-lg" : "text-muted-foreground hover:bg-secondary/40 dark:hover:bg-white/5"
                     )}
                   >
                     Tất cả
                   </button>
                   {['IMPORT', 'ADJUST', 'SALE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT'].map((type) => (
                     <button
                       key={type}
                       onClick={() => setHistoryFilterType(type)}
                       className={cn(
                         "px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-black transition-all",
                         historyFilterType === type ? "bg-gold text-white shadow-lg" : "text-muted-foreground hover:bg-secondary/40 dark:hover:bg-white/5"
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
                      <p className="text-[9px] uppercase tracking-widest font-black opacity-40 leading-none mb-1">Lịch sử Biến động</p>
                      <p className="text-2xl font-heading italic leading-none">{historyTotal}</p>
                   </div>
                </div>
              </div>

              <section className="glass bg-secondary/10 dark:bg-white/[0.01] rounded-[3.5rem] border-border overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/20 dark:bg-white/[0.03] backdrop-blur-md">
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
                              <div className="h-10 bg-secondary/30 dark:bg-white/5 rounded-2xl w-full" />
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
                          <tr key={log.id} className="group/log hover:bg-secondary/10 dark:hover:bg-white/[0.02] transition-colors duration-500">
                            <td className="pl-12 pr-4 py-6">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 relative rounded-2xl overflow-hidden border border-border dark:border-white/10 shadow-xl group-hover/log:scale-105 transition-transform duration-700">
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
                                <div className="w-9 h-9 rounded-full bg-secondary/30 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center overflow-hidden">
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
                               <div 
                                 className={cn(
                                   "relative cursor-pointer transition-all duration-500 group/history-reason",
                                   expandedLogId === log.id ? "max-h-[800px]" : "max-h-[48px] overflow-hidden"
                                 )}
                                 onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                               >
                                 <p className={cn(
                                   "text-[11px] text-muted-foreground leading-relaxed italic opacity-70 transition-all",
                                   expandedLogId !== log.id && "line-clamp-2"
                                 )}>
                                   {log.reason || '---'}
                                 </p>
                                 {log.reason && log.reason.length > 60 && expandedLogId !== log.id && (
                                   <div className="absolute bottom-0 right-0 bg-gradient-to-l from-zinc-950 via-zinc-950 to-transparent pl-8 opacity-0 group-hover/history-reason:opacity-100 transition-opacity">
                                      <span className="text-[8px] text-gold font-black uppercase tracking-tighter italic">... Xem thêm</span>
                                   </div>
                                 )}
                               </div>
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
                     className="px-10 py-4 rounded-full border border-border dark:border-white/10 font-heading text-[10px] uppercase tracking-[0.3em] font-black hover:bg-gold hover:text-white transition-all disabled:opacity-30 bg-secondary/30 dark:bg-white/[0.02]"
                   >
                     Previous
                   </button>
                   <div className="px-8 py-4 rounded-full bg-secondary/30 dark:bg-white/5 border border-border dark:border-white/10 font-heading text-[10px] tracking-widest italic gold-gradient">
                      {Math.floor(historySkip / historyTake) + 1} <span className="mx-2 opacity-30">/</span> {Math.ceil(historyTotal / historyTake)}
                   </div>
                   <button
                     disabled={historySkip + historyTake >= historyTotal}
                     onClick={() => setHistorySkip(historySkip + historyTake)}
                     className="px-10 py-4 rounded-full border border-border dark:border-white/10 font-heading text-[10px] uppercase tracking-[0.3em] font-black hover:bg-gold hover:text-white transition-all disabled:opacity-30 bg-secondary/30 dark:bg-white/[0.02]"
                   >
                     Next
                   </button>
                </div>
              )}
            </div>
          )}
          {activeTab === "health" && (
            <div className="animate-in fade-in duration-700">
               <InventoryHealthWidget isExpanded={true} />
            </div>
          )}
          {activeTab === "heatmap" && (
            <div className="animate-in fade-in duration-700">
               <StockHeatmapWidget isExpanded={true} />
            </div>
          )}
          {activeTab === "expiry" && (
            <div className="animate-in fade-in duration-700">
               <ExpiryAlertWidget />
            </div>
          )}

        </div>
      </main>

      {/* --- BATCH SELECTION MODAL --- */}
      <AnimatePresence>
        {showTransferBatchModal && inspectingTransferItemIdx !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferBatchModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden"
            >
              <div className="p-10 border-b border-white/10 bg-gradient-to-br from-gold/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gold/10 rounded-2xl text-gold">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading text-white uppercase tracking-widest leading-none">
                        Chọn Lô Hàng Xuất Kho
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-2 italic">
                        {transferItems[inspectingTransferItemIdx].productName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransferBatchModal(false)}
                    className="p-3 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-10 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loadingBatches ? (
                  <div className="py-20 flex flex-col items-center justify-center text-gold/30">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-[10px] uppercase font-black tracking-[.3em]">Đang quét dữ liệu lô hàng...</p>
                  </div>
                ) : availableBatches.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-heading">Sản phẩm này không còn lô hàng nào khả dụng tại kho nguồn.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableBatches.map((batch) => (
                      <div 
                        key={batch.id}
                        className={cn(
                          "p-6 rounded-3xl border transition-all flex items-center justify-between",
                          batch.selectedQuantity > 0 
                            ? "bg-gold/5 border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.05)]" 
                            : "bg-white/5 border-white/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white uppercase tracking-widest">{batch.batchCode || 'Lô không mã'}</span>
                            {batch.expiryDate && (
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground font-heading">
                                HSD: {format.dateTime(new Date(batch.expiryDate), { year: 'numeric', month: '2-digit', day: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-heading">
                            Tồn thực tế: <span className="text-white">{batch.currentQuantity}</span> | Giá vốn: <span className="text-gold">{format.number(batch.purchasePrice)}đ</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">Xuất từ lô này</label>
                            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                              <button 
                                onClick={() => updateBatchSelectionQuantity(batch.id, Math.max(0, batch.selectedQuantity - 1))}
                                className="px-3 py-2 hover:bg-white/5 text-muted-foreground transition-colors"
                              >
                                -
                              </button>
                              <input 
                                type="number"
                                value={batch.selectedQuantity || ""}
                                onChange={(e) => {
                                  let val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                  val = Math.min(val, batch.currentQuantity);
                                  updateBatchSelectionQuantity(batch.id, val);
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-14 bg-transparent text-center text-xs font-black text-gold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button 
                                onClick={() => updateBatchSelectionQuantity(batch.id, Math.min(batch.currentQuantity, batch.selectedQuantity + 1))}
                                className="px-3 py-2 hover:bg-white/5 text-muted-foreground transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-10 border-t border-white/10 bg-secondary/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-heading mb-1">Tổng cộng chọn</p>
                  <p className="text-2xl font-heading text-white">
                    {availableBatches.reduce((s, b) => s + (b.selectedQuantity || 0), 0)} <span className="text-xs opacity-30">sản phẩm</span>
                  </p>
                </div>
                <div className="flex gap-4">
                   <button
                    onClick={() => setShowTransferBatchModal(false)}
                    className="px-8 py-4 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={saveBatchSelection}
                    disabled={availableBatches.reduce((s, b) => s + (b.selectedQuantity || 0), 0) === 0}
                    className="px-10 py-4 rounded-full bg-gold text-primary font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    Xác nhận chọn lô
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BarcodePrintModal
        open={showBarcodeModal}
        onOpenChange={(v) => {
          setShowBarcodeModal(v);
          if (!v) {
            setBarcodeVariantIds([]);
            setBarcodeInitialQuantities({});
          }
        }}
        variantIds={barcodeVariantIds.length > 0 ? barcodeVariantIds : undefined}
        initialQuantities={barcodeInitialQuantities}
      />
    </AuthGuard>
  );
}
