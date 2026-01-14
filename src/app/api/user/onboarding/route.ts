import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// GET user onboarding status
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(config.api.user.endpoints.onboarding, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка при обращении к серверу' },
      { status: 500 }
    );
  }
}

// POST partial update of onboarding status
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const requestData = await request.json().catch(() => ({}));

    const response = await fetch(config.api.user.endpoints.onboarding, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка при обращении к серверу' },
      { status: 500 }
    );
  }
}


