import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ExitIcon, GearIcon, PersonIcon, PlusIcon } from '@radix-ui/react-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/env';
import { FloatingShapes } from '../../components/UI/FloatingShapes';
import { ProfileSettings } from '../home/ProfileSettings';
import './AdminUsersPage.css';
import './AdminTheme.css';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const name = user?.name || 'Administrator';

  useEffect(() => {
    if (!profileOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
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
    <div className="admin-shell">
      <a className="admin-skip" href="#admin-main">
        Lewati ke konten
      </a>
      <aside className="admin-sidebar floating-shapes-host" aria-label="Panel administrator">
        <FloatingShapes />
        <Link to="/admin/users" className="admin-brand">
          <img src="/landing-logo.png" alt="H5P Generator" width={68} height={60} />
          <span>
            <strong>H5P Generator</strong>
            <small>Ruang kreasi pembelajaran</small>
          </span>
        </Link>
        <p className="admin-nav-label">NAVIGASI UTAMA</p>
        <nav aria-label="Navigasi administrator">
          <NavLink to="/admin/users" end>
            <PersonIcon aria-hidden="true" /> Kelola pengguna
          </NavLink>
          <NavLink to="/admin/users/new" className="admin-add-user">
            <PlusIcon aria-hidden="true" /> Tambah User
          </NavLink>
        </nav>
        <div
          className="admin-account"
          ref={profileRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setProfileOpen(false);
            }
          }}
        >
          <button
            className="admin-profile-trigger"
            type="button"
            ref={profileButtonRef}
            aria-expanded={profileOpen}
            aria-controls="admin-profile-popup"
            onClick={() => setProfileOpen((open) => !open)}
          >
            <span className="admin-initial" aria-hidden="true">
              {user?.avatarUrl ? <img src={user.avatarUrl.startsWith('/api/') ? `${API_BASE_URL.replace(/\/api$/, '')}${user.avatarUrl}` : user.avatarUrl} alt="" /> : name.charAt(0).toLocaleUpperCase('id-ID')}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{user?.email || 'Administrator'}</small>
            </span>
          </button>
          <div id="admin-profile-popup" className="admin-profile-popup" hidden={!profileOpen}>
            <p>{user?.email ? `${name} (Administrator)` : 'Akun Anda'}</p>
            <button type="button" className="admin-profile-settings" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}><GearIcon aria-hidden="true" /><span>Pengaturan Profil</span></button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                logout();
              }}
            >
              <ExitIcon aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
      {settingsOpen && user && <ProfileSettings user={user} onClose={() => setSettingsOpen(false)} />}
      <div className="admin-content">
        <main id="admin-main" className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
