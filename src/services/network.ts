/**
 * Deteksi status jaringan, normalisasi kegagalan koneksi lintas browser,
 * dan pemulihan otomatis saat koneksi kembali normal.
 */
import { useSyncExternalStore } from 'react';
import { API_BASE_URL } from '../config/env';

export type NetworkFailureReason = 'offline' | 'timeout' | 'unreachable';

const DEFAULT_MESSAGES: Record<NetworkFailureReason, string> = {
  offline: 'Koneksi internet terputus. Web ini memerlukan koneksi internet — periksa jaringan Anda lalu coba lagi.',
  timeout: 'Koneksi ke server melebihi batas waktu. Periksa kestabilan internet Anda lalu coba lagi.',
  unreachable: 'Jaringan terputus atau server tidak dapat dijangkau. Periksa koneksi internet Anda lalu coba lagi.',
};

const NETWORK_ERROR_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /err_internet_disconnected/i,
  /err_network/i,
];

export class NetworkError extends Error {
  readonly reason: NetworkFailureReason;
  readonly retryable = true;

  constructor(reason: NetworkFailureReason, message?: string) {
    super(message ?? DEFAULT_MESSAGES[reason]);
    this.name = 'NetworkError';
    this.reason = reason;
  }
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isNetworkFailure(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  if (!(err instanceof Error)) return false;
  if (err.name === 'AbortError') return false;
  if (err.name === 'TypeError' && NETWORK_ERROR_PATTERNS.some((re) => re.test(err.message))) {
    return true;
  }
  return NETWORK_ERROR_PATTERNS.some((re) => re.test(err.message));
}

export function formatNetworkError(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return err.message;
  if (isNetworkFailure(err)) {
    return isBrowserOffline() ? DEFAULT_MESSAGES.offline : DEFAULT_MESSAGES.unreachable;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export interface NetworkStatusSnapshot {
  isOnline: boolean;
  serverReachable: boolean;
  recoveredAt: number | null;
}

let state: NetworkStatusSnapshot = {
  isOnline: !isBrowserOffline(),
  serverReachable: !isBrowserOffline(),
  recoveredAt: null,
};

let hadOutage = state.isOnline === false;
let recoveryClearTimer: number | null = null;
const storeListeners = new Set<() => void>();
const recoveryListeners = new Set<() => void>();

function emitState() {
  for (const listener of storeListeners) listener();
}

function scheduleRecoveredClear() {
  if (typeof window === 'undefined') return;
  if (recoveryClearTimer !== null) {
    window.clearTimeout(recoveryClearTimer);
  }
  recoveryClearTimer = window.setTimeout(() => {
    recoveryClearTimer = null;
    if (state.recoveredAt !== null) {
      state = { ...state, recoveredAt: null };
      emitState();
    }
  }, 4000);
}

function notifyRecoveredIfNeeded() {
  if (!hadOutage) return;
  hadOutage = false;
  state = { ...state, recoveredAt: Date.now() };
  scheduleRecoveredClear();
  for (const listener of recoveryListeners) {
    listener();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    hadOutage = true;
    state = { isOnline: false, serverReachable: false, recoveredAt: null };
    emitState();
  });

  window.addEventListener('online', () => {
    state = { isOnline: true, serverReachable: true, recoveredAt: hadOutage ? Date.now() : null };
    if (hadOutage) {
      notifyRecoveredIfNeeded();
    }
    emitState();
  });
}

export function reportServerReachable(reachable: boolean): void {
  const nextOnline = !isBrowserOffline();
  if (!reachable || !nextOnline) {
    hadOutage = true;
    if (state.serverReachable || state.isOnline !== nextOnline || state.recoveredAt !== null) {
      state = { isOnline: nextOnline, serverReachable: false, recoveredAt: null };
      emitState();
    }
    return;
  }

  const changed = !state.isOnline || !state.serverReachable;
  state = { ...state, isOnline: true, serverReachable: true };
  if (hadOutage) {
    notifyRecoveredIfNeeded();
    emitState();
  } else if (changed) {
    emitState();
  }
}

export async function checkServerConnection(): Promise<boolean> {
  if (isBrowserOffline()) {
    reportServerReachable(false);
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);
    const ok = res.ok;
    reportServerReachable(ok);
    return ok;
  } catch {
    window.clearTimeout(timeoutId);
    reportServerReachable(false);
    return false;
  }
}

export function subscribeOnlineRecovery(listener: () => void): () => void {
  recoveryListeners.add(listener);
  return () => {
    recoveryListeners.delete(listener);
  };
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getSnapshot(): NetworkStatusSnapshot {
  return state;
}

export function useNetworkStatus(): NetworkStatusSnapshot {
  return useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);
}
