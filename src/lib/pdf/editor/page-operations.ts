/**
 * Phase 3C.1: PDF Editor Engine — Page Operations
 * Pure, immutable transformations on the EditorPage[] document hierarchy:
 * - deletePage
 * - duplicatePage
 * - rotatePage
 * - movePage (reorder)
 */

import { EditorPage } from './types';
import { cloneEditorObject, generateObjectId } from './objects';
import { normalizeRotation } from './coordinates';

/**
 * Deletes a page at the specified index.
 * Throws an error if the document only has 1 page (documents must retain at least one page).
 */
export function deletePage(pages: EditorPage[], pageIndex: number): EditorPage[] {
  if (pages.length <= 1) {
    throw new Error('Cannot delete the only remaining page in the document.');
  }
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page index ${pageIndex}. Document has ${pages.length} pages.`);
  }

  const next = pages.filter((_, idx) => idx !== pageIndex);
  return next.map((p, idx) => ({
    ...p,
    pageIndex: idx,
    objects: p.objects.map((obj) => ({ ...obj, pageIndex: idx })),
  }));
}

/**
 * Duplicates a page at the specified index, cloning its dimensions, rotation,
 * source reference, and all attached editor objects with newly assigned IDs.
 */
export function duplicatePage(pages: EditorPage[], pageIndex: number): EditorPage[] {
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page index ${pageIndex}. Document has ${pages.length} pages.`);
  }

  const target = pages[pageIndex];
  const duplicatedObjects = target.objects.map((obj) => {
    const cloned = cloneEditorObject(obj);
    cloned.id = generateObjectId();
    cloned.pageIndex = pageIndex + 1;
    return cloned;
  });

  const newPage: EditorPage = {
    pageIndex: pageIndex + 1,
    originalPageIndex: target.originalPageIndex,
    width: target.width,
    height: target.height,
    rotation: target.rotation,
    objects: duplicatedObjects,
  };

  const next = [...pages];
  next.splice(pageIndex + 1, 0, newPage);

  return next.map((p, idx) => ({
    ...p,
    pageIndex: idx,
    objects: p.objects.map((obj) => ({ ...obj, pageIndex: idx })),
  }));
}

/**
 * Rotates a page by a relative angle (+90, -90, 180 degrees).
 */
export function rotatePage(
  pages: EditorPage[],
  pageIndex: number,
  delta: 90 | -90 | 180
): EditorPage[] {
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page index ${pageIndex}. Document has ${pages.length} pages.`);
  }

  return pages.map((p, idx) => {
    if (idx !== pageIndex) return p;
    return {
      ...p,
      rotation: normalizeRotation(p.rotation + delta),
    };
  });
}

/**
 * Moves (reorders) a page from one index to another.
 */
export function movePage(
  pages: EditorPage[],
  fromIndex: number,
  toIndex: number
): EditorPage[] {
  if (fromIndex < 0 || fromIndex >= pages.length) {
    throw new Error(`Invalid fromIndex ${fromIndex}. Document has ${pages.length} pages.`);
  }
  if (toIndex < 0 || toIndex >= pages.length) {
    throw new Error(`Invalid toIndex ${toIndex}. Document has ${pages.length} pages.`);
  }
  if (fromIndex === toIndex) {
    return pages;
  }

  const next = [...pages];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  return next.map((p, idx) => ({
    ...p,
    pageIndex: idx,
    objects: p.objects.map((obj) => ({ ...obj, pageIndex: idx })),
  }));
}
