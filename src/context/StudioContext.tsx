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
import { getCurrentProjectSessionKey, getProjectsStorageKey } from '../services/authService';
import { fetchServerProject } from '../features/ingest/api/serverIngest';

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
  saveDraft: () => Promise<void>;
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
      const id = sessionStorage.getItem(getCurrentProjectSessionKey(userId));
      const raw = localStorage.getItem(getProjectsStorageKey(userId));
      const items = raw ? (JSON.parse(raw) as Array<{ id: string; snapshot: Project }>) : [];

      if (id && items.length > 0) {
        const found = items.find((p) => p.id === id);
        if (found) {
          actions.replaceProject(hydrateProject(found.snapshot));
          savedSnapshot.current = found.snapshot;
          setCurrentId(found.id);
          setSavedLabel('Draf tersimpan');
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

  const openProject = useCallback(
    (project: Project, from: string, opts?: { step?: number; saved?: boolean }) => {
      actions.replaceProject(hydrateProject(project));
      savedSnapshot.current = opts?.saved ? project : null;
      setCurrentId(project.id);
      setSavedLabel(opts?.saved ? 'Draf tersimpan' : 'Belum disimpan');
      try {
        sessionStorage.setItem(getCurrentProjectSessionKey(userId), project.id);
      } catch {
        // abaikan
      }

      // Jika proyek berasal dari sinkronisasi server dan slide-nya belum dimuat di lokal
      if (
        project.slides.length === 0 &&
        project.id &&
        !project.id.startsWith('temp-') &&
        !project.id.startsWith('local-')
      ) {
        fetchServerProject(project.id)
          .then((full) => {
            actions.replaceProject(hydrateProject(full));
            store.save(full);
          })
          .catch(() => undefined);
      }

      navigate('/studio', { state: { from, step: opts?.step } });
    },
    [actions, navigate, store, userId],
  );

  const saveDraft = useCallback(async () => {
    store.save(state.project);
    savedSnapshot.current = state.project;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const id = state.project.id;

    if (id && !id.startsWith('temp-') && !id.startsWith('local-')) {
      try {
        await apiFetch(`/projects/${id}/slides`, {
          method: 'PUT',
          body: { slides: state.project.slides },
        });
        setSavedLabel(`Tersimpan di server ${time}`);
        return;
      } catch (err) {
        console.warn('Gagal sinkronisasi slide ke backend, tersimpan di lokal:', err);
      }
    }

    setSavedLabel(`Tersimpan ${time}`);
  }, [store, state.project]);

  const value = useMemo(
    () => ({ store, state, actions, currentId, savedLabel, openProject, saveDraft }),
    [store, state, actions, currentId, savedLabel, openProject, saveDraft],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio harus dipakai di dalam StudioProvider.');
  return ctx;
}
