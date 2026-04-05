"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n";
import { orderService, type Order } from "@/services/order.service";
import { shippingService, type Shipment } from "@/services/shipping.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  Truck,
  ExternalLink,
  Star,
  Clock,
  PackageCheck,
  XCircle,
} from "lucide-react";
import ReviewForm from "@/components/review/review-form";
import { useTranslations, useLocale, useFormatter } from "next-intl";

export default function CustomerOrderDetailPage() {
  const t = useTranslations("dashboard.customer.orders");
  const tDetail = useTranslations("dashboard.customer.order_detail");
  const tFeatured = useTranslations("featured");
  const locale = useLocale();
  const format = useFormatter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItemId, setReviewingItemId] = useState<number | null>(null);

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; icon: any }
  > = {
    PENDING: {
      label: t("status.pending"),
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: Clock,
    },
    CONFIRMED: {
      label: t("status.confirmed"),
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: PackageCheck,
    },
    PROCESSING: {
      label: t("status.processing"),
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      icon: PackageCheck,
    },
    SHIPPED: {
      label: t("status.shipped"),
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      icon: Truck,
    },
    COMPLETED: {
      label: t("status.completed"),
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: PackageCheck,
    },
    CANCELLED: {
      label: t("status.cancelled"),
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: XCircle,
    },
  };

  const TRACKING_URL = "https://donhang.ghn.vn/?order_code=";

  const fetchOrder = async () => {
    if (orderId) {
      try {
        const [o, s] = await Promise.all([
          orderService.getById(orderId),
          shippingService.getByOrderId(orderId).catch(() => []),
        ]);
        setOrder(o);
        setShipments(s);
      } catch (err) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const formatCurrency = (amount: number) => {
    return format.number(amount, {
      style: "currency",
      currency: tFeatured("currency_code") || "VND",
      maximumFractionDigits: 0,
    });
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["customer", "staff", "admin"]}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-gold" />
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard allowedRoles={["customer", "staff", "admin"]}>
        <div className="py-20 text-center">
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            {tDetail("not_found")}
          </p>
          <Link
            href="/dashboard/customer/orders"
            className="text-gold hover:underline font-bold"
          >
            {tDetail("back_to_list")}
          </Link>
        </div>
      </AuthGuard>
    );
  }

  const style =
    STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.PENDING;

  return (
    <AuthGuard allowedRoles={["customer", "staff", "admin"]}>
      <div className="flex flex-col gap-10 py-10 px-8">
        <header>
          <Link
            href="/dashboard/customer/orders"
            className="inline-flex items-center gap-2 text-gold hover:text-gold/80 mb-6 font-bold uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={16} />
            {tDetail("back")}
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
            {tDetail("order_number", { code: order.code })}
          </h1>
          <p className="text-[10px] text-stone-500 uppercase tracking-[.4em] font-bold">
            {new Date(order.createdAt!).toLocaleDateString(
              locale === "vi" ? "vi-VN" : "en-US",
              {
                dateStyle: "full",
              }
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-stone-100 dark:border-white/5">
              <h2 className="text-xl font-heading text-luxury-black dark:text-white mb-6 uppercase tracking-widest border-b border-border pb-4">
                {tDetail("products")}
              </h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-6">
                  {order.items.map((item: any) => {
                    const imageUrl = item.product?.images?.[0]?.url ?? null;
                    const productHref = item.product?.id
                      ? `/products/${item.product.id}`
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="py-4 border-b border-stone-100 dark:border-white/5 last:border-0"
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          {productHref ? (
                            <Link
                              href={productHref}
                              className="flex-shrink-0 group"
                            >
                              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-zinc-800 relative">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.product?.name ?? "product"}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="80px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl">
                                    📦
                                  </div>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-zinc-800 relative">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={item.product?.name ?? "product"}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl">
                                  📦
                                </div>
                              )}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                {productHref ? (
                                  <Link
                                    href={productHref}
                                    className="font-bold text-luxury-black dark:text-white hover:text-gold transition-colors line-clamp-2 uppercase tracking-tight"
                                  >
                                    {item.product?.name}
                                  </Link>
                                ) : (
                                  <p className="font-bold text-luxury-black dark:text-white uppercase tracking-tight">
                                    {item.product?.name}
                                  </p>
                                )}
                                <p className="text-[10px] text-stone-400 uppercase mt-1">
                                  × {item.quantity} —{" "}
                                  {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className="font-bold text-luxury-black dark:text-white">
                                  {formatCurrency(item.totalPrice)}
                                </span>
                                {order.status === "COMPLETED" && !item.review && (
                                  <button
                                    onClick={() =>
                                      setReviewingItemId(
                                        reviewingItemId === item.id
                                          ? null
                                          : item.id
                                      )
                                    }
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold hover:text-gold/80"
                                  >
                                    <Star
                                      size={12}
                                      className={
                                        reviewingItemId === item.id
                                          ? "fill-gold"
                                          : ""
                                      }
                                    />
                                    {reviewingItemId === item.id
                                      ? tDetail("writing_review")
                                      : tDetail("write_review")}
                                  </button>
                                )}
                                {item.review && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                    <Star size={12} className="fill-emerald-500" />
                                    {tDetail("reviewed")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {reviewingItemId === item.id && (
                              <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <ReviewForm
                                  productId={item.product?.id || ""}
                                  orderItemId={item.id}
                                  productName={item.product?.name || ""}
                                  onCancel={() => setReviewingItemId(null)}
                                  onSuccess={() => {
                                    setReviewingItemId(null);
                                    fetchOrder();
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-stone-500">{tDetail("no_products")}</p>
              )}
            </div>

            <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-stone-100 dark:border-white/5">
              <h2 className="text-xl font-heading text-luxury-black dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-border pb-4">
                <MapPin size={20} className="text-gold" />
                {tDetail("shipping_address")}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-300 font-medium uppercase tracking-tight">
                {order.shippingAddress}
              </p>
              {order.phone && (
                <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-2 font-bold tracking-widest">
                  <Phone size={12} /> {order.phone}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-stone-100 dark:border-white/5 shadow-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">
                {tDetail("status")}
              </h3>
              <div className="flex flex-col gap-4">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${style.color}`}
                >
                  <style.icon size={12} />
                  {style.label}
                </span>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  {tDetail("payment")}:{" "}
                  <span className="text-luxury-black dark:text-white uppercase">
                    {order.paymentStatus === "PAID"
                      ? tDetail("payment_status.paid")
                      : order.paymentStatus === "PENDING"
                      ? tDetail("payment_status.pending")
                      : order.paymentStatus}
                  </span>
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-border space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-stone-400">{tDetail("subtotal")}</span>
                  <span className="text-luxury-black dark:text-white">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-stone-400">{tDetail("discount")}</span>
                    <span className="text-red-500">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest pt-4 border-t border-stone-100 dark:border-white/5">
                  <span className="text-luxury-black dark:text-white">
                    {tDetail("total")}
                  </span>
                  <span className="text-2xl font-heading text-gold tracking-tighter">
                    {formatCurrency(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment / Tracking */}
            {shipments.length > 0 && (
              <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-stone-100 dark:border-white/5 shadow-xl">
                <h3 className="text-xl font-heading text-luxury-black dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-border pb-4">
                  <Truck size={20} className="text-gold" />
                  {tDetail("tracking")}
                </h3>
                <div className="space-y-4">
                  {shipments.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-white/5"
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                            {tDetail("tracking_code")}
                          </p>
                          <p className="font-mono font-bold text-luxury-black dark:text-white text-sm">
                            {s.trackingCode || s.ghnOrderCode || "—"}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-2 font-bold uppercase tracking-widest opacity-60">
                            {tDetail("tracking_status", {
                              status: s.status
                                ? tDetail(`shipping_status_labels.${s.status}`)
                                : "Awaiting",
                            })}
                          </p>
                        </div>
                        {(s.trackingCode || s.ghnOrderCode) && (
                          <a
                            href={`${TRACKING_URL}${
                              s.trackingCode || s.ghnOrderCode
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gold hover:text-gold/80 text-[10px] font-bold uppercase tracking-widest border border-gold/20 w-fit px-4 py-2 rounded-full hover:bg-gold/5 transition-all"
                          >
                            {tDetail("ghn_lookup")} <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
