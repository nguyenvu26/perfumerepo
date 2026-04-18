'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/common/header';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Bell, MessageCircle, Package, Tag, ThumbsUp, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NotifType = 'promotion' | 'order' | 'message' | 'review_like' | 'review_report';
type NotifGroup = 'today' | 'week' | 'earlier';

type NotificationItem = {
  id: string;
  type: NotifType;
  group: NotifGroup;
  read: boolean;
  timeLabel: string;
  actorLabel?: string; // e.g. "Admin"
  title: string;
  targetLabel?: string; // e.g. order code, promo code, product name
  href?: string;
};

const iconByType: Record<NotifType, { Icon: LucideIcon; color: string; bg: string }> = {
  promotion: { Icon: Tag, color: 'text-gold', bg: 'bg-gold/10' },
  order: { Icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  message: { Icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  review_like: { Icon: ThumbsUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  review_report: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const mock: NotificationItem[] = [
  {
    id: 'n1',
    type: 'promotion',
    group: 'today',
    read: false,
    timeLabel: '2 phút',
    actorLabel: 'PERFUME GPT',
    title: 'Khuyến mãi mới: GIẢM 20% cho đơn từ 3.000.000đ',
    targetLabel: 'PERFUME GPT20',
    href: '/collection',
  },
  {
    id: 'n2',
    type: 'order',
    group: 'today',
    read: false,
    timeLabel: '18 phút',
    actorLabel: 'Đơn hàng',
    title: 'Đơn của bạn đã được xác nhận và đang xử lý',
    targetLabel: '#LM-8420',
    href: '/dashboard/customer/orders',
  },
  {
    id: 'n3',
    type: 'message',
    group: 'week',
    read: false,
    timeLabel: '3 giờ',
    actorLabel: 'Admin',
    title: 'Bạn có tin nhắn mới từ admin',
    targetLabel: 'Hỗ trợ đơn hàng',
    href: '/dashboard/chat',
  },
  {
    id: 'n4',
    type: 'review_like',
    group: 'week',
    read: true,
    timeLabel: '2 ngày',
    actorLabel: 'Cộng đồng',
    title: 'Bình luận/review của bạn vừa được thích',
    targetLabel: 'Review “Velvet Oud”',
    href: '/dashboard/customer/orders',
  },
  {
    id: 'n5',
    type: 'review_report',
    group: 'earlier',
    read: true,
    timeLabel: '1 tuần',
    actorLabel: 'Hệ thống',
    title: 'Review của bạn bị report và đang được kiểm tra',
    targetLabel: 'Review #R-1203',
    href: '/dashboard/customer/orders',
  },
];

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [active, setActive] = useState<'all' | NotifType>('all');

  const filtered = useMemo(() => {
    if (active === 'all') return mock;
    return mock.filter((n) => n.type === active);
  }, [active]);

  const groups = useMemo(() => {
    const by: Record<NotifGroup, NotificationItem[]> = { today: [], week: [], earlier: [] };
    filtered.forEach((n) => by[n.group].push(n));
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
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
              {[
                { id: 'all' as const, label: 'Tất cả' },
                { id: 'promotion' as const, label: 'Khuyến mãi' },
                { id: 'order' as const, label: 'Đơn hàng' },
                { id: 'message' as const, label: 'Tin nhắn' },
                { id: 'review_like' as const, label: 'Lượt thích' },
                { id: 'review_report' as const, label: 'Báo cáo' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={cn(
                    'px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors',
                    active === t.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-8">
              {([
                { key: 'today' as const, label: 'Hôm nay' },
                { key: 'week' as const, label: 'Tuần này' },
                { key: 'earlier' as const, label: 'Trước đó' },
              ]).map((g) => {
                const items = groups[g.key];
                if (!items.length) return null;
                return (
                  <section key={g.key}>
                    <h2 className="text-[10px] uppercase tracking-[.3em] text-muted-foreground font-bold mb-3">
                      {g.label}
                    </h2>

                    <div className="border border-border rounded-3xl overflow-hidden bg-background/60">
                      {items.map((n) => {
                        const { Icon, color, bg } = iconByType[n.type];
                        const Row = (
                          <div
                            className={cn(
                              'flex items-start gap-4 px-5 py-4 md:px-6 md:py-5 transition-colors',
                              'hover:bg-secondary/20',
                            )}
                          >
                            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center border border-border', bg)}>
                              <Icon className={cn('w-5 h-5', color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-foreground">
                                  {n.actorLabel ? (
                                    <span className="font-bold">{n.actorLabel} </span>
                                  ) : null}
                                  <span className={n.read ? 'text-muted-foreground' : ''}>{n.title}</span>
                                  {n.targetLabel ? (
                                    <span className="font-bold"> {n.targetLabel}</span>
                                  ) : null}
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                  {!n.read ? <span className="w-2 h-2 rounded-full bg-gold" /> : null}
                                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                    {n.timeLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );

                        return n.href ? (
                          <Link key={n.id} href={n.href} className="block border-b border-border last:border-b-0">
                            {Row}
                          </Link>
                        ) : (
                          <div key={n.id} className="border-b border-border last:border-b-0">
                            {Row}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

