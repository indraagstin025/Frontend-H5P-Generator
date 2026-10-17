/** Upload FormData dengan progress (mirip WeSign services/apiUpload.js). */
import { API_BASE_URL } from '../config/env';

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
          reject(new Error('Respons upload tidak valid.'));
        }
      } else {
        reject(new Error(`Upload gagal (status ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah.'));
    xhr.ontimeout = () => reject(new Error('Upload timeout.'));
    xhr.send(formData);
  });
}
