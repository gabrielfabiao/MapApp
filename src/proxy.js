import { updateSession } from './lib/supabase/middleware';

export default async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
