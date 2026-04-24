import { AdminReturnManagement } from "@/components/returns/AdminReturnManagement";
import { useTranslations } from "next-intl";

export default function AdminReturnsPage() {
  const t = useTranslations("dashboard.admin.returns");

  return (
    <div className="mx-auto max-w-[1680px] animate-in fade-in duration-700 space-y-8 p-4 sm:p-6 md:space-y-10 md:p-10">
      <header className="overflow-hidden rounded-[2.5rem] border border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,242,233,0.9))] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold tracking-[0.24em] text-gold uppercase">
              Returns Command Center
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-heading leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {t('title')}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-fit">
            <div className="rounded-[1.6rem] border border-black/6 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
                {t('header.focus_label')}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {t('header.focus_value')}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-gold/20 bg-gold/10 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80">
                {t('header.experience_label')}
              </p>
              <p className="mt-2 text-base font-semibold text-gold">
                {t('header.experience_value')}
              </p>
            </div>
          </div>
        </div>
      </header>
      <AdminReturnManagement isAdmin={true} />
    </div>
  );
}
