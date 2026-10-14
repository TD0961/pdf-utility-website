import { useRef, useCallback } from 'react';
import {
  ToolSlug,
  OutputFormat,
  trackToolProcessingStart,
  trackToolProcessingComplete,
  trackToolProcessingError,
  trackToolDownloadClick,
} from './events';

export interface UseToolTrackingOptions {
  toolSlug: ToolSlug;
  defaultOutputFormat?: OutputFormat;
}

export function useToolTracking(
  optionsOrSlug: UseToolTrackingOptions | ToolSlug
) {
  const options =
    typeof optionsOrSlug === 'string'
      ? { toolSlug: optionsOrSlug, defaultOutputFormat: 'pdf' as OutputFormat }
      : optionsOrSlug;
  const { toolSlug, defaultOutputFormat = 'pdf' } = options;
  const startTimeRef = useRef<number>(0);
  const isStartedRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

  /**
   * Call immediately before genuine processing starts, after validation.
   */
  const startProcessing = useCallback(
    (fileCount = 1) => {
      startTimeRef.current = Date.now();
      isStartedRef.current = true;
      isCompletedRef.current = false;
      trackToolProcessingStart(toolSlug, fileCount);
    },
    [toolSlug]
  );

  /**
   * Call when processing completes successfully and valid output is ready.
   */
  const completeProcessing = useCallback(
    (format: OutputFormat = defaultOutputFormat) => {
      if (!isStartedRef.current || isCompletedRef.current) return;
      isCompletedRef.current = true;
      const durationMs = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
      trackToolProcessingComplete(toolSlug, durationMs, format);
    },
    [toolSlug, defaultOutputFormat]
  );

  /**
   * Call when processing throws or encounters an error.
   */
  const errorProcessing = useCallback(
    (err: unknown) => {
      if (!isStartedRef.current || isCompletedRef.current) return;
      isStartedRef.current = false;
      trackToolProcessingError(toolSlug, err);
    },
    [toolSlug]
  );

  /**
   * Call when the user explicitly clicks the Download button/link.
   */
  const recordDownload = useCallback(
    (format: OutputFormat = defaultOutputFormat) => {
      trackToolDownloadClick(toolSlug, format);
    },
    [toolSlug, defaultOutputFormat]
  );

  /**
   * Reset tracking state (e.g. when user clicks Start Over / Reset).
   */
  const resetTracking = useCallback(() => {
    isStartedRef.current = false;
    isCompletedRef.current = false;
    startTimeRef.current = 0;
  }, []);

  return {
    startProcessing,
    completeProcessing,
    errorProcessing,
    recordDownload,
    resetTracking,
  };
}
