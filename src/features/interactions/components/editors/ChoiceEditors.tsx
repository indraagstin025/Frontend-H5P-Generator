import { CheckIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { uid } from '../../../studio/constants/h5pModel';
import type {
  MultiChoiceElement,
  MultimediaChoiceElement,
  SingleChoiceElement,
  SlideElement,
} from '../../../studio/constants/h5pModel';

export function SingleChoiceEditor({
  element: sc,
  onPatch,
}: {
  element: SingleChoiceElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
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

export function MultiChoiceEditor({
  element: mc,
  onPatch,
}: {
  element: MultiChoiceElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
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

export function MultimediaChoiceEditor({
  element: mmc,
  onPatch,
}: {
  element: MultimediaChoiceElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
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
