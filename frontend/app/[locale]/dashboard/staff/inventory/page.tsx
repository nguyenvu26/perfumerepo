"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import {
  Box,
  RefreshCw,
  AlertTriangle,
  Activity,
  Loader2,
  Store,
  PackagePlus,
  Search,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  staffInventoryService,
  type StaffInventoryOverview,
  type StaffInventoryLog,
  type SystemVariant,
} from "@/services/staff-inventory.service";
import {
  storesService,
  type Store as StoreType,
} from "@/services/stores.service";

export default function StaffInventory() {
  const t = useTranslations("dashboard.inventory");
  const [myStores, setMyStores] = useState<StoreType[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [overview, setOverview] = useState<StaffInventoryOverview | null>(null);
  const [logs, setLogs] = useState<StaffInventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantFilter, setVariantFilter] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [allVariants, setAllVariants] = useState<SystemVariant[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedImportVariant, setSelectedImportVariant] =
    useState<SystemVariant | null>(null);
  const [importQty, setImportQty] = useState<number>(0);
  const [importReason, setImportReason] = useState<string>("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMyStores = useCallback(async () => {
    try {
      const list = await storesService.getMyStores();
      setMyStores(list);
      if (list.length && !selectedStoreId) setSelectedStoreId(list[0].id);
      if (list.length === 0) setLoading(false);
    } catch {
      setError(t("errors.load_stores"));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyStores();
  }, [loadMyStores]);

  const loadOverview = useCallback(async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await staffInventoryService.getOverview(selectedStoreId);
      setOverview(data);
    } catch (e: any) {
      setError(e.message || t("errors.load_overview"));
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  const loadLogs = useCallback(
    async (variantId?: string) => {
      if (!selectedStoreId) return;
      setLoadingLogs(true);
      try {
        const data = await staffInventoryService.getLogs({
          storeId: selectedStoreId,
          ...(variantId ? { variantId } : {}),
        });
        setLogs(data);
      } catch {
        // ignore
      } finally {
        setLoadingLogs(false);
      }
    },
    [selectedStoreId],
  );

  useEffect(() => {
    if (selectedStoreId) {
      void loadOverview();
      void loadLogs();
    } else {
      setOverview(null);
      setLogs([]);
    }
  }, [selectedStoreId, loadOverview, loadLogs]);

  const handleImport = async () => {
    if (!selectedStoreId || !selectedImportVariant || importQty <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await staffInventoryService.importStock(
        selectedStoreId,
        selectedImportVariant.variantId,
        importQty,
        importReason || undefined,
      );
      setImportQty(0);
      setImportReason("");
      setSelectedImportVariant(null);
      setShowImportModal(false);
      void loadOverview();
    } catch (e: any) {
      setError(e.message || t("errors.import_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const searchProducts = useCallback(async (q: string) => {
    setLoadingProducts(true);
    try {
      const data = await staffInventoryService.searchAllProducts(
        q || undefined,
      );
      setAllVariants(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleImportSearchChange = (val: string) => {
    setImportSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchProducts(val), 300);
  };

  const openImportModal = () => {
    setShowImportModal(true);
    setSelectedImportVariant(null);
    setImportQty(0);
    setImportReason("");
    setImportSearch("");
    void searchProducts("");
  };

  const handleAdjust = async () => {
    if (!selectedStoreId || !selectedVariant || adjustDelta === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await staffInventoryService.adjustStock(
        selectedStoreId,
        selectedVariant,
        adjustDelta,
        adjustReason || t('operations.default_reason'),
      );
      setAdjustDelta(0);
      setAdjustReason("");
      void loadOverview();
      void loadLogs(selectedVariant);
    } catch (e: any) {
      setError(e.message || t("errors.adjust_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const variants = overview?.variants ?? [];
  const filteredVariants = variantFilter
    ? variants.filter(
        (v) =>
          v.name.toLowerCase().includes(variantFilter.toLowerCase()) ||
          (v.brand ?? "").toLowerCase().includes(variantFilter.toLowerCase()),
      )
    : variants;

  const stats = overview?.stats;

  return (
    <AuthGuard allowedRoles={["staff", "admin"]}>
      <main className="p-8 space-y-8">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
              {t("title")}
            </h1>
            <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">
              {t("subtitle")}
            </p>
          </div>
          {selectedStoreId && (
            <button
              type="button"
              onClick={openImportModal}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-primary-foreground font-heading text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors shadow-lg"
            >
              <PackagePlus className="w-4 h-4" />
              {t("operations.import_btn")}
            </button>
          )}
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-2xl border border-red-500/40 bg-red-500/5 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <Store className="w-5 h-5 text-gold" />
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("store")}:
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-heading uppercase tracking-wider focus:border-gold/60"
          >
            <option value="">{t("select_store")}</option>
            {myStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {!myStores.length && !loading && (
            <span className="text-xs text-muted-foreground">
              {t("no_store_assigned")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-10 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loading")}
            </div>
          ) : (
            <>
              <div className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">
                    {t("total_units")}
                  </h3>
                  <Box className="w-5 h-5 text-gold" />
                </div>
                <p className="text-4xl font-heading text-foreground">
                  {stats?.totalUnits.toLocaleString("vi-VN") ?? "0"}
                </p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">
                    {t("low_stock")}
                  </h3>
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <p className="text-4xl font-heading text-foreground">
                  {stats?.lowStockCount ?? 0}
                </p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] border-border hover:border-gold/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-heading">
                    {t("recent_refill")}
                  </h3>
                  <RefreshCw className="w-5 h-5 text-gold" />
                </div>
                <p className="text-sm font-heading text-foreground">
                  {stats?.latestImportAt
                    ? new Date(stats.latestImportAt).toLocaleString("vi-VN")
                    : t("no_imports_yet")}
                </p>
              </div>
            </>
          )}
        </div>

        {!selectedStoreId ? (
          <div className="glass rounded-[2.5rem] p-12 text-center text-muted-foreground">
            {t("select_store_to_view")}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Variants & stock table */}
            <div className="lg:col-span-2 glass rounded-[2.5rem] border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between gap-4">
                <h2 className="font-heading text-lg uppercase tracking-widest">
                  {t("stock_ledger")}
                </h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={variantFilter}
                    onChange={(e) => setVariantFilter(e.target.value)}
                    placeholder={t("filter_placeholder")}
                    className="text-xs rounded-full border border-border bg-background px-4 py-2 outline-none focus:border-gold/60"
                  />
                </div>
              </div>
              <div className="p-6 max-h-[480px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    {t("loading")}
                  </div>
                ) : filteredVariants.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    {t("logs.no_logs")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVariants.map((row) => {
                      const isLow = row.stock > 0 && row.stock <= 5;
                      const isSelected = selectedVariant === row.id;
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(row.id);
                            void loadLogs(row.id);
                          }}
                          className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all text-left ${
                            isSelected
                              ? "border-gold bg-gold/5 shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                              : "bg-card border border-border/50 hover:border-gold/40"
                          }`}
                        >
                          <div>
                            <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">
                              {row.brand ?? "—"}
                            </p>
                            <h4 className="font-heading uppercase text-xs tracking-wider">
                              {row.name} ({row.variantName})
                            </h4>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                                {t("quantity")}
                              </p>
                              <p className="font-heading">{row.stock}</p>
                            </div>
                            <div
                              className={`px-3 py-1.5 rounded-full border text-[8px] uppercase tracking-widest font-bold ${
                                row.stock === 0
                                  ? "bg-error/10 border-error/30 text-error"
                                  : isLow
                                    ? "bg-warning/10 border-warning/30 text-warning"
                                    : "bg-success/10 border-success/30 text-success"
                              }`}
                            >
                              {row.stock === 0
                                ? t("status.out")
                                : isLow
                                  ? t("status.low")
                                  : t("status.optimal")}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: forms + logs */}
            <div className="space-y-6">
              {/* Forms */}
              <div className="glass rounded-[2rem] border-border p-6 space-y-4">
                <h3 className="font-heading text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gold" />{" "}
                  {t("operations.title")}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {t("operations.desc")}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      {t("operations.selected_variant")}
                    </label>
                    <div className="text-xs font-heading">
                      {selectedVariant
                        ? variants.find((v) => v.id === selectedVariant)
                            ?.name || t("operations.none")
                        : t("operations.none")}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t("operations.adjust_delta")}
                    </label>
                    <input
                      type="number"
                      value={adjustDelta || ""}
                      onChange={(e) =>
                        setAdjustDelta(Number(e.target.value) || 0)
                      }
                      className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60"
                      placeholder="e.g. -2 or 5"
                    />
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-gold/60"
                      placeholder={t("operations.adjust_reason")}
                    />
                    <button
                      type="button"
                      onClick={handleAdjust}
                      disabled={
                        !selectedVariant || adjustDelta === 0 || submitting
                      }
                      className="w-full mt-1 py-2.5 rounded-full bg-secondary text-foreground text-[10px] font-heading uppercase tracking-widest disabled:opacity-50"
                    >
                      {submitting
                        ? t("processing")
                        : t("operations.adjust_btn")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="glass rounded-[2rem] border-border p-6 max-h-[260px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-sm uppercase tracking-widest">
                    {t("logs.title")}
                  </h3>
                  {loadingLogs && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                {logs.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {t("logs.no_logs")}
                  </div>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between py-2 border-b border-border/40 last:border-b-0"
                      >
                        <div>
                          <div className="font-heading">
                            {log.variant.product?.name} ({log.variant.name})
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {log.type}{" "}
                            {log.quantity > 0
                              ? `+${log.quantity}`
                              : log.quantity}{" "}
                            {log.reason && `• ${log.reason}`}
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-muted-foreground">
                          <div>
                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </div>
                          {log.staff && (
                            <div>{log.staff.fullName ?? log.staff.email}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowImportModal(false)}
            />
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-background rounded-[2rem] border border-border shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-heading text-lg uppercase tracking-widest flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-gold" />
                  {t("operations.import_btn")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={importSearch}
                    onChange={(e) => handleImportSearchChange(e.target.value)}
                    placeholder={t("filter_placeholder")}
                    className="w-full text-sm rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 outline-none focus:border-gold/60"
                    autoFocus
                  />
                </div>
              </div>

              {/* Product List or Selected Form */}
              <div className="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar">
                {selectedImportVariant ? (
                  <div className="space-y-4">
                    {/* Selected product info */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gold/40 bg-gold/5">
                      {selectedImportVariant.imageUrl ? (
                        <img
                          src={selectedImportVariant.imageUrl}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">
                          {selectedImportVariant.brand}
                        </p>
                        <p className="font-heading text-sm uppercase tracking-wider">
                          {selectedImportVariant.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedImportVariant.variantName} •{" "}
                          {selectedImportVariant.sku}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedImportVariant(null)}
                        className="p-1.5 rounded-full hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Qty + Reason */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                          {t("operations.import_qty")}
                        </label>
                        <input
                          type="number"
                          value={importQty || ""}
                          onChange={(e) =>
                            setImportQty(Number(e.target.value) || 0)
                          }
                          className="w-full text-sm rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-gold/60"
                          placeholder="e.g. 10"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                          {t("operations.import_reason")}
                        </label>
                        <input
                          type="text"
                          value={importReason}
                          onChange={(e) => setImportReason(e.target.value)}
                          className="w-full text-sm rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-gold/60"
                          placeholder={t("operations.import_reason")}
                        />
                      </div>
                    </div>
                  </div>
                ) : loadingProducts ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    {t("loading")}
                  </div>
                ) : allVariants.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    {t("logs.no_logs")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allVariants.map((v) => (
                      <button
                        key={v.variantId}
                        type="button"
                        onClick={() => setSelectedImportVariant(v)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/50 hover:border-gold/40 hover:bg-gold/5 transition-all text-left"
                      >
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">
                            {v.brand}
                          </p>
                          <p className="font-heading text-xs uppercase tracking-wider truncate">
                            {v.productName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {v.variantName} • {v.sku}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {v.price?.toLocaleString("vi-VN")}đ
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {selectedImportVariant && (
                <div className="p-6 border-t border-border">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importQty <= 0 || submitting}
                    className="w-full py-3 rounded-full bg-gold text-primary-foreground font-heading text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-gold/90 transition-colors"
                  >
                    {submitting ? t("processing") : t("operations.import_btn")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
