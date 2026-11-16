/** Upload FormData dengan progress dan injeksi otomatis token JWT. */
import { API_BASE_URL } from '../config/env';
import { getAuthToken, notifyUnauthorized } from './authService';
import { isBrowserOffline, NetworkError, reportServerReachable } from './network';

const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000;

export class ApiUploadError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiUploadError';
    this.status = status;
    this.data = data;
  }
}

type UploadOptions = {
  onProgress?: (percent: number) => void;
  timeout?: number;
};

export function apiUpload<T>(endpoint: string, formData: FormData, options: UploadOptions = {}): Promise<T> {
  if (isBrowserOffline()) {
    reportServerReachable(false);
    return Promise.reject(new NetworkError('offline'));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpoint}`, true);
    xhr.timeout = options.timeout ?? DEFAULT_UPLOAD_TIMEOUT_MS;

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
    }

    xhr.onload = () => {
      reportServerReachable(true);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new ApiUploadError(xhr.status, 'Respons upload tidak valid.'));
        }
      } else {
        if (xhr.status === 401) {
          notifyUnauthorized();
        }
        let serverMessage = '';
        let errorData: unknown = undefined;
        try {
          const parsed = JSON.parse(xhr.responseText) as { error?: string; message?: string };
          serverMessage = parsed.error || parsed.message || '';
          errorData = parsed;
        } catch {
          // Response bukan JSON
        }

        const fallbackMessage = `Upload gagal (status ${xhr.status}).`;
        reject(new ApiUploadError(xhr.status, serverMessage || fallbackMessage, errorData));
      }
    };

    xhr.onerror = () => {
      reportServerReachable(false);
      reject(new NetworkError(isBrowserOffline() ? 'offline' : 'unreachable'));
    };
    xhr.ontimeout = () => {
      reportServerReachable(false);
      reject(new NetworkError('timeout'));
    };
    xhr.send(formData);
  });
}
