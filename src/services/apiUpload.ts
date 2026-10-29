/** Upload FormData dengan progress (mirip WeSign services/apiUpload.js). */
import { API_BASE_URL } from '../config/env';

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
};

export function apiUpload<T>(endpoint: string, formData: FormData, options: UploadOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpoint}`, true);

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new ApiUploadError(xhr.status, 'Respons upload tidak valid.'));
        }
      } else {
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

    xhr.onerror = () => reject(new ApiUploadError(0, 'Koneksi terputus saat mengunggah.'));
    xhr.ontimeout = () => reject(new ApiUploadError(0, 'Upload timeout.'));
    xhr.send(formData);
  });
}
