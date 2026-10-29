import type { SlideElement } from '../../constants/h5pModel';

export function PositionFields({
  element,
  onUpdateElement,
}: {
  element: SlideElement;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
}) {
  const set = (key: 'x' | 'y' | 'width' | 'height', value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const cur = element.position;
    const patchPos = { ...cur };

    if (key === 'x') {
      patchPos.x = Math.max(0, Math.min(100 - cur.width, n));
    } else if (key === 'y') {
      patchPos.y = Math.max(0, Math.min(100 - cur.height, n));
    } else if (key === 'width') {
      const maxWidth = 100 - cur.x;
      patchPos.width = Math.max(2, Math.min(maxWidth, n));
    } else if (key === 'height') {
      const maxHeight = 100 - cur.y;
      patchPos.height = Math.max(2, Math.min(maxHeight, n));
    }
    onUpdateElement(element.id, { position: patchPos });
  };

  return (
    <div className="field-row">
      {(['x', 'y', 'width', 'height'] as const).map((key) => {
        const maxVal =
          key === 'x'
            ? 100 - element.position.width
            : key === 'y'
              ? 100 - element.position.height
              : key === 'width'
                ? 100 - element.position.x
                : 100 - element.position.y;
        return (
          <label className="field-label" key={key} htmlFor={`pos-${key}`}>
            {key === 'x'
              ? 'Kiri-kanan (%)'
              : key === 'y'
                ? 'Atas-bawah (%)'
                : key === 'width'
                  ? 'Lebar (%)'
                  : 'Tinggi (%)'}
            <input
              id={`pos-${key}`}
              type="number"
              min={0}
              max={maxVal}
              value={element.position[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
}
