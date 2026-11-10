import { CheckCircledIcon, CheckIcon, Cross2Icon, CrossCircledIcon } from '@radix-ui/react-icons';

export function LandingComparison() {
  return (
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
                <strong>Dibaca sekilas doang:</strong> Peserta biasanya geser slide dengan cepat tanpa benar-benar paham
                isinya.
              </span>
            </li>
            <li>
              <CrossCircledIcon />
              <span>
                <strong>Tidak ketahuan paham atau tidak:</strong> Tidak ada data apakah peserta bisa mengambil
                keputusan yang benar.
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
                <strong>Susah buat bukti:</strong> Kalau ada masalah di lapangan, susah membuktikan peserta sudah paham
                materinya.
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
                <strong>Peserta ikut mikir:</strong> Di tiap pilihan, peserta harus memutuskan lalu langsung lihat
                akibatnya.
              </span>
            </li>
            <li>
              <CheckCircledIcon />
              <span>
                <strong>Ada kuis di tengah materi:</strong> Kuis disisipkan di bagian penting, langsung ada penjelasan
                benar/salahnya.
              </span>
            </li>
            <li>
              <CheckCircledIcon />
              <span>
                <strong>Cepat, di bawah 30 menit:</strong> File presentasi langsung dibaca otomatis. Gambar dan
                tampilannya tetap sama.
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
  );
}
