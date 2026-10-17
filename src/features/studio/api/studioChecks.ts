/**
 * Pemeriksaan kesiapan materi untuk panel validasi studio.
 * Cerminan ringkas aturan ExportStep (granular per kelompok, bukan per pesan).
 */
import { countBlanks } from '../constants/h5pModel';
import type { Project } from '../constants/h5pModel';

export interface StudioCheck {
  id: string;
  label: string;
  ok: boolean;
}

export function getStudioChecks(project: Project): StudioCheck[] {
  const n = project.slides.length;
  const hasSlides = n > 0;

  let flowOk = hasSlides;
  let quizOk = true;
  let mediaOk = true;
  if (hasSlides) {
    for (const s of project.slides) {
      for (const el of s.elements) {
        if (el.kind === 'goToSlide' && el.targetType === 'specified' && (el.targetSlide < 1 || el.targetSlide > n)) {
          flowOk = false;
        }
        if (el.kind === 'multiChoice') {
          if (
            !el.question.trim() ||
            el.options.length < 2 ||
            !el.options.some((o) => o.correct) ||
            el.options.some((o) => !o.text.trim())
          ) {
            quizOk = false;
          }
        }
        if (el.kind === 'trueFalse' && !el.question.trim()) quizOk = false;
        if (el.kind === 'blanks' && countBlanks(el.text) === 0) quizOk = false;
        if ((el.kind === 'image' || el.kind === 'audio') && !el.file && !el.objectUrl) mediaOk = false;
      }
    }
  } else {
    quizOk = false;
    mediaOk = false;
  }

  const checks: StudioCheck[] = [
    { id: 'slides', label: 'Ada slide', ok: hasSlides },
    { id: 'flow', label: 'Alur tombol nyambung', ok: flowOk },
    { id: 'quiz', label: 'Kuis lengkap', ok: quizOk },
    { id: 'media', label: 'Gambar & suara lengkap', ok: mediaOk },
  ];
  checks.push({ id: 'ready', label: 'Siap diunduh', ok: checks.every((c) => c.ok) });
  return checks;
}
