import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    console.log(
      'Extracted token:',
      accessToken ? accessToken.substring(0, 10) + '...' : 'missing'
    );

    const response = await fetch(config.api.user.endpoints.profile, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = 'Failed to get user profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If we can't read response, use default message
        }
      }
      
      console.error('Backend error:', response.status, errorMessage);
      return NextResponse.json(
        {
          success: false,
          message: errorMessage
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при обращении к серверу';
    return NextResponse.json(
      {
        success: false,
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
