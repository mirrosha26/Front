import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get list of cards
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get parameters from URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Form URL for request with all parameters
    const apiUrl = new URL(config.api.cards.endpoints.cards);

    // Copy all parameters from original request
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    console.log('Sending request to URL:', apiUrl.toString());

    // Send request to backend with token in header
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // If received 401, token might be expired
    if (response.status === 401) {
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

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting card list:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Save card (add to favorites)
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();

    // Check for card_id in request
    if (!body.card_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_CARD_ID',
          message: 'Card ID is missing'
        },
        { status: 400 }
      );
    }

    // Send request to backend
    const response = await fetch(config.api.cards.endpoints.cards, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ card_id: body.card_id })
    });

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error saving card:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Remove card from favorites
export async function DELETE(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();

    // Check for card_id in request
    if (!body.card_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_CARD_ID',
          message: 'Card ID is missing'
        },
        { status: 400 }
      );
    }

    // Send request to backend
    const response = await fetch(config.api.cards.endpoints.cards, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ card_id: body.card_id })
    });

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error removing card from favorites:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
