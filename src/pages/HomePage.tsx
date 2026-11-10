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
import { HomeSidebar } from './home/HomeSidebar';
import { HomeTopbar } from './home/HomeTopbar';
import { HomeMobileNav } from './home/HomeMobileNav';

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
        <HomeSidebar
          activeNav={activeNav}
          itemCount={store.items.length}
          onOpenNewModal={openNewModal}
          onNavigateDashboard={() => navigate('/dashboard')}
          onNavigateMateri={() => navigate('/materi')}
          onLogout={() => navigate('/')}
        />

        <div className="db-main">
          <HomeTopbar
            tab={tab}
            query={query}
            onQueryChange={setQuery}
            searchInputRef={searchInputRef}
            onOpenNewModal={openNewModal}
          />

          <HomeMobileNav
            activeNav={activeNav}
            itemCount={store.items.length}
            onOpenNewModal={openNewModal}
            onNavigateDashboard={() => navigate('/dashboard')}
            onNavigateMateri={() => navigate('/materi')}
          />

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
