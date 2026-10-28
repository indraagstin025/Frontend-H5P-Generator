import { CheckIcon, LockClosedIcon } from '@radix-ui/react-icons';

export function LandingWorkflow() {
  return (
    <section className="edu-section" id="alur-kerja">
      <div className="edu-section-head">
        <span className="edu-section-kicker">Alur Kerja Terpandu</span>
        <h2 className="edu-section-title">Dari dokumen ke pembelajaran interaktif</h2>
        <p className="edu-section-sub">Dipandu dari file mentah sampai file siap upload ke LMS:</p>
      </div>

      <div className="edu-steps-timeline">
        <div className="edu-step-card">
          <div className="edu-step-badge-row">
            <span className="edu-step-num-circle">1</span>
            <span className="edu-step-time-pill">~2 Menit</span>
          </div>
          <h4>Upload file</h4>
          <p>
            Tarik file <code>.pptx</code> atau <code>.pdf</code> (maks 50 MB, 60 slide). Semua slide otomatis kebaca jadi
            gambar latar.
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
            Jalankan pratinjau di browser buat mastiin tombolnya bener, kunci jawabannya pas, dan nilainya kehitung
            tepat.
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
            Semua proses — baca slide, ambil teks, sampai bikin file <code>.h5p</code> — jalan 100% di browser. Dokumen
            dan soal Anda tidak dikirim ke server luar mana pun.
          </p>
        </div>
        <div className="edu-security-tag">
          <CheckIcon /> 100% Client-Side Processing
        </div>
      </div>
    </section>
  );
}
