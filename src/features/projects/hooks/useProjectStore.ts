/**
 * Penyimpanan draf proyek di browser (FR-12 Should Have, versi lokal).
 * File/Blob tidak diserialisasi — draf menyimpan metadata + teks;
 * aset biner perlu diunggah ulang setelah muat draf.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { createProject, uid } from '../../studio/constants/h5pModel';
import type { Project } from '../../studio/constants/h5pModel';
import { registerSlideBg } from '../../studio/utils/mediaRegistry';
import { apiFetch } from '../../../services/api';
import {
  getProjectsStorageKey,
  loadPendingSyncIds,
  removePendingSyncId,
} from '../../../services/authService';
import {
  formatNetworkError,
  isBrowserOffline,
  subscribeOnlineRecovery,
} from '../../../services/network';
import {
  duplicateServerProject,
  isServerProjectId,
  parseProjectSettings,
} from '../../ingest/api/serverIngest';

export const PROJECTS_STORAGE_KEY = 'h5p-generator:projects:v1';

export interface StoredProjectMeta {
  id: string;
  title: string;
  sourceFileName: string | null;
  slideCount: number;
  updatedAt: string;
  snapshot: Project;
}

export interface ProjectActionResult {
  ok: boolean;
  error?: string;
}

function loadAllForUser(userId?: string | null): StoredProjectMeta[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getProjectsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProjectMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Aset yang disajikan backend (http/https atau path relatif /api/...) tetap valid
 * setelah reload, sedangkan blob:/data: hanya hidup selama tab ini.
 */
function persistentAssetUrl(url: string | null): string | null {
  return typeof url === 'string' && /^(https?:\/\/|\/api\/)/i.test(url) ? url : null;
}

function snapshotProject(project: Project): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    slides: project.slides.map((s) => {
      if (s.backgroundUrl) registerSlideBg(s.id, s.backgroundUrl);
      return {
        ...s,
        backgroundUrl: persistentAssetUrl(s.backgroundUrl),
        elements: s.elements.map((e) => {
          if (e.kind === 'image' || e.kind === 'audio' || e.kind === 'video') {
            return { ...e, file: null, objectUrl: persistentAssetUrl(e.objectUrl) } as typeof e;
          }
          return e;
        }),
      };
    }),
  };
}

interface ServerProjectSummary {
  id: string;
  title: string;
  sourceFileName: string | null;
  aspect: string;
  settingsJson?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { slides: number };
}

function mergeServerProjects(
  prev: StoredProjectMeta[],
  serverList: ServerProjectSummary[],
  userId: string,
): StoredProjectMeta[] {
  const pendingIds = loadPendingSyncIds(userId);
  const map = new Map<string, StoredProjectMeta>();
  for (const item of prev) {
    if (item.id.startsWith('local-') || item.id.startsWith('temp-')) {
      map.set(item.id, item);
    }
  }

  for (const srv of serverList) {
    const aspect = srv.aspect === '4:3' ? '4:3' : '16:9';
    const existing = prev.find((p) => p.id === srv.id);
    if (existing && pendingIds.has(srv.id)) {
      map.set(srv.id, existing);
    } else if (existing) {
      map.set(srv.id, {
        ...existing,
        title: srv.title,
        sourceFileName: srv.sourceFileName,
        slideCount: srv._count?.slides ?? existing.slideCount,
        updatedAt: srv.updatedAt || existing.updatedAt,
        snapshot: {
          ...existing.snapshot,
          title: srv.title,
          settings: parseProjectSettings(srv.settingsJson, srv.title, aspect, existing.snapshot.settings),
        },
      });
    } else {
      const snap = createProject(srv.title, aspect, srv.sourceFileName);
      snap.id = srv.id;
      snap.createdAt = srv.createdAt;
      snap.updatedAt = srv.updatedAt;
      snap.settings = parseProjectSettings(srv.settingsJson, srv.title, aspect, snap.settings);
      map.set(srv.id, {
        id: srv.id,
        title: srv.title,
        sourceFileName: srv.sourceFileName,
        slideCount: srv._count?.slides ?? 0,
        updatedAt: srv.updatedAt,
        snapshot: snap,
      });
    }
  }
  return [...map.values()].slice(0, 50);
}

export function useProjectStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<StoredProjectMeta[]>(() => loadAllForUser(userId));

  // Muat ulang daftar draf lokal milik user aktif ketika akun berganti / logout
  useEffect(() => {
    setItems(loadAllForUser(userId));
  }, [userId]);

  // Simpan draf lokal ke localStorage ber-scope userId saat items berubah
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(getProjectsStorageKey(userId), JSON.stringify(items));
    } catch {
      // penyimpanan penuh — abaikan agar editor tetap jalan
    }
  }, [items, userId]);

  // Sinkronisasi otomatis daftar materi dari basis data server backend untuk user aktif
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const runSync = () => {
      if (isBrowserOffline()) return;
      apiFetch<{ data: ServerProjectSummary[] }>('/projects')
        .then((res) => {
          if (cancelled || !Array.isArray(res.data)) return;
          setItems((prev) => mergeServerProjects(prev, res.data, userId));
        })
        .catch(() => {
          // Tetap gunakan cache terakhir sampai jaringan tersedia kembali
        });
    };

    runSync();
    const unsubscribe = subscribeOnlineRecovery(runSync);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);

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

  // Hapus proyek setelah terkonfirmasi terhapus di server (atau langsung bila draf temp/local)
  const remove = useCallback(
    async (id: string): Promise<ProjectActionResult> => {
      if (isServerProjectId(id)) {
        if (isBrowserOffline()) {
          return {
            ok: false,
            error: 'Koneksi internet terputus. Hubungkan kembali jaringan Anda untuk menghapus materi.',
          };
        }
        try {
          await apiFetch(`/projects/${id}`, { method: 'DELETE' });
        } catch (err) {
          return {
            ok: false,
            error: formatNetworkError(err, 'Gagal menghapus materi dari server.'),
          };
        }
        removePendingSyncId(userId, id);
      }

      setItems((prev) => prev.filter((p) => p.id !== id));
      return { ok: true };
    },
    [userId],
  );

  // Perbarui judul di server terlebih dahulu sebelum mengubah state lokal
  const rename = useCallback(async (id: string, title: string): Promise<ProjectActionResult> => {
    const clean = title.trim();
    if (!clean) return { ok: false, error: 'Judul materi tidak boleh kosong.' };

    if (isServerProjectId(id)) {
      if (isBrowserOffline()) {
        return {
          ok: false,
          error: 'Koneksi internet terputus. Hubungkan kembali jaringan Anda untuk mengubah judul.',
        };
      }
      try {
        await apiFetch(`/projects/${id}`, { method: 'PATCH', body: { title: clean } });
      } catch (err) {
        return {
          ok: false,
          error: formatNetworkError(err, 'Gagal memperbarui judul materi di server.'),
        };
      }
    }

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
    return { ok: true };
  }, []);

  const duplicate = useCallback(async (id: string): Promise<ProjectActionResult> => {
    if (isServerProjectId(id)) {
      if (isBrowserOffline()) {
        return {
          ok: false,
          error: 'Koneksi internet terputus. Hubungkan kembali jaringan Anda untuk menggandakan materi.',
        };
      }
      try {
        const copy = await duplicateServerProject(id);
        const snapshot = snapshotProject(copy);
        const meta: StoredProjectMeta = {
          id: snapshot.id,
          title: snapshot.title,
          sourceFileName: snapshot.sourceFileName,
          slideCount: snapshot.slides.length,
          updatedAt: snapshot.updatedAt,
          snapshot,
        };
        setItems((prev) => [meta, ...prev.filter((p) => p.id !== meta.id)].slice(0, 50));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: formatNetworkError(err, 'Gagal menggandakan materi.') };
      }
    }

    setItems((prev) => {
      const src = prev.find((p) => p.id === id);
      if (!src) return prev;
      const snap = JSON.parse(JSON.stringify(src.snapshot)) as Project;
      const now = new Date().toISOString();
      snap.id = `local-${uid()}`;
      snap.createdAt = now;
      snap.updatedAt = now;
      snap.title = `${src.title} (Salinan)`;
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
      return [meta, ...prev].slice(0, 50);
    });
    return { ok: true };
  }, []);

  return { items, save, remove, rename, duplicate };
}
