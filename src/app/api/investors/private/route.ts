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

// Get list of private investors
export async function GET(request: NextRequest) {
  try {
    // Get authorization token
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Send request to backend with token in Authorization header
    const response = await fetch(
      config.api.investors.endpoints.privateInvestors,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching private investors:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Create private investor request
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

    // Check required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_PARAMETER',
          message: 'Investor name is required'
        },
        { status: 400 }
      );
    }

    // Send request to backend with token in Authorization header
    const response = await fetch(
      config.api.investors.endpoints.privateInvestors,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      }
    );

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating private investor request:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

// Delete private investor request
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

    // Check for req_id in request
    if (!body.req_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_PARAMETER',
          message: 'Request ID is missing'
        },
        { status: 400 }
      );
    }

    // Send request to backend with token in Authorization header
    const response = await fetch(
      config.api.investors.endpoints.privateInvestors,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ req_id: body.req_id })
      }
    );

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting private investor request:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
