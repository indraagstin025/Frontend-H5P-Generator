import { useState } from 'react';
import { extractBlankAnswers, markWordTokens } from '../../../studio/constants/h5pModel';
import type {
  AudioRecorderElement,
  BlanksElement,
  DialogCardsElement,
  DragDropElement,
  DragWordsElement,
  ExportableTextElement,
  MarkWordsElement,
  MultiChoiceElement,
  SummaryElement,
  TableElement,
  TrueFalseElement,
} from '../../../studio/constants/h5pModel';
import { blanksSegments, type Answer } from './types';

export function McWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: MultiChoiceElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const chosen = new Set(Array.isArray(answer) ? answer : []);
  const toggle = (id: string) => {
    if (el.singleAnswer) {
      onAnswer(el.id, [id]);
      return;
    }
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onAnswer(el.id, [...next]);
  };
  const right = new Set(el.options.filter((o) => o.correct).map((o) => o.id));
  const correct = chosen.size > 0 && chosen.size === right.size && [...chosen].every((id) => right.has(id));
  return (
    <div className="pv-quiz">
      <p className="pv-question">{el.question}</p>
      <div className="pv-options">
        {el.options.map((o) => (
          <label key={o.id} className={`pv-option ${chosen.has(o.id) ? 'chosen' : ''}`}>
            <input
              type={el.singleAnswer ? 'radio' : 'checkbox'}
              name={`mc-${el.id}`}
              checked={chosen.has(o.id)}
              onChange={() => toggle(o.id)}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </div>
      {showSolution && chosen.size > 0 && (
        <p className={`pv-feedback ${correct ? 'ok' : 'bad'}`}>{correct ? el.feedbackCorrect : el.feedbackWrong}</p>
      )}
    </div>
  );
}

export function TfWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: TrueFalseElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const correct = answer === el.correctAnswer;
  return (
    <div className="pv-quiz">
      <p className="pv-question">{el.question}</p>
      <div className="pv-options row">
        {[
          { label: 'Benar', value: true },
          { label: 'Salah', value: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            className={`pv-tf ${answer === opt.value ? 'chosen' : ''}`}
            onClick={() => onAnswer(el.id, opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {showSolution && answer !== null && (
        <p className={`pv-feedback ${correct ? 'ok' : 'bad'}`}>{correct ? el.feedbackCorrect : el.feedbackWrong}</p>
      )}
    </div>
  );
}

export function BlanksWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: BlanksElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const segments = blanksSegments(el.text);
  const values = Array.isArray(answer) ? answer : [];
  const expected = extractBlankAnswers(el.text);
  return (
    <div className="pv-quiz">
      <p className="pv-blanks">
        {segments.map((seg, idx) => {
          if (!seg.gap) return <span key={seg.key}>{seg.value}</span>;
          const gi = segments.slice(0, idx).filter((s) => s.gap).length;
          return (
            <input
              key={seg.key}
              className="pv-gap"
              value={values[gi] ?? ''}
              placeholder="…"
              aria-label={`Isian ${gi + 1}`}
              onChange={(e) => {
                const next = [...values];
                next[gi] = e.target.value;
                onAnswer(el.id, next);
              }}
            />
          );
        })}
      </p>
      {showSolution && values.some((v) => (v ?? '').trim()) && (
        <p className="pv-feedback muted">Jawaban benar: {expected.join(' · ')}</p>
      )}
    </div>
  );
}

export function DragWordsWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: DragWordsElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const segments = blanksSegments(el.text);
  const values = Array.isArray(answer) ? answer : [];
  const expected = extractBlankAnswers(el.text);
  const choices = [...new Set(expected)];
  const filled = expected.length > 0 && expected.every((_, i) => (values[i] ?? '').trim().length > 0);
  const correct = expected.every((exp, i) => (values[i] ?? '').trim().toLowerCase() === exp.toLowerCase());
  return (
    <div className="pv-quiz">
      <p className="pv-blanks">
        {segments.map((seg, idx) => {
          if (!seg.gap) return <span key={seg.key}>{seg.value}</span>;
          const gi = segments.slice(0, idx).filter((s) => s.gap).length;
          return (
            <select
              key={seg.key}
              className="pv-gap"
              value={values[gi] ?? ''}
              aria-label={`Kata ${gi + 1}`}
              onChange={(e) => {
                const next = [...values];
                next[gi] = e.target.value;
                onAnswer(el.id, next);
              }}
            >
              <option value="">…</option>
              {choices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          );
        })}
      </p>
      {showSolution && filled && (
        <p className={`pv-feedback ${correct ? 'ok' : 'bad'}`}>
          {correct ? el.feedbackCorrect : el.feedbackWrong}
        </p>
      )}
    </div>
  );
}

export function MarkWordsWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: MarkWordsElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const tokens = markWordTokens(el.text);
  const marked = new Set(Array.isArray(answer) ? answer : []);
  const toggle = (index: number) => {
    const key = String(index);
    const next = new Set(marked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onAnswer(el.id, [...next]);
  };
  const expected = tokens.map((t, i) => (t.marked ? String(i) : null)).filter((v): v is string => v !== null);
  const correct =
    marked.size === expected.length && [...marked].every((v) => expected.includes(v));
  return (
    <div className="pv-quiz">
      <p className="pv-mark-text">
        {tokens.map((token, i) => (
          <button
            key={`${token.word}-${i}`}
            type="button"
            className={`pv-mark-word ${marked.has(String(i)) ? 'marked' : ''}`}
            onClick={() => toggle(i)}
          >
            {token.word}
          </button>
        ))}
      </p>
      {showSolution && marked.size > 0 && (
        <p className={`pv-feedback ${correct ? 'ok' : 'bad'}`}>
          {correct ? el.feedbackCorrect : el.feedbackWrong}
        </p>
      )}
    </div>
  );
}

export function DragDropWidget({
  el,
  answer,
  onAnswer,
}: {
  el: DragDropElement;
  answer: Answer;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const values = Array.isArray(answer) ? answer : [];
  const setValue = (index: number, zoneId: string) => {
    const next = [...values];
    next[index] = zoneId;
    onAnswer(el.id, next);
  };
  return (
    <div className="pv-quiz">
      <p className="pv-question">{el.question}</p>
      <div className="pv-drag-list">
        {el.items.map((item, i) => (
          <div className="pv-drag-item" key={item.id}>
            <span>{item.text}</span>
            <select
              value={values[i] ?? ''}
              aria-label={`Zona untuk ${item.text}`}
              onChange={(e) => setValue(i, e.target.value)}
            >
              <option value="">Pilih zona…</option>
              {el.zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryWidget({
  el,
  answer,
  showSolution,
  onAnswer,
}: {
  el: SummaryElement;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
}) {
  const picked = Array.isArray(answer) ? answer[0] : undefined;
  const chosen = el.statements.find((s) => s.id === picked);
  return (
    <div className="pv-quiz">
      <p className="pv-question">{el.intro}</p>
      <div className="pv-options">
        {el.statements.map((st) => (
          <button
            key={st.id}
            type="button"
            className={`pv-tf ${picked === st.id ? 'chosen' : ''}`}
            onClick={() => onAnswer(el.id, [st.id])}
          >
            {st.text}
          </button>
        ))}
      </div>
      {showSolution && chosen && (
        <p className={`pv-feedback ${chosen.correct ? 'ok' : 'bad'}`}>
          {chosen.correct ? el.feedbackCorrect : el.feedbackWrong}
        </p>
      )}
    </div>
  );
}

export function DialogCardsWidget({ el }: { el: DialogCardsElement }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  return (
    <div className="pv-quiz">
      {el.description && <p className="pv-question">{el.description}</p>}
      <div className="pv-card-grid">
        {el.cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`pv-card ${flipped[card.id] ? 'flipped' : ''}`}
            onClick={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
          >
            {flipped[card.id] ? card.back : card.front}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TableWidget({ el }: { el: TableElement }) {
  const rows = Math.max(1, Math.min(20, Math.round(el.rows)));
  const cols = Math.max(1, Math.min(20, Math.round(el.cols)));
  return (
    <table className="pv-table">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}>&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ExportableTextWidget({ el }: { el: ExportableTextElement }) {
  return (
    <div className="pv-quiz">
      <p className="pv-text">{el.text}</p>
      <textarea rows={4} className="pv-export-area" placeholder="Tulis jawabanmu di sini…" />
    </div>
  );
}

export function AudioRecorderWidget({ el }: { el: AudioRecorderElement }) {
  return (
    <div className="pv-placeholder">
      [Audio Recorder] {el.description || el.title || 'Rekam suara Anda'} — perekaman aktif saat dijalankan di LMS.
    </div>
  );
}
