/**
 * Layanan exporter H5P terpadu (Opsi B: Lumi Server Export sebagai jalur utama,
 * fallback perakit lokal hanya untuk draf offline atau ketika backend mati).
 */
import { ApiError } from '../../../services/api';
import { formatNetworkError, isBrowserOffline, isNetworkFailure, NetworkError } from '../../../services/network';
import { exportProjectFromServer, isServerProjectId } from '../../ingest/api/serverIngest';
import type { Project } from '../../studio/constants/h5pModel';
import { cacheExportRecord, persistFallbackExport } from './exportHistory';
import { MissingLibrariesError, buildH5p, downloadBlob, safeFileName } from './h5pPackager';

export interface UnifiedExportResult {
  name: string;
  sizeKb: number;
  source: 'server' | 'local';
  notice: string;
}

export async function exportH5pPackage(opts: {
  project: Project;
  cpMinor: number;
  onBeforeExport?: () => Promise<boolean>;
}): Promise<UnifiedExportResult> {
  const { project, cpMinor, onBeforeExport } = opts;

  if (isBrowserOffline()) {
    throw new NetworkError('offline');
  }

  if (isServerProjectId(project.id)) {
    if (onBeforeExport) {
      const synced = await onBeforeExport();
      if (!synced) {
        throw new Error('Gagal menyinkronkan perubahan ke server sebelum mengekspor. Periksa koneksi internet Anda.');
      }
    }

    try {
      const { blob, filename } = await exportProjectFromServer(project.id);
      const name = filename || safeFileName(project.title);
      const sizeKb = Math.max(1, Math.round(blob.size / 1024));
      downloadBlob(blob, name);
      cacheExportRecord({
        projectId: project.id,
        title: project.title,
        format: 'H5P',
        sizeKb,
        sourceFileName: project.sourceFileName,
      });
      return {
        name,
        sizeKb,
        source: 'server',
        notice: `${name} berhasil diekspor dari server Lumi (${sizeKb} KB).`,
      };
    } catch (err) {
      if (isNetworkFailure(err)) {
        throw new NetworkError(
          isBrowserOffline() ? 'offline' : 'unreachable',
          formatNetworkError(err, 'Gagal mengekspor karena koneksi ke server terputus.'),
        );
      }
      if (err instanceof ApiError) {
        const detail = err.issues?.length ? err.issues[0] : err.message;
        throw new Error(detail);
      }
      // Fallback perakit lokal jika Lumi server engine tidak aktif meski koneksi normal
    }
  }

  try {
    const { blob, bundled, backgrounds, media } = await buildH5p(project, cpMinor);
    const name = safeFileName(project.title);
    const sizeKb = Math.max(1, Math.round(blob.size / 1024));
    downloadBlob(blob, name);
    const exportEntry = {
      projectId: isServerProjectId(project.id) ? project.id : null,
      title: project.title,
      format: 'H5P' as const,
      sizeKb,
      sourceFileName: project.sourceFileName,
    };
    cacheExportRecord(exportEntry);
    void persistFallbackExport(exportEntry);
    const bits: string[] = [];
    if (bundled.length > 0) bits.push(`${bundled.length} library ikut di dalam`);
    if (media.bundled > 0) bits.push(`${media.bundled} media ikut di paket`);
    if (backgrounds.real > 0) bits.push(`${backgrounds.real} latar asli ikut di paket`);
    else bits.push('latar gradien (gambar asli tidak ketemu)');
    const mediaNote =
      media.failed.length > 0 ? ` ${media.failed.length} media gagal diambil (${media.failed[0]}).` : '';
    const prefix = isServerProjectId(project.id) ? 'Server tidak terjangkau — dirakit lokal. ' : '';
    return {
      name,
      sizeKb,
      source: 'local',
      notice: `${prefix}${name} terunduh (${bits.join(', ')}).${mediaNote}`,
    };
  } catch (err) {
    if (err instanceof MissingLibrariesError) {
      throw new Error(err.message);
    }
    throw new Error(formatNetworkError(err, 'Gagal membuat file .h5p.'));
  }
}
