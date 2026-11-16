/**
 * Layanan exporter H5P terpadu (Opsi B: Lumi Server Export sebagai jalur utama,
 * fallback perakit lokal hanya untuk draf offline atau ketika backend mati).
 */
import { ApiError } from '../../../services/api';
import { exportProjectFromServer, isServerProjectId } from '../../ingest/api/serverIngest';
import type { Project } from '../../studio/constants/h5pModel';
import { recordExport } from './exportHistory';
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

  if (isServerProjectId(project.id)) {
    if (onBeforeExport) {
      const synced = await onBeforeExport();
      if (!synced) {
        throw new Error('Gagal menyinkronkan perubahan ke server sebelum mengekspor.');
      }
    }

    try {
      const { blob, filename } = await exportProjectFromServer(project.id);
      const name = filename || safeFileName(project.title);
      const sizeKb = Math.max(1, Math.round(blob.size / 1024));
      downloadBlob(blob, name);
      recordExport({
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
      if (err instanceof ApiError) {
        const detail = err.issues?.length ? err.issues[0] : err.message;
        throw new Error(detail);
      }
      // Fallback ke perakit lokal hanya jika koneksi server terputus / offline
    }
  }

  try {
    const { blob, bundled, backgrounds, media } = await buildH5p(project, cpMinor);
    const name = safeFileName(project.title);
    const sizeKb = Math.max(1, Math.round(blob.size / 1024));
    downloadBlob(blob, name);
    recordExport({
      title: project.title,
      format: 'H5P',
      sizeKb,
      sourceFileName: project.sourceFileName,
    });
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
    throw err instanceof Error ? err : new Error('Gagal membuat file .h5p.');
  }
}
