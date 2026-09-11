/**
 * iLikePDF — Shared Coordinate-Aware Table Detector
 * Analyzes positional text coordinates from PDF pages, clusters text items
 * into visual rows and column anchors, and produces structured 2D cell grids.
 */

export interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedCell {
  text: string;
  colIndex: number;
  rowIndex: number;
  x: number;
  y: number;
  width: number;
  isNumeric?: boolean;
}

export interface ExtractedRow {
  y: number;
  cells: string[];
}

export interface ExtractedTable {
  pageNumber: number;
  headers?: string[];
  rows: string[][];
  columnCount: number;
}

/**
 * Cluster raw text items into rows based on vertical coordinate proximity.
 */
export function clusterIntoRows(items: RawTextItem[], yTolerance = 4): RawTextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: RawTextItem[][] = [];

  for (const item of sorted) {
    let placed = false;
    for (const row of rows) {
      const avgY = row.reduce((sum, it) => sum + it.y, 0) / row.length;
      if (Math.abs(item.y - avgY) <= yTolerance) {
        row.push(item);
        row.sort((a, b) => a.x - b.x);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([item]);
    }
  }

  // Sort rows vertically from top to bottom
  return rows.sort((a, b) => {
    const avgA = a.reduce((s, it) => s + it.y, 0) / a.length;
    const avgB = b.reduce((s, it) => s + it.y, 0) / b.length;
    return avgA - avgB;
  });
}

/**
 * Detect column anchor positions across all clustered rows.
 */
export function detectColumnAnchors(rows: RawTextItem[][], colTolerance = 18): number[] {
  const allXCoords: number[] = [];
  for (const row of rows) {
    for (const item of row) {
      allXCoords.push(item.x);
    }
  }

  allXCoords.sort((a, b) => a - b);
  const anchors: number[] = [];

  for (const x of allXCoords) {
    let matched = false;
    for (let i = 0; i < anchors.length; i++) {
      if (Math.abs(x - anchors[i]) <= colTolerance) {
        // Average the anchor position for smoother alignment
        anchors[i] = (anchors[i] + x) / 2;
        matched = true;
        break;
      }
    }
    if (!matched) {
      anchors.push(x);
    }
  }

  return anchors.sort((a, b) => a - b);
}

/**
 * Map clustered rows into a 2D string grid aligned to column anchors.
 */
export function alignRowsToColumns(rows: RawTextItem[][], colAnchors: number[]): string[][] {
  if (colAnchors.length === 0) {
    return rows.map((r) => [r.map((it) => it.str).join(' ')]);
  }

  return rows.map((row) => {
    const cells: string[] = new Array(colAnchors.length).fill('');

    for (const item of row) {
      // Find closest column anchor
      let bestCol = 0;
      let minDiff = Infinity;
      for (let c = 0; c < colAnchors.length; c++) {
        const diff = Math.abs(item.x - colAnchors[c]);
        if (diff < minDiff) {
          minDiff = diff;
          bestCol = c;
        }
      }

      if (cells[bestCol]) {
        cells[bestCol] += ' ' + item.str.trim();
      } else {
        cells[bestCol] = item.str.trim();
      }
    }

    // Trim trailing empty cells for cleaner table representations
    let lastNonEmpty = cells.length - 1;
    while (lastNonEmpty >= 0 && !cells[lastNonEmpty]) {
      lastNonEmpty--;
    }

    return lastNonEmpty >= 0 ? cells.slice(0, lastNonEmpty + 1) : [''];
  });
}
