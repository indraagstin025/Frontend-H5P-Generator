/**
 * Riwayat unduhan paket (H5P/SCORM) di browser — tampil di dashboard.
 * Ringan: judul + format + ukuran + waktu, maksimal 20 entri.
 */

export interface ExportRecord {
  id: string;
  title: string;
  format: 'H5P' | 'SCORM 1.2';
  sizeKb: number;
  at: string;
}

const KEY = 'h5p-generator:exports:v1';
const MAX = 20;

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function loadExportHistory(): ExportRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExportRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordExport(entry: Omit<ExportRecord, 'id' | 'at'>): ExportRecord[] {
  const next: ExportRecord[] = [{ ...entry, id: uid(), at: new Date().toISOString() }, ...loadExportHistory()].slice(
    0,
    MAX,
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // penyimpanan penuh — abaikan
  }
  return next;
}
