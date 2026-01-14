import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Approve intro request with token
export async function POST(request: NextRequest) {
  try {
    // Get token from request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      console.log(`[API] Error: token is missing`);
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Request to approve intro with token`);

    // Form URL for request to backend
    const apiUrl = `${config.api.cards.baseUrl}/intro/approve/`;
    console.log(`[API] Sending request to backend: ${apiUrl}`);

    // Send request to backend (public endpoint, no auth required)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    console.log(`[API] Backend response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Failed to approve intro';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
        console.error(`[API] Backend error response:`, errorData);
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If we can't read response, use default message
        }
      }
      
      console.error(`[API] Error approving intro:`, {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage
      });
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API] Successfully approved intro:`, {
      success: data.success,
      message: data.message
    });
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error approving intro:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
