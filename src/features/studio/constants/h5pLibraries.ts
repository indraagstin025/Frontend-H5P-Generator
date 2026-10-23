/**
 * Versi pustaka H5P (§5). Diambil dari semantics.json resmi
 * h5p-course-presentation (daftar action yang didukung).
 * CP_MINOR disetel di langkah Ekspor agar selaras dengan LMS Internal.
 */
import type { ElementKind, SlideElement } from './h5pModel';

export const COURSE_PRESENTATION = { machineName: 'H5P.CoursePresentation', majorVersion: 1 } as const;

export const COURSE_PRESENTATION_MINORS = [22, 23, 24, 25, 26] as const;

export const DEFAULT_CP_MINOR: (typeof COURSE_PRESENTATION_MINORS)[number] = 24;

export interface LibVersion {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

const LIBS: Record<ElementKind, LibVersion> = {
  advancedText: { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
  link: { machineName: 'H5P.Link', majorVersion: 1, minorVersion: 3 },
  image: { machineName: 'H5P.Image', majorVersion: 1, minorVersion: 1 },
  shape: { machineName: 'H5P.Shape', majorVersion: 1, minorVersion: 0 },
  video: { machineName: 'H5P.Video', majorVersion: 1, minorVersion: 6 },
  audio: { machineName: 'H5P.Audio', majorVersion: 1, minorVersion: 5 },
  goToSlide: { machineName: 'H5P.CoursePresentation', majorVersion: 1, minorVersion: 24 },
  blanks: { machineName: 'H5P.Blanks', majorVersion: 1, minorVersion: 14 },
  singleChoice: { machineName: 'H5P.SingleChoiceSet', majorVersion: 1, minorVersion: 11 },
  multiChoice: { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
  trueFalse: { machineName: 'H5P.TrueFalse', majorVersion: 1, minorVersion: 8 },
  dragDrop: { machineName: 'H5P.DragQuestion', majorVersion: 1, minorVersion: 14 },
  summary: { machineName: 'H5P.Summary', majorVersion: 1, minorVersion: 10 },
  dragWords: { machineName: 'H5P.DragText', majorVersion: 1, minorVersion: 10 },
  markWords: { machineName: 'H5P.MarkTheWords', majorVersion: 1, minorVersion: 11 },
  dialogCards: { machineName: 'H5P.Dialogcards', majorVersion: 1, minorVersion: 9 },
  continuousText: { machineName: 'H5P.ContinuousText', majorVersion: 1, minorVersion: 2 },
  exportableText: { machineName: 'H5P.ExportableTextArea', majorVersion: 1, minorVersion: 3 },
  table: { machineName: 'H5P.Table', majorVersion: 1, minorVersion: 2 },
  interactiveVideo: { machineName: 'H5P.InteractiveVideo', majorVersion: 1, minorVersion: 27 },
  audioRecorder: { machineName: 'H5P.AudioRecorder', majorVersion: 1, minorVersion: 0 },
  multimediaChoice: { machineName: 'H5P.MultiMediaChoice', majorVersion: 0, minorVersion: 3 },
};

export function libraryFor(kind: ElementKind, cpMinor: number): LibVersion {
  if (kind === 'goToSlide') return { ...LIBS.goToSlide, minorVersion: cpMinor };
  return LIBS[kind];
}

export function actionLibrary(kind: ElementKind, cpMinor: number): string {
  const lib = libraryFor(kind, cpMinor);
  return `${lib.machineName} ${lib.majorVersion}.${lib.minorVersion}`;
}

/**
 * Library yang benar-benar dipakai saat ekspor.
 * Multimedia Choice hanya punya opsi teks di model kita, sedangkan
 * H5P.MultiMediaChoice mewajibkan media di setiap opsi — jadi turun ke
 * H5P.MultiChoice. Interactive Video belum punya hotspot interaktif,
 * jadi cukup dipaketkan sebagai H5P.Video.
 */
export function effectiveKindOf(el: SlideElement): ElementKind {
  if (el.kind === 'multimediaChoice') return 'multiChoice';
  if (el.kind === 'interactiveVideo') return 'video';
  return el.kind;
}

export function libraryForElement(el: SlideElement, cpMinor: number): LibVersion {
  return libraryFor(effectiveKindOf(el), cpMinor);
}

export function actionLibraryFor(el: SlideElement, cpMinor: number): string {
  const lib = libraryForElement(el, cpMinor);
  return `${lib.machineName} ${lib.majorVersion}.${lib.minorVersion}`;
}
