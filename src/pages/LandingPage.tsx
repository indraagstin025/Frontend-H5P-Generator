/**
 * Landing Page Khusus Pengajar & Tim Pelatihan LMS Internal Perusahaan (L&D / Corporate Training).
 * Berfokus pada kebutuhan nyata organisasi:
 * - Konversi dek materi pelatihan (.pptx) & SOP (.pdf) menjadi modul studi kasus bercabang.
 * - Uji kepatuhan & pemahaman kerja nyata (Active Recall & Evaluasi Formatif).
 * - Pemrosesan 100% lokal di browser (Kerahasiaan dokumen SOP & data rahasia perusahaan terjaga - NFR-03).
 * - Standar paket .h5p resmi untuk LMS Internal (Moodle, Canvas, Totara, Blackboard) + pelaporan xAPI.
 * - Menggunakan icon resmi @radix-ui/react-icons dan tema gradasi hijau logo.png.
 */
import { useState } from 'react';
import {
  ArrowRightIcon,
  BarChartIcon,
  BookmarkIcon,
  CheckCircledIcon,
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  CrossCircledIcon,
  DesktopIcon,
  GearIcon,
  IdCardIcon,
  LapTimerIcon,
  LayersIcon,
  LightningBoltIcon,
  LockClosedIcon,
  PersonIcon,
  PlayIcon,
  ReaderIcon,
  ResetIcon,
  TargetIcon,
} from '@radix-ui/react-icons';
import './LandingPage.css';

type LandingPageProps = {
  onEnter: () => void;
};

type MockupTab = 'employee' | 'trainer' | 'lms';
type ScenarioStep = 'dilemma' | 'pathA' | 'pathB' | 'quiz';

const FAQ_ENTERPRISE = [
  {
    q: 'Apakah file H5P ini bisa langsung diupload ke LMS (Moodle, Canvas, Totara)?',
    a: 'Bisa. File .h5p yang dihasilkan sudah standar, jadi tinggal upload ke aktivitas pembelajaran di LMS tanpa plugin tambahan.',
  },
  {
    q: 'Bagaimana nilai peserta tercatat di LMS?',
    a: 'Otomatis. Saat peserta menyelesaikan modul dan kuis, nilai dan status selesainya langsung tercatat di LMS.',
  },
  {
    q: 'Apakah file materi rahasia aman?',
    a: 'Aman. Semua proses — baca file, ambil gambar, sampai bikin paket .h5p — jalan di browser Anda. Tidak ada data yang dikirim ke server luar.',
  },
  {
    q: 'Apakah harus bisa programming?',
    a: 'Tidak perlu. Cukup siapkan file materi (.pptx/.pdf) seperti biasa. Nambah tombol, tulisan, suara, dan kuis semuanya tinggal klik.',
  },
  {
    q: 'Apakah tampilan slide berubah?',
    a: 'Tidak. Setiap halaman dijadikan gambar latar, jadi font, gambar, dan tabelnya tetap sama persis kayak file aslinya.',
  },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const [mockupTab, setMockupTab] = useState<MockupTab>('employee');
  const [scenarioStep, setScenarioStep] = useState<ScenarioStep>('dilemma');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);


  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="edu-landing">
      {/* ── Header Navigasi LMS Internal ── */}
      <header className="edu-nav">
        <div className="edu-nav-inner">
          <a href="#top" className="edu-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo.png" alt="H5P Generator" className="edu-brand-logo-img" />
            <div className="edu-brand-text">
              <span className="edu-brand-title">H5P Generator</span>
              <span className="edu-brand-sub">
                Ruang kreasi pembelajaran interaktif
              </span>
            </div>
          </a>

          <nav className="edu-nav-links" aria-label="Navigasi beranda">
            <a className="edu-nav-link" href="#alur-kerja">Cara kerja</a>
            <a className="edu-nav-link" href="#pilar">Fitur</a>
            <a className="edu-nav-link" href="#simulasi-hero">Contoh interaktif</a>
            <a className="edu-nav-link" href="#faq">Bantuan</a>
          </nav>

          <div className="edu-nav-actions">
            <span className="edu-badge-academic">
              <IdCardIcon /> Portal Pemateri Internal
            </span>
            <button className="edu-btn-primary" type="button" onClick={onEnter}>
              <PlayIcon /> Buka studio <ArrowRightIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section: Khusus LMS Internal Perusahaan ── */}
      <section className="edu-hero" id="top">
        <div className="edu-hero-grid">
          <div className="edu-hero-content">
            <div className="edu-tag-kicker">
              <ReaderIcon /> UNTUK PENGAJAR & TIM PELATIHAN
            </div>

            <h1 className="edu-hero-title">
              Materi Anda, jadi lebih{' '}
              <span className="edu-title-gradient">interaktif dan mudah dipahami.</span>
            </h1>

            <p className="edu-hero-desc">Mulai dari presentasi PPTX atau dokumen PDF. Tambahkan interaksi dan kuis, lalu unduh materi dalam format H5P untuk digunakan di LMS Anda.</p>

            <div className="edu-hero-actions">
              <button className="edu-btn-primary" type="button" onClick={onEnter}>
                <PlayIcon /> Mulai buat materi
              </button>
              <button
                className="edu-btn-secondary"
                type="button"
                onClick={() => scrollToSection('simulasi-hero')}
              >
                <DesktopIcon /> Coba contoh interaktif
              </button>
            </div>

            <div className="edu-trust-pills">
              <div className="edu-trust-item">
                <span className="edu-trust-icon">
                  <LapTimerIcon />
                </span>
                <span>Mulai dari materi yang sudah Anda miliki.</span>
              </div>
              <div className="edu-trust-item">
                <span className="edu-trust-icon">
                  <LockClosedIcon />
                </span>
                <span>File rahasia aman: semuanya diproses di browser, tidak dikirim ke server luar.</span>
              </div>
              <div className="edu-trust-item">
                <span className="edu-trust-icon">
                  <CheckCircledIcon />
                </span>
                <span>Ekspor paket .h5p untuk LMS yang mendukung H5P.</span>
              </div>
            </div>
          </div>

          {/* ── Interactive Live Educational Mockup ── */}
          <div className="edu-mockup-wrapper" id="simulasi-hero">
            <div className="edu-mockup-window">
              <div className="edu-window-header">
                <div className="edu-window-controls">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="edu-window-tabs">
                  <button
                    type="button"
                    className={`edu-mockup-tab-btn ${mockupTab === 'employee' ? 'active' : ''}`}
                    onClick={() => setMockupTab('employee')}
                  >
                    <PersonIcon /> Peserta
                  </button>
                  <button
                    type="button"
                    className={`edu-mockup-tab-btn ${mockupTab === 'trainer' ? 'active' : ''}`}
                    onClick={() => setMockupTab('trainer')}
                  >
                    <GearIcon /> Studio
                  </button>
                  <button
                    type="button"
                    className={`edu-mockup-tab-btn ${mockupTab === 'lms' ? 'active' : ''}`}
                    onClick={() => setMockupTab('lms')}
                  >
                    <BarChartIcon /> Rekap Nilai LMS
                  </button>
                </div>
              </div>

              <div className="edu-window-stage">
                {mockupTab === 'employee' && (
                  <div className="edu-slide-frame">
                    <div className="edu-slide-grid-overlay"></div>

                    <div className="edu-slide-top-bar">
                      <span className="edu-slide-module-kicker">
                        <BookmarkIcon /> Modul K3: Tanggap Darurat Gas Bertekanan Tinggi
                      </span>
                      <span className="edu-slide-num-pill">
                        {scenarioStep === 'dilemma' && 'Slide 02 / 14 · Kasus Anomali'}
                        {scenarioStep === 'pathA' && 'Slide 04 / 14 · SOP Isolasi'}
                        {scenarioStep === 'pathB' && 'Slide 06 / 14 · Pelanggaran SOP'}
                        {scenarioStep === 'quiz' && 'Slide 08 / 14 · Uji Kepatuhan K3'}
                      </span>
                    </div>

                    <div className="edu-slide-main-content">
                      {scenarioStep === 'dilemma' && (
                        <>
                          <h2 className="edu-scenario-title">Kasus Lapangan: Lonjakan Tekanan Gas Melebihi 15 Bar</h2>
                          <p className="edu-scenario-prompt">
                            Pukul 22.30 WIB, indikator pipa distribusi Unit B berkedip merah dan katup otomatis tidak merespons.
                            Sebagai Pengawas Shift Operasional, instruksi pertama apa yang Anda ambil sesuai SOP K3?
                          </p>
                          <div className="edu-hotspot-choices">
                            <button
                              type="button"
                              className="edu-hotspot-btn"
                              onClick={() => setScenarioStep('pathA')}
                            >
                              <ArrowRightIcon /> Pilihan A: Eksekusi Valve Isolasi Manual & Sirine Shift
                            </button>
                            <button
                              type="button"
                              className="edu-hotspot-btn ghost-btn"
                              onClick={() => setScenarioStep('pathB')}
                            >
                              <ArrowRightIcon /> Pilihan B: Tunggu Tim Pemeliharaan Tanpa Menekan Alarm
                            </button>
                          </div>
                        </>
                      )}

                      {scenarioStep === 'pathA' && (
                        <>
                          <h2 className="edu-scenario-title">Keputusan Tepat: Area Kerja Berhasil Diamankan</h2>
                          <p className="edu-scenario-prompt">
                            Isolasi manual berhasil menurunkan tekanan dalam 90 detik. Seluruh personel shift berkumpul di
                            titik kumpul (Assembly Point) dengan aman. (+20 Poin Kepatuhan K3 Organisasi)
                          </p>
                          <div className="edu-hotspot-choices">
                            <button
                              type="button"
                              className="edu-hotspot-btn"
                              onClick={() => setScenarioStep('quiz')}
                            >
                              <CheckCircledIcon /> Lanjut ke Checkpoint Soal Kepatuhan
                            </button>
                            <button
                              type="button"
                              className="edu-hotspot-btn ghost-btn"
                              onClick={() => setScenarioStep('dilemma')}
                            >
                              <ResetIcon /> Ulangi Skenario
                            </button>
                          </div>
                        </>
                      )}

                      {scenarioStep === 'pathB' && (
                        <>
                          <h2 className="edu-scenario-title">Konsekuensi Bahaya: Kebocoran Gas Terjadi</h2>
                          <p className="edu-scenario-prompt">
                            Menunda evakuasi menyebabkan akumulasi gas berbahaya di ruang kompresor.
                            Insiden ini melanggar SOP Keselamatan Kerja Bab 4 dan berpotensi memicu sanksi audit internal.
                          </p>
                          <div className="edu-hotspot-choices">
                            <button
                              type="button"
                              className="edu-hotspot-btn"
                              onClick={() => setScenarioStep('dilemma')}
                            >
                              <ResetIcon /> Tinjau Ulang & Pilih Jalur SOP Benar
                            </button>
                            <button
                              type="button"
                              className="edu-hotspot-btn ghost-btn"
                              onClick={() => setScenarioStep('quiz')}
                            >
                              Lanjut ke Kuis Evaluasi
                            </button>
                          </div>
                        </>
                      )}

                      {scenarioStep === 'quiz' && (
                        <>
                          <h2 className="edu-scenario-title">Uji Kepatuhan K3: Batas Waktu Pelaporan Insiden</h2>
                          <p className="edu-scenario-prompt">
                            Berapa batas waktu maksimal pelaporan berita acara insiden K3 ke Tim HSE Perusahaan?
                          </p>
                          <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                            {[
                              { id: 0, text: 'A. Maksimal 1 jam pasca kejadian darurat terkendali', correct: true },
                              { id: 1, text: 'B. Cukup dilaporkan saat rapat bulanan divisi', correct: false },
                              { id: 2, text: 'C. Setelah investigasi audit 14 hari selesai', correct: false },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                style={{
                                  padding: '7px 12px',
                                  textAlign: 'left',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.4)',
                                  background:
                                    quizAnswer === opt.id
                                      ? opt.correct
                                        ? '#22c55e'
                                        : '#ef4444'
                                      : 'rgba(255,255,255,0.12)',
                                  color: '#fff',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                onClick={() => setQuizAnswer(opt.id)}
                              >
                                {opt.text} {quizAnswer === opt.id && (opt.correct ? '✓ Benar (Sesuai SOP)' : '✗ Salah (Melanggar Regulasi)')}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="edu-slide-footer">
                      <span className="edu-interactive-badge">
                        <LightningBoltIcon /> Navigasi Terkunci (Active Surface Mode)
                      </span>
                      <span>Skor Kepatuhan Karyawan: {quizAnswer === 0 ? '100% (Lulus K3)' : '80% (Memenuhi Syarat)'}</span>
                    </div>
                  </div>
                )}

                {mockupTab === 'trainer' && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'grid',
                      gap: '14px',
                      color: 'var(--ink)',
                      fontSize: '12px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--green-deep)' }}>
                        Studio Pemateri: Konfigurasi Skenario Slide 2
                      </strong>
                      <span className="edu-badge-academic">
                        <LockClosedIcon /> Active Surface: Kunci Tombol Maju/Mundur
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '11px', display: 'block' }}>Hotspot Keputusan A:</span>
                        <strong>Target: Slide 4 (Konsekuensi Prosedural)</strong>
                        <div style={{ fontSize: '10px', color: 'var(--green)' }}>Label: “Eksekusi Valve Darurat”</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '11px', display: 'block' }}>Hotspot Keputusan B:</span>
                        <strong>Target: Slide 6 (Skenario Dampak Kelalaian)</strong>
                        <div style={{ fontSize: '10px', color: 'var(--green)' }}>Label: “Tunggu Tim Pemeliharaan”</div>
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#f8faf7', borderRadius: '6px', border: '1px dashed var(--line)' }}>
                      <span style={{ color: 'var(--muted)' }}>Narasi Penjelasan Suara SME (H5P.Audio): </span>
                      <strong>instruksi_hse_manager_sop_gas.mp3</strong> (0:38 mnt)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Kompilasi Paket: Sesuai Standar LMS Internal Organisasi</span>
                      <button className="edu-btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }} onClick={onEnter}>
                        Buka Proyek Ini di Studio
                      </button>
                    </div>
                  </div>
                )}

                {mockupTab === 'lms' && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'grid',
                      gap: '12px',
                      color: 'var(--ink)',
                      fontSize: '12px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>Buku Nilai LMS Internal (Moodle / Canvas Enterprise)</strong>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>xAPI Statements: Terverifikasi</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Karyawan Divisi:</span>
                        <strong style={{ fontSize: '16px', display: 'block' }}>412 / 420 Selesai</strong>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Rata-rata Skor K3:</span>
                        <strong style={{ fontSize: '16px', display: 'block', color: 'var(--green)' }}>94.6%</strong>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Status Kelulusan:</span>
                        <strong style={{ fontSize: '16px', display: 'block' }}>98.1% Lulus</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                      Setiap keputusan dan jawaban karyawan memancarkan data xAPI standar:{' '}
                      <code>experienced</code>, <code>interacted</code>, <code>answered</code>, dan{' '}
                      <code>completed</code>. Memenuhi persyaratan bukti kepatuhan sertifikasi ISO & audit internal perusahaan.
                    </div>
                  </div>
                )}
              </div>

              <div className="edu-window-subbar">
                <span className="edu-sync-indicator">
                  <span className="edu-sync-dot"></span> Paket H5P Standar (Course Presentation v1.24/1.25)
                </span>
                <span>Kompatibel 100% LMS Internal Organisasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tantangan Pelatihan Karyawan Konvensional vs H5P Generator ── */}
      <section className="edu-section" id="perbandingan">
        <div className="edu-section-head">
          <span className="edu-section-kicker">Evaluasi Pelatihan Internal</span>
          <h2 className="edu-section-title">Kenapa file biasa kurang cukup</h2>
          <p className="edu-section-sub">
            Kalau slide biasa langsung diupload ke LMS, peserta biasanya cuma klik next-next tanpa paham isinya:
          </p>
        </div>

        <div className="edu-contrast-grid">
          <div className="edu-contrast-card bad">
            <div className="edu-contrast-header">
              <div className="edu-contrast-icon">
                <Cross2Icon />
              </div>
              <h3 className="edu-contrast-title">Materi biasa (PDF / PPTX langsung upload)</h3>
            </div>
            <ul className="edu-contrast-list">
              <li>
                <CrossCircledIcon />
                <span>
                  <strong>Dibaca sekilas doang:</strong> Peserta biasanya geser slide dengan cepat tanpa benar-benar paham isinya.
                </span>
              </li>
              <li>
                <CrossCircledIcon />
                <span>
                  <strong>Tidak ketahuan paham atau tidak:</strong> Tidak ada data apakah peserta bisa mengambil keputusan yang benar.
                </span>
              </li>
              <li>
                <CrossCircledIcon />
                <span>
                  <strong>Bikin manual lama banget:</strong> Nyusun modul satu per satu di LMS bisa makan 4–6 jam kerja.
                </span>
              </li>
              <li>
                <CrossCircledIcon />
                <span>
                  <strong>Susah buat bukti:</strong> Kalau ada masalah di lapangan, susah membuktikan peserta sudah paham materinya.
                </span>
              </li>
            </ul>
          </div>

          <div className="edu-contrast-card good">
            <div className="edu-contrast-header">
              <div className="edu-contrast-icon">
                <CheckIcon />
              </div>
              <h3 className="edu-contrast-title">Modul interaktif dari generator ini</h3>
            </div>
            <ul className="edu-contrast-list">
              <li>
                <CheckCircledIcon />
                <span>
                  <strong>Peserta ikut mikir:</strong> Di tiap pilihan, peserta harus memutuskan lalu langsung lihat akibatnya.
                </span>
              </li>
              <li>
                <CheckCircledIcon />
                <span>
                  <strong>Ada kuis di tengah materi:</strong> Kuis disisipkan di bagian penting, langsung ada penjelasan benar/salahnya.
                </span>
              </li>
              <li>
                <CheckCircledIcon />
                <span>
                  <strong>Cepat, di bawah 30 menit:</strong> File presentasi langsung dibaca otomatis. Gambar dan tampilannya tetap sama.
                </span>
              </li>
              <li>
                <CheckCircledIcon />
                <span>
                  <strong>Nilai otomatis masuk LMS:</strong> Nilai dan status selesai tercatat sendiri di LMS.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4 Fitur Kunci Pelatihan Interaktif ── */}
      <section className="edu-section" id="pilar">
        <div className="edu-section-head">
          <span className="edu-section-kicker">FITUR PEMBELAJARAN</span>
          <h2 className="edu-section-title">Semua yang Anda butuhkan untuk membuat materi</h2>
          <p className="edu-section-sub">
            Semua yang dibutuhkan biar materi biasa jadi modul yang seru dikerjakan:
          </p>
        </div>

        <div className="edu-pillars-grid">
          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <TargetIcon />
            </div>
            <h3>Cerita bercabang</h3>
            <p>
              Pakai tombol pindah slide buat bikin alur pilihan. Peserta latihan mikir sebelum ketemu situasi aslinya.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Bisa kunci tombol next/back
            </span>
          </article>

          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <LightningBoltIcon />
            </div>
            <h3>Kuis di sela materi</h3>
            <p>
              Sisipkan kuis pilihan ganda, benar/salah, dan isian tepat di slide yang penting. Lengkap dengan penjelasan benar/salahnya.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Bisa tampil langsung atau pop-up
            </span>
          </article>

          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <LayersIcon />
            </div>
            <h3>Tampilan slide tetap sama</h3>
            <p>
              Slide PowerPoint dijadikan gambar latar beresolusi tinggi (16:9 atau 4:3). Diagram dan tata letaknya tidak berantakan.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Sama persis kayak file asli
            </span>
          </article>

          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <BarChartIcon />
            </div>
            <h3>Cocok buat LMS</h3>
            <p>
              File <code>.h5p</code> standar, bisa langsung diupload ke LMS (Moodle, Canvas, Totara). Nilai peserta ikut terkirim.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Siap diaudit & dilaporkan
            </span>
          </article>
        </div>
      </section>

      {/* ── 3 Profil Pengguna Internal Perusahaan (URD §2) ── */}
      <section className="edu-section" id="peran">
        <div className="edu-section-head">
          <span className="edu-section-kicker">Kolaborasi Lintas Peran Organisasi</span>
          <h2 className="edu-section-title">Buat tiga peran ini</h2>
          <p className="edu-section-sub">
            Dari ngumpulin materi sampai tayang di LMS, semua kebagian gampang:
          </p>
        </div>

        <div className="edu-pillars-grid">
          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <PersonIcon />
            </div>
            <h3>Pembuat materi</h3>
            <p>
              Mengubah file presentasi mentah jadi modul interaktif. Ngatur tombol pindahan, suara, dan susunan kuis.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Editor visual, tinggal klik
            </span>
          </article>

          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <IdCardIcon />
            </div>
            <h3>Pemateri / ahli materi</h3>
            <p>
              Cukup nyiapin file materi (.pptx/.pdf), lalu cek alur cerita dan kunci jawaban lewat mode coba-coba di browser sebelum dirilis.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Coba sendiri di browser
            </span>
          </article>

          <article className="edu-pillar-card">
            <div className="edu-pillar-icon-box">
              <GearIcon />
            </div>
            <h3>Admin LMS</h3>
            <p>
              Ngatur pustaka H5P di LMS. Pastiin file <code>.h5p</code> bisa diupload tanpa error, dan nilainya masuk dengan benar.
            </p>
            <span className="edu-pillar-badge">
              <CheckIcon /> Versi cocok dengan LMS
            </span>
          </article>
        </div>
      </section>

{/* ── Alur Kerja 5 Tahap Pengajar / L&D ── */}
      <section className="edu-section" id="alur-kerja">
        <div className="edu-section-head">
          <span className="edu-section-kicker">Alur Kerja Terpandu</span>
          <h2 className="edu-section-title">Dari dokumen ke pembelajaran interaktif</h2>
          <p className="edu-section-sub">
            Dipandu dari file mentah sampai file siap upload ke LMS:
          </p>
        </div>

        <div className="edu-steps-timeline">
          <div className="edu-step-card">
            <div className="edu-step-badge-row">
              <span className="edu-step-num-circle">1</span>
              <span className="edu-step-time-pill">~2 Menit</span>
            </div>
            <h4>Upload file</h4>
            <p>
              Tarik file <code>.pptx</code> atau <code>.pdf</code> (maks 50 MB, 60 slide). Semua slide otomatis kebaca jadi gambar latar.
            </p>
          </div>

          <div className="edu-step-card">
            <div className="edu-step-badge-row">
              <span className="edu-step-num-circle">2</span>
              <span className="edu-step-time-pill">~5 Menit</span>
            </div>
            <h4>Susun urutan</h4>
            <p>
              Atur urutan slide dan babnya. Bisa juga kunci tombol next/back biar peserta wajib klik tombol pilihan.
            </p>
          </div>

          <div className="edu-step-card">
            <div className="edu-step-badge-row">
              <span className="edu-step-num-circle">3</span>
              <span className="edu-step-time-pill">~12 Menit</span>
            </div>
            <h4>Tambah tombol & kuis</h4>
            <p>
              Pasang tombol pindah slide buat cabang cerita, tambah tulisan dan suara, plus kuis pilihan ganda atau isian.
            </p>
          </div>

          <div className="edu-step-card">
            <div className="edu-step-badge-row">
              <span className="edu-step-num-circle">4</span>
              <span className="edu-step-time-pill">~3 Menit</span>
            </div>
            <h4>Coba mainkan</h4>
            <p>
              Jalankan pratinjau di browser buat mastiin tombolnya bener, kunci jawabannya pas, dan nilainya kehitung tepat.
            </p>
          </div>

          <div className="edu-step-card">
            <div className="edu-step-badge-row">
              <span className="edu-step-num-circle">5</span>
              <span className="edu-step-time-pill">~1 Menit</span>
            </div>
            <h4>Download & pasang di LMS</h4>
            <p>
              File <code>.h5p</code> langsung jadi dan bisa diupload ke kursus di Moodle atau Canvas.
            </p>
          </div>
        </div>

        {/* ── Banner Keamanan Dokumen Rahasia Perusahaan (NFR-03) ── */}
        <div className="edu-security-banner">
          <div className="edu-security-icon-circle">
            <LockClosedIcon />
          </div>
          <div className="edu-security-text">
            <h3>File rahasia tetap aman</h3>
            <p>
              Semua proses — baca slide, ambil teks, sampai bikin file <code>.h5p</code> — jalan 100% di browser.
              Dokumen dan soal Anda tidak dikirim ke server luar mana pun.
            </p>
          </div>
          <div className="edu-security-tag">
            <CheckIcon /> 100% Client-Side Processing
          </div>
        </div>
      </section>

      {/* ── FAQ LMS Internal Perusahaan ── */}
      <section className="edu-section" id="faq">
        <div className="edu-section-head">
          <span className="edu-section-kicker">BUTUH BANTUAN?</span>
          <h2 className="edu-section-title">Pertanyaan yang sering ditanya</h2>
          <p className="edu-section-sub">
            Hal-hal teknis soal masukin file H5P ke LMS:
          </p>
        </div>

        <div className="edu-faq-list">
          {FAQ_ENTERPRISE.map((item, idx) => (
            <div className={`edu-faq-item ${openFaq === idx ? 'open' : ''}`} key={idx}>
              <button
                type="button"
                className="edu-faq-question" aria-expanded={openFaq === idx} aria-controls={`landing-faq-${idx}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <ChevronDownIcon />
              </button>
              {openFaq === idx && <div className="edu-faq-answer" id={`landing-faq-${idx}`}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Banner Aksi Final ── */}
      <section className="edu-cta-band">
        <div className="edu-cta-content">
          <span className="edu-cta-kicker">Mulai sekarang</span>
          <h2 className="edu-cta-title">Bikin modul interaktif pertamamu hari ini</h2>
          <p className="edu-cta-desc">
            Buka studio, pilih file presentasi atau dokumenmu, dan jadiin modul interaktif dalam hitungan menit.
          </p>
        </div>
        <div className="edu-cta-actions">
          <button className="edu-btn-primary" type="button" onClick={onEnter}>
            <PlayIcon /> Buka studio sekarang
          </button>
        </div>
      </section>

      {/* ── Academic / Corporate Footer ── */}
      <footer className="edu-footer">
        <div className="edu-footer-left">
          <img src="/logo.png" alt="H5P Generator" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, color: 'var(--green-deep)' }}>H5P Generator</span>
          <span>·</span>
          <span>Standar H5P Course Presentation</span>
        </div>
        <div className="edu-footer-right">
          <span>Nilai otomatis masuk LMS</span>
          <span>·</span>
          <span>Buat LMS internal</span>
        </div>
      </footer>
    </div>
  );
}



