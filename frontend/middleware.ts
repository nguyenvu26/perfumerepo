import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect legacy /en routes to /vi
    if (pathname.startsWith('/en/') || pathname === '/en') {
        const url = request.nextUrl.clone();
        url.pathname = pathname === '/en' ? '/vi' : pathname.replace('/en/', '/vi/');
        return NextResponse.redirect(url);
    }

    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames
    // We include /en to intercept and redirect it
    matcher: ['/', '/(vi|en)/:path*']
};
