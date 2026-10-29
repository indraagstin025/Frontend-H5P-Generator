import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { uid } from '../../../studio/constants/h5pModel';
import type { DragDropElement, SlideElement } from '../../../studio/constants/h5pModel';

export function DragDropEditor({
  element: dd,
  onPatch,
}: {
  element: DragDropElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  return (
    <>
      <label className="field-label">
        Pertanyaan / Instruksi
        <textarea
          rows={2}
          value={dd.question}
          onChange={(e) => onPatch({ question: e.target.value })}
          placeholder="Drag item ke tempat yang sesuai…"
        />
      </label>
      <span className="section-kicker">Zona tujuan</span>
      <div className="option-list">
        {dd.zones.map((zone) => (
          <div className="option-row" key={zone.id}>
            <input
              value={zone.label}
              placeholder="Nama zona…"
              onChange={(e) =>
                onPatch({
                  zones: dd.zones.map((z) => (z.id === zone.id ? { ...z, label: e.target.value } : z)),
                })
              }
            />
            <button
              type="button"
              aria-label="Hapus zona"
              disabled={dd.zones.length <= 1}
              onClick={() => {
                const zones = dd.zones.filter((z) => z.id !== zone.id);
                onPatch({
                  zones,
                  items: dd.items.map((it) =>
                    it.zoneId === zone.id ? { ...it, zoneId: zones[0]?.id ?? '' } : it,
                  ),
                });
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-slide"
        type="button"
        onClick={() => onPatch({ zones: [...dd.zones, { id: uid(), label: `Zona ${dd.zones.length + 1}` }] })}
      >
        <PlusIcon /> Tambah zona
      </button>
      <span className="section-kicker">Item yang digeser</span>
      <div className="option-list">
        {dd.items.map((item) => (
          <div className="option-row" key={item.id}>
            <input
              value={item.text}
              placeholder="Teks item…"
              onChange={(e) =>
                onPatch({
                  items: dd.items.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)),
                })
              }
            />
            <select
              value={item.zoneId}
              aria-label={`Zona benar untuk ${item.text}`}
              onChange={(e) =>
                onPatch({
                  items: dd.items.map((it) => (it.id === item.id ? { ...it, zoneId: e.target.value } : it)),
                })
              }
            >
              {dd.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Hapus item"
              disabled={dd.items.length <= 1}
              onClick={() => onPatch({ items: dd.items.filter((it) => it.id !== item.id) })}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-slide"
        type="button"
        onClick={() =>
          onPatch({
            items: [
              ...dd.items,
              { id: uid(), text: `Item ${dd.items.length + 1}`, zoneId: dd.zones[0]?.id ?? '' },
            ],
          })
        }
      >
        <PlusIcon /> Tambah item
      </button>
    </>
  );
}
