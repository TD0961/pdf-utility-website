export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  createdAt: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private recentMessages: Map<string, number> = new Map();
  private readonly DEDUPE_WINDOW_MS = 2500;

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => listener(copy));
  }

  public show(
    type: ToastType,
    message: string,
    options?: { title?: string; duration?: number; persistent?: boolean }
  ): string | null {
    if (!message || typeof message !== 'string') return null;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return null;

    // Deduplication check
    const dedupeKey = `${type}:${trimmedMessage}`;
    const now = Date.now();
    const lastSeen = this.recentMessages.get(dedupeKey);
    if (lastSeen && now - lastSeen < this.DEDUPE_WINDOW_MS) {
      return null;
    }
    this.recentMessages.set(dedupeKey, now);

    // Default duration depending on severity:
    // errors should be read thoroughly (8000ms), warnings (6000ms), success/info (4000ms)
    let defaultDuration = 4000;
    if (type === 'error') defaultDuration = 8000;
    else if (type === 'warning') defaultDuration = 6000;

    const duration = options?.duration ?? defaultDuration;
    const persistent = options?.persistent ?? false;

    const id = `toast-${now.toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title: options?.title,
      message: trimmedMessage,
      duration,
      persistent,
      createdAt: now,
    };

    // Keep at most 4 visible toasts to avoid viewport crowding
    if (this.toasts.length >= 4) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts.push(newToast);
    this.notify();

    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  public success(message: string, options?: { title?: string; duration?: number }): string | null {
    return this.show('success', message, options);
  }

  public error(
    message: string,
    options?: { title?: string; duration?: number; persistent?: boolean }
  ): string | null {
    return this.show('error', message, options);
  }

  public warning(message: string, options?: { title?: string; duration?: number }): string | null {
    return this.show('warning', message, options);
  }

  public info(message: string, options?: { title?: string; duration?: number }): string | null {
    return this.show('info', message, options);
  }

  public dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clearAll() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.toasts = [];
    this.notify();
  }

  public clear() {
    this.clearAll();
  }

  // Exposed for automated testing
  public getToasts(): ToastMessage[] {
    return [...this.toasts];
  }
}

export const toast = new ToastManager();
