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
export function setPreviewPackage(key: string, files: Record<string, PreviewFile>): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = activeWorker();
    if (!worker) return reject(new Error('Service worker pratinjau belum aktif.'));

    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      // Fallback lanjut jika timeout agar tidak menggantung selamanya
      resolve();
    }, 2000);

    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      if (event.data?.ok) {
        resolve();
      } else {
        reject(new Error(event.data?.error ?? 'Gagal menyimpan paket ke service worker.'));
      }
    };

    const entries = Object.entries(files).map(([path, f]): [string, ArrayBuffer, string] => {
      const copy = f.data.slice().buffer as ArrayBuffer;
      return [path, copy, f.mime];
    });

    worker.postMessage(
      { type: 'H5P_PREVIEW_SET', key, files: entries },
      [channel.port2, ...entries.map((e) => e[1])],
    );
  });
}

export async function clearPreviewPackage(key: string): Promise<void> {
  try {
    activeWorker()?.postMessage({ type: 'H5P_PREVIEW_CLEAR', key });
  } catch {
    // abaikan — pembersihan best-effort
  }
}
