import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get card detail by identifier (UUID or slug) - public endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    // Get identifier from URL request
    const { identifier } = await params;
    console.log(`[API] Public request to get card detail by identifier: ${identifier}`);

    // Form URL for request to backend public API
    const apiUrl = `${config.api.public.endpoints.cardDetail(identifier)}`;

    console.log(`[API] Sending public request to backend:`, {
      url: apiUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      identifier,
      baseUrl: config.api.public.baseUrl
    });

    // Send request to backend without authorization (public endpoint)
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[API] Backend response received:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    });

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
    console.log(`[API] Backend data received for card detail:`, {
      success: data.success,
      hasCard: !!data.card,
      cardId: data.card?.id,
      cardName: data.card?.name,
      hasSignals: !!data.card?.signals,
      signalsCount: data.card?.signals?.length || 0,
      hasLinkedInData: false, // linkedinData field no longer available
      linkedInSignalsCount: 0,
      open_to_intro: data.card?.open_to_intro
    });

    // Log LinkedIn data details if present
    if (data.card?.signals) {
      const linkedInSignals: any[] = []; // linkedinData field no longer available
      if (linkedInSignals.length > 0) {
        console.log(`[API] LinkedIn signals in response:`, {
          count: linkedInSignals.length,
          signals: linkedInSignals.map((s: any) => ({
            id: s.id,
            signalType: s.signalType?.slug,
            linkedinData: null // linkedinData field no longer available
          }))
        });
      }
    }

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting card detail by identifier:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
} 