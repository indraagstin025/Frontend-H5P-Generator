/**
 * Kolom kiri studio: palet tambah interaksi + daftar slide (drag susun ulang).
 */
import { useRef, useState } from 'react';
import {
  CheckboxIcon,
  CopyIcon,
  ImageIcon,
  InputIcon,
  ListBulletIcon,
  PlusIcon,
  SpeakerLoudIcon,
  TargetIcon,
  TextIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import type { ElementKind, Slide } from '../constants/h5pModel';

const PALETTE: Array<{ kind: ElementKind; label: string; icon: typeof TextIcon }> = [
  { kind: 'goToSlide', label: 'Tombol pindah', icon: TargetIcon },
  { kind: 'advancedText', label: 'Tulisan', icon: TextIcon },
  { kind: 'image', label: 'Gambar', icon: ImageIcon },
  { kind: 'audio', label: 'Suara', icon: SpeakerLoudIcon },
  { kind: 'multiChoice', label: 'Pilihan Ganda', icon: ListBulletIcon },
  { kind: 'trueFalse', label: 'Benar / Salah', icon: CheckboxIcon },
  { kind: 'blanks', label: 'Isian', icon: InputIcon },
];

type StudioLeftPanelProps = {
  slides: Slide[];
  activeSlideId: string | null;
  selectedKind: ElementKind | null;
  onAddElement: (kind: ElementKind) => void;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlide: (id: string, toIndex: number) => void;
};

export function StudioLeftPanel({
  slides,
  activeSlideId,
  selectedKind,
  onAddElement,
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
    <aside className="st-panel st-left" aria-label="Tambah interaksi dan daftar slide">
      <div className="st-panel-head">
        <h2 className="st-title">Tambahkan Interaksi</h2>
      </div>
      <div role="group" aria-label="Jenis interaksi">
        {PALETTE.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            className={`st-tool ${selectedKind === kind ? 'active' : ''}`}
            aria-pressed={selectedKind === kind}
            onClick={() => onAddElement(kind)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <hr className="st-divider" />
      <div className="st-panel-head">
        <div>
          <span className="st-kicker">Daftar slide</span>
          <h2 className="st-title">{slides.length} slide</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Tambah slide" title="Tambah slide" onClick={onAddSlide}>
          <PlusIcon />
        </button>
      </div>
      {slides.length === 0 ? (
        <div className="st-empty">Belum ada slide. Upload file atau tambah slide baru.</div>
      ) : (
        <div className="st-film" role="list" aria-label="Daftar slide">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              role="listitem"
              className={`st-film-card ${activeSlideId === slide.id ? 'active' : ''} ${dropIndex === idx ? 'st-drop-target' : ''}`}
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
              <button
                className={`st-film-thumb ${slide.backgroundUrl ? '' : `tone-${slide.tone}`}`}
                type="button"
                title={`Slide ${slide.order}: ${slide.title}`}
                onClick={() => onSelectSlide(slide.id)}
              >
                {slide.backgroundUrl && <img src={slide.backgroundUrl} alt="" />}
                <span className="st-film-num">{String(slide.order).padStart(2, '0')}</span>
              </button>
              <span className="st-film-name">{slide.title}</span>
              <div className="st-film-actions">
                <button type="button" title="Gandakan" aria-label="Gandakan slide" onClick={() => onDuplicateSlide(slide.id)}>
                  <CopyIcon />
                </button>
                <button
                  type="button"
                  title="Hapus"
                  aria-label="Hapus slide"
                  disabled={slides.length <= 1}
                  onClick={() => onDeleteSlide(slide.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="st-note">Geser slide untuk susun ulang urutannya.</p>
    </aside>
  );
}
