'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function RedirectToStockHistory() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/dashboard/admin/stores/stock?tab=history`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-heading text-xs uppercase tracking-widest">
      Redirecting to consolidated history...
    </div>
  );
}
