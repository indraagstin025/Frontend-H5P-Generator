/**
 * Strip alur slide ala marker-strip Canva: chip per slide + tambah.
 */
import { PlusIcon } from '@radix-ui/react-icons';
import type { Slide } from '../constants/h5pModel';

type SlideFlowStripProps = {
  slides: Slide[];
  activeSlideId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function SlideFlowStrip({ slides, activeSlideId, onSelect, onAdd }: SlideFlowStripProps) {
  return (
    <section className="st-flow" aria-label="Alur slide">
      <h3 className="st-flow-title">Alur slide</h3>
      <p className="st-flow-help">Klik chip untuk pindah slide. Tombol pilihan di kanvas menentukan cabang alur.</p>
      <div className="st-chips">
        {slides.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`st-chip ${activeSlideId === s.id ? 'selected' : ''}`}
            title={`Slide ${s.order}: ${s.title}`}
            onClick={() => onSelect(s.id)}
          >
            ● {String(s.order).padStart(2, '0')} · {s.title}
          </button>
        ))}
        <button type="button" className="st-chip st-add" onClick={onAdd} title="Tambah slide">
          <PlusIcon /> Tambah
        </button>
      </div>
    </section>
  );
}
