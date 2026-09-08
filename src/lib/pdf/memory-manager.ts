/**
 * Memory Manager for Browser-Side PDF Processing
 * Tracks and revokes Object URLs, cleans up Canvas elements, and prevents memory leaks.
 */

export class MemoryRegistry {
  private activeUrls = new Set<string>();

  /**
   * Creates an Object URL and tracks it for future lifecycle cleanup
   */
  public createTrackedUrl(blobOrFile: Blob | File): string {
    const url = URL.createObjectURL(blobOrFile);
    this.activeUrls.add(url);
    return url;
  }

  /**
   * Alias for createTrackedUrl
   */
  public register(blobOrFile: Blob | File): string {
    return this.createTrackedUrl(blobOrFile);
  }

  /**
   * Revokes a specific Object URL and removes it from the tracking set
   */
  public revokeUrl(url: string | undefined): void {
    if (!url) return;
    if (this.activeUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Failed to revoke object URL:', err);
      }
      this.activeUrls.delete(url);
    }
  }

  /**
   * Revokes an array of URLs
   */
  public revokeUrls(urls: (string | undefined)[]): void {
    for (const url of urls) {
      this.revokeUrl(url);
    }
  }

  /**
   * Revokes all tracked URLs (e.g. when unmounting a workspace or resetting)
   */
  public clearAll(): void {
    this.activeUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Failed to revoke object URL:', err);
      }
    });
    this.activeUrls.clear();
  }

  /**
   * Alias for clearAll
   */
  public revokeAll(): void {
    this.clearAll();
  }

  /**
   * Gets the count of currently held object URLs
   */
  public get count(): number {
    return this.activeUrls.size;
  }
}

export const memoryManager = new MemoryRegistry();
