import { NextResponse } from 'next/server';
import { config } from '@/config/config';
import { isProtectedRoute } from '@/utils/auth';

export async function GET(request: Request) {
  try {
    // Get tokens from cookies
    const cookies = request.cookies;
    const refreshToken = cookies.get('refreshToken')?.value;
    const accessToken = cookies.get('accessToken')?.value;

    // Get path from URL request
    const url = new URL(request.url);
    const path = url.searchParams.get('path') || '';

    // Check if path is protected
    const isProtected = path ? isProtectedRoute(path) : false;

    // If no tokens present, return result immediately
    if (!refreshToken && !accessToken) {
      return NextResponse.json(
        {
          success: true,
          hasToken: false,
          isValid: false,
          isProtected: path ? isProtected : undefined,
          requiresAuth: isProtected
        },
        { status: 200 }
      );
    }

    // Verify token on server (preferably access token)
    const tokenToVerify = accessToken || refreshToken;

    const response = await fetch(config.api.auth.endpoints.verify, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: tokenToVerify })
    });

    // Check result
    const isValid = response.ok;

    return NextResponse.json(
      {
        success: true,
        hasToken: true,
        isValid,
        isProtected: path ? isProtected : undefined,
        requiresAuth: isProtected
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при проверке токена',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
