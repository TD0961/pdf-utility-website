import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showWelcomeNotification,
  showAppInstalledNotification,
  showTaskCompleteNotification,
  shouldShowNotificationPrompt,
  dismissNotificationPrompt,
} from '../src/lib/notifications/notification-manager';

describe('Notification & Re-Engagement System', () => {
  const originalWindow = globalThis.window;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    const localStorageMock = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => {
        mockStorage[k] = v;
      },
      removeItem: (k: string) => {
        delete mockStorage[k];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    const mockNotificationConstructor = class MockNotification {
      static permission = 'default';
      static requestPermission = async () => 'granted';
      title: string;
      options: NotificationOptions;
      onclick: (() => void) | null = null;
      constructor(title: string, options: NotificationOptions) {
        this.title = title;
        this.options = options;
      }
      close() {}
    };

    // Simulate browser window
    Reflect.set(globalThis, 'window', {
      Notification: mockNotificationConstructor,
      localStorage: localStorageMock,
      sessionStorage: localStorageMock,
      location: { pathname: '/pdf-tools/merge-pdf', href: 'https://pdfsimplify.pages.dev/pdf-tools/merge-pdf' },
      focus: () => {},
    });

    // Also define global localStorage
    Reflect.set(globalThis, 'localStorage', localStorageMock);
    Reflect.set(globalThis, 'sessionStorage', localStorageMock);
  });

  afterEach(() => {
    if (originalWindow) {
      Reflect.set(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
    Reflect.deleteProperty(globalThis, 'localStorage');
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  it('detects notification support in browser environments', () => {
    assert.equal(isNotificationSupported(), true, 'Notification should be supported in simulated browser');
  });

  it('reports initial default permission state and handles request permission', async () => {
    assert.equal(getNotificationPermission(), 'default', 'Initial permission should be default');

    const perm = await requestNotificationPermission();
    assert.equal(perm, 'granted', 'Permission should be granted');
    assert.equal(mockStorage['pdfsimplify_notifications_enabled'], 'true', 'Opt-in state recorded in localStorage');
  });

  it('sends welcome notification upon opt-in', async () => {
    // Set permission to granted
    Reflect.set(globalThis.window.Notification, 'permission', 'granted');
    const sent = await showWelcomeNotification();
    assert.equal(sent, true, 'Welcome notification sent successfully');
  });

  it('sends post-install notification on appinstalled event', async () => {
    Reflect.set(globalThis.window.Notification, 'permission', 'granted');
    const sent = await showAppInstalledNotification();
    assert.equal(sent, true, 'Post-install notification sent');

    // Duplicate call in same session should be prevented
    const duplicate = await showAppInstalledNotification();
    assert.equal(duplicate, false, 'Duplicate post-install notification prevented');
  });

  it('sends task complete alert with tool name and download link', async () => {
    Reflect.set(globalThis.window.Notification, 'permission', 'granted');
    const sent = await showTaskCompleteNotification(
      'Merge PDF',
      'annual-report.pdf',
      '/pdf-tools/merge-pdf'
    );
    assert.equal(sent, true, 'Task completion notification sent');
  });

  it('respects 14-day dismissal window for notification prompt', () => {
    Reflect.set(globalThis.window.Notification, 'permission', 'default');
    assert.equal(shouldShowNotificationPrompt(), true, 'Prompt should show when default');

    dismissNotificationPrompt();
    assert.equal(shouldShowNotificationPrompt(), false, 'Prompt should be suppressed after dismissal');

    // Simulate 15 days later
    const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
    mockStorage['pdfsimplify_notification_dismissed_at'] = fifteenDaysAgo.toString();
    assert.equal(shouldShowNotificationPrompt(), true, 'Prompt should show again after 14 days');
  });

  it('validates service worker notificationclick and message handlers in public/sw.js', () => {
    const swPath = path.resolve('public/sw.js');
    const swContent = readFileSync(swPath, 'utf8');

    assert.ok(swContent.includes('notificationclick'), 'Service worker includes notificationclick listener');
    assert.ok(swContent.includes('SHOW_NOTIFICATION'), 'Service worker includes SHOW_NOTIFICATION message handler');
    assert.ok(swContent.includes('clients.matchAll'), 'Service worker matches open clients to focus');
    assert.ok(swContent.includes('clients.openWindow'), 'Service worker can open new window on notification click');
  });
});
