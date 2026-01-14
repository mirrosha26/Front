import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Function to extract token from cookies
function getAuthToken(request: NextRequest): string | null {
  // Get cookies from request
  const cookies = request.headers.get('cookie') || '';

  // Look for accessToken in cookies
  const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
  const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

  // If token not found in cookies, check Authorization header
  if (!accessToken) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  return accessToken;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Запрос к backend API
    const response = await fetch(config.api.user.endpoints.digestSettings, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Если настройки не найдены (404), возвращаем дефолтные значения
      if (response.status === 404) {
        const defaultSettings = {
          is_enabled: false,
          digest_hour: 8,
          timezone: "America/New_York",
          additional_emails: [],
          custom_filters_enabled: false,
          custom_investors_enabled: false,
          custom_folders_enabled: false
        };
        return NextResponse.json(defaultSettings);
      }
      
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching digest settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Запрос к backend API для сохранения настроек
    const response = await fetch(config.api.user.endpoints.digestSettings, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating digest settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Запрос к backend API для сохранения настроек с поддержкой частичного обновления
    const response = await fetch(config.api.user.endpoints.digestSettings, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating digest settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
