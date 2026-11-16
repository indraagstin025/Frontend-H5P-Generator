import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ExitIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAuth } from '../../context/useAuth';
import './AdminUsersPage.css';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const name = user?.name ?? 'Pratinjau administrator';

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
    <div className="admin-shell">
      <a className="admin-skip" href="#admin-main">Lewati ke konten</a>
      <aside className="admin-sidebar" aria-label="Panel administrator">
        <Link to="/admin/users" className="admin-brand"><img src="/dashboard-logo.png" alt="" width={60} height={54} /><span><strong>H5P Generator</strong><small>Ruang administrasi</small></span></Link>
        <nav aria-label="Navigasi administrator">
          <NavLink to="/admin/users"><PersonIcon aria-hidden="true" /> Kelola pengguna</NavLink>
        </nav>
        <div className="admin-account" ref={profileRef} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false);
        }}>
          <button className="admin-profile-trigger" type="button" ref={profileButtonRef} aria-expanded={profileOpen} aria-controls="admin-profile-popup" onClick={() => setProfileOpen((open) => !open)}>
            <span className="admin-initial" aria-hidden="true">{name.charAt(0).toLocaleUpperCase('id-ID')}</span>
            <span><strong>{name}</strong><small>{user ? 'Administrator' : 'Data lokal, tanpa login'}</small></span>
          </button>
          <div id="admin-profile-popup" className="admin-profile-popup" hidden={!profileOpen}>
            <p>Akun Anda</p>
            <button type="button" onClick={() => { setProfileOpen(false); logout(); navigate('/'); }}><ExitIcon aria-hidden="true" /><span>Logout</span></button>
          </div>
        </div>
      </aside>
      <div className="admin-content">
        <main id="admin-main" className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
