/**
 * Editor kuis: MultiChoice, SingleChoice, TrueFalse, Blanks,
 * DragDrop, DragWords, MarkWords, MultimediaChoice + umpan balik.
 */
import { CheckIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { countBlanks, uid } from '../../studio/constants/h5pModel';
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
} from '../../studio/constants/h5pModel';

type QuizEditorProps = {
  element: MultiChoiceElement | SingleChoiceElement | TrueFalseElement | BlanksElement | DragDropElement | DragWordsElement | MarkWordsElement | MultimediaChoiceElement | SummaryElement;
  onPatch: (patch: Partial<SlideElement>) => void;
};

export type QuizElement = MultiChoiceElement | SingleChoiceElement | TrueFalseElement | BlanksElement | DragDropElement | DragWordsElement | MarkWordsElement | MultimediaChoiceElement | SummaryElement;

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
  // singleChoice
  if (element.kind === 'singleChoice') {
    const sc = element;
    return (
      <>
        <label className="field-label">
          Pertanyaannya
          <textarea
            rows={2}
            value={sc.question}
            placeholder="Tulis pertanyaan pilihan tunggal…"
            onChange={(e) => onPatch({ question: e.target.value })}
          />
        </label>
        <span className="section-kicker">Pilihan jawaban (satu benar)</span>
        <div className="option-list">
          {sc.options.map((opt) => (
            <div className="option-row" key={opt.id}>
              <button
                type="button"
                title={opt.correct ? 'Kunci jawaban' : 'Klik untuk jadikan kunci'}
                aria-label={opt.correct ? 'Opsi benar' : 'Opsi salah'}
                className={`option-toggle ${opt.correct ? 'correct' : ''}`}
                onClick={() =>
                  onPatch({
                    options: sc.options.map((o) =>
                      o.id === opt.id
                        ? { ...o, correct: true }
                        : { ...o, correct: false },
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
                  onPatch({ options: sc.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })
                }
              />
              <button
                type="button"
                aria-label="Hapus opsi"
                disabled={sc.options.length <= 2}
                onClick={() => onPatch({ options: sc.options.filter((o) => o.id !== opt.id) })}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-slide"
          type="button"
          onClick={() => onPatch({ options: [...sc.options, { id: uid(), text: `Pilihan ${sc.options.length + 1}`, correct: false }] })}
        >
          <PlusIcon /> Tambah pilihan
        </button>
      </>
    );
  }

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

  if (element.kind === 'dragDrop') {
    const dd = element;
    return (
      <>
        <label className="field-label">
          Pertanyaan / Instruksi
          <textarea
            rows={2}
            value={dd.question}
            onChange={(e) => onPatch({ question: e.target.value })}
            placeholder="Drag item ke tempat yang sesuai…"
          />
        </label>
        <span className="section-kicker">Zona tujuan</span>
        <div className="option-list">
          {dd.zones.map((zone) => (
            <div className="option-row" key={zone.id}>
              <input
                value={zone.label}
                placeholder="Nama zona…"
                onChange={(e) =>
                  onPatch({
                    zones: dd.zones.map((z) => (z.id === zone.id ? { ...z, label: e.target.value } : z)),
                  })
                }
              />
              <button
                type="button"
                aria-label="Hapus zona"
                disabled={dd.zones.length <= 1}
                onClick={() => {
                  const zones = dd.zones.filter((z) => z.id !== zone.id);
                  onPatch({
                    zones,
                    items: dd.items.map((it) =>
                      it.zoneId === zone.id ? { ...it, zoneId: zones[0]?.id ?? '' } : it,
                    ),
                  });
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-slide"
          type="button"
          onClick={() => onPatch({ zones: [...dd.zones, { id: uid(), label: `Zona ${dd.zones.length + 1}` }] })}
        >
          <PlusIcon /> Tambah zona
        </button>
        <span className="section-kicker">Item yang digeser</span>
        <div className="option-list">
          {dd.items.map((item) => (
            <div className="option-row" key={item.id}>
              <input
                value={item.text}
                placeholder="Teks item…"
                onChange={(e) =>
                  onPatch({
                    items: dd.items.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)),
                  })
                }
              />
              <select
                value={item.zoneId}
                aria-label={`Zona benar untuk ${item.text}`}
                onChange={(e) =>
                  onPatch({
                    items: dd.items.map((it) => (it.id === item.id ? { ...it, zoneId: e.target.value } : it)),
                  })
                }
              >
                {dd.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Hapus item"
                disabled={dd.items.length <= 1}
                onClick={() => onPatch({ items: dd.items.filter((it) => it.id !== item.id) })}
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
              items: [
                ...dd.items,
                { id: uid(), text: `Item ${dd.items.length + 1}`, zoneId: dd.zones[0]?.id ?? '' },
              ],
            })
          }
        >
          <PlusIcon /> Tambah item
        </button>
      </>
    );
  }

  if (element.kind === 'summary') {
    const sm = element;
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

  if (element.kind === 'multimediaChoice') {
    const mmc = element;
    return (
      <>
        <label className="field-label">
          Pertanyaannya
          <textarea
            rows={2}
            value={mmc.question}
            placeholder="Pertanyaan multimedia choice…"
            onChange={(e) => onPatch({ question: e.target.value })}
          />
        </label>
        <span className="section-kicker">Pilihan jawaban</span>
        <div className="option-list">
          {mmc.options.map((opt) => (
            <div className="option-row" key={opt.id}>
              <button
                type="button"
                className={`option-toggle ${opt.correct ? 'correct' : ''}`}
                onClick={() =>
                  onPatch({
                    options: mmc.options.map((o) =>
                      o.id === opt.id ? { ...o, correct: !o.correct } : o
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
                  onPatch({ options: mmc.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })
                }
              />
              <button
                type="button"
                aria-label="Hapus opsi"
                disabled={mmc.options.length <= 2}
                onClick={() => onPatch({ options: mmc.options.filter((o) => o.id !== opt.id) })}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-slide"
          type="button"
          onClick={() => onPatch({ options: [...mmc.options, { id: uid(), text: `Pilihan ${mmc.options.length + 1}`, correct: false }] })}
        >
          <PlusIcon /> Tambah pilihan
        </button>
      </>
    );
  }

  // dragWords, markWords, blanks — teks dengan sintaks
  return (
    <>
      <label className="field-label">
        Tulis soalnya di sini
        <textarea
          rows={3}
          value={'text' in element ? element.text : ''}
          onChange={(e) => onPatch({ text: e.target.value })}
          placeholder={element.kind === 'blanks'
            ? 'Tulis jawaban di antara *bintang*, cth: Ibukota Indonesia adalah *Jakarta*.'
            : element.kind === 'dragWords'
            ? 'Wrap kata yang bisa di-drag dalam *bintang*: Drag *kata* ke tempat yang *tepat*.'
            : 'Tandai kata kunci dalam *bintang*: Ini adalah *kata kunci*.'
          }
        />
      </label>
      {'text' in element && (
        <p className="muted">Ada {countBlanks(element.text)} kata yang ditandai.</p>
      )}
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
