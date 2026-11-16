import { DashboardIcon, ExitIcon, LayersIcon } from '@radix-ui/react-icons';
import { useEffect, useRef, useState } from 'react';

interface HomeSidebarProps {
  displayName: string;
  activeNav: 'dashboard' | 'materi';
  itemCount: number;
  onNavigateDashboard: () => void;
  onNavigateMateri: () => void;
  onLogout: () => void;
}

export function HomeSidebar({
  displayName,
  activeNav,
  itemCount,
  onNavigateDashboard,
  onNavigateMateri,
  onLogout,
}: HomeSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const name = displayName || 'Akun Anda';

  useEffect(() => {
    if (!profileOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [profileOpen]);
  return (
    <aside className="db-sidebar" aria-label="Navigasi utama">
      <div className="db-brand">
        <img src="/dashboard-logo.png" alt="H5P Generator" className="db-brand-logo" width={68} height={60} />
        <div className="db-brand-text">
          <span className="db-brand-title">H5P Generator</span>
          <div className="db-brand-sub">
            <span className="db-brand-tag">Ruang kreasi pembelajaran</span>
          </div>
        </div>
      </div>

      <p className="db-nav-label">NAVIGASI UTAMA</p>
      <nav className="db-nav" aria-label="Menu navigasi">
        <button
          type="button"
          className={`db-nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
          aria-current={activeNav === 'dashboard' ? 'page' : undefined}
          onClick={onNavigateDashboard}
        >
          <div className="db-nav-btn-inner">
            <DashboardIcon />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          type="button"
          className={`db-nav-btn ${activeNav === 'materi' ? 'active' : ''}`}
          aria-current={activeNav === 'materi' ? 'page' : undefined}
          onClick={onNavigateMateri}
        >
          <div className="db-nav-btn-inner">
            <LayersIcon />
            <span>Materi Saya</span>
          </div>
          <span className="db-nav-badge">{itemCount}</span>
        </button>
      </nav>

      {/* User profile footer di sidebar */}
      <div className="db-side-foot" ref={profileRef} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false);
      }}>
        <button className="db-profile-trigger" type="button" ref={profileButtonRef}
          aria-expanded={profileOpen} aria-controls="db-profile-popup"
          onClick={() => setProfileOpen((open) => !open)}>
          <span className="db-user-info">
            <span className="db-avatar" aria-hidden="true">
              {name.charAt(0).toLocaleUpperCase('id-ID')}
            </span>
            <span className="db-profile-name">
              <strong>{name}</strong>
              <small>Instruktur LMS</small>
            </span>
          </span>
        </button>
        <div id="db-profile-popup" className="db-profile-popup" hidden={!profileOpen}>
          <p>Akun Anda</p>
          <button type="button" onClick={() => { setProfileOpen(false); onLogout(); }}>
            <ExitIcon aria-hidden="true" /><span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
