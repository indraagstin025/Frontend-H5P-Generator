/**
 * Modal "Bikin materi baru": pilih file PPTX/PDF (atau kosongkan),
 * atur judul, lalu mulai — tanpa pindah halaman dulu.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Cross2Icon } from '@radix-ui/react-icons';
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const start = () => {
    const finalTitle = title.trim() || (file ? baseName(file.name) : 'Modul baru');
    if (file) {
      setPendingFile(file);
      openProject(createProject(finalTitle, '16:9', file.name), pathname);
    } else {
      openProject(createProject(finalTitle, aspect, null), pathname, { step: 2 });
    }
    onClose();
  };

  return (
    <div className="pv-overlay" onClick={onClose}>
      <div
        className="pv-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Bikin materi baru"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-dialog-head">
          <strong>Bikin materi baru</strong>
          <button type="button" aria-label="Tutup" onClick={onClose}>
            <Cross2Icon />
          </button>
        </div>
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
          Ukuran slide (untuk materi kosong)
          <select value={aspect} onChange={(e) => setAspect(e.target.value as AspectRatio)}>
            <option value="16:9">16:9 — layar lebar</option>
            <option value="4:3">4:3 — kotak klasik</option>
          </select>
        </label>
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
        {file && (
          <p className="muted">
            File: <strong>{file.name}</strong>{' '}
            <button type="button" className="db-text-action" onClick={() => setFile(null)}>
              ganti
            </button>
          </p>
        )}
        {error && <p className="check-bad">{error}</p>}
        <div className="export-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Batal
          </button>
          <button className="primary-button" type="button" onClick={start}>
            {file ? 'Upload & mulai' : 'Bikin materi kosong'}
          </button>
        </div>
        <p className="muted">File dikonversi otomatis jadi slide interaktif begitu studio kebuka.</p>
      </div>
    </div>
  );
}
