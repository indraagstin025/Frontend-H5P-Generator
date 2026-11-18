import { useEffect, useRef, useState } from 'react';
import { ResetIcon } from '@radix-ui/react-icons';
import type { ElementPosition, Project, Slide, SlideElement } from '../constants/h5pModel';
import { resizeElement, type ResizeCorner } from '../utils/resizeElement';
import { ElementPreviewDialog } from './ElementPreviewDialog';
import './CanvasShapes.css';

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

function renderElementContent(el: SlideElement) {
  if (el.displayAsButton) {
    return (
      <div className="canvas-button-preview">
        <span className="canvas-btn-icon">🔘</span>
        <span className="canvas-element-label">{el.buttonLabel || elementLabel(el)}</span>
        <span className="canvas-element-badge">pop-up</span>
      </div>
    );
  }

  switch (el.kind) {
    case 'image':
      if (el.objectUrl) {
        return (
          <img
            src={el.objectUrl}
            alt={el.alt || 'Gambar'}
            className="canvas-image-preview"
            draggable={false}
          />
        );
      }
      return (
        <div className="canvas-placeholder-preview">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="canvas-element-label">{el.fileName || 'Pilih Gambar'}</span>
        </div>
      );

    case 'video':
      return (
        <div className="canvas-video-preview">
          {el.objectUrl ? (
            <video src={el.objectUrl} className="canvas-video-media" muted preload="metadata" />
          ) : (
            <div className="canvas-video-mockup">
              <span className="canvas-play-icon">▶</span>
              <span className="canvas-video-name">{el.fileName || el.videoUrl || 'Video'}</span>
            </div>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="canvas-audio-preview">
          <span className="canvas-audio-icon">🔊</span>
          <span className="canvas-element-label">{el.fileName || 'Audio'}</span>
        </div>
      );

    case 'shape':
      return (
        <div
          className={'canvas-shape-preview shape-' + el.shapeType}
          style={{
            backgroundColor: el.color || 'var(--hs-green)',
            borderRadius: el.shapeType === 'circle' ? '50%' : '4px',
          }}
        />
      );

    case 'advancedText':
      return (
        <div className="canvas-text-preview" style={{ fontSize: el.fontSize ?? 13 }}>
          {el.text ? (
            <span className="canvas-text-body">{el.text}</span>
          ) : (
            <span className="canvas-text-placeholder">Ketik teks di sini...</span>
          )}
        </div>
      );

    case 'link':
      return (
        <div className="canvas-link-preview">
          <span className="canvas-link-icon">🔗</span>
          <span className="canvas-link-text">{el.linkText || el.url || 'Link'}</span>
        </div>
      );

    case 'goToSlide':
      return (
        <div className={'canvas-goto-preview ' + (el.invisible ? 'is-invisible' : '')}>
          <span className="canvas-goto-icon">👉</span>
          <span className="canvas-goto-label">{el.label || ('Ke Slide ' + el.targetSlide)}</span>
        </div>
      );

    default:
      return (
        <>
          <span className="canvas-element-label">{elementLabel(el)}</span>
          {el.displayAsButton && <span className="canvas-element-badge">pop-up</span>}
        </>
      );
  }
}

type CanvasPanelProps = {
  project: Project;
  slide: Slide;
  total: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, position: ElementPosition) => void;
  onRotateElement: (id: string, rotation: number) => void;
  onChangeText: (id: string, text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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

export function CanvasPanel({
  project,
  slide,
  total,
  selectedElementId,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onRotateElement,
  onChangeText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPrev,
  onNext,
}: CanvasPanelProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<{ slideId: string; elementId: string } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(680);
  const viewportRef = useRef<HTMLDivElement>(null);
  const aspect = slide.aspect === '4:3' ? 4 / 3 : 16 / 9;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      setFitWidth(Math.max(1, Math.min(960, viewport.clientWidth - 32, (viewport.clientHeight - 32) * aspect)));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [aspect]);
  const [preview, setPreview] = useState<{ slideId: string; elementId: string } | null>(null);
  const previewElement = preview?.slideId === slide.id
    ? slide.elements.find((el) => el.id === preview.elementId && el.displayAsButton && el.kind !== 'goToSlide')
    : undefined;
  const selectedPopup = slide.elements.find((el) => el.id === selectedElementId && el.displayAsButton && el.kind !== 'goToSlide');
  const drag = useRef<DragState | null>(null);
  const justDragged = useRef(false);
  const resize = useRef<{ id: string; pointerId: number; x: number; y: number; start: ElementPosition; corner: ResizeCorner; canvasWidth: number; canvasHeight: number; preserveRatio: boolean; rotation: number } | null>(null);
  const selected = slide.elements.find((el) => el.id === selectedElementId);
  const rotate = useRef<{ id: string; pointerId: number; centerX: number; centerY: number; startAngle: number; rotation: number } | null>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let distance: number | null = null;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
      setZoom((value) => Math.max(25, Math.min(300, value * Math.exp(-delta * .01))));
    };
    const touchDistance = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) { distance = null; return; }
      event.preventDefault();
      distance = touchDistance(event.touches);
      drag.current = null;
      resize.current = null;
      rotate.current = null;
      setDragId(null);
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 2 || distance === null) return;
      event.preventDefault();
      const next = touchDistance(event.touches);
      const ratio = distance > 0 ? next / distance : 1;
      distance = next;
      setZoom((value) => Math.max(25, Math.min(300, value * ratio)));
    };
    const end = () => { distance = null; };
    viewport.addEventListener('wheel', wheel, { passive: false });
    viewport.addEventListener('touchstart', start, { passive: false });
    viewport.addEventListener('touchmove', move, { passive: false });
    viewport.addEventListener('touchend', end);
    viewport.addEventListener('touchcancel', end);
    return () => {
      viewport.removeEventListener('wheel', wheel);
      viewport.removeEventListener('touchstart', start);
      viewport.removeEventListener('touchmove', move);
      viewport.removeEventListener('touchend', end);
      viewport.removeEventListener('touchcancel', end);
    };
  }, []);
  const startRotate = (el: SlideElement) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const bounds = event.currentTarget.closest('.slide-canvas')?.getBoundingClientRect();
    if (!bounds) return;
    const centerX = bounds.left + (el.position.x + el.position.width / 2) / 100 * bounds.width;
    const centerY = bounds.top + (el.position.y + el.position.height / 2) / 100 * bounds.height;
    rotate.current = { id: el.id, pointerId: event.pointerId, centerX, centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX), rotation: el.rotation ?? 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveRotate = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = rotate.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const delta = Math.atan2(event.clientY - current.centerY, event.clientX - current.centerX) - current.startAngle;
    let angle = current.rotation + delta * 180 / Math.PI;
    if (event.shiftKey) angle = Math.round(angle / 15) * 15;
    else {
      const normalized = ((angle % 360) + 360) % 360;
      for (const target of [0, 90, 180]) {
        const distance = Math.abs(normalized - target);
        if (Math.min(distance, 360 - distance) <= 2) {
          angle = target;
          break;
        }
      }
    }
    onRotateElement(current.id, ((Math.round(angle) % 360) + 360) % 360);
  };
  const endRotate = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (rotate.current?.pointerId !== event.pointerId) return;
    event.stopPropagation(); rotate.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const startResize = (el: SlideElement, corner: ResizeCorner) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.closest('.slide-canvas')?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    drag.current = null;
    resize.current = { id: el.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      start: { ...el.position }, corner, canvasWidth: bounds.width, canvasHeight: bounds.height, preserveRatio: el.kind === 'image', rotation: el.rotation ?? 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = resize.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    onResizeElement(current.id, resizeElement(current.start,
      (event.clientX - current.x) / current.canvasWidth * 100,
      (event.clientY - current.y) / current.canvasHeight * 100, current.corner, current.preserveRatio, current.rotation, current.canvasWidth / current.canvasHeight));
  };

  const endResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (resize.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    resize.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

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
      <div className="st-canvas-interaction-tools">
        <div className="hs-history-actions" role="group" aria-label="Riwayat perubahan">
          <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Urungkan perubahan"><ResetIcon aria-hidden="true" /></button>
          <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Ulangi perubahan"><ResetIcon aria-hidden="true" style={{ transform: 'scaleX(-1)' }} /></button>
        </div>
        <span>Klik dua kali tombol untuk mencoba interaksi.</span>
        <div className="canvas-zoom-controls" role="group" aria-label="Zoom canvas">
          <button type="button" aria-label="Perkecil slide" disabled={zoom <= 25} onClick={() => setZoom((value) => Math.max(25, value - 25))}>−</button>
          <button type="button" className="canvas-zoom-value" aria-label={`Zoom ${Math.round(zoom)} persen, klik untuk menyesuaikan ke area canvas`} title="Sesuaikan ke area canvas" onClick={() => setZoom(100)}>{Math.round(zoom)}%</button>
          <button type="button" aria-label="Perbesar slide" disabled={zoom >= 300} onClick={() => setZoom((value) => Math.min(300, value + 25))}>+</button>
        </div>
        {selectedPopup && <button type="button" className="secondary-button" onClick={() => setPreview({ slideId: slide.id, elementId: selectedPopup.id })}>Coba interaksi</button>}
      </div>
      <div className="canvas-wrap" ref={viewportRef}>
        <div className="canvas-zoom-stage" style={{ width: fitWidth * zoom / 100, height: fitWidth / aspect * zoom / 100 }}>
        <div
          className={`slide-canvas ${slide.backgroundUrl ? '' : `tone-${slide.tone}`}`}
          style={{ width: fitWidth, height: fitWidth / aspect, transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          onClick={() => { setEditingText(null); onSelectElement(null); }}
        >
          {slide.backgroundUrl && <img className="canvas-bg" src={slide.backgroundUrl} alt="" />}
          {slide.chapter && <div className="canvas-grid" aria-hidden="true"></div>}

          {!slide.backgroundUrl && slide.chapter && (
            <div className="canvas-slide-content">
              {slide.chapter && (
                <div className="canvas-chapter-badge">
                  {slide.chapter}
                </div>
              )}
              <div className="canvas-accent-bar" />
              <div className="canvas-headline">{slide.title}</div>
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
              aria-label={elementLabel(el)}
              className={`canvas-element kind-${el.kind} ${el.displayAsButton && el.kind !== 'goToSlide' ? 'is-popup-trigger' : ''} ${selectedElementId === el.id ? 'selected' : ''} ${el.kind === 'goToSlide' && el.invisible ? 'is-invisible' : ''} ${dragId === el.id ? 'st-drag' : ''}`}
              style={{
                left: `${el.position.x}%`,
                top: `${el.position.y}%`,
                width: `${el.position.width}%`,
                height: `${el.position.height}%`,
                transform: `rotate(${el.rotation ?? 0}deg)`,
                transformOrigin: 'center',
              }}
              title={`${elementLabel(el)} — geser untuk pindah, panah keyboard untuk presisi`}
              onPointerDown={beginDrag(el)}
              onPointerMove={continueDrag(el)}
              onPointerUp={endDrag(el)}
              onPointerCancel={endDrag(el)}
              onKeyDown={nudge(el)}
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (!justDragged.current && el.displayAsButton && el.kind !== 'goToSlide') {
                  setPreview({ slideId: slide.id, elementId: el.id });
                }
              }}
              onClickCapture={(ev) => {
                if (justDragged.current) {
                  ev.stopPropagation();
                  ev.preventDefault();
                }
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                if (selectedElementId === el.id && el.kind === 'advancedText' && !el.displayAsButton) {
                  setEditingText({ slideId: slide.id, elementId: el.id });
                } else {
                  setEditingText(null);
                }
                onSelectElement(el.id);
              }}
            >
              {el.displayAsButton && el.kind !== 'goToSlide' ? (
                <span
                  className={`st-popup-button-face ${el.popupButtonInvisible ? 'st-popup-button-invisible' : ''}`}
                  style={{
                    opacity: el.popupButtonInvisible
                      ? 0.35
                      : Math.max(0.15, Math.min(100, Math.max(0, el.popupButtonOpacity ?? 100)) / 100),
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 16v2" />
                  </svg>
                  <span>{el.buttonLabel || el.title || elementLabel(el)}</span>
                </span>
              ) : el.kind === 'image' && el.objectUrl ? (
                <img className="st-canvas-image" src={el.objectUrl} alt={el.alt || 'Gambar'} draggable={false} />
              ) : el.kind === 'shape' ? (
                <svg className="st-canvas-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {el.shapeType === 'circle' ? (
                    <ellipse cx="50" cy="50" rx="49" ry="49" fill={el.color} stroke="#1f2937" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  ) : el.shapeType === 'vertical-line' ? (
                    <line x1="50" y1="0" x2="50" y2="100" stroke={el.color} strokeWidth="4" vectorEffect="non-scaling-stroke" />
                  ) : el.shapeType === 'horizontal-line' ? (
                    <line x1="0" y1="50" x2="100" y2="50" stroke={el.color} strokeWidth="4" vectorEffect="non-scaling-stroke" />
                  ) : (
                    <rect x="1" y="1" width="98" height="98" fill={el.color} stroke="#1f2937" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  )}
                </svg>
              ) : (
                renderElementContent(el)
              )}
            </button>
          ))}
          {selected?.kind === 'advancedText' && !selected.displayAsButton
            && editingText?.slideId === slide.id && editingText.elementId === selected.id && (
            <textarea
              key={selected.id}
              autoFocus
              className="st-canvas-text-editor"
              aria-label="Edit teks di canvas"
              value={selected.text}
              placeholder="Ketik teks di sini…"
              style={{ left: `${selected.position.x}%`, top: `${selected.position.y}%`, width: `${selected.position.width}%`, height: `${selected.position.height}%`, transform: `rotate(${selected.rotation ?? 0}deg)`, fontSize: selected.fontSize ?? 13 }}
              onChange={(event) => onChangeText(selected.id, event.target.value)}
              onBlur={() => setEditingText(null)}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setEditingText(null);
                }
              }}
            />
          )}
          {selected && (
            <div className="st-resize-frame" style={{ left: `${selected.position.x}%`, top: `${selected.position.y}%`, width: `${selected.position.width}%`, height: `${selected.position.height}%`, transform: `rotate(${selected.rotation ?? 0}deg)`, transformOrigin: 'center' }}>
              <button type="button" className="st-rotate-handle" aria-label={`Putar ${elementLabel(selected)}`}
                style={{ top: selected.position.y < 8 ? 3 : -36 }}
                title="Tarik untuk memutar; Shift untuk kelipatan 15 derajat"
                onPointerDown={startRotate(selected)} onPointerMove={moveRotate} onPointerUp={endRotate} onPointerCancel={endRotate}
                onLostPointerCapture={() => { rotate.current = null; }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                  event.preventDefault(); event.stopPropagation();
                  onRotateElement(selected.id, ((selected.rotation ?? 0) + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 15 : 1) + 360) % 360);
                }}><span aria-hidden="true">↻</span></button>
              {(['nw', 'ne', 'sw', 'se', 'w', 'e'] as const).map((corner) => (
                <button key={corner} type="button" className={`st-resize-handle st-resize-${corner}`}
                  aria-label={`Ubah ukuran ${elementLabel(selected)} dari ${{ nw: 'sudut kiri atas', ne: 'sudut kanan atas', sw: 'sudut kiri bawah', se: 'sudut kanan bawah', w: 'sisi kiri', e: 'sisi kanan' }[corner]}`}
                  title="Tarik untuk mengubah ukuran; tombol panah untuk presisi"
                  onPointerDown={startResize(selected, corner)} onPointerMove={moveResize}
                  onPointerUp={endResize} onPointerCancel={endResize}
                  onLostPointerCapture={() => { resize.current = null; }}
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    const delta = event.shiftKey ? 5 : 1;
                    const dx = event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0;
                    const dy = event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0;
                    if (!dx && !dy) return;
                    event.preventDefault(); event.stopPropagation();
                    const bounds = event.currentTarget.closest('.slide-canvas')?.getBoundingClientRect();
                    onResizeElement(selected.id, resizeElement(selected.position, dx, dy, corner, selected.kind === 'image', selected.rotation ?? 0, bounds?.height ? bounds.width / bounds.height : 16 / 9));
                  }} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      <div className="canvas-navigation-bar">
        <div className="canvas-nav-left" />
        <div className="canvas-nav-center">
          <button
            type="button"
            className="canvas-nav-btn"
            disabled={slide.order <= 1}
            onClick={onPrev}
            title="Slide sebelumnya"
            aria-label="Slide sebelumnya"
          >
            ←
          </button>
          <span className="canvas-nav-page">
            Slide {slide.order} dari {total}
          </span>
          <button
            type="button"
            className="canvas-nav-btn"
            disabled={slide.order >= total}
            onClick={onNext}
            title="Slide selanjutnya"
            aria-label="Slide selanjutnya"
          >
            →
          </button>
        </div>
        <div className="canvas-nav-right" />
      </div>
      {previewElement && (
        <ElementPreviewDialog project={project} slide={slide} element={previewElement} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
