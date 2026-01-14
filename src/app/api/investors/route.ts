import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';
import { cookies } from 'next/headers';

// Function to extract token from cookies
function getAuthToken(request: NextRequest): string | null {
  // Get cookies from request
  const cookies = request.headers.get('cookie') || '';

  // Look for accessToken in cookies
  const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
  const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

  // If token not found in cookies, check Authorization header
  if (!accessToken) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  return accessToken;
}

// Get list of investors
export async function GET(request: NextRequest) {
  try {
    // Get authorization token
    const token = getAuthToken(request);

    console.log('Auth token:', token ? 'Present' : 'Missing');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Check for saved parameter
    const savedParam = searchParams.get('saved');

    // If saved parameter is missing, add it with default value 'false'
    if (savedParam === null) {
      searchParams.set('saved', 'false');
      console.log('Saved parameter is missing, setting default value: false');
    } else {
      console.log(`Requesting investors list with saved=${savedParam}`);
    }

    // Form URL for request with all parameters
    const apiUrl = new URL(config.api.investors.endpoints.investors);

    // Copy all parameters from original request
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    console.log('Sending request to URL:', apiUrl.toString());

    // Send request to backend with token in Authorization header
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Get response from backend
    const data = await response.json();

    // Log backend response
    console.log('Backend response:', JSON.stringify(data));

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching investors list:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Save investor to favorites
export async function POST(request: NextRequest) {
  try {
    // Get authorization token
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();

    // Check for participant_id in request
    if (!body.participant_id && !body.participant_ids) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_PARAMETER',
          message: 'Investor ID is missing'
        },
        { status: 400 }
      );
    }

    // Form array of IDs for backend request
    const participant_ids = body.participant_ids || [body.participant_id];

    console.log(`Saving investors with IDs: ${participant_ids.join(', ')}`);

    // Send request to backend with token in Authorization header
    const response = await fetch(config.api.investors.endpoints.investors, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ participant_ids })
    });

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error saving investor:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Remove investor from favorites
export async function DELETE(request: NextRequest) {
  try {
    // Get authorization token
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();

    // Check for participant_id in request
    if (!body.participant_id && !body.participant_ids) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_PARAMETER',
          message: 'Investor ID is missing'
        },
        { status: 400 }
      );
    }

    // Form array of IDs for backend request
    const participant_ids = body.participant_ids || [body.participant_id];

    console.log(`Removing investors with IDs: ${participant_ids.join(', ')}`);

    // Send request to backend with token in Authorization header
    const response = await fetch(config.api.investors.endpoints.investors, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ participant_ids })
    });

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error removing investor from favorites:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
