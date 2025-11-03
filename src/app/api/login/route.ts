// src/app/api/login/route.ts
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import { sign } from 'jsonwebtoken';
// import { cookies } from 'next/headers'; // cookies was unused

const JWT_SECRET = process.env.JWT_SECRET || 'default-fallback-secret-for-jwt';
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

// The function signature should accept a NextRequest object
export async function POST(request: NextRequest) { 
  // Ensure the environment variables are checked on the server
  if (!ACCESS_PASSWORD || !JWT_SECRET) {
    console.error("Server secrets (ACCESS_PASSWORD or JWT_SECRET) are not set.");
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (password === ACCESS_PASSWORD) {
      // Passwords match. Create a JWT token.
      const token = sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

      // Create a response object to set the cookie on
      const response = NextResponse.json({ success: true });

      // Set the cookie on the response object
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      return response;
    } else {
      // Passwords do not match.
      return NextResponse.json({ success: false, message: 'Invalid password.' }, { status: 401 });
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ success: false, message: 'An internal error occurred.' }, { status: 500 });
  }
}