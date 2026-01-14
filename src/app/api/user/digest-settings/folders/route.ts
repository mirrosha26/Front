import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Function to extract token from cookies
function getAuthToken(request: NextRequest): string | null {
  const cookies = request.headers.get('cookie') || '';
  const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
  const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

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
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';

    // Запрос к backend API
    const response = await fetch(`${config.api.user.endpoints.digestFolders}?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
