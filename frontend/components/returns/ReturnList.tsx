"use client";

import { useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  returnsService,
  ReturnRequest,
  ReturnStatus,
} from "@/services/returns.service";
import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ReturnStatus,
  { icon: any; color: string }
> = {
  REQUESTED: {
    icon: Clock,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  AWAITING_CUSTOMER: {
    icon: AlertCircle,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  REVIEWING: {
    icon: RefreshCw,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  APPROVED: {
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  RETURNING: {
    icon: Truck,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  RECEIVED: {
    icon: Package,
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  REFUNDING: {
    icon: RefreshCw,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  REFUND_FAILED: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "bg-gold/10 text-amber-600 border-gold/20",
  },
  REJECTED: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  REJECTED_AFTER_RETURN: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  CANCELLED: {
    icon: XCircle,
    color: "bg-stone-500/10 text-stone-500 border-stone-500/20",
  },
};

export function ReturnList() {
  const t = useTranslations("dashboard.customer.returns");
  const tFeatured = useTranslations("featured");
  const format = useFormatter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = () => {
    setLoading(true);
    returnsService
      .listMyReturns()
      .then(setReturns)
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const formatCurrency = (amount?: number) => {
    if (!amount) return "—";
    return format.number(amount, {
      style: "currency",
      currency: tFeatured("currency_code") || "VND",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="flex flex-col gap-6 md:gap-10 p-4 sm:p-10">
      <header className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
          {t("title")}
        </h1>
        <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.35em] font-bold">
          {t("subtitle")}
        </p>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : returns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 md:py-20 text-center space-y-6 glass rounded-[2.5rem] md:rounded-[3rem] border border-border bg-background/40"
        >
          <RotateCcw
            className="mx-auto text-muted-foreground/20 w-[60px] h-[60px] md:w-[80px] md:h-[80px]"
            strokeWidth={1}
          />
          <div className="space-y-2 px-6">
            <h3 className="text-lg md:text-xl font-heading text-foreground uppercase tracking-widest">
              {t("empty_title")}
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              {t("empty_desc")}
            </p>
          </div>
          <Link
            href="/dashboard/customer/orders"
            className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            {t("back_to_orders")} <ChevronRight size={12} />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {returns.map((ret, i) => {
            const cfg =
              STATUS_CONFIG[ret.status as ReturnStatus] ||
              STATUS_CONFIG.REQUESTED;
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass bg-black/60 backdrop-blur-xl rounded-3xl p-8 border border-gold/20 shadow-lg hover:shadow-2xl hover:border-gold/40 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group"
              >
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left section */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5 md:mb-6">
                      <div className="w-full sm:w-auto">
                        <span className="text-[8px] font-bold text-gold uppercase tracking-[.3em] mb-1 block">
                          {t("return_id")}
                        </span>
                        <p className="font-mono font-bold text-foreground text-[10px] md:text-sm uppercase tracking-tighter">
                          #{ret.id.slice(-10).toUpperCase()}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 md:px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                          cfg.color
                        )}
                      >
                        <StatusIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {t(`status.${ret.status}` as any) || ret.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 border-t border-gold/10 pt-5 mt-2 relative z-10">
                      <div>
                        <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          {t("order_ref")}
                        </p>
                        <p className="text-[10px] md:text-[11px] font-bold text-foreground uppercase truncate">
                          {ret.orderId.slice(-10).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          {t("items_count", { count: ret.items.length })}
                        </p>
                        <p className="text-[10px] md:text-[11px] font-bold text-foreground uppercase tracking-tighter">
                          {ret.items.length} {t("items_label")}
                        </p>
                      </div>
                      {ret.refundAmount != null && (
                        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 border-gold/5 pt-3 sm:pt-0">
                          <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {t("refund_label")}
                          </p>
                          <p className="text-base md:text-sm font-heading font-bold text-gold">
                            {formatCurrency(ret.refundAmount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-end lg:items-center relative z-10 shrink-0 border-t lg:border-t-0 border-gold/10 pt-5 lg:pt-0 mt-4 lg:mt-0 lg:pl-6 lg:border-l">
                    <Link
                      href={`/dashboard/customer/returns/${ret.id}`}
                      className="flex justify-center items-center gap-2 px-6 py-3.5 w-full lg:w-auto bg-gold/10 hover:bg-gold hover:text-black border border-gold/30 rounded-2xl text-[9px] md:text-xs font-bold uppercase tracking-widest text-gold transition-all duration-300 min-h-[44px]"
                    >
                      {t("view_detail")}
                      <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
