/** Registrasi + komunikasi dengan Service Worker pratinjau H5P. */
let registration: ServiceWorkerRegistration | null = null;

function container(): ServiceWorkerContainer | undefined {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker;
}

/** Daftarkan SW dan pastikan ia sudah mengendalikan halaman. */
export async function ensurePreviewWorker(timeoutMs = 5000): Promise<boolean> {
  const c = container();
  if (!c) return false;
  try {
    registration = await c.register('/h5p-sw.js');
    await c.ready;
    if (c.controller) return true;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (c.controller) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return !!c.controller;
  } catch {
    return false;
  }
}

function activeWorker(): ServiceWorker | null {
  const c = container();
  return registration?.active ?? c?.controller ?? null;
}

export interface PreviewFile {
  data: Uint8Array;
  mime: string;
}

/** Simpan paket (hasil unzip .h5p) agar bisa di-fetch player. */
export async function setPreviewPackage(key: string, files: Record<string, PreviewFile>): Promise<void> {
  const worker = activeWorker();
  if (!worker) throw new Error('Service worker pratinjau belum aktif.');
  const entries = Object.entries(files).map(([path, f]): [string, ArrayBuffer, string] => {
    const copy = f.data.slice().buffer as ArrayBuffer;
    return [path, copy, f.mime];
  });
  worker.postMessage(
    { type: 'H5P_PREVIEW_SET', key, files: entries },
    entries.map((e) => e[1]),
  );
}

export async function clearPreviewPackage(key: string): Promise<void> {
  try {
    activeWorker()?.postMessage({ type: 'H5P_PREVIEW_CLEAR', key });
  } catch {
    // abaikan — pembersihan best-effort
  }
}
