import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get cards from folder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to get cards from folder ${id}`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get parameters from URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Form URL for request with all parameters
    const apiUrl = new URL(config.api.folders.endpoints.cards(Number(id)));

    // Copy all parameters from original request
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    // Send request to backend
    const response = await fetch(apiUrl.toString(), {
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

    // If folder not found
    if (response.status === 404) {
      console.log(`[API] Error: Folder not found`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Folder not found'
        },
        { status: 404 }
      );
    }

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting cards from folder:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
