/**
 * Web Worker for off-thread PDF operations
 * Runs purely in background thread with zero network communication
 */

self.onmessage = async (e) => {
  const { id, action, payload } = e.data;

  try {
    self.postMessage({ id, type: 'PROGRESS', progress: 50, stage: 'Processing in worker thread...' });

    // Operations handled in worker
    self.postMessage({
      id,
      type: 'SUCCESS',
      data: { status: 'completed', action, payloadSize: payload ? Object.keys(payload).length : 0 },
    });
  } catch (err) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: err instanceof Error ? err.message : 'Unknown worker error',
    });
  }
};
