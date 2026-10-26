/* Service Worker pratinjau H5P (Tahap 4, mode "Player asli").
 * Menyajikan paket .h5p yang dibuat di memori lewat path virtual
 * /__h5p_preview__/<id-proyek>/* karena h5p-standalone memuat konten
 * lewat fetch URL, bukan blob. Daftarkan dari previewServiceWorker.ts.
 */
const PREFIX = '/__h5p_preview__/';
const ACK_TYPE = 'H5P_PREVIEW_READY';

/** key -> Map(path -> { data: ArrayBuffer, type: string }) */
const store = new Map();

function decodePath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'H5P_PREVIEW_SET') {
    const port = msg.ackPort;
    try {
      if (typeof msg.key !== 'string' || !Array.isArray(msg.files)) {
        throw new Error('Paket pratinjau tidak valid.');
      }
      const files = new Map();
      for (const entry of msg.files) {
        const path = entry[0];
        const data = entry[1];
        const type = entry[2];
        if (typeof path === 'string' && data instanceof ArrayBuffer) {
          files.set(path, { data, type: typeof type === 'string' ? type : 'application/octet-stream' });
        }
      }
      store.set(msg.key, files);
      // Balasan ack wajib: halaman baru boleh memulai player setelah paket
      // benar-benar tersimpan (postMessage dan fetch punya antrean berbeda).
      if (port && typeof port.postMessage === 'function') {
        port.postMessage({ type: ACK_TYPE, ok: true, count: files.size });
      }
    } catch (err) {
      if (port && typeof port.postMessage === 'function') {
        port.postMessage({
          type: ACK_TYPE,
          ok: false,
          error: err instanceof Error ? err.message : 'Paket pratinjau gagal disimpan.',
        });
      }
    }
  } else if (msg.type === 'H5P_PREVIEW_CLEAR' && typeof msg.key === 'string') {
    store.delete(msg.key);
  }
});

self.addEventListener('fetch', (event) => {
  let pathname = '';
  try {
    pathname = new URL(event.request.url).pathname;
  } catch {
    return;
  }
  if (!pathname.startsWith(PREFIX)) return;
  const rest = pathname.slice(PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash < 0) return;
  const key = rest.slice(0, slash);
  const path = decodePath(rest.slice(slash + 1));
  const files = store.get(key);
  const entry = files ? files.get(path) : undefined;
  if (entry) {
    event.respondWith(
      new Response(entry.data, {
        headers: {
          'Content-Type': entry.type,
          'Content-Length': String(entry.data.byteLength),
          'Cache-Control': 'no-store',
        },
      }),
    );
  } else {
    console.warn('[h5p-preview] file tidak ada di paket:', key, path);
    event.respondWith(new Response('Not found', { status: 404 }));
  }
});
