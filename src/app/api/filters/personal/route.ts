import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get list of personal filters for signals
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

    // Form URL for API personal filters request
    const apiUrl = new URL(config.api.filters.endpoints.personal);

    // Get parameters from URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Copy all parameters from original request
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

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
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Send selected personal filters for signals
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
    const requestData = await request.json();

    // Form URL for API personal filters request
    const apiUrl = new URL(config.api.filters.endpoints.personal);

    // Send request to backend with token in header and filter data
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
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
    console.error('Error sending personal filters:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
