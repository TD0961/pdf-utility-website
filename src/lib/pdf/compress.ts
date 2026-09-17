/**
 * PDFSimplify — Client-Side PDF Compression & Optimization Engine
 * Genuine in-browser size reduction via object stream compaction, metadata cleanup,
 * unreferenced object purging, and deep raster image re-encoding (JPEG & Flate/PNG).
 * Processed locally in your browser, zero backend.
 */

import pako from 'pako';
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFStream } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { encodeRawPixelsToPng } from './extraction/png-encoder';

export type CompressionLevel = 'basic' | 'balanced' | 'strong';

export interface CompressionProgress {
  percentage: number;
  stage: string;
}

export interface CompressionOptions {
  level?: CompressionLevel;
  targetSizeMb?: number;
  onProgress?: (progress: CompressionProgress) => void;
}

/**
 * Re-encodes an image stream (JPEG or Flate raster) using offscreen canvas in browser environments.
 * Scales down dimensions if they exceed maxDimension and recompresses to high-efficiency JPEG.
 */
async function optimizeImageStream(
  rawBytes: Uint8Array,
  isDct: boolean,
  quality: number,
  maxDimension?: number,
  flateMeta?: {
    width: number;
    height: number;
    channels: 1 | 3 | 4;
    hasPredictor?: boolean;
  }
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    let url: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };

    try {
      if (isDct) {
        const blob = new Blob([rawBytes as BlobPart], { type: 'image/jpeg' });
        url = URL.createObjectURL(blob);
      } else if (flateMeta && flateMeta.width > 0 && flateMeta.height > 0) {
        // Inflate raw flate stream and construct PNG blob for canvas decoding
        let decompressed: Uint8Array;
        try {
          decompressed = pako.inflate(rawBytes);
        } catch {
          decompressed = rawBytes;
        }

        const pngBytes = encodeRawPixelsToPng({
          width: flateMeta.width,
          height: flateMeta.height,
          data: decompressed,
          channels: flateMeta.channels,
          hasPredictor: flateMeta.hasPredictor,
        });

        const blob = new Blob([pngBytes as BlobPart], { type: 'image/png' });
        url = URL.createObjectURL(blob);
      } else {
        resolve(null);
        return;
      }
    } catch {
      resolve(null);
      return;
    }

    const img = new Image();

    // 4-second safety timeout so processing never hangs on malformed or exotic images
    timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4000);

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || (flateMeta?.width ?? 0);
        let height = img.naturalHeight || img.height || (flateMeta?.height ?? 0);

        if (width <= 0 || height <= 0) {
          cleanup();
          resolve(null);
          return;
        }

        if (maxDimension && (width > maxDimension || height > maxDimension)) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        // Fill background white so transparent screenshots and diagrams render cleanly
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (compressedBlob) => {
            cleanup();
            if (compressedBlob && compressedBlob.size < rawBytes.length) {
              const buf = await compressedBlob.arrayBuffer();
              resolve({ data: new Uint8Array(buf), width, height });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          quality
        );
      } catch {
        cleanup();
        resolve(null);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(null);
    };

    img.src = url;
  });
}

export interface CompressionResult {
  blob: Blob;
  pdfBytes: Uint8Array;
  uint8Array: Uint8Array;
  bytes?: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
  compressionRatio: number;
  isAlreadyOptimized: boolean;
  pageCount: number;
  level: CompressionLevel;
}

/**
 * Compresses a PDF file using purely client-side optimization techniques.
 */
export async function compressPdf(
  fileOrBufferOrOptions: File | ArrayBuffer | Uint8Array | { file: File | ArrayBuffer | Uint8Array | { bytes?: Uint8Array; buffer?: ArrayBuffer }; level?: CompressionLevel; targetSizeMb?: number; onProgress?: (p: CompressionProgress) => void },
  options: CompressionOptions = {}
): Promise<Uint8Array & CompressionResult & { pdfBytes: Uint8Array; uint8Array: Uint8Array; bytes: Uint8Array }> {
  let fileOrBuffer: unknown = fileOrBufferOrOptions;
  let opts: CompressionOptions = options;

  if (fileOrBufferOrOptions && typeof fileOrBufferOrOptions === 'object' && 'file' in fileOrBufferOrOptions) {
    fileOrBuffer = fileOrBufferOrOptions.file;
    opts = {
      level: fileOrBufferOrOptions.level || options.level,
      targetSizeMb: (fileOrBufferOrOptions as { targetSizeMb?: number }).targetSizeMb ?? options.targetSizeMb,
      onProgress: fileOrBufferOrOptions.onProgress || options.onProgress,
    };
  }

  const level = opts.level || 'balanced';
  const notify = (percentage: number, stage: string) => {
    opts.onProgress?.({ percentage, stage });
  };

  notify(10, 'Reading PDF document into memory...');

  let inputBytes: Uint8Array;
  if (fileOrBuffer instanceof Uint8Array) {
    inputBytes = fileOrBuffer;
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    inputBytes = new Uint8Array(fileOrBuffer);
  } else if (fileOrBuffer && typeof fileOrBuffer === 'object') {
    if ('bytes' in fileOrBuffer && (fileOrBuffer as { bytes: Uint8Array }).bytes instanceof Uint8Array) {
      inputBytes = (fileOrBuffer as { bytes: Uint8Array }).bytes;
    } else if ('buffer' in fileOrBuffer && (fileOrBuffer as { buffer: ArrayBuffer }).buffer instanceof ArrayBuffer) {
      inputBytes = new Uint8Array((fileOrBuffer as { buffer: ArrayBuffer }).buffer);
    } else if ('arrayBuffer' in fileOrBuffer && typeof (fileOrBuffer as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
      inputBytes = new Uint8Array(await (fileOrBuffer as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
    } else {
      inputBytes = new Uint8Array(fileOrBuffer as unknown as ArrayBuffer);
    }
  } else {
    inputBytes = new Uint8Array(fileOrBuffer as unknown as ArrayBuffer);
  }

  const originalSize = inputBytes.length;
  if (originalSize === 0) {
    throw new Error('Input PDF is empty (0 bytes).');
  }

  notify(25, 'Parsing document structure and catalog...');
  const srcDoc = await PDFDocument.load(inputBytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });

  const pageCount = srcDoc.getPageCount();
  if (pageCount === 0) {
    throw new Error('PDF contains no pages to compress.');
  }

  notify(40, 'Creating optimized document container...');

  // Create a clean destination document to discard unreferenced / orphaned objects
  const targetDoc = await PDFDocument.create();

  // Copy all pages into target document (preserves text, vector shapes, fonts, and annotations)
  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
  const copiedPages = await targetDoc.copyPages(srcDoc, pageIndices);

  for (let i = 0; i < copiedPages.length; i++) {
    targetDoc.addPage(copiedPages[i]);
    if (i % 20 === 0 || i === copiedPages.length - 1) {
      notify(
        Math.round(40 + (i / copiedPages.length) * 20),
        `Optimizing page layout (${i + 1}/${pageCount})...`
      );
    }
  }

  // Metadata optimization based on level
  if (level === 'basic') {
    // Retain title/author if present, but normalize producer
    targetDoc.setProducer('PDFSimplify Client-Side Compressor');
  } else if (level === 'balanced' || level === 'strong') {
    // Strip redundant metadata packets, timestamps, and history
    targetDoc.setTitle(srcDoc.getTitle() || '');
    targetDoc.setAuthor(srcDoc.getAuthor() || '');
    targetDoc.setProducer('PDFSimplify Local Optimizer');
    targetDoc.setCreator('PDFSimplify');
  }

  // Active image optimization pass for balanced, strong, or custom target size
  const targetSizeMb = opts.targetSizeMb;
  if (level !== 'basic' || (targetSizeMb && targetSizeMb > 0)) {
    let quality = level === 'strong' ? 0.50 : 0.72;
    let maxDimension: number | undefined = level === 'strong' ? 1100 : 1600;

    if (targetSizeMb && targetSizeMb > 0) {
      const targetBytes = targetSizeMb * 1024 * 1024;
      const ratio = targetBytes / originalSize;
      if (ratio >= 0.8) {
        quality = 0.80;
        maxDimension = 1800;
      } else if (ratio >= 0.5) {
        quality = 0.70;
        maxDimension = 1500;
      } else if (ratio >= 0.35) {
        quality = 0.58;
        maxDimension = 1200;
      } else if (ratio >= 0.2) {
        quality = 0.45;
        maxDimension = 1000;
      } else {
        quality = 0.32;
        maxDimension = 800;
      }
    }

    notify(65, 'Scanning embedded graphics and screenshots...');
    const indirectObjects = targetDoc.context.enumerateIndirectObjects();
    const candidateImages: Array<{
      ref: unknown;
      stream: PDFRawStream | PDFStream;
      isDct: boolean;
      isFlate: boolean;
      raw: Uint8Array;
      flateMeta?: { width: number; height: number; channels: 1 | 3 | 4; hasPredictor?: boolean };
    }> = [];

    for (const [ref, obj] of indirectObjects) {
      if (obj instanceof PDFRawStream || obj instanceof PDFStream) {
        const dict = obj.dict;
        if (!dict) continue;

        const subtypeObj = dict.lookup(PDFName.of('Subtype'));
        const subtype = subtypeObj ? subtypeObj.toString() : '';

        if (subtype.includes('Image')) {
          const filterObj = dict.lookup(PDFName.of('Filter'));
          const filterStr = filterObj ? filterObj.toString() : '';
          const isDct = filterStr.includes('DCTDecode');
          const isFlate = filterStr.includes('FlateDecode') || filterStr === '';

          if (isDct || isFlate) {
            const raw = obj.getContents();
            // Optimize images over 8KB
            if (raw && raw.length > 8192) {
              let flateMeta: { width: number; height: number; channels: 1 | 3 | 4; hasPredictor?: boolean } | undefined;

              if (isFlate) {
                let width = 0;
                let height = 0;
                const widthObj = dict.lookup(PDFName.of('Width'));
                if (widthObj && typeof (widthObj as unknown as { asNumber?: () => number }).asNumber === 'function') {
                  width = (widthObj as unknown as { asNumber: () => number }).asNumber();
                } else if (widthObj) {
                  width = parseInt(widthObj.toString(), 10) || 0;
                }

                const heightObj = dict.lookup(PDFName.of('Height'));
                if (heightObj && typeof (heightObj as unknown as { asNumber?: () => number }).asNumber === 'function') {
                  height = (heightObj as unknown as { asNumber: () => number }).asNumber();
                } else if (heightObj) {
                  height = parseInt(heightObj.toString(), 10) || 0;
                }

                const csObj = dict.lookup(PDFName.of('ColorSpace'));
                const csStr = csObj ? csObj.toString() : '/DeviceRGB';
                const channels: 1 | 3 | 4 = csStr.includes('Gray') ? 1 : 3;

                let hasPredictor = false;
                const decodeParms = dict.lookup(PDFName.of('DecodeParms'));
                if (decodeParms && typeof decodeParms === 'object' && 'get' in decodeParms) {
                  const dpObj = decodeParms as unknown as { lookup?: (k: unknown) => { toString: () => string } | undefined; get?: (k: unknown) => { toString: () => string } | undefined };
                  const predObj = dpObj.lookup
                    ? dpObj.lookup(PDFName.of('Predictor'))
                    : dpObj.get?.(PDFName.of('Predictor'));
                  const predNum = predObj ? parseInt(predObj.toString(), 10) : 1;
                  if (predNum >= 10 && predNum <= 15) {
                    hasPredictor = true;
                  }
                }

                flateMeta = { width, height, channels, hasPredictor };
              }

              candidateImages.push({
                ref,
                stream: obj,
                isDct,
                isFlate,
                raw,
                flateMeta,
              });
            }
          }
        }
      }
    }

    const totalImages = candidateImages.length;
    for (let i = 0; i < totalImages; i++) {
      const item = candidateImages[i];
      notify(
        Math.round(65 + (i / Math.max(1, totalImages)) * 20),
        `Optimizing graphic stream (${i + 1}/${totalImages})...`
      );

      const opt = await optimizeImageStream(
        item.raw,
        item.isDct,
        quality,
        maxDimension,
        item.flateMeta
      );

      if (opt && opt.data.length < item.raw.length) {
        const dict = item.stream.dict;
        dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
        dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
        dict.set(PDFName.of('Width'), PDFNumber.of(opt.width));
        dict.set(PDFName.of('Height'), PDFNumber.of(opt.height));
        dict.delete(PDFName.of('DecodeParms'));
        dict.delete(PDFName.of('SMask'));

        const newStream = PDFRawStream.of(dict, opt.data);
        targetDoc.context.assign(item.ref as Parameters<typeof targetDoc.context.assign>[0], newStream);
      }
    }
  }

  notify(85, 'Compacting cross-reference tables and object streams...');

  // Save with object streams compaction (compresses dictionaries and non-stream objects into Flate streams)
  const compressedBytes = await targetDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  notify(95, 'Validating output PDF integrity...');
  await assertValidPdfOutput(compressedBytes, {
    expectedPages: pageCount,
  });

  const compressedSize = compressedBytes.length;
  const isSmaller = compressedSize < originalSize;
  const finalBytes = isSmaller ? compressedBytes : inputBytes;
  const finalSize = finalBytes.length;

  const savedBytes = Math.max(0, originalSize - finalSize);
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
  const isAlreadyOptimized = !isSmaller || savedPercent < 1;

  const compressionRatio = originalSize > 0 ? (originalSize - finalSize) / originalSize : 0;

  notify(100, 'Optimization complete.');

  const result = Object.assign(finalBytes, {
    blob: new Blob([finalBytes as BlobPart], { type: 'application/pdf' }),
    pdfBytes: finalBytes,
    uint8Array: finalBytes,
    bytes: finalBytes,
    originalSize,
    compressedSize: finalSize,
    savedBytes,
    savedPercent,
    compressionRatio,
    isAlreadyOptimized,
    pageCount,
    level,
  });

  return result as Uint8Array & CompressionResult & { pdfBytes: Uint8Array; uint8Array: Uint8Array; bytes: Uint8Array };
}
