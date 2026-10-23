/**
 * Panel kiri studio: daftar slide vertikal (thumbnail list).
 * Pengguna dapat klik thumbnail untuk memilih slide, drag untuk reorder,
 * duplikat, dan hapus slide.
 */
import { useRef, useState } from 'react';
import { CopyIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import type { Slide } from '../constants/h5pModel';

type StudioLeftPanelProps = {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlide: (id: string, toIndex: number) => void;
};

export function StudioLeftPanel({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlide,
}: StudioLeftPanelProps) {
  const dragId = useRef<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDrop = (toIndex: number) => {
    if (dragId.current) onReorderSlide(dragId.current, toIndex);
    dragId.current = null;
    setDropIndex(null);
  };

  return (
    <aside className="hs-slide-list" aria-label="Daftar slide">
      {/* Header */}
      <div className="hs-slide-list-header">
        <span className="hs-slide-list-label">DAFTAR SLIDE</span>
      </div>

      {/* Daftar slide */}
      <div className="hs-slide-list-items" role="list" aria-label="Daftar slide">
        {slides.length === 0 ? (
          <div className="hs-slide-empty">
            Belum ada slide.<br />Upload file atau tambah slide baru.
          </div>
        ) : (
          slides.map((slide, idx) => (
            <div
              key={slide.id}
              role="listitem"
              className={`hs-slide-item ${activeSlideId === slide.id ? 'active' : ''} ${dropIndex === idx ? 'drop-target' : ''}`}
              draggable
              onDragStart={(e) => {
                dragId.current = slide.id;
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDropIndex(idx);
              }}
              onDragLeave={() => setDropIndex((cur) => (cur === idx ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(idx);
              }}
              onDragEnd={() => {
                dragId.current = null;
                setDropIndex(null);
              }}
            >
              {/* Thumbnail */}
              <button
                type="button"
                className={`hs-slide-thumb ${slide.backgroundUrl ? '' : `tone-${slide.tone}`}`}
                title={`Slide ${slide.order}: ${slide.title}`}
                onClick={() => onSelectSlide(slide.id)}
              >
                {slide.backgroundUrl ? (
                  <img src={slide.backgroundUrl} alt="" />
                ) : (
                  <div className="hs-thumb-minibar" />
                )}
                <span className="hs-slide-num">
                  {String(slide.order).padStart(2, '0')} {slide.title}
                </span>
              </button>

              {/* Aksi slide (hover) */}
              <div className="hs-slide-actions">
                <button
                  type="button"
                  className="hs-slide-action-btn"
                  title="Gandakan slide"
                  aria-label="Gandakan slide"
                  onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id); }}
                >
                  <CopyIcon width={12} height={12} />
                </button>
                <button
                  type="button"
                  className="hs-slide-action-btn danger"
                  title="Hapus slide"
                  aria-label="Hapus slide"
                  disabled={slides.length <= 1}
                  onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
                >
                  <TrashIcon width={12} height={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tombol tambah slide */}
      <button
        type="button"
        className="hs-add-slide-btn"
        onClick={onAddSlide}
        title="Tambah slide baru"
      >
        <PlusIcon width={14} height={14} />
        Tambah slide
      </button>
    </aside>
  );
}
