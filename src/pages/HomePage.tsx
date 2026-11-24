/**
 * Route /dashboard dan /materi - Kerangka UI Dashboard Profesional
 * Tema: hijau hutan dan off-white, selaras dengan landing page
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../dashboard-canva.css';
import { Toast } from '../components/UI/Toast';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';
import { Dashboard } from '../features/projects/components/Dashboard';
import { NewMaterialModal } from '../features/projects/components/NewMaterialModal';
import { ProjectsHome } from '../features/exporter/components/ProjectsHome';
import { HomeSidebar } from './home/HomeSidebar';
import { HomeTopbar } from './home/HomeTopbar';
import { HomeMobileNav } from './home/HomeMobileNav';
import type { Project } from '../features/studio/constants/h5pModel';

const NOTICE_TIMEOUT_MS = 2600;

export function HomePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { store, openProject } = useStudio();
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const displayName = user?.name.trim() ?? '';
  const [showNew, setShowNew] = useState(false);
  const [newNonce, setNewNonce] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tab = pathname === '/materi' ? 'materi' : 'dashboard';
  const activeNav = tab === 'materi' ? 'materi' : 'dashboard';

  const openStudioInNewTab = (project: Project) => {
    const query = new URLSearchParams({ project: project.id, from: pathname });
    window.open(`/studio?${query.toString()}`, '_blank', 'noopener,noreferrer');
  };

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
    <div className="db-scope db-scope--reference">
      <div className="db-shell">
        <HomeSidebar
          displayName={displayName}
          userEmail={user?.email}
          userRole={user?.role}
          activeNav={activeNav}
          itemCount={store.items.length}
          onNavigateDashboard={() => navigate('/dashboard')}
          onNavigateMateri={() => navigate('/materi')}
          onNavigateAdmin={user?.role === 'ADMIN' ? () => navigate('/admin/users') : undefined}
          onLogout={logout}
        />

        <div className="db-main">
          <HomeTopbar
            displayName={displayName}
            tab={tab}
          />

          <HomeMobileNav
            activeNav={activeNav}
            itemCount={store.items.length}
            onOpenNewModal={openNewModal}
            onNavigateDashboard={() => navigate('/dashboard')}
            onNavigateMateri={() => navigate('/materi')}
            onNavigateAdmin={user?.role === 'ADMIN' ? () => navigate('/admin/users') : undefined}
          />

          <main className="db-content">
            {tab === 'dashboard' ? (
              <Dashboard
                items={store.items}
                onOpen={openStudioInNewTab}
                onGoMaterials={() => navigate('/materi')}
                onCreate={openNewModal}
                query={query}
                onQueryChange={setQuery}
                searchInputRef={searchInputRef}
              />
            ) : (
              <ProjectsHome
                items={store.items}
                isLoading={store.isLoading}
                loadError={store.loadError}
                onOpen={(p, opts) => openProject(p, pathname, { saved: opts?.saved ?? true })}
                onOpenInNewTab={openStudioInNewTab}
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
