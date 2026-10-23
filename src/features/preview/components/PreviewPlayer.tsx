/**
 * Tahap 4 — Live Player Preview (FR-10, UAT-02/03).
 * Simulasi perilaku Course Presentation: hotspot melompat,
 * kuis menjawab + skor, dan slide ringkasan akhir.
 */
import { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import {
  extractBlankAnswers,
  markWordTokens,
  maxScoreOf,
} from '../../studio/constants/h5pModel';
import type {
  AudioRecorderElement,
  BlanksElement,
  DialogCardsElement,
  DragDropElement,
  DragWordsElement,
  ExportableTextElement,
  MarkWordsElement,
  MultiChoiceElement,
  MultimediaChoiceElement,
  Project,
  SlideElement,
  SummaryElement,
  TableElement,
  TrueFalseElement,
} from '../../studio/constants/h5pModel';
import { resolveTarget, usePreviewRun } from '../hooks/usePreviewRun';

type Answer = string[] | boolean | null;

function blanksSegments(text: string): Array<{ key: number; gap: boolean; value: string }> {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((p, i) => {
      const m = p.match(/^\*([^*]+)\*$/);
      return m ? { key: i, gap: true, value: m[1] } : { key: i, gap: false, value: p };
    });
}

function McWidget({
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

function TfWidget({
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

function BlanksWidget({
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

function DragWordsWidget({
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

function MarkWordsWidget({
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

function DragDropWidget({
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

function SummaryWidget({
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

function DialogCardsWidget({ el }: { el: DialogCardsElement }) {
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

function TableWidget({ el }: { el: TableElement }) {
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

function ExportableTextWidget({ el }: { el: ExportableTextElement }) {
  return (
    <div className="pv-quiz">
      <p className="pv-text">{el.text}</p>
      <textarea rows={4} className="pv-export-area" placeholder="Tulis jawabanmu di sini…" />
    </div>
  );
}

function AudioRecorderWidget({ el }: { el: AudioRecorderElement }) {
  return (
    <div className="pv-placeholder">
      [Audio Recorder] {el.description || el.title || 'Rekam suara Anda'} — perekaman aktif saat dijalankan di LMS.
    </div>
  );
}

function quizLabel(el: SlideElement): string {
  if (el.kind === 'summary') return el.intro || 'Summary';
  if ('question' in el) return el.question;
  if ('text' in el) return el.text;
  return el.title || el.kind;
}

export function PreviewPlayer({ project }: { project: Project }) {
  const run = usePreviewRun(project);
  const [popupId, setPopupId] = useState<string | null>(null);
  const { state, actions } = run;
  const slide = project.slides[state.index];
  const popupEl = slide?.elements.find((e) => e.id === popupId) ?? null;

  if (!slide) return <p className="muted">Belum ada slide buat dicoba.</p>;

  const quizProps = (el: SlideElement) => ({
    answer: (state.answers[el.id] as string[] | boolean | undefined) ?? null,
    showSolution: project.settings.showSolutionButton,
    onAnswer: actions.answer,
  });

  const renderElement = (el: SlideElement) => {
    if (el.kind === 'goToSlide') {
      const target = resolveTarget(el, state.index, state.total);
      return (
        <button
          key={el.id}
          type="button"
          className={`pv-hotspot ${el.invisible ? 'ghost' : ''}`}
          onClick={() => {
            actions.goTo(target);
            setPopupId(null);
          }}
        >
          {el.invisible ? <span className="pv-ghost-hint">Area klik → Slide {target + 1}</span> : el.label}
        </button>
      );
    }
    if (el.kind === 'advancedText') return <div key={el.id} className="pv-text">{el.text}</div>;
    if (el.kind === 'link') {
      return (
        <a key={el.id} href={el.url} target="_blank" rel="noreferrer" className="pv-link" style={{ color: '#16a34a', textDecoration: 'underline' }}>
          {el.linkText || el.url}
        </a>
      );
    }
    if (el.kind === 'shape') {
      const isCircle = el.shapeType === 'circle';
      const isVertical = el.shapeType === 'vertical-line';
      const isHorizontal = el.shapeType === 'horizontal-line';
      const color = el.color || '#22c55e';
      return (
        <div
          key={el.id}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVertical || isHorizontal ? (
            <div
              style={{
                width: isVertical ? '4px' : '100%',
                height: isHorizontal ? '4px' : '100%',
                backgroundColor: color,
                borderRadius: '2px',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: color,
                borderRadius: isCircle ? '50%' : '6px',
              }}
            />
          )}
        </div>
      );
    }
    if (el.kind === 'video') {
      return el.objectUrl || el.videoUrl ? (
        <video key={el.id} controls src={el.objectUrl || el.videoUrl} style={{ width: '100%', maxHeight: '100%', borderRadius: '6px' }} />
      ) : (
        <div key={el.id} className="pv-placeholder">[Video: {el.fileName || el.videoUrl || 'belum ada video'}]</div>
      );
    }
    if (el.kind === 'image') {
      return el.objectUrl ? (
        <img key={el.id} className="pv-image" src={el.objectUrl} alt={el.alt} />
      ) : (
        <div key={el.id} className="pv-placeholder">[Gambar: {el.fileName || 'belum ada file-nya'}]</div>
      );
    }
    if (el.kind === 'audio') {
      return el.objectUrl ? (
        <audio key={el.id} className="pv-audio" controls src={el.objectUrl}></audio>
      ) : (
        <div key={el.id} className="pv-placeholder">[Suara: {el.fileName || 'belum ada file-nya'}]</div>
      );
    }
    if (el.kind === 'multiChoice') return <McWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'singleChoice') {
      return (
        <McWidget
          key={el.id}
          el={{ ...el, kind: 'multiChoice', singleAnswer: true }}
          {...quizProps(el)}
        />
      );
    }
    if (el.kind === 'multimediaChoice') {
      const mmc = el as MultimediaChoiceElement;
      return (
        <McWidget
          key={el.id}
          el={{ ...mmc, kind: 'multiChoice', singleAnswer: false }}
          {...quizProps(el)}
        />
      );
    }
    if (el.kind === 'trueFalse') return <TfWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'blanks') return <BlanksWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'dragWords') return <DragWordsWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'markWords') return <MarkWordsWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'dragDrop') return <DragDropWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'summary') return <SummaryWidget key={el.id} el={el} {...quizProps(el)} />;
    if (el.kind === 'dialogCards') return <DialogCardsWidget key={el.id} el={el} />;
    if (el.kind === 'table') return <TableWidget key={el.id} el={el} />;
    if (el.kind === 'continuousText') return <div key={el.id} className="pv-text">{el.text}</div>;
    if (el.kind === 'exportableText') return <ExportableTextWidget key={el.id} el={el} />;
    if (el.kind === 'audioRecorder') return <AudioRecorderWidget key={el.id} el={el} />;
    if (el.kind === 'interactiveVideo') {
      return el.videoUrl ? (
        <video
          key={el.id}
          controls
          src={el.videoUrl}
          style={{ width: '100%', maxHeight: '100%', borderRadius: '6px' }}
        />
      ) : (
        <div key={el.id} className="pv-placeholder">
          [Interactive Video: belum ada URL video]
        </div>
      );
    }
    return null;
  };

  const inlineEls = slide.elements.filter((e) => !e.displayAsButton || e.kind === 'goToSlide');
  const popupEls = slide.elements.filter((e) => e.displayAsButton && e.kind !== 'goToSlide');

  return (
    <div className="pv-shell">
      {state.finished && state.showSummary ? (
        <div className="pv-summary">
          <p className="section-kicker">Nilai akhir</p>
          <h2>
            Nilai: {state.obtained} dari {state.maxScore}
          </h2>
          <p className="muted">
            {state.maxScore === 0
              ? 'Materi ini belum ada kuisnya.'
              : state.obtained / Math.max(1, state.maxScore) >= 0.7
                ? 'Lulus! Materinya sudah paham.'
                : 'Belum lulus, pelajari lagi materinya lalu coba lagi ya.'}
          </p>
          <div className="pv-summary-list">
            {state.quizzes.map(({ slide: s, el }) => {
              const got = actions.scoreElement(el, state.answers[el.id] ?? null);
              const max = maxScoreOf(el);
              const label = quizLabel(el);
              return (
                <div className="pv-summary-row" key={el.id}>
                  <span>
                    Slide {s.order} — {label.slice(0, 48)}
                  </span>
                  <strong>
                    {got}/{max}
                  </strong>
                </div>
              );
            })}
          </div>
          <div className="pv-actions">
            {project.settings.retryButton && (
              <button className="primary-button" type="button" onClick={actions.reset}>
                Coba lagi dari awal
              </button>
            )}
            <button className="secondary-button" type="button" onClick={() => actions.setFinished(false)}>
              Kembali ke slide
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={`pv-screen tone-${slide.tone}`}>
            {slide.backgroundUrl && <img className="canvas-bg" src={slide.backgroundUrl} alt="" />}
            {inlineEls.map((el) => (
              <div
                key={el.id}
                className="pv-absolute"
                style={{
                  left: `${el.position.x}%`,
                  top: `${el.position.y}%`,
                  width: `${el.position.width}%`,
                  height: el.kind === 'shape' ? `${el.position.height}%` : undefined,
                }}
              >
                {renderElement(el)}
              </div>
            ))}
            {popupEls.length > 0 && (
              <div className="pv-popup-bar">
                {popupEls.map((el) => (
                  <button key={el.id} type="button" className="pv-popup-btn" onClick={() => setPopupId(el.id)}>
                    {el.buttonLabel || el.title || 'Buka'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {popupEl && (
            <div className="pv-overlay" onClick={() => setPopupId(null)}>
              <div className="pv-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="pv-dialog-head">
                  <strong>{popupEl.buttonLabel || popupEl.title || 'Isi'}</strong>
                  <button type="button" aria-label="Tutup" onClick={() => setPopupId(null)}>
                    <Cross2Icon />
                  </button>
                </div>
                {renderElement(popupEl)}
              </div>
            </div>
          )}
          <div className="pv-footer">
            <span>
              Slide {state.index + 1} dari {state.total} · Nilai sementara {state.obtained}/{state.maxScore}
            </span>
            <div className="pv-nav">
              {!state.activeSurface && (
                <>
                  <button className="circle-button" type="button" disabled={state.index === 0} onClick={() => actions.goTo(state.index - 1)} aria-label="Sebelumnya">
                    <ArrowLeftIcon />
                  </button>
                  <button
                    className="circle-button filled"
                    type="button"
                    disabled={state.index === state.total - 1}
                    onClick={() => actions.goTo(state.index + 1)}
                    aria-label="Berikutnya"
                  >
                    <ArrowRightIcon />
                  </button>
                </>
              )}
              {state.showSummary && (
                <button className="secondary-button" type="button" onClick={() => actions.setFinished(true)}>
                  Lihat nilai akhir
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
