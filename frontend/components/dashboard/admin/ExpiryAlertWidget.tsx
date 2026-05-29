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

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await analyticsService.getExpiryAlerts({ storeId, limit: 5 });
        setAlerts(response.data);
      } catch (error) {
        console.error("Failed to fetch expiry alerts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [storeId]);


  const displayAlerts = alerts;

  if (loading) {
    return (
      <div className="glass p-8 rounded-[2.5rem] border-stone-200 dark:border-white/10 animate-pulse h-[400px] flex items-center justify-center">
        <Clock className="w-8 h-8 text-gold/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-stone-200 dark:border-white/10 flex flex-col h-full bg-white/70 dark:bg-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 sm:p-3 bg-red-500/10 rounded-2xl shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-base sm:text-sm font-heading font-black uppercase tracking-tight sm:tracking-[0.2em] leading-snug">{t("title") || "Cảnh báo Hạn sử dụng"}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar sm:pr-2 sm:-mr-2">
        {displayAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-12">
            <Package className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-[10px] uppercase tracking-widest font-heading">{t("no_alerts") || "Không có cảnh báo tồn kho sắp hết hạn"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {displayAlerts.map((alert) => (
                <motion.div
                  key={alert.batchId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6",
                    alert.status === "CRITICAL" 
                      ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                      : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                  )}
                >
                  <div className="flex w-full items-start gap-3 sm:w-auto sm:block">
                    <div className="relative shrink-0">
                      {alert.imageUrl ? (
                        <img src={alert.imageUrl} alt={alert.productName} className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl object-cover border border-border group-hover:scale-105 transition-all" />
                      ) : (
                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className={cn(
                        "absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black",
                        alert.status === "CRITICAL" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {alert.currentQuantity}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 sm:hidden">
                      <h3 className="text-sm font-bold uppercase tracking-tight leading-snug line-clamp-2">{alert.productName}</h3>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase font-heading tracking-widest line-clamp-1">{alert.variantName}</p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="max-w-full break-all text-[9px] sm:text-[8px] px-2.5 py-1 bg-luxury-black text-white rounded-full font-heading uppercase tracking-tight">
                        Batch: {alert.batchCode || "N/A"}
                      </span>
                      <span className="min-w-0 text-[9px] sm:text-[8px] text-muted-foreground flex items-center gap-1 font-heading uppercase tracking-widest">
                        <Store className="w-2.5 h-2.5" />
                        <span className="truncate">{alert.warehouseName}</span>
                      </span>
                    </div>
                    <h3 className="hidden sm:block text-xs font-bold uppercase truncate tracking-tight">{alert.productName}</h3>
                    <p className="hidden sm:block text-[9px] text-muted-foreground uppercase font-heading tracking-widest truncate">{alert.variantName}</p>
                  </div>

                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0 flex items-center justify-between sm:block gap-3 rounded-2xl sm:rounded-none bg-white/65 dark:bg-white/[0.03] sm:bg-transparent sm:dark:bg-transparent border border-border/50 sm:border-0 px-3 py-2 sm:p-0">
                    <div className={cn(
                      "text-[10px] font-heading font-black uppercase tracking-wide sm:tracking-widest sm:mb-1 whitespace-nowrap",
                      alert.status === "CRITICAL" ? "text-red-500" : "text-amber-500"
                    )}>
                      {alert.daysUntilExpiry} ngày nữa
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[8px] text-muted-foreground font-heading whitespace-nowrap">
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
        className="w-full mt-5 sm:mt-6 py-3.5 sm:py-4 rounded-2xl border border-border bg-white/55 dark:bg-transparent hover:bg-secondary/30 transition-all flex items-center justify-center gap-3 group"
      >
        <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em]">{t("view_details") || "Xem chi tiết lô hàng"}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
