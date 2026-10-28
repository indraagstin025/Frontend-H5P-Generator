/**
 * State lintas route: draf tersimpan + proyek yang sedang dibuka.
 * Provider wajib di dalam BrowserRouter (pakai useNavigate).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../features/studio/hooks/useProject';
import type { ProjectStore } from '../features/studio/hooks/useProject';
import { PROJECTS_STORAGE_KEY, useProjectStore } from '../features/projects/hooks/useProjectStore';
import { createProject, createSlide } from '../features/studio/constants/h5pModel';
import type { Project } from '../features/studio/constants/h5pModel';
import { hydrateElementMedia } from '../features/studio/utils/mediaRegistry';

const CURRENT_KEY = 'h5p-generator:current-project';

function hydrateProject(p: Project): Project {
  return {
    ...p,
    slides: p.slides.map((s) => ({
      ...s,
      elements: s.elements.map(hydrateElementMedia),
    })),
  };
}

interface StudioContextValue {
  store: ReturnType<typeof useProjectStore>;
  state: ProjectStore['state'];
  actions: ProjectStore['actions'];
  currentId: string | null;
  savedLabel: string;
  openProject: (project: Project, from: string, opts?: { step?: number }) => void;
  saveDraft: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const store = useProjectStore();
  const { state, actions } = useProject(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState('Belum disimpan');
  const restored = useRef(false);

  // Refresh browser tidak kehilangan proyek yang sedang dibuka
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const id = sessionStorage.getItem(CURRENT_KEY);
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as Array<{ id: string; snapshot: Project }>) : [];

      if (id && items.length > 0) {
        const found = items.find((p) => p.id === id);
        if (found) {
          actions.replaceProject(hydrateProject(found.snapshot));
          setCurrentId(found.id);
          setSavedLabel('Tersimpan otomatis');
          return;
        }
      }

      if (items.length > 0 && items[0]) {
        actions.replaceProject(hydrateProject(items[0].snapshot));
        setCurrentId(items[0].id);
        sessionStorage.setItem(CURRENT_KEY, items[0].id);
        setSavedLabel('Tersimpan otomatis');
        return;
      }

      // Proyek awal default persis seperti di gambar referensi
      const sample = createProject('Pengenalan H5P Interaktif', '16:9', null);
      const s1 = createSlide(1, 'Pengenalan Ekosistem', '16:9');
      s1.chapter = 'BAB 01 - DASAR';
      s1.tone = 'lime';

      const s2 = createSlide(2, 'Apa Itu H5P?', '16:9');
      s2.chapter = 'BAB 01 - DASAR';
      s2.tone = 'forest';

      const s3 = createSlide(3, 'Cek pemahamanmu', '16:9');
      s3.chapter = 'BAB 01 - DASAR';
      s3.tone = 'mint';

      sample.slides = [s1, s2, s3];

      actions.replaceProject(sample);
      setCurrentId(sample.id);
      sessionStorage.setItem(CURRENT_KEY, sample.id);
      store.save(sample);
      setSavedLabel('Tersimpan otomatis');
    } catch {
      // abaikan jika gagal akses storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProject = useCallback(
    (project: Project, from: string, opts?: { step?: number }) => {
      actions.replaceProject(hydrateProject(project));
      setCurrentId(project.id);
      setSavedLabel('Belum disimpan');
      try {
        sessionStorage.setItem(CURRENT_KEY, project.id);
      } catch {
        // abaikan
      }
      navigate('/studio', { state: { from, step: opts?.step } });
    },
    [actions, navigate],
  );

  const saveDraft = useCallback(() => {
    store.save(state.project);
    setSavedLabel(
      `Tersimpan ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    );
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
