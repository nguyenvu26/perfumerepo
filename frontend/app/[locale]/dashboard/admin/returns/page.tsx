import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";
import { useTranslations } from "next-intl";

export default function AdminReturnsPage() {
  const t = useTranslations("dashboard.admin.returns");

  return (
    <div className="mx-auto max-w-[1680px] animate-in fade-in duration-700 space-y-6 sm:space-y-8 p-4 sm:p-6 md:space-y-10 md:p-10">
      <header className="mb-6 sm:mb-10">
        <h1 className="text-4xl sm:text-6xl font-heading gold-gradient mb-3 uppercase tracking-tighter italic leading-tight">
          {t('title')}
        </h1>
      </header>
      <AdminReturnManagement isAdmin={true} />
    </div>
  );
}
