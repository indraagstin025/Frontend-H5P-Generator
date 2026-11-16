import type { SlideElement } from '../../../studio/constants/h5pModel';
import type { QuizElement } from './types';

export function QuizBehaviourFields({
  element,
  onPatch,
}: {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  if (element.kind === 'summary') {
    return (
      <p className="muted">
        Summary memakai perilaku bawaan H5P. Pengaturan coba lagi dan kunci jawaban per elemen tidak tersedia.
      </p>
    );
  }
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
          disabled={element.kind === 'dragDrop'}
          onChange={(e) => onPatch({ showSolution: e.target.checked })}
        />
        <span>{element.kind === 'dragDrop' ? 'Kunci jawaban mengikuti H5P Drag and Drop' : 'Tampilkan kunci jawaban'}</span>
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
  if (element.kind === 'summary') {
    return (
      <p className="muted">
        Feedback Summary mengikuti pesan bawaan H5P. Pesan benar/salah khusus belum tersedia untuk elemen ini.
      </p>
    );
  }
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
