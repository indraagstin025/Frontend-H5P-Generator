import { ArrowRightIcon, IdCardIcon, PlayIcon } from '@radix-ui/react-icons';

interface LandingNavbarProps {
  onEnter: () => void;
}

export function LandingNavbar({ onEnter }: LandingNavbarProps) {
  return (
    <header className="edu-nav">
      <div className="edu-nav-inner">
        <a
          href="#top"
          className="edu-brand"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.png" alt="H5P Generator" className="edu-brand-logo-img" />
          <div className="edu-brand-text">
            <span className="edu-brand-title">H5P Generator</span>
            <span className="edu-brand-sub">Ruang kreasi pembelajaran interaktif</span>
          </div>
        </a>

        <nav className="edu-nav-links" aria-label="Navigasi beranda">
          <a className="edu-nav-link" href="#alur-kerja">
            Cara kerja
          </a>
          <a className="edu-nav-link" href="#pilar">
            Fitur
          </a>
          <a className="edu-nav-link" href="#simulasi-hero">
            Contoh interaktif
          </a>
          <a className="edu-nav-link" href="#faq">
            Bantuan
          </a>
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
  );
}
