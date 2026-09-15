/**
 * PDFSimplify — Client-Side Notification & Re-Engagement Manager
 * 100% in-browser, privacy-first notification engine.
 * Handles PWA post-install welcome, visitor opt-in, background task completion alerts,
 * and service worker deep-link navigation without external servers or tracking.
 */

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    action?: string;
    timestamp?: number;
    [key: string]: unknown;
  };
  vibrate?: number[];
  silent?: boolean;
}

const STORAGE_KEYS = {
  NOTIFICATION_OPT_IN: 'pdfsimplify_notifications_enabled',
  PROMPT_DISMISSED_AT: 'pdfsimplify_notification_dismissed_at',
  LAST_TIP_AT: 'pdfsimplify_last_reengagement_tip_at',
  INSTALLED_NOTIFIED: 'pdfsimplify_install_notification_sent',
};

const DEFAULT_ICON = '/icons/icon-192.png';
const DEFAULT_BADGE = '/icon.svg';

/**
 * Checks if browser environment supports Notifications
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && typeof window.Notification !== 'undefined';
}

/**
 * Checks current notification permission state safely
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return window.Notification.permission as NotificationPermissionState;
}

/**
 * Prompts user for notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_OPT_IN, 'true');
      localStorage.removeItem(STORAGE_KEYS.PROMPT_DISMISSED_AT);
      // Immediately send welcome confirmation notification
      await showWelcomeNotification();
    } else {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_OPT_IN, 'false');
    }
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('[Notifications] Error requesting permission:', err);
    return getNotificationPermission();
  }
}

/**
 * Dispatches a native notification through the Service Worker or fallback window Notification
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (getNotificationPermission() !== 'granted') return false;

  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    tag: payload.tag || 'pdfsimplify-general',
    data: payload.data || { url: '/pdf-tools' },
    vibrate: payload.vibrate || [100, 50, 100],
    silent: payload.silent ?? false,
  };

  try {
    // 1. Prefer Service Worker registration to support background and lock screen notifications
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(payload.title, options);
          return true;
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Fallback to standard window Notification
    const notification = new window.Notification(payload.title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
      const targetUrl = payload.data?.url;
      if (targetUrl && targetUrl !== window.location.pathname) {
        window.location.href = targetUrl;
      }
    };
    return true;
  } catch (err) {
    console.warn('[Notifications] Failed to send notification:', err);
    return false;
  }
}

/**
 * Welcome notification triggered when a visitor opts in without installing
 */
export async function showWelcomeNotification(): Promise<boolean> {
  return sendNotification({
    title: 'Notifications Active! 🚀',
    body: 'PDFSimplify will alert you when large PDF processing finishes and provide helpful document shortcuts.',
    tag: 'pdfsimplify-welcome',
    data: {
      url: '/pdf-tools',
      action: 'welcome',
      timestamp: Date.now(),
    },
  });
}

/**
 * Congratulatory welcome notification triggered when the user installs the PWA
 */
export async function showAppInstalledNotification(): Promise<boolean> {
  // Prevent duplicate notifications in the same session
  if (typeof window !== 'undefined') {
    const alreadySent = sessionStorage.getItem(STORAGE_KEYS.INSTALLED_NOTIFIED);
    if (alreadySent) return false;
    sessionStorage.setItem(STORAGE_KEYS.INSTALLED_NOTIFIED, 'true');
  }

  // If permission not granted yet, attempt to request it gently
  if (getNotificationPermission() === 'default') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  return sendNotification({
    title: 'PDFSimplify Ready Offline! 🎉',
    body: '30 privacy-first PDF tools are now installed on your device. Open anytime, even without internet.',
    tag: 'pdfsimplify-installed',
    data: {
      url: '/pdf-tools',
      action: 'installed',
      timestamp: Date.now(),
    },
  });
}

/**
 * Task completion alert (especially valuable when user switched to another tab while processing)
 */
export async function showTaskCompleteNotification(
  toolName: string,
  fileName?: string,
  actionUrl?: string
): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') return false;

  const title = `${toolName} Ready! ✅`;
  const body = fileName
    ? `"${fileName}" has been processed and is ready for download.`
    : 'Your document processing is complete and ready for download.';

  return sendNotification({
    title,
    body,
    tag: `task-complete-${Date.now()}`,
    data: {
      url: actionUrl || (typeof window !== 'undefined' ? window.location.pathname : '/pdf-tools'),
      action: 'task_complete',
      timestamp: Date.now(),
    },
  });
}

/**
 * Helper to check if the notification banner prompt should be displayed
 */
export function shouldShowNotificationPrompt(): boolean {
  if (!isNotificationSupported()) return false;
  if (getNotificationPermission() !== 'default') return false;

  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.PROMPT_DISMISSED_AT);
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      // Suppress for 14 days after dismissal
      if (daysSinceDismissed < 14) {
        return false;
      }
    }
  } catch {
    return true;
  }

  return true;
}

/**
 * Dismisses the prompt and records the timestamp
 */
export function dismissNotificationPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED_AT, Date.now().toString());
  } catch {
    // Ignore localStorage errors
  }
}
