/**
 * Web Worker Manager
 * Provides non-blocking execution, task cancellation, and automatic cleanup.
 */

import { WorkerMessageRequest, WorkerMessageResponse } from './types';
import { generateId } from '@/lib/utils';

export class WorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (err: Error) => void;
      onProgress?: (progress: number, stage: string) => void;
    }
  >();

  constructor(private workerScriptUrl: string = '/workers/pdf-worker.js') {}

  private initWorker(): Worker {
    if (!this.worker && typeof window !== 'undefined') {
      try {
        this.worker = new Worker(this.workerScriptUrl, { type: 'module' });
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
      } catch (err) {
        console.warn('Dedicated worker initialization failed, falling back to direct execution', err);
      }
    }
    return this.worker!;
  }

  private handleMessage(event: MessageEvent<WorkerMessageResponse>): void {
    const { id, type } = event.data;
    const pending = this.pendingRequests.get(id);
    if (!pending) return;

    if (type === 'PROGRESS') {
      pending.onProgress?.(event.data.progress, event.data.stage);
    } else if (type === 'SUCCESS') {
      pending.resolve(event.data.data);
      this.pendingRequests.delete(id);
    } else if (type === 'ERROR') {
      pending.reject(new Error(event.data.error));
      this.pendingRequests.delete(id);
    }
  }

  private handleError(errorEvent: ErrorEvent): void {
    console.error('Worker error:', errorEvent);
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error(errorEvent.message || 'Worker task failed.'));
    });
    this.pendingRequests.clear();
    this.terminate();
  }

  /**
   * Dispatches a task to the worker
   */
  public async executeTask<T = unknown>(
    action: WorkerMessageRequest['action'],
    payload: unknown,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<T> {
    const worker = this.initWorker();
    const id = generateId();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: resolve as (data: unknown) => void,
        reject,
        onProgress,
      });

      if (worker) {
        worker.postMessage({ id, action, payload } as WorkerMessageRequest);
      } else {
        reject(new Error('Web Workers are not supported or available in this environment.'));
      }
    });
  }

  /**
   * Cleanly terminates the active worker and rejects pending requests
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker task was cancelled.'));
    });
    this.pendingRequests.clear();
  }
}

export const defaultPdfWorker = new WorkerManager();
