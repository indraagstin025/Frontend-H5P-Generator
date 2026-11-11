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
        if ((el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice')) {
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
        if ((el.kind === 'blanks' || el.kind === 'dragWords' || el.kind === 'markWords') && countBlanks(el.text) === 0) quizOk = false;

        if (el.kind === 'dragDrop' && (!el.question.trim() || !el.items.length || !el.zones.length || el.items.some(it => !it.text.trim() || (it.zoneId !== '' && !el.zones.some(z => z.id === it.zoneId))) || el.zones.some(z => !z.label.trim()))) quizOk = false;
        if (el.kind === 'summary' && (el.statements.length < 2 || !el.statements.some(st => st.correct) || el.statements.some(st => !st.text.trim()))) quizOk = false;
        if (el.kind === 'video' && !el.file && !el.objectUrl && !el.videoUrl.trim()) mediaOk = false;
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
  checks.push({ id: 'ready', label: 'Siap diunduh', ok: getProjectIssues(project).length === 0 });
  return checks;
}

/** Shared blocking validation used by Studio and Export. */
export function getProjectIssues(project: Project): string[] {
    const list: string[] = [];
    if (project.slides.length === 0) list.push('Belum ada slide.');
    const n = project.slides.length;
    for (const s of project.slides) {
      for (const el of s.elements) {
        if (el.kind === 'goToSlide' && el.targetType === 'specified' && (el.targetSlide < 1 || el.targetSlide > n)) {
          list.push(`Slide ${s.order}: tombol “${el.label}” mengarah ke slide ${el.targetSlide} yang tidak ada.`);
        }
        if (el.kind === 'link' && !el.url.trim()) {
          list.push(`Slide ${s.order}: link URL belum diisi.`);
        }
        if (el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice') {
          const label = el.kind === 'multiChoice' ? 'pilihan ganda' : el.kind === 'singleChoice' ? 'pilihan tunggal' : 'multimedia choice';
          if (el.options.length < 2) list.push(`Slide ${s.order}: kuis ${label} minimal 2 pilihan jawaban.`);
          if (!el.options.some((o) => o.correct)) list.push(`Slide ${s.order}: kuis ${label} belum ada jawaban yang benar.`);
          if (el.kind === 'singleChoice' && el.options.filter((o) => o.correct).length !== 1) {
            list.push(`Slide ${s.order}: kuis pilihan tunggal harus punya tepat satu jawaban benar.`);
          }
          if (el.kind === 'singleChoice' && el.options.length > 4) {
            list.push(`Slide ${s.order}: H5P Single Choice maksimal 4 pilihan jawaban.`);
          }
          if (el.options.some((o) => !o.text.trim())) list.push(`Slide ${s.order}: ada pilihan jawaban yang masih kosong.`);
        }
        if (
          (el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice' || el.kind === 'trueFalse' || el.kind === 'dragDrop') &&
          !el.question.trim()
        ) {
          list.push(`Slide ${s.order}: pertanyaan kuisnya masih kosong.`);
        }
        if ((el.kind === 'blanks' || el.kind === 'dragWords' || el.kind === 'markWords') && countBlanks(el.text) === 0) {
          list.push(`Slide ${s.order}: kuis ${el.kind === 'blanks' ? 'isian' : el.kind === 'dragWords' ? 'drag the words' : 'mark the words'} belum punya kata *berbintang*.`);
        }
        if (el.kind === 'dragDrop') {
          if (el.zones.length === 0) list.push(`Slide ${s.order}: drag & drop belum punya zona tujuan.`);
          if (el.items.length === 0) list.push(`Slide ${s.order}: drag & drop belum punya item.`);
          if (el.zones.some((z) => !z.label.trim())) list.push(`Slide ${s.order}: ada zona drag & drop yang masih kosong.`);
          if (el.items.some((it) => !it.text.trim())) list.push(`Slide ${s.order}: ada item drag & drop yang masih kosong.`);
          if (el.items.some((it) => it.zoneId !== '' && !el.zones.some((z) => z.id === it.zoneId))) {
            list.push(`Slide ${s.order}: ada item drag & drop yang belum punya zona jawaban.`);
          }
        }
        if (el.kind === 'summary') {
          if (el.statements.length < 2) list.push(`Slide ${s.order}: summary minimal butuh 2 pernyataan.`);
          if (!el.statements.some((st) => st.correct)) list.push(`Slide ${s.order}: summary belum ada pernyataan yang benar.`);
          if (el.statements.some((st) => !st.text.trim())) list.push(`Slide ${s.order}: ada pernyataan summary yang masih kosong.`);
        }
        if (el.kind === 'dialogCards') {
          if (el.cards.length === 0) list.push(`Slide ${s.order}: dialog cards belum punya kartu.`);
          if (el.cards.some((c) => !c.front.trim() || !c.back.trim())) {
            list.push(`Slide ${s.order}: ada kartu dialog yang sisi depan/belakangnya kosong.`);
          }
        }
        if (el.kind === 'table' && (el.rows < 1 || el.cols < 1)) {
          list.push(`Slide ${s.order}: tabel minimal 1 baris dan 1 kolom.`);
        }
        if (el.kind === 'video' && !el.file && !el.objectUrl && !el.videoUrl.trim()) {
          list.push(`Slide ${s.order}: video belum ada file atau URL-nya.`);
        }
        if (el.kind === 'interactiveVideo' && !el.videoUrl.trim()) {
          list.push(`Slide ${s.order}: interactive video belum ada URL video.`);
        }
        if ((el.kind === 'image' || el.kind === 'audio') && !el.file && !el.objectUrl) {
          list.push(`Slide ${s.order}: ${el.kind === 'image' ? 'Gambar' : 'Suara'} belum ada file-nya.`);
        }
      }
    }
    return list;

}
