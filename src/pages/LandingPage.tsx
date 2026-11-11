import { useEffect, useRef, type PointerEvent } from 'react';
import './LandingPage.css';
import './PublicPageMotion.css';
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
            <div className="landing-actions">
              <button className="landing-start" type="button" onClick={onEnter}>Mulai buat materi</button>
              <span className="landing-signin-note">Login untuk mulai berkreasi</span>
            </div>
          </div>
          <aside className="landing-visual" aria-label="Materi pembelajaran H5P">
            <span className="landing-visual-label">KREASIKAN PEMBELAJARAN ANDA</span>
            <LearningIllustration />
            <div className="landing-visual-caption"><h2>Dari ide Anda,<br />jadi pengalaman belajar.</h2><p>Susun. Kreasikan. Bagikan.</p></div>
          </aside>
        </section>
          <svg className="landing-section-wave" viewBox="0 24 150 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <path id="landing-wave-path" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
              <mask id="landing-wave-cutout" maskUnits="userSpaceOnUse" x="0" y="24" width="150" height="28" style={{ maskType: 'luminance' }}>
                <rect x="0" y="24" width="150" height="28" fill="white" />
                <g transform="translate(0 76) scale(1 -1)">
                  <g className="landing-wave-front"><use href="#landing-wave-path" x="50" y="9" fill="black" /></g>
                </g>
              </mask>
            </defs>
            <g mask="url(#landing-wave-cutout)">
              <rect x="0" y="24" width="150" height="28" fill="#f8faf9" />
              <g transform="translate(0 76) scale(1 -1)">
                <g className="landing-wave-back"><use href="#landing-wave-path" x="50" y="3" fill="#c8e2cc" /></g>
                <g className="landing-wave-middle"><use href="#landing-wave-path" x="50" y="0" fill="#7ab780" /></g>
              </g>
            </g>
          </svg>
        </div>
        <section className="landing-features" aria-labelledby="landing-features-title">
          <ul className="landing-feature-list">
            <li className="landing-feature-card">
              <FeatureIllustration variant="editing" />
              <h3>Editing File H5P</h3>
              <p>Buka kembali materi H5P yang didukung, perbarui isi dan interaksinya di Studio, lalu ekspor hasil pengeditan Anda.</p>
              <span className="landing-feature-note">Lanjutkan dan sempurnakan materi</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="convert" />
              <h3>Convert PPTX dan PDF ke H5P</h3>
              <p>Mulai dari presentasi atau dokumen Anda. Ubah menjadi slide pembelajaran, tambahkan interaksi, lalu unduh sebagai paket H5P.</p>
              <span className="landing-feature-note">Gunakan materi yang sudah Anda miliki</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="game" />
              <h3>Berbasis Gamifikasi</h3>
              <p>Ajak peserta belajar lebih aktif melalui kuis, pilihan alur, dan umpan balik. Jadikan materi sebagai tantangan yang menarik untuk diselesaikan.</p>
              <span className="landing-feature-note">Belajar melalui interaksi dan tantangan</span>
            </li>
            <li className="landing-feature-card">
              <FeatureIllustration variant="customization" />
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
