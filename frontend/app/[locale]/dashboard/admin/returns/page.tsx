import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";
import { useTranslations } from "next-intl";

export default function AdminReturnsPage() {
  const t = useTranslations("dashboard.admin.returns");

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
            {t('subtitle')}
          </p>
        </div>
      </header>
      <AdminReturnManagement isAdmin={true} />
    </div>
  );
}
