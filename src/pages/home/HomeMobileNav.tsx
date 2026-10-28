import { DashboardIcon, LayersIcon, PlusIcon } from '@radix-ui/react-icons';

interface HomeMobileNavProps {
  activeNav: 'dashboard' | 'materi';
  itemCount: number;
  onOpenNewModal: () => void;
  onNavigateDashboard: () => void;
  onNavigateMateri: () => void;
}

export function HomeMobileNav({
  activeNav,
  itemCount,
  onOpenNewModal,
  onNavigateDashboard,
  onNavigateMateri,
}: HomeMobileNavProps) {
  return (
    <nav className="db-mobile-nav" aria-label="Navigasi seluler">
      <button
        type="button"
        className={`db-nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
        aria-current={activeNav === 'dashboard' ? 'page' : undefined}
        onClick={onNavigateDashboard}
      >
        <DashboardIcon />
        <span>Dashboard</span>
      </button>
      <button
        type="button"
        className={`db-nav-btn ${activeNav === 'materi' ? 'active' : ''}`}
        aria-current={activeNav === 'materi' ? 'page' : undefined}
        onClick={onNavigateMateri}
      >
        <LayersIcon />
        <span>Materi Saya ({itemCount})</span>
      </button>
      <button type="button" className="db-nav-btn" onClick={onOpenNewModal}>
        <PlusIcon />
        <span>Buat materi</span>
      </button>
    </nav>
  );
}
