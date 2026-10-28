/**
 * In-memory cache untuk objek File dan Blob URL selama sesi browser.
 * Mencegah file media (gambar, audio, video) hilang saat draf diserialisasi ke localStorage.
 */
import type { SlideElement } from '../constants/h5pModel';

interface MediaItem {
  file: File;
  objectUrl: string;
}

const registry = new Map<string, MediaItem>();

/** Daftarkan berkas media saat diunggah */
export function registerMedia(elementId: string, file: File, objectUrl: string): void {
  registry.set(elementId, { file, objectUrl });
}

/** Ambil berkas media berdasarkan ID elemen */
export function getMedia(elementId: string): MediaItem | undefined {
  return registry.get(elementId);
}

/** Pulihkan referensi file dan objectUrl pada elemen jika tersedia di cache memori */
export function hydrateElementMedia(el: SlideElement): SlideElement {
  const cached = registry.get(el.id);
  if (!cached) return el;

  if (el.kind === 'image' || el.kind === 'audio' || el.kind === 'video') {
    return {
      ...el,
      file: el.file ?? cached.file,
      objectUrl: el.objectUrl ?? cached.objectUrl,
    };
  }
  return el;
}
