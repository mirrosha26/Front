import { NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: Request) {
  try {

    // Log request headers
    const requestHeaders = Object.fromEntries(request.headers.entries());

    // Get refreshToken from cookies
    const cookies = request.cookies;
    const refreshToken = cookies.get('refreshToken')?.value;

    console.log(
      'API REFRESH: RefreshToken:',
      refreshToken
        ? `${refreshToken.substring(0, 10)}...${refreshToken.substring(refreshToken.length - 5)}`
        : 'missing'
    );

    if (!refreshToken) {
      console.log('API REFRESH: RefreshToken missing, returning 401');

      // Create response with token cleanup
      const responseObj = NextResponse.json(
        { success: false, message: 'Refresh token missing' },
        { status: 401 }
      );

      // Delete tokens from cookies
      responseObj.cookies.delete('accessToken');
      responseObj.cookies.delete('refreshToken');

      return responseObj;
    }

    // Log refresh token URL
    const refreshUrl = config.api.auth.endpoints.refresh;
    console.log('API REFRESH: Sending request to URL:', refreshUrl);
    console.log(
      'API REFRESH: Request body:',
      JSON.stringify({ refresh: `${refreshToken.substring(0, 10)}...` })
    );

    // Make request to backend
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    // Log response results
    console.log('API REFRESH: Response status:', response.status);
    console.log('API REFRESH: Response status text:', response.statusText);

    // Log response headers
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('API REFRESH: Response headers:', responseHeaders);

    // Get and log response body
    const data = await response.json();
    console.log('API REFRESH: Response contains access token:', !!data.access);
    console.log(
      'API REFRESH: Response contains refresh token:',
      !!data.refresh
    );

    if (response.ok && data.access) {
      console.log('API REFRESH: Setting new access token');

      const responseObj = NextResponse.json({ success: true });

      // Set cookie expiration
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

      // Set new access token
      responseObj.cookies.set({
        name: 'accessToken',
        value: data.access,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiryDate,
        path: '/'
      });

      // Set refresh token only if received in response
      if (data.refresh) {
        responseObj.cookies.set({
          name: 'refreshToken',
          value: data.refresh,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: expiryDate,
          path: '/'
        });
        console.log('API REFRESH: New access and refresh tokens set');
      } else {
        // Keep current refresh token
        console.log(
          'API REFRESH: New access token set, refresh token remains unchanged'
        );
      }

      console.log(
        '=== API REFRESH: Token refresh request processing completed ==='
      );
      return responseObj;
    }

    console.log('API REFRESH: Failed to refresh tokens:', data);
    console.log(
      '=== API REFRESH: Token refresh request processing completed ==='
    );

    // If received 401 error, clear tokens
    if (response.status === 401) {
      console.log('API REFRESH: Received 401 status, clearing tokens');
      const responseObj = NextResponse.json(data, { status: response.status });

      // Delete tokens from cookies
      responseObj.cookies.delete('accessToken');
      responseObj.cookies.delete('refreshToken');

      return responseObj;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API REFRESH: Error refreshing token:', error);

    // Clear tokens on error
    const responseObj = NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );

    // Delete tokens from cookies
    responseObj.cookies.delete('accessToken');
    responseObj.cookies.delete('refreshToken');

    return responseObj;
  }
}

const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Important for sending cookies
    });

    if (response.ok) {
      // Get user info with new token
      await fetchUserInfo();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};
