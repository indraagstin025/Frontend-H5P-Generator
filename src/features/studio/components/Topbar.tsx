import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, DownloadIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';

type TopbarProps = {
  projectTitle: string;
  savedLabel: string;
  onHome: () => void;
  onSave: () => void | Promise<void>;
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
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!profileOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);
  const [draft, setDraft] = useState(projectTitle);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const busy = saving || isPreparingPreview;
  const isSaved = /^(tersimpan|draf tersimpan)/i.test(savedLabel) && draft.trim() === projectTitle && !busy;
  const saveDescription = busy ? 'Menyimpan perubahan…' : isSaved ? 'Semua perubahan tersimpan' : 'Ada perubahan yang belum disimpan';
  const handleSave = async () => {
    if (savingRef.current || isPreparingPreview) return;
    savingRef.current = true;
    setSaving(true);
    try { await onSave(); }
    finally { savingRef.current = false; setSaving(false); }
  };
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
      <div className="hs-topbar-ornaments" aria-hidden="true"><span /><span /><span /><span /></div>
      {/* Kiri: identitas aplikasi dan profil pengguna */}
      <div className="hs-topbar-left">
        <button
          className="hs-topbar-logo"
          type="button"
          onClick={onHome}
          title="Ke Dashboard"
        >
          <img className="hs-brand-image" src="/dashboard-logo.png" alt="" width={42} height={38} />
          <span className="hs-logo-text">
            <span className="hs-logo-title">H5P Studio</span>
          </span>
        </button>
        <div className="hs-profile-menu" ref={profileRef} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setProfileOpen(false);
        }}>
        <button className="hs-profile-avatar" type="button" ref={profileButtonRef}
          title={user?.name || 'Profil pengguna'} aria-label="Navigasi profil" aria-expanded={profileOpen}
          aria-controls="studio-profile-navigation" onClick={() => setProfileOpen((open) => !open)}>
          {user?.avatarUrl && failedAvatar !== user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`Foto profil ${user.name}`} referrerPolicy="no-referrer" onError={() => setFailedAvatar(user.avatarUrl)} />
          ) : <span role="img" aria-label={`Profil ${user?.name || 'pengguna'}`}>{(user?.name?.trim() || 'U').charAt(0).toLocaleUpperCase('id-ID')}</span>}
        </button>
        {profileOpen && <nav className="hs-profile-dropdown" id="studio-profile-navigation" aria-label="Navigasi profil">
          <Link to="/materi" onClick={() => setProfileOpen(false)}>Materi Saya</Link>
          <button type="button" className="hs-profile-logout" onClick={() => {
            setProfileOpen(false);
            logout();
          }}>Logout</button>
        </nav>}
        </div>
      </div>
        <div className="hs-project-meta hs-project-meta-centered">
          <div className="hs-project-title-row">
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
          <button className={`hs-cloud-save ${isSaved ? 'is-saved' : ''}`} type="button" onClick={() => { void handleSave(); }}
            disabled={busy} aria-busy={busy} aria-label={`${saveDescription}. Simpan materi`} title={`${saveDescription} — klik untuk menyimpan`}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7.5 22h12a5 5 0 0 0 .7-9.95A7 7 0 0 0 6.6 10.6 5.75 5.75 0 0 0 7.5 22Z" />
              {isSaved && <path className="hs-cloud-check" d="m9 14 3.5 3.5L20 10" />}
            </svg>
          </button>
          </div>
          <span className="hs-saved-label" role="status" aria-live="polite" title={savedLabel}>
            {busy ? 'Menyimpan…' : savedLabel}
          </span>
        </div>

      {/* Kanan: Pratinjau, Simpan, Export */}
      <div className="hs-topbar-right">
        {/* Tombol Pratinjau */}
        <button
          className="hs-btn-preview"
          type="button"
          onClick={onPreview}
          disabled={busy}
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
          onClick={() => { void handleSave(); }}
          disabled={busy}
          aria-busy={busy}
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
          aria-label={isExporting ? 'Mengemas' : 'Export H5P'}
          title="Unduh paket .h5p siap pakai ke LMS"
        >
          <DownloadIcon width={15} height={15} />
        </button>
      </div>
    </header>
  );
}
