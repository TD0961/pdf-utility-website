/**
 * iLikePDF — Client-Side PDF Comparison Engine
 * Compares two PDF documents in-browser: page counts, textual differences,
 * added/removed words, and structural metrics. 100% local, zero backend.
 */

import { getPdfDocument } from './pdf-renderer';

export interface PageDiffSummary {
  pageNumber: number;
  wordsA: number;
  wordsB: number;
  addedWords: string[];
  removedWords: string[];
  similarityScore: number; // 0 - 100
}

export interface DocumentComparisonResult {
  docAName: string;
  docBName: string;
  pageCountA: number;
  pageCountB: number;
  totalWordsA: number;
  totalWordsB: number;
  overallSimilarityScore: number;
  totalAddedWordsCount: number;
  totalRemovedWordsCount: number;
  pageDiffs: PageDiffSummary[];
  durationMs: number;
}

export async function comparePdfDocuments(
  fileA: File | { name: string; buffer: ArrayBuffer },
  fileB: File | { name: string; buffer: ArrayBuffer }
): Promise<DocumentComparisonResult> {
  const startTime = Date.now();

  const nameA = fileA instanceof File ? fileA.name : fileA.name;
  const nameB = fileB instanceof File ? fileB.name : fileB.name;

  const bufferA = fileA instanceof File ? await fileA.arrayBuffer() : fileA.buffer;
  const bufferB = fileB instanceof File ? await fileB.arrayBuffer() : fileB.buffer;

  const [pdfA, pdfB] = await Promise.all([
    getPdfDocument(bufferA),
    getPdfDocument(bufferB),
  ]);

  const pageCountA = pdfA.numPages;
  const pageCountB = pdfB.numPages;
  const maxPages = Math.max(pageCountA, pageCountB);

  const pageDiffs: PageDiffSummary[] = [];
  let totalWordsA = 0;
  let totalWordsB = 0;
  let totalAddedCount = 0;
  let totalRemovedCount = 0;
  let totalMatchingCount = 0;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    let textA = '';
    let textB = '';

    if (pageNum <= pageCountA) {
      const pageA = await pdfA.getPage(pageNum);
      const contentA = await pageA.getTextContent();
      textA = contentA.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
    }

    if (pageNum <= pageCountB) {
      const pageB = await pdfB.getPage(pageNum);
      const contentB = await pageB.getTextContent();
      textB = contentB.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
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

    pageDiffs.push({
      pageNumber: pageNum,
      wordsA: tokensA.length,
      wordsB: tokensB.length,
      addedWords,
      removedWords,
      similarityScore: similarity,
    });
  }

  const grandTotalWords = totalWordsA + totalWordsB;
  const overallSimilarity =
    grandTotalWords > 0
      ? Math.round(((2 * totalMatchingCount) / grandTotalWords) * 100)
      : pageCountA === pageCountB
      ? 100
      : 0;

  return {
    docAName: nameA,
    docBName: nameB,
    pageCountA,
    pageCountB,
    totalWordsA,
    totalWordsB,
    overallSimilarityScore: overallSimilarity,
    totalAddedWordsCount: totalAddedCount,
    totalRemovedWordsCount: totalRemovedCount,
    pageDiffs,
    durationMs: Date.now() - startTime,
  };
}
