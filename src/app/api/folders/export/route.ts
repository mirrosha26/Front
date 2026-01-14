import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Export folder to CSV (universal endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get folder parameter from query string
    const url = new URL(request.url);
    const folderParam = url.searchParams.get('folder');

    if (!folderParam) {
      return NextResponse.json(
        { success: false, message: 'Folder parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Request to export folder: ${folderParam}`);

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Get folder name from query parameter for filename
    const folderName = url.searchParams.get('name') || folderParam;

    // Send request to backend using unified export endpoint
    const response = await fetch(
      config.api.folders.endpoints.exportUnified(folderParam),
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

    // If folder not found
    if (response.status === 404) {
      console.log(`[API] Error: Folder not found`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Folder not found'
        },
        { status: 404 }
      );
    }

    // Check if response is successful
    if (!response.ok) {
      console.log(`[API] Error: Backend returned status ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to export folder'
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
    const filename = `folder-${folderName}-export-${timestamp}.csv`;

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
    console.error('[API] Error exporting folder to CSV:', error);
    return NextResponse.json(
      { success: false, message: 'Произошла ошибка сервера' },
      { status: 500 }
    );
  }
}

