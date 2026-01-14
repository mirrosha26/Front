import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Adding card to favorites (like)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;

    console.log(`[API] Request to add card ${id} to favorites`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    console.log(`[API] Access token received: ${!!accessToken}`);

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Send request to backend
    console.log(
      `[API] Sending request to backend: ${config.api.cards.endpoints.favorite(Number(id))}`
    );
    const response = await fetch(
      config.api.cards.endpoints.favorite(Number(id)),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
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

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data:`, data);

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error adding card to favorites:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Removing card from favorites (unlike)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;

    console.log(`[API] Request to remove card ${id} from favorites`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    console.log(`[API] Access token received: ${!!accessToken}`);

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Send request to backend
    console.log(
      `[API] Sending request to backend: ${config.api.cards.endpoints.favorite(Number(id))}`
    );
    const response = await fetch(
      config.api.cards.endpoints.favorite(Number(id)),
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
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

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data:`, data);

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error removing card from favorites:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}
