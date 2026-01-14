/**
 * Utility functions for parsing LinkedIn experience strings and calculating durations
 */

import { StructuredExperience } from '../types/cards';

interface ParsedExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  duration: string;
  durationInMonths: number;
  originalText: string;
}

interface ConsolidatedCompanyExperience {
  company: string;
  positions: ParsedExperience[];
  totalDuration: string;
  totalDurationInMonths: number;
  earliestStartDate: string;
  latestEndDate: string;
}

interface ExperienceSummary {
  totalDuration: string;
  totalDurationInMonths: number;
  consolidatedCompanies: ConsolidatedCompanyExperience[];
  individualExperiences: ParsedExperience[];
}

/**
 * Convert structured experience to parsed experience format
 */
export function convertStructuredExperience(structuredExp: StructuredExperience): ParsedExperience {
  const now = new Date();
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Handle endDate - if null or "Present", use current date
  let endDate = structuredExp.endDate;
  if (!endDate || endDate.toLowerCase() === 'present') {
    endDate = currentDate;
  }
  
  // Ensure dates are in YYYY-MM format
  const startDate = structuredExp.startDate.substring(0, 7);
  const endDateFormatted = endDate.substring(0, 7);
  
  const duration = calculateDuration(startDate, endDateFormatted);
  
  return {
    title: structuredExp.title,
    company: structuredExp.company,
    startDate,
    endDate: endDateFormatted,
    duration: duration.text,
    durationInMonths: duration.months,
    originalText: `${structuredExp.title} at ${structuredExp.company} (${startDate} to ${endDateFormatted})`
  };
}

/**
 * Parse a LinkedIn experience string and extract job details with duration
 * Expected formats:
 * 1. "Job Title at Company (start_date: YYYY-MM-DD - end_date: Present) — Description" (detailed signal card format)
 * 2. "Job Title at Company (YYYY-MM-DD - YYYY-MM-DD) — Description" (detailed signal card format without labels)
 * 2. "Job Title, Company (YYYY-MM to Present) – Description" (new LinkedIn API format with em dash)
 * 3. "Job Title, Company (YYYY-MM to Present) - Description" (new LinkedIn API format with regular dash)
 * 4. "Job Title, Company (YYYY-MM-DD to present) — Description" (LinkedIn API format with full dates and em dash)
 * 5. "Job Title, Company (YYYY-MM-DD – Present) – Location" (LinkedIn API format with full dates and double em dash)
 * 6. "Job Title, Company (Location), YYYY-MM to Present" (LinkedIn API format with location in parentheses)
 * 7. "Job Title, Company, YYYY-MM-DD – Present" (LinkedIn API format with full dates and comma separator)
 * 8. "Job Title, Company, Month YYYY – Month YYYY, Location" (LinkedIn API format with month-year dates and comma location)
 * 9. "Job Title at Company (YYYY-MM-DD – Present) | Location" (LinkedIn API format with "at" separator and pipe)
 * 10. "Job Title, Company (YYYY-MM to Present) Description" (new LinkedIn API format with space)
 * 11. "Job Title @ Company (Month YYYY - Month YYYY), Location" (LinkedIn API format with @ separator)
 * 12. "Job Title, Company (YYYY-MM to Present)" (simple API format)
 * 13. "Job Title, Company (YYYY-MM to YYYY-MM)" (simple API format)
 * 14. "Job Title, Company (Location) — YYYY-MM-DD to Present" (new API format)
 * 15. "Job Title, Company (Location) — YYYY-MM-DD to YYYY-MM-DD" (new API format)
 * 16. "Job Title, Company (Month YYYY – Month YYYY), Location" (old API format)
 * 17. "Job Title at Company (YYYY-MM to YYYY-MM)" (legacy format)
 * 18. "Job Title at Company (YYYY-MM to present)" (legacy format)
 * 19. "Job Title at Company (start_date: YYYY-MM-DD, end_date: YYYY-MM-DD) – Description" (LinkedIn API with start_date/end_date fields)
 * 20. "Job Title, Company (start_date: YYYY-MM-DD, end_date: null) – Description" (LinkedIn API with null end_date)
 * 21. "Job Title, Company (Description), Location, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD" (LinkedIn API with start_date/end_date and additional fields)
 * 22. "Job Title, Company, location=null, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD" (LinkedIn API with start_date/end_date and null location)
 * 23. "Job Title, Company (YYYY-MM-DD – Present), Location" (LinkedIn API with full dates and location)
 * 24. "Job Title, Company (Month YYYY – Month YYYY), Location" (LinkedIn API with month-year dates and location)
 * 25. "Job Title, Company — Location | YYYY-MM-DD – Present" (LinkedIn API with em dash, pipe separator, and full dates)
 * 26. "Job Title, Company — Location | YYYY-MM-DD – YYYY-MM-DD" (LinkedIn API with em dash, pipe separator, and full date range)
 * 27. "Job Title, Company (Location) — Month YYYY to Month YYYY; Description" (LinkedIn API with month-year dates and semicolon description)
 * 28. "Job Title, Company (Location) — Month YYYY–present; Description" (LinkedIn API with month-year dates, en dash, and semicolon description)
 * 29. "Job Title, Company (Location) starting YYYY-MM-DD" (LinkedIn API with starting date only)
 * 30. "Job Title, Company Location YYYY-MM-DD to present" (new LinkedIn experience format without parentheses)
 * 31. "Job Title, Company Location YYYY-MM-DD to YYYY-MM-DD" (new LinkedIn experience format without parentheses)
 * 32. "Job Title, Company (Location) – YYYY-MM to present" (LinkedIn experience format with em dash and parentheses)
 * 33. "Job Title, Company (Location) – YYYY-MM to YYYY-MM" (LinkedIn experience format with em dash and parentheses)
 * 34. "Job Title, Company (YYYY-MM-DDTHH:mm:ss+00:00 – Present) – Location | Description | Skills: ... | Achievements: ..." (Enhanced LinkedIn API format with ISO timestamps, location, and detailed information)
 * 35. "Job Title, Company (YYYY-MM-DDTHH:mm:ss+00:00 – Present) | Description | Skills: ... | Achievements: ..." (Enhanced LinkedIn API format with ISO timestamps and detailed information, no location)
 * 36. "Job Title, Company (YYYY-MM-DD – Present) – Location | Description" (Enhanced LinkedIn API format with simple dates and location)
 * 37. "Job Title, Company (YYYY-MM-DD – Present) | Description" (Enhanced LinkedIn API format with simple dates, no location)
 * 38. "Job Title, Company (Unknown – Present) – Location | Description" (Enhanced LinkedIn API format with unknown start date and location)
 */
export function parseExperienceString(experienceText: string): ParsedExperience | null {
  try {
    // Remove extra whitespace
    const text = experienceText.trim();
    
    // Try enhanced LinkedIn experience format with location: "Job Title, Company (YYYY-MM-DDTHH:mm:ss+00:00 – Present) – Location | Description | Skills: ... | Achievements: ..."
    const enhancedLinkedInWithLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2})\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2})\)\s*[–-]\s*([^|]+)\s*\|\s*(.+)$/;
    const enhancedLinkedInWithLocationMatch = text.match(enhancedLinkedInWithLocationPattern);
    
    if (enhancedLinkedInWithLocationMatch) {
      const [, title, company, startDate, endDate, location, description] = enhancedLinkedInWithLocationMatch;
      
      // Convert ISO timestamp to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      let endDateFormatted: string;
      
      if (endDate === 'Present') {
        const now = new Date();
        endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        endDateFormatted = endDate.substring(0, 7);
      }
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try enhanced LinkedIn experience format with location and simple dates: "Job Title, Company (YYYY-MM-DD – Present) – Location | Description"
    const enhancedLinkedInSimpleWithLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2}|Unknown)\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2})\)\s*[–-]\s*([^|]+)\s*\|\s*(.+)$/;
    const enhancedLinkedInSimpleWithLocationMatch = text.match(enhancedLinkedInSimpleWithLocationPattern);
    
    if (enhancedLinkedInSimpleWithLocationMatch) {
      const [, title, company, startDate, endDate, location, description] = enhancedLinkedInSimpleWithLocationMatch;
      
      // Handle "Unknown" start date
      let startDateFormatted: string;
      if (startDate === 'Unknown') {
        // Use a special marker for unknown start dates
        startDateFormatted = 'Unknown';
      } else {
        startDateFormatted = startDate.substring(0, 7);
      }
      
      let endDateFormatted: string;
      if (endDate === 'Present') {
        const now = new Date();
        endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        endDateFormatted = endDate.substring(0, 7);
      }
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try enhanced LinkedIn experience format with simple dates: "Job Title, Company (YYYY-MM-DD – Present) | Description"
    const enhancedLinkedInSimplePattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2}|Unknown)\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2})\)\s*\|\s*(.+)$/;
    const enhancedLinkedInSimpleMatch = text.match(enhancedLinkedInSimplePattern);
    
    if (enhancedLinkedInSimpleMatch) {
      const [, title, company, startDate, endDate, description] = enhancedLinkedInSimpleMatch;
      
      // Handle "Unknown" start date
      let startDateFormatted: string;
      if (startDate === 'Unknown') {
        // Use a special marker for unknown start dates
        startDateFormatted = 'unknown';
      } else {
        startDateFormatted = startDate.substring(0, 7);
      }
      
      let endDateFormatted: string;
      if (endDate === 'Present') {
        const now = new Date();
        endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        endDateFormatted = endDate.substring(0, 7);
      }
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try enhanced LinkedIn experience format without location: "Job Title, Company (YYYY-MM-DDTHH:mm:ss+00:00 – Present) | Description | Skills: ... | Achievements: ..."
    const enhancedLinkedInPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2})\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2})\)\s*\|\s*(.+)$/;
    const enhancedLinkedInMatch = text.match(enhancedLinkedInPattern);
    
    if (enhancedLinkedInMatch) {
      const [, title, company, startDate, endDate, description] = enhancedLinkedInMatch;
      
      // Convert ISO timestamp to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      let endDateFormatted: string;
      
      if (endDate === 'Present') {
        const now = new Date();
        endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        endDateFormatted = endDate.substring(0, 7);
      }
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn experience format without parentheses: "Job Title, Company Location YYYY-MM-DD to present"
    const newLinkedInNoParenthesesPresentPattern = /^(.+?),\s*(.+?)\s+(\d{4}-\d{2}-\d{2})\s+to\s+present$/;
    const newLinkedInNoParenthesesPresentMatch = text.match(newLinkedInNoParenthesesPresentPattern);
    
    if (newLinkedInNoParenthesesPresentMatch) {
      const [, title, companyWithLocation, startDate] = newLinkedInNoParenthesesPresentMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: companyWithLocation.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn experience format without parentheses: "Job Title, Company Location YYYY-MM-DD to YYYY-MM-DD"
    const newLinkedInNoParenthesesDateRangePattern = /^(.+?),\s*(.+?)\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/;
    const newLinkedInNoParenthesesDateRangeMatch = text.match(newLinkedInNoParenthesesDateRangePattern);
    
    if (newLinkedInNoParenthesesDateRangeMatch) {
      const [, title, companyWithLocation, startDate, endDate] = newLinkedInNoParenthesesDateRangeMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const endDateFormatted = endDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: companyWithLocation.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn experience format with em dash and parentheses: "Job Title, Company (Location) – YYYY-MM to present"
    const linkedInEmDashParenthesesPresentPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*–\s*(\d{4}-\d{2})\s+to\s+present$/;
    const linkedInEmDashParenthesesPresentMatch = text.match(linkedInEmDashParenthesesPresentPattern);
    
    if (linkedInEmDashParenthesesPresentMatch) {
      const [, title, company, location, startDate] = linkedInEmDashParenthesesPresentMatch;
      
      // Convert YYYY-MM to YYYY-MM format (already correct)
      const startDateFormatted = startDate;
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn experience format with em dash and parentheses: "Job Title, Company (Location) – YYYY-MM to YYYY-MM"
    const linkedInEmDashParenthesesDateRangePattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*–\s*(\d{4}-\d{2})\s+to\s+(\d{4}-\d{2})$/;
    const linkedInEmDashParenthesesDateRangeMatch = text.match(linkedInEmDashParenthesesDateRangePattern);
    
    if (linkedInEmDashParenthesesDateRangeMatch) {
      const [, title, company, location, startDate, endDate] = linkedInEmDashParenthesesDateRangeMatch;
      
      // Convert YYYY-MM to YYYY-MM format (already correct)
      const startDateFormatted = startDate;
      const endDateFormatted = endDate;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn API format with em dash and pipe separator: "Job Title, Company — Location | YYYY-MM-DD – Present"
    const newLinkedInEmDashPipePresentPattern = /^(.+?),\s*(.+?)\s*—\s*([^|]+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*[–-]\s*Present$/;
    const newLinkedInEmDashPipePresentMatch = text.match(newLinkedInEmDashPipePresentPattern);
    
    if (newLinkedInEmDashPipePresentMatch) {
      const [, title, company, location, startDate] = newLinkedInEmDashPipePresentMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn API format with em dash and pipe separator: "Job Title, Company — Location | YYYY-MM-DD – YYYY-MM-DD"
    const newLinkedInEmDashPipeDateRangePattern = /^(.+?),\s*(.+?)\s*—\s*([^|]+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*[–-]\s*(\d{4}-\d{2}-\d{2})$/;
    const newLinkedInEmDashPipeDateRangeMatch = text.match(newLinkedInEmDashPipeDateRangePattern);
    
    if (newLinkedInEmDashPipeDateRangeMatch) {
      const [, title, company, location, startDate, endDate] = newLinkedInEmDashPipeDateRangeMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const endDateFormatted = endDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn API format with month-year dates and semicolon description: "Job Title, Company (Location) — Month YYYY to Month YYYY; Description"
    const newLinkedInMonthYearSemicolonPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*—\s*([A-Za-z]{3}\s+\d{4})\s+to\s+([A-Za-z]{3}\s+\d{4});\s*(.+)$/;
    const newLinkedInMonthYearSemicolonMatch = text.match(newLinkedInMonthYearSemicolonPattern);
    
    if (newLinkedInMonthYearSemicolonMatch) {
      const [, title, company, location, startDate, endDate, description] = newLinkedInMonthYearSemicolonMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      const endDateFormatted = parseMonthYearToYYYYMM(endDate);
      
      if (startDateFormatted && endDateFormatted) {
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try new LinkedIn API format with month-year dates, en dash, and semicolon description: "Job Title, Company (Location) — Month YYYY–present; Description"
    const newLinkedInMonthYearEnDashPresentSemicolonPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*—\s*([A-Za-z]{3}\s+\d{4})–present;\s*(.+)$/;
    const newLinkedInMonthYearEnDashPresentSemicolonMatch = text.match(newLinkedInMonthYearEnDashPresentSemicolonPattern);
    
    if (newLinkedInMonthYearEnDashPresentSemicolonMatch) {
      const [, title, company, location, startDate, description] = newLinkedInMonthYearEnDashPresentSemicolonMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      if (startDateFormatted) {
        const now = new Date();
        const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try new LinkedIn API format with starting date only: "Job Title, Company (Location) starting YYYY-MM-DD"
    const newLinkedInStartingDatePattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s+starting\s+(\d{4}-\d{2}-\d{2})$/;
    const newLinkedInStartingDateMatch = text.match(newLinkedInStartingDatePattern);
    
    if (newLinkedInStartingDateMatch) {
      const [, title, company, location, startDate] = newLinkedInStartingDateMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try detailed signal card format: "Job Title at Company (start_date: YYYY-MM-DD - end_date: Present) — Description"
    const detailedSignalCardPattern = /^(.+?)\s+at\s+(.+?)\s*\(start_date:\s*(\d{4}-\d{2}-\d{2})\s*-\s*end_date:\s*(Present|\d{4}-\d{2}-\d{2})\)\s*[–-]\s*(.+)$/;
    const detailedSignalCardMatch = text.match(detailedSignalCardPattern);
    
    if (detailedSignalCardMatch) {
      const [, title, company, startDate, endDate, description] = detailedSignalCardMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }

    // Try alternative detailed signal card format with more flexible spacing
    const detailedSignalCardPatternAlt = /^(.+?)\s+at\s+(.+?)\s*\(\s*start_date:\s*(\d{4}-\d{2}-\d{2})\s*-\s*end_date:\s*(Present|\d{4}-\d{2}-\d{2})\s*\)\s*[–-]\s*(.+)$/;
    const detailedSignalCardMatchAlt = text.match(detailedSignalCardPatternAlt);
    
    if (detailedSignalCardMatchAlt) {
      const [, title, company, startDate, endDate, description] = detailedSignalCardMatchAlt;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }

    // Try detailed signal card format without start_date/end_date labels: "Job Title at Company (YYYY-MM-DD - YYYY-MM-DD) — Description"
    const detailedSignalCardNoLabelsPattern = /^(.+?)\s+at\s+(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*-\s*(Present|\d{4}-\d{2}-\d{2})\)\s*[–-]\s*(.+)$/;
    const detailedSignalCardNoLabelsMatch = text.match(detailedSignalCardNoLabelsPattern);
    
    if (detailedSignalCardNoLabelsMatch) {
      const [, title, company, startDate, endDate, description] = detailedSignalCardNoLabelsMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }

    // Try new LinkedIn API format with start_date/end_date fields first
    const newLinkedInStartEndPattern = /^(.+?)(?:\s+at\s+|\s*,\s*)(.+?)\s*\(start_date:\s*(\d{4}-\d{2}-\d{2}),\s*end_date:\s*(null|\d{4}-\d{2}-\d{2})\)(?:\s*[–-]\s*(.+))?$/;
    const newLinkedInStartEndMatch = text.match(newLinkedInStartEndPattern);
    
    if (newLinkedInStartEndMatch) {
      const [, title, company, startDate, endDate, description] = newLinkedInStartEndMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'null') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with start_date/end_date and additional fields: "Job Title, Company (Description), Location, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD"
    const newLinkedInStartEndExtendedPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*,\s*([^,]+)\s*,\s*start_date=(\d{4}-\d{2}-\d{2})\s*,\s*end_date=(null|\d{4}-\d{2}-\d{2})$/;
    const newLinkedInStartEndExtendedMatch = text.match(newLinkedInStartEndExtendedPattern);
    
    if (newLinkedInStartEndExtendedMatch) {
      const [, title, company, description, location, startDate, endDate] = newLinkedInStartEndExtendedMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'null') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with start_date/end_date and location=null: "Job Title, Company, location=null, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD"
    const newLinkedInStartEndLocationNullPattern = /^(.+?),\s*(.+?),\s*location=null\s*,\s*start_date=(\d{4}-\d{2}-\d{2})\s*,\s*end_date=(null|\d{4}-\d{2}-\d{2})$/;
    const newLinkedInStartEndLocationNullMatch = text.match(newLinkedInStartEndLocationNullPattern);
    
    if (newLinkedInStartEndLocationNullMatch) {
      const [, title, company, startDate, endDate] = newLinkedInStartEndLocationNullMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'null') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates and location: "Job Title, Company (YYYY-MM-DD – Present), Location"
    const newLinkedInFullDatesLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2})\)\s*,\s*([^,]+)$/;
    const newLinkedInFullDatesLocationMatch = text.match(newLinkedInFullDatesLocationPattern);
    
    if (newLinkedInFullDatesLocationMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInFullDatesLocationMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with month-year dates and location: "Job Title, Company (YYYY-MM – YYYY-MM), Location"
    const newLinkedInMonthYearLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2})\s*[–-]\s*(\d{4}-\d{2})\)\s*,\s*([^,]+)$/;
    const newLinkedInMonthYearLocationMatch = text.match(newLinkedInMonthYearLocationPattern);
    
    if (newLinkedInMonthYearLocationMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInMonthYearLocationMatch;
      
      const duration = calculateDuration(startDate, endDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with month-year dates and location: "Job Title, Company (Month YYYY – Month YYYY), Location"
    const newLinkedInMonthYearLocationPatternOld = /^(.+?),\s*(.+?)\s*\(([A-Za-z]{3}\s+\d{4})\s*[–-]\s*([A-Za-z]{3}\s+\d{4})\)\s*,\s*([^,]+)$/;
    const newLinkedInMonthYearLocationMatchOld = text.match(newLinkedInMonthYearLocationPatternOld);
    
    if (newLinkedInMonthYearLocationMatchOld) {
      const [, title, company, startDate, endDate, location] = newLinkedInMonthYearLocationMatchOld;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      const endDateFormatted = parseMonthYearToYYYYMM(endDate);
      
      if (startDateFormatted && endDateFormatted) {
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with month-year dates without location: "Job Title, Company (YYYY-MM – YYYY-MM)"
    const newLinkedInMonthYearNoLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2})\s*[–-]\s*(\d{4}-\d{2})\)$/;
    const newLinkedInMonthYearNoLocationMatch = text.match(newLinkedInMonthYearNoLocationPattern);
    
    if (newLinkedInMonthYearNoLocationMatch) {
      const [, title, company, startDate, endDate] = newLinkedInMonthYearNoLocationMatch;
      
      const duration = calculateDuration(startDate, endDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates without location: "Job Title, Company (YYYY-MM-DD – Present)"
    const newLinkedInFullDatesNoLocationPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*[–-]\s*(Present|\d{4}-\d{2}-\d{2})\)$/;
    const newLinkedInFullDatesNoLocationMatch = text.match(newLinkedInFullDatesNoLocationPattern);
    
    if (newLinkedInFullDatesNoLocationMatch) {
      const [, title, company, startDate, endDate] = newLinkedInFullDatesNoLocationMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with em dash separator: "Job Title, Company — Month YYYY - Month YYYY; Location"
    const newLinkedInEmDashPattern = /^(.+?),\s*(.+?)\s*—\s*([A-Za-z]{3}\s+\d{4})\s*-\s*([A-Za-z]{3}\s+\d{4});\s*(.+)$/;
    const newLinkedInEmDashMatch = text.match(newLinkedInEmDashPattern);
    
    if (newLinkedInEmDashMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInEmDashMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      const endDateFormatted = parseMonthYearToYYYYMM(endDate);
      
      if (startDateFormatted && endDateFormatted) {
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with em dash separator and Present: "Job Title, Company — Month YYYY - Present; Location"
    const newLinkedInEmDashPresentPattern = /^(.+?),\s*(.+?)\s*—\s*([A-Za-z]{3}\s+\d{4})\s*-\s*Present;\s*(.+)$/;
    const newLinkedInEmDashPresentMatch = text.match(newLinkedInEmDashPresentPattern);
    
    if (newLinkedInEmDashPresentMatch) {
      const [, title, company, startDate, location] = newLinkedInEmDashPresentMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      if (startDateFormatted) {
        const now = new Date();
        const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with full dates and description: "Job Title, Company (YYYY-MM-DD – YYYY-MM-DD) — Description"
    const newLinkedInFullDatesDescriptionPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*[–-]\s*(\d{4}-\d{2}-\d{2})\)\s*—\s*(.+)$/;
    const newLinkedInFullDatesDescriptionMatch = text.match(newLinkedInFullDatesDescriptionPattern);
    
    if (newLinkedInFullDatesDescriptionMatch) {
      const [, title, company, startDate, endDate, description] = newLinkedInFullDatesDescriptionMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const endDateFormatted = endDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates and Present and description: "Job Title, Company (YYYY-MM-DD – Present) — Description"
    const newLinkedInFullDatesPresentDescriptionPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*[–-]\s*Present\)\s*—\s*(.+)$/;
    const newLinkedInFullDatesPresentDescriptionMatch = text.match(newLinkedInFullDatesPresentDescriptionPattern);
    
    if (newLinkedInFullDatesPresentDescriptionMatch) {
      const [, title, company, startDate, description] = newLinkedInFullDatesPresentDescriptionMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with en dash separator: "Job Title, Company — Month YYYY–Month YYYY; Location. Description"
    const newLinkedInEnDashPattern = /^(.+?),\s*(.+?)\s*—\s*([A-Za-z]{3}\s+\d{4})–([A-Za-z]{3}\s+\d{4});\s*(.+?)\.\s*(.+)$/;
    const newLinkedInEnDashMatch = text.match(newLinkedInEnDashPattern);
    
    if (newLinkedInEnDashMatch) {
      const [, title, company, startDate, endDate, location, description] = newLinkedInEnDashMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      const endDateFormatted = parseMonthYearToYYYYMM(endDate);
      
      if (startDateFormatted && endDateFormatted) {
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with en dash separator and Present: "Job Title, Company — Month YYYY–Present; Location. Description"
    const newLinkedInEnDashPresentPattern = /^(.+?),\s*(.+?)\s*—\s*([A-Za-z]{3}\s+\d{4})–Present;\s*(.+?)\.\s*(.+)$/;
    const newLinkedInEnDashPresentMatch = text.match(newLinkedInEnDashPresentPattern);
    
    if (newLinkedInEnDashPresentMatch) {
      const [, title, company, startDate, location, description] = newLinkedInEnDashPresentMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      if (startDateFormatted) {
        const now = new Date();
        const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with en dash separator and Present (no description): "Job Title, Company — Month YYYY–Present; Location"
    const newLinkedInEnDashPresentNoDescPattern = /^(.+?),\s*(.+?)\s*—\s*([A-Za-z]{3}\s+\d{4})–Present;\s*(.+)$/;
    const newLinkedInEnDashPresentNoDescMatch = text.match(newLinkedInEnDashPresentNoDescPattern);
    
    if (newLinkedInEnDashPresentNoDescMatch) {
      const [, title, company, startDate, location] = newLinkedInEnDashPresentNoDescMatch;
      
      // Convert Month YYYY to YYYY-MM format
      const startDateFormatted = parseMonthYearToYYYYMM(startDate);
      if (startDateFormatted) {
        const now = new Date();
        const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
        return {
          title: title.trim(),
          company: company.trim(),
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try LinkedIn API format with start date only: "Job Title, Company (start date YYYY-MM-DD)"
    const newLinkedInStartDateOnlyPattern = /^(.+?),\s*(.+?)\s*\(start date (\d{4}-\d{2}-\d{2})\)$/;
    const newLinkedInStartDateOnlyMatch = text.match(newLinkedInStartDateOnlyPattern);
    
    if (newLinkedInStartDateOnlyMatch) {
      const [, title, company, startDate] = newLinkedInStartDateOnlyMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const now = new Date();
      const endDateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with date range using "to": "Job Title, Company (YYYY-MM-DD to YYYY-MM-DD)"
    const newLinkedInDateRangeToPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\)$/;
    const newLinkedInDateRangeToMatch = text.match(newLinkedInDateRangeToPattern);
    
    if (newLinkedInDateRangeToMatch) {
      const [, title, company, startDate, endDate] = newLinkedInDateRangeToMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const endDateFormatted = endDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with dash separator and date range: "Job Title - Company (YYYY-MM-DD to YYYY-MM-DD)"
    const newLinkedInDashSeparatorDateRangePattern = /^(.+?)\s*-\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\)$/;
    const newLinkedInDashSeparatorDateRangeMatch = text.match(newLinkedInDashSeparatorDateRangePattern);
    
    if (newLinkedInDashSeparatorDateRangeMatch) {
      const [, title, company, startDate, endDate] = newLinkedInDashSeparatorDateRangeMatch;
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      const endDateFormatted = endDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, endDateFormatted);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try new LinkedIn API format first: "Job Title, Company (YYYY-MM to Present) – Description"
    const newLinkedInPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2})\s+to\s+(Present|\d{4}-\d{2})\)\s*[–-]\s*(.+)$/;
    const newLinkedInMatch = text.match(newLinkedInPattern);
    
    if (newLinkedInMatch) {
      const [, title, company, startDate, endDate, description] = newLinkedInMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const duration = calculateDuration(startDate, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with @ separator: "Job Title @ Company (Month YYYY - Month YYYY), Location"
    const newLinkedInAtPattern = /^(.+?)\s+@\s+(.+?)\s*\(([^)]+)\)(?:,\s*(.+))?$/;
    const newLinkedInAtMatch = text.match(newLinkedInAtPattern);
    
    if (newLinkedInAtMatch) {
      const [, title, company, dateRange, location] = newLinkedInAtMatch;
      
      // Parse the date range (Month YYYY - Month YYYY)
      const dates = parseMonthYearDateRange(dateRange);
      if (!dates) {
        return null;
      }
      
      const duration = calculateDuration(dates.startDate, dates.endDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: dates.startDate,
        endDate: dates.endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates: "Job Title, Company (YYYY-MM-DD to present) — Description"
    const newLinkedInFullDatePattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s+to\s+(present|\d{4}-\d{2}-\d{2})\)\s*—\s*(.+)$/;
    const newLinkedInFullDateMatch = text.match(newLinkedInFullDatePattern);
    
    if (newLinkedInFullDateMatch) {
      const [, title, company, startDate, endDate, description] = newLinkedInFullDateMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates and em dash: "Job Title, Company (YYYY-MM-DD – Present) – Location"
    const newLinkedInFullDateEmDashPattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*–\s*(Present|\d{4}-\d{2}-\d{2})\)\s*–\s*(.+)$/;
    const newLinkedInFullDateEmDashMatch = text.match(newLinkedInFullDateEmDashPattern);
    
    if (newLinkedInFullDateEmDashMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInFullDateEmDashMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with location in parentheses: "Job Title, Company (Location), YYYY-MM to Present"
    const newLinkedInLocationParenthesesPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*,\s*(\d{4}-\d{2})\s+to\s+(Present|\d{4}-\d{2})$/;
    const newLinkedInLocationParenthesesMatch = text.match(newLinkedInLocationParenthesesPattern);
    
    if (newLinkedInLocationParenthesesMatch) {
      const [, title, company, location, startDate, endDate] = newLinkedInLocationParenthesesMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const duration = calculateDuration(startDate, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with full dates and comma location: "Job Title, Company, YYYY-MM-DD – Present"
    const newLinkedInFullDateCommaLocationPattern = /^(.+?),\s*(.+?)\s*,\s*(\d{4}-\d{2}-\d{2})\s*–\s*(Present|\d{4}-\d{2}-\d{2})$/;
    const newLinkedInFullDateCommaLocationMatch = text.match(newLinkedInFullDateCommaLocationPattern);
    
    if (newLinkedInFullDateCommaLocationMatch) {
      const [, title, company, startDate, endDate] = newLinkedInFullDateCommaLocationMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with month-year dates and comma location: "Job Title, Company, Month YYYY – Month YYYY, Location"
    const newLinkedInMonthYearCommaLocationPattern = /^(.+?),\s*(.+?)\s*,\s*([^,]+)\s*–\s*([^,]+)\s*,\s*(.+)$/;
    const newLinkedInMonthYearCommaLocationMatch = text.match(newLinkedInMonthYearCommaLocationPattern);
    
    if (newLinkedInMonthYearCommaLocationMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInMonthYearCommaLocationMatch;
      
      // Parse the month-year dates
      const startDateParsed = parseMonthYearToYYYYMM(startDate);
      const endDateParsed = parseMonthYearToYYYYMM(endDate);
      
      if (!startDateParsed || !endDateParsed) {
        return null;
      }
      
      const duration = calculateDuration(startDateParsed, endDateParsed);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateParsed,
        endDate: endDateParsed,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try LinkedIn API format with "at" separator and pipe: "Job Title at Company (YYYY-MM-DD – Present) | Location"
    const newLinkedInAtPipePattern = /^(.+?)\s+at\s+(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*–\s*(Present|\d{4}-\d{2}-\d{2})\)\s*\|\s*(.+)$/;
    const newLinkedInAtPipeMatch = text.match(newLinkedInAtPipePattern);
    
    if (newLinkedInAtPipeMatch) {
      const [, title, company, startDate, endDate, location] = newLinkedInAtPipeMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Convert YYYY-MM-DD to YYYY-MM format
        finalEndDate = endDate.substring(0, 7);
      }
      
      // Convert YYYY-MM-DD to YYYY-MM format
      const startDateFormatted = startDate.substring(0, 7);
      
      const duration = calculateDuration(startDateFormatted, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: startDateFormatted,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
   // Try LinkedIn API format with space separator: "Job Title, Company (YYYY-MM to Present) Description"
    const newLinkedInSpacePattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2})\s+to\s+(Present|\d{4}-\d{2})\)\s+(.+)$/;
    const newLinkedInSpaceMatch = text.match(newLinkedInSpacePattern);
    
    if (newLinkedInSpaceMatch) {
      const [, title, company, startDate, endDate, description] = newLinkedInSpaceMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const duration = calculateDuration(startDate, finalEndDate);
        
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try simple API format: "Job Title, Company (YYYY-MM to Present)"
    const simpleApiPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)$/;
    const simpleApiMatch = text.match(simpleApiPattern);
    
    if (simpleApiMatch) {
      const [, title, company, dateRange] = simpleApiMatch;
      
      // Check if this is a simple date range format (YYYY-MM to YYYY-MM or YYYY-MM to Present)
      const simpleDatePattern = /^(\d{4}-\d{2})\s+to\s+(Present|\d{4}-\d{2})$/;
      const simpleDateMatch = dateRange.match(simpleDatePattern);
      
      if (simpleDateMatch) {
        const [, startDate, endDate] = simpleDateMatch;
        
        let finalEndDate = endDate;
        if (endDate.toLowerCase() === 'present') {
          const now = new Date();
          finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const duration = calculateDuration(startDate, finalEndDate);
          
        return {
          title: title.trim(),
          company: company.trim(),
          startDate,
          endDate: finalEndDate,
          duration: duration.text,
          durationInMonths: duration.months,
          originalText: experienceText
        };
      }
    }
    
    // Try alternative simple format: "Job Title, Company (YYYY-MM to YYYY-MM)" without extra spaces
    const altSimplePattern = /^(.+?),\s*(.+?)\s*\((\d{4}-\d{2})\s+to\s+(Present|\d{4}-\d{2})\)$/;
    const altSimpleMatch = text.match(altSimplePattern);
    
    if (altSimpleMatch) {
      const [, title, company, startDate, endDate] = altSimpleMatch;
      
      let finalEndDate = endDate;
      if (endDate.toLowerCase() === 'present') {
        const now = new Date();
        finalEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const duration = calculateDuration(startDate, finalEndDate);
      
      return {
        title: title.trim(),
        company: company.trim(),
        startDate,
        endDate: finalEndDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }

    // Try new API format: "Job Title, Company (Location) — YYYY-MM-DD to Present"
    const newApiPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*—\s*([^;]+?)(?:;\s*(.+))?$/;
    const newApiMatch = text.match(newApiPattern);
    
    if (newApiMatch) {
      const [, title, company, location, dateRange, description] = newApiMatch;
      
      // Parse the date range
      const dates = parseDateRangeNewAPI(dateRange);
      if (!dates) {
        return null;
      }
      
      const duration = calculateDuration(dates.startDate, dates.endDate);
      
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: dates.startDate,
        endDate: dates.endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try old API format: "Job Title, Company (Month YYYY – Month YYYY), Location"
    const oldApiPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)(?:,\s*(.+))?$/;
    const oldApiMatch = text.match(oldApiPattern);
    
    if (oldApiMatch) {
      const [, title, company, dateRange, location] = oldApiMatch;
      
      // Parse the date range
      const dates = parseDateRangeAPI(dateRange);
      if (!dates) {
        return null;
      }
      
      const duration = calculateDuration(dates.startDate, dates.endDate);
      
      return {
        title: title.trim(),
        company: company.trim(),
        startDate: dates.startDate,
        endDate: dates.endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    // Try legacy format: "Job Title at Company (YYYY-MM to YYYY-MM)"
    const legacyPattern = /\(([^)]+)\)$/;
    const legacyMatch = text.match(legacyPattern);
    
    if (legacyMatch) {
      const dateRange = legacyMatch[1];
      const titleCompanyPart = text.replace(legacyPattern, '').trim();
      
      // Parse the date range
      const dates = parseDateRange(dateRange);
      if (!dates) {
        return null;
      }
      
      // Extract title and company
      const atIndex = titleCompanyPart.lastIndexOf(' at ');
      if (atIndex === -1) {
        return null;
      }
      
      const title = titleCompanyPart.substring(0, atIndex).trim();
      const company = titleCompanyPart.substring(atIndex + 4).trim();
      
      const duration = calculateDuration(dates.startDate, dates.endDate);
      
      return {
        title,
        company,
        startDate: dates.startDate,
        endDate: dates.endDate,
        duration: duration.text,
        durationInMonths: duration.months,
        originalText: experienceText
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing experience string:', error);
    return null;
  }
}

/**
 * Parse date range string like "2022-01 to 2025-05" or "2025-06 to present"
 */
function parseDateRange(dateRange: string): { startDate: string; endDate: string } | null {
  try {
    const parts = dateRange.split(' to ');
    if (parts.length !== 2) {
      return null;
    }
    
    const startDate = parts[0].trim();
    let endDate = parts[1].trim();
    
    // Handle "present" case
    if (endDate.toLowerCase() === 'present') {
      const now = new Date();
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    // Validate date formats (YYYY-MM)
    const dateRegex = /^\d{4}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return null;
    }
    
    return { startDate, endDate };
  } catch (error) {
    return null;
  }
}

/**
 * Parse new API date range string like "2025-06-01 to Present" or "2024-06-01 to 2025-06-01"
 */
function parseDateRangeNewAPI(dateRange: string): { startDate: string; endDate: string } | null {
  try {
    const parts = dateRange.split(' to ').map(part => part.trim());
    if (parts.length !== 2) {
      return null;
    }
    
    const startDate = parts[0];
    let endDate = parts[1];
    
    // Handle "Present" case
    if (endDate.toLowerCase() === 'present') {
      const now = new Date();
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    // Validate date formats (YYYY-MM-DD or YYYY-MM)
    const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return null;
    }
    
    // Convert YYYY-MM-DD to YYYY-MM format
    const startDateFormatted = startDate.substring(0, 7);
    const endDateFormatted = endDate.substring(0, 7);
    
    return { startDate: startDateFormatted, endDate: endDateFormatted };
  } catch (error) {
    return null;
  }
}

/**
 * Parse month-year date range string like "Nov 2024 - Present" or "May 2019 - Aug 2024"
 */
function parseMonthYearDateRange(dateRange: string): { startDate: string; endDate: string } | null {
  try {
    // Handle "Present" case
    if (dateRange.toLowerCase().includes('present')) {
      const parts = dateRange.split('-').map(part => part.trim());
      if (parts.length !== 2) {
        return null;
      }
      
      const startDate = parseMonthYearToYYYYMM(parts[0]);
      if (!startDate) {
        return null;
      }
      
      const now = new Date();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      return { startDate, endDate };
    }
    
    // Handle regular date ranges like "May 2019 - Aug 2024"
    const parts = dateRange.split('-').map(part => part.trim());
    if (parts.length !== 2) {
      return null;
    }
    
    const startDate = parseMonthYearToYYYYMM(parts[0]);
    const endDate = parseMonthYearToYYYYMM(parts[1]);
    
    if (!startDate || !endDate) {
      return null;
    }
    
    return { startDate, endDate };
  } catch (error) {
    return null;
  }
}

/**
 * Parse API date range string like "Sept 2024 – Present" or "Apr 2020 – Jun 2024"
 */
function parseDateRangeAPI(dateRange: string): { startDate: string; endDate: string } | null {
  try {
    // Handle "Present" case
    if (dateRange.toLowerCase().includes('present')) {
      const parts = dateRange.split('–').map(part => part.trim());
      if (parts.length !== 2) {
        return null;
      }
      
      const startDate = parseMonthYearToYYYYMM(parts[0]);
      if (!startDate) {
        return null;
      }
      
      const now = new Date();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      return { startDate, endDate };
    }
    
    // Handle regular date ranges like "Apr 2020 – Jun 2024"
    const parts = dateRange.split('–').map(part => part.trim());
    if (parts.length !== 2) {
      return null;
    }
    
    const startDate = parseMonthYearToYYYYMM(parts[0]);
    const endDate = parseMonthYearToYYYYMM(parts[1]);
    
    if (!startDate || !endDate) {
      return null;
    }
    
    return { startDate, endDate };
  } catch (error) {
    return null;
  }
}

/**
 * Convert month year format like "Sept 2024" to "2024-09"
 */
function parseMonthYearToYYYYMM(monthYear: string): string | null {
  const monthMap: Record<string, number> = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };
  
  try {
    const parts = monthYear.trim().split(' ');
    if (parts.length !== 2) {
      return null;
    }
    
    const monthStr = parts[0].toLowerCase();
    const yearStr = parts[1];
    
    const month = monthMap[monthStr];
    const year = parseInt(yearStr, 10);
    
    if (!month || isNaN(year) || year < 1900 || year > 2100) {
      return null;
    }
    
    return `${year}-${String(month).padStart(2, '0')}`;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate duration between two dates in YYYY-MM format
 */
function calculateDuration(startDate: string, endDate: string): { text: string; months: number } {
  try {
    // Handle unknown start dates
    if (startDate === 'unknown') {
      return { text: 'Duration unknown', months: 0 };
    }
    
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const [endYear, endMonth] = endDate.split('-').map(Number);
    
    const startDateObj = new Date(startYear, startMonth - 1);
    const endDateObj = new Date(endYear, endMonth - 1);
    
    // Calculate difference in months
    const diffInMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    
    if (diffInMonths < 0) {
      return { text: 'Invalid duration', months: 0 };
    }
    
    // Format duration text
    const years = Math.floor(diffInMonths / 12);
    const months = diffInMonths % 12;
    
    let durationText = '';
    if (years > 0) {
      durationText += `${years} year${years === 1 ? '' : 's'}`;
      if (months > 0) {
        durationText += `, ${months} month${months === 1 ? '' : 's'}`;
      }
    } else if (months > 0) {
      durationText = `${months} month${months === 1 ? '' : 's'}`;
    } else {
      durationText = 'Less than 1 month';
    }
    
    return { text: durationText, months: diffInMonths };
  } catch (error) {
    return { text: 'Duration unavailable', months: 0 };
  }
}

/**
 * Format experience with duration for display
 */
export function formatExperienceWithDuration(experienceText: string): string {
  const parsed = parseExperienceString(experienceText);
  
  if (!parsed) {
    return experienceText; // Return original text if parsing fails
  }
  
  // Format: "Job Title at Company (YYYY-MM to YYYY-MM) • Duration"
  const dateRange = `${parsed.startDate} to ${parsed.endDate === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? 'present' : parsed.endDate}`;
  
  return `${parsed.title} at ${parsed.company} (${dateRange}) • ${parsed.duration}`;
}

/**
 * Get all parsed experiences with calculated durations
 */
export function parseAllExperiences(experiences: string[] | StructuredExperience[]): ParsedExperience[] {
  return experiences
    .map(exp => {
      // Check if it's a structured experience or string
      if (typeof exp === 'string') {
        return parseExperienceString(exp);
      } else {
        return convertStructuredExperience(exp);
      }
    })
    .filter((parsed): parsed is ParsedExperience => parsed !== null);
}

/**
 * Calculate total experience duration across all experiences
 */
export function calculateTotalExperienceDuration(experiences: string[] | StructuredExperience[]): ExperienceSummary {
  const parsedExperiences = parseAllExperiences(experiences);
  
  if (parsedExperiences.length === 0) {
    return {
      totalDuration: 'No experience data',
      totalDurationInMonths: 0,
      consolidatedCompanies: [],
      individualExperiences: []
    };
  }

  // Sort experiences with Present experiences first, then by start date (most recent first)
  const sortedExperiences = parsedExperiences.sort((a, b) => {
    // Check if either experience is current (Present)
    const aIsCurrent = a.endDate === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const bIsCurrent = b.endDate === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    
    // If one is current and the other isn't, current comes first
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;
    
    // If both are current or both are past, sort by start date (most recent first)
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB.getTime() - dateA.getTime(); // Reverse chronological order
  });

  // Group experiences by company, but split if there are gaps
  const companyGroups: Record<string, ParsedExperience[]> = {};
  
  sortedExperiences.forEach(exp => {
    const companyKey = exp.company.toLowerCase().trim();
    
    if (!companyGroups[companyKey]) {
      companyGroups[companyKey] = [];
    }
    
    const existingGroup = companyGroups[companyKey];
    
    // Check if this experience should be part of the existing group or start a new one
    if (existingGroup.length > 0) {
      const lastExp = existingGroup[existingGroup.length - 1];
      
      // Check for gaps - if there's more than 1 month gap, create a new group
      const lastEndDate = new Date(lastExp.endDate);
      const currentStartDate = new Date(exp.startDate);
      const gapInMonths = (currentStartDate.getFullYear() - lastEndDate.getFullYear()) * 12 + 
                         (currentStartDate.getMonth() - lastEndDate.getMonth());
      
      // If there's a gap of more than 1 month, create a new company entry
      if (gapInMonths > 1) {
        // Create a new group with a unique key
        const newKey = `${companyKey}_${exp.startDate}`;
        companyGroups[newKey] = [exp];
      } else {
        // Add to existing group
        existingGroup.push(exp);
      }
    } else {
      // First experience for this company
      existingGroup.push(exp);
    }
  });

  // Create consolidated company experiences
  const consolidatedCompanies: ConsolidatedCompanyExperience[] = Object.entries(companyGroups).map(([key, companyExps]) => {
    // Sort by start date (earliest first for display)
    const sortedExps = companyExps.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    const earliestStart = sortedExps[0].startDate;
    const latestEnd = sortedExps[sortedExps.length - 1].endDate;
    
    // Calculate total duration for this company period
    const totalDuration = calculateDuration(earliestStart, latestEnd);
    
    // Extract company name (remove the date suffix if present)
    const companyName = key.includes('_') ? key.split('_')[0] : key;
    
    return {
      company: companyExps[0].company, // Use the first occurrence's company name
      positions: sortedExps,
      totalDuration: totalDuration.text,
      totalDurationInMonths: totalDuration.months,
      earliestStartDate: earliestStart,
      latestEndDate: latestEnd
    };
  });

  // Sort companies by most recent start date first
  consolidatedCompanies.sort((a, b) => {
    const dateA = new Date(a.earliestStartDate);
    const dateB = new Date(b.earliestStartDate);
    return dateB.getTime() - dateA.getTime(); // Reverse chronological order
  });

  // Calculate overall total duration
  const totalMonths = consolidatedCompanies.reduce((sum, company) => sum + company.totalDurationInMonths, 0);
  const totalDuration = formatDurationFromMonths(totalMonths);

  return {
    totalDuration,
    totalDurationInMonths: totalMonths,
    consolidatedCompanies,
    individualExperiences: sortedExperiences // Return sorted experiences
  };
}

/**
 * Format duration from total months
 */
function formatDurationFromMonths(totalMonths: number): string {
  if (totalMonths <= 0) {
    return 'No experience';
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let durationText = '';
  if (years > 0) {
    durationText += `${years} year${years === 1 ? '' : 's'}`;
    if (months > 0) {
      durationText += `, ${months} month${months === 1 ? '' : 's'}`;
    }
  } else if (months > 0) {
    durationText = `${months} month${months === 1 ? '' : 's'}`;
  } else {
    durationText = 'Less than 1 month';
  }

  return durationText;
}

/**
 * Get experience summary for display
 */
export function getExperienceSummary(experiences: string[] | StructuredExperience[]): {
  totalDuration: string;
  companiesCount: number;
  hasMultiplePositions: boolean;
} {
  const summary = calculateTotalExperienceDuration(experiences);
  
  return {
    totalDuration: summary.totalDuration,
    companiesCount: summary.consolidatedCompanies.length,
    hasMultiplePositions: summary.consolidatedCompanies.some(company => company.positions.length > 1)
  };
}

/**
 * Test function to verify detailed signal card experience format parsing
 * This can be called from browser console for testing
 */
export function testDetailedSignalCardExperienceParsing() {
  const testDetailedExperiences = [
    "Founder at Stealth (start_date: 2025-07-01 - end_date: Present) — High-signal data.",
    "Strategic Project Management Consultant at Scale AI (2024-02-01 - 2025-07-01) — San Francisco, California, United States",
    "Software Engineer Intern at Microsoft (2023-05-01 - 2023-07-01) — Redmond, Washington, United States",
    "Software Development Engineer Intern at Expedia Group (2022-07-01 - 2022-09-01) — Seattle, Washington, United States",
    "Sales Advisor at Tesla (2021-11-01 - 2022-01-01) — Corte Madera, California, United States",
    "Software Engineering Intern - TIDAL Lab at Northwestern University (2020-06-01 - 2020-08-01) — Evanston, Illinois, United States"
  ];

  console.log('Testing Detailed Signal Card Experience format parsing:');
  const summary = calculateTotalExperienceDuration(testDetailedExperiences);
  console.log('Detailed Signal Card Experience Summary:', summary);
  
  // Test individual parsing
  testDetailedExperiences.forEach((exp, index) => {
    const parsed = parseExperienceString(exp);
    console.log(`\nDetailed Experience ${index + 1}:`, exp);
    console.log('Parsed Result:', parsed);
  });
}

/**
 * Test function to verify structured experience format parsing
 * This can be called from browser console for testing
 */
export function testStructuredExperienceParsing() {
  const testStructuredExperiences: StructuredExperience[] = [
    {
      title: "Founder",
      company: "Stealth",
      startDate: "2025-07-01",
      endDate: null,
      location: "San Francisco, California, United States",
      description: "High-signal data."
    },
    {
      title: "Strategic Project Management Consultant",
      company: "Scale AI",
      startDate: "2024-02-01",
      endDate: "2025-07-01",
      location: "San Francisco, California, United States"
    },
    {
      title: "Software Engineer Intern",
      company: "Microsoft",
      startDate: "2023-05-01",
      endDate: "2023-07-01",
      location: "Redmond, Washington, United States"
    },
    {
      title: "Software Development Engineer Intern",
      company: "Expedia Group",
      startDate: "2022-07-01",
      endDate: "2022-09-01",
      location: "Seattle, Washington, United States"
    },
    {
      title: "Sales Advisor",
      company: "Tesla",
      startDate: "2021-11-01",
      endDate: "2022-01-01",
      location: "Corte Madera, California, United States"
    },
    {
      title: "Software Engineering Intern - TIDAL Lab",
      company: "Northwestern University",
      startDate: "2020-06-01",
      endDate: "2020-08-01",
      location: "Evanston, Illinois, United States"
    }
  ];

  console.log('Testing Structured Experience format parsing:');
  const summary = calculateTotalExperienceDuration(testStructuredExperiences);
  console.log('Structured Experience Summary:', summary);
  
  // Test individual conversion
  testStructuredExperiences.forEach((exp, index) => {
    const converted = convertStructuredExperience(exp);
    console.log(`\nStructured Experience ${index + 1}:`, exp);
    console.log('Converted to Parsed:', converted);
  });
}

/**
 * Test function to verify LinkedIn API format parsing
 * This can be called from browser console for testing
 */
export function testLinkedInParsing() {
  const testCases = [
    // Format 26: "Job Title, Company (Location) starting YYYY-MM-DD" (LinkedIn API with starting date only)
    "Co-Founder & CEO, Stealth (San Francisco, CA) starting 2025-06-01",
    
    // Format 24: "Job Title, Company (Location) — Month YYYY to Month YYYY; Description" (LinkedIn API with month-year dates and semicolon description)
    "Co-Founder, Stealth (San Francisco, CA) — Aug 2025–present; YC F25",
    "Machine Learning Engineer, Walmart Global Tech (New York, NY) — Jan 2023 to Aug 2025; worked on Search Experience and Reranking, synthetic data generation and verification with open source LLMs, embeddings, and CTR prediction models",
    "Machine Learning Intern, Walmart Global Tech (New York, NY) — Jun 2022 to Aug 2022; price prediction models using BERT-based models; returned after summer to join Walmart full time",
    "Machine Learning Researcher, Mindgram (Washington, DC-Baltimore Area) — Jan 2021 to May 2021; designed NER resolution system and SRL model to extract structured data from unstructured text",
    "Machine Learning Engineer, University of Stellenbosch (South Africa) — Sep 2020 to Dec 2020; implemented BERT-based classifiers and data processing pipelines; web-scraped large datasets",
    
    // Format 22: "Job Title, Company — Location | YYYY-MM-DD – Present" (LinkedIn API with em dash, pipe separator, and full dates)
    "Co-Founder, Stealth Startup — San Francisco, California, United States | 2024-06-01 – Present",
    "Fung Fellow (Conservation & Sustainability + Innovation), Fung Fellowship at UC Berkeley — Berkeley, California, United States | 2025-03-01 – Present",
    "Course Staff - CS 194/294-196(Agentic AI), UC Berkeley EECS — Berkeley, California, United States | 2025-08-01 – Present",
    "Head Graduate Student Instructor-UGBA 102B(Managerial Accounting), Haas School of Business, UC Berkeley — Berkeley, California, United States | 2024-06-01 – Present",
    "Consultant, TAMID Group at UC Berkeley — Berkeley, California, United States | 2025-02-01 – Present",
    "Alumni, Z Fellows — Berkeley, California, United States | 2022-07-01 – Present",
    
    // Format 23: "Job Title, Company — Location | YYYY-MM-DD – YYYY-MM-DD" (LinkedIn API with em dash, pipe separator, and full date range)
    "Machine Learning Intern, Tower Research Capital — London, United Kingdom | 2025-05-01 – 2025-08-01",
    "Technical Consultant, Wakka — (location not specified) | 2025-02-01 – 2025-05-01",
    "Vice President of Integration, Tools — Berlin, Germany | 2023-02-01 – 2025-03-01",
    "VP SigEp Learning Community, SigEp at Cal (CA Alpha) — Berkeley, California, United States | 2024-10-01 – 2025-02-01",
    "Founding Father, SigEp at Cal (CA Alpha) — Berkeley, California, United States | 2024-09-01 – 2025-02-01",
    "Recruitment Committee, SigEp at Cal (CA Alpha) — Berkeley, California, United States | 2024-09-01 – 2024-11-01",
    "Member Experience Committee, Growth & Equity Club Berkeley — Berkeley, California, United States | 2024-02-01 – 2024-12-01",
    "Founder, India Head, and Chandigarh Tricity Incharge, Errands for Elders — Panchkula, Haryana | 2020-03-01 – 2024-06-01",
    "Spring Intern, Haas Finance Alliance — Berkeley, California, United States | 2024-02-01 – 2024-05-01",
    "Chief Business Officer, AURA Cafe: Coffee, Tea, & Boba — San Francisco, California, United States | 2022-12-01 – 2023-05-01",
    "Founder & CEO, Quantify — Location not specified | 2022-02-01 – 2023-02-01",
    "Venture Capital Analysts, EntryLevel — Location not specified | 2022-10-01 – 2022-11-01",
    "Product Management, EntryLevel — Location not specified | 2022-10-01 – 2022-11-01",
    "Associate Editor, The Undergraduate Journal of Psychology at Berkeley — Berkeley, California, United States | 2022-01-01 – 2022-08-01",
    "Founder & CEO, Ecosphere — India | 2020-06-01 – 2022-08-01",
    "Course Staff - CS 10, UC Berkeley EECS — Berkeley, California, United States | 2022-01-01 – 2022-05-01",
    "Co-Founder, CTO, TheSimpleConvoShow — Location not specified | 2020-12-01 – 2021-04-01",
    
    // Format 16: "Job Title at Company (start_date: YYYY-MM-DD, end_date: YYYY-MM-DD) – Description" (LinkedIn API with start_date/end_date fields)
    "Founder at Stealth (start_date: 2025-08-01, end_date: null)",
    "Entrepreneur in Residence, Entrepreneurs First (start_date: 2025-03-01, end_date: 2025-07-01) – LD25 cyber security & AI",
    "Co-Founder, CTO, experial (start_date: 2023-09-01, end_date: 2024-12-01) – Built synthetic twins of people using real social media profiles; raised $2.4M",
    "Co-Founder, Contrarian (now MarketMirror) (start_date: 2023-01-01, end_date: 2023-09-01) – Provided customer insights from 1.15B social media conversations",
    "Software Engineer, Aleph Alpha (start_date: 2022-05-01, end_date: 2022-12-01) – Worked on infrastructure and application layer for pre-trained LLMs",
    
    // Format 17: "Job Title, Company (Description), Location, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD" (LinkedIn API with start_date/end_date and additional fields)
    "Co-Founder, Stealth AI Startup (Sports Analytics), New York, United States, start_date=2025-09-01, end_date=null",
    "Founder, Sickle Cell Knowledge And Information Network, New York, United States, start_date=2024-12-01, end_date=null",
    "Senior Product Manager, Google, New York, United States, start_date=2025-04-01, end_date=2025-08-01",
    "Product Manager, Google, New York, United States, start_date=2023-11-01, end_date=2025-04-01",
    
    // Format 18: "Job Title, Company, location=null, start_date=YYYY-MM-DD, end_date=YYYY-MM-DD" (LinkedIn API with start_date/end_date and null location)
    "Finance Manager, Google, location=null, start_date=2023-09-01, end_date=2023-11-01",
    "Finance Manager, Google, location=null, start_date=2022-05-01, end_date=2023-02-01",
    
    // Format 19: "Job Title, Company (YYYY-MM-DD – Present), Location" (LinkedIn API with full dates and location)
    "Co-Founder, Stealth Startup (2025-07-01 – Present), Toronto, Canada",
    "Founder in Residence, Antler (2025-03-01 – 2025-06-01), Toronto, Canada",
    "Data Scientist, Square (2023-03 – 2025-03), Toronto, Canada",
    "Data Scientist, Meta (2021-05 – 2023-02), Menlo Park, California, United States",
    "Data Scientist, Uber (2018-09 – 2021-04), Toronto, Canada",
    "Founding Data Scientist/Engineer, Shared Inc (2016-10 – 2018-09), Toronto, Canada",
    "Co-op and Internship, NVIDIA (2013-01 – 2015-08), US & Canada",
    "Assistant Instructor, University of Toronto (2019-01 – 2019-07), Toronto, Canada Area",
    
    // Format 20: "Job Title, Company (YYYY-MM-DD – Present), Location" (LinkedIn API with full dates and location)
    "Staff Engineer at Google (2016-10-01 – 2023-10-01) | Uber tech lead Google Cloud services infrastructure",
    
    // Format 21: "Job Title, Company — Month YYYY - Month YYYY; Location" (LinkedIn API with em dash separator)
    "CEO, Stealth Startup (Stealth Startup) — Aug 2025 - Present; New York, NY, United States",
    "Co-Founder (YC X25), MindFort AI (YC X25) — Apr 2025 - Jul 2025; San Francisco, CA, United States",
    "Graduate Student Researcher, University of California, Berkeley — May 2024 - May 2025; Berkeley, CA",
    "Senior Software Engineer, Salesforce — Aug 2023 - May 2024; San Francisco, CA, United States",
    "Software Engineer, Salesforce — Aug 2021 - Jul 2023; San Francisco, CA, United States",
    
    // Format 22: "Job Title, Company (YYYY-MM-DD – YYYY-MM-DD) — Description" (LinkedIn API with full dates and description)
    "CEO and Co-Founder, Stealth AI Startup (2025-07-01 – Present) — United States",
    "Vice President of Product & Engineering, Tenable (2023-05-01 – 2025-04-01) — Led global product management and engineering for security platforms including AI/Exploitation detection",
    "Vice President, Sysdig (2022-09-01 – 2023-04-01) — Led cloud security product and data platform initiatives",
    "Director Of Engineering, CrowdStrike (2020-01-01 – 2022-09-01) — Led cloud security product orgs (CNAPP, CSPM, KSPM, IaC)",
    "Senior Director of Engineering (GTM), Blizzard Entertainment (2018-01-01 – 2019-01-01) — Led engineering for cloud platform, data analytics and APIs",
    
    // Format 23: "Job Title, Company — Month YYYY–Month YYYY; Location. Description" (LinkedIn API with en dash separator)
    "Founder, Stealth Startup (AI Infrastructure) — Aug 2025–Present; Amsterdam, Netherlands. Leading a stealth AI infrastructure startup focused on building secure, scalable foundations for GenAI adoption in large enterprises.",
    "Senior Engineering Manager, Booking.com — Jul 2022–Aug 2025; Amsterdam Area. Led 50+ engineers across 5+ teams; re-architected a 25-year-old Reservation Platform into a GDPR/SoX/DMA-compliant AWS Serverless stack; DMA compliance initiative across 100+ systems; built Internal Mobility Program reaching 4000+ tech professionals.",
    "Engineering Manager II, Uber — May 2021–Jun 2022; Amsterdam Area. Led a cross-functional team of 18; replatforming and migrations; mentored ICs toward Staff/EM tracks.",
    "Engineering Manager, Booking.com — Jan 2017–May 2021; Amsterdam Area, Netherlands. Led security and fraud-prevention engineering; built Vault-based secrets management; ML-powered credential-stuffing prevention; promoted architectural review culture.",
    
    // Format 24: "Job Title, Company (start date YYYY-MM-DD)" and "Job Title, Company (YYYY-MM-DD to YYYY-MM-DD)" (LinkedIn API with start date only and date ranges)
    "Co-Founder, stealth agentic AI company (start date 2025-07-01)",
    "CEO, co-founder, board member, RemixAI (2023-08-01 to 2025-04-01)",
    "CEO, co-founder, board member, The Easy Company (2021-11-01 to 2023-08-01)",
    "CFO & COO, Outdoorsy (2021-01-01 to 2021-07-01)",
    "CEO - Jelli, iHeartMedia (2019-01-01 to 2021-01-01)",
    "CEO, co-founder, board member, Jelli, Inc. (2008-09-01 to 2018-12-01)",
    "Director Business Development - Tellme, Microsoft (2007-03-01 to 2008-09-01)",
    "SVP Business Development & Strategy, Loudeye (2000-01-01 to 2006-02-01)",
    
    // Format 27: "Job Title @ Company (Month YYYY - Month YYYY), Location"
    "Co-founder & CEO @ Stealth Mode (Nov 2024 - Present), Dublin, Ireland",
    "Group Product Manager @ Google Assistant, Google (May 2019 - Aug 2024), Dublin, Ireland",
    "Product Manager @ Google Cloud AI, Google (May 2017 - Apr 2019), San Francisco Bay Area",
    "Data Science Tech Lead @ Google Cloud Revenue Growth, Google (Jan 2014 - May 2017), San Francisco Bay Area",
    
    // Format 28: Simple format without description
    "Software Engineer Intern, Rivian and Volkswagen Group Technologies (2025-05 to 2025-08) – Owned automated SIL testing infra; built plotting library; improved AGS reliability; location Irvine, California.",
    "Machine Learning Engineer, SomeIdea AI (2025-03 to 2025-06) – Built multi-agent systems, vector database, RAG pipelines; Python.",
    "CS 61A Academic Intern, UC Berkeley EECS (2025-01 to 2025-05) – Taught/assisted course; Berkeley, California.",
    "Battery R&D Lead, Formula Electric at Berkeley (2024-05 to 2025-01) – Led development of wire-bonded battery pack, cooling design, and materials.",
    "Battery R&D Engineer, Formula Electric at Berkeley (2023-09 to 2024-08) – Designed 600V Li-ion pack; thermal and electrical analyses; Python modeling.",
    "Algorithm & Full Stack Engineer Intern, Ki (2024-05 to 2024-08) – Drone path planning; Python, Flask, React; Toronto, Canada."
  ];

  console.log('Testing LinkedIn API format parsing:');
  testCases.forEach((testCase, index) => {
    const result = parseExperienceString(testCase);
    console.log(`\nTest ${index + 1}:`);
    console.log('Input:', testCase);
    console.log('Result:', result);
  });

  // Test the full experience summary calculation
  const summary = calculateTotalExperienceDuration(testCases);
  console.log('\nFull Experience Summary:', summary);
}
