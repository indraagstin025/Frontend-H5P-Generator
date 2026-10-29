/**
 * Modul Pengemasan ZIP Arsip H5P (packager/zipBundler.ts)
 * 
 * Bertanggung jawab atas:
 * 1. Merender gambar latar slide (gambar asli server atau fallback canvas gradien).
 * 2. Mengumpulkan dan membundel pustaka dependensi H5P transitif (closure resolver).
 * 3. Membangun arsip ZIP mandiri .h5p tanpa entri direktori sesuai standar Lumiverse/H5P Hub.
 * 4. Helper utilitas unduhan berkas (downloadBlob) dan penamaan berkas aman (safeFileName).
 */

import { strToU8, zipSync } from 'fflate';
import type { Project, Slide } from '../../../studio/constants/h5pModel';
import {
  type SlideBackgroundRef,
  toContentJson,
  toManifest,
} from './elementMapper';
import { resolveProjectMedia, sniffImageKind } from './mediaResolver';

export const TONE_GRADIENTS: Record<string, [string, string, string]> = {
  lime: ['#d9f7aa', '#88cf68', '#23734b'],
  forest: ['#c9e9ae', '#5ca45a', '#174d39'],
  mint: ['#ebf8d4', '#a5db87', '#327b55'],
  paper: ['#fbfdec', '#d6edbc', '#82bc74'],
};

export function renderBackground(slide: Slide): Promise<Uint8Array> {
  const W = slide.aspect === '4:3' ? 1440 : 1920;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas tidak tersedia.'));
  const [c1, c2, c3] = TONE_GRADIENTS[slide.tone] ?? TONE_GRADIENTS.paper;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.47, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20, 63, 40, 0.62)';
  ctx.font = `700 ${Math.round(H * 0.022)}px sans-serif`;
  ctx.fillText(slide.chapter.toUpperCase(), W * 0.1, H * 0.14);
  ctx.fillStyle = '#123d2a';
  ctx.font = `700 ${Math.round(H * 0.075)}px sans-serif`;
  const words = slide.title.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W * 0.55 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
    if (lines.length === 3) break;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W * 0.1, H * (0.26 + i * 0.09)));
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal merender latar slide.'));
        return;
      }
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, 'image/png');
  });
}

export const BG_FETCH_TIMEOUT_MS = 20_000;
export const BG_MAX_BYTES = 8 * 1024 * 1024;

export interface ResolvedBackground {
  bytes: Uint8Array;
  ext: string;
  mime: string;
  /** true = gambar asli slide; false = gradien pengganti. */
  real: boolean;
}

/**
 * Ambil gambar latar asli (hasil render server) bila slide memilikinya;
 * gagal/ketiadaan backend → gradien canvas. Tidak pernah melempar error.
 */
export async function resolveSlideBackground(slide: Slide): Promise<ResolvedBackground> {
  if (slide.backgroundUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BG_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(slide.backgroundUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length === 0 || bytes.length > BG_MAX_BYTES) throw new Error('Ukuran tak wajar.');
        const kind = sniffImageKind(bytes);
        if (!kind) throw new Error('Bukan gambar.');
        return { bytes, ext: kind.ext, mime: kind.mime, real: true };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // jatuh ke gradien di bawah
    }
  }
  return { bytes: await renderBackground(slide), ext: 'png', mime: 'image/png', real: false };
}

/** Bangun paket .h5p utuh (hanya entri berkas, tanpa entri direktori). */
export interface H5pBuildResult {
  blob: Blob;
  /** Folder library yang ikut dibundel, mis. H5P.CoursePresentation-1.26. */
  bundled: string[];
  /** Dependensi yang tidak ketemu lokal (paket tetap jadi, tanpa library itu). */
  missing: string[];
  /** Latar: berapa slide pakai gambar asli vs gradien pengganti. */
  backgrounds: { real: number; gradient: number };
  /** Media elemen yang ikut dibundel dan yang gagal diambil dari server. */
  media: { bundled: number; failed: string[] };
}

export interface H5pBuildOptions {
  /** Default true: bundel folder library (paket mandiri, bisa dibuka di Lumi). */
  includeLibraries?: boolean;
  /** Ambil berkas library; default fetch dari /h5p-libraries (browser). */
  readLibraryFile?: (relPath: string) => Promise<Uint8Array>;
}

export async function fetchLibraryFile(relPath: string): Promise<Uint8Array> {
  const res = await fetch(`/h5p-libraries/${relPath}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${relPath}`);
  return new Uint8Array(await res.arrayBuffer());
}

export function decodeJson(raw: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(raw));
}

export interface LibDep {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

export type LibraryFileReader = (relPath: string) => Promise<Uint8Array>;

export interface LibraryBundle {
  /** Folder library yang ikut dibundel, mis. H5P.CoursePresentation-1.26. */
  bundled: string[];
  /** Dependensi yang tidak ketemu lokal. */
  missing: string[];
  /** Entri ZIP siap gabung: H5P.X-1.y/rel/path → bytes. */
  files: Record<string, Uint8Array>;
}

/**
 * Bundel tutup dependensi transitif ke entri ZIP. Dipakai buildH5p;
 * diekspor agar bisa diuji headless dengan provider berkas disk.
 */
export async function bundleLibraryFiles(
  deps: LibDep[],
  readFile: LibraryFileReader,
): Promise<LibraryBundle> {
  const missingAll = deps.map((d) => `${d.machineName}-${d.majorVersion}.${d.minorVersion}`);
  let index: Record<string, string[]>;
  try {
    index = (await (async () => decodeJson(await readFile('index.json')))()) as Record<
      string,
      string[]
    >;
  } catch {
    return { bundled: [], missing: [...new Set(missingAll)], files: {} };
  }
  const readJson = async (rel: string): Promise<unknown> => decodeJson(await readFile(rel));
  const { bundled, missing } = await resolveLibraryClosure(deps, readJson, index);
  const files: Record<string, Uint8Array> = {};
  await Promise.all(
    bundled.map(async (dir) => {
      // index menyimpan path relatif dari akar h5p-libraries (sudah termasuk dir)
      const got = await Promise.all(
        (index[dir] ?? []).map(async (rel) => {
          try {
            return { path: rel, bytes: await readFile(rel) } as const;
          } catch {
            return null;
          }
        }),
      );
      for (const entry of got) {
        if (entry) files[entry.path] = entry.bytes;
      }
    }),
  );
  return { bundled, missing: [...new Set(missing)], files };
}

export async function resolveLibraryClosure(
  deps: LibDep[],
  readJson: (relPath: string) => Promise<unknown>,
  index: Record<string, string[]> | null,
): Promise<{ bundled: string[]; missing: string[] }> {
  const bundled: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  const queue = [...deps];
  while (queue.length > 0) {
    const dep = queue.shift() as LibDep;
    const dir = `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
    if (seen.has(dir)) continue;
    seen.add(dir);
    const meta = (await readJson(`${dir}/library.json`).catch((): null => null)) as {
      machineName?: string;
      preloadedDependencies?: LibDep[];
    } | null;
    if (!meta || meta.machineName !== dep.machineName || !index || !index[dir]) {
      missing.push(dir);
      continue;
    }
    bundled.push(dir);
    for (const sub of meta.preloadedDependencies ?? []) queue.push(sub);
  }
  return { bundled, missing };
}

export async function buildH5p(
  project: Project,
  cpMinor: number,
  opts: H5pBuildOptions = {},
): Promise<H5pBuildResult> {
  if (project.slides.length === 0) throw new Error('Proyek belum memiliki slide.');
  const manifest = toManifest(project, cpMinor);
  const files: Record<string, Uint8Array> = {};
  files['h5p.json'] = strToU8(JSON.stringify(manifest, null, 2));

  // Ambil media elemen (termasuk gambar/audio hasil ekstraksi server) sambil
  // latar slide dirender, supaya preview dengan banyak gambar tidak lambat.
  const mediaPromise = resolveProjectMedia(project);

  // Latar: gambar asli render server bila ada, gradien bila tidak.
  // Berkas konten wajib di bawah content/ (§5 + validasi Lumi).
  const bgRefs: SlideBackgroundRef[] = [];
  let bgReal = 0;
  for (const slide of project.slides) {
    const bg = await resolveSlideBackground(slide);
    const idx = bgRefs.length;
    bgRefs.push({ path: `images/slide-${idx + 1}.${bg.ext}`, mime: bg.mime });
    files[`content/images/slide-${idx + 1}.${bg.ext}`] = bg.bytes;
    if (bg.real) bgReal += 1;
  }
  const { media, failed: mediaFailed } = await mediaPromise;
  files['content/content.json'] = strToU8(
    JSON.stringify(toContentJson(project, cpMinor, bgRefs, media)),
  );
  for (const asset of media.values()) {
    files[`content/${asset.path}`] = asset.bytes;
  }

  // Bundel library agar paket mandiri (Lumi Desktop menolak paket tanpa
  // library bila Hub tak terjangkau). Gagal total → paket konten saja.
  let bundled: string[] = [];
  let missing: string[] = [];
  if (opts.includeLibraries !== false) {
    const bundle = await bundleLibraryFiles(
      manifest.preloadedDependencies,
      opts.readLibraryFile ?? fetchLibraryFile,
    );
    bundled = bundle.bundled;
    missing = bundle.missing;
    Object.assign(files, bundle.files);
  }
  const zipped = zipSync(files, { level: 6 });
  // fflate hanya menulis entri berkas — selaras aturan `zip -rDX` (§5).
  return {
    blob: new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }),
    bundled,
    missing: [...new Set(missing)],
    backgrounds: { real: bgReal, gradient: project.slides.length - bgReal },
    media: { bundled: media.size, failed: mediaFailed },
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeFileName(title: string): string {
  const clean = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${clean || 'modul'}.h5p`;
}
