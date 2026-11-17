/**
 * Editor kuis: MultiChoice, SingleChoice, TrueFalse, Blanks,
 * DragDrop, DragWords, MarkWords, MultimediaChoice + umpan balik.
 *
 * Dipecah secara modular ke folder ./editors/ untuk kemudahan perawatan:
 * - types.ts: QuizElement & QuizEditorProps
 * - QuizCommonFields.tsx: QuizBehaviourFields & QuizFeedbackFields
 * - ChoiceEditors.tsx: SingleChoice, MultiChoice, MultimediaChoice
 * - DragDropEditor.tsx: DragDrop
 * - SummaryAndTfEditor.tsx: TrueFalse & Summary
 * - TextSyntaxEditor.tsx: Blanks, DragWords, MarkWords
 */
import type { SlideElement } from '../../studio/constants/h5pModel';
import {
  MultiChoiceEditor,
  MultimediaChoiceEditor,
  SingleChoiceEditor,
} from './editors/ChoiceEditors';
import { DragDropEditor } from './editors/DragDropEditor';
import {
  QuizBehaviourFields,
  QuizFeedbackFields,
} from './editors/QuizCommonFields';
import {
  SummaryEditor,
  TrueFalseEditor,
} from './editors/SummaryAndTfEditor';
import { TextSyntaxEditor } from './editors/TextSyntaxEditor';
import type { QuizEditorProps, QuizElement } from './editors/types';

// Re-export untuk backward compatibility dengan PropertyPanel dan konsumen lain
export type { QuizEditorProps, QuizElement };
export { QuizBehaviourFields, QuizFeedbackFields };

export function QuizQuestionFields({
  element,
  onPatch,
}: {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  if (element.kind === 'singleChoice') {
    return <SingleChoiceEditor element={element} onPatch={onPatch} />;
  }

  if (element.kind === 'multiChoice') {
    return <MultiChoiceEditor element={element} onPatch={onPatch} />;
  }

  if (element.kind === 'trueFalse') {
    return <TrueFalseEditor element={element} onPatch={onPatch} />;
  }

  if (element.kind === 'dragDrop') {
    return <DragDropEditor element={element} onPatch={onPatch} />;
  }

  if (element.kind === 'summary') {
    return <SummaryEditor element={element} onPatch={onPatch} />;
  }

  if (element.kind === 'multimediaChoice') {
    return <MultimediaChoiceEditor element={element} onPatch={onPatch} />;
  }

  // dragWords, markWords, blanks — teks dengan sintaks tanda bintang
  return <TextSyntaxEditor element={element} onPatch={onPatch} />;
}

export function QuizEditor({ element, onPatch }: QuizEditorProps) {
  return (
    <div className="quiz-editor">
      <QuizQuestionFields element={element} onPatch={onPatch} />
      <QuizBehaviourFields element={element} onPatch={onPatch} />
      <QuizFeedbackFields element={element} onPatch={onPatch} />
    </div>
  );
}
