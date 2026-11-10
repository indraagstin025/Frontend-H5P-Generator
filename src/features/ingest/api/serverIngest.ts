/**
 * Ingest via server (OnlyOffice render): upload → poll job → fetch slides.
 * Dipakai IngestStep sebagai jalur utama; gagal → fallback lokal.
 */
import { API_BASE_URL } from '../../../config/env';
import { apiFetch } from '../../../services/api';
import { apiUpload } from '../../../services/apiUpload';
import { createProject } from '../../studio/constants/h5pModel';
import type { AspectRatio, Project, Slide, SlideElement } from '../../studio/constants/h5pModel';

interface ServerIngestResponse {
  data: {
    project: { id: string };
    job: { id: string };
    file: { name: string; size: number };
  };
}

interface ServerJob {
  data: { status: string; progress: number; message: string; projectId: string };
}

interface ServerSlideRow {
  id: string;
  order: number;
  title: string;
  chapter?: string;
  tone?: Slide['tone'];
  aspect?: AspectRatio;
  keywords?: Slide['keywords'];
  backgroundUrl?: string | null;
  backgroundPending?: boolean;
  elements?: Array<Record<string, unknown>>;
}

function absUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const rel = path.startsWith('/') ? path : `/${path}`;
  // Server mengembalikan path relatif ke /api (mis. /projects/..), tempel API_BASE_URL.
  return `${API_BASE_URL}${rel}`;
}

function mapElement(raw: Record<string, unknown>, _slideCount: number): SlideElement | null {
  const kind = raw.kind as SlideElement['kind'];
  const base = {
    id: typeof raw.id === 'string' ? raw.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    position: raw.position as SlideElement['position'],
    displayAsButton: Boolean(raw.displayAsButton),
    buttonLabel: typeof raw.buttonLabel === 'string' ? raw.buttonLabel : '',
    title: typeof raw.title === 'string' ? raw.title : '',
  };
  if (!kind || !base.position) return null;
  if (kind === 'image' || kind === 'audio' || kind === 'video') {
    const assetUrl = typeof raw.assetUrl === 'string' ? raw.assetUrl : null;
    const url = absUrl(assetUrl);
    const fileName = typeof raw.fileName === 'string' ? raw.fileName : '';
    if (kind === 'video') {
      return {
        ...base,
        kind,
        fileName,
        objectUrl: url,
        videoUrl: typeof raw.videoUrl === 'string' ? raw.videoUrl : '',
        file: null,
      } as SlideElement;
    }
    return {
      ...base,
      kind,
      alt: kind === 'image' && typeof raw.alt === 'string' ? raw.alt : '',
      fileName,
      objectUrl: url,
      file: null,
    } as SlideElement;
  }
  return { ...base, ...(raw as object) } as SlideElement;
}

function mapSlide(row: ServerSlideRow, aspectFallback: AspectRatio): Slide {
  const elements: SlideElement[] = [];
  for (const raw of row.elements ?? []) {
    const el = mapElement(raw, 0);
    if (el) elements.push(el);
  }
  const title = row.title?.trim() || `Slide ${row.order}`;
  return {
    id: row.id,
    order: row.order,
    title,
    chapter: row.chapter ?? `Bab ${String(Math.ceil(row.order / 4)).padStart(2, '0')}`,
    tone: row.tone ?? 'paper',
    aspect: row.aspect ?? aspectFallback,
    backgroundUrl: absUrl(row.backgroundUrl),
    keywords: row.keywords ?? [{ main: title, subs: [] }],
    elements,
  };
}

export interface ServerConvertResult {
  project: Project;
  serverProjectId: string;
  backgroundReady: boolean;
  jobMessage: string;
}

export async function convertViaServer(
  file: File,
  title: string,
  aspect: AspectRatio,
  opts: { onProgress?: (percent: number, status: string) => void; signal?: AbortSignal } = {},
): Promise<ServerConvertResult> {
  const form = new FormData();
  form.append('sourceFile', file);
  form.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
  opts.onProgress?.(4, 'Mengunggah ke server…');

  const up = await apiUpload<ServerIngestResponse>('/projects/ingest', form, {
    onProgress: (p) => opts.onProgress?.(Math.min(20, Math.round(p * 0.2)), 'Mengunggah ke server…'),
  });
  const { project: srvProject, job } = up.data;
  const projectId = srvProject.id;

  // Polling job sampai done/error (maks ~5 menit, ikut ONLYOFFICE_TIMEOUT_MS server)
  const started = Date.now();
  const TIMEOUT_MS = 5 * 60 * 1000;
  for (;;) {
    if (opts.signal?.aborted) throw new Error('Dibatalkan.');
    const res = await apiFetch<ServerJob>(`/ingest-jobs/${job.id}`, { timeout: 15000 });
    const j = res.data;
    const pct = 20 + Math.round(((j.progress ?? 0) / 100) * 75);
    opts.onProgress?.(Math.min(95, pct), j.message || 'Server memproses…');
    if (j.status === 'done') break;
    if (j.status === 'error') throw new Error(j.message || 'Server gagal mengubah file.');
    if (Date.now() - started > TIMEOUT_MS) throw new Error('Server kelamaan, coba lagi atau kecilkan file.');
    await new Promise((r) => setTimeout(r, 1500));
  }

  const slidesRes = await apiFetch<{ data: ServerSlideRow[] }>(`/projects/${projectId}/slides`, { timeout: 30000 });
  const rows = slidesRes.data;
  if (rows.length === 0) throw new Error('Server tidak mengembalikan slide.');
  const slides = rows.map((r) => mapSlide(r, aspect));
  const backgroundReady = rows.some((r) => r.backgroundUrl);

  const project = createProject(title, slides[0]?.aspect ?? aspect, file.name);
  project.slides = slides;
  opts.onProgress?.(100, 'Siap.');
  return {
    project,
    serverProjectId: projectId,
    backgroundReady,
    jobMessage: backgroundReady ? '' : 'Latar presisi belum ada (server render belum aktif), gradien dipakai dulu.',
  };
}
