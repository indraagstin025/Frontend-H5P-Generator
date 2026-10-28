import { DashboardIcon, ExitIcon, LayersIcon, PlusIcon } from '@radix-ui/react-icons';

interface HomeSidebarProps {
  activeNav: 'dashboard' | 'materi';
  itemCount: number;
  onOpenNewModal: () => void;
  onNavigateDashboard: () => void;
  onNavigateMateri: () => void;
  onLogout: () => void;
}

export function HomeSidebar({
  activeNav,
  itemCount,
  onOpenNewModal,
  onNavigateDashboard,
  onNavigateMateri,
  onLogout,
}: HomeSidebarProps) {
  return (
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
        <button type="button" className="db-btn-sidebar-create" onClick={onOpenNewModal}>
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

      {/* Widget status penyimpanan browser */}
      <div className="db-sidebar-widget">
        <div className="db-sidebar-widget-head">
          <span className="db-pulse-dot" />
          <span>Penyimpanan Lokal</span>
        </div>
        <p>
          {itemCount} materi aktif tersimpan di peramban, siap dikonversi ke paket .h5p kapan saja.
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
            onClick={onLogout}
          >
            <ExitIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
