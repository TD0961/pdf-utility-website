'use client';

import { useEffect } from 'react';
import { trackToolOpen } from '@/lib/analytics/events';

interface ToolPageTrackerProps {
  toolSlug: string;
}

/**
 * Client component to record a `tool_open` telemetry event when a user
 * navigates to any tool workspace. Runs purely on the client side inside
 * useEffect to prevent firing during SSR/SSG static exports.
 */
export function ToolPageTracker({ toolSlug }: ToolPageTrackerProps) {
  useEffect(() => {
    trackToolOpen(toolSlug);
  }, [toolSlug]);

  return null;
}
