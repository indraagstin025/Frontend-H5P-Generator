import { useRef, useState } from 'react';
import type { Slide, SlideElement } from '../constants/h5pModel';

function elementLabel(el: SlideElement): string {
  switch (el.kind) {
    case 'goToSlide':
      return el.label || 'Tombol pilihan';
    case 'advancedText':
      return el.text.slice(0, 28) || 'Teks';
    case 'link':
      return el.linkText || el.url.slice(0, 28) || 'Link';
    case 'image':
      return el.fileName || 'Gambar';
    case 'shape':
      return `Shape (${el.shapeType})`;
    case 'video':
      return el.fileName || 'Video';
    case 'audio':
      return el.fileName || 'Suara';
    case 'blanks':
      return el.text.slice(0, 28) || 'Fill in the Blank';
    case 'singleChoice':
      return el.question.slice(0, 28) || 'Single Choice';
    case 'multiChoice':
      return el.question.slice(0, 28) || 'Multiple Choice';
    case 'trueFalse':
      return el.question.slice(0, 28) || 'True/False';
    case 'dragDrop':
      return el.question.slice(0, 28) || 'Drag & Drop';
    case 'summary':
      return 'Summary';
    case 'dragWords':
      return el.text.slice(0, 28) || 'Drag the Words';
    case 'markWords':
      return el.text.slice(0, 28) || 'Mark the Words';
    case 'dialogCards':
      return 'Dialog Cards';
    case 'continuousText':
      return el.text.slice(0, 28) || 'Continuous Text';
    case 'exportableText':
      return el.text.slice(0, 28) || 'Exportable Text';
    case 'table':
      return `Table (${el.rows}x${el.cols})`;
    case 'interactiveVideo':
      return 'Interactive Video';
    case 'audioRecorder':
      return 'Audio Recorder';
    case 'multimediaChoice':
      return el.question.slice(0, 28) || 'Multimedia Choice';
  }
}

type CanvasPanelProps = {
  slide: Slide;
  total: number;
  selectedElementId: string | null;
  activeSurface: boolean;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

type DragState = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  origX: number;
  origY: number;
  moved: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function CanvasPanel({ slide, selectedElementId, onSelectElement, onMoveElement }: CanvasPanelProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const justDragged = useRef(false);

  const beginDrag = (el: SlideElement) => (e: React.PointerEvent<HTMLButtonElement>) => {
    // Tombol mouse kiri / sentuhan saja; klik biasa tetap memilih
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = {
      id: el.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.position.x,
      origY: el.position.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const continueDrag = (el: SlideElement) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== el.id || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (!d.moved && dx * dx + dy * dy < 16) return;
    const canvas = e.currentTarget.closest('.slide-canvas');
    const rect = canvas?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    if (!d.moved) {
      d.moved = true;
      setDragId(el.id);
    }
    onMoveElement(
      el.id,
      clamp(d.origX + (dx / rect.width) * 100, 0, 100 - el.position.width),
      clamp(d.origY + (dy / rect.height) * 100, 0, 100 - el.position.height),
    );
  };

  const endDrag = (el: SlideElement) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== el.id) return;
    drag.current = null;
    setDragId(null);
    if (d.moved) {
      justDragged.current = true;
      window.setTimeout(() => {
        justDragged.current = false;
      }, 0);
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // abaikan — capture kadang sudah lepas sendiri
    }
  };

  const nudge = (el: SlideElement) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 5 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    onMoveElement(
      el.id,
      clamp(el.position.x + dx, 0, 100 - el.position.width),
      clamp(el.position.y + dy, 0, 100 - el.position.height),
    );
  };

  return (
    <div className="canvas-panel">
      <div className="canvas-wrap">
        <div
          className={`slide-canvas ${slide.backgroundUrl ? '' : `tone-${slide.tone}`}`}
          onClick={() => onSelectElement(null)}
        >
          {slide.backgroundUrl && <img className="canvas-bg" src={slide.backgroundUrl} alt="" />}
          <div className="canvas-grid" aria-hidden="true"></div>

          {!slide.backgroundUrl && (
            <div className="canvas-slide-content">
              {slide.chapter && (
                <div className="canvas-chapter-badge">
                  {slide.chapter}
                </div>
              )}
              <div className="canvas-accent-bar" />
              <div className="canvas-headline">
                {slide.order === 1 ? (
                  <>
                    <div className="canvas-headline-row1">Pengenalan</div>
                    <div className="canvas-headline-row2">
                      <span className="canvas-headline-green">Ekosistem</span> H5P
                    </div>
                  </>
                ) : (
                  <div className="canvas-headline-row1">{slide.title}</div>
                )}
              </div>
              <p className="canvas-subheadline">
                {slide.order === 1
                  ? 'Bangun pengalaman belajar yang interaktif, menarik, dan mudah dipahami.'
                  : `Pelajari konsep materi pada slide ${slide.order} ini secara interaktif.`}
              </p>
              <div className="canvas-footer-tag">INTERACTIVE PRESENTATION</div>
            </div>
          )}

          {slide.elements.map((el) => (
            <button
              key={el.id}
              type="button"
              className={`canvas-element kind-${el.kind} ${selectedElementId === el.id ? 'selected' : ''} ${el.kind === 'goToSlide' && el.invisible ? 'is-invisible' : ''} ${dragId === el.id ? 'st-drag' : ''}`}
              style={{
                left: `${el.position.x}%`,
                top: `${el.position.y}%`,
                width: `${el.position.width}%`,
                height: `${el.position.height}%`,
              }}
              title={`${elementLabel(el)} — geser untuk pindah, panah keyboard untuk presisi`}
              onPointerDown={beginDrag(el)}
              onPointerMove={continueDrag(el)}
              onPointerUp={endDrag(el)}
              onPointerCancel={endDrag(el)}
              onKeyDown={nudge(el)}
              onClickCapture={(ev) => {
                if (justDragged.current) {
                  ev.stopPropagation();
                  ev.preventDefault();
                }
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelectElement(el.id);
              }}
            >
              <span className="canvas-element-label">{elementLabel(el)}</span>
              {el.displayAsButton && <span className="canvas-element-badge">pop-up</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
