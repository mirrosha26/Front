import { NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(config.api.auth.endpoints.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Check for tokens in response
    if (response.ok && data.access && data.refresh) {
      // Create response object
      const responseObj = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );

      // Set HttpOnly cookies
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

      responseObj.cookies.set({
        name: 'accessToken',
        value: data.access,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiryDate,
        path: '/'
      });

      responseObj.cookies.set({
        name: 'refreshToken',
        value: data.refresh,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiryDate,
        path: '/'
      });

      return responseObj;
    } else if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Authentication error'
        },
        { status: response.status }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid server response format'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
