/**
 * Modul Resolusi & Penanganan Media H5P (packager/mediaResolver.ts)
 * 
 * Bertanggung jawab atas:
 * 1. Sniffing magic bytes berkas biner (gambar, audio, video).
 * 2. Pemetaan MIME type dan ekstensi konten H5P.
 * 3. Pengambilan (fetch) aset media dari blob lokal atau server/objectUrl.
 * 4. Normalisasi dan pembersihan format media sebelum dimasukkan ke ZIP H5P.
 */

import type {
  AudioElement,
  ImageElement,
  Project,
  SlideElement,
  VideoElement,
} from '../../../studio/constants/h5pModel';
import { getMedia } from '../../../studio/utils/mediaRegistry';

export const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

export const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
};

export type MediaKind = 'image' | 'audio' | 'video';
export type MediaElement = ImageElement | AudioElement | VideoElement;

export const MEDIA_DIR: Record<MediaKind, string> = {
  image: 'images',
  audio: 'audios',
  video: 'videos',
};

export const MEDIA_MIME: Record<MediaKind, Record<string, string>> = {
  image: IMAGE_MIME,
  audio: AUDIO_MIME,
  video: VIDEO_MIME,
};

export const MEDIA_FALLBACK_EXT: Record<MediaKind, string> = {
  image: 'png',
  audio: 'mp3',
  video: 'mp4',
};

export const MEDIA_LABEL: Record<MediaKind, string> = {
  image: 'Gambar',
  audio: 'Suara',
  video: 'Video',
};

/** Batas ukuran mengikuti editor properti (video 50 MB, media lain 10 MB). */
export const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

export const ASSET_FETCH_TIMEOUT_MS = 20_000;

export const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

/** Aset media yang sudah siap ditulis ke content/ dan dirujuk action. */
export interface ResolvedMedia {
  bytes: Uint8Array;
  ext: string;
  mime: string;
  /** Path relatif terhadap folder content/ di paket .h5p. */
  path: string;
}

export function isMediaElement(el: SlideElement): el is MediaElement {
  return el.kind === 'image' || el.kind === 'audio' || el.kind === 'video';
}

export function mediaContentPath(kind: MediaKind, id: string, ext: string): string {
  return `${MEDIA_DIR[kind]}/el-${id.slice(0, 8)}.${ext}`;
}

export function extFromName(name: string): string {
  const clean = name.split('?')[0].split('#')[0];
  return sanitizeExt(clean.split('/').pop() ?? '', '');
}

export function allowedExt(kind: MediaKind, ext: string): string {
  return ext && MEDIA_MIME[kind][ext] ? ext : '';
}

export function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return '';
  let out = '';
  for (let i = 0; i < length; i += 1) out += String.fromCharCode(bytes[offset + i]);
  return out;
}

/**
 * Tebak format gambar dari magic bytes (hanya yang lolos whitelist konten Lumi).
 */
export function sniffImageKind(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    bytes.length > 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (bytes.length > 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  return null;
}

/**
 * Tebak jenis media dari magic bytes. Ekstensi hasil tebakan dipakai agar
 * path di content.json selalu cocok dengan isi berkas, walau nama dari
 * server keliru atau URL tidak punya ekstensi.
 */
export function sniffMediaKind(kind: MediaKind, bytes: Uint8Array): { ext: string; mime: string } | null {
  if (kind === 'image') return sniffImageKind(bytes);
  if (kind === 'audio') {
    if (asciiAt(bytes, 0, 3) === 'ID3') return { ext: 'mp3', mime: 'audio/mpeg' };
    if (bytes.length > 1 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
      return { ext: 'mp3', mime: 'audio/mpeg' };
    }
    if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WAVE') {
      return { ext: 'wav', mime: 'audio/wav' };
    }
    if (asciiAt(bytes, 0, 4) === 'OggS') return { ext: 'ogg', mime: 'audio/ogg' };
    if (asciiAt(bytes, 4, 4) === 'ftyp') return { ext: 'm4a', mime: 'audio/mp4' };
    return null;
  }
  if (asciiAt(bytes, 4, 4) === 'ftyp') return { ext: 'mp4', mime: 'video/mp4' };
  if (bytes.length > 3 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { ext: 'webm', mime: 'video/webm' };
  }
  if (asciiAt(bytes, 0, 4) === 'OggS') return { ext: 'ogv', mime: 'video/ogg' };
  return null;
}

export function chooseMediaExt(kind: MediaKind, bytes: Uint8Array, mime: string, names: string[]): string {
  const sniffed = sniffMediaKind(kind, bytes);
  if (sniffed) return sniffed.ext;
  const fromMime = allowedExt(kind, MIME_EXT[mime.toLowerCase()] ?? '');
  if (fromMime) return fromMime;
  for (const name of names) {
    const ext = allowedExt(kind, extFromName(name));
    if (ext) return ext;
  }
  return MEDIA_FALLBACK_EXT[kind];
}

export async function fetchMediaBytes(
  url: string,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; mime: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSET_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error(`ukuran melebihi ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0) throw new Error('berkas kosong');
    if (bytes.length > maxBytes) {
      throw new Error(`ukuran melebihi ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    return { bytes, mime: (res.headers.get('content-type') ?? '').split(';')[0].trim() };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('waktu pengambilan habis');
    }
    if (err instanceof TypeError) {
      throw new Error('tidak bisa diambil (jaringan/CORS)');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fileToBytes(file: unknown): Promise<Uint8Array> {
  if (file && typeof (file as Blob).arrayBuffer === 'function') {
    return new Uint8Array(await (file as Blob).arrayBuffer());
  }
  return new Uint8Array(0);
}

/** Ambil bytes + ekstensi aset elemen, baik dari File lokal maupun objectUrl server. */
export async function resolveMediaElement(el: MediaElement): Promise<ResolvedMedia | null> {
  let bytes: Uint8Array;
  let mime = '';
  let names: string[] = [];
  const candidate = el.file ?? getMedia(el.id)?.file;
  if (candidate && typeof (candidate as Blob).arrayBuffer === 'function') {
    bytes = await fileToBytes(candidate);
    mime = (candidate as File).type || '';
    names = [(candidate as File).name, el.fileName].filter(Boolean);
  } else {
    if (!el.objectUrl) return null;
    const fetched = await fetchMediaBytes(el.objectUrl, MEDIA_MAX_BYTES[el.kind]);
    bytes = fetched.bytes;
    mime = fetched.mime;
    names = [el.fileName, el.objectUrl];
  }
  const sniffed = sniffMediaKind(el.kind, bytes);
  const ext = chooseMediaExt(el.kind, bytes, mime, names);
  return {
    bytes,
    ext,
    mime: MEDIA_MIME[el.kind][ext] ?? sniffed?.mime ?? 'application/octet-stream',
    path: mediaContentPath(el.kind, el.id, ext),
  };
}

/**
 * Kumpulkan aset gambar/audio/video dari semua slide. Aset server (objectUrl)
 * di-fetch ulang supaya ikut masuk paket; batasi 4 fetch paralel agar tidak
 * membanjiri backend saat satu presentasi berisi banyak gambar.
 */
export async function resolveProjectMedia(project: Project): Promise<{
  media: Map<string, ResolvedMedia>;
  failed: string[];
}> {
  const media = new Map<string, ResolvedMedia>();
  const failed: string[] = [];
  const queue: Array<{ el: MediaElement; order: number }> = [];
  for (const slide of project.slides) {
    for (const el of slide.elements) {
      if (isMediaElement(el) && (el.file || el.objectUrl || getMedia(el.id)?.file)) {
        queue.push({ el, order: slide.order });
      }
    }
  }
  let cursor = 0;
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;
      const { el, order } = queue[index];
      try {
        const resolved = await resolveMediaElement(el);
        if (resolved) media.set(el.id, resolved);
      } catch (err) {
        const name = el.fileName || el.title || 'tanpa nama';
        const detail = err instanceof Error ? err.message : String(err);
        failed.push(`Slide ${order}: ${MEDIA_LABEL[el.kind]} ${name} — ${detail}`);
      }
    }
  });
  await Promise.all(workers);
  return { media, failed };
}

export function sanitizeExt(name: string, fallback: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{2,4}$/.test(ext) ? ext : fallback;
}

export function fileRef(path: string, mime: string, title: string) {
  return { path, mime, copyright: { license: 'U' }, title };
}

export function clampPct(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
}
