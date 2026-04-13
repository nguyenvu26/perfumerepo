import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";
import { useTranslations } from "next-intl";

export default function AdminReturnsPage() {
  const t = useTranslations("dashboard.admin.returns");

  return (
    <div className="p-6">
      <AdminReturnManagement isAdmin={true} />
    </div>
  );
}
