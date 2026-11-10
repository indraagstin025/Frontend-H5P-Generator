/**
 * Modal "Buat materi baru": pilih file PPTX/PDF (atau kosongkan),
 * atur judul, lalu mulai tanpa pindah halaman dulu.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Cross2Icon, FileTextIcon } from '@radix-ui/react-icons';
import { useStudio } from '../../../context/StudioContext';
import { UploadDock } from '../../ingest/components/UploadDock';
import { setPendingFile } from '../../ingest/api/pendingUpload';
import { createProject } from '../../studio/constants/h5pModel';
import type { AspectRatio } from '../../studio/constants/h5pModel';

function baseName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, '').trim();
  return base || 'Modul baru';
}

type NewMaterialModalProps = {
  onClose: () => void;
  onNotice: (message: string) => void;
};

export function NewMaterialModal({ onClose, onNotice }: NewMaterialModalProps) {
  const { openProject } = useStudio();
  const { pathname } = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const start = () => {
    const finalTitle = title.trim() || (file ? baseName(file.name) : 'Modul baru');
    if (file) {
      setPendingFile(file);
      openProject(createProject(finalTitle, '16:9', file.name), pathname, { step: 1 });
    } else {
      openProject(createProject(finalTitle, aspect, null), pathname, { step: 2 });
    }
    onClose();
  };

  return (
    <div className="db-modal" role="presentation" onClick={onClose}>
      <div
        className="db-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-material-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="db-modal-head">
          <div>
            <p className="db-modal-kicker">Materi baru</p>
            <h2 id="new-material-title">Buat materi baru</h2>
            <p className="db-modal-desc">Unggah presentasi atau dokumen, atau mulai dari kanvas kosong.</p>
          </div>
          <button className="db-modal-close" type="button" aria-label="Tutup" onClick={onClose}>
            <Cross2Icon />
          </button>
        </header>

        <div className="db-modal-body">
          <label className="field-label">
            Judul materi
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file ? baseName(file.name) : 'cth. Keselamatan Kerja Dasar'}
            />
          </label>

          <label className="field-label">
            Ukuran slide
            <select
              value={aspect}
              disabled={Boolean(file)}
              onChange={(e) => setAspect(e.target.value as AspectRatio)}
            >
              <option value="16:9">16:9 (layar lebar)</option>
              <option value="4:3">4:3 (kotak klasik)</option>
            </select>
            <span className="field-hint">
              {file ? 'Ukuran mengikuti file yang diunggah.' : 'Dipakai kalau kamu mulai tanpa file.'}
            </span>
          </label>

          <div className="db-modal-upload">
            <p className="db-modal-upload-label">
              File materi <span>opsional</span>
            </p>
            <UploadDock
              onAccepted={(f) => {
                setFile(f);
                setError('');
                setTitle((prev) => prev || baseName(f.name));
              }}
              onNotice={(msg) => {
                setError(msg);
                onNotice(msg);
              }}
            />
          </div>

          {file && (
            <div className="db-file-row">
              <FileTextIcon aria-hidden="true" />
              <span title={file.name}>{file.name}</span>
              <button type="button" onClick={() => setFile(null)}>
                Ganti
              </button>
            </div>
          )}

          {error && (
            <p className="db-form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="db-modal-foot">
          <p className="db-modal-hint">File akan dikonversi jadi slide interaktif begitu studio terbuka.</p>
          <div className="db-modal-actions">
            <button className="db-btn-secondary" type="button" onClick={onClose}>
              Batal
            </button>
            <button className="db-btn-primary" type="button" onClick={start}>
              {file ? 'Unggah dan mulai' : 'Buat materi kosong'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
