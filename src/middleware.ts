// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create a Supabase client that can be used in the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          // This space is intentionally left blank for the middleware.
          // The actual cookie setting is handled by the response object below.
        },
        remove(name: string, options) {
          // Same as above.
        },
      },
    }
  );

  // This line is crucial. It refreshes the user's session if it's about to expire.
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // If the user is trying to access the login page and they are already logged in,
  // redirect them to the home page.
  if (session && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is trying to access any protected page and they are NOT logged in,
  // redirect them to the login page.
  if (!session && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is logged in or is accessing the login page, allow the request to proceed.
  // We create a new response object to ensure the session cookie is correctly refreshed and passed on.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Re-create the server client with the new response object to handle cookie setting.
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  return response;
}

// Ensure the middleware runs on all paths except for static assets.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};