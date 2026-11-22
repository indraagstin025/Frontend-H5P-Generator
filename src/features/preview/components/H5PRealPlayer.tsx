/** The same self-hosted reader used by h5p-offline-player.vercel.app. */
import { useEffect, useRef, useState } from 'react';
import type { H5PPlayerElement, PlayerErrorDetail } from '@missing-elements/h5p-offline-player';
import { formatNetworkError } from '../../../services/network';
import { buildH5p, safeFileName } from '../../exporter/api/h5pPackager';
import { DEFAULT_CP_MINOR } from '../../studio/constants/h5pLibraries';
import type { Project } from '../../studio/constants/h5pModel';
import { isQuizElement } from '../../studio/constants/h5pModel';
import './H5PReader.css';
import slideLayoutUrl from './reader-slide-layout.css?url';
import classicSlideLayoutUrl from './reader-slide-layout-4-3.css?url';

type Status = 'preparing' | 'loading' | 'ready' | 'error';
interface Activity { id: number; verb: string; score: string }

function summarizeActivity(event: Event): Omit<Activity, 'id'> {
  const statement = (event as CustomEvent<{
    statement?: {
      verb?: { id?: string; display?: Record<string, string> };
      result?: { score?: { raw?: number; max?: number } };
    };
  }>).detail?.statement;
  const score = statement?.result?.score;
  return {
    verb: statement?.verb?.display?.['id'] || statement?.verb?.display?.['en-US'] || statement?.verb?.id?.split('/').pop() || 'Aktivitas',
    score: typeof score?.raw === 'number' ? `${score.raw}${typeof score.max === 'number' ? `/${score.max}` : ''}` : '—',
  };
}

export function H5PRealPlayer({ project, cpMinor = DEFAULT_CP_MINOR }: { project: Project; cpMinor?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('preparing');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mediaWarnings, setMediaWarnings] = useState<string[]>([]);
  const [completionNotice, setCompletionNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    let reader: H5PPlayerElement | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let activityId = 0;
    const answered = new Set<string>();
    const notified = new Set<string>();
    let noticeSlideOrder: number | null = null;
    const host = hostRef.current;
    const fail = (message: string) => {
      if (cancelled) return;
      clearTimeout(timeout);
      setError(message);
      setStatus('error');
    };
    const onReady = () => {
      if (cancelled) return;
      clearTimeout(timeout);
      setStatus('ready');
    };
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<PlayerErrorDetail>).detail;
      fail(detail?.message || 'Reader H5P gagal membuka materi. Silakan coba lagi.');
    };
    const onActivity = (event: Event) => {
      if (cancelled) return;
      const entry = { ...summarizeActivity(event), id: ++activityId };
      setActivities((previous) => [...previous.slice(-19), entry]);
      const statement = (event as CustomEvent<{ statement?: {
        verb?: { id?: string };
        object?: { id?: string; definition?: { extensions?: Record<string, unknown> } };
        result?: { response?: string; completion?: boolean };
      } }>).detail?.statement;
      const verb = statement?.verb?.id?.split('/').pop();
      if (verb === 'progressed') {
        const destination = statement?.object?.definition?.extensions?.['http://id.tincanapi.com/extension/ending-point'];
        if (noticeSlideOrder !== null && Number(destination) !== noticeSlideOrder) {
          setCompletionNotice('');
          noticeSlideOrder = null;
        }
        return;
      }
      if (verb !== 'answered' && verb !== 'completed') return;
      if (project.settings.requireQuestionsBeforeNavigation === false) return;
      let activity = statement?.object?.id ?? '';
      try { activity = decodeURIComponent(activity); } catch { /* Keep the original activity ID. */ }
      const matchedSlide = project.slides.find((slide) => slide.elements.some((element) =>
        isQuizElement(element) && activity.split(/[?&#/=]/).includes(element.id)));
      if (!matchedSlide) return;
      const quizzes = matchedSlide.elements.filter(isQuizElement);
      const quiz = quizzes.find((element) => activity.split(/[?&#/=]/).includes(element.id));
      if (!quiz) return;
      answered.add(quiz.id);
      if (!notified.has(matchedSlide.id) && quizzes.every((element) => answered.has(element.id))) {
        notified.add(matchedSlide.id);
        noticeSlideOrder = matchedSlide.order;
        setCompletionNotice(`Semua soal pada slide ${matchedSlide.order} sudah diisi.${matchedSlide.order < project.slides.length ? ' Anda dapat melanjutkan ke slide berikutnya.' : ''}`);
      }
    };

    void (async () => {
      try {
        if (!window.isSecureContext || !('serviceWorker' in navigator)) {
          throw new Error('Preview H5P memerlukan browser yang mendukung Service Worker. Buka aplikasi melalui localhost atau HTTPS.');
        }
        const [, { runtime }, { pack }] = await Promise.all([
          import('@missing-elements/h5p-offline-player'),
          import('@missing-elements/h5p-runtime'),
          import('@missing-elements/h5p-libraries'),
        ]);
        if (cancelled) return;

        // Only play the complete export rebuilt with our curated local libraries,
        // never scripts taken directly from an uploaded archive.
        const { blob, media } = await buildH5p(project, cpMinor);
        if (cancelled || !host) return;
        setMediaWarnings(media.failed);
        reader = document.createElement('h5p-player');
        reader.runtime = runtime;
        reader.pack = pack;
        reader.setAttribute('libraries', 'pack');
        // Preserve the export's patched rotation and popup libraries.
        reader.setAttribute('refresh-libraries', 'off');
        reader.setAttribute('lang', 'id');
        reader.setAttribute('resume', 'off');
        reader.setAttribute('frame', 'off');
        reader.setAttribute('export', 'off');
        reader.setAttribute('copyright', 'off');
        reader.setAttribute('custom-css', [slideLayoutUrl, ...(project.settings.aspect === '4:3' ? [classicSlideLayoutUrl] : [])]
          .map((url) => new URL(url, window.location.href).href).join(' '));
        reader.setAttribute('aria-label', `Pratinjau ${project.title || 'materi H5P'}`);
        reader.addEventListener('ready', onReady);
        reader.addEventListener('error', onError);
        reader.addEventListener('xapi', onActivity);
        host.replaceChildren(reader);
        setStatus('loading');
        timeout = setTimeout(() => fail('Reader membutuhkan waktu terlalu lama untuk dimuat. Silakan coba lagi.'), 90_000);
        reader.file = new File([blob], safeFileName(project.title), { type: 'application/zip' });
      } catch (err) {
        fail(formatNetworkError(err, 'Pratinjau H5P belum dapat dimuat.'));
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (reader) {
        reader.removeEventListener('ready', onReady);
        reader.removeEventListener('error', onError);
        reader.removeEventListener('xapi', onActivity);
        // The element's disconnect handler cancels jobs and releases its frame/file.
        reader.remove();
      }
      host?.replaceChildren();
    };
  }, [project, cpMinor, attempt]);

  return (
    <div className="pv-real-wrap">
      {completionNotice && <div className="pv-slide-complete" role="status">
        <span>{completionNotice}</span>
        <button type="button" aria-label="Tutup pemberitahuan" onClick={() => setCompletionNotice('')}>×</button>
      </div>}
      {(status === 'preparing' || status === 'loading') && (
        <p className="muted" role="status">{status === 'preparing' ? 'Menyiapkan materi untuk preview…' : 'Membuka reader H5P…'}</p>
      )}
      {status === 'error' && (
        <div className="pv-setup" role="alert">
          <strong>Preview belum dapat ditampilkan.</strong>
          <p className="muted">{error}</p>
          <button type="button" className="secondary-button" onClick={() => {
            setError('');
            setActivities([]);
            setMediaWarnings([]);
            setCompletionNotice('');
            setStatus('preparing');
            setAttempt((value) => value + 1);
          }}>Coba lagi</button>
        </div>
      )}
      <div ref={hostRef} className="pv-real-host pv-offline-reader" hidden={status === 'error'} aria-busy={status !== 'ready'} />
      {status === 'ready' && mediaWarnings.length > 0 && (
        <p className="muted" role="status">Sebagian media belum dimuat: {mediaWarnings.slice(0, 3).join('; ')}{mediaWarnings.length > 3 ? ` (+${mediaWarnings.length - 3} lainnya)` : ''}</p>
      )}
      {status === 'ready' && activities.length > 0 && (
        <div className="pv-xapi">
          <p className="section-kicker">Aktivitas percobaan</p>
          <ul>{activities.map((entry) => <li key={entry.id}><span>{entry.verb}</span><strong>{entry.score}</strong></li>)}</ul>
        </div>
      )}
    </div>
  );
}
