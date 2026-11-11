/**
 * Dashboard ruang kerja pemateri
 * Ringkasan materi, akses cepat, dan status LMS internal.
 */
import { useRef, useState, type RefObject } from 'react';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  LayersIcon,
  PlusIcon,
  ReaderIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { loadExportHistory } from '../../exporter/api/exportHistory';
import { isQuizElement } from '../../studio/constants/h5pModel';
import type { StoredProjectMeta } from '../../projects/hooks/useProjectStore';
import type { Project } from '../../studio/constants/h5pModel';

type DashboardProps = {
  items: StoredProjectMeta[];
  onOpen: (project: Project) => void;
  onGoMaterials: () => void;
  onCreate?: () => void;
  query?: string;
  onQueryChange: (query: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

function quizCountOf(item: StoredProjectMeta): number {
  return item.snapshot.slides.flatMap((s) => s.elements).filter(isQuizElement).length;
}

function sourceOf(item: StoredProjectMeta): { key: 'manual' | 'pptx' | 'pdf' | 'h5p'; label: string; badgeClass: string } {
  const fn = item.sourceFileName?.toLowerCase() ?? '';
  if (!fn) return { key: 'manual', label: 'Dari nol', badgeClass: 'db-badge-manual' };
  if (fn.endsWith('.h5p')) return { key: 'h5p', label: 'File H5P', badgeClass: 'db-badge-h5p' };
  if (fn.endsWith('.pptx')) return { key: 'pptx', label: 'PPTX', badgeClass: 'db-badge-pptx' };
  if (fn.endsWith('.pdf')) return { key: 'pdf', label: 'PDF', badgeClass: 'db-badge-pdf' };
  return { key: 'manual', label: 'Dari nol', badgeClass: 'db-badge-manual' };
}

export function Dashboard({ items, onOpen, onGoMaterials, onCreate, query = '', onQueryChange, searchInputRef }: DashboardProps) {
  const [exports] = useState(loadExportHistory);
  const [exportPage, setExportPage] = useState(1);
  const [exportQuery, setExportQuery] = useState('');
  const filteredExports = exports.filter((entry) => `${entry.title} ${entry.format}`.toLowerCase().includes(exportQuery.trim().toLowerCase()));
  const exportPageCount = Math.max(1, Math.ceil(filteredExports.length / 5));
  const visibleExports = filteredExports.slice((exportPage - 1) * 5, exportPage * 5);
  const create = onCreate ?? onGoMaterials;
  const recent = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? recent.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || (p.sourceFileName ?? '').toLowerCase().includes(q),
      )
    : recent;
  const [materialPagination, setMaterialPagination] = useState({ query: q, page: 1 });
  const materialPageCount = Math.max(1, Math.ceil(filtered.length / 5));
  const materialPage = materialPagination.query === q
    ? Math.min(materialPagination.page, materialPageCount)
    : 1;
  const visibleMaterials = filtered.slice((materialPage - 1) * 5, materialPage * 5);

  const guideRef = useRef<HTMLDialogElement>(null);
  const totalSlides = items.reduce((total, item) => total + item.slideCount, 0);

  return (
    <>
      <section className="db-hero" aria-label="Selamat datang di ruang kerja">
        <div className="db-banner-ornaments" aria-hidden="true">
          <span className="db-banner-shape db-banner-square" />
          <span className="db-banner-shape db-banner-circle" />
          <span className="db-banner-shape db-banner-triangle" />
          <span className="db-banner-shape db-banner-ring" />
          <span className="db-banner-shape db-banner-small-square" />
          <span className="db-banner-shape db-banner-small-circle" />
        </div>
        <div className="db-hero-left">
          <div className="db-pill">
            <span className="db-pulse-dot" />
            <span>H5P Content Generator</span>
          </div>
          <h2>Mulai materi<br /><span>pembelajaran Anda.</span></h2>
          <p>
            Unggah PPTX atau PDF, atau mulai dari slide kosong. Tambahkan kuis di Studio,
            lalu unduh paket H5P untuk LMS Anda.
          </p>
          <div className="db-hero-actions">
            <button className="db-btn-primary" type="button" onClick={create}>
              <PlusIcon />
              <span>Buat materi baru</span>
            </button>
            <button className="db-btn-secondary" type="button" onClick={() => guideRef.current?.showModal()}>
              <ReaderIcon />
              <span>Panduan LMS</span>
            </button>
          </div>
        </div>
        <aside className="db-workspace-preview" aria-label="Kreasi pembelajaran interaktif">
          <div className="db-idea-card">
            <span className="db-idea-kicker">Ruang kreasi pembelajaran</span>
            <h3>Satu ide.<br />Banyak cara<br />belajar.</h3>
            <div className="db-idea-footer">
              <span>H5P / Course Presentation</span>
              <LayersIcon aria-hidden="true" />
            </div>
          </div>
        </aside>
      </section>

      <section className="db-overview" aria-label="Ringkasan ruang kerja">
        <article className="db-overview-item">
          <span>Total materi <LayersIcon aria-hidden="true" /></span>
          <strong>{items.length}</strong>
          <small>Tersimpan di ruang kerja Anda</small>
        </article>
        <article className="db-overview-item">
          <span>Total slide <FileTextIcon aria-hidden="true" /></span>
          <strong>{totalSlides}</strong>
          <small>Dari seluruh materi pembelajaran</small>
        </article>
        <article className="db-overview-item">
          <span>Riwayat ekspor <ClockIcon aria-hidden="true" /></span>
          <strong>{exports.length}</strong>
          <small>Paket tercatat di peramban ini</small>
        </article>
      </section>

      {/* Materi Terbaru */}
      {items.length === 0 ? (
        <div className="db-empty">
          <span className="db-icon-square" style={{ margin: '0 auto 12px' }} aria-hidden="true">
            <FileTextIcon />
          </span>
          <h3>Belum ada materi pembelajaran</h3>
          <p>Mulai buat modul interaktif pertama Anda dari berkas presentasi PPTX/PDF atau dari kanvas kosong.</p>
          <div className="db-empty-actions">
            <button className="db-btn-primary" type="button" onClick={create}>
              <PlusIcon />
              <span>Buat materi baru</span>
            </button>
          </div>
        </div>
      ) : (
        <section aria-label="Materi terbaru">
          <div className="db-section-head">
            <div>
              <h2 className="db-section-title">Materi terbaru</h2>
              <p className="db-section-subtitle">
                {q ? `Menampilkan hasil pencarian untuk "${query}"` : 'Modul yang baru saja Anda sunting atau buka'}
              </p>
            </div>
            <button className="db-text-action" type="button" onClick={onGoMaterials}>
              <span>Lihat semua materi ({items.length})</span>
              <ArrowRightIcon />
            </button>
          </div>
          <div className="db-section-search">
            <label htmlFor="db-material-search">Cari materi</label>
            <div className="db-search">
              <MagnifyingGlassIcon aria-hidden="true" />
              <input id="db-material-search" ref={searchInputRef} type="search" placeholder="Cari judul materi atau berkas…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
            </div>
          </div>
          <div className="db-card db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Judul materi</th>
                  <th>Sumber</th>
                  <th>Komposisi</th>
                  <th>Terakhir diubah</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleMaterials.map((p) => {
                  const src = sourceOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="db-material-title-cell">
                          <span className="db-material-file-icon" aria-hidden="true"><FileTextIcon /></span>
                          <div>
                            <span className="db-table-title">{p.title}</span>
                            {p.sourceFileName && (
                              <span className="db-table-sub">Berkas: {p.sourceFileName}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`db-badge ${src.badgeClass}`}>
                          {src.label}
                        </span>
                      </td>
                      <td>
                        <span className="db-badge db-badge-green">
                          {p.slideCount} slide · {quizCountOf(p)} kuis
                        </span>
                      </td>
                      <td>
                        <span className="db-table-time">
                          <ClockIcon />
                          <span>{timeAgo(p.updatedAt)}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="db-table-action-btn"
                          type="button"
                          onClick={() => onOpen(p.snapshot)}
                        >
                          <span>Buka di studio</span>
                          <ArrowRightIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12 }}>
                Tidak ada materi yang cocok dengan pencarian "{query}". Coba kata kunci lain.
              </p>
            )}
          </div>
          <div className="db-pagination-row">
            <span className="db-pagination-summary">
              {filtered.length === 0 ? '0 materi' : `${(materialPage - 1) * 5 + 1}–${Math.min(materialPage * 5, filtered.length)} dari ${filtered.length} materi`}
            </span>
          {materialPageCount > 1 && (
            <nav className="db-export-pagination" aria-label="Halaman materi terbaru">
              <button
                type="button"
                aria-label="Halaman materi sebelumnya"
                disabled={materialPage === 1}
                onClick={() => setMaterialPagination({ query: q, page: materialPage - 1 })}
              >
                <ChevronLeftIcon />
              </button>
              <span aria-live="polite" aria-atomic="true">{materialPage} / {materialPageCount}</span>
              <button
                type="button"
                aria-label="Halaman materi berikutnya"
                disabled={materialPage === materialPageCount}
                onClick={() => setMaterialPagination({ query: q, page: materialPage + 1 })}
              >
                <ChevronRightIcon />
              </button>
            </nav>
          )}
          </div>
        </section>
      )}

      {/* Riwayat Ekspor & Panel LMS Internal */}
      <div className="db-export-section">
        {/* Kolom Kiri: Riwayat Ekspor */}
        <section aria-label="Aktivitas ekspor terbaru">
          <div className="db-section-head">
            <div>
              <h2 className="db-section-title">Riwayat ekspor paket H5P</h2>
              <p className="db-section-subtitle">Daftar paket Course Presentation yang telah diunduh</p>
            </div>
          </div>
          <div className="db-section-search">
            <label htmlFor="db-export-search">Cari riwayat ekspor</label>
            <div className="db-search">
              <MagnifyingGlassIcon aria-hidden="true" />
              <input id="db-export-search" type="search" placeholder="Cari nama modul atau format paket…" value={exportQuery} onChange={(event) => { setExportQuery(event.target.value); setExportPage(1); }} />
            </div>
          </div>
          <div className="db-card db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Nama modul</th>
                  <th>Format paket</th>
                  <th>Waktu ekspor</th>
                </tr>
              </thead>
              <tbody>
                {visibleExports.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span className="db-table-title">{e.title}</span>
                    </td>
                    <td>
                      <span className="db-badge db-badge-green">
                        .{e.format.toUpperCase()} STANDAR
                      </span>
                    </td>
                    <td>
                      <span className="db-table-time">
                        <ClockIcon />
                        <span>{timeAgo(e.at)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExports.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12 }}>
                {exports.length === 0 ? 'Belum ada unduhan paket. Berkas H5P yang diekspor dari Studio akan tercatat di sini.' : 'Tidak ada riwayat ekspor yang cocok dengan pencarian.'}
              </p>
            )}
          </div>
          <div className="db-pagination-row">
            <span className="db-pagination-summary">
              {filteredExports.length === 0 ? '0 ekspor' : `${(exportPage - 1) * 5 + 1}–${Math.min(exportPage * 5, filteredExports.length)} dari ${filteredExports.length} ekspor`}
            </span>
          {exportPageCount > 1 && (
            <nav className="db-export-pagination" aria-label="Halaman riwayat ekspor">
              <button
                type="button"
                aria-label="Halaman riwayat sebelumnya"
                disabled={exportPage === 1}
                onClick={() => setExportPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeftIcon />
              </button>
              <span aria-live="polite" aria-atomic="true">{exportPage} / {exportPageCount}</span>
              <button
                type="button"
                aria-label="Halaman riwayat berikutnya"
                disabled={exportPage === exportPageCount}
                onClick={() => setExportPage((page) => Math.min(exportPageCount, page + 1))}
              >
                <ChevronRightIcon />
              </button>
            </nav>
          )}
          </div>
        </section>

      </div>

      <dialog ref={guideRef} className="db-guide-dialog" aria-labelledby="db-guide-title">
        <div className="db-guide-content">
          <h2 id="db-guide-title">Panduan penggunaan di LMS</h2>
          <p>Gunakan paket dari Studio pada LMS yang mendukung H5P.</p>
          <ol>
            <li>Ekspor materi dari Studio, lalu simpan berkas .h5p.</li>
            <li>Buka kursus tujuan di LMS dan pilih aktivitas atau konten H5P.</li>
            <li>Unggah berkas .h5p, simpan, lalu periksa materi melalui pratinjau LMS.</li>
          </ol>
          <p>Nama menu dapat berbeda pada setiap LMS. Hubungi administrator jika fitur H5P belum tersedia.</p>
          <form method="dialog"><button className="db-btn-primary">Mengerti</button></form>
        </div>
      </dialog>

      {/* Footer */}
      <footer className="db-footer">
        <span>H5P Content Generator · LMS Internal Workspace</span>
        <span>Standar Course Presentation v1.26 · Siap LMS Moodle & Canvas</span>
      </footer>
    </>
  );
}
