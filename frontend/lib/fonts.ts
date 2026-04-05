import { Be_Vietnam_Pro } from 'next/font/google';

/**
 * Be Vietnam Pro - Specifically designed for Vietnamese.
 * This font handles complex diacritic stacking (Thiết Yếu) and
 * kerning far better than any generic Google font.
 */
export const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-be-vietnam',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  adjustFontFallback: false, // Prevents metrics distortion
});
