/**
 * Tahap 1 — Unggah & konversi otomatis (FR-01/02/03 + interaktivitas non-AI).
 * Jalur utama: server (render OnlyOffice) → fallback lokal bila backend mati.
 * Judul otomatis dari nama file (satu sumber judul ada di halaman Materi
 * + topbar studio) — tidak ada input judul di sini.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadDock } from '../../ingest/components/UploadDock';
import { useIngest } from '../../ingest/hooks/useIngest';
import type { ConvertInfo } from '../../ingest/hooks/useIngest';
import { convertViaServer } from '../../ingest/api/serverIngest';
import { createProject } from '../constants/h5pModel';
import type { Project, Slide } from '../constants/h5pModel';

function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, '').trim();
  return base || 'Modul tanpa judul';
}

type IngestStepProps = {
  onComplete: (project: Project) => void;
  onNotice: (message: string) => void;
  /** File titipan modal: langsung dikonversi saat langkah dibuka. */
  initialFile?: File | null;
};

export function IngestStep({ onComplete, onNotice, initialFile = null }: IngestStepProps) {
  const [lastFile, setLastFile] = useState('');
  const [serverProgress, setServerProgress] = useState(0);
  const [serverStatus, setServerStatus] = useState('');
  const [serverActive, setServerActive] = useState(false);
  const startedRef = useRef(false);

  const ingest = useIngest((slides: Slide[], info: ConvertInfo) => {
    const project = createProject(titleFromFileName(info.fileName), info.aspect, info.fileName);
    project.slides = slides;
    onComplete(project);
    const c = info.counts;
    const auto = c.hotspots + c.notes + c.media + c.quizzes;
    onNotice(
      auto > 0
        ? `${slides.length} slide + ${auto} isi otomatis (tombol ${c.hotspots}, tulisan ${c.notes}, gambar/suara ${c.media}, draf kuis ${c.quizzes}) — tinggal rapikan.`
        : `${slides.length} slide dari ${info.fileName} sudah jadi — tinggal rapikan.`,
    );
  });

  const handleFile = useCallback(
    (file: File) => {
      setLastFile(file.name);
      setServerActive(true);
      setServerProgress(2);
      setServerStatus('Mengunggah ke server…');
      void convertViaServer(file, titleFromFileName(file.name), '16:9', {
        onProgress: (p, s) => {
          setServerProgress(p);
          setServerStatus(s);
        },
      })
        .then(({ project, backgroundReady, jobMessage }) => {
          setServerActive(false);
          onComplete(project);
          onNotice(
            backgroundReady
              ? `${project.slides.length} slide dari ${file.name} sudah jadi, gambar latar asli ikut tampil — tinggal rapikan.`
              : `${project.slides.length} slide dari ${file.name} sudah jadi — tinggal rapikan.${jobMessage ? ` ${jobMessage}` : ''}`,
          );
        })
        .catch(() => {
          // Backend mati / render gagal → fallback lokal (tanpa latar presisi)
          setServerActive(false);
          onNotice('Server tidak terjangkau, pakai ubah lokal dulu (tanpa gambar latar asli).');
          void ingest.actions.convert(file);
        });
    },
    [ingest, onComplete, onNotice],
  );

  // File titipan modal: konversi jalan sendiri sekali saat langkah dibuka.
  useEffect(() => {
    if (initialFile && !startedRef.current) {
      startedRef.current = true;
      handleFile(initialFile);
    }
  }, [initialFile, handleFile]);

  return (
    <div className="step-panel">
      <div className="step-heading">
        <div>
          <p className="section-kicker">Langkah 1 — Upload & ubah otomatis</p>
          <h2>Mulai dari file yang sudah ada</h2>
          <p className="muted">
            Upload file presentasi (<code>.pptx</code>) atau dokumen (<code>.pdf</code>), maksimal 50 MB dan 60 slide.
            Link antar-slide otomatis jadi tombol, catatan pembicara jadi tulisan cerita. Judul diambil dari nama file
            dan bisa diganti di judul atas.
          </p>
        </div>
      </div>

      <UploadDock
        onAccepted={handleFile}
        onNotice={onNotice}
      />

      {serverActive && (
        <div className="convert-box" role="status">
          <div className="convert-row">
            <strong>{lastFile}</strong>
            <span>{serverProgress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${serverProgress}%` }}></div>
          </div>
          <p className="muted">{serverStatus}</p>
        </div>
      )}

      {!serverActive && ingest.state.phase !== 'idle' && (
        <div className="convert-box" role="status">
          <div className="convert-row">
            <strong>{lastFile}</strong>
            <span>{ingest.state.progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${ingest.state.progress}%` }}></div>
          </div>
          <p className="muted">{ingest.state.phase === 'error' ? ingest.state.error : ingest.state.status}</p>
          {ingest.state.phase === 'error' && (
            <button className="secondary-button" type="button" onClick={ingest.actions.reset}>
              Coba lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
