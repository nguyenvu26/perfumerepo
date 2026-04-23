"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n";
import { orderService, type Order } from "@/services/order.service";
import { shippingService, type Shipment } from "@/services/shipping.service";
import { returnsService, type ReturnRequest } from "@/services/returns.service";
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
  RotateCcw,
} from "lucide-react";
import ReviewForm from "@/components/review/review-form";
import { CreateReturnModal } from "@/components/returns/CreateReturnModal";
import { AlertTriangle } from "lucide-react";
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
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingReturn, setExistingReturn] = useState<ReturnRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [savingRefundInfo, setSavingRefundInfo] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    note: string;
  }>({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    note: "",
  });
  const [submittedRefundInfo, setSubmittedRefundInfo] = useState<any>(null);

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
        const r = await orderService.getRefundBankInfo(orderId).catch(() => null);
        setSubmittedRefundInfo(r);
        // Check if return already exists for this order
        returnsService.listMyReturns().then((returns) => {
          const found = returns.find((r) => r.orderId === orderId) || null;
          setExistingReturn(found);
        }).catch(() => { });
      } catch (err) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm(tDetail("confirm_cancel_desc"))) return;

    setCancelling(true);
    try {
      await orderService.cancel(orderId);
      fetchOrder();
    } catch (err) {
      console.error("Cancel error:", err);
      alert(tDetail("cancel_error"));
    } finally {
      setCancelling(false);
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
  const needsRefundBankInfo =
    order.status === "CANCELLED" &&
    order.paymentStatus === "PAID" &&
    !submittedRefundInfo;

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
          <h1 className="text-2xl md:text-3xl font-heading gold-gradient mb-2 uppercase tracking-tighter">
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
                                    className="font-heading text-base md:text-lg text-stone-900 dark:text-stone-100 hover:text-gold transition-colors line-clamp-2 uppercase tracking-wide"
                                  >
                                    {item.product?.name}
                                  </Link>
                                ) : (
                                  <p className="font-heading text-base md:text-lg text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                                    {item.product?.name}
                                  </p>
                                )}
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium tracking-tight uppercase">
                                  <span className="opacity-50 lowercase">x</span> {item.quantity} <span className="mx-1 opacity-20">|</span> {formatCurrency(item.unitPrice)}
                                </p>
                                {(() => {
                                  const refundedQty = (order.returnRequests || [])
                                    .filter(r => r.status === 'COMPLETED')
                                    .reduce((sum, r) => {
                                      const ri = r.items.find(ri => ri.variantId === item.variantId);
                                      return sum + (ri?.quantity || 0);
                                    }, 0);
                                  
                                  if (refundedQty > 0) {
                                    return (
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                          {refundedQty >= item.quantity 
                                            ? tDetail("status_refunded_full", { defaultValue: "Đã hoàn trả" })
                                            : tDetail("status_refunded_partial", { defaultValue: `Đã hoàn trả ${refundedQty}` })}
                                        </span>
                                      </div>
                                    );
                                  }

                                  const pendingRefundQty = (order.returnRequests || [])
                                    .filter(r => !['COMPLETED', 'CANCELLED', 'REJECTED', 'REJECTED_AFTER_RETURN'].includes(r.status))
                                    .reduce((sum, r) => {
                                      const ri = r.items.find(ri => ri.variantId === item.variantId);
                                      return sum + (ri?.quantity || 0);
                                    }, 0);

                                  if (pendingRefundQty > 0) {
                                    return (
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse">
                                          {tDetail("status_refunding", { defaultValue: "Đang yêu cầu trả" })}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className="font-heading text-stone-900 dark:text-stone-100 tracking-tight">
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

                {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
                  <button
                    disabled={cancelling}
                    onClick={handleCancelOrder}
                    className="flex items-center gap-2 w-fit px-4 py-2 rounded-full border border-red-500/30 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/5 transition-all disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {tDetail("cancel_order")}
                  </button>
                )}
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  {tDetail("payment")}:{" "}
                  <span className="text-luxury-black dark:text-white uppercase">
                    {order.paymentStatus === "PAID"
                      ? tDetail("payment_status.paid")
                      : order.paymentStatus === "PARTIALLY_REFUNDED"
                        ? tDetail("payment_status.partially_refunded", { defaultValue: "Hoàn tiền một phần" })
                        : order.paymentStatus === "REFUNDED"
                          ? tDetail("payment_status.refunded", { defaultValue: "Đã hoàn tiền" })
                          : order.paymentStatus === "PENDING"
                            ? tDetail("payment_status.pending")
                            : order.paymentStatus}
                  </span>
                </p>
                {needsRefundBankInfo && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="mt-2 w-fit px-4 py-2 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/15 transition-all"
                  >
                    Nhập thông tin nhận hoàn tiền
                  </button>
                )}
                {submittedRefundInfo && (
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                    Đã gửi thông tin nhận hoàn tiền
                  </p>
                )}
              </div>

              {/* Return Request Button — only for COMPLETED orders */}
              {order.status === "COMPLETED" && order.paymentStatus === "PAID" && (
                <div className="mt-6 pt-6 border-t border-stone-100 dark:border-white/5">
                  {existingReturn ? (
                    <Link
                      href={`/dashboard/customer/returns/${existingReturn.id}`}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-600 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-all"
                    >
                      <RotateCcw size={12} />
                      {tDetail("view_return")}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowPolicyModal(true)}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:border-amber-500/30 hover:text-amber-600 hover:bg-amber-500/5 transition-all"
                    >
                      <RotateCcw size={12} />
                      {tDetail("request_return")}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-border space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-stone-400">{tDetail("subtotal")}</span>
                  <span className="text-stone-900 dark:text-stone-100 font-heading tracking-tight">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-stone-400">{tDetail("discount")}</span>
                    <span className="text-red-500 font-heading tracking-tight">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest pt-4 border-t border-stone-100 dark:border-white/5">
                  <span className="text-stone-900 dark:text-stone-100">
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
                            href={`${TRACKING_URL}${s.trackingCode || s.ghnOrderCode
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

      {/* Create Return Modal */}
      {showReturnModal && order.items && order.items.length > 0 && (
        <CreateReturnModal
          orderId={orderId}
          items={order.items.map((item) => ({
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            product: item.product,
          }))}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => {
            setShowReturnModal(false);
            fetchOrder();
          }}
        />
      )}

      {/* Return Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-zinc-900/50">
              <h2 className="text-xl font-heading gold-gradient uppercase tracking-widest text-center">
                CHÍNH SÁCH ĐỔI TRẢ VÀ HOÀN TIỀN
              </h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] text-center mt-2 font-bold">
                (RETURN POLICY)
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-luxury-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px]">1</span>
                  Điều kiện đổi trả chung
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pl-8 text-justify">
                  Khách hàng có quyền yêu cầu trả hàng/hoàn tiền trong vòng <strong>07 ngày</strong> kể từ khi nhận hàng thành công. Mọi yêu cầu phải được thực hiện thông qua hệ thống PerfumeGPT kèm theo hình ảnh/video bằng chứng.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-luxury-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px]">2</span>
                  Phân định trách nhiệm và Chi phí
                </h3>
                
                <div className="pl-8 space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">2.1. Lỗi từ phía PerfumeGPT (Shop's Fault)</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      <strong>Trường hợp:</strong> Giao sai sản phẩm, hàng hết hạn sử dụng, hàng hư hỏng do vận chuyển hoặc lỗi đóng gói.<br/>
                      <strong>Chi phí:</strong> Shop chịu 100% phí vận chuyển thu hồi.<br/>
                      <strong>Hoàn tiền:</strong> Khách hàng được hoàn 100% giá trị đơn hàng (bao gồm phí ship ban đầu).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">2.2. Lỗi từ phía Khách hàng (Change of Mind)</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      <strong>Trường hợp:</strong> Khách hàng thay đổi ý định, đặt nhầm dung tích, không thích mùi hương.<br/>
                      <strong>Điều kiện bắt buộc:</strong> Sản phẩm phải <strong>CÒN NGUYÊN SEAL</strong> (Lớp nilon bọc ngoài và tem niêm phong). Chưa qua sử dụng, dù chỉ xịt thử 01 lần.<br/>
                      <strong>Chi phí:</strong> Khách hàng chịu phí vận chuyển trả hàng về kho.<br/>
                      <strong>Hoàn tiền:</strong> Chỉ hoàn giá trị sản phẩm (không hoàn phí ship ban đầu).
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-luxury-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px]">3</span>
                  Quy trình kiểm định và Xử lý hàng lỗi
                </h3>
                <div className="pl-8 space-y-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  <p>Khi hàng được hoàn trả về kho, Quản trị viên sẽ tiến hành kiểm tra tình trạng thực tế:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>Hàng đạt tiêu chuẩn:</strong> Hệ thống tự động thực hiện lệnh hoàn tiền trong vòng 3-5 ngày làm việc.</li>
                    <li>
                      <strong>KHÔNG đạt tiêu chuẩn (Mất seal, nứt vỡ, đã sử dụng):</strong> PerfumeGPT có quyền <strong>Từ chối hoàn tiền</strong>. 
                      Hệ thống cung cấp bằng chứng (hình ảnh/video kiểm hàng) trực tiếp trên ứng dụng.
                    </li>
                  </ul>
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-600 text-[10px] font-medium italic">
                    Xử lý tài sản: Sản phẩm lỗi sẽ được gửi trả lại cho khách hàng theo hình thức Ship COD phí vận chuyển (Khách hàng thanh toán). Sau 07 ngày nếu từ chối nhận, shop không chịu trách nhiệm hoàn tiền.
                  </div>
                </div>
              </section>

              <section className="space-y-3 pb-4">
                <h3 className="text-sm font-bold text-luxury-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px]">4</span>
                  Quy định về bằng chứng (Evidence)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pl-8">
                  Khách hàng nên quay video quá trình <strong>mở hộp (unboxing)</strong> và quá trình <strong>đóng gói trả hàng</strong>. Mọi tranh chấp không có bằng chứng sẽ được xử lý dựa trên kết quả kiểm định tại kho.
                </p>
              </section>
            </div>

            <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-zinc-900/50 flex gap-4">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="flex-1 py-4 rounded-2xl border border-stone-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:bg-white dark:hover:bg-zinc-800 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowPolicyModal(false);
                  setShowConfirmModal(true);
                }}
                className="flex-[2] py-4 rounded-2xl bg-gold text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Tôi đã đọc và đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Pop-up */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 p-10 space-y-8 animate-in zoom-in-95 duration-200 shadow-2xl text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageCheck size={40} className="text-amber-500" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-heading uppercase tracking-widest text-luxury-black dark:text-white">
                Xác nhận tình trạng
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed italic">
                "Tôi xác nhận sản phẩm vẫn còn <strong>nguyên seal</strong>. Tôi hiểu rằng nếu sản phẩm bị mất seal, tôi sẽ bị <strong>từ chối hoàn tiền</strong> và phải <strong>trả phí ship</strong> để nhận lại hàng."
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowReturnModal(true);
                }}
                className="w-full py-4 rounded-2xl bg-gold text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gold/20 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                Xác nhận và Tiếp tục
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-white/10 p-8 space-y-4">
            <h3 className="text-lg font-heading uppercase tracking-widest text-foreground">
              Thông tin tài khoản nhận hoàn tiền
            </h3>
            <input
              value={refundInfo.bankName}
              onChange={(e) =>
                setRefundInfo((p) => ({ ...p, bankName: e.target.value }))
              }
              placeholder="Tên ngân hàng"
              className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
            />
            <input
              value={refundInfo.accountNumber}
              onChange={(e) =>
                setRefundInfo((p) => ({ ...p, accountNumber: e.target.value }))
              }
              placeholder="Số tài khoản"
              className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
            />
            <input
              value={refundInfo.accountHolder}
              onChange={(e) =>
                setRefundInfo((p) => ({ ...p, accountHolder: e.target.value }))
              }
              placeholder="Tên chủ tài khoản"
              className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold"
            />
            <textarea
              value={refundInfo.note}
              onChange={(e) =>
                setRefundInfo((p) => ({ ...p, note: e.target.value }))
              }
              placeholder="Ghi chú (không bắt buộc)"
              className="w-full bg-secondary/20 border border-border rounded-xl py-3 px-4 outline-none focus:border-gold min-h-24"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-3 rounded-full border border-border text-muted-foreground hover:bg-secondary/50 text-[10px] font-bold uppercase tracking-widest"
              >
                Hủy
              </button>
              <button
                disabled={
                  savingRefundInfo ||
                  !refundInfo.bankName.trim() ||
                  !refundInfo.accountNumber.trim() ||
                  !refundInfo.accountHolder.trim()
                }
                onClick={async () => {
                  setSavingRefundInfo(true);
                  try {
                    await orderService.submitRefundBankInfo(orderId, refundInfo);
                    const r = await orderService.getRefundBankInfo(orderId);
                    setSubmittedRefundInfo(r);
                    setShowRefundModal(false);
                  } catch (e: any) {
                    alert(
                      e?.response?.data?.message ||
                        e?.message ||
                        "Không thể gửi thông tin hoàn tiền",
                    );
                  } finally {
                    setSavingRefundInfo(false);
                  }
                }}
                className="flex-1 py-3 rounded-full bg-gold text-primary-foreground text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {savingRefundInfo ? "Đang gửi..." : "Gửi thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
