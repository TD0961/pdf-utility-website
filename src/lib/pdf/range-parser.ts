/**
 * PDF Page Range Parser and Validator
 * Production-grade parser with strict validation against pathological input,
 * negative numbers, zero, NaN, Infinity, and malformed range expressions.
 * Supports syntax like "1-5, 8, 11-14".
 */

export interface ParsedRangeGroup {
  label: string; // e.g., "pages-1-5" or "page-8"
  pageIndices: number[]; // 0-based unique page indices for this range group
  originalExpression: string; // e.g., "1-5"
}

export interface RangeParseResult {
  valid: boolean;
  error?: string;
  groups: ParsedRangeGroup[];
  allPageIndices: number[]; // Flat list of all unique selected page indices (sorted, deduplicated)
}

const MAX_INPUT_LENGTH = 2000;
const MAX_RANGE_SEGMENTS = 200;
const MAX_EXPANDED_PAGES_PER_RANGE = 5000;

/**
 * Parses and strictly validates a page range string against a total page count.
 *
 * @param input Raw user input string (e.g. "1-5, 8, 11-14")
 * @param totalPages The total number of pages in the PDF document
 */
export function parsePageRanges(input: string, totalPages: number): RangeParseResult {
  if (totalPages <= 0 || !Number.isSafeInteger(totalPages)) {
    return {
      valid: false,
      error: 'Invalid document: page count must be a positive integer.',
      groups: [],
      allPageIndices: [],
    };
  }

  if (typeof input !== 'string') {
    return {
      valid: false,
      error: 'Range input must be a string.',
      groups: [],
      allPageIndices: [],
    };
  }

  // Guard against pathological string length / CPU denial-of-service
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Range expression exceeds maximum allowed length of ${MAX_INPUT_LENGTH} characters.`,
      groups: [],
      allPageIndices: [],
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter at least one page number or range.',
      groups: [],
      allPageIndices: [],
    };
  }

  // Check for consecutive, leading, or trailing commas
  if (trimmed.startsWith(',')) {
    return {
      valid: false,
      error: 'Invalid syntax: range expression cannot begin with a comma.',
      groups: [],
      allPageIndices: [],
    };
  }

  if (trimmed.endsWith(',')) {
    return {
      valid: false,
      error: 'Invalid syntax: range expression cannot end with a trailing comma.',
      groups: [],
      allPageIndices: [],
    };
  }

  if (trimmed.includes(',,')) {
    return {
      valid: false,
      error: 'Invalid syntax: consecutive commas (",,") detected. Please remove extra commas.',
      groups: [],
      allPageIndices: [],
    };
  }

  const rawSegments = trimmed.split(',');

  if (rawSegments.length > MAX_RANGE_SEGMENTS) {
    return {
      valid: false,
      error: `Too many range segments (${rawSegments.length}). Maximum allowed is ${MAX_RANGE_SEGMENTS}.`,
      groups: [],
      allPageIndices: [],
    };
  }

  const groups: ParsedRangeGroup[] = [];
  const globalSeenIndices = new Set<number>();

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i].trim();

    if (!segment) {
      return {
        valid: false,
        error: 'Invalid syntax: empty range segment detected between commas.',
        groups: [],
        allPageIndices: [],
      };
    }

    // Check for range with dash '-'
    if (segment.includes('-')) {
      if (segment.startsWith('-')) {
        return {
          valid: false,
          error: `Invalid range: "${segment}". Missing starting page number before dash.`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (segment.endsWith('-')) {
        return {
          valid: false,
          error: `Invalid range: "${segment}". Missing ending page number after dash.`,
          groups: [],
          allPageIndices: [],
        };
      }

      const parts = segment.split('-');
      if (parts.length > 2) {
        return {
          valid: false,
          error: `Invalid range format: "${segment}". Multiple dashes found. Use "start-end" (e.g. 1-5).`,
          groups: [],
          allPageIndices: [],
        };
      }

      const startStr = parts[0].trim();
      const endStr = parts[1].trim();

      // Ensure purely positive integer digits (rejects decimals, scientific notation, negative signs)
      if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) {
        return {
          valid: false,
          error: `Invalid page numbers in range: "${segment}". Page numbers must be positive integers.`,
          groups: [],
          allPageIndices: [],
        };
      }

      const start = Number(startStr);
      const end = Number(endStr);

      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        return {
          valid: false,
          error: `Page numbers in range "${segment}" exceed safe integer limits.`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (start <= 0 || end <= 0) {
        return {
          valid: false,
          error: `Page numbers must be 1 or greater. Found "${segment}".`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (start > end) {
        return {
          valid: false,
          error: `Inverted range: "${segment}". Start page (${start}) cannot be greater than end page (${end}).`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (end - start > MAX_EXPANDED_PAGES_PER_RANGE) {
        return {
          valid: false,
          error: `Range "${segment}" contains too many pages (${end - start + 1}). Maximum is ${MAX_EXPANDED_PAGES_PER_RANGE} pages per segment.`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (end > totalPages) {
        return {
          valid: false,
          error: `Page ${end} does not exist in this PDF. The document only has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`,
          groups: [],
          allPageIndices: [],
        };
      }

      const indices: number[] = [];
      for (let p = start; p <= end; p++) {
        const zeroIndex = p - 1;
        indices.push(zeroIndex);
        globalSeenIndices.add(zeroIndex);
      }

      groups.push({
        label: start === end ? `page-${start}` : `pages-${start}-${end}`,
        pageIndices: indices,
        originalExpression: segment,
      });
    } else {
      // Single page number
      if (!/^\d+$/.test(segment)) {
        return {
          valid: false,
          error: `Invalid page number: "${segment}". Must be a positive integer.`,
          groups: [],
          allPageIndices: [],
        };
      }

      const pageNum = Number(segment);

      if (!Number.isSafeInteger(pageNum)) {
        return {
          valid: false,
          error: `Page number "${segment}" exceeds safe integer limits.`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (pageNum <= 0) {
        return {
          valid: false,
          error: `Page numbers must be 1 or greater. Found "${segment}".`,
          groups: [],
          allPageIndices: [],
        };
      }

      if (pageNum > totalPages) {
        return {
          valid: false,
          error: `Page ${pageNum} does not exist in this PDF. The document only has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`,
          groups: [],
          allPageIndices: [],
        };
      }

      const zeroIndex = pageNum - 1;
      globalSeenIndices.add(zeroIndex);

      groups.push({
        label: `page-${pageNum}`,
        pageIndices: [zeroIndex],
        originalExpression: segment,
      });
    }
  }

  const allPageIndices = Array.from(globalSeenIndices).sort((a, b) => a - b);

  return {
    valid: true,
    groups,
    allPageIndices,
  };
}
