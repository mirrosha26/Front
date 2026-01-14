import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Check content type to determine if it's JSON or FormData
    const contentType = request.headers.get('content-type') || '';

    let response: Response;

    if (contentType.includes('application/json')) {
      // Handle JSON request (for deletion)
      const jsonData = await request.json();
      
      console.log('[API] Request to update group (JSON)');
      console.log('[API] JSON data:', jsonData);

      // Send JSON request to backend
      response = await fetch(config.api.user.endpoints.groupUpdate, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });
    } else {
      // Handle FormData request (for file upload)
      const formData = await request.formData();

      console.log('[API] Request to update group (FormData)');

      // Send request to backend
      response = await fetch(config.api.user.endpoints.groupUpdate, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });
    }

    console.log(`[API] Backend response status: ${response.status}`);

    if (response.status === 401) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authorization token expired or invalid'
        },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to update this group'
        },
        { status: 403 }
      );
    }

    if (response.status === 400) {
      const data = await response.json();
      return NextResponse.json(data, { status: 400 });
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error updating group:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обновлении группы'
      },
      { status: 500 }
    );
  }
}

