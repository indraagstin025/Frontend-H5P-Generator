/**
 * Ingest via server (OnlyOffice render): upload → poll job → fetch slides.
 * Dipakai IngestStep sebagai jalur utama; gagal → fallback lokal.
 */
import { API_BASE_URL } from '../../../config/env';
import { apiDownload, apiFetch } from '../../../services/api';
import { apiUpload, ApiUploadError } from '../../../services/apiUpload';
import { createProject } from '../../studio/constants/h5pModel';
import type { AspectRatio, Project, ProjectSettings, Slide, SlideElement } from '../../studio/constants/h5pModel';

export { ApiUploadError };

export function isServerProjectId(id: string | null | undefined): id is string {
  return typeof id === 'string' && id.length > 0 && !id.startsWith('temp-') && !id.startsWith('local-');
}

export function isUploadValidationError(err: unknown): boolean {
  if (err instanceof ApiUploadError) {
    return err.status === 400 || err.status === 409 || err.status === 413 || err.status === 422;
  }
  return false;
}

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

export function absUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const rel = path.startsWith('/') ? path : `/${path}`;
  // Server mengembalikan path relatif ke /api (mis. /projects/..), tempel API_BASE_URL.
  return `${API_BASE_URL}${rel}`;
}

export function parseProjectSettings(
  settingsJson: unknown,
  title: string,
  aspect: AspectRatio,
  fallback: ProjectSettings,
): ProjectSettings {
  const next: ProjectSettings = { ...fallback, projectTitle: title, aspect };
  if (typeof settingsJson !== 'string' || !settingsJson.trim()) return next;
  try {
    const parsed = JSON.parse(settingsJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return next;
    if (parsed.language === 'id' || parsed.language === 'en') next.language = parsed.language;
    if (typeof parsed.keywordListEnabled === 'boolean') next.keywordListEnabled = parsed.keywordListEnabled;
    if (typeof parsed.activeSurface === 'boolean') next.activeSurface = parsed.activeSurface;
    if (typeof parsed.hideSummarySlide === 'boolean') next.hideSummarySlide = parsed.hideSummarySlide;
    if (typeof parsed.showSolutionButton === 'boolean') next.showSolutionButton = parsed.showSolutionButton;
    if (typeof parsed.retryButton === 'boolean') next.retryButton = parsed.retryButton;
  } catch {
    // Abaikan JSON settings tidak valid
  }
  return next;
}

function mapElement(raw: Record<string, unknown>, _slideCount: number): SlideElement | null {
  const kind = raw.kind as SlideElement['kind'];
  const base = {
    id: typeof raw.id === 'string' ? raw.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    position: raw.position as SlideElement['position'],
    displayAsButton: Boolean(raw.displayAsButton),
    buttonLabel: typeof raw.buttonLabel === 'string' ? raw.buttonLabel : '',
    title: typeof raw.title === 'string' ? raw.title : '',
    ...(typeof raw.rotation === 'number' ? { rotation: raw.rotation } : {}),
    ...(typeof raw.popupButtonInvisible === 'boolean' ? { popupButtonInvisible: raw.popupButtonInvisible } : {}),
    ...(typeof raw.popupButtonOpacity === 'number' ? { popupButtonOpacity: raw.popupButtonOpacity } : {}),
    ...(typeof raw.popupButtonAutoHide === 'boolean' ? { popupButtonAutoHide: raw.popupButtonAutoHide } : {}),
    ...(typeof raw.popupButtonVisibleSeconds === 'number'
      ? { popupButtonVisibleSeconds: raw.popupButtonVisibleSeconds }
      : {}),
  };
  if (!kind || !base.position) return null;
  if (kind === 'image' || kind === 'audio' || kind === 'video') {
    const assetUrl = typeof raw.assetUrl === 'string' ? raw.assetUrl : null;
    const url = absUrl(assetUrl) ?? (typeof raw.objectUrl === 'string' ? raw.objectUrl : null);
    const asset = typeof raw.asset === 'string' ? raw.asset : undefined;
    const fileName = typeof raw.fileName === 'string' ? raw.fileName : '';
    if (kind === 'video') {
      return {
        ...(raw as object),
        ...base,
        kind,
        ...(asset ? { asset } : {}),
        fileName,
        objectUrl: url,
        videoUrl: typeof raw.videoUrl === 'string' ? raw.videoUrl : '',
        file: null,
      } as SlideElement;
    }
    return {
      ...(raw as object),
      ...base,
      kind,
      ...(asset ? { asset } : {}),
      alt: kind === 'image' && typeof raw.alt === 'string' ? raw.alt : '',
      fileName,
      objectUrl: url,
      file: null,
    } as SlideElement;
  }
  return { ...(raw as object), ...base } as SlideElement;
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
  project.id = projectId;
  project.slides = slides;
  opts.onProgress?.(100, 'Siap.');
  return {
    project,
    serverProjectId: projectId,
    backgroundReady,
    jobMessage: backgroundReady ? '' : 'Latar presisi belum ada (server render belum aktif), gradien dipakai dulu.',
  };
}

interface ServerProjectRecord {
  id: string;
  title: string;
  aspect: string;
  settingsJson?: string;
  sourceFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mengambil proyek, settings, dan seluruh slide dari server backend.
 */
export async function fetchServerProject(projectId: string): Promise<Project> {
  const pRes = await apiFetch<{ data: ServerProjectRecord }>(`/projects/${projectId}`);
  const srv = pRes.data;
  const aspect: AspectRatio = srv.aspect === '4:3' ? '4:3' : '16:9';

  const slidesRes = await apiFetch<{ data: ServerSlideRow[] }>(`/projects/${projectId}/slides`);
  const rows = slidesRes.data ?? [];
  const slides = rows.map((r) => mapSlide(r, aspect));

  const project = createProject(srv.title, aspect, srv.sourceFileName);
  project.id = srv.id;
  project.createdAt = srv.createdAt;
  project.updatedAt = srv.updatedAt;
  project.settings = parseProjectSettings(srv.settingsJson, srv.title, aspect, project.settings);
  project.slides = slides;
  return project;
}

/** Membuat proyek baru di PostgreSQL (beserta slide awal bila diberikan). */
export async function createServerProject(input: {
  title: string;
  aspect: AspectRatio;
  sourceFileName?: string | null;
  initialSlides?: Slide[];
}): Promise<Project> {
  const created = await apiFetch<{ data: ServerProjectRecord }>('/projects', {
    method: 'POST',
    body: { title: input.title.trim() || 'Modul baru', aspect: input.aspect },
  });
  const srv = created.data;
  const base = createProject(srv.title, srv.aspect === '4:3' ? '4:3' : '16:9', input.sourceFileName ?? null);
  base.id = srv.id;
  base.createdAt = srv.createdAt;
  base.updatedAt = srv.updatedAt;

  if (input.initialSlides && input.initialSlides.length > 0) {
    await apiFetch(`/projects/${srv.id}/slides`, {
      method: 'PUT',
      body: { slides: input.initialSlides },
    });
    base.slides = input.initialSlides;
  }

  return fetchServerProject(srv.id).catch(() => base);
}

/** Menggandakan proyek (termasuk slide & aset) di server. */
export async function duplicateServerProject(projectId: string): Promise<Project> {
  const res = await apiFetch<{ data: ServerProjectRecord }>(`/projects/${projectId}/duplicate`, {
    method: 'POST',
  });
  return fetchServerProject(res.data.id);
}

/** Mengunggah berkas media elemen Studio (gambar/audio/video) ke folder assets proyek. */
export async function uploadProjectMediaAsset(
  projectId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{
  asset: string;
  assetUrl: string;
  fileName: string;
  mime: string;
  size: number;
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiUpload<{
    data: { asset: string; assetUrl: string; fileName: string; mime: string; size: number };
  }>(`/projects/${projectId}/assets`, form, { onProgress });
  return {
    ...res.data,
    assetUrl: absUrl(res.data.assetUrl) ?? res.data.assetUrl,
  };
}

/** Mengunggah aset blob hasil ekstraksi impor .h5p ke server dan menyimpan slide/settings. */
export async function persistImportedH5pProject(parsed: Project): Promise<Project> {
  const created = await createServerProject({
    title: parsed.title,
    aspect: parsed.settings.aspect,
    sourceFileName: parsed.sourceFileName,
  });
  const projectId = created.id;

  const blobToFile = async (url: string, fallbackName: string): Promise<File | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const mime = blob.type || 'image/png';
      const extFromMime = mime.split('/').pop()?.replace('jpeg', 'jpg')?.replace('svg+xml', 'svg') ?? 'png';
      const name = fallbackName.includes('.') ? fallbackName : `${fallbackName}.${extFromMime}`;
      return new File([blob], name, { type: mime });
    } catch {
      return null;
    }
  };

  const slides: Slide[] = [];
  for (const slide of parsed.slides) {
    let backgroundUrl = slide.backgroundUrl;
    if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
      const bgFile = await blobToFile(backgroundUrl, `slide-${slide.order}.png`);
      if (bgFile) {
        const uploadedBg = await uploadProjectMediaAsset(projectId, bgFile);
        backgroundUrl = uploadedBg.assetUrl;
      }
    }

    const elements: SlideElement[] = [];
    for (const el of slide.elements) {
      if ((el.kind === 'image' || el.kind === 'audio' || el.kind === 'video') && el.objectUrl?.startsWith('blob:')) {
        const mediaFile = await blobToFile(el.objectUrl, el.fileName || `media-${el.id.slice(0, 6)}`);
        if (mediaFile) {
          const uploaded = await uploadProjectMediaAsset(projectId, mediaFile);
          elements.push({
            ...el,
            asset: uploaded.asset,
            fileName: uploaded.fileName,
            objectUrl: uploaded.assetUrl,
            file: null,
          });
          continue;
        }
      }
      elements.push(el);
    }

    slides.push({ ...slide, backgroundUrl, elements });
  }

  await apiFetch(`/projects/${projectId}/slides`, {
    method: 'PUT',
    body: { slides },
  });
  await apiFetch(`/projects/${projectId}`, {
    method: 'PATCH',
    body: {
      title: parsed.title,
      settings: {
        language: parsed.settings.language,
        keywordListEnabled: parsed.settings.keywordListEnabled,
        activeSurface: parsed.settings.activeSurface,
        hideSummarySlide: parsed.settings.hideSummarySlide,
        showSolutionButton: parsed.settings.showSolutionButton,
        retryButton: parsed.settings.retryButton,
      },
    },
  });

  return fetchServerProject(projectId);
}

/** Mengambil laporan pra-ekspor Lumi Server (GET /api/projects/:id/export-report). */
export async function fetchProjectExportReport(projectId: string) {
  const res = await apiFetch<{
    data: {
      ok: boolean;
      issues: string[];
      warnings: string[];
      mainLibrary: string | null;
      slideCount: number;
      quizCount: number;
    };
  }>(`/projects/${projectId}/export-report`);
  return res.data;
}

/** Mengekspor & mengunduh paket .h5p resmi dari Lumi Server (Opsi B: POST /api/projects/:id/export). */
export async function exportProjectFromServer(projectId: string) {
  return apiDownload(`/projects/${projectId}/export`, { method: 'POST', timeout: 120_000 });
}

/** Mengambil riwayat skor player server untuk satu proyek (GET /api/projects/:id/attempts). */
export async function fetchProjectAttempts(projectId: string) {
  const res = await apiFetch<{
    data: Array<{ id: string; score: number; maxScore: number; createdAt: string }>;
  }>(`/projects/${projectId}/attempts`);
  return res.data;
}
