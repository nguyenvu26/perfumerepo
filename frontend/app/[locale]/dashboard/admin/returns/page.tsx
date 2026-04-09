import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";

export const metadata = {
    title: 'Quản lý Đổi trả - Admin',
    description: 'Quản lý đổi trả và hoàn tiền nâng cao cho cửa hàng',
};

export default function AdminReturnsPage() {
    return (
        <div className="p-6">
            <AdminReturnManagement />
        </div>
    );
}
