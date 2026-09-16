declare module 'pako' {
  export interface DeflateOptions {
    level?: number;
    raw?: boolean;
    to?: 'string';
    chunkSize?: number;
    windowBits?: number;
    memLevel?: number;
    strategy?: number;
    dictionary?: unknown;
  }

  export interface InflateOptions {
    raw?: boolean;
    to?: 'string';
    chunkSize?: number;
    windowBits?: number;
    dictionary?: unknown;
  }

  export function deflate(data: Uint8Array | string, options?: DeflateOptions): Uint8Array;
  export function inflate(data: Uint8Array, options?: InflateOptions): Uint8Array;
  export function deflateRaw(data: Uint8Array | string, options?: DeflateOptions): Uint8Array;
  export function inflateRaw(data: Uint8Array, options?: InflateOptions): Uint8Array;
}
