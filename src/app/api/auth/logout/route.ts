import { NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: Request) {
  try {
    // Get refreshToken from cookies
    const cookies = request.cookies;
    const refreshToken = cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Send request to backend to invalidate token
      await fetch(config.api.auth.endpoints.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });
    }

    // Create response and delete cookies
    const response = NextResponse.json({ success: true });

    // Delete cookies
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even on error, delete cookies on client
    const response = NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );

    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  }
}
