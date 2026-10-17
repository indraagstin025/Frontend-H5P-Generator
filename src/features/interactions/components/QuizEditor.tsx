/**
 * Editor kuis (FR-08): MultiChoice, TrueFalse, Blanks + umpan balik kepatuhan.
 */
import { CheckIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { countBlanks, uid } from '../../studio/constants/h5pModel';
import type {
  BlanksElement,
  MultiChoiceElement,
  SlideElement,
  TrueFalseElement,
} from '../../studio/constants/h5pModel';

type QuizEditorProps = {
  element: MultiChoiceElement | TrueFalseElement | BlanksElement;
  onPatch: (patch: Partial<SlideElement>) => void;
};

export type QuizElement = MultiChoiceElement | TrueFalseElement | BlanksElement;

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

export function QuizQuestionFields({
  element,
  onPatch,
}: {
  element: QuizElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  if (element.kind === 'multiChoice') {
    const mc = element;
    return (
      <>
        <label className="field-label">
          Pertanyaannya
          <textarea
            rows={2}
            value={mc.question}
            placeholder="Tulis pertanyaan atau contoh kasus…"
            onChange={(e) => onPatch({ question: e.target.value })}
          />
        </label>
        <label className="check-row compact">
          <input
            type="checkbox"
            checked={mc.singleAnswer}
            onChange={(e) => onPatch({ singleAnswer: e.target.checked })}
          />
          <span>Cuma satu jawaban yang benar</span>
        </label>
        <span className="section-kicker">Pilihan jawaban</span>
        <div className="option-list">
          {mc.options.map((opt) => (
            <div className="option-row" key={opt.id}>
              <button
                type="button"
                title={opt.correct ? 'Jadikan kunci jawaban (klik untuk ubah)' : 'Bukan kunci (klik untuk jadikan kunci)'}
                aria-label={opt.correct ? 'Opsi benar' : 'Opsi salah'}
                className={`option-toggle ${opt.correct ? 'correct' : ''}`}
                onClick={() =>
                  onPatch({
                    options: mc.options.map((o) =>
                      o.id === opt.id
                        ? { ...o, correct: mc.singleAnswer ? true : !o.correct }
                        : { ...o, correct: mc.singleAnswer ? false : o.correct },
                    ),
                  })
                }
              >
                {opt.correct ? <CheckIcon /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9db4a3', display: 'inline-block' }} />}
              </button>
              <input
                value={opt.text}
                placeholder="Tulis pilihannya…"
                onChange={(e) =>
                  onPatch({ options: mc.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })
                }
              />
              <button
                type="button"
                aria-label="Hapus opsi"
                disabled={mc.options.length <= 2}
                onClick={() => onPatch({ options: mc.options.filter((o) => o.id !== opt.id) })}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-slide"
          type="button"
          onClick={() => onPatch({ options: [...mc.options, { id: uid(), text: `Pilihan ${mc.options.length + 1}`, correct: false }] })}
        >
          <PlusIcon /> Tambah pilihan
        </button>
      </>
    );
  }

  if (element.kind === 'trueFalse') {
    const tf = element;
    return (
      <>
        <label className="field-label">
          Pernyataannya
          <textarea
            rows={2}
            value={tf.question}
            placeholder="Tulis pernyataan yang harus dinilai benar atau salah…"
            onChange={(e) => onPatch({ question: e.target.value })}
          />
        </label>
        <label className="field-label">
          Kunci jawabannya
          <select
            value={tf.correctAnswer ? 'true' : 'false'}
            onChange={(e) => onPatch({ correctAnswer: e.target.value === 'true' })}
          >
            <option value="true">Benar</option>
            <option value="false">Salah</option>
          </select>
        </label>
      </>
    );
  }

  return (
    <>
      <label className="field-label">
        Tulis soalnya di sini
        <textarea
          rows={3}
          value={element.text}
          onChange={(e) => onPatch({ text: e.target.value })}
          placeholder="Tulis jawaban di antara *bintang*, cth: Ibukota Indonesia adalah *Jakarta*."
        />
      </label>
      <p className="muted">Ada {countBlanks(element.text)} kolom yang harus diisi.</p>
    </>
  );
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
