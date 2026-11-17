import type {
  BlanksElement,
  DragDropElement,
  DragWordsElement,
  MarkWordsElement,
  MultiChoiceElement,
  MultimediaChoiceElement,
  SingleChoiceElement,
  SlideElement,
  SummaryElement,
  TrueFalseElement,
} from '../../../studio/constants/h5pModel';

export type QuizElement =
  | MultiChoiceElement
  | SingleChoiceElement
  | TrueFalseElement
  | BlanksElement
  | DragDropElement
  | DragWordsElement
  | MarkWordsElement
  | MultimediaChoiceElement
  | SummaryElement;

export type QuizEditorProps = {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
};
