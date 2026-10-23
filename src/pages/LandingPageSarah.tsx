import { useState } from 'react';
import {
  ArrowRightIcon, CheckIcon, CheckCircledIcon, ChevronDownIcon,
  DownloadIcon, FileTextIcon, LayersIcon, PlayIcon, ReloadIcon,
  Pencil2Icon, UploadIcon,
} from '@radix-ui/react-icons';
import './LandingPageSarah.css';

type LandingPageProps = { onEnter: () => void };

const steps = [
  { icon: UploadIcon, title: 'Siapkan materi Anda', text: 'Unggah presentasi PPTX atau dokumen PDF. Anda juga dapat memulai dengan slide kosong.', tag: 'PPTX · PDF · Slide kosong' },
  { icon: Pencil2Icon, title: 'Tambahkan interaksi', text: 'Lengkapi slide dengan tombol, penjelasan, dan kuis agar peserta ikut terlibat.', tag: 'Edit di studio' },
  { icon: DownloadIcon, title: 'Unduh dan bagikan', text: 'Pratinjau hasilnya, lalu unduh paket .h5p untuk digunakan di LMS yang mendukung H5P.', tag: 'Ekspor .h5p' },
];

const faqs = [
  { q: 'Apa itu H5P Generator?', a: 'H5P Generator membantu Anda membuat materi pembelajaran interaktif dari slide atau dokumen. Hasilnya berupa paket .h5p yang dapat digunakan pada platform pembelajaran dengan dukungan H5P.' },
  { q: 'Apakah saya perlu bisa pemrograman?', a: 'Tidak. Anda dapat mengunggah materi, menyunting slide, dan menambahkan interaksi melalui studio. Mulai dari materi yang sudah Anda punya atau buat slide kosong.' },
  { q: 'File apa yang dapat saya gunakan?', a: 'Gunakan presentasi berformat .pptx atau dokumen .pdf untuk membuat materi baru. Paket .h5p yang sudah Anda unduh juga dapat dibuka kembali melalui halaman Materi Saya.' },
  { q: 'Di mana materi saya disimpan?', a: 'Draf materi disimpan di browser yang Anda gunakan. Gunakan perangkat dan browser yang sama untuk melanjutkan, dan unduh paket .h5p sebagai salinan sebelum membersihkan data browser.' },
  { q: 'Bagaimana cara menggunakan hasilnya di LMS?', a: 'Unduh paket .h5p dari studio, kemudian impor melalui fitur H5P di LMS Anda. Dukungan pemutaran dan pencatatan nilai mengikuti fitur serta konfigurasi LMS yang digunakan.' },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <div className="home-landing" id="top">
      <a className="home-skip" href="#konten">Lewati ke konten</a>
      <header className="home-header">
        <div className="home-container home-nav">
          <a className="home-brand" href="#top" aria-label="H5P Generator, beranda">
            <img src="/logo.png" alt="" />
            <span>H5P Generator<small>Ruang kreasi pembelajaran</small></span>
          </a>
          <nav aria-label="Navigasi beranda">
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#contoh">Contoh interaktif</a>
            <a href="#bantuan">Bantuan</a>
          </nav>
          <button className="home-button home-button-small" onClick={onEnter}>Buka studio <ArrowRightIcon /></button>
        </div>
      </header>

      <main id="konten">
        <section className="home-container home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <span className="home-eyebrow"><span /> DARI MATERI BIASA, JADI LEBIH BERMAKNA</span>
            <h1 id="home-title">Materi Anda.<br /><span>Lebih interaktif.</span><br />Lebih mudah dipahami.</h1>
            <p>Ubah presentasi dan dokumen menjadi pengalaman belajar yang melibatkan peserta. Tambahkan interaksi, buat kuis, lalu bagikan melalui LMS Anda.</p>
            <div className="home-hero-actions">
              <button className="home-button" onClick={onEnter}>Mulai buat materi <ArrowRightIcon /></button>
              <a className="home-button home-button-outline" href="#contoh"><PlayIcon /> Coba contohnya</a>
            </div>
            <div className="home-hero-notes"><span><CheckIcon /> Tanpa pemrograman</span><span><CheckIcon /> Mulai dari PPTX atau PDF</span></div>
          </div>

          <div className="home-preview" id="contoh">
            <div className="home-preview-top"><span className="home-preview-dots" aria-hidden="true"><i /><i /><i /></span><span>Pratinjau materi interaktif</span><span className="home-live">DEMO</span></div>
            <div className="home-demo">
              <div className="home-demo-meta"><span><LayersIcon /> KEAMANAN DIGITAL</span><span>01 / 01</span></div>
              <div className="home-demo-icon"><FileTextIcon /><span>?</span></div>
              <span className="home-demo-kicker">BELAJAR DARI SITUASI SEHARI-HARI</span>
              <h2>Kenali email mencurigakan.</h2>
              <p>Anda menerima email berisi tautan yang meminta kata sandi akun kerja. Apa yang sebaiknya dilakukan?</p>
              <div className="home-demo-answers" aria-label="Pilihan jawaban contoh kuis">
                {['Klik tautan dan masukkan kata sandi', 'Verifikasi pengirim melalui kanal resmi'].map((label, index) => (
                  <button key={label} className={answer === index ? 'selected' : ''} aria-pressed={answer === index} onClick={() => setAnswer(index)}><span>{index === 0 ? 'A' : 'B'}</span>{label}{answer === index && <CheckIcon />}</button>
                ))}
              </div>
              <div className="home-demo-feedback" aria-live="polite" aria-atomic="true">
                {answer === null ? <span><PlayIcon /> Pilih jawaban untuk mencoba interaksinya</span> : <div className={answer === 1 ? 'correct' : 'retry'}><strong>{answer === 1 ? 'Tepat! Selalu verifikasi terlebih dahulu.' : 'Coba lagi. Jangan bagikan kata sandi Anda.'}</strong><p>Hubungi pengirim melalui kanal resmi sebelum membuka tautan yang mencurigakan.</p><button onClick={() => setAnswer(null)}><ReloadIcon /> Ulangi contoh</button></div>}
              </div>
            </div>
            <div className="home-preview-bottom"><CheckCircledIcon /> Contoh tampilan peserta <span>Interaksi langsung, belajar lebih aktif</span></div>
          </div>
        </section>

        <div className="home-container home-capabilities" aria-label="Fitur utama">
          <span><FileTextIcon /> Gunakan materi yang sudah ada</span><span><Pencil2Icon /> Tambahkan kuis dan interaksi</span><span><DownloadIcon /> Ekspor ke format H5P</span>
        </div>

        <section className="home-container home-section" id="cara-kerja" aria-labelledby="steps-title">
          <div className="home-section-heading"><div><span className="home-eyebrow">ALUR YANG SEDERHANA</span><h2 id="steps-title">Dari file ke materi interaktif.<br />Cukup tiga langkah.</h2></div><p>Fokus pada isi pembelajaran Anda.<br />Susun pengalaman belajarnya di studio.</p></div>
          <ol className="home-steps">{steps.map(({ icon: Icon, title, text, tag }, index) => <li key={title}><div className="home-step-top"><span className="home-step-icon"><Icon /></span><span className="home-step-number">0{index + 1}</span></div><h3>{title}</h3><p>{text}</p><span className="home-step-tag">{tag}</span></li>)}</ol>
        </section>

        <section className="home-container home-help home-section" id="bantuan" aria-labelledby="help-title">
          <div><span className="home-eyebrow">SEBELUM MULAI</span><h2 id="help-title">Ada yang ingin<br />Anda ketahui?</h2><p>Kenali cara kerja dan siapkan materi pertama Anda.</p><button className="home-text-button" onClick={onEnter}>Saya siap, buka studio <ArrowRightIcon /></button></div>
          <div className="home-faq">{faqs.map(({ q, a }) => <details key={q}><summary>{q}<ChevronDownIcon /></summary><p>{a}</p></details>)}</div>
        </section>

        <section className="home-container home-cta" aria-labelledby="cta-title"><div><span className="home-eyebrow">MULAI DARI MATERI PERTAMA ANDA</span><h2 id="cta-title">Buat pembelajaran yang lebih hidup.</h2><p>Siapkan presentasi atau dokumen Anda, lalu lanjutkan ke studio.</p></div><button className="home-button" onClick={onEnter}>Mulai buat materi <ArrowRightIcon /></button></section>
      </main>
      <footer className="home-container home-footer"><a className="home-brand" href="#top"><img src="/logo.png" alt="" /><span>H5P Generator</span></a><p>Untuk pengajar, pemateri, dan tim pelatihan.</p><a href="#bantuan">Panduan & bantuan <ArrowRightIcon /></a></footer>
    </div>
  );
}
