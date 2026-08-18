/**
 * Next.js 16 Proxy (pengganti middleware).
 *
 * Optimistic auth check: baca cookie session, redirect ke /login jika belum auth,
 * redirect ke / jika sudah login tapi akses /login.
 *
 * PENTING: Proxy ini BUKAN satu-satunya pertahanan. Setiap Server Action
 * dan RLS policy di Supabase WAJIB tetap memvalidasi authorization.
 * Lihat: https://nextjs.org/docs/app/guides/data-security
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_ROUTES = ['/login'];
const PROTECTED_PREFIXES = ['/siswa', '/guru', '/kelas', '/master-pelanggaran', '/excel', '/staf'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals & static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isProtected =
    pathname === '/' ||
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Buat response object yang akan kita attach cookies hasil refresh session
  const response = NextResponse.next({ request });

  // Supabase client yang share cookie dengan response (refresh session jika perlu)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set ke REQUEST (forward ke RSC) dan RESPONSE (balik ke browser)
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // PENTING: getUser() refresh session jika expired & validasi JWT signature.
  // JANGAN pakai getSession() di proxy (untrusted).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protected route tapi belum auth → redirect ke /login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Public route (/login) tapi sudah auth → redirect ke dashboard
  if (isPublic && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

// Jalankan di semua route KECUALI static/internal
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
};
