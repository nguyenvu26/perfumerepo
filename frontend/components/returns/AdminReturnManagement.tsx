"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
} from "lucide-react";
import api from "@/lib/axios";
import {
  staffOrdersService,
  StaffPosOrder,
} from "@/services/staff-orders.service";
import { cn } from "@/lib/utils";

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

const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getStatusLabel = (status: ReturnStatus) => {
  const map: Record<string, string> = {
    REQUESTED: "Yêu cầu mới",
    AWAITING_CUSTOMER: "Chờ phản hồi khách",
    REVIEWING: "Đang xem xét",
    APPROVED: "Đã duyệt, đợi trả hàng",
    RETURNING: "Đang gửi hàng về",
    RECEIVED: "Đã nhận hàng",
    REFUNDING: "Đang hoàn tiền",
    REFUND_FAILED: "Hoàn tiền thất bại",
    COMPLETED: "Hoàn tất",
    REJECTED: "Đã từ chối",
    REJECTED_AFTER_RETURN: "Từ chối sau khi nhận",
    CANCELLED: "Đã huỷ",
  };
  return map[status] || status;
};

export const AdminReturnManagement = ({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) => {
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

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-0">
            <Button
              variant="outline"
              className="glass border-gold/20 h-10 text-[10px] sm:text-xs"
              onClick={loadData}
            >
              <RefreshCcw className="w-4 h-4 mr-2 text-gold" /> Làm mới
            </Button>
            <div className="relative group flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/60 w-3.5 h-3.5 pointer-events-none group-focus-within:text-gold transition-colors" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-9 w-full sm:w-40 glass border border-gold/20 text-[11px] font-medium h-10 focus:ring-1 focus:ring-gold/30 transition-all cursor-pointer invert dark:invert-0 bg-transparent rounded-md outline-none"
              />
            </div>
            {!isAdmin && (
              <Button
                className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg shadow-gold/20 h-10 text-[10px] sm:text-xs flex-1 sm:flex-none"
                onClick={() => {
                  setIsPosCreateOpen(true);
                  setPosOrder(null);
                  setPosSearchKey("");
                  setPosReason("");
                  setPosSelectedItems({});
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Tạo hoàn trả POS
              </Button>
            )}
          </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        {isAdmin && (
          <TabsList className="bg-background/40 glass border border-gold/10 p-1 w-full max-w-[450px] mx-auto md:mx-0 grid grid-cols-3">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-[10px] sm:text-xs"
            >
              <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Tất cả
              <Badge
                variant="secondary"
                className="ml-1 sm:ml-2 bg-background/50 text-[9px] sm:text-[10px] py-0 px-1"
              >
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="online"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-[10px] sm:text-xs"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Online
              <Badge
                variant="secondary"
                className="ml-1 sm:ml-2 bg-background/50 text-[9px] sm:text-[10px] py-0 px-1"
              >
                {counts.online}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="pos"
              className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 text-[10px] sm:text-xs"
            >
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Tại Quầy
              <Badge
                variant="secondary"
                className="ml-1 sm:ml-2 bg-background/50 text-[9px] sm:text-[10px] py-0 px-1"
              >
                {counts.pos}
              </Badge>
            </TabsTrigger>
          </TabsList>
        )}

        <div className="glass border-gold/20 shadow-2xl overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/10 hover:bg-transparent bg-background/20 font-medium">
                  <TableHead className="w-[120px]">Nguồn</TableHead>
                  <TableHead className="w-[140px]">Mã Yêu Cầu</TableHead>
                  <TableHead className="w-[140px]">Mã Đơn</TableHead>
                  <TableHead className="w-[120px]">Ngày tạo</TableHead>
                  <TableHead>Lý do</TableHead>
                  {isAdmin && <TableHead className="w-[180px]">Vận chuyển</TableHead>}
                  <TableHead className="w-[180px]">Trạng thái</TableHead>
                  <TableHead className="text-right w-[160px]">
                    Hành động
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
                          Đang đồng bộ dữ liệu...
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
                      className="border-gold/5 hover:bg-gold/5 transition-colors group cursor-pointer"
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
                      <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-gold transition-colors">
                        {req.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold">
                        {req.orderId.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date((req as any).createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {req.reason || (
                          <span className="text-muted-foreground/50 italic">
                            Không có lý do
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
                                        • Đã nhận
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 italic">
                              Chưa có vận đơn
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(req.status)} text-[10px] px-2 py-0.5 tracking-wide uppercase font-bold`}
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
                            <Search className="w-3.5 h-3.5 mr-1" /> Chi tiết
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
                              <Check className="w-3.5 h-3.5 mr-1" /> Duyệt
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
                                    "Bạn có chắc chắn muốn hủy yêu cầu trả hàng này?",
                                  )
                                ) {
                                  handleCancel(req.id);
                                }
                              }}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Hủy
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
                              {req.origin === "POS" ? "Nhận Quầy" : "Nhận Kho"}
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
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Hoàn
                              tiền
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
                      <p className="text-[11px] text-foreground/80 bg-white/5 p-2 rounded-lg italic">
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
                        <Check className="w-3 h-3 mr-1" /> Duyệt
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
                        <Box className="w-3 h-3 mr-1" /> Nhận
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
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="glass border-gold/30 w-full sm:max-w-3xl h-[100vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-4 bg-background/80 backdrop-blur-md shrink-0">
            <DialogTitle className="text-xl text-gold pb-1 border-b border-gold/10 inline-block font-heading">
              Xét duyệt Yêu cầu Đổi Trả
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-6">
            <div className="bg-background/40 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Mã Yêu Cầu
                </p>
                <strong className="font-mono text-foreground text-lg">
                  {selectedReturn?.id.substring(0, 8)}
                </strong>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Mã Đơn Hàng
                </p>
                <strong className="font-mono text-foreground text-lg">
                  {selectedReturn?.orderId.substring(0, 8)}
                </strong>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Nguồn
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
              <span className="text-gold font-medium">Lý do chung:</span>
              <span>{selectedReturn?.reason || "Không có lý do chung"}</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                Chi tiết sản phẩm cần trả
              </h3>
              <div className="space-y-4">
                {selectedReturn?.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-background/30 border border-border/50 rounded-xl p-4 transition-all hover:border-gold/20"
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
                          Bằng chứng đổi trả ({item.images.length} tệp):
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
                                className="relative flex-none w-32 h-32 rounded-lg border border-border/50 overflow-hidden bg-black/40 group"
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
                <RotateCcw className="w-3 h-3 text-gold" /> Nhật ký xử lý
              </h3>
              <div className="bg-black/20 rounded-xl border border-border/50 overflow-hidden">
                {auditsLoading ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-gold/50" />
                  </div>
                ) : audits.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                    Chưa có nhật ký hoạt động
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto custom-scrollbar">
                    {audits.map((a, idx) => (
                      <div
                        key={a.id}
                        className="p-3 border-b border-border/30 last:border-0 flex justify-between items-start gap-3"
                      >
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                              a.action.includes("FAILED")
                                ? "text-red-400"
                                : "text-gold/80",
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
                            <p className="text-[9px] text-cyan-400 font-mono mt-0.5">
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
                  Ghi chú hoặc Phản hồi cho{" "}
                  {selectedReturn?.origin === "POS" ? "Staff" : "khách"} (nếu từ
                  chối)
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    selectedReturn?.origin === "POS"
                      ? "Nhập ghi chú hoặc lý do chi tiết để phản hồi lại cho nhân viên tại quầy..."
                      : "Nhập ghi chú hoặc lý do chi tiết để thông báo lại khách hàng..."
                  }
                  className="bg-background/50 border-gold/20 h-11 focus-visible:ring-gold/30"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 sm:gap-0 px-6 py-4 border-t border-border/50 bg-background/80 backdrop-blur-md">
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReview("reject")}
                  className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" /> Bác bỏ Yêu cầu
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                >
                  <Check className="w-4 h-4" /> Chấp nhận & Cho phép Gửi Hàng
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Đóng</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="glass border-gold/30 w-full sm:max-w-md h-[100vh] sm:h-auto shadow-2xl sm:rounded-2xl flex flex-col p-0 overflow-hidden">
          <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-xl text-teal-400 font-semibold font-heading">
              Xác nhận Nhận Hàng
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-500/20">
              <p className="text-sm text-teal-200/80 leading-relaxed">
                Hệ thống sẽ cập nhật kho{" "}
                {selectedReturn?.origin === "POS"
                  ? "tại quầy (POS)"
                  : "cho cửa hàng chính"}{" "}
                và đánh dấu quy trình hoàn trả hàng bước vào giai đoạn hoàn
                tiền. Nếu hàng bị bóc seal, yêu cầu sẽ tự động bị TỪ CHỐI (Không
                hoàn tiền).
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Tình trạng Sản phẩm Nhận về
              </label>
              {selectedReturn?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-3 rounded-xl border border-border/50 gap-3"
                >
                  <div className="flex items-center gap-3">
                    {item.variant?.product?.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.variant?.product?.images?.[0]?.url}
                        alt="Product"
                        className="w-10 h-10 object-cover rounded-md border border-border/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md border border-border/50 bg-white/5 flex items-center justify-center">
                        <Box className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {item.variant?.product?.name ||
                          `Mẫu #${item.variantId.slice(-6).toUpperCase()}`}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {item.variant?.volume && `${item.variant.volume} • `}SL
                        Yêu cầu: {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2 bg-background/50 px-2 py-1.5 rounded-lg border border-border">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold">
                        Thực nhận:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={
                          receiveItemsState[item.variantId]?.qtyReceived ??
                          item.quantity
                        }
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setReceiveItemsState((prev) => ({
                            ...prev,
                            [item.variantId]: {
                              ...prev[item.variantId],
                              qtyReceived: Math.min(
                                item.quantity,
                                Math.max(0, v),
                              ),
                            },
                          }));
                        }}
                        className="bg-transparent border-none text-sm w-10 text-center text-gold font-bold focus:ring-0 p-0"
                      />
                    </div>

                    <div
                      className="flex items-center space-x-2 bg-background/50 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        setReceiveItemsState((prev) => ({
                          ...prev,
                          [item.variantId]: {
                            ...prev[item.variantId],
                            sealIntact: !(
                              prev[item.variantId]?.sealIntact ?? true
                            ),
                          },
                        }));
                      }}
                    >
                      <Checkbox
                        checked={
                          receiveItemsState[item.variantId]?.sealIntact ?? true
                        }
                        onCheckedChange={(checked) => {
                          setReceiveItemsState((prev) => ({
                            ...prev,
                            [item.variantId]: {
                              ...prev[item.variantId],
                              sealIntact: checked === true,
                            },
                          }));
                        }}
                      />
                      <span
                        className={`text-sm font-semibold ${receiveItemsState[item.variantId]?.sealIntact !== false ? "text-teal-400" : "text-red-400"}`}
                      >
                        {receiveItemsState[item.variantId]?.sealIntact !== false
                          ? "Nguyên seal"
                          : "Lỗi/Hư"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Ghi chú tình trạng hàng nhập kho
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đã kiểm tra nguyên seal..."
                className="bg-background/50 border-gold/20 h-11"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-background/80 flex flex-row justify-end gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setIsReceiveOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleReceive}
              className="bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-900/30 font-bold uppercase tracking-widest text-[10px]"
            >
              <Box className="w-4 h-4 mr-2" /> Nhập Kho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="glass border-indigo-500/30 w-full sm:max-w-md h-[100vh] sm:h-auto shadow-2xl sm:rounded-2xl flex flex-col p-0 overflow-hidden">
          <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-xl text-indigo-400 font-heading">
              Xác Nhận Hoàn Đơn Hàng
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-baseline justify-between">
              <p className="text-xs text-indigo-300">
                Đơn hàng:{" "}
                <strong className="font-mono text-white">
                  {selectedReturn?.orderId.substring(0, 8)}
                </strong>
              </p>
              {selectedReturn?.origin === "ONLINE" && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-[8px] h-4">
                  Trực Tuyến
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block">
                Phương thức hoàn tiền thực tế
              </label>
              <div
                className={cn(
                  "grid gap-3",
                  selectedReturn?.origin === "ONLINE"
                    ? "grid-cols-1"
                    : "grid-cols-2",
                )}
              >
                {selectedReturn?.origin !== "ONLINE" && (
                  <button
                    onClick={() => setRefundMethod("cash")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${refundMethod === "cash"
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-900/20"
                      : "bg-black/20 border-border/50 text-muted-foreground hover:border-indigo-500/30"
                      }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-sm font-medium">Tiền mặt</span>
                  </button>
                )}
                <button
                  onClick={() => setRefundMethod("bank_transfer")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${refundMethod === "bank_transfer"
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-900/20"
                    : "bg-black/20 border-border/50 text-muted-foreground hover:border-indigo-500/30"
                    }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Chuyển khoản</span>
                </button>
              </div>
            </div>

            {/* Refund Amount Info */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl flex justify-between items-center group">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-indigo-300/70 font-bold mb-0.5">
                  Tiền hoàn trả
                </p>
                <p className="text-xl font-heading font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors leading-none">
                  {formatVND(selectedReturn?.refundAmount || 0)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAutoCalc}
                disabled={calculatingRefund}
                className="h-7 text-[9px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-500/30 border border-indigo-500/20"
              >
                {calculatingRefund ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Auto Calc"
                )}
              </Button>
            </div>

            {/* Bank Info for Chuyển khoản */}
            {refundMethod === "bank_transfer" &&
              selectedReturn?.paymentInfo && (
                <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                      Thông tin thụ hưởng
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[9px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                      onClick={() => {
                        const info = selectedReturn.paymentInfo as any;
                        const text = `STK: ${info.accountNumber}\nNH: ${info.bankName}\nTen: ${info.accountName}`;
                        navigator.clipboard.writeText(text);
                        toast.success("Đã sao chép thông tin tài khoản");
                      }}
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" /> Sao chép
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div>
                      <p className="text-[8px] text-muted-foreground uppercase font-semibold">
                        Ngân hàng
                      </p>
                      <p className="font-semibold text-foreground italic">
                        {(selectedReturn.paymentInfo as any).bankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground uppercase font-semibold">
                        Số tài khoản
                      </p>
                      <p className="font-mono font-bold text-indigo-400">
                        {(selectedReturn.paymentInfo as any).accountNumber}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[8px] text-muted-foreground uppercase font-semibold">
                        Chủ tài khoản
                      </p>
                      <p className="font-semibold text-foreground uppercase">
                        {(selectedReturn.paymentInfo as any).accountName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {refundMethod === "bank_transfer" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
                    Ảnh Hóa Đơn (Nếu có)
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    disabled={isUploadingReceipt}
                    className="bg-black/20 border-indigo-500/10 focus-visible:ring-indigo-500 file:bg-indigo-600 file:text-white file:border-0 file:py-1 file:px-2 file:mr-3 file:rounded file:text-[10px] cursor-pointer text-[10px] h-8 p-1 px-2"
                  />
                  {isUploadingReceipt && (
                    <div className="flex items-center text-xs text-indigo-400 mt-2 font-medium">
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Đang tải
                      ảnh lên...
                    </div>
                  )}
                  {receiptImageUrl && !isUploadingReceipt && (
                    <div className="mt-2 w-full max-h-40 overflow-hidden rounded-lg border border-indigo-500/30 relative group bg-black/40 flex justify-center">
                      <img
                        src={receiptImageUrl}
                        alt="Receipt Preview"
                        className="w-full max-h-40 object-contain"
                      />
                      <button
                        onClick={() => setReceiptImageUrl("")}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {refundMethod === "cash" && (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg self-start">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    Xác nhận hoàn tiền bằng <strong>tiền mặt</strong> trực tiếp
                    tại quầy. Nhân viên vui lòng kiểm tra kỹ số tiền trả cho
                    khách hàng.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Ghi chú (Tùy chọn)
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    refundMethod === "cash"
                      ? "Ví dụ: Đã trả tiền mặt cho khách..."
                      : "Ví dụ: Mã giao dịch hoặc ghi chú hoàn tiền..."
                  }
                  className="bg-background/50 border-indigo-500/20 h-11 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setIsRefundOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleRefund}
              className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30"
            >
              <CreditCard className="w-4 h-4 mr-2" /> Xác Nhận Hoàn Tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POS Create Dialog */}
      <Dialog open={isPosCreateOpen} onOpenChange={setIsPosCreateOpen}>
        <DialogContent className="glass border-gold/30 max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-[24px] p-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-border/50">
            <DialogTitle className="text-2xl text-gold pb-2 flex items-center">
              <Store className="w-6 h-6 mr-3 text-gold/70" />
              Khởi tạo Yêu cầu Đổi Trả Quầy (POS)
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pb-2">
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" />
              <Input
                placeholder="Nhập mã đơn khách mua (VD: ORD-...) hoặc Quét Barcode..."
                value={posSearchKey}
                onChange={(e) => setPosSearchKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePosOrderSearch()}
                className="w-full bg-black/40 border-gold/20 h-14 pl-12 pr-28 text-lg rounded-xl focus-visible:ring-gold/30"
                autoFocus
              />
              <Button
                onClick={handlePosOrderSearch}
                disabled={posLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-24 bg-gold/10 text-gold hover:bg-gold hover:text-black border border-gold/20"
              >
                {posLoading ? "Đang tìm..." : "Kiểm tra"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            {posLoading && (
              <div className="flex flex-col justify-center items-center h-40 space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                <p className="text-muted-foreground animate-pulse">
                  Đang truy xuất hệ thống...
                </p>
              </div>
            )}

            {posOrder && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
                <div className="bg-gradient-to-br from-gold/10 to-transparent p-5 rounded-2xl border border-gold/20 shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-1">
                        Thông tin giao dịch
                      </p>
                      <p className="font-mono text-xl text-foreground">
                        {posOrder.code || posOrder.id.substring(0, 8)}
                      </p>
                    </div>
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 px-3 py-1">
                      {posOrder.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm mt-3 text-muted-foreground bg-background/40 inline-flex px-3 py-1.5 rounded-lg border border-border/50">
                    <span className="w-2 h-2 rounded-full bg-gold mr-2" />
                    Khách:{" "}
                    <strong className="text-foreground ml-1">
                      {posOrder.user?.fullName ||
                        posOrder.user?.email ||
                        "Khách mua lẻ"}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-foreground flex items-center">
                    <Box className="w-4 h-4 mr-2 text-gold" /> Chọn sản phẩm đổi
                    trả
                  </label>
                  <div className="space-y-3">
                    {posOrder.items.map((item) => {
                      const qty = posSelectedItems[item.variantId] || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border border-border bg-background/30 rounded-xl transition-all hover:border-gold/30 group"
                        >
                          <div className="flex-1 mr-4">
                            <p className="font-medium text-foreground text-sm line-clamp-1">
                              {item.product?.name ||
                                item.variant?.product?.name ||
                                item.variant?.name ||
                                "Sản phẩm không xác định"}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Loại:{" "}
                                <span className="text-foreground/80">
                                  {item.variant.name}
                                </span>
                              </p>
                            )}
                            <Badge
                              variant="outline"
                              className="mt-2 text-[10px] bg-background"
                            >
                              SL Đã mua: {item.quantity}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-1 bg-black/40 rounded-lg p-1 border border-border/50">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-md hover:bg-gold/20 hover:text-gold"
                              onClick={() => {
                                setPosSelectedItems((prev) => ({
                                  ...prev,
                                  [item.variantId]: Math.max(0, qty - 1),
                                }));
                              }}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-medium font-mono text-gold">
                              {qty}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-md hover:bg-gold/20 hover:text-gold"
                              onClick={() => {
                                setPosSelectedItems((prev) => ({
                                  ...prev,
                                  [item.variantId]: Math.min(
                                    item.quantity,
                                    qty + 1,
                                  ),
                                }));
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-foreground">
                    Lý do nhận lại (Bắt buộc)
                  </label>
                  <Input
                    value={posReason}
                    onChange={(e) => setPosReason(e.target.value)}
                    placeholder="Ghi nhận tình trạng: Hàng bể vỡ, Bao bì móp, Khách đổi ý..."
                    className="bg-black/40 border-gold/20 h-12 rounded-xl focus-visible:ring-gold/30"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-background/80 border-t border-border/50 backdrop-blur-md">
            <Button
              variant="ghost"
              onClick={() => setIsPosCreateOpen(false)}
              className="rounded-xl h-11"
            >
              Hủy
            </Button>
            <Button
              onClick={handlePosSubmit}
              disabled={!posOrder || posSubmitting}
              className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg shadow-gold/20 rounded-xl px-8 h-11 text-base font-medium"
            >
              {posSubmitting ? "Đang đẩy yêu cầu..." : "Khởi tạo Yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
