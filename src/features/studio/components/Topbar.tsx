import { useEffect, useState } from 'react';
import { ArrowLeftIcon, CheckIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';

type TopbarProps = {
  projectTitle: string;
  savedLabel: string;
  onHome: () => void;
  onSave: () => void;
  onRenameTitle?: (title: string) => void;
};

export function Topbar({ projectTitle, savedLabel, onHome, onSave, onRenameTitle }: TopbarProps) {
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
    <header className="topbar">
      <div className="brand-lockup">
        <button className="icon-button" type="button" aria-label="Kembali ke daftar materi" title="Kembali ke daftar materi" onClick={onHome}>
          <ArrowLeftIcon />
        </button>
        <img src="/logo.png" alt="H5P Generator" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        <div>
          <p className="eyebrow">H5P Generator · Studio</p>
          {onRenameTitle ? (
            <input
              className="st-title-input"
              value={draft}
              aria-label="Judul materi"
              title="Klik untuk ganti judul"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setDraft(projectTitle);
              }}
            />
          ) : (
            <p className="brand-name">{projectTitle}</p>
          )}
        </div>
      </div>
      <div className="topbar-actions">
        <span className="save-state">
          <CheckIcon /> {savedLabel}
        </span>
        <button className="secondary-button" type="button" onClick={onSave}>
          Simpan
        </button>
        <button className="icon-button" type="button" aria-label="Pengaturan" title="Pengaturan">
          <MixerHorizontalIcon />
        </button>
        <button className="avatar" type="button" aria-label="Profil pengguna" title="Profil pengguna">
          ID
        </button>
      </div>
    </header>
  );
}
