import type { SlideElement } from '../../../studio/constants/h5pModel';
import type { QuizElement } from './types';

export function QuizBehaviourFields({
  element,
  onPatch,
}: {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  return (
    <div className="field-row">
      <label className="check-row compact">
        <input
          type="checkbox"
          checked={element.enableRetry}
          onChange={(e) => onPatch({ enableRetry: e.target.checked })}
        />
        <span>Boleh coba lagi</span>
      </label>
      <label className="check-row compact">
        <input
          type="checkbox"
          checked={element.showSolution}
          onChange={(e) => onPatch({ showSolution: e.target.checked })}
        />
        <span>Tampilkan kunci jawaban</span>
      </label>
    </div>
  );
}

export function QuizFeedbackFields({
  element,
  onPatch,
}: {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  return (
    <>
      <label className="field-label">
        Pesan kalau jawabannya benar
        <input
          value={element.feedbackCorrect}
          placeholder="Cth: Betul! Lanjut ke bagian berikutnya."
          onChange={(e) => onPatch({ feedbackCorrect: e.target.value })}
        />
      </label>
      <label className="field-label">
        Pesan kalau jawabannya salah
        <input
          value={element.feedbackWrong}
          placeholder="Cth: Kurang tepat, coba baca lagi materinya."
          onChange={(e) => onPatch({ feedbackWrong: e.target.value })}
        />
      </label>
    </>
  );
}
