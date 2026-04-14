"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  X,
  RotateCcw,
  Minus,
  Plus,
  Upload,
  Loader2,
  CheckCircle,
  ImageIcon,
  Video,
  Trash2,
  AlertCircle,
  Play,
} from "lucide-react";
import { returnsService } from "@/services/returns.service";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: number;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
}

interface CreateReturnModalProps {
  orderId: string;
  items: OrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ReturnItemState {
  selected: boolean;
  quantity: number;
  reason: string;
  images: string[];
  videoUrl: string | null;
  videoName: string | null;
  uploadingImages: boolean;
  uploadingVideo: boolean;
}

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const MIN_VIDEO_SECONDS = 3;
const MAX_VIDEO_SECONDS = 60;

export function CreateReturnModal({
  orderId,
  items,
  onClose,
  onSuccess,
}: CreateReturnModalProps) {
  const t = useTranslations("dashboard.customer.returns.create_modal");

  const [reason, setReason] = useState("");
  const [selectedReasonType, setSelectedReasonType] = useState<
    "STORE" | "CUSTOMER" | ""
  >(""); // STORE = [DAMAGED]/[WRONG_ITEM], CUSTOMER = others
  const [additionalNote, setAdditionalNote] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [itemStates, setItemStates] = useState<Record<number, ReturnItemState>>(
    () => {
      const initial: Record<number, ReturnItemState> = {};
      items.forEach((item) => {
        initial[item.id] = {
          selected: false,
          quantity: 1,
          reason: "",
          images: [],
          videoUrl: null,
          videoName: null,
          uploadingImages: false,
          uploadingVideo: false,
        };
      });
      return initial;
    },
  );

  const imageInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const videoInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // ── helpers ───────────────────────────────────────────────────────────────
  const toggleItem = (id: number) =>
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));

  const updateQty = (id: number, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItemStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: Math.min(
          item.quantity,
          Math.max(1, prev[id].quantity + delta),
        ),
      },
    }));
  };

  const updateReason = (id: number, value: string) =>
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], reason: value },
    }));

  // ── image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const current = itemStates[id].images.length;
    const remaining = MAX_IMAGES - current;
    if (remaining <= 0) return;

    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], uploadingImages: true },
    }));
    try {
      const validFiles = Array.from(files)
        .slice(0, remaining)
        .filter((f) => {
          if (f.size > 5 * 1024 * 1024) {
            toast.error(`Ảnh "${f.name}" vượt quá 5MB`);
            return false;
          }
          return true;
        });

      if (validFiles.length === 0) return;
      const formData = new FormData();
      validFiles.forEach((f) => formData.append("images", f));
      const res = await api.post<string[]>("/reviews/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setItemStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          images: [...prev[id].images, ...res.data],
          uploadingImages: false,
        },
      }));
    } catch {
      toast.error("Lỗi tải ảnh lên");
      setItemStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], uploadingImages: false },
      }));
    }
  };

  const removeImage = (itemId: number, imgIdx: number) =>
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        images: prev[itemId].images.filter((_, i) => i !== imgIdx),
      },
    }));

  // ── video upload ──────────────────────────────────────────────────────────
  const handleVideoSelect = async (id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // validate duration client-side
    const duration = await getVideoDuration(file);
    if (duration < MIN_VIDEO_SECONDS) {
      toast.error(t("video_too_short"));
      if (videoInputRefs.current[id]) videoInputRefs.current[id]!.value = "";
      return;
    }
    if (duration > MAX_VIDEO_SECONDS) {
      toast.error(t("video_too_long"));
      if (videoInputRefs.current[id]) videoInputRefs.current[id]!.value = "";
      return;
    }

    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], uploadingVideo: true },
    }));
    try {
      const formData = new FormData();
      formData.append("video", file); // field name must be "video"
      const res = await api.post<{ url: string }>(
        "/returns/upload-video",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setItemStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          videoUrl: res.data.url,
          videoName: file.name,
          uploadingVideo: false,
        },
      }));
      toast.success(t("video_uploaded"));
    } catch {
      toast.error("Lỗi tải video lên");
      setItemStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], uploadingVideo: false },
      }));
    }
  };

  const removeVideo = (id: number) => {
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], videoUrl: null, videoName: null },
    }));
    if (videoInputRefs.current[id]) videoInputRefs.current[id]!.value = "";
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const selectedItems = items.filter((i) => itemStates[i.id]?.selected);
    if (selectedItems.length === 0) {
      toast.error(t("error_no_items"));
      return;
    }
    for (const item of selectedItems) {
      if (itemStates[item.id].quantity <= 0) {
        toast.error(t("error_qty"));
        return;
      }
      if (itemStates[item.id].images.length < MIN_IMAGES) {
        toast.error(t("min_images_warning"));
        return;
      }
    }

    if (!selectedReasonType || !reason) {
      toast.error("Vui lòng chọn lý do trả hàng");
      return;
    }

    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) {
      toast.error(
        "Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng để nhận hoàn tiền",
      );
      return;
    }

    setSubmitting(true);
    try {
      // Generate a unique idempotency key to prevent duplicate submissions
      const idempotencyKey = crypto.randomUUID();
      // Combine reason with additional note for complete context
      const completeReason = additionalNote.trim()
        ? `${reason} | ${additionalNote.trim()}`
        : reason;

      await returnsService.createReturn(
        {
          orderId,
          reason: completeReason,
          paymentInfo: {
            bankName,
            accountNumber: bankAccount,
            accountName: bankHolder,
          },
          items: selectedItems.map((item) => ({
            variantId: item.variantId,
            quantity: itemStates[item.id].quantity,
            reason: itemStates[item.id].reason || undefined,
            images: [
              ...itemStates[item.id].images,
              ...(itemStates[item.id].videoUrl
                ? [itemStates[item.id].videoUrl!]
                : []),
            ],
          })),
        },
        idempotencyKey,
      );
      toast.success(t("success"));
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = items.filter((i) => itemStates[i.id]?.selected).length;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-background/80 backdrop-blur-xl flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <RotateCcw size={16} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-heading uppercase tracking-widest text-foreground">
                {t("title")}
              </h2>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-bold">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6">
          {/* Items selection */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t("select_items")}
            </p>
            <div className="space-y-3">
              {items.map((item) => {
                const state = itemStates[item.id];
                const imageUrl = item.product?.images?.[0]?.url;
                const imgCount = state.images.length;
                const hasMinImages = imgCount >= MIN_IMAGES;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      state.selected
                        ? "border-gold/40 bg-gold/5"
                        : "border-border bg-secondary/20 hover:border-border/80"
                    }`}
                  >
                    {/* Item header row */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          state.selected
                            ? "bg-gold border-gold"
                            : "border-border"
                        }`}
                      >
                        {state.selected && (
                          <CheckCircle
                            size={12}
                            className="text-primary-foreground fill-primary-foreground"
                          />
                        )}
                      </div>

                      {/* Product image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 relative">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product?.name || ""}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground uppercase tracking-tight line-clamp-1">
                          {item.product?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          × {item.quantity} — {formatCurrency(item.unitPrice)}
                        </p>
                      </div>

                      <span className="font-bold text-sm text-foreground flex-shrink-0">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>

                    {/* Expanded area */}
                    {state.selected && (
                      <div className="px-4 pb-4 space-y-5 border-t border-gold/10 pt-4">
                        {/* Quantity */}
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-shrink-0">
                            {t("quantity_label")}
                          </span>
                          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.id, -1);
                              }}
                              disabled={state.quantity <= 1}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-background/80 transition-all disabled:opacity-40"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {state.quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.id, 1);
                              }}
                              disabled={state.quantity >= item.quantity}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-background/80 transition-all disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            / {item.quantity}
                          </span>
                        </div>

                        {/* Item reason */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                            {t("item_reason_label")}
                          </label>
                          <input
                            type="text"
                            value={state.reason}
                            onChange={(e) =>
                              updateReason(item.id, e.target.value)
                            }
                            placeholder={t("item_reason_placeholder")}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-background/60 border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
                          />
                        </div>

                        {/* ── IMAGES ──────────────────────────────────────── */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {t("images_label")}
                            </label>
                            {/* Progress indicator */}
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest ${hasMinImages ? "text-emerald-500" : "text-amber-500"}`}
                            >
                              {imgCount}/{MAX_IMAGES}
                              {!hasMinImages && ` (min ${MIN_IMAGES})`}
                            </span>
                          </div>
                          <p className="text-[9px] text-muted-foreground/70 mb-3">
                            {t("images_desc")}
                          </p>

                          {/* Progress bar */}
                          <div className="h-1 bg-secondary rounded-full mb-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                hasMinImages ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{
                                width: `${(imgCount / MAX_IMAGES) * 100}%`,
                              }}
                            />
                          </div>

                          {!hasMinImages && imgCount > 0 && (
                            <div className="flex items-center gap-2 text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-3">
                              <AlertCircle size={10} />
                              <span>{t("min_images_warning")}</span>
                            </div>
                          )}

                          {/* Image grid */}
                          <div className="flex flex-wrap gap-2">
                            {state.images.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative w-20 h-20 rounded-xl overflow-hidden group border border-border"
                              >
                                <Image
                                  src={url}
                                  alt={`evidence-${idx}`}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                                {/* Overlay with remove */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(item.id, idx);
                                  }}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <Trash2 size={16} className="text-white" />
                                </button>
                                {/* Index badge */}
                                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-white">
                                    {idx + 1}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Add image button */}
                            {state.images.length < MAX_IMAGES && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  imageInputRefs.current[item.id]?.click();
                                }}
                                disabled={state.uploadingImages}
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-gold/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-gold transition-all disabled:opacity-50"
                              >
                                {state.uploadingImages ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <>
                                    <ImageIcon size={16} />
                                    <span className="text-[8px] font-bold uppercase">
                                      {t("add_photo")}
                                    </span>
                                  </>
                                )}
                              </button>
                            )}

                            <input
                              ref={(el) => {
                                imageInputRefs.current[item.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(item.id, e.target.files)
                              }
                            />
                          </div>
                        </div>

                        {/* ── VIDEO ────────────────────────────────────────── */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Video size={12} className="text-gold" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {t("video_label")}
                            </label>
                          </div>
                          <p className="text-[9px] text-muted-foreground/70 mb-3">
                            {t("video_desc")}
                          </p>

                          {state.videoUrl ? (
                            /* Video preview */
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-black group">
                              <video
                                src={state.videoUrl}
                                controls
                                className="w-full max-h-40 object-contain"
                                muted
                                playsInline
                              />
                              {/* Remove button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVideo(item.id);
                                }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                              {/* Uploaded badge */}
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/80 text-white text-[8px] font-bold uppercase tracking-widest">
                                <CheckCircle size={10} />
                                {t("video_uploaded")}
                              </div>
                            </div>
                          ) : (
                            /* Upload button */
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                videoInputRefs.current[item.id]?.click();
                              }}
                              disabled={state.uploadingVideo}
                              className="w-full py-5 rounded-2xl border-2 border-dashed border-border hover:border-gold/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-gold transition-all disabled:opacity-50 bg-secondary/10"
                            >
                              {state.uploadingVideo ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">
                                    {t("video_uploading")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Play size={18} />
                                    <Video size={18} />
                                  </div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest">
                                    {t("add_video")}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest">
                                    MP4 / MOV / WEBM · {MIN_VIDEO_SECONDS}s –{" "}
                                    {MAX_VIDEO_SECONDS}s
                                  </span>
                                </>
                              )}
                            </button>
                          )}

                          <input
                            ref={(el) => {
                              videoInputRefs.current[item.id] = el;
                            }}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) =>
                              handleVideoSelect(item.id, e.target.files)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall reason - Redesigned with logic */}
          <div>
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
                Chọn Lý Do Trả Hàng (Bắt Buộc)
              </label>

              {/* Store Fault - Ship Refundable */}
              <div className="mb-6">
                <p className="text-[9px] font-bold uppercase tracking-widest text-green-500/80 mb-3 flex items-center gap-2">
                  <CheckCircle size={12} /> Lỗi của Cửa Hàng (Hoàn toàn bộ + phí
                  ship)
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: "[DAMAGED]", label: "Hàng hư hỏng / Chai/lọ bị vỡ" },
                    { key: "[WRONG_ITEM]", label: "Gửi sai sản phẩm" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      onClick={() => {
                        setSelectedReasonType("STORE");
                        setReason(opt.key);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedReasonType === "STORE" && reason === opt.key
                          ? "border-green-500/60 bg-green-500/10"
                          : "border-border/30 bg-background/20 hover:border-green-500/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={opt.key}
                        checked={
                          selectedReasonType === "STORE" && reason === opt.key
                        }
                        onChange={() => {
                          setSelectedReasonType("STORE");
                          setReason(opt.key);
                        }}
                        className="w-4 h-4 accent-green-500"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Reason - No Ship Refund */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80 mb-3 flex items-center gap-2">
                  <AlertCircle size={12} /> Lý Do Khác (Hoàn sản phẩm, không
                  hoàn phí ship)
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      key: "[SCENT_MISMATCH]",
                      label: "Mùi hương không phù hợp với sở thích",
                    },
                    {
                      key: "[COLOR_MISMATCH]",
                      label: "Màu/sắc tố không đúng như mong đợi",
                    },
                    { key: "[EXPIRED]", label: "Sản phẩm gần hết hạn sử dụng" },
                    {
                      key: "[QUALITY_ISSUE]",
                      label: "Chất lượng không như kỳ vọng",
                    },
                    {
                      key: "[PERSONAL_CHANGE]",
                      label: "Thay đổi ý định không muốn mua",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      onClick={() => {
                        setSelectedReasonType("CUSTOMER");
                        setReason(opt.key);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedReasonType === "CUSTOMER" && reason === opt.key
                          ? "border-amber-500/60 bg-amber-500/10"
                          : "border-border/30 bg-background/20 hover:border-amber-500/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={opt.key}
                        checked={
                          selectedReasonType === "CUSTOMER" &&
                          reason === opt.key
                        }
                        onChange={() => {
                          setSelectedReasonType("CUSTOMER");
                          setReason(opt.key);
                        }}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Refund Preview Alert */}
            {reason && (
              <div
                className={cn(
                  "p-4 rounded-2xl border-2 mb-6 animate-in slide-in-from-top-2 duration-300",
                  selectedReasonType === "STORE"
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-amber-500/30 bg-amber-500/10",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-bold flex items-center gap-2",
                    selectedReasonType === "STORE"
                      ? "text-green-500"
                      : "text-amber-600",
                  )}
                >
                  {selectedReasonType === "STORE" ? (
                    <>
                      <CheckCircle size={14} />
                      Hoàn tiền đầy đủ (tính cả phí vận chuyển gốc)
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      Hoàn tiền sản phẩm (không hoàn phí vận chuyển)
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Additional notes */}
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Ghi Chú Thêm (Tùy chọn)
            </label>
            <textarea
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              placeholder={
                selectedReasonType
                  ? "Thêm chi tiết..."
                  : "Vui lòng chọn lý do trước"
              }
              rows={2}
              disabled={!selectedReasonType}
              className={cn(
                "w-full border rounded-2xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none transition-colors resize-none",
                !selectedReasonType
                  ? "bg-secondary/20 border-border/30 text-muted-foreground/50 cursor-not-allowed"
                  : "bg-secondary/30 border-border focus:border-gold/50",
              )}
            />

            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2 mt-6">
              Thông tin nhận hoàn tiền (Bắt buộc)
            </label>
            <div className="grid grid-cols-1 gap-4 bg-gold/5 p-5 rounded-2xl border border-gold/20 mb-6">
              <p className="text-xs text-gold mb-2">
                * Đơn hàng thanh toán theo hình thức online sẽ được hoàn tiền
                thủ công qua tài khoản ngân hàng.
              </p>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                  Tên Ngân hàng
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank"
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Số Tài Khoản
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="VD: 1012345678"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Chủ Tài Khoản
                  </label>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/50"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border bg-background/80 backdrop-blur-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("cancel_btn")}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-primary-foreground rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {submitting ? t("submitting") : t("submit_btn")}
            {selectedCount > 0 && !submitting && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[9px]">
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── utils ──────────────────────────────────────────────────────────────────
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
