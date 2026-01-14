import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Adding card to hidden list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to add card ${id} to hidden list`);

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
    // Need to add delete endpoint to config if not exists
    const deleteEndpoint =
      config.api.cards.endpoints.delete?.(Number(id)) ||
      `${config.api.cards.baseUrl}/${id}/delete/`;

    console.log(`[API] Sending request to backend: ${deleteEndpoint}`);

    const response = await fetch(deleteEndpoint, {
      method: 'POST',
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

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data:`, data);

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error while adding card to hidden list:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}

// Restoring card from hidden list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to restore card ${id} from hidden list`);

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
    // Need to add delete endpoint to config if not exists
    const deleteEndpoint =
      config.api.cards.endpoints.delete?.(Number(id)) ||
      `${config.api.cards.baseUrl}/${id}/delete/`;

    console.log(`[API] Sending request to backend: ${deleteEndpoint}`);

    const response = await fetch(deleteEndpoint, {
      method: 'DELETE',
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

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data:`, data);

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error while restoring card from hidden list:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
