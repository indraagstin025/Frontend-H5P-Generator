/**
 * Dashboard ruang kerja pemateri
 * Ringkasan materi, akses cepat, dan status LMS internal.
 */
import { useState } from 'react';
import {
  ArrowRightIcon,
  CheckCircledIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  LayersIcon,
  PlusIcon,
  ReaderIcon,
  TargetIcon,
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
  const totalSlides = items.reduce((acc, p) => acc + p.slideCount, 0);
  const totalQuizzes = items.reduce((acc, p) => acc + quizCountOf(p), 0);
  const recent = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? recent.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || (p.sourceFileName ?? '').toLowerCase().includes(q),
      )
    : recent.slice(0, 6);

  const stats = [
    {
      icon: LayersIcon,
      value: String(items.length),
      label: 'Total Materi',
      context: `${totalSlides} slide di ruang kerja`,
    },
    {
      icon: FileTextIcon,
      value: String(totalSlides),
      label: 'Total Slide',
      context: items.length > 0 ? `Rata-rata ${(totalSlides / items.length).toFixed(1)} slide/materi` : 'Belum ada slide',
    },
    {
      icon: TargetIcon,
      value: String(totalQuizzes),
      label: 'Elemen Kuis',
      context: 'Soal interaktif aktif',
    },
    {
      icon: DownloadIcon,
      value: String(exports.length),
      label: 'Paket Diekspor',
      context: 'Siap diunggah ke LMS',
    },
  ];

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
            <a className="db-btn-secondary" href="#db-lms">
              <ReaderIcon />
              <span>Panduan LMS</span>
            </a>
          </div>
        </div>

        {/* Hero Summary Flow Card: Menggantikan doodle kertas miring dengan ringkasan alur kerja profesional */}
        <div className="db-hero-flow-card" aria-label="Alur produksi modul">
          <div className="db-hfc-header">
            <div className="db-hfc-header-left">
              <span className="db-pulse-dot" />
              <strong>Alur produksi H5P</strong>
            </div>
            <span className="db-badge db-badge-green">Standar v1.26</span>
          </div>
          <div className="db-hfc-steps">
            <div className="db-hfc-step">
              <span className="db-hfc-step-num">1</span>
              <div className="db-hfc-step-text">
                <strong>Unggah dokumen atau mulai baru</strong>
                <span>Konversi instan slide PPTX / PDF atau buat materi interaktif dari nol.</span>
              </div>
            </div>
            <div className="db-hfc-step">
              <span className="db-hfc-step-num">2</span>
              <div className="db-hfc-step-text">
                <strong>Perkaya slide dan evaluasi kuis</strong>
                <span>Sisipkan pilihan ganda, benar/salah, teks interaktif, dan multimedia.</span>
              </div>
            </div>
            <div className="db-hfc-step">
              <span className="db-hfc-step-num">3</span>
              <div className="db-hfc-step-text">
                <strong>Ekspor paket .h5p</strong>
                <span>Unduh paket Course Presentation siap pakai untuk Moodle atau Canvas.</span>
              </div>
            </div>
          </div>
          <div className="db-hfc-footer">
            <CheckCircledIcon />
            <span>Penyimpanan lokal aman dan instan di peramban</span>
          </div>
        </div>
      </section>

      {/* Ringkasan Aktivitas (Stat Cards) */}
      <section aria-label="Ringkasan aktivitas">
        <div className="db-section-head">
          <div>
            <h2 className="db-section-title">Ringkasan aktivitas</h2>
            <p className="db-section-subtitle">Metrik modul ajar interaktif yang tersimpan di browser</p>
          </div>
        </div>
        <div className="db-stats">
          {stats.map(({ icon: Icon, value, label, context }) => (
            <article className="db-card db-stat" key={label}>
              <div className="db-stat-top">
                <span className="db-stat-label">{label}</span>
                <span className="db-icon-square" aria-hidden="true">
                  <Icon />
                </span>
              </div>
              <strong className="db-stat-number">{value}</strong>
              <span className="db-stat-context">{context}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Akses Cepat */}
      <section aria-label="Akses cepat">
        <div className="db-section-head">
          <div>
            <h2 className="db-section-title">Akses cepat</h2>
            <p className="db-section-subtitle">Pintasan navigasi untuk alur kerja pembuatan modul</p>
          </div>
        </div>
        <div className="db-quick">
          <article className="db-card db-action-card">
            <span className="db-icon-square" aria-hidden="true">
              <LayersIcon />
            </span>
            <h3>Materi saya</h3>
            <p>Kelola, cari, saring berdasarkan format, ganti judul, atau lanjutkan pengeditan modul Anda.</p>
            <button className="db-text-action" type="button" onClick={onGoMaterials}>
              <span>Buka koleksi materi</span>
              <ArrowRightIcon />
            </button>
          </article>

          <article className="db-card db-action-card featured">
            <span className="db-icon-square" aria-hidden="true">
              <PlusIcon />
            </span>
            <h3>Buat materi baru</h3>
            <p>Mulai dari berkas presentasi PPTX/PDF untuk konversi otomatis, atau mulai kanvas kosong.</p>
            <button className="db-btn-primary" type="button" onClick={create} style={{ marginTop: 'auto' }}>
              <PlusIcon />
              <span>Buat materi baru</span>
            </button>
          </article>

          <article className="db-card db-action-card">
            <span className="db-icon-square" aria-hidden="true">
              <ReaderIcon />
            </span>
            <h3>Panduan integrasi LMS</h3>
            <p>Petunjuk praktis cara mengimpor berkas Course Presentation .h5p ke dalam LMS Moodle atau Canvas.</p>
            <a className="db-text-action" href="#db-lms">
              <span>Buka panduan LMS</span>
              <ArrowRightIcon />
            </a>
          </article>
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
      <div className="db-cols">
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

        {/* Kolom Kanan: Panduan & Status LMS */}
        <div>
          <section id="db-lms" className="db-card db-panel lms" aria-label="Panduan LMS Internal">
            <div className="db-panel-head">
              <span className="db-icon-square" aria-hidden="true">
                <CheckCircledIcon />
              </span>
              <div>
                <h2>Kompatibilitas LMS internal</h2>
                <span className="db-badge db-badge-green" style={{ marginTop: 2 }}>
                  100% Standar H5P
                </span>
              </div>
            </div>
            <p>
              Paket <code>.h5p</code> Course Presentation hasil generator ini dapat langsung diimpor ke seluruh
              sistem LMS internal yang telah memiliki engine H5P aktif.
            </p>
            <div className="db-checklist">
              <div className="db-checklist-item">
                <CheckIcon />
                <span>Kompatibel penuh dengan Moodle 3.9+ & Canvas</span>
              </div>
              <div className="db-checklist-item">
                <CheckIcon />
                <span>Nilai kuis tersambung otomatis ke Gradebook LMS</span>
              </div>
              <div className="db-checklist-item">
                <CheckIcon />
                <span>Pemrosesan lokal peramban tanpa latensi server</span>
              </div>
            </div>
          </section>

          <section className="db-card db-panel steps" style={{ marginTop: 14 }} aria-label="Tahapan Pembuatan">
            <h2>Tahapan pembuatan modul</h2>
            <p>Empat langkah mudah menyusun materi pembelajaran aktif:</p>
            <div className="db-flow-chain">
              <span className="db-flow-item">1. Unggah file</span>
              <span className="db-flow-arrow">➔</span>
              <span className="db-flow-item">2. Susun kuis</span>
              <span className="db-flow-arrow">➔</span>
              <span className="db-flow-item">3. Uji pratinjau</span>
              <span className="db-flow-arrow">➔</span>
              <span className="db-flow-item">4. Unduh .h5p</span>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="db-footer">
        <span>H5P Content Generator · LMS Internal Workspace</span>
        <span>Standar Course Presentation v1.26 · Siap LMS Moodle & Canvas</span>
      </footer>
    </>
  );
}
