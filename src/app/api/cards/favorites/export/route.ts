import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Export favorites to CSV
export async function GET(request: NextRequest) {
  try {
    console.log(`[API] Request to export favorites to CSV`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Send request to backend for favorites export
    // Use the unified export endpoint with folder=favorites parameter
    const response = await fetch(
      config.api.folders.endpoints.exportUnified('favorites'),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    console.log(`[API] Backend response status: ${response.status}`);

    // If received 401, token might be expired
    if (response.status === 401) {
      console.log(`[API] Error: Authorization token expired or invalid`);
      return NextResponse.json(
        {
          success: false,
          message: 'Authorization token expired or invalid'
        },
        { status: 401 }
      );
    }

    // Check if response is successful
    if (!response.ok) {
      console.log(`[API] Error: Backend returned status ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to export favorites'
        },
        { status: response.status }
      );
    }

    // Get CSV data
    const csvData = await response.text();

    // Validate that we received CSV data
    if (!csvData || csvData.trim().length === 0) {
      console.log(`[API] Error: Empty CSV data received`);
      return NextResponse.json(
        {
          success: false,
          message: 'No data available for export'
        },
        { status: 404 }
      );
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `favorites-export-${timestamp}.csv`;

    // Create new response with proper headers for CSV download
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[API] Error exporting favorites to CSV:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
} 