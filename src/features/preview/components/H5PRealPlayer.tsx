/**
 * Tahap 4, mode "Player asli": paket .h5p hasil rakitan dimainkan
 * dengan engine H5P betulan (h5p-standalone), bukan simulasi.
 * Butuh folder library di public/h5p-libraries (salinan dari LMS).
 * Event xAPI (jawaban, nilai) ditangkap dan ditampilkan.
 */
import { useEffect, useRef, useState } from 'react';
import { unzipSync } from 'fflate';
import type { H5PPlayerClass } from 'h5p-standalone';
import { createLogger } from '../../../utils/logger';
import { COURSE_PRESENTATION_MINORS } from '../../studio/constants/h5pLibraries';
import type { Project } from '../../studio/constants/h5pModel';
import { buildH5p } from '../../exporter/api/h5pPackager';
import {
  clearPreviewPackage,
  ensurePreviewWorker,
  setPreviewPackage,
} from '../api/previewServiceWorker';
import type { PreviewFile } from '../api/previewServiceWorker';

const log = createLogger('H5PPreview');

type Status = 'checking' | 'missing-libs' | 'preparing' | 'ready' | 'error';

interface XapiRow {
  id: number;
  verb: string;
  score: string;
}

/**
 * Cari kelas player di hasil import h5p-standalone. Paketnya UMD tanpa
 * named export ESM, jadi bentuknya beda per bundler: { H5P } (CJS),
 * { default: { H5P } } (Vite), atau global H5PStandalone.
 */
function findPlayerClass(root: unknown, depth = 0): H5PPlayerClass | null {
  if (typeof root === 'function') return root as H5PPlayerClass;
  if (root === null || typeof root !== 'object' || depth > 3) return null;
  const obj = root as Record<string, unknown>;
  if (typeof obj.H5P === 'function') return obj.H5P as H5PPlayerClass;
  for (const key of ['default', 'H5PStandalone']) {
    const found = findPlayerClass(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

async function loadPlayerClass(): Promise<H5PPlayerClass> {
  const mod = (await import('h5p-standalone')) as unknown;
  const found =
    findPlayerClass(mod) ?? findPlayerClass((window as unknown as Record<string, unknown>).H5PStandalone);
  if (!found) throw new Error('Engine H5P tidak ketemu di paket h5p-standalone.');
  return found;
}

function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'json') return 'application/json';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'm4a') return 'audio/mp4';
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogv') return 'video/ogg';
  if (ext === 'ogg') return path.startsWith('videos/') ? 'video/ogg' : 'audio/ogg';
  return 'application/octet-stream';
}

function summarizeEvent(ev: unknown): { verb: string; score: string } {
  try {
    const statement = (ev as { data?: { statement?: Record<string, unknown> } })?.data?.statement as
      | {
          verb?: { id?: string; display?: Record<string, string> };
          result?: { score?: { raw?: number; max?: number } };
        }
      | undefined;
    const display = statement?.verb?.display;
    const verb =
      (display && (display['en-US'] ?? Object.values(display)[0])) || statement?.verb?.id || 'aktivitas';
    const score = statement?.result?.score;
    const scoreText =
      score && typeof score.raw === 'number'
        ? `${score.raw}${typeof score.max === 'number' ? `/${score.max}` : ''}`
        : '—';
    return { verb: String(verb).split('/').pop() ?? 'aktivitas', score: scoreText };
  } catch {
    return { verb: 'aktivitas', score: '—' };
  }
}

export function H5PRealPlayer({ project }: { project: Project }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const eventId = useRef(0);
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [events, setEvents] = useState<XapiRow[]>([]);
  const [mediaWarnings, setMediaWarnings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const key = project.id;
    const host = hostRef.current;

    void (async () => {
      // 1. Cari versi CoursePresentation yang tersedia (baru → lama).
      // Seed backend dari Hub memberi 1.26, sedangkan default ekspor (24)
      // mengikuti LMS — player pratinjau pakai yang ada saja.
      // (Cek isi, bukan sekadar status: server SPA bisa menjawab
      // index.html 200 untuk file yang tidak ada.)
      let cpMinor: number | null = null;
      for (const m of [...COURSE_PRESENTATION_MINORS].sort((a, b) => b - a)) {
        try {
          const probe = await fetch(`/h5p-libraries/H5P.CoursePresentation-1.${m}/library.json`, {
            cache: 'no-store',
          });
          if (probe.ok) {
            try {
              const json = (await probe.json()) as { machineName?: string };
              if (json.machineName === 'H5P.CoursePresentation') {
                cpMinor = m;
                break;
              }
            } catch {
              // lanjut ke versi berikut
            }
          }
        } catch {
          // lanjut ke versi berikut
        }
        if (cancelled) return;
      }
      if (cpMinor === null) {
        if (!cancelled) setStatus('missing-libs');
        return;
      }
      if (cancelled) return;

      // 2. Aktifkan service worker penyaji paket
      setStatus('preparing');
      log.info('Menyiapkan paket pratinjau', key);
      const workerOk = await ensurePreviewWorker();
      if (!workerOk) {
        log.warn('Service worker pratinjau tidak mengendalikan halaman', key);
        if (!cancelled) {
          setStatus('error');
          setError('Service worker gagal aktif. Muat ulang halaman ini lalu coba lagi.');
        }
        return;
      }
      if (cancelled) return;

      // 3. Rakit paket + sajikan dari memori
      try {
        const { blob, media } = await buildH5p(project, cpMinor);
        if (!cancelled) setMediaWarnings(media.failed);
        if (media.failed.length > 0) {
          log.warn('Sebagian media tidak ikut paket', media.failed);
        }
        if (cancelled) return;
        const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
        const files: Record<string, PreviewFile> = {};
        for (const [path, data] of Object.entries(entries)) {
          files[path] = { data, mime: mimeFor(path) };
        }
        log.info('Paket siap disajikan', { key, files: Object.keys(files).length, sizeKb: Math.round(blob.size / 1024) });
        await setPreviewPackage(key, files);
        if (cancelled) return;
        log.info('Paket tersimpan di service worker', key);

        // 4. Jalankan player asli (lazy-load agar bundle awal tetap kecil)
        if (!host) return;
        host.innerHTML = '';
        const H5PClass = await loadPlayerClass();
        if (cancelled) return;
        await new H5PClass(host, {
          h5pJsonPath: `/__h5p_preview__/${key}`,
          frameJs: '/h5p-player/frame.bundle.js',
          frameCss: '/h5p-player/styles/h5p.css',
          librariesPath: '/h5p-libraries',
          frame: true,
          fullScreen: true,
        });
        if (cancelled) return;
        const w = window as unknown as {
          H5P?: { externalDispatcher?: { on: (name: string, cb: (ev: unknown) => void) => void } };
        };
        w.H5P?.externalDispatcher?.on('xAPI', (ev) => {
          const s = summarizeEvent(ev);
          eventId.current += 1;
          const id = eventId.current;
          setEvents((prev) => [...prev.slice(-19), { id, ...s }]);
        });
        setStatus('ready');
      } catch (err) {
        log.error('Gagal menyiapkan player asli', err);
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Player gagal dimuat.');
        }
      }
    })();

    return () => {
      cancelled = true;
      void clearPreviewPackage(key);
      if (host) host.innerHTML = '';
    };
  }, [project, attempt]);

  if (status === 'missing-libs') {
    return (
      <div className="pv-setup">
        <strong>Player asli belum bisa jalan.</strong>
        <p className="muted">
          Folder <code>frontend/public/h5p-libraries/</code> masih kosong — salin folder-folder library dari{' '}
          <code>backend/storage/h5p/libraries/</code> (sudah terisi otomatis saat seed, tanpa H5PEditor.*) ke sana,
          lalu muat ulang halaman ini. Sementara itu mode simulasi tetap bisa dipakai.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="pv-setup">
        <strong>Player gagal dimuat.</strong>
        <p className="muted">{error}</p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setStatus('checking');
            setError('');
            setEvents([]);
            setAttempt((a) => a + 1);
          }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="pv-real-wrap">
      {(status === 'checking' || status === 'preparing') && (
        <p className="muted">{status === 'checking' ? 'Mengecek library H5P…' : 'Menyiapkan paket & player…'}</p>
      )}
      <div ref={hostRef} className="pv-real-host"></div>
      {status === 'ready' && mediaWarnings.length > 0 && (
        <p className="muted">
          Sebagian media tidak ikut: {mediaWarnings.slice(0, 3).join('; ')}
          {mediaWarnings.length > 3 ? ` (+${mediaWarnings.length - 3} lagi)` : ''}
        </p>
      )}
      {status === 'ready' && (
        <div className="pv-xapi">
          <p className="section-kicker">Aktivitas xAPI tertangkap ({events.length})</p>
          {events.length === 0 ? (
            <p className="muted">Mainkan modul di atas — jawaban dan nilainya tercatat di sini.</p>
          ) : (
            <ul>
              {events.map((e) => (
                <li key={e.id}>
                  <span>{e.verb}</span>
                  <strong>{e.score}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
