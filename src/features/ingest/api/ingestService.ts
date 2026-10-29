/**
 * Layanan ingest: validasi lokal + upload .pptx/.pdf ke backend (FR-01).
 */
import { apiUpload } from '../../../services/apiUpload';
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '../constants/uploadLimits';
import { validateUploadFileStrict, type FileValidationResult } from '../utils/fileValidation';

export type SourceValidation = { valid: true; hash?: string; ext?: 'pdf' | 'pptx' } | { valid: false; error: string };

/**
 * Validasi awal cepat (sinkron): ekstensi dan batas ukuran file.
 */
export function validateSourceFile(file: File): SourceValidation {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (!allowed) return { valid: false, error: 'Pakai file .pptx atau .pdf ya.' };
  if (file.size === 0) return { valid: false, error: 'File-nya kosong (0 bytes).' };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `File-nya kegedean, maksimal ${MAX_UPLOAD_LABEL}.` };
  }
  return { valid: true };
}

/**
 * Validasi ketat menyeluruh (asinkron):
 * Magic bytes, deteksi enkripsi/password, dan komputasi hash SHA-256.
 */
export async function validateSourceFileStrict(file: File): Promise<FileValidationResult> {
  return validateUploadFileStrict(file);
}

type UploadResponse = { status: string; projectId?: string };

export function uploadSource(
  file: File,
  title: string,
  options: { onProgress?: (percent: number) => void } = {},
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('sourceFile', file);
  formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
  return apiUpload<UploadResponse>('/projects/ingest', formData, options);
}
