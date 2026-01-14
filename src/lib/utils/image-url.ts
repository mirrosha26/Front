/**
 * Transforms image URLs from development to production environment
 * Replaces localhost URLs with production URLs based on environment
 */
export function transformImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';

  // Define the URL transformation mapping
  const DEV_URL = 'http://localhost:8000';
  const PROD_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.theveck.com:8000';

  // Only replace if it's a localhost URL
  if (imageUrl.startsWith(DEV_URL)) {
    return imageUrl.replace(DEV_URL, PROD_URL);
  }

  return imageUrl;
}

/**
 * Batch transform image URLs in an array of objects
 */
export function transformImageUrls<T extends Record<string, any>>(
  items: T[],
  urlFields: (keyof T)[]
): T[] {
  return items.map(item => {
    const transformed = { ...item };
    
    urlFields.forEach(field => {
      if (transformed[field] && typeof transformed[field] === 'string') {
        (transformed[field] as any) = transformImageUrl(transformed[field] as string);
      }
    });
    
    return transformed;
  });
}