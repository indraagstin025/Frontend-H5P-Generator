/**
 * Tahap 4 — Live Player Preview (FR-10, UAT-02/03).
 * Simulasi perilaku Course Presentation: hotspot melompat,
 * kuis menjawab + skor, dan slide ringkasan akhir.
 */
import { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import type { Project } from '../../studio/constants/h5pModel';
import { usePreviewRun } from '../hooks/usePreviewRun';
import { PreviewSummary } from './player/PreviewSummary';
import { SlideElementRenderer } from './player/SlideElementRenderer';
import type { Answer } from './player/types';

export function PreviewPlayer({ project }: { project: Project }) {
  const run = usePreviewRun(project);
  const [popupId, setPopupId] = useState<string | null>(null);
  const { state, actions } = run;
  const slide = project.slides[state.index];
  const popupEl = slide?.elements.find((e) => e.id === popupId) ?? null;

  if (!slide) return <p className="muted">Belum ada slide buat dicoba.</p>;

  const inlineEls = slide.elements.filter((e) => !e.displayAsButton || e.kind === 'goToSlide');
  const popupEls = slide.elements.filter((e) => e.displayAsButton && e.kind !== 'goToSlide');

  return (
    <div className="pv-shell">
      {state.finished && state.showSummary ? (
        <PreviewSummary state={state} actions={actions} settings={project.settings} />
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
                <SlideElementRenderer
                  el={el}
                  currentIndex={state.index}
                  totalSlides={state.total}
                  answer={(state.answers[el.id] as Answer | undefined) ?? null}
                  showSolution={project.settings.showSolutionButton}
                  onAnswer={actions.answer}
                  onGoTo={actions.goTo}
                  onClosePopup={() => setPopupId(null)}
                />
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
                <SlideElementRenderer
                  el={popupEl}
                  currentIndex={state.index}
                  totalSlides={state.total}
                  answer={(state.answers[popupEl.id] as Answer | undefined) ?? null}
                  showSolution={project.settings.showSolutionButton}
                  onAnswer={actions.answer}
                  onGoTo={actions.goTo}
                  onClosePopup={() => setPopupId(null)}
                />
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
                  <button
                    className="circle-button"
                    type="button"
                    disabled={state.index === 0}
                    onClick={() => actions.goTo(state.index - 1)}
                    aria-label="Sebelumnya"
                  >
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
