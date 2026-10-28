import { PlayIcon } from '@radix-ui/react-icons';

interface LandingCtaProps {
  onEnter: () => void;
}

export function LandingCta({ onEnter }: LandingCtaProps) {
  return (
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
  );
}
