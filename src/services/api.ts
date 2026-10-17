/**
 * Minimal fetch wrapper untuk H5P Generator.
 * Disederhanakan dari pola WeSign services/api.js (tanpa auth refresh —
 * LMS internal, belum ada login di MVP).
 */
import { API_BASE_URL } from '../config/env';

const DEFAULT_TIMEOUT = 30_000;

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
};

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };
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

    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      throw new Error('Server mengirim respons yang tidak dapat dibaca.');
    }

    if (!response.ok) throw new Error(`Permintaan gagal (${response.status}).`);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError' && !options.signal?.aborted) {
      throw new Error('Permintaan timeout. Coba lagi.');
    }
    throw err;
  }
}
