import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import type { Slide, SlideElement } from '../../constants/h5pModel';
import { uid } from '../../constants/h5pModel';
import { registerMedia } from '../../utils/mediaRegistry';
import { KIND_LABEL } from './constants';
import { PositionFields } from './PositionFields';

interface ElementContentFieldsProps {
  slide: Slide;
  slides: Slide[];
  element: SlideElement | null;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
  onUpdateSlide: (id: string, patch: Partial<Slide>) => void;
  onUpdateKeyword: (slideId: string, main: string) => void;
  onNotice: (message: string) => void;
}

export function ElementContentFields({
  slide,
  slides,
  element,
  onUpdateElement,
  onUpdateSlide,
  onUpdateKeyword,
  onNotice,
}: ElementContentFieldsProps) {
  const pickMedia = (kind: 'image' | 'audio' | 'video', file: File | undefined) => {
    if (!file || !element) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const okImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext);
    const okAudio = ['mp3', 'wav'].includes(ext);
    const okVideo = ['mp4', 'webm', 'ogv'].includes(ext);
    if (kind === 'image' && !okImage) {
      onNotice('Gambar harus .png/.jpg/.jpeg/.gif/.svg ya.');
      return;
    }
    if (kind === 'audio' && !okAudio) {
      onNotice('Suara harus .mp3/.wav ya.');
      return;
    }
    if (kind === 'video' && !okVideo) {
      onNotice('Video harus .mp4/.webm/.ogv ya.');
      return;
    }
    if (file.size > (kind === 'video' ? 50 : 10) * 1024 * 1024) {
      onNotice(`File-nya kegedean, maksimal ${kind === 'video' ? 50 : 10} MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    registerMedia(element.id, file, url);
    onUpdateElement(element.id, { fileName: file.name, objectUrl: url, file } as Partial<SlideElement>);
    onNotice(`${file.name} sudah kepasang.`);
  };

  if (!element) {
    return (
      <>
        <label className="field-label">
          Judul slide
          <input value={slide.title} onChange={(e) => onUpdateSlide(slide.id, { title: e.target.value })} />
        </label>
        <label className="field-label">
          Judul buat daftar isi
          <input
            value={slide.keywords[0]?.main ?? ''}
            onChange={(e) => onUpdateKeyword(slide.id, e.target.value)}
          />
        </label>
        <label className="field-label">
          Nama bab
          <input value={slide.chapter} onChange={(e) => onUpdateSlide(slide.id, { chapter: e.target.value })} />
        </label>
      </>
    );
  }

  const patch = (p: Partial<SlideElement>) => onUpdateElement(element.id, p);

  return (
    <>
      <label className="field-label">
        Nama (boleh dikosongkan)
        <input value={element.title} onChange={(e) => patch({ title: e.target.value })} />
      </label>
      {element.kind === 'advancedText' && (
        <label className="field-label">
          Isi teks
          <textarea rows={4} value={element.text} onChange={(e) => patch({ text: e.target.value })} />
        </label>
      )}
      {element.kind === 'link' && (
        <>
          <label className="field-label">
            URL
            <input type="url" value={element.url} onChange={(e) => patch({ url: e.target.value })} />
          </label>
          <label className="field-label">
            Teks link
            <input value={element.linkText} onChange={(e) => patch({ linkText: e.target.value })} />
          </label>
        </>
      )}
      {element.kind === 'image' && (
        <>
          <label className="field-label">
            File gambar
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.svg"
              onChange={(e) => pickMedia('image', e.target.files?.[0])}
            />
          </label>
          {element.objectUrl && <img className="media-preview" src={element.objectUrl} alt={element.alt} />}
          <label className="field-label">
            Deskripsi singkat gambar
            <input value={element.alt} onChange={(e) => patch({ alt: e.target.value })} />
          </label>
        </>
      )}
      {element.kind === 'shape' && (
        <>
          <label className="field-label">
            Jenis shape
            <select
              value={element.shapeType}
              onChange={(e) =>
                patch({
                  shapeType: e.target.value as 'circle' | 'rectangle' | 'vertical-line' | 'horizontal-line',
                })
              }
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="vertical-line">Vertical line</option>
              <option value="horizontal-line">Horizontal line</option>
            </select>
          </label>
          <label className="field-label">
            Warna
            <input type="color" value={element.color} onChange={(e) => patch({ color: e.target.value })} />
          </label>
        </>
      )}
      {element.kind === 'video' && (
        <>
          <label className="field-label">
            File video
            <input
              type="file"
              accept=".mp4,.webm,.ogv"
              onChange={(e) => pickMedia('video', e.target.files?.[0])}
            />
          </label>
          {element.objectUrl && (
            <video
              className="media-preview"
              controls
              src={element.objectUrl}
              style={{ width: '100%', borderRadius: 6 }}
            />
          )}
          <label className="field-label">
            Atau URL video
            <input type="url" value={element.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} />
          </label>
        </>
      )}
      {element.kind === 'audio' && (
        <>
          <label className="field-label">
            File suara
            <input
              type="file"
              accept=".mp3,.wav"
              onChange={(e) => pickMedia('audio', e.target.files?.[0])}
            />
          </label>
          {element.objectUrl && <audio className="media-preview" controls src={element.objectUrl}></audio>}
        </>
      )}
      {element.kind === 'goToSlide' && (
        <>
          <label className="field-label">
            Tulisan di tombol
            <input value={element.label} onChange={(e) => patch({ label: e.target.value })} />
          </label>
          <label className="field-label">
            Kalau diklik, buka
            <select
              value={element.targetType}
              onChange={(e) => patch({ targetType: e.target.value as 'specified' | 'next' | 'previous' })}
            >
              <option value="specified">Slide pilihan</option>
              <option value="next">Slide sesudahnya</option>
              <option value="previous">Slide sebelumnya</option>
            </select>
          </label>
          {element.targetType === 'specified' && (
            <label className="field-label">
              Pilih slide tujuannya
              <select
                value={element.targetSlide}
                onChange={(e) => patch({ targetSlide: Number(e.target.value) })}
              >
                {slides.map((s) => (
                  <option key={s.id} value={s.order}>
                    {String(s.order).padStart(2, '0')} / {s.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="check-row compact">
            <input
              type="checkbox"
              checked={element.invisible}
              onChange={(e) => patch({ invisible: e.target.checked })}
            />
            <span>Kotak tak terlihat (tidak ada tulisan)</span>
          </label>
        </>
      )}
      {(element.kind === 'continuousText' || element.kind === 'exportableText') && (
        <label className="field-label">
          Teks
          <textarea rows={4} value={element.text} onChange={(e) => patch({ text: e.target.value })} />
        </label>
      )}
      {element.kind === 'summary' && (
        <label className="field-label">
          Intro ringkasan
          <textarea rows={3} value={element.intro} onChange={(e) => patch({ intro: e.target.value })} />
        </label>
      )}
      {element.kind === 'dialogCards' && (
        <>
          <label className="field-label">
            Deskripsi
            <textarea
              rows={2}
              value={element.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          <span className="section-kicker">Kartu dialog</span>
          <div className="option-list">
            {element.cards.map((card) => (
              <div className="dialog-card-row" key={card.id}>
                <input
                  value={card.front}
                  placeholder="Sisi depan…"
                  onChange={(e) =>
                    patch({
                      cards: element.cards.map((c) => (c.id === card.id ? { ...c, front: e.target.value } : c)),
                    })
                  }
                />
                <input
                  value={card.back}
                  placeholder="Sisi belakang…"
                  onChange={(e) =>
                    patch({
                      cards: element.cards.map((c) => (c.id === card.id ? { ...c, back: e.target.value } : c)),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label="Hapus kartu"
                  disabled={element.cards.length <= 1}
                  onClick={() => patch({ cards: element.cards.filter((c) => c.id !== card.id) })}
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
              patch({
                cards: [
                  ...element.cards,
                  { id: uid(), front: 'Sisi depan baru', back: 'Sisi belakang baru' },
                ],
              })
            }
          >
            <span aria-hidden="true"><PlusIcon /></span> Tambah kartu
          </button>
        </>
      )}
      {element.kind === 'table' && (
        <>
          <label className="field-label">
            Baris
            <input
              type="number"
              min={1}
              max={20}
              value={element.rows}
              onChange={(e) => patch({ rows: Number(e.target.value) })}
            />
          </label>
          <label className="field-label">
            Kolom
            <input
              type="number"
              min={1}
              max={20}
              value={element.cols}
              onChange={(e) => patch({ cols: Number(e.target.value) })}
            />
          </label>
        </>
      )}
      {element.kind === 'interactiveVideo' && (
        <label className="field-label">
          URL Video
          <input type="url" value={element.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} />
        </label>
      )}
      {element.kind === 'audioRecorder' && (
        <label className="field-label">
          Deskripsi
          <input value={element.description} onChange={(e) => patch({ description: e.target.value })} />
        </label>
      )}
      {element.kind !== 'goToSlide' && (
        <>
          <label className="check-row compact">
            <input
              type="checkbox"
              checked={element.displayAsButton}
              onChange={(e) => patch({ displayAsButton: e.target.checked })}
            />
            <span>Jadi tombol kecil (diklik baru kebuka)</span>
          </label>
          {element.displayAsButton && (
            <label className="field-label">
              Tulisan di tombolnya
              <input
                value={element.buttonLabel}
                placeholder={KIND_LABEL[element.kind]}
                onChange={(e) => patch({ buttonLabel: e.target.value })}
              />
            </label>
          )}
        </>
      )}
      <PositionFields element={element} onUpdateElement={onUpdateElement} />
    </>
  );
}
