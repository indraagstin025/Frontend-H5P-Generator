import type { JSX } from 'react';
import type { MultimediaChoiceElement, SlideElement } from '../../../studio/constants/h5pModel';
import { resolveTarget } from '../../hooks/usePreviewRun';
import type { Answer } from './types';
import {
  AudioRecorderWidget,
  BlanksWidget,
  DialogCardsWidget,
  DragDropWidget,
  DragWordsWidget,
  ExportableTextWidget,
  MarkWordsWidget,
  McWidget,
  SummaryWidget,
  TableWidget,
  TfWidget,
} from './QuizWidgets';

interface SlideElementRendererProps {
  el: SlideElement;
  currentIndex: number;
  totalSlides: number;
  answer: Answer;
  showSolution: boolean;
  onAnswer: (id: string, value: string[] | boolean) => void;
  onGoTo: (targetSlide: number) => void;
  onClosePopup?: () => void;
}

export function SlideElementRenderer({
  el,
  currentIndex,
  totalSlides,
  answer,
  showSolution,
  onAnswer,
  onGoTo,
  onClosePopup,
}: SlideElementRendererProps): JSX.Element | null {
  const quizProps = {
    answer,
    showSolution,
    onAnswer,
  };

  if (el.kind === 'goToSlide') {
    const target = resolveTarget(el, currentIndex, totalSlides);
    return (
      <button
        key={el.id}
        type="button"
        className={`pv-hotspot ${el.invisible ? 'ghost' : ''}`}
        onClick={() => {
          onGoTo(target);
          onClosePopup?.();
        }}
      >
        {el.invisible ? <span className="pv-ghost-hint">Area klik → Slide {target + 1}</span> : el.label}
      </button>
    );
  }

  if (el.kind === 'advancedText') {
    return <div key={el.id} className="pv-text">{el.text}</div>;
  }

  if (el.kind === 'link') {
    return (
      <a
        key={el.id}
        href={el.url}
        target="_blank"
        rel="noreferrer"
        className="pv-link"
        style={{ color: '#16a34a', textDecoration: 'underline' }}
      >
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
      <video
        key={el.id}
        controls
        src={el.objectUrl || el.videoUrl}
        style={{ width: '100%', maxHeight: '100%', borderRadius: '6px' }}
      />
    ) : (
      <div key={el.id} className="pv-placeholder">
        [Video: {el.fileName || el.videoUrl || 'belum ada video'}]
      </div>
    );
  }

  if (el.kind === 'image') {
    return el.objectUrl ? (
      <img key={el.id} className="pv-image" src={el.objectUrl} alt={el.alt} />
    ) : (
      <div key={el.id} className="pv-placeholder">
        [Gambar: {el.fileName || 'belum ada file-nya'}]
      </div>
    );
  }

  if (el.kind === 'audio') {
    return el.objectUrl ? (
      <audio key={el.id} className="pv-audio" controls src={el.objectUrl}></audio>
    ) : (
      <div key={el.id} className="pv-placeholder">
        [Suara: {el.fileName || 'belum ada file-nya'}]
      </div>
    );
  }

  if (el.kind === 'multiChoice') {
    return <McWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'singleChoice') {
    return (
      <McWidget
        key={el.id}
        el={{ ...el, kind: 'multiChoice', singleAnswer: true }}
        {...quizProps}
      />
    );
  }

  if (el.kind === 'multimediaChoice') {
    const mmc = el as MultimediaChoiceElement;
    return (
      <McWidget
        key={el.id}
        el={{ ...mmc, kind: 'multiChoice', singleAnswer: false }}
        {...quizProps}
      />
    );
  }

  if (el.kind === 'trueFalse') {
    return <TfWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'blanks') {
    return <BlanksWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'dragWords') {
    return <DragWordsWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'markWords') {
    return <MarkWordsWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'dragDrop') {
    return <DragDropWidget key={el.id} el={el} answer={answer} onAnswer={onAnswer} />;
  }

  if (el.kind === 'summary') {
    return <SummaryWidget key={el.id} el={el} {...quizProps} />;
  }

  if (el.kind === 'dialogCards') {
    return <DialogCardsWidget key={el.id} el={el} />;
  }

  if (el.kind === 'table') {
    return <TableWidget key={el.id} el={el} />;
  }

  if (el.kind === 'continuousText') {
    return <div key={el.id} className="pv-text">{el.text}</div>;
  }

  if (el.kind === 'exportableText') {
    return <ExportableTextWidget key={el.id} el={el} />;
  }

  if (el.kind === 'audioRecorder') {
    return <AudioRecorderWidget key={el.id} el={el} />;
  }

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
}
