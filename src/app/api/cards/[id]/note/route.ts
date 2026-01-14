import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get card note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to get note for card ${id}`);

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
      `[API] Sending request to backend: ${config.api.cards.endpoints.note(Number(id))}`
    );
    const response = await fetch(config.api.cards.endpoints.note(Number(id)), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });
    console.log(`[API] Backend response status: ${response.status}`);

    // If we got 401, token might be expired
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
    console.error('[API] Error getting card note:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Create or update card note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to create/update note for card ${id}`);

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

    // Get data from request body
    const body = await request.json();

    // Check for note text
    if (!body.note_text) {
      console.log(`[API] Error: Note text missing`);
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_NOTE_TEXT',
          message: 'Note text not specified'
        },
        { status: 400 }
      );
    }

    const noteText = body.note_text;
    console.log(
      `[API] Note text: ${noteText.substring(0, 50)}${noteText.length > 50 ? '...' : ''}`
    );

    // Send request to backend
    console.log(
      `[API] Sending request to backend: ${config.api.cards.endpoints.note(Number(id))}`
    );

    const response = await fetch(config.api.cards.endpoints.note(Number(id)), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ note_text: noteText })
    });
    console.log(`[API] Backend response status: ${response.status}`);

    // If we got 401, token might be expired
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
    console.error('[API] Error creating/updating card note:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Delete card note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to delete note for card ${id}`);

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
      `[API] Sending request to backend: ${config.api.cards.endpoints.note(Number(id))}`
    );

    const response = await fetch(config.api.cards.endpoints.note(Number(id)), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    console.log(`[API] Backend response status: ${response.status}`);

    // If we got 401, token might be expired
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
    console.error('[API] Error deleting card note:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}
