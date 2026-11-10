import { useEffect, useRef, type PointerEvent } from 'react';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import './LandingPage.css';
import { FeatureIllustration } from './FeatureIllustration';
import { LearningIllustration } from './LearningIllustration';

type LandingPageProps = { onEnter: () => void };

export function LandingPage({ onEnter }: LandingPageProps) {
  const ornamentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ornaments = ornamentsRef.current?.querySelectorAll<HTMLElement>('.landing-square');
    if (!ornaments) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    let stopped = false;

    function startMotion() {
      stopped = false;
      if (reducedMotion.matches) return;
      ornaments?.forEach((ornament) => {
        let x = 0;
        let y = 0;
        let angle = 0;
        function move() {
          if (stopped) return;
          const nextX = Math.random() * 80 - 40;
          const nextY = Math.random() * 64 - 32;
          const nextAngle = Math.random() * 18 - 9;
          const animation = ornament.animate([
            { translate: `${x}px ${y}px`, rotate: `${angle}deg` },
            { translate: `${nextX}px ${nextY}px`, rotate: `${nextAngle}deg` },
          ], { duration: 3500 + Math.random() * 1500, easing: 'ease-in-out' });
          animations.add(animation);
          animation.onfinish = () => {
            animations.delete(animation);
            x = nextX;
            y = nextY;
            angle = nextAngle;
            move();
          };
        }
        move();
      });
    }

    function stopMotion() {
      stopped = true;
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    }
    function updateMotion() {
      stopMotion();
      startMotion();
    }
    startMotion();
    reducedMotion.addEventListener('change', updateMotion);
    return () => {
      stopMotion();
      reducedMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  function moveOrnaments(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = event.currentTarget;
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--ornament-x', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 40}px`);
    hero.style.setProperty('--ornament-y', `${((event.clientY - bounds.top) / bounds.height - 0.5) * 30}px`);
  }

  function resetOrnaments(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty('--ornament-x', '0px');
    event.currentTarget.style.setProperty('--ornament-y', '0px');
  }

  return (
    <div className="edu-landing landing-page">
      <main>
        <div className="landing-main" onPointerMove={moveOrnaments} onPointerLeave={resetOrnaments} onPointerCancel={resetOrnaments}>
          <div className="landing-hero-brand-row">
            <a className="landing-hero-brand" href="/" aria-label="H5P Generator, beranda">
              <span className="landing-hero-logo"><img src="/landing-logo.png" alt="" /></span>
              <span className="landing-hero-brand-text"><strong>H5P Generator</strong><span>Ruang kreasi pembelajaran</span></span>
            </a>
          </div>
          <div ref={ornamentsRef} className="landing-square-ornaments" aria-hidden="true">
            <span className="landing-square landing-square-edge-left landing-shape-circle" />
            <span className="landing-square landing-square-edge-right" />
            <span className="landing-square landing-square-one" />
            <span className="landing-square landing-square-two landing-shape-circle" />
            <span className="landing-square landing-square-three" />
            <span className="landing-square landing-square-four landing-shape-triangle" />
            <span className="landing-square landing-square-six landing-shape-circle" />
            <span className="landing-square landing-square-eight landing-shape-triangle" />
            <span className="landing-square landing-square-ten landing-shape-circle" />
          </div>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-copy">
            <span className="landing-kicker">Ruang Kreasi Pembelajaran Digital</span>
            <h1 id="landing-title">Hadirkan pembelajaran<br />yang lebih <span>interaktif.</span></h1>
            <p>Kreasikan materi Anda menjadi pengalaman belajar yang interaktif. Tambahkan kuis, lalu ekspor ke H5P untuk LMS Anda.</p>
            <button className="landing-start" type="button" onClick={onEnter}>Mulai buat materi <ArrowRightIcon width={20} height={20} /></button>
            <span className="landing-signin-note">Login untuk mulai berkreasi</span>
          </div>
          <aside className="landing-visual" aria-label="Materi pembelajaran H5P">
            <span className="landing-visual-label">KREASIKAN PEMBELAJARAN ANDA</span>
            <LearningIllustration />
            <div className="landing-visual-caption"><h2>Dari ide Anda,<br />jadi pengalaman belajar.</h2><p>Susun. Kreasikan. Bagikan.</p></div>
          </aside>
        </section>
          <svg className="landing-section-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M0 28C240 38 410 107 720 69S1190 9 1440 24V120H0Z" fill="#7ab780" />
            <path d="M0 47C280 34 455 113 760 81S1170 25 1440 35V120H0Z" fill="#c8e2cc" />
            <path d="M0 57C250 43 490 125 790 99S1220 82 1440 58V120H0Z" fill="#f8faf9" />
          </svg>
        </div>
        <section className="landing-features" aria-labelledby="landing-features-title">
          <ul className="landing-feature-list">
            <li className="landing-feature-card">
              <FeatureIllustration variant="editing" />
              <span className="landing-feature-number" aria-hidden="true">01</span>
              <h3>Editing File H5P</h3>
              <p>Buka kembali materi H5P yang didukung, perbarui isi dan interaksinya di Studio, lalu ekspor hasil pengeditan Anda.</p>
              <span className="landing-feature-note">Lanjutkan dan sempurnakan materi</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="convert" />
              <span className="landing-feature-number" aria-hidden="true">02</span>
              <h3>Convert PPTX dan PDF ke H5P</h3>
              <p>Mulai dari presentasi atau dokumen Anda. Ubah menjadi slide pembelajaran, tambahkan interaksi, lalu unduh sebagai paket H5P.</p>
              <span className="landing-feature-note">Gunakan materi yang sudah Anda miliki</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="game" />
              <span className="landing-feature-number" aria-hidden="true">03</span>
              <h3>Berbasis Gamifikasi</h3>
              <p>Ajak peserta belajar lebih aktif melalui kuis, pilihan alur, dan umpan balik. Jadikan materi sebagai tantangan yang menarik untuk diselesaikan.</p>
              <span className="landing-feature-note">Belajar melalui interaksi dan tantangan</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="customization" />
              <span className="landing-feature-number" aria-hidden="true">04</span>
              <h3>Customization</h3>
              <p>Sesuaikan teks, gambar, tata letak, dan interaksi agar materi mengikuti kebutuhan serta gaya pembelajaran Anda.</p>
              <span className="landing-feature-note">Kreasikan materi sesuai kebutuhan</span>
            </li>
          </ul>
          <div className="landing-features-heading">
            <span className="landing-features-eyebrow">FITUR PEMBELAJARAN</span>
            <h2 id="landing-features-title">Satu tempat untuk menghidupkan materi Anda.</h2>
            <p>Dari materi yang sudah ada hingga pengalaman belajar yang lebih menarik.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
