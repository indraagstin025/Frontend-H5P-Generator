import { CheckIcon, GearIcon, IdCardIcon, PersonIcon } from '@radix-ui/react-icons';

export function LandingRoles() {
  return (
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
            Cukup nyiapin file materi (.pptx/.pdf), lalu cek alur cerita dan kunci jawaban lewat mode coba-coba di
            browser sebelum dirilis.
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
            Ngatur pustaka H5P di LMS. Pastiin file <code>.h5p</code> bisa diupload tanpa error, dan nilainya masuk
            dengan benar.
          </p>
          <span className="edu-pillar-badge">
            <CheckIcon /> Versi cocok dengan LMS
          </span>
        </article>
      </div>
    </section>
  );
}
