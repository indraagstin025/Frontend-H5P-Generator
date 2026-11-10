import { BarChartIcon, CheckIcon, LayersIcon, LightningBoltIcon, TargetIcon } from '@radix-ui/react-icons';

export function LandingFeatures() {
  return (
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
            Sisipkan kuis pilihan ganda, benar/salah, dan isian tepat di slide yang penting. Lengkap dengan penjelasan
            benar/salahnya.
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
            Slide PowerPoint dijadikan gambar latar beresolusi tinggi (16:9 atau 4:3). Diagram dan tata letaknya tidak
            berantakan.
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
            File <code>.h5p</code> standar, bisa langsung diupload ke LMS (Moodle, Canvas, Totara). Nilai peserta ikut
            terkirim.
          </p>
          <span className="edu-pillar-badge">
            <CheckIcon /> Siap diaudit & dilaporkan
          </span>
        </article>
      </div>
    </section>
  );
}
