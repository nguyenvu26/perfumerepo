import type { ReactNode } from 'react';
import './globals.css';
import { beVietnamPro } from '@/lib/fonts';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnamPro.variable}>
      <body
        className="antialiased bg-white dark:bg-zinc-950 transition-colors duration-500 font-sans"
        style={{
          fontFeatureSettings: "'liga' 1, 'calt' 1, 'kern' 1",
          fontVariantLigatures: "common-ligatures",
        }}
      >
        {children}
      </body>
    </html>
  );
}
