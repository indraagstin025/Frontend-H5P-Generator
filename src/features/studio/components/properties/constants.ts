import type { ElementKind } from '../../constants/h5pModel';

export const KIND_LABEL: Record<ElementKind, string> = {
  advancedText: 'Add Text',
  link: 'Add Link',
  image: 'Add Image',
  shape: 'Add Shape',
  video: 'Add Video',
  audio: 'Audio',
  goToSlide: 'Go To Slide',
  blanks: 'Fill In The Blank',
  singleChoice: 'Single Choice Set',
  multiChoice: 'Multiple Choice',
  trueFalse: 'True False Question',
  dragDrop: 'Drag And Drop',
  summary: 'Summary',
  dragWords: 'Drag the Words',
  markWords: 'Mark the Words',
  dialogCards: 'Dialog Cards',
  continuousText: 'Continuous Text',
  exportableText: 'Exportable Text Area',
  table: 'Table',
  interactiveVideo: 'Interactive Video',
  audioRecorder: 'Audio Recorder',
  multimediaChoice: 'Multimedia Choice',
};

export type QuizTab = 'konten' | 'jawaban' | 'penilaian' | 'umpanbalik';

export const QUIZ_TABS: Array<{ id: QuizTab; label: string }> = [
  { id: 'konten', label: 'Konten' },
  { id: 'jawaban', label: 'Jawaban' },
  { id: 'penilaian', label: 'Penilaian' },
  { id: 'umpanbalik', label: 'Umpan balik' },
];
