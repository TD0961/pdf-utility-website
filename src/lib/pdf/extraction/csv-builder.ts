/**
 * iLikePDF — Standard CSV Builder
 * Formats 2D string matrix into RFC 4180 compliant CSV text.
 */

export interface CsvBuilderOptions {
  delimiter?: ',' | ';' | '\t';
  lineTerminator?: '\r\n' | '\n';
  alwaysQuote?: boolean;
}

/**
 * Escapes an individual CSV cell value according to RFC 4180 rules.
 */
export function escapeCsvCell(val: string, delimiter: string, alwaysQuote = false): string {
  if (val === null || val === undefined) {
    return '';
  }

  const str = String(val);
  const needsQuotes =
    alwaysQuote ||
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    // Double-up existing double quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts a 2D string array into a compliant CSV string.
 */
export function buildCsvFromGrid(
  grid: string[][],
  options: CsvBuilderOptions = {}
): string {
  const delimiter = options.delimiter || ',';
  const terminator = options.lineTerminator || '\n';
  const alwaysQuote = options.alwaysQuote || false;

  return grid
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter, alwaysQuote)).join(delimiter))
    .join(terminator);
}
