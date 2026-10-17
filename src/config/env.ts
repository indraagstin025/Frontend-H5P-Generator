/**
 * Single source of API base URL.
 * dev  -> http://localhost:3000/api (ikut backend/src/index.ts)
 * prod -> override via VITE_API_URL saat `vite build`.
 */
export const LOCAL_API_URL = 'http://localhost:3000/api';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return LOCAL_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
