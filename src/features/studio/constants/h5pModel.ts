/**
 * Domain model frontend (FR-02..FR-09, §5).
 * Satu-satunya definisi tipe Slide/Element/Project — dipakai
 * ingest, studio, preview, exporter, dan projects.
 */

export type AspectRatio = '16:9' | '4:3';
export type SlideTone = 'lime' | 'forest' | 'mint' | 'paper';

export type ElementKind =
  | 'advancedText'
  | 'link'
  | 'image'
  | 'shape'
  | 'video'
  | 'audio'
  | 'goToSlide'
  | 'blanks'
  | 'singleChoice'
  | 'multiChoice'
  | 'trueFalse'
  | 'dragDrop'
  | 'summary'
  | 'dragWords'
  | 'markWords'
  | 'dialogCards'
  | 'continuousText'
  | 'exportableText'
  | 'table'
  | 'interactiveVideo'
  | 'audioRecorder'
  | 'multimediaChoice';

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

interface BaseElement {
  id: string;
  kind: ElementKind;
  position: ElementPosition;
  /** FR-09: tampil inline vs ikon tombol pop-up */
  displayAsButton: boolean;
  buttonLabel: string;
  title: string;
}

export interface AdvancedTextElement extends BaseElement {
  kind: 'advancedText';
  text: string;
}

export interface LinkElement extends BaseElement {
  kind: 'link';
  url: string;
  linkText: string;
}

export interface ImageElement extends BaseElement {
  kind: 'image';
  alt: string;
  fileName: string;
  objectUrl: string | null;
  file: File | null;
}

export interface ShapeElement extends BaseElement {
  kind: 'shape';
  shapeType: 'circle' | 'square' | 'rectangle' | 'triangle';
  color: string;
}

export interface VideoElement extends BaseElement {
  kind: 'video';
  videoUrl: string;
  fileName: string;
  objectUrl: string | null;
  file: File | null;
}

export interface AudioElement extends BaseElement {
  kind: 'audio';
  fileName: string;
  objectUrl: string | null;
  file: File | null;
}

export type GoToTargetType = 'specified' | 'next' | 'previous';

export interface GoToSlideElement extends BaseElement {
  kind: 'goToSlide';
  label: string;
  targetType: GoToTargetType;
  targetSlide: number;
  invisible: boolean;
}

interface QuizBehaviour {
  feedbackCorrect: string;
  feedbackWrong: string;
  enableRetry: boolean;
  showSolution: boolean;
}

export interface BlanksElement extends BaseElement, QuizBehaviour {
  kind: 'blanks';
  /** Teks soal, jawaban kosong ditulis *jawaban* */
  text: string;
}

export interface SingleChoiceElement extends BaseElement, QuizBehaviour {
  kind: 'singleChoice';
  question: string;
  options: QuizOption[];
}

export interface MultiChoiceElement extends BaseElement, QuizBehaviour {
  kind: 'multiChoice';
  question: string;
  singleAnswer: boolean;
  options: QuizOption[];
}

export interface TrueFalseElement extends BaseElement, QuizBehaviour {
  kind: 'trueFalse';
  question: string;
  correctAnswer: boolean;
}

export interface DragDropElement extends BaseElement, QuizBehaviour {
  kind: 'dragDrop';
  question: string;
}

export interface SummaryElement extends BaseElement {
  kind: 'summary';
  intro: string;
}

export interface DragWordsElement extends BaseElement, QuizBehaviour {
  kind: 'dragWords';
  text: string;
}

export interface MarkWordsElement extends BaseElement, QuizBehaviour {
  kind: 'markWords';
  text: string;
}

export interface DialogCardsElement extends BaseElement {
  kind: 'dialogCards';
  description: string;
}

export interface ContinuousTextElement extends BaseElement {
  kind: 'continuousText';
  text: string;
}

export interface ExportableTextElement extends BaseElement {
  kind: 'exportableText';
  text: string;
}

export interface TableElement extends BaseElement {
  kind: 'table';
  rows: number;
  cols: number;
}

export interface InteractiveVideoElement extends BaseElement {
  kind: 'interactiveVideo';
  videoUrl: string;
}

export interface AudioRecorderElement extends BaseElement {
  kind: 'audioRecorder';
  description: string;
}

export interface MultimediaChoiceElement extends BaseElement, QuizBehaviour {
  kind: 'multimediaChoice';
  question: string;
  options: QuizOption[];
}

export type SlideElement =
  | AdvancedTextElement
  | LinkElement
  | ImageElement
  | ShapeElement
  | VideoElement
  | AudioElement
  | GoToSlideElement
  | BlanksElement
  | SingleChoiceElement
  | MultiChoiceElement
  | TrueFalseElement
  | DragDropElement
  | SummaryElement
  | DragWordsElement
  | MarkWordsElement
  | DialogCardsElement
  | ContinuousTextElement
  | ExportableTextElement
  | TableElement
  | InteractiveVideoElement
  | AudioRecorderElement
  | MultimediaChoiceElement;

export interface SlideKeyword {
  main: string;
  subs: string[];
}

export interface Slide {
  id: string;
  order: number;
  title: string;
  chapter: string;
  tone: SlideTone;
  aspect: AspectRatio;
  backgroundUrl: string | null;
  keywords: SlideKeyword[];
  elements: SlideElement[];
}

export interface ProjectSettings {
  projectTitle: string;
  language: 'id' | 'en';
  aspect: AspectRatio;
  keywordListEnabled: boolean;
  /** FR-06: kunci navigasi, peserta hanya pindah via Go-To-Slide */
  activeSurface: boolean;
  /** §5 xAPI: ringkasan + solusi di slide akhir */
  hideSummarySlide: boolean;
  showSolutionButton: boolean;
  retryButton: boolean;
}

export interface Project {
  id: string;
  title: string;
  sourceFileName: string | null;
  settings: ProjectSettings;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

const TONES: SlideTone[] = ['lime', 'forest', 'mint', 'paper'];

export function toneForOrder(order: number): SlideTone {
  return TONES[(order - 1) % TONES.length];
}

export function chapterForOrder(order: number): string {
  return `Bab ${String(Math.ceil(order / 4)).padStart(2, '0')}`;
}

export function createSlide(order: number, title: string, aspect: AspectRatio): Slide {
  const clean = title.trim() || `Slide ${order}`;
  return {
    id: uid(),
    order,
    title: clean,
    chapter: chapterForOrder(order),
    tone: toneForOrder(order),
    aspect,
    backgroundUrl: null,
    keywords: [{ main: clean, subs: [] }],
    elements: [],
  };
}

function basePosition(kind: ElementKind): ElementPosition {
  switch (kind) {
    case 'goToSlide':
      return { x: 58, y: 64, width: 30, height: 12 };
    case 'multiChoice':
    case 'singleChoice':
    case 'trueFalse':
    case 'blanks':
    case 'dragDrop':
    case 'dragWords':
    case 'markWords':
      return { x: 8, y: 8, width: 44, height: 40 };
    case 'audio':
    case 'audioRecorder':
      return { x: 8, y: 80, width: 30, height: 10 };
    case 'image':
    case 'video':
    case 'interactiveVideo':
      return { x: 62, y: 10, width: 30, height: 40 };
    case 'advancedText':
    case 'link':
    case 'continuousText':
    case 'exportableText':
      return { x: 8, y: 12, width: 46, height: 26 };
    case 'shape':
      return { x: 20, y: 20, width: 20, height: 20 };
    case 'summary':
    case 'dialogCards':
    case 'table':
    case 'multimediaChoice':
      return { x: 5, y: 5, width: 50, height: 45 };
  }
}

const QUIZ_DEFAULTS = {
  feedbackCorrect: 'Benar! Lanjut ke bagian berikutnya.',
  feedbackWrong: 'Kurang tepat. Coba baca kembali materi di slide ini.',
  enableRetry: true,
  showSolution: true,
};

export function createElement(kind: 'advancedText', slideCount: number): AdvancedTextElement;
export function createElement(kind: 'link', slideCount: number): LinkElement;
export function createElement(kind: 'image', slideCount: number): ImageElement;
export function createElement(kind: 'shape', slideCount: number): ShapeElement;
export function createElement(kind: 'video', slideCount: number): VideoElement;
export function createElement(kind: 'audio', slideCount: number): AudioElement;
export function createElement(kind: 'goToSlide', slideCount: number): GoToSlideElement;
export function createElement(kind: 'blanks', slideCount: number): BlanksElement;
export function createElement(kind: 'singleChoice', slideCount: number): SingleChoiceElement;
export function createElement(kind: 'multiChoice', slideCount: number): MultiChoiceElement;
export function createElement(kind: 'trueFalse', slideCount: number): TrueFalseElement;
export function createElement(kind: 'dragDrop', slideCount: number): DragDropElement;
export function createElement(kind: 'summary', slideCount: number): SummaryElement;
export function createElement(kind: 'dragWords', slideCount: number): DragWordsElement;
export function createElement(kind: 'markWords', slideCount: number): MarkWordsElement;
export function createElement(kind: 'dialogCards', slideCount: number): DialogCardsElement;
export function createElement(kind: 'continuousText', slideCount: number): ContinuousTextElement;
export function createElement(kind: 'exportableText', slideCount: number): ExportableTextElement;
export function createElement(kind: 'table', slideCount: number): TableElement;
export function createElement(kind: 'interactiveVideo', slideCount: number): InteractiveVideoElement;
export function createElement(kind: 'audioRecorder', slideCount: number): AudioRecorderElement;
export function createElement(kind: 'multimediaChoice', slideCount: number): MultimediaChoiceElement;
export function createElement(kind: ElementKind, slideCount: number): SlideElement;
export function createElement(kind: ElementKind, slideCount: number): SlideElement {
  const base = {
    id: uid(),
    position: basePosition(kind),
    displayAsButton: ['multiChoice', 'singleChoice', 'trueFalse', 'blanks', 'dragDrop', 'dragWords', 'markWords', 'multimediaChoice'].includes(kind),
    buttonLabel: '',
    title: '',
  };
  switch (kind) {
    case 'advancedText':
      return { ...base, kind, text: 'Tulis narasi cerita di sini…' };
    case 'link':
      return { ...base, kind, url: 'https://', linkText: 'Klik di sini' };
    case 'image':
      return { ...base, kind, alt: '', fileName: '', objectUrl: null, file: null };
    case 'shape':
      return { ...base, kind, shapeType: 'rectangle', color: '#4CAF50' };
    case 'video':
      return { ...base, kind, videoUrl: '', fileName: '', objectUrl: null, file: null };
    case 'audio':
      return { ...base, kind, fileName: '', objectUrl: null, file: null };
    case 'goToSlide':
      return {
        ...base,
        kind,
        label: 'Keputusan A',
        targetType: 'specified',
        targetSlide: Math.min(2, Math.max(1, slideCount)),
        invisible: false,
      };
    case 'blanks':
      return { ...base, kind, text: 'Ibukota Indonesia adalah *Jakarta*.', ...QUIZ_DEFAULTS };
    case 'singleChoice':
      return {
        ...base,
        kind,
        question: 'Pertanyaan baru',
        options: [
          { id: uid(), text: 'Opsi A (benar)', correct: true },
          { id: uid(), text: 'Opsi B', correct: false },
        ],
        ...QUIZ_DEFAULTS,
      };
    case 'multiChoice':
      return {
        ...base,
        kind,
        question: 'Pertanyaan baru',
        singleAnswer: false,
        options: [
          { id: uid(), text: 'Opsi A (benar)', correct: true },
          { id: uid(), text: 'Opsi B (benar)', correct: true },
          { id: uid(), text: 'Opsi C', correct: false },
        ],
        ...QUIZ_DEFAULTS,
      };
    case 'trueFalse':
      return { ...base, kind, question: 'Pernyataan baru', correctAnswer: true, ...QUIZ_DEFAULTS };
    case 'dragDrop':
      return { ...base, kind, question: 'Drag item ke tempat yang sesuai', ...QUIZ_DEFAULTS };
    case 'summary':
      return { ...base, kind, intro: 'Ringkasan materi di slide ini.' };
    case 'dragWords':
      return { ...base, kind, text: 'Drag *kata* ke tempat yang *tepat*.', ...QUIZ_DEFAULTS };
    case 'markWords':
      return { ...base, kind, text: 'Tandai *kata kunci* dalam kalimat ini.', ...QUIZ_DEFAULTS };
    case 'dialogCards':
      return { ...base, kind, description: 'Kartu dialog baru' };
    case 'continuousText':
      return { ...base, kind, text: 'Tulis teks panjang di sini…' };
    case 'exportableText':
      return { ...base, kind, text: 'Teks yang dapat diekspor…' };
    case 'table':
      return { ...base, kind, rows: 3, cols: 3 };
    case 'interactiveVideo':
      return { ...base, kind, videoUrl: '' };
    case 'audioRecorder':
      return { ...base, kind, description: 'Rekam suara Anda' };
    case 'multimediaChoice':
      return {
        ...base,
        kind,
        question: 'Pilih jawaban yang benar',
        options: [
          { id: uid(), text: 'Opsi A', correct: true },
          { id: uid(), text: 'Opsi B', correct: false },
        ],
        ...QUIZ_DEFAULTS,
      };
  }
}

export function createProject(title: string, aspect: AspectRatio, sourceFileName: string | null): Project {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: title.trim() || 'Modul tanpa judul',
    sourceFileName,
    settings: {
      projectTitle: title.trim() || 'Modul tanpa judul',
      language: 'id',
      aspect,
      keywordListEnabled: true,
      activeSurface: false,
      hideSummarySlide: false,
      showSolutionButton: true,
      retryButton: true,
    },
    slides: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Skor maksimum satu elemen kuis (cerminan perhitungan summary slide). */
export function maxScoreOf(el: SlideElement): number {
  if (el.kind === 'blanks') return countBlanks(el.text);
  if (el.kind === 'multiChoice' || el.kind === 'trueFalse') return 1;
  return 0;
}

export function countBlanks(text: string): number {
  const matches = text.match(/\*[^*]+\*/g);
  return matches ? matches.length : 0;
}

export function extractBlankAnswers(text: string): string[] {
  const matches = text.match(/\*([^*]+)\*/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1).trim()).filter((s) => s.length > 0);
}

export function isQuizElement(
  el: SlideElement
): el is MultiChoiceElement | SingleChoiceElement | TrueFalseElement | BlanksElement | DragDropElement | DragWordsElement | MarkWordsElement | MultimediaChoiceElement {
  return [
    'multiChoice', 'singleChoice', 'trueFalse', 'blanks',
    'dragDrop', 'dragWords', 'markWords', 'multimediaChoice'
  ].includes(el.kind);
}
