import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  returnsService,
  ReturnRequest,
  ReturnStatus,
} from "@/services/returns.service";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

const statusLabels: Record<ReturnStatus, string> = {
  REQUESTED: "Đã yêu cầu",
  REVIEWING: "Đang xem xét",
  APPROVED: "Đã duyệt",
  RETURNING: "Đang gửi hàng",
  RECEIVED: "Đã nhận hàng",
  REFUNDING: "Đang hoàn tiền",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
  REFUND_FAILED: "Hoàn tiền thất bại",
  AWAITING_CUSTOMER: "Chờ thông tin thêm",
  REJECTED_AFTER_RETURN: "Từ chối sau khi nhận",
};

export function ReturnList() {
  const t = useTranslations("Returns");
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    returnsService
      .listMyReturns()
      .then(setReturns)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        {user && (
          <Link href="/orders">
            <Button>{t("backToOrders")}</Button>
          </Link>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {returns.map((ret) => (
          <Card key={ret.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>Trả hàng #{ret.id.slice(-6)}</span>
                <Badge
                  variant={ret.status === "COMPLETED" ? "default" : "secondary"}
                >
                  {statusLabels[ret.status] || ret.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng: {ret.orderId}</p>
              <p>Số tiền: {ret.totalAmount?.toLocaleString()}đ</p>
              <p>Số items: {ret.items.length}</p>
              <div className="mt-4 space-x-2">
                <Link href={`/returns/${ret.id}`}>
                  <Button variant="outline" size="sm">
                    Chi tiết
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {returns.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p>Chưa có yêu cầu trả hàng nào.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
