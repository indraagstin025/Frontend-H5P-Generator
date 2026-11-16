/**
 * Fetch wrapper untuk H5P Generator dengan dukungan autentikasi Bearer JWT,
 * penanganan status 401 otomatis, serta unduhan paket biner (.h5p).
 */
import { API_BASE_URL } from '../config/env';
import { getAuthToken, notifyUnauthorized } from './authService';

const DEFAULT_TIMEOUT = 30_000;

export class ApiError extends Error {
  status: number;
  data?: unknown;
  issues?: string[];

  constructor(status: number, message: string, data?: unknown, issues?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.issues = issues;
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
};

function isPublicAuthEndpoint(endpoint: string): boolean {
  return endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let body: string | undefined;
  if (options.body !== undefined) body = JSON.stringify(options.body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (response.status === 204) {
      return undefined as T;
    }

    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      if (response.ok) {
        throw new Error('Server mengirim respons yang tidak dapat dibaca.');
      }
    }

    if (!response.ok) {
      if (response.status === 401 && !isPublicAuthEndpoint(endpoint)) {
        notifyUnauthorized();
      }
      const errObj = (parsed && typeof parsed === 'object' ? parsed : {}) as {
        error?: string;
        message?: string;
        issues?: string[];
      };
      const msg = errObj.error || errObj.message || `Permintaan gagal (${response.status}).`;
      throw new ApiError(response.status, msg, parsed, Array.isArray(errObj.issues) ? errObj.issues : undefined);
    }

    return parsed as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError' && !options.signal?.aborted) {
      throw new Error('Permintaan timeout. Coba lagi.');
    }
    throw err;
  }
}

/**
 * Unduh berkas biner terautentikasi (misal POST /projects/:id/export).
 */
export async function apiDownload(
  endpoint: string,
  options: ApiOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 60_000);

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method ?? 'POST',
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        notifyUnauthorized();
      }
      let parsed: unknown = null;
      try {
        parsed = await response.json();
      } catch {
        // bukan JSON
      }
      const errObj = (parsed && typeof parsed === 'object' ? parsed : {}) as {
        error?: string;
        message?: string;
        issues?: string[];
      };
      const msg = errObj.error || errObj.message || `Unduhan gagal (${response.status}).`;
      throw new ApiError(response.status, msg, parsed, Array.isArray(errObj.issues) ? errObj.issues : undefined);
    }

    const disposition = response.headers.get('content-disposition') ?? '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1]?.trim() ?? null;
    const blob = await response.blob();
    return { blob, filename };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError' && !options.signal?.aborted) {
      throw new Error('Waktu unduhan habis. Coba lagi.');
    }
    throw err;
  }
}
