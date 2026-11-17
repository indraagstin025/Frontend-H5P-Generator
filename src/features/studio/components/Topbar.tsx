import { useEffect, useState } from 'react';
import { ArrowLeftIcon, DownloadIcon, EyeOpenIcon } from '@radix-ui/react-icons';

type TopbarProps = {
  projectTitle: string;
  savedLabel: string;
  onHome: () => void;
  onSave: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  onPreview?: () => void;
  isPreparingPreview?: boolean;
  isPreviewActive?: boolean;
  onRenameTitle?: (title: string) => void;
};

export function Topbar({
  projectTitle,
  savedLabel,
  onHome,
  onSave,
  onExport,
  isExporting,
  onPreview,
  isPreparingPreview = false,
  isPreviewActive = false,
  onRenameTitle,
}: TopbarProps) {
  const [draft, setDraft] = useState(projectTitle);
  useEffect(() => {
    setDraft(projectTitle);
  }, [projectTitle]);

  const commit = () => {
    const clean = draft.trim();
    if (clean && clean !== projectTitle) onRenameTitle?.(clean);
    else setDraft(projectTitle);
  };

  return (
    <header className="hs-topbar">
      {/* Kiri: Logo + Judul */}
      <div className="hs-topbar-left">
        <button
          className="hs-topbar-logo"
          type="button"
          onClick={onHome}
          title="Kembali ke daftar materi"
        >
          <img className="hs-brand-image" src="/dashboard-logo.png" alt="" width={42} height={38} />
          <span className="hs-logo-text">
            <span className="hs-logo-title">H5P Studio</span>
          </span>
        </button>
        <div className="hs-project-meta">
          {onRenameTitle ? (
            <input
              className="hs-project-title-input"
              value={draft}
              aria-label="Judul materi"
              title={`${projectTitle} — klik untuk ganti judul`}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setDraft(projectTitle);
              }}
            />
          ) : (
            <span className="hs-project-subtitle">{projectTitle}</span>
          )}
          <span className="hs-subtitle-dot">·</span>
          <span className="hs-saved-label" title={savedLabel}>
            {savedLabel}
          </span>
        </div>
      </div>

      {/* Kanan: Pratinjau, Simpan, Export */}
      <div className="hs-topbar-right">
        {/* Tombol Pratinjau */}
        <button
          className="hs-btn-preview"
          type="button"
          onClick={onPreview}
          disabled={isPreparingPreview}
          aria-busy={isPreparingPreview}
          title={isPreviewActive ? 'Kembali ke editor' : 'Pratinjau'}
        >
          {isPreviewActive ? <ArrowLeftIcon width={15} height={15} /> : <EyeOpenIcon width={15} height={15} />}
          <span className="hs-btn-text">{isPreparingPreview ? 'Menyimpan…' : isPreviewActive ? 'Kembali' : 'Pratinjau'}</span>
        </button>

        {/* Tombol Simpan */}
        <button
          className="hs-btn-save"
          type="button"
          onClick={onSave}
          title="Simpan"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.5 1H2.5C1.67 1 1 1.67 1 2.5V12.5C1 13.33 1.67 14 2.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5L11.5 1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 14V9H4V14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 1V5H10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hs-btn-text">Simpan</span>
        </button>
        <button
          className="hs-btn-export"
          type="button"
          onClick={onExport}
          disabled={isExporting}
          aria-busy={isExporting}
          title="Unduh paket .h5p siap pakai ke LMS"
        >
          <DownloadIcon width={15} height={15} />
          <span className="hs-btn-text">{isExporting ? 'Mengemas…' : 'Export H5P'}</span>
        </button>
      </div>
    </header>
  );
}
