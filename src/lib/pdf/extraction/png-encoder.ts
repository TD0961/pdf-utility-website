/**
 * PDFSimplify — Pure Client-Side PNG Encoder
 * Converts raw raster image streams (RGB, RGBA, Grayscale, and SMask)
 * extracted from PDF objects into valid W3C-compliant PNG files.
 */

import pako from 'pako';

// Precomputed CRC32 table for PNG chunk checksums
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c;
}

function calculateCrc32(buf: Uint8Array, start: number, length: number): number {
  let c = 0xffffffff;
  const end = start + length;
  for (let i = start; i < end; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

  // Chunk Data Length (4 bytes big-endian)
  view.setUint32(0, len, false);

  // Chunk Type (4 bytes ASCII)
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }

  // Chunk Data
  chunk.set(data, 8);

  // CRC32 calculated over Type + Data
  const crc = calculateCrc32(chunk, 4, 4 + len);
  view.setUint32(8 + len, crc, false);

  return chunk;
}

export interface PngEncodeOptions {
  width: number;
  height: number;
  data: Uint8Array;
  channels: 1 | 3 | 4; // 1 = Grayscale, 3 = RGB, 4 = RGBA
  hasPredictor?: boolean;
}

/**
 * Encodes uncompressed pixel samples into a complete, valid PNG binary.
 */
export function encodeRawPixelsToPng(options: PngEncodeOptions): Uint8Array {
  const { width, height, data, channels, hasPredictor = false } = options;

  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }

  // Determine PNG color type
  let colorType: number;
  switch (channels) {
    case 1:
      colorType = 0; // Grayscale
      break;
    case 3:
      colorType = 2; // Truecolor (RGB)
      break;
    case 4:
      colorType = 6; // Truecolor with alpha (RGBA)
      break;
    default:
      colorType = 2;
  }

  let rawScanlines: Uint8Array;

  if (hasPredictor) {
    // If the stream already has PNG filter bytes per scanline
    rawScanlines = data;
  } else {
    // Prepend filter byte 0 (None) to each scanline
    const rowSize = width * channels;
    rawScanlines = new Uint8Array(height * (rowSize + 1));

    for (let y = 0; y < height; y++) {
      const srcOffset = y * rowSize;
      const dstOffset = y * (rowSize + 1);
      rawScanlines[dstOffset] = 0; // Filter method: None
      const slice = data.subarray(srcOffset, srcOffset + rowSize);
      rawScanlines.set(slice, dstOffset + 1);
    }
  }

  // Deflate filtered scanlines for IDAT chunk
  const idatPayload = pako.deflate(rawScanlines, { level: 6 });

  // Build IHDR chunk
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer, ihdrData.byteOffset, ihdrData.byteLength);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = colorType;
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Adaptive filtering
  ihdrData[12] = 0; // Non-interlaced

  // PNG Signature
  const pngSig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = createPngChunk('IHDR', ihdrData);
  const idatChunk = createPngChunk('IDAT', idatPayload);
  const iendChunk = createPngChunk('IEND', new Uint8Array(0));

  const totalLength = pngSig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const pngBytes = new Uint8Array(totalLength);

  let offset = 0;
  pngBytes.set(pngSig, offset);
  offset += pngSig.length;

  pngBytes.set(ihdrChunk, offset);
  offset += ihdrChunk.length;

  pngBytes.set(idatChunk, offset);
  offset += idatChunk.length;

  pngBytes.set(iendChunk, offset);

  return pngBytes;
}

/**
 * Combines an RGB pixel buffer with an alpha mask (SMask) into 32-bit RGBA pixels.
 */
export function combineRgbAndAlphaMask(
  width: number,
  height: number,
  rgb: Uint8Array,
  alpha: Uint8Array
): Uint8Array {
  const pixelCount = width * height;
  const rgba = new Uint8Array(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const rgbIndex = i * 3;
    const rgbaIndex = i * 4;

    rgba[rgbaIndex] = rgb[rgbIndex] ?? 0;
    rgba[rgbaIndex + 1] = rgb[rgbIndex + 1] ?? 0;
    rgba[rgbaIndex + 2] = rgb[rgbIndex + 2] ?? 0;
    rgba[rgbaIndex + 3] = alpha[i] ?? 255;
  }

  return rgba;
}
