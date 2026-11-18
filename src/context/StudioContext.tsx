/**
 * State lintas route: draf tersimpan + proyek yang sedang dibuka.
 * Provider wajib di dalam BrowserRouter (pakai useNavigate).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useProject } from '../features/studio/hooks/useProject';
import type { ProjectStore } from '../features/studio/hooks/useProject';
import { useProjectStore } from '../features/projects/hooks/useProjectStore';
import { createProject, type Project } from '../features/studio/constants/h5pModel';
import { hydrateElementMedia, getSlideBg, registerSlideBg } from '../features/studio/utils/mediaRegistry';
import { apiFetch } from '../services/api';
import {
  addPendingSyncId,
  getCurrentProjectSessionKey,
  getProjectsStorageKey,
  loadPendingSyncIds,
  removePendingSyncId,
} from '../services/authService';
import { isBrowserOffline, isNetworkFailure, subscribeOnlineRecovery } from '../services/network';
import { fetchServerProject, isServerProjectId } from '../features/ingest/api/serverIngest';

async function pushProjectToServer(project: Project): Promise<void> {
  await Promise.all([
    apiFetch(`/projects/${project.id}/slides`, {
      method: 'PUT',
      body: { slides: project.slides },
    }),
    apiFetch(`/projects/${project.id}`, {
      method: 'PATCH',
      body: {
        title: project.title,
        settings: {
          language: project.settings.language,
          keywordListEnabled: project.settings.keywordListEnabled,
          requireQuestionsBeforeNavigation: project.settings.requireQuestionsBeforeNavigation !== false,
          activeSurface: project.settings.activeSurface,
          hideSummarySlide: project.settings.hideSummarySlide,
          showSolutionButton: project.settings.showSolutionButton,
          retryButton: project.settings.retryButton,
        },
      },
    }),
  ]);
}

function hydrateProject(p: Project): Project {
  return {
    ...p,
    slides: p.slides.map((s) => {
      const bg = s.backgroundUrl ?? getSlideBg(s.id) ?? null;
      if (bg) registerSlideBg(s.id, bg);
      return {
        ...s,
        backgroundUrl: bg,
        elements: s.elements.map(hydrateElementMedia),
      };
    }),
  };
}

interface StudioContextValue {
  store: ReturnType<typeof useProjectStore>;
  state: ProjectStore['state'];
  actions: ProjectStore['actions'];
  currentId: string | null;
  savedLabel: string;
  openProject: (project: Project, from: string, opts?: { step?: number; saved?: boolean }) => void;
  adoptProject: (project: Project, opts?: { saved?: boolean }) => void;
  saveDraft: () => Promise<boolean>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const store = useProjectStore();
  const { state, actions } = useProject(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState('Belum disimpan');
  // Referensi proyek terakhir yang benar-benar disimpan ke localStorage.
  const savedSnapshot = useRef<Project | null>(null);

  useEffect(() => {
    if (savedSnapshot.current !== null && savedSnapshot.current !== state.project) {
      setSavedLabel('Belum disimpan');
    }
  }, [state.project]);

  // Pulihkan proyek aktif sesuai userId yang sedang login; reset saat logout/ganti akun
  useEffect(() => {
    if (!userId) {
      actions.replaceProject(createProject('Materi Baru', '16:9', null));
      savedSnapshot.current = null;
      setCurrentId(null);
      setSavedLabel('Belum disimpan');
      return;
    }

    try {
      const requestedId = window.location.pathname === '/studio'
        ? new URLSearchParams(window.location.search).get('project')
        : null;
      const id = requestedId || sessionStorage.getItem(getCurrentProjectSessionKey(userId));
      const raw = localStorage.getItem(getProjectsStorageKey(userId));
      const items = raw ? (JSON.parse(raw) as Array<{ id: string; snapshot: Project }>) : [];

      if (id && items.length > 0) {
        const found = items.find((p) => p.id === id);
        if (found) {
          sessionStorage.setItem(getCurrentProjectSessionKey(userId), found.id);
          const hydrated = hydrateProject(found.snapshot);
          actions.replaceProject(hydrated);
          savedSnapshot.current = hydrated;
          setCurrentId(found.id);
          setSavedLabel('Draf tersimpan');
          if (requestedId && found.snapshot.slides.length === 0 && isServerProjectId(found.id)) {
            let cancelled = false;
            void fetchServerProject(found.id).then((full) => {
              if (cancelled) return;
              actions.replaceProject(hydrateProject(full));
              savedSnapshot.current = full;
              store.save(full);
            }).catch(() => {
              if (!cancelled) setSavedLabel('Gagal memuat slide. Muat ulang untuk mencoba lagi.');
            });
            return () => { cancelled = true; };
          }
          return;
        }
      }
    } catch {
      // abaikan jika gagal akses storage
    }

    actions.replaceProject(createProject('Materi Baru', '16:9', null));
    savedSnapshot.current = null;
    setCurrentId(null);
    setSavedLabel('Belum disimpan');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const adoptProject = useCallback(
    (project: Project, opts?: { saved?: boolean }) => {
      const hydrated = hydrateProject(project);
      actions.replaceProject(hydrated);
      savedSnapshot.current = opts?.saved ? hydrated : null;
      setCurrentId(hydrated.id);
      setSavedLabel(opts?.saved ? 'Draf tersimpan' : 'Belum disimpan');
      if (opts?.saved) {
        store.save(hydrated);
      }
      try {
        sessionStorage.setItem(getCurrentProjectSessionKey(userId), hydrated.id);
      } catch {
        // abaikan
      }
    },
    [actions, store, userId],
  );

  const openProject = useCallback(
    (project: Project, from: string, opts?: { step?: number; saved?: boolean }) => {
      const hydrated = hydrateProject(project);
      actions.replaceProject(hydrated);
      savedSnapshot.current = opts?.saved ? hydrated : null;
      setCurrentId(project.id);
      setSavedLabel(opts?.saved ? 'Draf tersimpan' : 'Belum disimpan');
      if (opts?.saved) {
        store.save(project);
      }
      try {
        sessionStorage.setItem(getCurrentProjectSessionKey(userId), project.id);
      } catch {
        // abaikan
      }

      // Jika proyek berasal dari sinkronisasi server dan slide-nya belum dimuat di lokal
      if (
        !isBrowserOffline() &&
        project.slides.length === 0 &&
        isServerProjectId(project.id)
      ) {
        fetchServerProject(project.id)
          .then((full) => {
            actions.replaceProject(hydrateProject(full));
            savedSnapshot.current = full;
            store.save(full);
          })
          .catch(() => undefined);
      }

      navigate('/studio', { state: { from, step: opts?.step } });
    },
    [actions, navigate, store, userId],
  );

  const projectRef = useRef(state.project);
  useEffect(() => {
    projectRef.current = state.project;
  }, [state.project]);

  useEffect(() => {
    if (!userId) return;
    const syncPending = async () => {
      if (isBrowserOffline()) return;
      const pendingIds = loadPendingSyncIds(userId);
      if (pendingIds.size === 0) return;

      try {
        const raw = localStorage.getItem(getProjectsStorageKey(userId));
        const items = raw ? (JSON.parse(raw) as Array<{ id: string; snapshot: Project }>) : [];
        for (const id of pendingIds) {
          if (!isServerProjectId(id)) {
            removePendingSyncId(userId, id);
            continue;
          }
          const activeProject = projectRef.current.id === id ? projectRef.current : null;
          const target = activeProject ?? items.find((item) => item.id === id)?.snapshot;
          if (!target) {
            removePendingSyncId(userId, id);
            continue;
          }
          await pushProjectToServer(target);
          removePendingSyncId(userId, id);
          if (projectRef.current.id === id) {
            const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setSavedLabel(`Tersimpan di server ${time}`);
          }
        }
      } catch {
        // Akan dicoba ulang otomatis pada pemulihan koneksi berikutnya
      }
    };

    return subscribeOnlineRecovery(() => {
      void syncPending();
    });
  }, [userId]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    store.save(state.project);
    savedSnapshot.current = state.project;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const id = state.project.id;

    if (isServerProjectId(id)) {
      if (isBrowserOffline()) {
        addPendingSyncId(userId, id);
        setSavedLabel('Gagal simpan ke server (offline)');
        return false;
      }
      try {
        await pushProjectToServer(state.project);
        removePendingSyncId(userId, id);
        setSavedLabel(projectRef.current === state.project ? `Tersimpan di server ${time}` : 'Belum disimpan');
        return true;
      } catch (err) {
        if (isNetworkFailure(err)) {
          addPendingSyncId(userId, id);
          setSavedLabel('Gagal simpan ke server (jaringan terputus)');
        } else {
          setSavedLabel(`Gagal simpan ke server ${time}`);
        }
        return false;
      }
    }

    setSavedLabel(`Tersimpan ${time}`);
    return true;
  }, [store, state.project, userId]);

  const value = useMemo(
    () => ({ store, state, actions, currentId, savedLabel, openProject, adoptProject, saveDraft }),
    [store, state, actions, currentId, savedLabel, openProject, adoptProject, saveDraft],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio harus dipakai di dalam StudioProvider.');
  return ctx;
}
