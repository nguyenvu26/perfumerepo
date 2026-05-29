import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";

export const metadata = {
  title: "Quản lý Đổi trả - POS",
  description: "Quản lý đổi trả và hoàn tiền cho nhân viên",
};

export default function StaffReturnsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
      <AdminReturnManagement isAdmin={false} />
    </div>
  );
}
