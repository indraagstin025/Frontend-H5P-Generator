/** Registrasi + komunikasi dengan Service Worker pratinjau H5P. */
let registration: ServiceWorkerRegistration | null = null;

const ACK_TYPE = 'H5P_PREVIEW_READY';
const SET_TIMEOUT_MS = 20_000;
const WAIT_TIMEOUT_MS = 10_000;

function container(): ServiceWorkerContainer | undefined {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Tunggu sampai worker aktif benar-benar mengendalikan halaman.
 * `registration.active` bisa berbeda dari `controller` sesaat setelah update,
 * dan request tetap dilayani worker lama sampai klaim selesai.
 */
async function waitForController(timeoutMs: number): Promise<boolean> {
  const c = container();
  if (!c) return false;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pending = registration?.installing ?? registration?.waiting ?? null;
    const active = registration?.active ?? null;
    if (c.controller && !pending && (!active || c.controller === active)) return true;
    await sleep(150);
  }
  return false;
}

/** Daftarkan SW (sekalian cek update) dan pastikan ia sudah mengendalikan halaman. */
export async function ensurePreviewWorker(timeoutMs = WAIT_TIMEOUT_MS): Promise<boolean> {
  const c = container();
  if (!c) return false;
  try {
    registration = await c.register('/h5p-sw.js');
    // Paksa cek versi baru: SW lama bisa belum punya protokol ack.
    await registration.update().catch(() => undefined);
    return await waitForController(timeoutMs);
  } catch {
    return false;
  }
}

function activeWorker(): ServiceWorker | null {
  const c = container();
  // Controller adalah worker yang benar-benar melayani fetch halaman ini.
  return c?.controller ?? registration?.active ?? null;
}

export interface PreviewFile {
  data: Uint8Array;
  mime: string;
}

/**
 * Simpan paket (hasil unzip .h5p) agar bisa di-fetch player.
 * Menunggu ack dari SW: postMessage dan fetch punya antrean terpisah, jadi
 * tanpa ack h5p-standalone bisa meminta h5p.json sebelum paket tersimpan.
 */
export async function setPreviewPackage(key: string, files: Record<string, PreviewFile>): Promise<void> {
  const worker = activeWorker();
  if (!worker) throw new Error('Service worker pratinjau belum aktif.');
  const entries = Object.entries(files).map(([path, f]): [string, ArrayBuffer, string] => {
    const copy = f.data.slice().buffer as ArrayBuffer;
    return [path, copy, f.mime];
  });
  if (entries.length === 0) throw new Error('Paket pratinjau kosong.');

  const channel = new MessageChannel();
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error('Penyaji pratinjau tidak merespons. Muat ulang halaman lalu coba lagi.'));
    }, SET_TIMEOUT_MS);
    channel.port1.onmessage = (event: MessageEvent<{ type?: string; ok?: boolean; error?: string }>) => {
      // Terima ack versi lama ({ok}) maupun versi baru ({type, ok}) supaya
      // halaman tidak menggantung saat SW lama masih mengendalikan tab.
      if (event.data?.type !== ACK_TYPE && typeof event.data?.ok !== 'boolean') return;
      window.clearTimeout(timer);
      channel.port1.close();
      if (event.data.ok) {
        resolve();
      } else {
        reject(new Error(event.data.error || 'Paket pratinjau gagal disimpan.'));
      }
    };
    try {
      worker.postMessage(
        { type: 'H5P_PREVIEW_SET', key, files: entries, ackPort: channel.port2 },
        [...entries.map((entry) => entry[1]), channel.port2],
      );
    } catch (err) {
      window.clearTimeout(timer);
      channel.port1.close();
      reject(err instanceof Error ? err : new Error('Gagal mengirim paket ke service worker.'));
    }
  });

  // Verifikasi sekali lagi dari sisi halaman: kalau SW berganti tepat setelah
  // ack, request player berikutnya tetap akan 404. Gagal cepat dengan pesan jelas.
  const probe = await fetch(`/__h5p_preview__/${key}/h5p.json`, { cache: 'no-store' });
  if (!probe.ok) throw new Error(`Paket pratinjau tidak siap (HTTP ${probe.status}).`);
  await probe.arrayBuffer();
}

export async function clearPreviewPackage(key: string): Promise<void> {
  try {
    activeWorker()?.postMessage({ type: 'H5P_PREVIEW_CLEAR', key });
  } catch {
    // abaikan, pembersihan best-effort
  }
}
