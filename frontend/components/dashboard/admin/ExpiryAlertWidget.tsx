"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Calendar, 
  Package, 
  Store, 
  ShieldAlert, 
  Clock,
  ArrowRight,
  Filter
} from "lucide-react";
import { analyticsService, type ExpiryAlert } from "@/services/analytics.service";
import { cn } from "@/lib/utils";

export function ExpiryAlertWidget({ storeId }: { storeId?: string }) {
  const t = useTranslations("dashboard.admin.expiry_alerts");
  const locale = useLocale();
  const router = useRouter();
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "WARNING">("ALL");

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await analyticsService.getExpiryAlerts(storeId);
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch expiry alerts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [storeId]);


  const filteredAlerts = alerts.filter(a => {
    if (filter === "ALL") return true;
    return a.status === filter;
  });

  if (loading) {
    return (
      <div className="glass p-8 rounded-[2.5rem] border-stone-200 dark:border-white/10 animate-pulse h-[400px] flex items-center justify-center">
        <Clock className="w-8 h-8 text-gold/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-[2.5rem] border-stone-200 dark:border-white/10 flex flex-col h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-heading font-black uppercase tracking-[0.2em]">{t("title") || "Cảnh báo Hạn sử dụng"}</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60">FEFO Inventory Control</p>
          </div>
        </div>
        <div className="flex bg-secondary/20 p-1 rounded-xl">
          {(["ALL", "CRITICAL", "WARNING"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-[9px] font-heading font-bold uppercase tracking-widest rounded-lg transition-all",
                filter === f ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {f === "ALL" ? "Tất cả" : f === "CRITICAL" ? "Khẩn cấp" : "Cảnh báo"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-12">
            <Package className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-[10px] uppercase tracking-widest font-heading">{t("no_alerts") || "Không có cảnh báo tồn kho sắp hết hạn"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.batchId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group p-5 rounded-3xl border transition-all flex items-center gap-6",
                    alert.status === "CRITICAL" 
                      ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                      : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                  )}
                >
                  <div className="relative shrink-0">
                    {alert.imageUrl ? (
                      <img src={alert.imageUrl} alt={alert.productName} className="w-14 h-14 rounded-2xl object-cover border border-border group-hover:scale-105 transition-all" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className={cn(
                      "absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black",
                      alert.status === "CRITICAL" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {alert.currentQuantity}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] px-2 py-0.5 bg-luxury-black text-white rounded-full font-heading uppercase tracking-tighter">
                        Batch: {alert.batchCode || "N/A"}
                      </span>
                      <span className="text-[8px] text-muted-foreground flex items-center gap-1 font-heading uppercase tracking-widest">
                        <Store className="w-2.5 h-2.5" />
                        {alert.warehouseName}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold uppercase truncate tracking-tight">{alert.productName}</h3>
                    <p className="text-[9px] text-muted-foreground uppercase font-heading tracking-widest truncate">{alert.variantName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-[10px] font-heading font-black uppercase tracking-widest mb-1",
                      alert.status === "CRITICAL" ? "text-red-500" : "text-amber-500"
                    )}>
                      {alert.daysUntilExpiry} ngày nữa
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-heading">
                      <Calendar className="w-3 h-3" />
                      HSD: {new Date(alert.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <button 
        onClick={() => router.push(`/${locale}/dashboard/admin/inventory/expiry`)}
        className="w-full mt-6 py-4 rounded-2xl border border-border hover:bg-secondary/30 transition-all flex items-center justify-center gap-3 group"
      >
        <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em]">{t("view_details") || "Xem chi tiết lô hàng"}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
