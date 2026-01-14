export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

/**
 * Converts a date to American format (MM/DD/YYYY) for GraphQL filters
 * @param date - Date object, string, or number
 * @returns Formatted date string in MM/DD/YYYY format or empty string if invalid
 */
export function formatDateForGraphQL(
  date: Date | string | number | undefined
): string {
  if (!date) return '';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();
    
    return `${month}/${day}/${year}`;
  } catch (_err) {
    return '';
  }
}

/**
 * Converts a European date format (DD.MM.YYYY) to American format (MM/DD/YYYY)
 * @param europeanDate - Date string in DD.MM.YYYY format
 * @returns Date string in MM/DD/YYYY format or empty string if invalid
 */
export function convertEuropeanToAmericanDate(europeanDate: string): string {
  if (!europeanDate) return '';

  try {
    // Handle DD.MM.YYYY format
    const parts = europeanDate.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    }
    
    // If it's already in a different format, try to parse it as a date
    const date = new Date(europeanDate);
    if (!isNaN(date.getTime())) {
      return formatDateForGraphQL(date);
    }
    
    return '';
  } catch (_err) {
    return '';
  }
}

/**
 * Converts a European date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD) for GraphQL
 * @param europeanDate - Date string in DD.MM.YYYY format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export function convertEuropeanToISODate(europeanDate: string): string {
  if (!europeanDate) return '';

  try {
    // Handle DD.MM.YYYY format
    const parts = europeanDate.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // If it's already in a different format, try to parse it as a date
    const date = new Date(europeanDate);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  } catch (_err) {
    return '';
  }
}
