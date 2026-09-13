/**
 * PDFSimplify — Client-Side PDF Comparison Engine
 * Compares two PDF documents in-browser: page counts, textual differences,
 * added/removed words, and structural metrics. 100% local, zero backend.
 */

import { getPdfJs } from './pdf-renderer';

export interface PageDiffSummary {
  pageNumber: number;
  wordsA: number;
  wordsB: number;
  addedWords: string[];
  removedWords: string[];
  similarityScore: number; // 0 - 100
  dimensionsMatch?: boolean;
  rotationsMatch?: boolean;
  hasGeometryDifference?: boolean;
  wordOrderMatches?: boolean;
}

export interface DocumentComparisonResult {
  docAName: string;
  docBName: string;
  pageCountA: number;
  pageCountB: number;
  totalWordsA: number;
  totalWordsB: number;
  overallSimilarityScore: number;
  similarityScore: number;
  identical: boolean;
  totalAddedWordsCount: number;
  totalRemovedWordsCount: number;
  hasGeometryDifferences: boolean;
  hasOrderDifferences: boolean;
  pageDiffs: PageDiffSummary[];
  durationMs: number;
}

export async function comparePdfDocuments(
  fileA: File | ArrayBuffer | Uint8Array | { name?: string; buffer?: ArrayBuffer; bytes?: Uint8Array },
  fileB: File | ArrayBuffer | Uint8Array | { name?: string; buffer?: ArrayBuffer; bytes?: Uint8Array }
): Promise<DocumentComparisonResult> {
  const startTime = Date.now();

  const toBuffer = async (input: File | ArrayBuffer | Uint8Array | { name?: string; buffer?: ArrayBuffer; bytes?: Uint8Array }): Promise<{ name: string; buffer: ArrayBuffer }> => {
    if (input instanceof File) {
      return { name: input.name, buffer: await input.arrayBuffer() };
    }
    if (input instanceof Uint8Array) {
      return { name: 'document.pdf', buffer: input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer };
    }
    if (input instanceof ArrayBuffer) {
      return { name: 'document.pdf', buffer: input };
    }
    if (input && typeof input === 'object') {
      const name = (input as { name?: string }).name || 'document.pdf';
      if ('bytes' in input && (input as { bytes?: Uint8Array }).bytes instanceof Uint8Array) {
        const b = (input as { bytes: Uint8Array }).bytes;
        return { name, buffer: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer };
      }
      if ('buffer' in input && (input as { buffer?: ArrayBuffer }).buffer instanceof ArrayBuffer) {
        return { name, buffer: (input as { buffer: ArrayBuffer }).buffer };
      }
    }
    return { name: 'document.pdf', buffer: input as unknown as ArrayBuffer };
  };

  const [resA, resB] = await Promise.all([toBuffer(fileA), toBuffer(fileB)]);
  const nameA = resA.name;
  const nameB = resB.name;
  const bufferA = resA.buffer;
  const bufferB = resB.buffer;

  const pdfjs = await getPdfJs();
  const taskA = pdfjs.getDocument({ data: new Uint8Array(bufferA.slice(0)) });
  const taskB = pdfjs.getDocument({ data: new Uint8Array(bufferB.slice(0)) });
  const [pdfA, pdfB] = await Promise.all([taskA.promise, taskB.promise]);

  try {
    const pageCountA = pdfA.numPages;
    const pageCountB = pdfB.numPages;
  const maxPages = Math.max(pageCountA, pageCountB);

  const pageDiffs: PageDiffSummary[] = [];
  let totalWordsA = 0;
  let totalWordsB = 0;
  let totalAddedCount = 0;
  let totalRemovedCount = 0;
  let totalMatchingCount = 0;
  let hasGeometryDifferences = pageCountA !== pageCountB;
  let hasOrderDifferences = false;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    let textA = '';
    let textB = '';
    let dimMatch = true;
    let rotMatch = true;

    if (pageNum <= pageCountA && pageNum <= pageCountB) {
      const [pageA, pageB] = await Promise.all([pdfA.getPage(pageNum), pdfB.getPage(pageNum)]);
      const vpA = pageA.getViewport({ scale: 1.0 });
      const vpB = pageB.getViewport({ scale: 1.0 });

      dimMatch = Math.abs(vpA.width - vpB.width) < 1.0 && Math.abs(vpA.height - vpB.height) < 1.0;
      rotMatch = vpA.rotation === vpB.rotation;

      const [contentA, contentB] = await Promise.all([pageA.getTextContent(), pageB.getTextContent()]);
      textA = contentA.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      textB = contentB.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
    } else if (pageNum <= pageCountA) {
      const pageA = await pdfA.getPage(pageNum);
      const contentA = await pageA.getTextContent();
      textA = contentA.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      dimMatch = false;
      rotMatch = false;
    } else if (pageNum <= pageCountB) {
      const pageB = await pdfB.getPage(pageNum);
      const contentB = await pageB.getTextContent();
      textB = contentB.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      dimMatch = false;
      rotMatch = false;
    }

    if (!dimMatch || !rotMatch) {
      hasGeometryDifferences = true;
    }

    const tokensA = textA
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ''))
      .filter((w) => w.length > 0);

    const tokensB = textB
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ''))
      .filter((w) => w.length > 0);

    totalWordsA += tokensA.length;
    totalWordsB += tokensB.length;

    // Word frequency maps
    const freqA = new Map<string, number>();
    for (const w of tokensA) freqA.set(w, (freqA.get(w) || 0) + 1);

    const freqB = new Map<string, number>();
    for (const w of tokensB) freqB.set(w, (freqB.get(w) || 0) + 1);

    const addedWords: string[] = [];
    const removedWords: string[] = [];
    let pageMatching = 0;

    for (const [word, countA] of freqA.entries()) {
      const countB = freqB.get(word) || 0;
      if (countB > 0) {
        pageMatching += Math.min(countA, countB);
      }
      if (countA > countB) {
        for (let i = 0; i < countA - countB; i++) {
          if (removedWords.length < 30) removedWords.push(word);
        }
      }
    }

    for (const [word, countB] of freqB.entries()) {
      const countA = freqA.get(word) || 0;
      if (countB > countA) {
        for (let i = 0; i < countB - countA; i++) {
          if (addedWords.length < 30) addedWords.push(word);
        }
      }
    }

    totalMatchingCount += pageMatching;
    totalAddedCount += addedWords.length;
    totalRemovedCount += removedWords.length;

    const pageTotal = tokensA.length + tokensB.length;
    const similarity =
      pageTotal > 0 ? Math.round(((2 * pageMatching) / pageTotal) * 100) : 100;

    const wordOrderMatches = tokensA.join(' ') === tokensB.join(' ');
    if (!wordOrderMatches) {
      hasOrderDifferences = true;
    }

    pageDiffs.push({
      pageNumber: pageNum,
      wordsA: tokensA.length,
      wordsB: tokensB.length,
      addedWords,
      removedWords,
      similarityScore: similarity,
      dimensionsMatch: dimMatch,
      rotationsMatch: rotMatch,
      hasGeometryDifference: !dimMatch || !rotMatch,
      wordOrderMatches,
    });
  }

  const grandTotalWords = totalWordsA + totalWordsB;
  const overallSimilarity =
    grandTotalWords > 0
      ? Math.round(((2 * totalMatchingCount) / grandTotalWords) * 100)
      : pageCountA === pageCountB
      ? 100
      : 0;

  const identical =
    overallSimilarity === 100 &&
    pageCountA === pageCountB &&
    totalAddedCount === 0 &&
    totalRemovedCount === 0 &&
    !hasGeometryDifferences &&
    !hasOrderDifferences;

  return {
      docAName: nameA,
      docBName: nameB,
      pageCountA,
      pageCountB,
      totalWordsA,
      totalWordsB,
      overallSimilarityScore: overallSimilarity,
      similarityScore: overallSimilarity,
      identical,
      totalAddedWordsCount: totalAddedCount,
      totalRemovedWordsCount: totalRemovedCount,
      hasGeometryDifferences,
      hasOrderDifferences,
      pageDiffs,
      durationMs: Date.now() - startTime,
    };
  } finally {
    await Promise.allSettled([
      pdfA.cleanup(),
      pdfB.cleanup(),
      taskA.destroy(),
      taskB.destroy(),
    ]);
  }
}
