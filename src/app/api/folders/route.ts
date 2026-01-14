import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get list of folders
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

    console.log('[API] Request to get list of folders');

    // Send request to backend
    const response = await fetch(config.api.folders.endpoints.folders, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[API] Backend response status: ${response.status}`);

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
    console.error('Error getting list of folders:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}

// Create new folder
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

    // Check if name exists in request
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_NAME',
          message: 'Folder name is missing'
        },
        { status: 400 }
      );
    }

    console.log(`[API] Request to create new folder: ${body.name}`);

    // Send request to backend
    const response = await fetch(config.api.folders.endpoints.folders, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description || '',
        is_default: body.is_default || false
      })
    });

    console.log(`[API] Backend response status: ${response.status}`);

    // Get response from backend
    const data = await response.json();

    // Return response to client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
