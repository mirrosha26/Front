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

// DELETE /api/auth/client-tokens/[id]/delete/ - Delete token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Get id from params
    const { id: tokenId } = await params;

    if (!tokenId) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_TOKEN_ID',
          message: 'Token ID is required. Provide it in URL path or request body.'
        },
        { status: 400 }
      );
    }

    const tokenIdNum = parseInt(tokenId, 10);
    if (isNaN(tokenIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_TOKEN_ID',
          message: 'Invalid token ID format.'
        },
        { status: 400 }
      );
    }

    const response = await fetch(config.api.auth.endpoints.clientTokensDelete(tokenIdNum), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting client token:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}


