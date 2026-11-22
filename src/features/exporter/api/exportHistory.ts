/**
 * Riwayat unduhan paket (H5P/SCORM) terintegrasi ke backend PostgreSQL per userId,
 * dengan cache ringan localStorage untuk tampilan awal instan.
 */
import { apiFetch } from '../../../services/api';
import { getExportsStorageKey } from '../../../services/authService';
import { isBrowserOffline } from '../../../services/network';

export interface ExportRecord {
  id: string;
  projectId?: string | null;
  title: string;
  format: 'H5P' | 'SCORM 1.2';
  sizeKb: number;
  at: string;
  sourceFileName?: string | null;
}

interface ServerExportRecord {
  id: string;
  projectId?: string | null;
  title: string;
  format: string;
  sizeKb: number;
  sourceFileName: string | null;
  createdAt: string;
}

const MAX = 50;

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function writeExportCache(records: ExportRecord[]): void {
  try {
    localStorage.setItem(getExportsStorageKey(), JSON.stringify(records.slice(0, MAX)));
  } catch {
    // penyimpanan penuh — abaikan agar editor tetap lancar
  }
}

function mapServerExportRecord(row: ServerExportRecord): ExportRecord {
  return {
    id: row.id,
    projectId: row.projectId ?? null,
    title: row.title,
    format: row.format === 'SCORM 1.2' ? 'SCORM 1.2' : 'H5P',
    sizeKb: Math.max(1, Number(row.sizeKb) || 1),
    at: row.createdAt,
    sourceFileName: row.sourceFileName,
  };
}

export function loadExportHistory(): ExportRecord[] {
  try {
    const raw = localStorage.getItem(getExportsStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExportRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function cacheExportRecord(entry: Omit<ExportRecord, 'id' | 'at'>): ExportRecord[] {
  const next: ExportRecord[] = [{ ...entry, id: uid(), at: new Date().toISOString() }, ...loadExportHistory()].slice(
    0,
    MAX,
  );
  writeExportCache(next);
  return next;
}

export async function fetchExportHistory(): Promise<ExportRecord[]> {
  if (isBrowserOffline()) {
    return loadExportHistory();
  }
  const res = await apiFetch<{ data: ServerExportRecord[] }>('/exports');
  const mapped = Array.isArray(res.data) ? res.data.map(mapServerExportRecord) : [];
  writeExportCache(mapped);
  return mapped;
}

export async function persistFallbackExport(entry: Omit<ExportRecord, 'id' | 'at'>): Promise<void> {
  if (isBrowserOffline()) return;
  try {
    await apiFetch<{ data: ServerExportRecord }>('/exports', {
      method: 'POST',
      body: {
        projectId: entry.projectId ?? null,
        title: entry.title,
        format: entry.format,
        sizeKb: entry.sizeKb,
        sourceFileName: entry.sourceFileName ?? null,
      },
    });
  } catch {
    // Tetap biarkan cache lokal agar pengalaman ekspor tidak terganggu
  }
}
