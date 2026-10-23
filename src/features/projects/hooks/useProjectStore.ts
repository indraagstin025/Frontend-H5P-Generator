/**
 * Penyimpanan draf proyek di browser (FR-12 Should Have, versi lokal).
 * File/Blob tidak diserialisasi — draf menyimpan metadata + teks;
 * aset biner perlu diunggah ulang setelah muat draf.
 */
import { useCallback, useEffect, useState } from 'react';
import { uid } from '../../studio/constants/h5pModel';
import type { Project } from '../../studio/constants/h5pModel';

export const PROJECTS_STORAGE_KEY = 'h5p-generator:projects:v1';

export interface StoredProjectMeta {
  id: string;
  title: string;
  sourceFileName: string | null;
  slideCount: number;
  updatedAt: string;
  snapshot: Project;
}

function loadAll(): StoredProjectMeta[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProjectMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Aset yang disajikan backend (http/https) tetap valid setelah reload,
 * sedangkan blob:/data: hanya hidup selama tab ini. Jadi hanya URL server
 * yang ikut disimpan ke draf.
 */
function persistentAssetUrl(url: string | null): string | null {
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
}

function snapshotProject(project: Project): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    slides: project.slides.map((s) => ({
      ...s,
      backgroundUrl: persistentAssetUrl(s.backgroundUrl),
      elements: s.elements.map((e) => {
        if (e.kind === 'image' || e.kind === 'audio' || e.kind === 'video') {
          return { ...e, file: null, objectUrl: persistentAssetUrl(e.objectUrl) } as typeof e;
        }
        return e;
      }),
    })),
  };
}

export function useProjectStore() {
  const [items, setItems] = useState<StoredProjectMeta[]>(() => loadAll());

  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // penyimpanan penuh — abaikan agar editor tetap jalan
    }
  }, [items]);

  const save = useCallback((project: Project) => {
    const snapshot = snapshotProject(project);
    const meta: StoredProjectMeta = {
      id: snapshot.id,
      title: snapshot.title,
      sourceFileName: snapshot.sourceFileName,
      slideCount: snapshot.slides.length,
      updatedAt: snapshot.updatedAt,
      snapshot,
    };
    setItems((prev) => {
      const rest = prev.filter((p) => p.id !== meta.id);
      return [meta, ...rest].slice(0, 30);
    });
    return meta;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const rename = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              title: clean,
              updatedAt: new Date().toISOString(),
              snapshot: {
                ...p.snapshot,
                title: clean,
                settings: { ...p.snapshot.settings, projectTitle: clean },
              },
            }
          : p,
      ),
    );
  }, []);

  const duplicate = useCallback((id: string) => {
    setItems((prev) => {
      const src = prev.find((p) => p.id === id);
      if (!src) return prev;
      const snap = JSON.parse(JSON.stringify(src.snapshot)) as Project;
      const now = new Date().toISOString();
      snap.id = uid();
      snap.createdAt = now;
      snap.updatedAt = now;
      snap.title = `${src.title} (salinan)`;
      snap.settings = { ...snap.settings, projectTitle: snap.title };
      // URL server tetap valid; hanya blob/data yang tidak bertahan antar sesi.
      snap.slides = snap.slides.map((s) => ({
        ...s,
        backgroundUrl: persistentAssetUrl(s.backgroundUrl),
        elements: s.elements.map((e) =>
          e.kind === 'image' || e.kind === 'audio' || e.kind === 'video'
            ? { ...e, objectUrl: persistentAssetUrl(e.objectUrl), file: null }
            : e,
        ),
      }));
      const meta: StoredProjectMeta = {
        id: snap.id,
        title: snap.title,
        sourceFileName: snap.sourceFileName,
        slideCount: snap.slides.length,
        updatedAt: now,
        snapshot: snap,
      };
      return [meta, ...prev].slice(0, 30);
    });
  }, []);

  return { items, save, remove, rename, duplicate };
}
