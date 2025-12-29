/*
 * Format code conversion utilities for Excel date formatting
 */

/**
 * Default date format string used as fallback when no format code is available
 * Format: ISO 8601 date format (YYYY-MM-DD)
 */
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Built-in Excel date/time format IDs
 * IDs 14-22 are date/time formats
 */
const BUILT_IN_DATE_FORMAT_IDS = new Set([
  14, // mm/dd/yyyy
  15, // d-mmm-yy
  16, // d-mmm
  17, // mmm-yy
  18, // h:mm AM/PM
  19, // h:mm:ss AM/PM
  20, // h:mm
  21, // h:mm:ss
  22, // m/d/yy h:mm
]);

/**
 * Checks if a format ID is a built-in date/time format
 */
export function isBuiltInDateFormat(id: number): boolean {
  return BUILT_IN_DATE_FORMAT_IDS.has(id);
}

/**
 * Checks if a format code contains date/time patterns
 */
export function isDateFormatCode(formatCode: string): boolean {
  if (!formatCode) return false;

  // Remove locale prefixes like [$-409]
  const cleaned = formatCode.replace(/\[\$-\d+\]/g, '');

  // Check for duration formats (e.g., [h]:mm:ss) - these are time intervals, not dates
  if (/\[[hms]+\]/.test(cleaned)) {
    return false; // Duration formats are handled separately
  }

  // Date patterns: yyyy, yy, mm, m, dd, d, e (year - only when part of year pattern)
  // Time patterns: hh, h, mm (when preceded/followed by :), ss, am/pm
  // Year patterns: yyyy, yy, e (only when part of year pattern like "e" or "ee" or "eee" or "eeee")
  const yearPatterns = /[yY]{2,4}|(?<![a-zA-Z])e{1,4}(?![a-zA-Z])/;
  const datePatterns = /[dD]{1,2}(?![hmsHMS])|(?<![hH:])[mM]{1,4}(?![hmsHMS]|:)/;
  const timePatterns = /[hH]{1,2}(?::|$)|:[mMsS]{1,2}|[ap]m/i;

  // Check if format contains date or time patterns
  return yearPatterns.test(cleaned) || datePatterns.test(cleaned) || timePatterns.test(cleaned);
}

/**
 * Converts Excel format code to date-fns format string
 * Handles common Excel date/time format patterns
 *
 * @limitations Compact time formats without separators are not supported:
 * - hmm, hhmmss (adjacent hour/minute/second tokens without colons)
 * - Cases where 'm' appears adjacent to hour tokens may be mis-handled
 * - Elapsed time formats ([h], [m], [s]) are not supported and will be approximated or ignored
 */
export function convertExcelFormatToDateFns(excelFormat: string): string {
  if (!excelFormat) {
    return DEFAULT_DATE_FORMAT;
  }

  // Remove locale prefixes like [$-409]
  let format = excelFormat.replace(/\[\$-\d+\]/g, '');

  // Explicitly reject elapsed time formats early to avoid false confidence
  // Elapsed time formats like [h], [m], [s] represent durations, not clock times
  // They cannot be accurately converted to date-fns format strings
  if (/\[[hms]+\]/i.test(format)) {
    // Return a standard time format as approximation rather than mis-converting
    // This avoids silently producing incorrect output
    return 'HH:mm:ss';
  }

  // Handle multiple format sections separated by ; (use first section)
  const sections = format.split(';');
  format = sections[0] || format;

  // Handle text in double quotes (preserve literally)
  // Use a case-insensitive placeholder that won't be affected by toLowerCase
  const quotedParts: string[] = [];
  let quoteIndex = 0;
  format = format.replace(/"([^"]*)"/g, (match, text) => {
    const placeholder = `__QUOTE${quoteIndex}QUOTE__`;
    quotedParts.push(text);
    quoteIndex++;
    return placeholder;
  });

  // Handle escaped characters (backslash)
  const escapedParts: string[] = [];
  let escapeIndex = 0;
  format = format.replace(/\\(.)/g, (match, char) => {
    const placeholder = `__ESCAPE_${escapeIndex}__`;
    escapedParts.push(char);
    escapeIndex++;
    return placeholder;
  });

  // Convert Excel format codes to date-fns format codes
  // Use placeholders for time patterns to avoid conflicts with date patterns
  let result = format.toLowerCase();
  const timePlaceholders: string[] = [];
  let timePlaceholderIndex = 0;

  // Check if format contains am/pm to determine 12/24 hour
  const hasAmPm = /[ap]m/i.test(format);

  // Replace time patterns with placeholders first
  // AM/PM marker - replace "am/pm" or "AM/PM" as a single pattern, or individual am/pm
  if (hasAmPm) {
    // First try to replace "am/pm" or "AM/PM" as a single unit
    result = result.replace(/(am\/pm|AM\/PM)/gi, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('a');
      timePlaceholderIndex++;
      return placeholder;
    });
    // Then replace individual "am" or "pm" if they weren't part of "am/pm"
    result = result.replace(/\b(am|pm)\b/gi, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('a');
      timePlaceholderIndex++;
      return placeholder;
    });
    // If we have multiple "a" placeholders, consolidate to one
    if (timePlaceholders.filter(v => v === 'a').length > 1) {
      // Find all "a" placeholder indices
      const aIndices: number[] = [];
      timePlaceholders.forEach((v, i) => {
        if (v === 'a') aIndices.push(i);
      });
      // Keep only the first "a", remove the rest
      for (let i = aIndices.length - 1; i > 0; i--) {
        const idx = aIndices[i];
        if (idx !== undefined) {
          result = result.replace(`__TIME_${idx}__`, '');
          timePlaceholders[idx] = ''; // Mark as empty
        }
      }
    }
  }

  // Time patterns with hours and minutes (e.g., "h:mm", "hh:mm") - handle as complete units
  // This must come before individual hour/minute patterns
  if (hasAmPm) {
    // 12-hour format with minutes
    result = result.replace(/\bhh:mm(?![a-z])/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('hh:mm');
      timePlaceholderIndex++;
      return placeholder;
    });
    result = result.replace(/\bh:mm(?![a-z])/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('h:mm');
      timePlaceholderIndex++;
      return placeholder;
    });
  } else {
    // 24-hour format with minutes
    result = result.replace(/\bhh:mm(?![a-z])/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('HH:mm');
      timePlaceholderIndex++;
      return placeholder;
    });
    result = result.replace(/\bh:mm(?![a-z])/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('H:mm');
      timePlaceholderIndex++;
      return placeholder;
    });
  }

  // Minutes (when preceded by colon) - must come before month patterns
  result = result.replace(/:mm(?![a-z])/g, () => {
    const placeholder = `__TIME_${timePlaceholderIndex}__`;
    timePlaceholders.push(':mm');
    timePlaceholderIndex++;
    return placeholder;
  });
  result = result.replace(/:m(?![a-z])/g, () => {
    const placeholder = `__TIME_${timePlaceholderIndex}__`;
    timePlaceholders.push(':m');
    timePlaceholderIndex++;
    return placeholder;
  });

  // Seconds (when preceded by colon)
  result = result.replace(/:ss(?![a-z])/g, () => {
    const placeholder = `__TIME_${timePlaceholderIndex}__`;
    timePlaceholders.push(':ss');
    timePlaceholderIndex++;
    return placeholder;
  });
  result = result.replace(/:s(?![a-z])/g, () => {
    const placeholder = `__TIME_${timePlaceholderIndex}__`;
    timePlaceholders.push(':s');
    timePlaceholderIndex++;
    return placeholder;
  });

  // Hours - must come after minutes to avoid conflicts
  // Don't match "h" if it's followed by ":" (that's already handled as time)
  if (hasAmPm) {
    // 12-hour format
    result = result.replace(/\bhh\b/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('hh');
      timePlaceholderIndex++;
      return placeholder;
    });
    // Match "h" only if not followed by ":" (which would be part of time pattern)
    result = result.replace(/\bh(?![hms:]|__TIME)/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('h');
      timePlaceholderIndex++;
      return placeholder;
    });
  } else {
    // 24-hour format
    result = result.replace(/\bhh\b/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('HH');
      timePlaceholderIndex++;
      return placeholder;
    });
    // Match "h" only if not followed by ":" (which would be part of time pattern)
    result = result.replace(/\bh(?![hms:]|__TIME)/g, () => {
      const placeholder = `__TIME_${timePlaceholderIndex}__`;
      timePlaceholders.push('H');
      timePlaceholderIndex++;
      return placeholder;
    });
  }

  // Now handle date patterns (time patterns are already protected with placeholders)
  // Year patterns
  result = result.replace(/\byyyy\b|\be{4}\b/g, 'yyyy');
  result = result.replace(/\byy\b|\be{1,3}\b/g, 'yy');

  // Month patterns (safe now - time patterns are placeholders)
  result = result.replace(/\bmmmm\b/g, 'MMMM');
  result = result.replace(/\bmmm\b/g, 'MMM');
  result = result.replace(/\bmm\b/g, 'MM');
  result = result.replace(/\bm\b(?!m)/g, 'M');

  // Day patterns
  result = result.replace(/\bdddd\b/g, 'EEEE');
  result = result.replace(/\bddd\b/g, 'EEE');
  result = result.replace(/\bdd\b/g, 'dd');
  result = result.replace(/\bd\b(?!d)/g, 'd');

  // Restore time placeholders (in reverse order to avoid index conflicts)
  // Use split().join() instead of replace() for defensive coding - handles multiple occurrences
  for (let i = timePlaceholders.length - 1; i >= 0; i--) {
    const value = timePlaceholders[i];
    if (value) {
      const placeholder = `__TIME_${i}__`;
      result = result.split(placeholder).join(value);
    }
  }

  // Restore quoted text (case-insensitive replacement)
  for (let i = quotedParts.length - 1; i >= 0; i--) {
    const text = quotedParts[i];
    if (text !== undefined) {
      // Replace both uppercase and lowercase versions of the placeholder
      result = result.replace(new RegExp(`__quote${i}quote__`, 'gi'), text);
    }
  }

  // Restore escaped characters
  // Use split().join() instead of replace() for defensive coding - handles multiple occurrences
  escapedParts.forEach((char, index) => {
    if (char !== undefined) {
      const placeholder = `__ESCAPE_${index}__`;
      result = result.split(placeholder).join(char);
    }
  });

  return result;
}

/**
 * Gets the default format code for a built-in format ID
 */
export function getBuiltInFormatCode(id: number): string | null {
  const formatMap: Record<number, string> = {
    14: 'mm/dd/yyyy',
    15: 'd-mmm-yy',
    16: 'd-mmm',
    17: 'mmm-yy',
    18: 'h:mm AM/PM',
    19: 'h:mm:ss AM/PM',
    20: 'h:mm',
    21: 'h:mm:ss',
    22: 'm/d/yy h:mm',
  };

  return formatMap[id] || null;
}
