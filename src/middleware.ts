// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // A more secure, modern JWT library

// This is your secret key for verifying the JWT.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-fallback-secret-for-jwt');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // If trying to access login page, let them through
  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }
  
  // If trying to access any other page, check for token
  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the token
  try {
    await jwtVerify(token, JWT_SECRET);
    // Token is valid, allow the request to proceed
    return NextResponse.next();
  } catch (err) {
    // Token is invalid (expired, tampered, etc.), redirect to login
    console.error('JWT Verification Error:', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  // Match all paths except for static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};