import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get list of folders for card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to get folders for card ${id}`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Form URL from config
    const apiUrl = config.api.cards.endpoints.folders(Number(id));

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
          error_code: 'CARD_NOT_FOUND',
          message: 'Card not found'
        },
        { status: 404 }
      );
    }

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting folders for card:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Update folders for card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to update folders for card ${id}`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();
    console.log(`[API] Request body:`, body);

    // Check for folder arrays
    const includeFolders = Array.isArray(body.include_folders)
      ? body.include_folders
      : [];
    const excludeFolders = Array.isArray(body.exclude_folders)
      ? body.exclude_folders
      : [];

    // Form URL for backend API request from config
    const apiUrl = config.api.cards.endpoints.folders(Number(id));

    // Send request to backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        include_folders: includeFolders,
        exclude_folders: excludeFolders
      })
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
      console.log(`[API] Error: Card or folder not found`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Card or folder not found'
        },
        { status: 404 }
      );
    }

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error updating folders for card:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}
