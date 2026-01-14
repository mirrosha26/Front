import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

// Get group members and assignment info for card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] Request to get group members for card ${id}`);
    console.log(`[API] Request URL: ${request.url}`);
    console.log(`[API] Request pathname: ${request.nextUrl.pathname}`);

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const apiUrl = config.api.cards.endpoints.groupMembers(Number(id));

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    console.log(`[API] Backend response status: ${response.status}`);

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

    // Try to parse response first (before checking status)
    let responseData;
    try {
      const responseText = await response.text();
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch (e) {
      // If parsing fails, responseData remains undefined
    }

    if (response.status === 404) {
      console.log(`[API] Card not assigned to group - checking for group info`);
      // If backend returns group and members info in 404 response, pass it through
      if (responseData && responseData.group && Array.isArray(responseData.members)) {
        console.log(`[API] Found group info in 404 response, passing through`);
        return NextResponse.json({
          success: false,
          error_code: 'CARD_NOT_ASSIGNED',
          message: 'Card not assigned to group',
          group: responseData.group,
          card_id: Number(id),
          members: responseData.members
        }, { status: 404 });
      }
      
      // Standard 404 response
      return NextResponse.json(
        {
          success: false,
          error_code: 'CARD_NOT_FOUND',
          message: 'Card not found or not assigned to group'
        },
        { status: 404 }
      );
    }

    // Handle 500 and other server errors
    if (response.status >= 500) {
      let errorMessage = 'Произошла ошибка сервера';
      try {
        const errorText = await response.text();
        console.error(`[API] Backend error response:`, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.error(`[API] Error reading error response:`, e);
      }
      return NextResponse.json(
        {
          success: false,
          message: errorMessage
        },
        { status: 500 }
      );
    }

    // Use already parsed responseData if available, otherwise return error
    if (!responseData) {
      console.warn(`[API] Empty response from backend`);
      return NextResponse.json(
        {
          success: false,
          message: 'Empty response from server'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('[API] Error getting group members for card:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Assign/unassign group members to card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] POST request to assign group members for card ${id}`);
    console.log(`[API] Request URL: ${request.url}`);
    console.log(`[API] Request pathname: ${request.nextUrl.pathname}`);

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (e) {
      // Empty body is OK - means assign to group without members
      body = {};
    }
    console.log(`[API] Request body:`, body);

    const apiUrl = config.api.cards.endpoints.groupMembers(Number(id));

    // New API format: if only status is provided (or empty body), assign to group without members
    // If member_ids is provided (even empty array), include it in request
    const hasMemberIds = Array.isArray(body.member_ids); // Check if member_ids is an array (can be empty)
    const hasNonEmptyMemberIds = hasMemberIds && body.member_ids.length > 0;
    const hasStatus = body.status && ['REVIEW', 'REACHING_OUT', 'CONNECTED', 'NOT_A_FIT'].includes(body.status);
    
    let requestBody: any;
    
    if (hasMemberIds) {
      // member_ids is provided (can be empty array for "assign to no one")
      requestBody = {
        member_ids: body.member_ids
      };
      // Include action only if we have non-empty member_ids (for replace/add logic)
      if (hasNonEmptyMemberIds && body.action) {
        requestBody.action = body.action;
      }
      if (hasStatus) {
        requestBody.status = body.status;
      }
    } else {
      // Assign to group without members (new format) - no member_ids in request
      requestBody = hasStatus ? { status: body.status } : {};
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[API] Backend response status: ${response.status}`);

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

    if (response.status === 404) {
      console.log(`[API] Error: Card or member not found`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Card or member not found'
        },
        { status: 404 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error updating group members for card:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// Update assignment status and/or member assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get id from params
    const { id } = await params;
    console.log(`[API] PUT request to update assignment for card ${id}`);

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.log(`[API] Error: Authorization token missing`);
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`[API] Request body:`, body);

    // Validate that at least one parameter is provided
    const hasStatus = body.status !== undefined;
    const hasMemberIds = body.member_ids !== undefined;
    
    if (!hasStatus && !hasMemberIds) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_PARAMETERS',
          message: 'At least one of status or member_ids must be provided'
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (hasStatus) {
      const validStatuses = ['REVIEW', 'REACHING_OUT', 'CONNECTED', 'NOT_A_FIT'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error_code: 'INVALID_STATUS',
            message: `Status must be one of: ${validStatuses.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // Validate member_ids if provided
    if (hasMemberIds && !Array.isArray(body.member_ids)) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_MEMBER_IDS',
          message: 'member_ids must be an array'
        },
        { status: 400 }
      );
    }

    const apiUrl = config.api.cards.endpoints.groupMembers(Number(id));

    // Build request body - include only provided parameters
    const requestBody: any = {};
    if (hasStatus) {
      requestBody.status = body.status;
    }
    if (hasMemberIds) {
      requestBody.member_ids = body.member_ids;
      // If member_ids is provided, also include action (default to 'replace')
      requestBody.action = body.action || 'replace';
    }

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[API] Backend response status: ${response.status}`);

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

    if (response.status === 404) {
      console.log(`[API] Error: Card not found or not assigned to group`);
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'Card not found or not assigned to group'
        },
        { status: 404 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error updating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при подключении к серверу'
      },
      { status: 500 }
    );
  }
}

// PATCH is an alias for PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

