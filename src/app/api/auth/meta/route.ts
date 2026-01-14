import { NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function GET() {
  try {

    const response = await fetch(config.api.auth.endpoints.meta, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Disable caching
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const responseData = await response.json();

    // Check data structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid API response format');
    }

    // Check if success and data exist in response
    if (
      responseData.success &&
      responseData.data &&
      responseData.data.user_types
    ) {

      // Use data from success/data structure
      const transformedData = {
        user_types: responseData.data.user_types
      };

      return NextResponse.json(transformedData);
    }

    // If no success/data structure, check for user_types directly
    if (responseData.user_types && Array.isArray(responseData.user_types)) {

      const transformedData = {
        user_types: responseData.user_types
      };

      return NextResponse.json(transformedData);
    }

    const defaultData = {
      user_types: [
        { value: 'VC', label: 'Venture Capital' },
        { value: 'PE', label: 'Private Equity' },
        { value: 'OTHER', label: 'Other' }
      ]
    };

    return NextResponse.json(defaultData);
  } catch (error) {
    console.error('API route handler: Error fetching metadata:', error);

    // Return default data in case of error
    const defaultData = {
      user_types: [
        { value: 'VC', label: 'Venture Capital' },
        { value: 'PE', label: 'Private Equity' },
        { value: 'OTHER', label: 'Other' }
      ]
    };

    return NextResponse.json(defaultData);
  }
}
