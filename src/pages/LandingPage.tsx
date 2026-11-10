/**
 * Landing Page Khusus Pengajar & Tim Pelatihan LMS Internal Perusahaan (L&D / Corporate Training).
 * Berfokus pada kebutuhan nyata organisasi:
 * - Konversi dek materi pelatihan (.pptx) & SOP (.pdf) menjadi modul studi kasus bercabang.
 * - Uji kepatuhan & pemahaman kerja nyata (Active Recall & Evaluasi Formatif).
 * - Pemrosesan 100% lokal di browser (Kerahasiaan dokumen SOP & data rahasia perusahaan terjaga - NFR-03).
 * - Standar paket .h5p resmi untuk LMS Internal (Moodle, Canvas, Totara, Blackboard) + pelaporan xAPI.
 * - Menggunakan icon resmi @radix-ui/react-icons dan tema gradasi hijau logo.png.
 */
import './LandingPage.css';
import { LandingNavbar } from './landing/components/LandingNavbar';
import { LandingHero } from './landing/components/LandingHero';
import { LandingComparison } from './landing/components/LandingComparison';
import { LandingFeatures } from './landing/components/LandingFeatures';
import { LandingRoles } from './landing/components/LandingRoles';
import { LandingWorkflow } from './landing/components/LandingWorkflow';
import { LandingFaq } from './landing/components/LandingFaq';
import { LandingCta } from './landing/components/LandingCta';
import { LandingFooter } from './landing/components/LandingFooter';
import type { LandingPageProps } from './landing/types';

export type { LandingPageProps };

export function LandingPage({ onEnter }: LandingPageProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="edu-landing">
      <LandingNavbar onEnter={onEnter} />
      <LandingHero onEnter={onEnter} onScrollToSection={scrollToSection} />
      <LandingComparison />
      <LandingFeatures />
      <LandingRoles />
      <LandingWorkflow />
      <LandingFaq />
      <LandingCta onEnter={onEnter} />
      <LandingFooter />
    </div>
  );
}
