"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  returnsService,
  ReturnRequest,
  ReturnStatus,
} from "@/services/returns.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Box,
  CreditCard,
  RotateCcw,
  Search,
  Store,
  Globe,
  RefreshCcw,
  Loader2,
  Banknote,
  Truck,
  Calendar,
  Upload,
  User,
  Barcode,
} from "lucide-react";
import api from "@/lib/axios";
import {
  staffOrdersService,
  StaffPosOrder,
} from "@/services/staff-orders.service";
import { Switch } from "@/components/ui/switch";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}

const getStatusColor = (status: ReturnStatus) => {
  switch (status) {
    case "REQUESTED":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "REVIEWING":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "APPROVED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "RETURNING":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "RECEIVED":
      return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold";
    case "REFUNDING":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "REJECTED":
    case "REJECTED_AFTER_RETURN":
    case "CANCELLED":
    case "REFUND_FAILED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

export const AdminReturnManagement = ({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) => {
  const t = useTranslations("dashboard.admin.returns");
  const { isSidebarCollapsed: isCollapsed } = useUIStore();

  const getStatusLabel = (status: ReturnStatus) => {
    return t(`status.${status}`);
  };
  const [data, setData] = useState<{ data: ReturnRequest[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null,
  );

  // Dialog States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "bank_transfer" | "gateway"
  >("cash");
  const [note, setNote] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [calculatingRefund, setCalculatingRefund] = useState(false);
  const [receiveItemsState, setReceiveItemsState] = useState<
    Record<string, { qtyReceived: number; sealIntact: boolean }>
  >({});
  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (isReceiveOpen && selectedReturn) {
      const initial: Record<
        string,
        { qtyReceived: number; sealIntact: boolean }
      > = {};
      selectedReturn.items.forEach((i) => {
        initial[i.variantId] = { qtyReceived: i.quantity, sealIntact: true };
      });
      setReceiveItemsState(initial);
    }

    if (selectedReturn && (isReviewOpen || isReceiveOpen || isRefundOpen)) {
      fetchAudits(selectedReturn.id);

      // Default refund method based on origin
      if (isRefundOpen) {
        if (selectedReturn.origin === "ONLINE") {
          setRefundMethod("bank_transfer");
        } else {
          setRefundMethod("cash");
        }
        setNote("");
        setReceiptImageUrl("");
      }
    } else {
      setAudits([]);
    }
  }, [isReceiveOpen, isReviewOpen, isRefundOpen, selectedReturn]);

  const fetchAudits = async (returnId: string) => {
    setAuditsLoading(true);
    try {
      const res = await api.get(`/returns/admin/${returnId}/audits`);
      setAudits(res.data);
    } catch (err) {
      console.error("Failed to fetch audits", err);
    } finally {
      setAuditsLoading(false);
    }
  };

  const handleReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Ảnh "${file.name}" vượt quá 5MB`);
      return;
    }

    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("images", file);
      const res = await api.post<string[]>("/reviews/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.length > 0) {
        setReceiptImageUrl(res.data[0]);
        toast.success("Tải ảnh hóa đơn thành công");
      }
    } catch {
      toast.error("Lỗi tải ảnh lên");
    } finally {
      setIsUploadingReceipt(false);
      // Reset input value to allow selecting the same file again if it was removed
      e.target.value = "";
    }
  };

  // POS Create States
  const [isPosCreateOpen, setIsPosCreateOpen] = useState(false);
  const [posSearchKey, setPosSearchKey] = useState("");
  const [posOrder, setPosOrder] = useState<StaffPosOrder | null>(null);
  const [posLoading, setPosLoading] = useState(false);
  const [posSelectedItems, setPosSelectedItems] = useState<
    Record<string, number>
  >({});
  const [posReason, setPosReason] = useState("");
  const [posSubmitting, setPosSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (filterDate) {
        const start = new Date(`${filterDate}T00:00:00`);
        const end = new Date(`${filterDate}T23:59:59`);
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const resp = await returnsService.listAll(0, 50, undefined, undefined, startDate, endDate);
      setData(resp as any);
    } catch (err: any) {
      toast.error("Lỗi tải danh sách trả hàng", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate]);

  const filteredData = useMemo(() => {
    if (!isAdmin) {
      return data.data.filter((req) => req.origin === "POS");
    }
    if (activeTab === "online") {
      return data.data.filter((req) => req.origin !== "POS");
    }
    if (activeTab === "pos") {
      return data.data.filter((req) => req.origin === "POS");
    }
    return data.data; // "all"
  }, [data.data, activeTab, isAdmin]);

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedReturn) return;
    try {
      await returnsService.reviewReturn(selectedReturn.id, { action, note });
      toast.success(
        action === "approve" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
      );
      setIsReviewOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi duyệt yêu cầu", {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleReceive = async () => {
    if (!selectedReturn) return;
    try {
      const items = selectedReturn.items.map((i) => ({
        variantId: i.variantId,
        qtyReceived: receiveItemsState[i.variantId]?.qtyReceived ?? i.quantity,
        sealIntact: receiveItemsState[i.variantId]?.sealIntact ?? true,
      }));
      await returnsService.receiveReturn(selectedReturn.id, {
        items,
        note,
        receivedLocation: selectedReturn.origin === "POS" ? "POS" : "WAREHOUSE",
      });
      toast.success("Đã xác nhận thao tác nhận hàng");
      setIsReceiveOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi nhận hàng", {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleAutoCalc = async () => {
    if (!selectedReturn) return;
    setCalculatingRefund(true);
    try {
      const res = await returnsService.getSuggestedRefund(selectedReturn.id);
      setSelectedReturn((prev) =>
        prev ? { ...prev, refundAmount: res.suggestedAmount } : null,
      );
      toast.success("Đã tính toán số tiền hoàn dựa trên thực nhận");
    } catch (err: any) {
      toast.error("Lỗi tính toán số tiền", { description: err.message });
    } finally {
      setCalculatingRefund(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedReturn) return;
    try {
      const idempotencyKey = crypto.randomUUID();
      await returnsService.triggerRefund(
        selectedReturn.id,
        {
          method: refundMethod,
          transactionId: undefined,
          note,
          receiptImage: receiptImageUrl,
        },
        idempotencyKey,
      );
      toast.success(`Đã xác nhận hoàn tiền và gửi thông báo cho khách hàng`);
      setIsRefundOpen(false);
      setReceiptImageUrl("");
      loadData();
    } catch (err: any) {
      toast.error("Lỗi hoàn tiền", {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handlePosOrderSearch = async () => {
    const key = posSearchKey.trim();
    if (!key) return;
    setPosLoading(true);
    setPosOrder(null);
    setPosSelectedItems({});
    try {
      const order = await staffOrdersService.getByCode(key);

      const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);

      if (orderDate !== today) {
        toast.error("Ràng buộc: Chỉ có thể đổi trả đơn hàng trong ngày.", {
          description: `Đơn hàng này được tạo vào ngày ${new Date(order.createdAt).toLocaleDateString("vi-VN")}.`,
        });
        return;
      }

      setPosOrder(order);
    } catch (err: any) {
      toast.error("Không tìm thấy đơn hàng", {
        description: err?.response?.data?.message || "Kiểm tra lại mã đơn POS.",
      });
    } finally {
      setPosLoading(false);
    }
  };

  const handlePosSubmit = async () => {
    if (!posOrder) return;
    const itemsPayload = Object.entries(posSelectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }));

    if (itemsPayload.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để trả");
      return;
    }

    setPosSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await returnsService.posCreateReturn(
        {
          orderId: posOrder.id,
          items: itemsPayload,
          reason: posReason,
          origin: "POS",
        },
        idempotencyKey,
      );
      toast.success("Tạo yêu cầu hoàn trả POS thành công!");
      setIsPosCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi tạo hoàn trả", {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setPosSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await returnsService.adminCancelReturn(
        id,
        "Hủy yêu cầu bởi nhân viên/cửa hàng",
      );
      toast.success("Hủy yêu cầu thành công");
      loadData();
    } catch (err: any) {
      toast.error("Lỗi hủy yêu cầu", {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const counts = useMemo(() => {
    const online = data.data.filter((req) => req.origin !== "POS").length;
    const pos = data.data.filter((req) => req.origin === "POS").length;
    return { all: data.data.length, online, pos };
  }, [data.data]);

  const overviewStats = useMemo(() => {
    const newRequests = data.data.filter((req) =>
      ["REQUESTED", "REVIEWING", "AWAITING_CUSTOMER"].includes(req.status),
    ).length;
    const inHandling = data.data.filter((req) =>
      ["APPROVED", "RETURNING", "RECEIVED", "REFUNDING", "REFUND_FAILED"].includes(req.status),
    ).length;
    const resolved = data.data.filter((req) =>
      ["COMPLETED", "REJECTED", "REJECTED_AFTER_RETURN", "CANCELLED"].includes(req.status),
    ).length;

    return { newRequests, inHandling, resolved };
  }, [data.data]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,242,233,0.9))] p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] lg:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="flex min-h-[108px] flex-col justify-between rounded-[1.4rem] border border-black/6 bg-white/75 px-5 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
              {t("status.REQUESTED")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {overviewStats.newRequests}
            </p>
          </div>
          <div className="flex min-h-[108px] flex-col justify-between rounded-[1.4rem] border border-black/6 bg-white/75 px-5 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
              {t("status.REVIEWING")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {overviewStats.inHandling}
            </p>
          </div>
          <div className="flex min-h-[108px] flex-col justify-between rounded-[1.4rem] border border-gold/20 bg-gold/10 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80">
              {t("status.COMPLETED")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-gold">
              {overviewStats.resolved}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 rounded-[1.75rem] border border-black/6 bg-card px-4 py-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.2)] dark:border-white/10 sm:px-5 md:ml-auto md:w-fit md:grid-cols-[auto_auto_auto] md:justify-end">
        <Button
          variant="outline"
          className="h-11 rounded-full border-gold/20 bg-white/70 px-5 text-sm font-semibold shadow-sm transition-all hover:border-gold hover:bg-gold/10 dark:bg-white/5"
          onClick={loadData}
        >
          <RefreshCcw className="w-4 h-4 mr-2 text-gold" /> {t("buttons.refresh")}
        </Button>
        <div className="relative group">
          <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/60 transition-colors group-focus-within:text-gold" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-11 w-full rounded-full border border-gold/20 bg-white/70 pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:ring-1 focus:ring-gold/30 dark:bg-white/5 md:w-48"
          />
        </div>
        {!isAdmin && (
          <Button
            className="h-11 rounded-full bg-gold px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-gold/20 hover:bg-gold/90"
            onClick={() => {
              setIsPosCreateOpen(true);
              setPosOrder(null);
              setPosSearchKey("");
              setPosReason("");
              setPosSelectedItems({});
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> {t("buttons.create_pos")}
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        {isAdmin && (
          <TabsList className="mx-auto !grid !h-auto !w-full max-w-[640px] grid-cols-3 items-stretch rounded-full border border-black/6 bg-card p-1.5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.24)] dark:border-white/10 md:mx-0">
            <TabsTrigger
              value="all"
              className="!flex !h-11 !w-full min-w-0 items-center justify-center gap-2 rounded-full px-3 text-center text-xs font-semibold whitespace-nowrap data-[state=active]:bg-gold/12 data-[state=active]:text-gold data-[state=active]:shadow-[0_14px_28px_-22px_rgba(197,160,89,0.95)] sm:text-sm"
            >
              <Box className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              {t("tabs.all")}
              <Badge
                variant="secondary"
                className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-background/60 px-1.5 text-[9px] sm:text-[10px]"
              >
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="online"
              className="!flex !h-11 !w-full min-w-0 items-center justify-center gap-2 rounded-full px-3 text-center text-xs font-semibold whitespace-nowrap data-[state=active]:bg-cyan-500/14 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_14px_28px_-22px_rgba(34,211,238,0.8)] sm:text-sm"
            >
              <Globe className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              {t("tabs.online")}
              <Badge
                variant="secondary"
                className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-background/60 px-1.5 text-[9px] sm:text-[10px]"
              >
                {counts.online}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="pos"
              className="!flex !h-11 !w-full min-w-0 items-center justify-center gap-2 rounded-full px-3 text-center text-xs font-semibold whitespace-nowrap data-[state=active]:bg-rose-500/14 data-[state=active]:text-rose-400 data-[state=active]:shadow-[0_14px_28px_-22px_rgba(244,63,94,0.7)] sm:text-sm"
            >
              <Store className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              {t("tabs.pos")}
              <Badge
                variant="secondary"
                className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-background/60 px-1.5 text-[9px] sm:text-[10px]"
              >
                {counts.pos}
              </Badge>
            </TabsTrigger>
          </TabsList>
        )}

        <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-card shadow-[0_28px_90px_-54px_rgba(15,23,42,0.32)] dark:border-white/10">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-black/6 bg-[linear-gradient(135deg,rgba(197,160,89,0.08),rgba(197,160,89,0.02))] hover:bg-transparent dark:border-white/10">
                  <TableHead className="w-[120px]">{t("table.source")}</TableHead>
                  <TableHead className="w-[140px]">{t("table.id")}</TableHead>
                  <TableHead className="w-[140px]">{t("table.order_id")}</TableHead>
                  <TableHead className="w-[120px]">{t("table.date")}</TableHead>
                  <TableHead>{t("table.reason")}</TableHead>
                  {isAdmin && <TableHead className="w-[180px]">{t("table.shipping")}</TableHead>}
                  <TableHead className="w-[180px]">{t("table.status")}</TableHead>
                  <TableHead className="text-right w-[160px]">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <RefreshCcw className="w-8 h-8 animate-spin text-gold/50" />
                        <p className="text-muted-foreground text-sm">
                          Dang dong bo du lieu...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Box className="w-12 h-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          Không tìm thấy yêu cầu trả hàng nào trong mục này
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((req) => (
                    <TableRow
                      key={req.id}
                      className="group cursor-pointer border-black/6 transition-colors hover:bg-gold/5 dark:border-white/5"
                      onClick={() => {
                        setSelectedReturn(req);
                        setIsReviewOpen(true);
                      }}
                    >
                      <TableCell>
                        {req.origin === "POS" ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 text-rose-400 bg-rose-500/10"
                          >
                            <Store className="w-3 h-3 mr-1" /> POS
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                          >
                            <Globe className="w-3 h-3 mr-1" /> Online
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground group-hover:text-gold transition-colors">
                        {req.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-foreground">
                        {req.orderId.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date((req as any).createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </TableCell>
                      <TableCell className="max-w-[240px] text-sm leading-7">
                        {req.reason || (
                          <span className="text-muted-foreground/50 italic">
                            {t("table.no_reason")}
                          </span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {req.shipments && req.shipments.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {req.shipments.map((s, idx) => {
                                const isAutomated = s.courier === "GHN";
                                return (
                                  <div key={idx} className="flex flex-col gap-0.5">
                                    <a
                                      href={
                                        isAutomated
                                          ? `https://ghn.vn/blogs/trang-thai-don-hang?order_code=${s.trackingNumber}`
                                          : "#"
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "text-[10px] font-mono font-bold flex items-center gap-1 px-2 py-0.5 rounded border w-fit transition-colors",
                                        isAutomated
                                          ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20"
                                          : "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Truck className="w-2.5 h-2.5" />
                                      {s.trackingNumber}
                                      {isAutomated && (
                                        <Badge className="h-3 px-1 text-[7px] bg-cyan-500 text-black border-none ml-1">
                                          GHN
                                        </Badge>
                                      )}
                                    </a>
                                    {s.receivedAt && (
                                      <span className="text-[8px] text-green-500 ml-1 uppercase font-medium">
                                        • {t("status.RECEIVED")}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50 italic">
                              {t("table.no_shipment")}
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(req.status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]`}
                        >
                          {getStatusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReturn(req);
                              setIsReviewOpen(true);
                            }}
                          >
                            <Search className="w-3.5 h-3.5 mr-1" /> {t("table.actions")}
                          </Button>
                        )}

                        {/* ADMIN ONLY ACTIONS */}
                        {isAdmin &&
                          [
                            "REQUESTED",
                            "REVIEWING",
                            "AWAITING_CUSTOMER",
                          ].includes(req.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 glass border-gold/30 hover:bg-gold hover:text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReturn(req);
                                setNote("");
                                setIsReviewOpen(true);
                              }}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> {t("dialogs.btn_approve")}
                            </Button>
                          )}

                        {/* CANCEL ACTION (FOR UNAPPROVED REQUESTS - STAFF ONLY) */}
                        {!isAdmin &&
                          ["REQUESTED", "REVIEWING"].includes(req.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-500/80 hover:text-red-500 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    t("toasts.confirm_cancel"),
                                  )
                                ) {
                                  handleCancel(req.id);
                                }
                              }}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> {t("dialogs.btn_cancel")}
                            </Button>
                          )}

                        {/* GENERAL ACTIONS (HIDE RECEIVE FOR ADMIN IF POS) */}
                        {["RETURNING", "APPROVED"].includes(req.status) &&
                          !(isAdmin && req.origin === "POS") && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReturn(req);
                                setNote("");
                                setIsReceiveOpen(true);
                              }}
                              className="h-8 bg-teal-600/90 hover:bg-teal-500 text-white shadow-md shadow-teal-900/20"
                            >
                              <Box className="w-3.5 h-3.5 mr-1" />{" "}
                              {req.origin === "POS" ? "Nhận quầy" : "Nhận kho"}
                            </Button>
                          )}

                        {/* HIDE REFUND FOR ADMIN IF POS */}
                        {["RECEIVED", "REFUND_FAILED"].includes(req.status) &&
                          !(isAdmin && req.origin === "POS") && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReturn(req);
                                setNote("");
                                setIsRefundOpen(true);
                              }}
                              className="h-8 bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/20"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Hoàn tiền

                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCcw className="w-8 h-8 animate-spin text-gold/50" />
                <p className="text-muted-foreground text-sm font-medium tracking-wide">
                  Đang đồng bộ dữ liệu...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Box className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm text-center">
                  Không tìm thấy yêu cầu trả hàng nào trong mục này
                </p>
              </div>
            ) : (
              filteredData.map((req) => (
                <div
                  key={req.id}
                  className="bg-background/40 border border-gold/10 rounded-2xl p-5 space-y-4 relative group hover:border-gold/30 transition-all active:scale-[0.98]"
                  onClick={() => {
                    setSelectedReturn(req);
                    setIsReviewOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gold">#{req.id.substring(0, 8).toUpperCase()}</span>
                        {req.origin === "POS" ? (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10 text-[9px] h-4">
                            POS
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[9px] h-4">
                            Online
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Đơn hàng: <span className="text-foreground">{req.orderId.substring(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(req.status)} text-[9px] px-2 py-0.5 uppercase font-bold`}
                    >
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 border-y border-gold/5 py-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground uppercase font-bold tracking-tight">Ngày yêu cầu:</span>
                      <span className="text-foreground font-medium">
                        {new Date((req as any).createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight block">Lý do:</span>
                      <p className="text-[11px] text-foreground/80 bg-muted/40 p-2 rounded-lg italic">
                        {req.reason || "Không có lý do chi tiết"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 overflow-x-auto custom-scrollbar no-scrollbar">
                    {!isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[10px] text-blue-400 font-bold uppercase tracking-tight"
                      >
                        <Search className="w-3 h-3 mr-1" /> Chi tiết
                      </Button>
                    )}

                    {isAdmin && ["REQUESTED", "REVIEWING", "AWAITING_CUSTOMER"].includes(req.status) && (
                      <Button
                        size="sm"
                        className="h-8 bg-gold/10 text-gold border border-gold/20 text-[10px] font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(req);
                          setNote("");
                          setIsReviewOpen(true);
                        }}
                      >
                        <Check className="w-3 h-3 mr-1" /> {"Duyệt"}
                      </Button>
                    )}

                    {["RETURNING", "APPROVED"].includes(req.status) && !(isAdmin && req.origin === "POS") && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(req);
                          setNote("");
                          setIsReceiveOpen(true);
                        }}
                        className="h-8 bg-teal-600 text-white text-[10px] font-bold"
                      >
                        <Box className="w-3 h-3 mr-1" /> {"Nhận kho"}
                      </Button>
                    )}

                    {["RECEIVED", "REFUND_FAILED"].includes(req.status) && !(isAdmin && req.origin === "POS") && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(req);
                          setNote("");
                          setIsRefundOpen(true);
                        }}
                        className="h-8 bg-indigo-600 text-white text-[10px] font-bold"
                      >
                        <CreditCard className="w-3 h-3 mr-1" /> Hoàn tiền
                      </Button>
                    )}

                    {!isAdmin && ["REQUESTED", "REVIEWING"].includes(req.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Bạn có chắc chắn muốn hủy yêu cầu trả hàng này?")) {
                            handleCancel(req.id);
                          }
                        }}
                        className="h-8 text-red-500/80 text-[10px] font-bold"
                      >
                        <X className="w-3 h-3 mr-1" /> Hủy
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Tabs>

      {/* Review Dialog */}
      <AnimatePresence>
        {isReviewOpen && (
          <div
            className={cn(
              "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
              "left-0 md:left-20",
              !isCollapsed && "lg:left-72"
            )}
            onClick={() => setIsReviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] pointer-events-none" />

              {/* MODAL HEADER */}
              <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20 shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading gold-gradient uppercase tracking-tighter italic leading-none mb-1">
                    Xét duyệt yêu cầu đổi trả
                  </h2>
                  <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">
                    Thẩm định tình trạng và quyết định phương án
                  </p>
                </div>
                <button
                  onClick={() => setIsReviewOpen(false)}
                  className="p-2.5 bg-secondary/10 hover:bg-white/20 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-border"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-8">
                <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Mã yêu cầu
                    </p>
                    <strong className="font-mono text-foreground text-lg">
                      {selectedReturn?.id.substring(0, 8)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {t("dialogs.order_id")}
                    </p>
                    <strong className="font-mono text-foreground text-lg">
                      {selectedReturn?.orderId.substring(0, 8)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {t("dialogs.source")}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        selectedReturn?.origin === "POS"
                          ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                          : "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                      }
                    >
                      {selectedReturn?.origin === "POS" ? "POS" : "Online"}
                    </Badge>
                  </div>
                </div>

                {/* Refund Total Info */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-gold/5 p-3 rounded-lg border border-gold/10">
                  <span className="text-gold font-medium">{t("dialogs.reason_general")}</span>
                  <span>{selectedReturn?.reason || t("dialogs.no_reason_general")}</span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                    {t("dialogs.product_details")}
                  </h3>
                  <div className="space-y-4">
                    {selectedReturn?.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-muted/20 border border-border/50 rounded-xl p-4 transition-all hover:border-gold/20"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {item.variant?.product?.images?.[0]?.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.variant.product.images[0].url}
                                alt="Product"
                                className="w-12 h-12 object-cover rounded-md border border-border/50"
                              />
                            )}
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">
                                {item.variant?.product?.name ||
                                  "Sản phẩm không xác định"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Variant:{" "}
                                <span className="font-mono text-gold/80">
                                  {item.variantId.substring(0, 8).toUpperCase()}
                                </span>
                                {item.variant?.volume &&
                                  ` • ${item.variant.volume}`}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-foreground text-background font-mono text-sm px-3">
                            SL: {item.quantity}
                          </Badge>
                        </div>

                        {/* Evidence display */}
                        {item.images && item.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2">
                              {t("dialogs.evidence", { count: item.images.length })}
                            </p>
                            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                              {item.images.map((url, iIndex) => {
                                const isVideo =
                                  url.match(/\.(mp4|webm|mov)$/i) ||
                                  url.includes(
                                    "res.cloudinary.com/perfume-gpt/video",
                                  ) ||
                                  url.includes("returns/videos");
                                return (
                                  <div
                                    key={iIndex}
                                    className="relative flex-none w-32 h-32 rounded-lg border border-border/50 overflow-hidden bg-secondary/40 group"
                                  >
                                    {isVideo ? (
                                      <video
                                        src={url}
                                        controls
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={url}
                                        alt={item.variant?.product?.name || "Product image"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider">
                    <RotateCcw className="w-3 h-3 text-gold" /> {t("dialogs.audit_log")}
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                    {auditsLoading ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-gold/50" />
                      </div>
                    ) : audits.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                        {t("dialogs.no_audit")}
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        {audits.map((a, idx) => (
                          <div
                            key={a.id}
                            className="p-3 border-b border-border/20 last:border-0 flex justify-between items-start gap-3"
                          >
                            <div className="flex-1">
                              <p
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                                  a.action.includes("FAILED")
                                    ? "text-red-500 dark:text-red-400"
                                    : "text-gold/80 dark:text-gold/90",
                                )}
                              >
                                {a.action.replace(/_/g, " ")}
                              </p>
                              {a.payload?.message && (
                                <p className="text-[9px] text-muted-foreground italic">
                                  {a.payload.message}
                                </p>
                              )}
                              {a.payload?.orderCode && (
                                <p className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                                  Vận đơn: {a.payload.orderCode}
                                </p>
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {new Date(a.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      {t("dialogs.note_label", {
                        target: selectedReturn?.origin === "POS" ? "nhân viên" : "khách"
                      })}
                    </label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={
                        selectedReturn?.origin === "POS"
                          ? t("dialogs.note_placeholder_staff")
                          : t("dialogs.note_placeholder_customer")
                      }
                      className="bg-muted/30 border-gold/20 h-11 focus-visible:ring-gold/30"
                    />
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="px-8 py-6 md:px-12 md:py-8 border-t border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                {isAdmin ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleReview("reject")}
                      className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" /> {t("dialogs.btn_reject")}
                    </Button>
                    <Button
                      onClick={() => handleReview("approve")}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                    >
                      <Check className="w-4 h-4" /> {t("dialogs.btn_approve")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Đóng</Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receive Dialog */}
      <AnimatePresence>
        {isReceiveOpen && (
          <div
            className={cn(
              "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
              "left-0 md:left-20",
              !isCollapsed && "lg:left-72"
            )}
            onClick={() => setIsReceiveOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[120px] pointer-events-none" />

              {/* MODAL HEADER */}
              <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20 shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading text-teal-600 dark:text-teal-400 uppercase tracking-tighter italic leading-none mb-1">
                    {t("dialogs.receive_title")}
                  </h2>
                  <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">
                    Nhập kho và kiểm tra tình trạng niêm phong
                  </p>
                </div>
                <button
                  onClick={() => setIsReceiveOpen(false)}
                  className="p-2.5 bg-secondary/10 hover:bg-white/20 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-border"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-8">
                <div className="bg-teal-500/10 dark:bg-teal-500/5 p-4 rounded-xl border border-teal-500/20">
                  <p className="text-sm text-teal-700 dark:text-teal-200/80 leading-relaxed">
                    {t("dialogs.receive_desc", {
                      target: selectedReturn?.origin === "POS"
                        ? "tại quầy (POS)"
                        : "cho cửa hàng chính"
                    })}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("dialogs.receive_condition")}
                  </label>
                  {selectedReturn?.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.variant?.product?.name || "Sản phẩm"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.variant?.name} • Đã mua: {item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground mb-2">{t("dialogs.actual_receive")}</span>
                          <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                            <button
                              onClick={() => {
                                const current = receiveItemsState[item.variantId]?.qtyReceived ?? item.quantity;
                                setReceiveItemsState(prev => ({
                                  ...prev,
                                  [item.variantId]: { ...prev[item.variantId], qtyReceived: Math.max(0, current - 1) }
                                }));
                              }}
                              className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-xs font-bold">
                              {receiveItemsState[item.variantId]?.qtyReceived ?? item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const current = receiveItemsState[item.variantId]?.qtyReceived ?? item.quantity;
                                setReceiveItemsState(prev => ({
                                  ...prev,
                                  [item.variantId]: { ...prev[item.variantId], qtyReceived: Math.min(item.quantity, current + 1) }
                                }));
                              }}
                              className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground mb-2">{t("dialogs.seal_intact")}</span>
                          <Switch
                            checked={receiveItemsState[item.variantId]?.sealIntact ?? true}
                            onCheckedChange={(checked: boolean) => {
                              setReceiveItemsState(prev => ({
                                ...prev,
                                [item.variantId]: { ...prev[item.variantId], sealIntact: checked }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("dialogs.note_label_receive")}
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("dialogs.note_placeholder_receive")}
                    className="bg-muted/30 border-teal-500/20 h-11 focus-visible:ring-teal-500/30"
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-8 py-6 md:px-12 md:py-8 border-t border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>{t("dialogs.btn_cancel")}</Button>
                <Button
                  onClick={handleReceive}
                  className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20 px-8"
                >
                  {t("dialogs.btn_receive")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refund Dialog */}
      <AnimatePresence>
        {isRefundOpen && (
          <div
            className={cn(
              "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
              "left-0 md:left-20",
              !isCollapsed && "lg:left-72"
            )}
            onClick={() => setIsRefundOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] pointer-events-none" />

              {/* MODAL HEADER */}
              <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20 shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic leading-none mb-1">
                    {t("dialogs.refund_title")}
                  </h2>
                  <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">
                    Thanh toán và kết thúc quy trình trả hàng
                  </p>
                </div>
                <button
                  onClick={() => setIsRefundOpen(false)}
                  className="p-2.5 bg-secondary/10 hover:bg-white/20 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-border"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-500/10 dark:bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
                    <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">{t("dialogs.refund_suggest")}</p>
                    <p className="text-xl font-mono font-bold text-foreground">
                      {formatVND(selectedReturn?.refundAmount || 0)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-[9px] text-indigo-400 hover:text-indigo-300 p-0"
                      onClick={handleAutoCalc}
                      disabled={calculatingRefund}
                    >
                      <RefreshCcw className={cn("w-3 h-3 mr-1", calculatingRefund && "animate-spin")} /> {t("dialogs.refund_calc_btn")}
                    </Button>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{t("dialogs.refund_method")}</p>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="bg-transparent border-none text-sm font-semibold outline-none w-full"
                    >
                      <option value="cash">{t("dialogs.cash")}</option>
                      <option value="bank_transfer">{t("dialogs.bank_transfer")}</option>
                      <option value="gateway">Cổng thanh toán</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("dialogs.refund_receipt")}
                  </label>
                  <div className="relative group min-h-[160px] rounded-2xl border-2 border-dashed border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center p-6 transition-all hover:border-indigo-500/40">
                    {receiptImageUrl ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={receiptImageUrl} alt="Receipt" className="w-full h-40 object-contain rounded-lg" />
                        <button
                          onClick={() => setReceiptImageUrl("")}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-indigo-400/50 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-medium text-muted-foreground text-center">
                          {isUploadingReceipt ? t("pos.loading") : t("dialogs.refund_receipt")}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("dialogs.refund_note")}
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("dialogs.refund_note")}
                    className="bg-muted/30 border-indigo-500/20 h-11 focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-8 py-6 md:px-12 md:py-8 border-t border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setIsRefundOpen(false)}>{t("dialogs.btn_cancel")}</Button>
                <Button
                  onClick={handleRefund}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 px-8"
                >
                  {t("dialogs.btn_refund")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POS Create Dialog */}
      <AnimatePresence>
        {isPosCreateOpen && (
          <div
            className={cn(
              "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
              "left-0 md:left-20",
              !isCollapsed && "lg:left-72"
            )}
            onClick={() => setIsPosCreateOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] pointer-events-none" />

              {/* MODAL HEADER */}
              <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20 shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-heading gold-gradient uppercase tracking-tighter italic leading-none mb-1">
                    {t("pos.title")}
                  </h2>
                  <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">
                    {t("toasts.pos_search_error_today")}
                  </p>
                </div>
                <button
                  onClick={() => setIsPosCreateOpen(false)}
                  className="p-2.5 bg-secondary/10 hover:bg-white/20 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-border"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-8">
                {/* Search Box */}
                <div className="relative group">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" />
                  <Input
                    placeholder={t("pos.search_placeholder")}
                    value={posSearchKey}
                    onChange={(e) => setPosSearchKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePosOrderSearch()}
                    className="w-full bg-black/40 border-gold/20 h-14 pl-12 pr-28 text-lg rounded-xl focus-visible:ring-gold/30"
                    autoFocus
                  />
                  <Button
                    onClick={handlePosOrderSearch}
                    disabled={posLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-24 bg-gold/10 text-gold hover:bg-gold hover:text-black border border-gold/20 rounded-lg"
                  >
                    {posLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("pos.verify_btn")
                    )}
                  </Button>
                </div>

                {posOrder ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gold/5 p-5 rounded-2xl border border-gold/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gold font-bold mb-1">
                            {t("pos.order_info")}
                          </p>
                          <p className="font-mono text-xl text-foreground font-bold">
                            {posOrder.code || posOrder.id.substring(0, 8)}
                          </p>
                        </div>
                        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 px-3 py-1">
                          {posOrder.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm mt-3 text-muted-foreground">
                        <User className="w-4 h-4 mr-2" />
                        {t("pos.customer_label")}{" "}
                        <strong className="text-foreground ml-1">
                          {posOrder.user?.fullName ||
                            posOrder.user?.email ||
                            t("pos.guest")}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Box className="w-3 h-3" /> {t("pos.select_items")}
                      </h3>
                      <div className="grid gap-3">
                        {posOrder.items.map((item) => {
                          const quantity = posSelectedItems[item.variantId] || 0;
                          const isSelected = quantity > 0;

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                isSelected
                                  ? "bg-gold/10 border-gold/50 shadow-inner"
                                  : "bg-muted/10 border-border/50 hover:bg-muted/20"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-white">
                                  {item.product?.images?.[0]?.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.product.images[0].url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                      <Box size={20} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm line-clamp-1">
                                    {item.product?.name ?? "..."}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {item.variant?.name} • {formatVND(item.unitPrice)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-background border border-gold/20 rounded-lg p-1">
                                  <button
                                    className="w-6 h-6 flex items-center justify-center hover:bg-gold/10 rounded"
                                    onClick={() => {
                                      setPosSelectedItems((prev) => ({
                                        ...prev,
                                        [item.variantId]: Math.max(0, quantity - 1),
                                      }));
                                    }}
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">
                                    {quantity}
                                  </span>
                                  <button
                                    className="w-6 h-6 flex items-center justify-center hover:bg-gold/10 rounded"
                                    onClick={() => {
                                      setPosSelectedItems((prev) => ({
                                        ...prev,
                                        [item.variantId]: Math.min(
                                          item.quantity,
                                          quantity + 1,
                                        ),
                                      }));
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {t("pos.reason_label")}
                      </label>
                      <Input
                        placeholder={t("pos.reason_placeholder")}
                        value={posReason}
                        onChange={(e) => setPosReason(e.target.value)}
                        className="bg-muted/30 border-gold/20 h-11 focus-visible:ring-gold/30"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-gold/5 flex items-center justify-center border border-gold/10">
                      <Barcode className="w-8 h-8 text-gold/40" />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                      {t("pos.search_placeholder")}
                    </p>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="px-8 py-6 md:px-12 md:py-8 border-t border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setIsPosCreateOpen(false)}>{t("pos.btn_cancel")}</Button>
                <Button
                  onClick={handlePosSubmit}
                  disabled={!posOrder || posSubmitting}
                  className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg shadow-gold/20 px-8"
                >
                  {posSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("pos.submitting")}
                    </>
                  ) : (
                    t("pos.btn_submit")
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

