/**
 * Daftar materi: buat, cari, saring, urut, rename, duplikat, hapus, impor .h5p.
 * Operasi CRUD penuh di atas draf lokal (FR-12).
 */
import { useMemo, useRef, useState } from 'react';
import {
  CheckIcon,
  CopyIcon,
  Cross2Icon,
  FilePlusIcon,
  OpenInNewWindowIcon,
  Pencil1Icon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { createProject } from '../../studio/constants/h5pModel';
import type { AspectRatio, Project } from '../../studio/constants/h5pModel';
import { parseH5p } from '../api/h5pPackager';
import type { StoredProjectMeta } from '../../projects/hooks/useProjectStore';

type ProjectsHomeProps = {
  items: StoredProjectMeta[];
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onNotice: (message: string) => void;
};

type SourceFilter = 'all' | 'pptx' | 'pdf' | 'h5p' | 'manual';
type SortKey = 'updated' | 'title' | 'slides';

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

function sourceOf(item: StoredProjectMeta): { key: Exclude<SourceFilter, 'all'>; label: string } {
  const fn = item.sourceFileName?.toLowerCase() ?? '';
  if (!fn) return { key: 'manual', label: 'Bikin sendiri' };
  if (fn.endsWith('.h5p')) return { key: 'h5p', label: 'File H5P' };
  if (fn.endsWith('.pptx')) return { key: 'pptx', label: 'PPTX' };
  if (fn.endsWith('.pdf')) return { key: 'pdf', label: 'PDF' };
  return { key: 'manual', label: 'Bikin sendiri' };
}

export function ProjectsHome({ items, onOpen, onDelete, onRename, onDuplicate, onNotice }: ProjectsHomeProps) {
  const [title, setTitle] = useState('');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [sort, setSort] = useState<SortKey>('updated');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const createNew = () => {
    onOpen(createProject(title || 'Modul baru', aspect, null));
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const project = await parseH5p(file);
      onOpen(project);
      onNotice(`${project.title} kebuka, silakan edit lagi.`);
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'File-nya gagal dibuka.');
    } finally {
      setImporting(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (filter !== 'all' && sourceOf(item).key !== filter) return false;
      if (q && !item.title.toLowerCase().includes(q) && !(item.sourceFileName ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'id');
      if (sort === 'slides') return b.slideCount - a.slideCount;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }, [items, query, filter, sort]);

  const saveRename = (id: string) => {
    if (draftTitle.trim()) {
      onRename(id, draftTitle);
      onNotice('Judul sudah diganti.');
    }
    setEditingId(null);
  };

  return (
    <div className="projects-home">
      <p className="section-kicker">Daftar materi</p>
      <h1>Materi saya</h1>
      <p className="muted">
        Bikin materi baru, cari materi lama, atau buka lagi file <code>.h5p</code> yang pernah didownload. Semua kesimpan otomatis di browser.
      </p>

      <div className="new-project-card">
        <div className="new-project-fields">
          <label className="field-label">
            Judul materi
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. Keselamatan Kerja Dasar" />
          </label>
          <label className="field-label">
            Ukuran slide
            <select value={aspect} onChange={(e) => setAspect(e.target.value as AspectRatio)}>
              <option value="16:9">16:9 — layar lebar</option>
              <option value="4:3">4:3 — kotak klasik</option>
            </select>
          </label>
        </div>
        <div className="new-project-actions">
          <button className="primary-button" type="button" onClick={createNew}>
            <FilePlusIcon /> Bikin materi baru
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".h5p"
            hidden
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
          <button className="secondary-button" type="button" disabled={importing} onClick={() => importRef.current?.click()}>
            <UploadIcon /> {importing ? 'Membuka file…' : 'Buka file .h5p'}
          </button>
        </div>
      </div>

      <div className="materials-toolbar">
        <input
          className="materials-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul atau nama file…"
          aria-label="Cari materi"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as SourceFilter)} aria-label="Saring sumber">
          <option value="all">Semua</option>
          <option value="pptx">PPTX</option>
          <option value="pdf">PDF</option>
          <option value="h5p">File H5P</option>
          <option value="manual">Bikin sendiri</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Urutkan">
          <option value="updated">Terakhir diubah</option>
          <option value="title">Judul A–Z</option>
          <option value="slides">Slide paling banyak</option>
        </select>
      </div>

      <h2>
        {visible.length} dari {items.length} materi
      </h2>
      {visible.length === 0 ? (
        <p className="muted">Tidak ketemu. Coba kata kunci lain.</p>
      ) : (
        <div className="project-grid">
          {visible.map((item) => (
            <article className="project-card" key={item.id}>
              <div>
                {editingId === item.id ? (
                  <div className="rename-row">
                    <input
                      value={draftTitle}
                      autoFocus
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      aria-label="Judul baru"
                    />
                    <button className="small-icon-button" type="button" aria-label="Simpan" onClick={() => saveRename(item.id)}>
                      <CheckIcon />
                    </button>
                    <button className="small-icon-button" type="button" aria-label="Batal" onClick={() => setEditingId(null)}>
                      <Cross2Icon />
                    </button>
                  </div>
                ) : (
                  <strong>{item.title}</strong>
                )}
                <small>
                  {item.slideCount} slide · {sourceOf(item).label} · {item.sourceFileName ?? 'tanpa file'} ·{' '}
                  {timeAgo(item.updatedAt)}
                </small>
              </div>
              <div className="project-card-actions">
                <button className="secondary-button" type="button" onClick={() => onOpen(item.snapshot)}>
                  <OpenInNewWindowIcon /> Buka
                </button>
                <button
                  className="small-icon-button"
                  type="button"
                  title="Ubah judul"
                  aria-label="Ubah judul"
                  onClick={() => {
                    setEditingId(item.id);
                    setDraftTitle(item.title);
                  }}
                >
                  <Pencil1Icon />
                </button>
                <button
                  className="small-icon-button"
                  type="button"
                  title="Gandakan"
                  aria-label="Gandakan materi"
                  onClick={() => {
                    onDuplicate(item.id);
                    onNotice('Materi sudah digandakan.');
                  }}
                >
                  <CopyIcon />
                </button>
                <button
                  className="small-icon-button danger"
                  type="button"
                  title="Hapus"
                  aria-label="Hapus materi"
                  onClick={() => {
                    if (window.confirm(`Hapus "${item.title}"? Tidak bisa dibatalkan lho.`)) {
                      onDelete(item.id);
                      onNotice('Materi sudah dihapus.');
                    }
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
