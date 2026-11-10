import {
  CheckCircledIcon,
  DesktopIcon,
  LapTimerIcon,
  LockClosedIcon,
  PlayIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { LandingMockup } from './LandingMockup';

interface LandingHeroProps {
  onEnter: () => void;
  onScrollToSection: (id: string) => void;
}

export function LandingHero({ onEnter, onScrollToSection }: LandingHeroProps) {
  return (
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

          <p className="edu-hero-desc">
            Mulai dari presentasi PPTX atau dokumen PDF. Tambahkan interaksi dan kuis, lalu unduh materi dalam
            format H5P untuk digunakan di LMS Anda.
          </p>

          <div className="edu-hero-actions">
            <button className="edu-btn-primary" type="button" onClick={onEnter}>
              <PlayIcon /> Mulai buat materi
            </button>
            <button
              className="edu-btn-secondary"
              type="button"
              onClick={() => onScrollToSection('simulasi-hero')}
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

        <LandingMockup onEnter={onEnter} />
      </div>
    </section>
  );
}
