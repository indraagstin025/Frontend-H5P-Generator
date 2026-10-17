/**
 * Tahap 4, mode "Player server": paket diunggah ke backend, dimainkan
 * via player yang disajikan server, skor xAPI direkam ke database.
 * Butuh backend jalan (kalau mati, pakai dua mode lain).
 */
import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/env';
import { DEFAULT_CP_MINOR } from '../../studio/constants/h5pLibraries';
import type { Project } from '../../studio/constants/h5pModel';
import { buildH5p, safeFileName } from '../../exporter/api/h5pPackager';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

type Status = 'idle' | 'uploading' | 'ready' | 'error';

interface Attempt {
  id: string;
  score: number;
  maxScore: number;
  createdAt: string;
}

export function H5PServerPlayer({ project, onNotice }: { project: Project; onNotice: (m: string) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [playerUrl, setPlayerUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState('');
  const timer = useRef<number | null>(null);

  const start = async () => {
    setStatus('uploading');
    setError('');
    try {
      const { blob } = await buildH5p(project, DEFAULT_CP_MINOR);
      const form = new FormData();
      form.append('package', blob, safeFileName(project.title));
      form.append('title', project.title);
      const res = await fetch(`${API_BASE_URL}/h5p/preview-sessions`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server menjawab ${res.status}.`);
      const json = (await res.json()) as { data: { sessionId: string; playerUrl: string } };
      setSessionId(json.data.sessionId);
      setPlayerUrl(`${API_ORIGIN}${json.data.playerUrl}`);
      setAttempts([]);
      setStatus('ready');
    } catch {
      setStatus('error');
      setError('Backend tidak terjangkau. Nyalakan backend lalu coba lagi, atau pakai mode lain.');
      onNotice('Backend tidak terjangkau.');
    }
  };

  useEffect(() => {
    if (status !== 'ready' || !sessionId) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/h5p/session/${sessionId}/attempts`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: Attempt[] };
        setAttempts(json.data ?? []);
      } catch {
        // abaikan — polling berikutnya mencoba lagi
      }
    };
    void poll();
    timer.current = window.setInterval(() => void poll(), 3000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [status, sessionId]);

  if (status === 'idle' || status === 'error') {
    return (
      <div className="pv-setup">
        <strong>Player server butuh backend jalan.</strong>
        <p className="muted">
          {status === 'error' ? error : 'Paket .h5p dikirim ke server, dimainkan di sana, dan nilainya tersimpan di database.'}
        </p>
        <button className="secondary-button" type="button" onClick={start}>
          {status === 'error' ? 'Coba lagi' : 'Muat player server'}
        </button>
      </div>
    );
  }

  if (status === 'uploading') return <p className="muted">Mengirim paket ke server…</p>;

  const latest = attempts[0];
  return (
    <div className="pv-real-wrap">
      <iframe src={playerUrl} title="Player server H5P" className="pv-server-frame" />
      <div className="pv-xapi">
        <p className="section-kicker">
          Nilai tersimpan di server{latest ? `: terakhir ${latest.score}/${latest.maxScore}` : ''}
        </p>
        {attempts.length === 0 ? (
          <p className="muted">Mainkan modul di atas sampai selesai — nilainya tercatat di sini.</p>
        ) : (
          <ul>
            {attempts.slice(0, 10).map((a) => (
              <li key={a.id}>
                <span>{new Date(a.createdAt).toLocaleTimeString('id-ID')}</span>
                <strong>
                  {a.score}/{a.maxScore}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
