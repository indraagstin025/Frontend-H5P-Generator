import { useEffect, useRef, useState, type PointerEvent } from 'react';
import './AvatarCropDialog.css';

const SIZE = 240;

export function AvatarCropDialog({ file, onApply, onCancel }: { file: File; onApply: (file: File) => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [url, setUrl] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  const scale = dimensions.width && dimensions.height ? Math.max(SIZE / dimensions.width, SIZE / dimensions.height) * zoom : 1;
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;
  const limitX = Math.max(0, (width - SIZE) / 2);
  const limitY = Math.max(0, (height - SIZE) / 2);
  const x = Math.max(-limitX, Math.min(limitX, offset.x));
  const y = Math.max(-limitY, Math.min(limitY, offset.y));
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setOffset({ x: drag.current.left + event.clientX - drag.current.x, y: drag.current.top + event.clientY - drag.current.y });
  }
  function apply() {
    if (!image.current || !dimensions.width) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) { setError('Foto tidak dapat diproses.'); return; }
    context.drawImage(image.current, (width / 2 - SIZE / 2 - x) / scale, (height / 2 - SIZE / 2 - y) / scale, SIZE / scale, SIZE / scale, 0, 0, 512, 512);
    canvas.toBlob((blob) => {
      if (!blob) { setError('Foto tidak dapat diproses.'); return; }
      onApply(new File([blob], 'foto-profil.png', { type: 'image/png' }));
    }, 'image/png');
  }
  return <dialog ref={dialog} className="avatar-crop" aria-labelledby="avatar-crop-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <header><h2 id="avatar-crop-title">Edit Foto Profil</h2><button type="button" onClick={onCancel} aria-label="Tutup">×</button></header>
    <div className="avatar-crop-stage"><div className="avatar-crop-frame" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: x, top: y }; }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {url && <img ref={image} src={url} alt="" draggable={false} onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setError('Foto tidak dapat dibuka.')} style={{ width, height, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />}
      <div className="avatar-crop-circle" />
    </div></div>
    <p>Geser foto untuk menyesuaikan bagian yang terlihat.</p>
    <label className="avatar-crop-slider">Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
    <label className="avatar-crop-slider">Posisi horizontal<input type="range" min={-limitX} max={limitX} step="1" value={x} disabled={!limitX} onChange={(event) => setOffset({ x: Number(event.target.value), y })} /></label>
    <label className="avatar-crop-slider">Posisi vertikal<input type="range" min={-limitY} max={limitY} step="1" value={y} disabled={!limitY} onChange={(event) => setOffset({ x, y: Number(event.target.value) })} /></label>
    {error && <p role="alert">{error}</p>}
    <footer><button type="button" className="avatar-crop-reset" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Reset</button><button type="button" onClick={onCancel}>Batal</button><button type="button" className="avatar-crop-apply" disabled={!dimensions.width || !!error} onClick={apply}>Terapkan</button></footer>
  </dialog>;
}
