/**
 * Layanan exporter (FR-11/FR-12). Stub: backend packager menyusul.
 * Kontrak unduhan .h5p tetap di sini agar UI tidak berubah saat backend jadi.
 */
import { apiFetch } from '../../../services/api';

type ExportResponse = { status: string; downloadUrl?: string };

export function requestExport(projectId: string): Promise<ExportResponse> {
  return apiFetch<ExportResponse>(`/projects/${projectId}/export`, { method: 'POST' });
}
