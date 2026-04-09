"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Box, CreditCard, RotateCcw, Search } from "lucide-react";
import {
  staffOrdersService,
  StaffPosOrder,
} from "@/services/staff-orders.service";

const getStatusColor = (status: ReturnStatus) => {
  switch (status) {
    case "REQUESTED":
      return "bg-blue-500";
    case "REVIEWING":
      return "bg-purple-500";
    case "APPROVED":
      return "bg-green-500";
    case "RETURNING":
      return "bg-yellow-500";
    case "RECEIVED":
      return "bg-teal-500";
    case "COMPLETED":
      return "bg-green-700";
    case "REFUNDING":
      return "bg-indigo-500";
    case "REJECTED":
    case "REJECTED_AFTER_RETURN":
    case "CANCELLED":
    case "REFUND_FAILED":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusLabel = (status: ReturnStatus) => {
  const map: Record<string, string> = {
    REQUESTED: "Yêu cầu mới",
    AWAITING_CUSTOMER: "Chờ phản hồi khách",
    REVIEWING: "Đang xem xét",
    APPROVED: "Đã duyệt, đợi gửi hàng",
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

export const AdminReturnManagement = () => {
  const [data, setData] = useState<{ data: ReturnRequest[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [note, setNote] = useState("");

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
      const resp = await returnsService.listAll(0, 50);
      setData(resp as any);
    } catch (err: any) {
      toast.error("Lỗi tải danh sách trả hàng", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      // Simplification: Receive all items as good by default.
      // In a real flow, a form should let staff inspect each item.
      const items = selectedReturn.items.map((i) => ({
        variantId: i.variantId,
        qtyReceived: i.quantity,
        sealIntact: true,
      }));
      await returnsService.receiveReturn(selectedReturn.id, {
        items,
        note,
        receivedLocation: "POS",
      });
      toast.success("Đã xác nhận nhận hàng");
      setIsReceiveOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi nhận hàng", {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleRefund = async () => {
    if (!selectedReturn) return;
    try {
      const idempotencyKey = "pos-refund-" + Date.now();
      await returnsService.triggerRefund(
        selectedReturn.id,
        { method: "cash", note },
        idempotencyKey,
      );
      toast.success("Đã thực hiện lệnh hoàn tiền (tiền mặt)");
      setIsRefundOpen(false);
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
      setPosOrder(order);
    } catch (err: any) {
      toast.error("Không tìm thấy đơn hàng", {
        description:
          err?.response?.data?.message || "Vui lòng kiểm tra lại mã đơn POS.",
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
      const idempotencyKey = "pos-create-" + Date.now();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">
            Quản lý Đổi trả
          </h2>
          <p className="text-muted-foreground">
            Theo dõi và xử lý các yêu cầu trả hàng, hoàn tiền.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            setIsPosCreateOpen(true);
            setPosOrder(null);
            setPosSearchKey("");
            setPosReason("");
            setPosSelectedItems({});
          }}
        >
          <RotateCcw className="w-4 h-4" /> Tạo hoàn trả POS
        </Button>
      </div>

      <Card className="glass border-gold/20 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/20 hover:bg-transparent">
              <TableHead>Mã Yêu Cầu</TableHead>
              <TableHead>Mã Đơn</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Chưa có yêu cầu trả hàng nào
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((req) => (
                <TableRow
                  key={req.id}
                  className="border-gold/10 hover:bg-gold/5"
                >
                  <TableCell className="font-mono text-xs">
                    {req.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-mono">
                    {req.orderId.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {new Date((req as any).createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(req.status)} text-white`}
                    >
                      {getStatusLabel(req.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {req.reason || "Không có"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {["REQUESTED", "REVIEWING", "AWAITING_CUSTOMER"].includes(
                      req.status,
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReturn(req);
                          setNote("");
                          setIsReviewOpen(true);
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" /> Duyệt
                      </Button>
                    )}
                    {["RETURNING", "APPROVED"].includes(req.status) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(req);
                          setNote("");
                          setIsReceiveOpen(true);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Box className="w-4 h-4 mr-1" /> Nhận
                      </Button>
                    )}
                    {["RECEIVED", "REFUND_FAILED"].includes(req.status) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(req);
                          setNote("");
                          setIsRefundOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-1" /> Hoàn tiền
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="glass border-gold/20">
          <DialogHeader>
            <DialogTitle>Xét duyệt Yêu cầu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mã YC: <strong className="font-mono">{selectedReturn?.id}</strong>
            </p>
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 block">
                Ghi chú (Tùy chọn)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Lý do từ chối hoặc ghi chú duyệt..."
                className="bg-background/50 border-gold/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => handleReview("reject")}
              className="gap-2"
            >
              <X className="w-4 h-4" /> Từ chối
            </Button>
            <Button
              onClick={() => handleReview("approve")}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" /> Duyệt đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="glass border-gold/20">
          <DialogHeader>
            <DialogTitle>Nhận hàng Trả về</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Xác nhận đã nhận hàng trả về từ khách hàng và nhập kho.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 block">
                Ghi chú nhập kho
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Hàng nguyên vẹn, seal an toàn"
                className="bg-background/50 border-gold/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleReceive}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Xác nhận Nhận Hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="glass border-gold/20">
          <DialogHeader>
            <DialogTitle>Thực Hiện Hoàn Tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Bạn đang chuẩn bị hoàn tiền cho đơn hàng{" "}
              <strong className="font-mono">
                {selectedReturn?.orderId.substring(0, 8)}
              </strong>
              .
            </p>
            <p className="text-xs text-muted-foreground">
              Lưu ý: Đối với Staff, giới hạn hoàn nhanh bằng tiền mặt hoặc
              chuyển khoản là 1.000.000đ.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 block">
                Ghi chú giao dịch
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mã giao dịch / Ghi chú cho kế toán"
                className="bg-background/50 border-gold/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleRefund}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Hoàn Tiền Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POS Create Dialog */}
      <Dialog open={isPosCreateOpen} onOpenChange={setIsPosCreateOpen}>
        <DialogContent className="glass border-gold/20 max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tạo Đổi Trả Nhanh (POS)</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              placeholder="Nhập mã đơn POS (vd: POS-1775838406) / Quẹt mã Barcode..."
              value={posSearchKey}
              onChange={(e) => setPosSearchKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePosOrderSearch()}
              className="flex-1 bg-background/50 border-gold/20"
            />
            <Button onClick={handlePosOrderSearch} disabled={posLoading}>
              <Search className="w-4 h-4 mr-2" />
              Tìm
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 px-1 custom-scrollbar">
            {posLoading && (
              <p className="text-sm text-center text-muted-foreground py-4">
                Đang tìm kiếm...
              </p>
            )}

            {posOrder && (
              <div className="space-y-4">
                <div className="bg-gold/5 p-4 rounded-xl border border-gold/10">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Thông tin đơn hàng
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-mono text-sm">
                      {posOrder.code || posOrder.id.substring(0, 8)}
                    </p>
                    <Badge className="bg-teal-500/10 text-teal-600 border-teal-500/20">
                      {posOrder.status}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Khách:{" "}
                    {posOrder.user?.fullName ||
                      posOrder.user?.email ||
                      "Khách lẻ"}
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block">
                    Sản phẩm có thể trả
                  </label>
                  <div className="space-y-2">
                    {posOrder.items.map((item) => {
                      const qty = posSelectedItems[item.variantId] || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background/50"
                        >
                          <div className="flex-1 mr-2">
                            <p className="text-sm font-semibold">
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">
                                {item.variant.name}
                              </p>
                            )}
                            <p className="text-xs mt-1 text-muted-foreground text-gold">
                              Mua: {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-6 h-6"
                              onClick={() => {
                                setPosSelectedItems((prev) => ({
                                  ...prev,
                                  [item.variantId]: Math.max(0, qty - 1),
                                }));
                              }}
                            >
                              {" "}
                              -{" "}
                            </Button>
                            <span className="w-4 text-center text-sm font-semibold">
                              {qty}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-6 h-6"
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
                              {" "}
                              +{" "}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block">
                    Lý do trả hàng (Bắt buộc ghi chú POS)
                  </label>
                  <Input
                    value={posReason}
                    onChange={(e) => setPosReason(e.target.value)}
                    placeholder="Bể vỡ, khách đổi ý, sai sản phẩm..."
                    className="bg-background/50 border-gold/20"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsPosCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handlePosSubmit}
              disabled={!posOrder || posSubmitting}
              className="bg-gold hover:bg-gold/90 text-primary-foreground"
            >
              {posSubmitting ? "Đang xử lý..." : "Xác nhận Tạo Đổi Trả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
