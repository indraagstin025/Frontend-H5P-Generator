/**
 * Dashboard ruang kerja pemateri
 * Ringkasan materi, akses cepat, dan status LMS internal.
 */
import { useRef, useState } from 'react';
import {
  ArrowRightIcon,
  ClockIcon,
  FileTextIcon,
  LayersIcon,
  PlusIcon,
  ReaderIcon,
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

export function Dashboard({ items, onOpen, onGoMaterials, onCreate, query = '' }: DashboardProps) {
  const [exports] = useState(loadExportHistory);
  const create = onCreate ?? onGoMaterials;
  const recent = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? recent.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || (p.sourceFileName ?? '').toLowerCase().includes(q),
      )
    : recent.slice(0, 6);

  const guideRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      {/* Hero Welcome Banner: Solid Light Green, Tidak Transparan */}
      <section className="db-hero" aria-label="Selamat datang di ruang kerja">
        <div className="db-hero-left">
          <div className="db-pill">
            <span className="db-pulse-dot" />
            <span>RUANG KERJA PEMATERI · LMS INTERNAL READY</span>
          </div>
          <h2>Selamat datang di H5P Content Generator</h2>
          <p>
            Kelola, susun interaksi kuis, pratinjau langsung, dan unduh materi pembelajaran interaktif berstandar
            H5P Course Presentation untuk platform LMS internal Anda.
          </p>
          <div className="db-hero-actions">
            <button className="db-btn-primary" type="button" onClick={create}>
              <PlusIcon />
              <span>Buat materi baru</span>
            </button>
            <button className="db-btn-secondary" type="button" onClick={onGoMaterials}>
              <LayersIcon />
              <span>Buka materi saya</span>
            </button>
            <button className="db-btn-secondary" type="button" onClick={() => guideRef.current?.showModal()}>
              <ReaderIcon />
              <span>Panduan LMS</span>
            </button>
          </div>
        </div>

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
                {filtered.map((p) => {
                  const src = sourceOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="db-table-title">{p.title}</span>
                        {p.sourceFileName && (
                          <span className="db-table-sub">Berkas: {p.sourceFileName}</span>
                        )}
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
                {exports.slice(0, 5).map((e) => (
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
            {exports.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12 }}>
                Belum ada unduhan paket. Berkas H5P yang diekspor dari Studio akan tercatat di sini.
              </p>
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
