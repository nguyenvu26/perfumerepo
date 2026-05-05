'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function RedirectToStockImport() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/dashboard/admin/stores/stock?tab=batch-import`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-heading text-xs uppercase tracking-widest">
      Redirecting to consolidated inventory...
    </div>
  );
}
