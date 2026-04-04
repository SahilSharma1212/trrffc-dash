import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();

    if (id === '1234567890' && password === '1234567890') {
      const token = await signToken(id);

      const response = NextResponse.json(
        { success: true, message: 'Logged in successfully' },
        { status: 200 }
      );

      // Set cookie directly on the response using centralized options
      response.cookies.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid ID or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}