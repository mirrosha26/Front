import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get list of all signals
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
    const apiUrl = new URL(config.api.feeds.endpoints.allSignals);

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
    console.error('Error getting signals list:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
