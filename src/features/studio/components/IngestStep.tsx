/**
 * Tahap 1 — Unggah & konversi otomatis (FR-01/02/03 + interaktivitas non-AI).
 * Jalur utama: server (render OnlyOffice) → fallback lokal bila backend mati.
 * Judul otomatis dari nama file (satu sumber judul ada di halaman Materi
 * + topbar studio) — tidak ada input judul di sini.
 */
import { ExclamationTriangleIcon, FileTextIcon, ReloadIcon } from '@radix-ui/react-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadDock } from '../../ingest/components/UploadDock';
import { useIngest } from '../../ingest/hooks/useIngest';
import type { ConvertInfo } from '../../ingest/hooks/useIngest';
import { convertViaServer, isUploadValidationError } from '../../ingest/api/serverIngest';
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
  const lastFileRef = useRef<File | null>(null);

  const ingest = useIngest((slides: Slide[], info: ConvertInfo) => {
    const project = createProject(titleFromFileName(info.fileName), info.aspect, info.fileName);
    project.slides = slides;
    onComplete(project);
    const c = info.counts;
    const auto = c.hotspots + c.notes + c.media + c.quizzes;
    onNotice(
      auto > 0
        ? `${slides.length} slide + ${auto} isi otomatis (tombol ${c.hotspots}, tulisan ${c.notes}, gambar/suara ${c.media}, draf kuis ${c.quizzes}) sudah jadi, tinggal rapikan.`
        : `${slides.length} slide dari ${info.fileName} sudah jadi, tinggal rapikan.`,
    );
  });

  const handleFile = useCallback(
    (file: File) => {
      lastFileRef.current = file;
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
              ? `${project.slides.length} slide dari ${file.name} sudah jadi, gambar latar asli ikut tampil. Tinggal rapikan.`
              : `${project.slides.length} slide dari ${file.name} sudah jadi, tinggal rapikan.${jobMessage ? ` ${jobMessage}` : ''}`,
          );
        })
        .catch((err: unknown) => {
          setServerActive(false);
          if (isUploadValidationError(err)) {
            // Berkas ditolak server karena password-protected, duplikat nama/isi, atau format tidak valid
            const msg = err instanceof Error ? err.message : 'Berkas ditolak oleh validasi server.';
            setServerProgress(0);
            setServerStatus(msg);
            onNotice(msg);
            return;
          }
          // Backend mati / server offline / error jaringan -> fallback lokal
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

  const localActive = ingest.state.phase !== 'idle';
  const isActive = serverActive || localActive;
  const isError = !serverActive && ingest.state.phase === 'error';
  const progress = serverActive ? serverProgress : ingest.state.progress;
  const status = serverActive
    ? serverStatus || 'Menyiapkan konversi…'
    : isError
      ? ingest.state.error
      : ingest.state.status || 'Menyiapkan konversi…';

  const retry = () => {
    const file = lastFileRef.current;
    if (file) {
      handleFile(file);
      return;
    }
    ingest.actions.reset();
  };

  return (
    <div className="hs-ingest">
      <header className="hs-ingest-head">
        <p className="hs-ingest-kicker">Langkah 1 dari 4</p>
        <h2>Mulai dari file yang sudah ada</h2>
        <p className="hs-ingest-lede">
          Unggah presentasi (<code>.pptx</code>) atau dokumen (<code>.pdf</code>), maksimal 50 MB dan 60 slide.
          Tautan antar-slide otomatis jadi tombol, catatan pembicara jadi cerita, dan judul diambil dari nama file.
        </p>
        <p className="field-hint" style={{ marginTop: '6px', color: '#52796f' }}>
          💡 <strong>Tips:</strong> Pada dokumen PDF, slide umumnya tersusun sebagai gambar flat. Jika Anda ingin teks slide dapat diedit sepenuhnya per baris atau kata, disarankan mengunggah berkas asli <code>.pptx</code>.
        </p>
      </header>

      <UploadDock onAccepted={handleFile} onNotice={onNotice} />

      {isActive && (
        <section
          className={`hs-convert${isError ? ' is-error' : ''}`}
          aria-label="Progres konversi"
        >
          <div className="hs-convert-head">
            <span className="hs-convert-icon" aria-hidden="true">
              {isError ? <ExclamationTriangleIcon /> : <FileTextIcon />}
            </span>
            <div className="hs-convert-meta">
              <strong title={lastFile}>{lastFile}</strong>
              <span aria-live={isError ? 'assertive' : undefined}>{status}</span>
            </div>
            <span className="hs-convert-percent">{isError ? 'Gagal' : `${progress}%`}</span>
          </div>

          {!isError && (
            <div
              className="hs-convert-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Progres konversi file"
            >
              <div className="hs-convert-fill" style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="hs-convert-foot">
            <span className="hs-convert-source">
              <span className="hs-convert-dot" aria-hidden="true" />
              {isError
                ? 'Konversi gagal'
                : serverActive
                  ? 'Diproses di server'
                  : 'Diproses di perangkat ini'}
            </span>
            {isError && (
              <button className="hs-convert-retry" type="button" onClick={retry}>
                <ReloadIcon /> Coba lagi
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
