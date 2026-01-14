import { NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get token from accessToken cookie instead of token
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Send request to backend
    const response = await fetch(config.api.user.endpoints.changePassword, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
