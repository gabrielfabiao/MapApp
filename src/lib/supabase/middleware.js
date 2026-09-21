import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Reachable without a session cookie: /reset-password's recovery token lives
// in the URL hash, which the browser never sends to the server, so the
// middleware can't see it's "authenticated" on that first request.
const PUBLIC_PATHS = ['/login', '/reset-password'];
// Only /login should bounce an already-authenticated visitor away.
const REDIRECT_IF_AUTHENTICATED = ['/login'];

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && REDIRECT_IF_AUTHENTICATED.includes(pathname)) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
