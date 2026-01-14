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

// GET /api/auth/client-tokens/ - Get list of tokens
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(config.api.auth.endpoints.clientTokens, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching client tokens:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}


