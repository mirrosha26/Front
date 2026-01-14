import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get card preview by identifier (UUID or slug) - public endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    // Get identifier from URL request
    const { identifier } = await params;
    console.log(`[API] Public request to get card preview by identifier: ${identifier}`);

    // Form URL for request to backend public API
    const apiUrl = `${config.api.public.endpoints.cardPreview(identifier)}`;

    console.log(`[API] Sending public request to backend: ${apiUrl}`);

    // Send request to backend without authorization (public endpoint)
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[API] Backend response status: ${response.status}`);

    // If identifier not found
    if (response.status === 404) {
      console.log(`[API] Error: Card not found for identifier: ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Card not found for this identifier'
        },
        { status: 404 }
      );
    }

    // Check if response is successful
    if (!response.ok) {
      console.log(`[API] Backend error with status: ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Произошла ошибка бэкенда'
        },
        { status: response.status }
      );
    }

    // Get response from backend
    const data = await response.json();
    console.log(`[API] Backend data received for card preview:`, {
      success: data.success,
      hasCard: !!data.card,
      cardId: data.card?.id,
      cardName: data.card?.name,
      open_to_intro: data.card?.open_to_intro
    });

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting card preview by identifier:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
} 