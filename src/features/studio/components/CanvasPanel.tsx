import { useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import type { Slide, SlideElement } from '../constants/h5pModel';

function elementLabel(el: SlideElement): string {
  switch (el.kind) {
    case 'goToSlide':
      return el.label || 'Tombol pilihan';
    case 'advancedText':
      return el.text.slice(0, 28) || 'Tulisan';
    case 'image':
      return el.fileName || 'Gambar';
    case 'audio':
      return el.fileName || 'Suara';
    case 'multiChoice':
    case 'trueFalse':
      return el.question.slice(0, 28) || 'Kuis';
    case 'blanks':
      return el.text.slice(0, 28) || 'Isian';
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

export function CanvasPanel({ slide, total, selectedElementId, activeSurface, onSelectElement, onMoveElement, onPrev, onNext }: CanvasPanelProps) {
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
      <div className="canvas-toolbar">
        <div className="toolbar-breadcrumb">
          <span>Slide {slide.order}</span>
          <ChevronDownIcon />
          <span className="muted">{slide.title}</span>
        </div>
        <div className="toolbar-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Slide sebelumnya"
            title={activeSurface ? 'Terkunci — peserta harus klik tombol di slide' : 'Slide sebelumnya'}
            disabled={slide.order === 1}
            onClick={onPrev}
          >
            <ArrowLeftIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Slide berikutnya"
            title={activeSurface ? 'Terkunci — peserta harus klik tombol di slide' : 'Slide berikutnya'}
            disabled={slide.order === total}
            onClick={onNext}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <div className="canvas-wrap">
        <div
          className={`slide-canvas ${slide.backgroundUrl ? '' : `tone-${slide.tone}`}`}
          onClick={() => onSelectElement(null)}
        >
          {slide.backgroundUrl && <img className="canvas-bg" src={slide.backgroundUrl} alt="" />}
          <div className="canvas-grid" aria-hidden="true"></div>
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
          {slide.elements.length === 0 && (
            <div className="canvas-caption">Tambah tombol pilihan, tulisan, atau kuis dari panel kiri.</div>
          )}
          <span className="canvas-page">{String(slide.order).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="canvas-status">
        <span>
          <span className="status-dot"></span> Ukuran {slide.aspect}
          {activeSurface ? ' · Tombol next/back dimatikan' : ''}
        </span>
        <span>{slide.elements.length} isi interaktif</span>
        <span className="status-right">100%</span>
      </div>
    </div>
  );
}
