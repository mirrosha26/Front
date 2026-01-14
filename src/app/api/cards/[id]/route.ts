import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get detailed card information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from URL request
    const { id } = await params;
    console.log(`[API] Request to get detailed card information ${id}`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    console.log(`[API] Access token received: ${Boolean(accessToken)}`);

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Form URL for request
    const apiUrl = config.api.cards.endpoints.card(Number(id));
    console.log(`[API] Sending request to backend: ${apiUrl}`);

    // Send request to backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });
    console.log(`[API] Backend response status: ${response.status}`);

    // If received 401, token might be expired
    if (response.status === 401) {
      console.log(`[API] Error: Authorization token expired or invalid`);
      return NextResponse.json(
        {
          success: false,
          message: 'Authorization token expired or invalid'
        },
        { status: 401 }
      );
    }

    // If card not found
    if (response.status === 404) {
      console.log(`[API] Error: Card not found`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Card not found'
        },
        { status: 404 }
      );
    }

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data received`);

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting card information:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
