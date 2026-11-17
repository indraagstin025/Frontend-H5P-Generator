import { CheckIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { uid } from '../../../studio/constants/h5pModel';
import type { SlideElement, SummaryElement, TrueFalseElement } from '../../../studio/constants/h5pModel';

export function TrueFalseEditor({
  element: tf,
  onPatch,
}: {
  element: TrueFalseElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
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

export function SummaryEditor({
  element: sm,
  onPatch,
}: {
  element: SummaryElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  return (
    <>
      <label className="field-label">
        Intro
        <textarea
          rows={2}
          value={sm.intro}
          onChange={(e) => onPatch({ intro: e.target.value })}
          placeholder="Ringkasan materi…"
        />
      </label>
      <span className="section-kicker">Pernyataan (satu yang benar)</span>
      <div className="option-list">
        {sm.statements.map((st) => (
          <div className="option-row" key={st.id}>
            <button
              type="button"
              className={`option-toggle ${st.correct ? 'correct' : ''}`}
              aria-label={st.correct ? 'Pernyataan benar' : 'Pernyataan salah'}
              onClick={() =>
                onPatch({
                  statements: sm.statements.map((s) =>
                    s.id === st.id
                      ? { ...s, correct: true }
                      : { ...s, correct: false },
                  ),
                })
              }
            >
              {st.correct ? <CheckIcon /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9db4a3', display: 'inline-block' }} />}
            </button>
            <input
              value={st.text}
              placeholder="Tulis pernyataan…"
              onChange={(e) =>
                onPatch({
                  statements: sm.statements.map((s) => (s.id === st.id ? { ...s, text: e.target.value } : s)),
                })
              }
            />
            <button
              type="button"
              aria-label="Hapus pernyataan"
              disabled={sm.statements.length <= 2}
              onClick={() => onPatch({ statements: sm.statements.filter((s) => s.id !== st.id) })}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-slide"
        type="button"
        onClick={() =>
          onPatch({
            statements: [
              ...sm.statements,
              { id: uid(), text: `Pernyataan ${sm.statements.length + 1}`, correct: false },
            ],
          })
        }
      >
        <PlusIcon /> Tambah pernyataan
      </button>
    </>
  );
}
