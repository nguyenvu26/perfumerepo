"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Sparkles,
  CheckCircle2,
  Truck,
  Star,
  Settings,
  ChevronRight,
  Circle,
  Loader2,
  Bell,
} from "lucide-react";
import { Header } from "@/components/common/header";
import { useTranslations } from "next-intl";
import {
  notificationService,
  type Notification,
} from "@/services/notification.service";
import { getNotificationSocket, resetNotificationSocket } from "@/lib/socket";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  ORDER: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  SHIPPING: { icon: Truck, color: "text-amber-500", bg: "bg-amber-500/10" },
  PROMOTION: { icon: Sparkles, color: "text-gold", bg: "bg-gold/10" },
  LOYALTY: { icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  SYSTEM: { icon: Settings, color: "text-stone-500", bg: "bg-stone-500/10" },
};

export default function NotificationsPage() {
  const t = useTranslations("dashboard.customer.notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const take = 20;

  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("time.just_now");
    if (diffMin < 60) return t("time.mins_ago", { count: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t("time.hours_ago", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t("time.yesterday");
    if (diffDays < 7) return t("time.days_ago", { count: diffDays });
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }, [t]);

  const fetchNotifications = useCallback(async (s = 0) => {
    try {
      const res = await notificationService.getNotifications({ skip: s, take });
      if (s === 0) {
        setNotifications(res.data);
      } else {
        setNotifications((prev) => [...prev, ...res.data]);
      }
      setTotal(res.total);
      setSkip(s);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Real-time via WebSocket
    const socket = getNotificationSocket();
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (userId) {
      socket.emit("join", { userId });
    }
    socket.on("notification", (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      setTotal((prev) => prev + 1);
    });

    return () => {
      socket.off("notification");
      resetNotificationSocket();
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const loadMore = () => {
    if (notifications.length < total) {
      fetchNotifications(skip + take);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
      <Header />

      <main className="container mx-auto px-6 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-end mb-16 px-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-luxury-black dark:text-white mb-4">
                {t.rich("title", {
                  italic: () => <span className="italic">cations</span>,
                })}
              </h1>
              <p className="text-[10px] text-stone-500 uppercase tracking-[.3em] font-bold">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex gap-6">
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-luxury-black dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                {t("mark_all_read")} <CheckCircle2 size={14} />
              </button>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {notifications.map((notif, i) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative glass rounded-[2.5rem] p-8 border transition-all cursor-pointer ${
                      notif.isRead
                        ? "bg-white/40 dark:bg-white/2 border-stone-100 dark:border-white/5 opacity-70"
                        : "bg-white dark:bg-zinc-900 border-stone-200 dark:border-white/10 shadow-sm hover:shadow-xl"
                    }`}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-8 right-10">
                        <Circle
                          size={8}
                          className="fill-gold text-gold animate-pulse"
                        />
                      </div>
                    )}

                    <div className="flex gap-8 items-start">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${config.bg}`}
                      >
                        <Icon
                          className={config.color}
                          size={28}
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 pr-8">
                        <div className="flex justify-between items-center">
                          <h3
                            className={`text-lg font-bold transition-colors ${notif.isRead ? "text-stone-600 dark:text-stone-400" : "text-metropolis-black dark:text-white"}`}
                          >
                            {notif.title}
                          </h3>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm leading-relaxed max-w-2xl transition-colors ${notif.isRead ? "text-stone-400" : "text-stone-600 dark:text-stone-300"}`}
                        >
                          {notif.content}
                        </p>
                        <div className="flex gap-6 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-2 hover:underline underline-offset-4 cursor-pointer">
                            {t("view_details")} <ChevronRight size={12} />
                          </button>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                            >
                              {t("mark_read")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {notifications.length < total && (
            <footer className="mt-20 pt-10 border-t border-stone-100 dark:border-white/5 text-center">
              <button
                onClick={loadMore}
                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-gold transition-colors cursor-pointer"
              >
                {t("load_more")}
              </button>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
