/**
 * Kolom kanan studio ala panel Canva: tab Konten/Jawaban/Penilaian/
 * Umpan balik untuk kuis, properti slide bila tidak ada yang dipilih,
 * lipatan pengaturan cerita, dan status validasi.
 */
import { useState } from 'react';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  QuizBehaviourFields,
  QuizFeedbackFields,
  QuizQuestionFields,
} from '../../interactions/components/QuizEditor';
import type {
  Project,
  ProjectSettings,
  Slide,
  SlideElement,
} from '../constants/h5pModel';
import { isQuizElement } from '../constants/h5pModel';
import { KIND_LABEL, QUIZ_TABS, type QuizTab } from './properties/constants';
import { ElementContentFields } from './properties/ElementContentFields';
import { StorySettings } from './StorySettings';
import { ValidationPanel } from './ValidationPanel';

type PropertyPanelProps = {
  project: Project;
  slide: Slide | null;
  slides: Slide[];
  element: SlideElement | null;
  settings: ProjectSettings;
  slideCount: number;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onUpdateSlide: (id: string, patch: Partial<Slide>) => void;
  onUpdateKeyword: (slideId: string, main: string) => void;
  onUpdateSettings: (patch: Partial<ProjectSettings>) => void;
  onNotice: (message: string) => void;
};

export function PropertyPanel({
  project,
  slide,
  slides,
  element,
  settings,
  slideCount,
  onUpdateElement,
  onDeleteElement,
  onUpdateSlide,
  onUpdateKeyword,
  onUpdateSettings,
  onNotice,
}: PropertyPanelProps) {
  const [tab, setTab] = useState<QuizTab>('konten');

  if (!slide) {
    return (
      <aside className="st-panel st-right" aria-label="Properti">
        <p className="muted">Belum ada slide. Upload file atau tambah slide baru.</p>
      </aside>
    );
  }

  const quiz = element && isQuizElement(element) ? element : null;

  return (
    <aside className="st-panel st-right" aria-label="Properti">
      <div className="st-panel-head">
        <h2 className="st-title">Properti {element ? 'Interaksi' : 'Slide'}</h2>
        {element ? (
          <>
            <span className="st-badge">{KIND_LABEL[element.kind]}</span>
            <button
              className="small-icon-button danger"
              type="button"
              aria-label="Hapus elemen"
              title="Hapus elemen"
              onClick={() => onDeleteElement(element.id)}
            >
              <TrashIcon />
            </button>
          </>
        ) : null}
      </div>

      {quiz && (
        <div
          role="tablist"
          aria-label="Bagian properti"
          className="st-tabs"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const order: QuizTab[] = ['konten', 'jawaban', 'penilaian', 'umpanbalik'];
            const idx = order.indexOf(tab);
            const next = order[(idx + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
            setTab(next);
          }}
        >
          {QUIZ_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="st-tab"
              aria-selected={tab === t.id}
              aria-controls={`st-panel-${t.id}`}
              id={`st-tab-${t.id}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="inspector-body">
        {(!quiz || tab === 'konten') && (
          <ElementContentFields
            slide={slide}
            slides={slides}
            element={element}
            onUpdateElement={onUpdateElement}
            onUpdateSlide={onUpdateSlide}
            onUpdateKeyword={onUpdateKeyword}
            onNotice={onNotice}
          />
        )}
        {quiz && tab === 'jawaban' && (
          <div role="tabpanel" id="st-panel-jawaban" aria-labelledby="st-tab-jawaban">
            <QuizQuestionFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
        {quiz && tab === 'penilaian' && (
          <div role="tabpanel" id="st-panel-penilaian" aria-labelledby="st-tab-penilaian">
            <QuizBehaviourFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
        {quiz && tab === 'umpanbalik' && (
          <div role="tabpanel" id="st-panel-umpanbalik" aria-labelledby="st-tab-umpanbalik">
            <QuizFeedbackFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
      </div>

      <hr className="st-divider" />
      <details>
        <summary className="st-settings-toggle">Pengaturan cerita</summary>
        <div className="st-settings-body">
          <StorySettings settings={settings} slideCount={slideCount} onChange={onUpdateSettings} />
        </div>
      </details>

      <hr className="st-divider" />
      <ValidationPanel project={project} />
    </aside>
  );
}
