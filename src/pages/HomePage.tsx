/**
 * Route /dashboard dan /materi - Kerangka UI Dashboard Profesional
 * Tema: hijau hutan dan off-white, selaras dengan landing page
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../dashboard-canva.css';
import { Toast } from '../components/UI/Toast';
import { useStudio } from '../context/StudioContext';
import { Dashboard } from '../features/projects/components/Dashboard';
import { NewMaterialModal } from '../features/projects/components/NewMaterialModal';
import { ProjectsHome } from '../features/exporter/components/ProjectsHome';

import {
  Cross2Icon,
  DashboardIcon,
  ExitIcon,
  LayersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@radix-ui/react-icons';

const NOTICE_TIMEOUT_MS = 2600;

export function HomePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { store, openProject } = useStudio();
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newNonce, setNewNonce] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tab = pathname === '/materi' ? 'materi' : 'dashboard';
  const activeNav = tab === 'materi' ? 'materi' : 'dashboard';

  const openNewModal = () => {
    setNewNonce((n) => n + 1);
    setShowNew(true);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), NOTICE_TIMEOUT_MS);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K untuk fokus pencarian
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="db-scope">
      <div className="db-shell">
        {/* Sidebar Navigasi Utama */}
        <aside className="db-sidebar" aria-label="Navigasi utama">
          <div className="db-brand">
            <img src="/logo.png" alt="H5P Generator" className="db-brand-logo" />
            <div className="db-brand-text">
              <span className="db-brand-title">H5P Generator</span>
              <div className="db-brand-sub">
                <span className="db-brand-tag">Ruang kreasi pembelajaran</span>
              </div>
            </div>
          </div>

          <div className="db-sidebar-action">
            <button
              type="button"
              className="db-btn-sidebar-create"
              onClick={openNewModal}
            >
              <PlusIcon />
              <span>Buat materi baru</span>
            </button>
          </div>

          <p className="db-nav-label">NAVIGASI UTAMA</p>
          <nav className="db-nav" aria-label="Menu navigasi">
            <button
              type="button"
              className={`db-nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
              aria-current={activeNav === 'dashboard' ? 'page' : undefined}
              onClick={() => navigate('/dashboard')}
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
              onClick={() => navigate('/materi')}
            >
              <div className="db-nav-btn-inner">
                <LayersIcon />
                <span>Materi Saya</span>
              </div>
              <span className="db-nav-badge">{store.items.length}</span>
            </button>
          </nav>

          {/* Widget status penyimpanan browser */}
          <div className="db-sidebar-widget">
            <div className="db-sidebar-widget-head">
              <span className="db-pulse-dot" />
              <span>Penyimpanan Lokal</span>
            </div>
            <p>
              {store.items.length} materi aktif tersimpan di peramban, siap dikonversi ke paket .h5p kapan saja.
            </p>
          </div>

          {/* User profile footer di sidebar */}
          <div className="db-side-foot">
            <div className="db-user-card">
              <div className="db-user-info">
                <span className="db-avatar" aria-hidden="true">
                  P
                </span>
                <div>
                  <strong>Pemateri Internal</strong>
                  <small>Instruktur LMS</small>
                </div>
              </div>
              <button
                type="button"
                className="db-btn-logout"
                title="Kembali ke Beranda"
                aria-label="Kembali ke Beranda Utama"
                onClick={() => navigate('/')}
              >
                <ExitIcon />
              </button>
            </div>
          </div>
        </aside>

        {/* Konten Utama & Topbar */}
        <div className="db-main">
          <header className="db-topbar">
            <div className="db-topbar-title">
              <h1>{tab === 'dashboard' ? 'Dashboard' : 'Materi saya'}</h1>
              <p>
                {tab === 'dashboard'
                  ? 'Ringkasan materi, riwayat ekspor, dan akses cepat ke ruang kerja.'
                  : 'Kelola materi tersimpan, cari, gandakan, atau buka kembali berkas .h5p.'}
              </p>
            </div>

            <div className="db-tools">
              {tab === 'dashboard' && (
                <div className="db-search">
                  <MagnifyingGlassIcon aria-hidden="true" />
                  <label htmlFor="db-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                    Cari materi
                  </label>
                  <input
                    ref={searchInputRef}
                    id="db-search"
                    type="search"
                    placeholder="Cari judul materi atau berkas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--db-muted)' }}
                      onClick={() => setQuery('')}
                      aria-label="Bersihkan pencarian"
                    >
                      <Cross2Icon />
                    </button>
                  ) : (
                    <kbd className="db-kbd">⌘K</kbd>
                  )}
                </div>
              )}

              <button
                type="button"
                className="db-topbar-btn"
                aria-label="Buat materi baru"
                onClick={openNewModal}
              >
                <PlusIcon />
                <span>Materi baru</span>
              </button>

              <span className="db-avatar" title="Akun Pemateri" aria-hidden="true">
                P
              </span>
            </div>
          </header>

          {/* Navigasi Mobile */}
          <nav className="db-mobile-nav" aria-label="Navigasi seluler">
            <button
              type="button"
              className={`db-nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
              aria-current={activeNav === 'dashboard' ? 'page' : undefined}
              onClick={() => navigate('/dashboard')}
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className={`db-nav-btn ${activeNav === 'materi' ? 'active' : ''}`}
              aria-current={activeNav === 'materi' ? 'page' : undefined}
              onClick={() => navigate('/materi')}
            >
              <LayersIcon />
              <span>Materi Saya ({store.items.length})</span>
            </button>
            <button
              type="button"
              className="db-nav-btn"
              onClick={openNewModal}
            >
              <PlusIcon />
              <span>Buat materi</span>
            </button>
          </nav>

          {/* Area Konten Utama */}
          <main className="db-content">
            {tab === 'dashboard' ? (
              <Dashboard
                items={store.items}
                onOpen={(p) => openProject(p, pathname, { saved: true })}
                onGoMaterials={() => navigate('/materi')}
                onCreate={openNewModal}
                query={query}
              />
            ) : (
              <ProjectsHome
                items={store.items}
                onOpen={(p) => openProject(p, pathname, { saved: true })}
                onDelete={store.remove}
                onRename={store.rename}
                onDuplicate={store.duplicate}
                onNotice={showNotice}
              />
            )}
          </main>
        </div>
      </div>

      {showNew && <NewMaterialModal key={newNonce} onClose={() => setShowNew(false)} onNotice={showNotice} />}
      <Toast message={notice} />
    </div>
  );
}
