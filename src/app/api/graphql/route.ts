import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the access token from httpOnly cookie
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Authentication required',
              extensions: {
                code: 'UNAUTHENTICATED'
              }
            }
          ]
        },
        { status: 401 }
      );
    }

    // Get the GraphQL query/mutation from the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('GraphQL proxy: Invalid JSON in request body:', error);
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Invalid JSON in request body',
              extensions: {
                code: 'BAD_REQUEST'
              }
            }
          ]
        },
        { status: 400 }
      );
    }

    // Forward the request to the Django GraphQL endpoint
    const djangoUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.theveck.com:8000'}/graphql/`;

    // Get all cookies to forward to Django (including session cookies)
    const cookieHeader = request.headers.get('cookie') || '';
    
    const graphqlResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader, // Forward all cookies including Django session
      },
      body: JSON.stringify(body),
    });

    // Parse response data
    let responseData;
    try {
      responseData = await graphqlResponse.json();
    } catch (error) {
      console.error('GraphQL proxy: Failed to parse response JSON:', error);
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Invalid response from GraphQL backend',
              extensions: {
                code: 'BACKEND_ERROR'
              }
            }
          ]
        },
        { status: 500 }
      );
    }

    // Log backend errors for debugging (but don't fail the request)
    if (responseData.errors && Array.isArray(responseData.errors)) {
      responseData.errors.forEach((error: any) => {
        const isBackendError = error.message?.includes('logger') || 
                              error.message?.includes('cannot access local variable');
        if (isBackendError) {
          console.error('[GraphQL Backend Error]:', {
            message: error.message,
            path: error.path,
            locations: error.locations,
            extensions: error.extensions
          });
        }
      });
    }

    // Return the GraphQL response (including errors from backend)
    return NextResponse.json(responseData, {
      status: graphqlResponse.status,
    });
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message: 'Internal server error',
            extensions: {
              code: 'INTERNAL_ERROR'
            }
          }
        ]
      },
      { status: 500 }
    );
  }
} 