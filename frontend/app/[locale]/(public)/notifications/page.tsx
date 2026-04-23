'use client';

import { useMemo, useState, useEffect } from 'react';
import { Header } from '@/components/common/header';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Bell, MessageCircle, Package, Tag, ThumbsUp, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { notificationService, type Notification } from '@/services/notification.service';
import { getNotificationSocket } from '@/lib/socket';
import { formatDistanceToNow, isToday, isWithinInterval, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

type NotifGroup = 'today' | 'week' | 'earlier';

const iconByType: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  PROMOTION: { Icon: Tag, color: 'text-gold', bg: 'bg-gold/10' },
  ORDER: { Icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  SHIPPING: { Icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  LOYALTY: { Icon: ThumbsUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  SYSTEM: { Icon: Info, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  DEFAULT: { Icon: Bell, color: 'text-stone-500', bg: 'bg-stone-500/10' },
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [active, setActive] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await notificationService.getNotifications({ take: 50 });
        setNotifications(res.data);
        
        // Mark all as read when opening page
        await notificationService.markAllAsRead();
        window.dispatchEvent(new CustomEvent('notification-update'));
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Real-time listener
    const socket = getNotificationSocket();
    const handler = () => {
      void fetchNotifications();
    };
    socket.on('notification', handler);

    return () => {
      socket.off('notification', handler);
    };
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    if (active === 'all') return notifications;
    return notifications.filter((n) => n.type === active);
  }, [active, notifications]);

  const groups = useMemo(() => {
    const by: Record<NotifGroup, Notification[]> = { today: [], week: [], earlier: [] };
    const now = new Date();
    const lastWeek = subDays(now, 7);

    filtered.forEach((n) => {
      const date = new Date(n.createdAt);
      if (isToday(date)) {
        by.today.push(n);
      } else if (isWithinInterval(date, { start: lastWeek, end: now })) {
        by.week.push(n);
      } else {
        by.earlier.push(n);
      }
    });
    return by;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-24">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center">
              <Bell className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-foreground">
                Thông báo
              </h1>
              <p className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-bold mt-1">
                Cập nhật khuyến mãi, đơn hàng, tin nhắn và hoạt động cộng đồng
              </p>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="border border-border rounded-3xl p-10 bg-background/60 text-center">
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập để xem thông báo của bạn.
            </p>
            <Link
              href="/login"
              className="inline-flex mt-6 px-8 py-3 rounded-full bg-gold text-primary-foreground text-[10px] uppercase tracking-widest font-bold"
            >
              Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'PROMOTION', label: 'Khuyến mãi' },
                { id: 'ORDER', label: 'Đơn hàng' },
                { id: 'LOYALTY', label: 'Điểm thưởng' },
                { id: 'SYSTEM', label: 'Hệ thống' },
              ].map((t) => (
                <button
                   key={t.id}
                   type="button"
                   onClick={() => setActive(t.id)}
                   className={cn(
                     'px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0',
                     active === t.id
                       ? 'bg-foreground text-background border-foreground'
                       : 'border-border text-muted-foreground hover:text-foreground',
                   )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 border border-border border-dashed rounded-3xl">
                <p className="text-sm text-muted-foreground">Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {(['today', 'week', 'earlier'] as const).map((g) => {
                  const items = groups[g];
                  if (!items.length) return null;
                  
                  const groupLabels = {
                    today: 'Hôm nay',
                    week: 'Tuần này',
                    earlier: 'Trước đó'
                  };

                  return (
                    <section key={g}>
                      <h2 className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-bold mb-3">
                        {groupLabels[g]}
                      </h2>

                      <div className="border border-border rounded-3xl overflow-hidden bg-background/60 backdrop-blur-sm">
                        {items.map((n) => {
                          const { Icon, color, bg } = iconByType[n.type] || iconByType.DEFAULT;
                          const data = n.data ? JSON.parse(n.data) : {};
                          
                          // Determine href based on type and data
                          let href = '#';
                          if (n.type === 'ORDER') href = `/dashboard/customer/orders/${data.orderId || ''}`;
                          if (n.type === 'PROMOTION') href = '/vouchers';
                          if (n.type === 'SYSTEM' && data.quizId) href = `/quiz`;

                          const Row = (
                            <div className={cn(
                                'flex items-start gap-4 px-5 py-4 md:px-6 md:py-5 transition-colors',
                                'hover:bg-secondary/20',
                                !n.isRead && 'bg-gold/5'
                              )}
                            >
                              <div className={cn('w-12 h-12 rounded-full shrink-0 flex items-center justify-center border border-border', bg)}>
                                <Icon className={cn('w-5 h-5', color)} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <p className="font-bold text-xs uppercase tracking-widest text-gold">
                                    {n.type}
                                  </p>
                                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold shrink-0">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                                  </span>
                                </div>
                                
                                <h3 className={cn("text-sm font-bold mb-1", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                  {n.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {n.content}
                                </p>
                              </div>
                              {!n.isRead && <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />}
                            </div>
                          );

                          return (
                            <Link key={n.id} href={href} className="block border-b border-border last:border-b-0">
                              {Row}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

