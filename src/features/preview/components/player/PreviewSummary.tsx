import { maxScoreOf } from '../../../studio/constants/h5pModel';
import type { PreviewRun } from '../../hooks/usePreviewRun';
import { quizLabel } from './types';

interface PreviewSummaryProps {
  state: PreviewRun['state'];
  actions: PreviewRun['actions'];
  settings: {
    retryButton?: boolean;
  };
}

export function PreviewSummary({ state, actions, settings }: PreviewSummaryProps) {
  return (
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
        {settings.retryButton && (
          <button className="primary-button" type="button" onClick={actions.reset}>
            Coba lagi dari awal
          </button>
        )}
        <button className="secondary-button" type="button" onClick={() => actions.setFinished(false)}>
          Kembali ke slide
        </button>
      </div>
    </div>
  );
}
