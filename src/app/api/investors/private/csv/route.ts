import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

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

// Upload CSV file with private investors
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

    // Check that request contains multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_REQUEST',
          message: 'Request must be multipart/form-data'
        },
        { status: 400 }
      );
    }

    // Get form data
    const formData = await request.formData();

    // Check file presence
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_FILE',
          message: 'CSV file is required'
        },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_FILE_TYPE',
          message: 'File must be a CSV'
        },
        { status: 400 }
      );
    }

    // Create new FormData for backend request
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // Send request to backend with token in Authorization header
    const response = await fetch(
      config.api.investors.endpoints.privateInvestorsCsv,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: backendFormData
      }
    );

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error uploading CSV file:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}
