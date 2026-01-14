import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      console.error('Authorization token is missing');
      return NextResponse.json(
        { success: false, message: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Check content type to determine if it's JSON or FormData
    const contentType = request.headers.get('content-type') || '';

    let response: Response;

    if (contentType.includes('application/json')) {
      // Handle JSON request (for deletion)
      const jsonData = await request.json();
      
      console.log(
        'Sending JSON request to backend with auth token:',
        accessToken ? `${accessToken.substring(0, 10)}...` : 'missing'
      );
      console.log('JSON data:', jsonData);

      // Send JSON request to backend
      response = await fetch(`${config.api.user.endpoints.updateProfile}`, {
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

      // Check for avatar file
      const avatarFile = formData.get('avatar') as File | null;

      // Create new FormData object for backend
      const backendFormData = new FormData();

      // Add text fields
      if (formData.has('first_name')) {
        backendFormData.append(
          'first_name',
          formData.get('first_name') as string
        );
      }

      if (formData.has('last_name')) {
        backendFormData.append('last_name', formData.get('last_name') as string);
      }

      if (formData.has('user_type')) {
        backendFormData.append('user_type', formData.get('user_type') as string);
      }

      // Add avatar file if exists
      if (avatarFile && avatarFile.size > 0) {
        backendFormData.append('avatar', avatarFile);
      }

      console.log(
        'Sending FormData request to backend with auth token:',
        accessToken ? `${accessToken.substring(0, 10)}...` : 'missing'
      );
      console.log('Form data:', Object.fromEntries(formData.entries()));

      // Send request to backend
      response = await fetch(`${config.api.user.endpoints.updateProfile}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
          // Don't set Content-Type as it will be automatically set with boundary for multipart/form-data
        },
        body: backendFormData
      });
    }

    // Get response from backend
    const data = await response.json();

    console.log('Backend response:', data);

    // If update successful, get updated user profile
    if (response.ok && data.success) {
      console.log('Profile update successful, getting updated user data');

      // Get updated user profile
      const profileResponse = await fetch(
        `${config.api.user.endpoints.profile}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      console.log('Profile response status:', profileResponse.status);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log(
          'Received profile data:',
          JSON.stringify(profileData).substring(0, 200) + '...'
        );

        // Check data structure
        const userData = profileData.data?.user || profileData.user;
        console.log(
          'Extracted user data:',
          userData
            ? JSON.stringify(userData).substring(0, 200) + '...'
            : 'not found'
        );

        // Return updated user data with response
        return NextResponse.json(
          {
            success: true,
            message: data.message || 'Profile successfully updated',
            data: {
              user: userData
            }
          },
          { status: 200 }
        );
      } else {
        console.error(
          'Failed to get updated profile:',
          await profileResponse.text()
        );
      }
    }

    // Return response to client if failed to get updated profile
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обращении к серверу'
      },
      { status: 500 }
    );
  }
}
