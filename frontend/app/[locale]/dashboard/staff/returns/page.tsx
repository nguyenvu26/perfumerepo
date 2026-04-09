import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";

export const metadata = {
    title: 'Quản lý Đổi trả - POS',
    description: 'Quản lý đổi trả và hoàn tiền cho nhân viên',
};

export default function StaffReturnsPage() {
    return (
        <div className="p-6">
            <AdminReturnManagement />
        </div>
    );
}
