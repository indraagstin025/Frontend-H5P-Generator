/**
 * Kolom kanan studio ala panel Canva: tab Konten/Jawaban/Penilaian/
 * Umpan balik untuk kuis, properti slide bila tidak ada yang dipilih,
 * lipatan pengaturan cerita, dan status validasi.
 */
import { useState } from 'react';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  QuizBehaviourFields,
  QuizFeedbackFields,
  QuizQuestionFields,
} from '../../interactions/components/QuizEditor';
import type {
  ElementKind,
  ProjectSettings,
  Slide,
  SlideElement,
} from '../constants/h5pModel';
import { isQuizElement } from '../constants/h5pModel';
import { StorySettings } from './StorySettings';
import { ValidationPanel } from './ValidationPanel';
import type { Project } from '../constants/h5pModel';
import { registerMedia } from '../utils/mediaRegistry';

const KIND_LABEL: Record<ElementKind, string> = {
  advancedText: 'Add Text',
  link: 'Add Link',
  image: 'Add Image',
  shape: 'Add Shape',
  video: 'Add Video',
  audio: 'Audio',
  goToSlide: 'Go To Slide',
  blanks: 'Fill In The Blank',
  singleChoice: 'Single Choice Set',
  multiChoice: 'Multiple Choice',
  trueFalse: 'True False Question',
  dragDrop: 'Drag And Drop',
  summary: 'Summary',
  dragWords: 'Drag the Words',
  markWords: 'Mark the Words',
  dialogCards: 'Dialog Cards',
  continuousText: 'Continuous Text',
  exportableText: 'Exportable Text Area',
  table: 'Table',
  interactiveVideo: 'Interactive Video',
  audioRecorder: 'Audio Recorder',
  multimediaChoice: 'Multimedia Choice',
};

type QuizTab = 'konten' | 'jawaban' | 'penilaian' | 'umpanbalik';

const QUIZ_TABS: Array<{ id: QuizTab; label: string }> = [
  { id: 'konten', label: 'Konten' },
  { id: 'jawaban', label: 'Jawaban' },
  { id: 'penilaian', label: 'Penilaian' },
  { id: 'umpanbalik', label: 'Umpan balik' },
];

function PositionFields({
  element,
  onUpdateElement,
}: {
  element: SlideElement;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
}) {
  const set = (key: 'x' | 'y' | 'width' | 'height', value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    onUpdateElement(element.id, { position: { ...element.position, [key]: Math.min(100, Math.max(0, n)) } });
  };
  return (
    <div className="field-row">
      {(['x', 'y', 'width', 'height'] as const).map((key) => (
        <label className="field-label" key={key} htmlFor={`pos-${key}`}>
          {key === 'x' ? 'Kiri-kanan (%)' : key === 'y' ? 'Atas-bawah (%)' : key === 'width' ? 'Lebar (%)' : 'Tinggi (%)'}
          <input
            id={`pos-${key}`}
            type="number"
            min={0}
            max={100}
            value={element.position[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

type PropertyPanelProps = {
  project: Project;
  slide: Slide | null;
  slides: Slide[];
  element: SlideElement | null;
  settings: ProjectSettings;
  slideCount: number;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onUpdateSlide: (id: string, patch: Partial<Slide>) => void;
  onUpdateKeyword: (slideId: string, main: string) => void;
  onUpdateSettings: (patch: Partial<ProjectSettings>) => void;
  onNotice: (message: string) => void;
};

export function PropertyPanel({
  project,
  slide,
  slides,
  element,
  settings,
  slideCount,
  onUpdateElement,
  onDeleteElement,
  onUpdateSlide,
  onUpdateKeyword,
  onUpdateSettings,
  onNotice,
}: PropertyPanelProps) {
  const [tab, setTab] = useState<QuizTab>('konten');

  if (!slide) {
    return (
      <aside className="st-panel st-right" aria-label="Properti">
        <p className="muted">Belum ada slide. Upload file atau tambah slide baru.</p>
      </aside>
    );
  }

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
    if (file.size > 50 * 1024 * 1024) {
      onNotice('File-nya kegedean, maksimal 50 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    registerMedia(element.id, file, url);
    onUpdateElement(element.id, { fileName: file.name, objectUrl: url, file } as Partial<SlideElement>);
    onNotice(`${file.name} sudah kepasang.`);
  };

  const quiz = element && isQuizElement(element) ? element : null;

  const renderKonten = () => {
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
              <input type="file" accept=".png,.jpg,.jpeg,.gif,.svg" onChange={(e) => pickMedia('image', e.target.files?.[0])} />
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
              <select value={element.shapeType} onChange={(e) => patch({ shapeType: e.target.value as 'circle' | 'square' | 'rectangle' | 'triangle' })}>
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="rectangle">Rectangle</option>
                <option value="triangle">Triangle</option>
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
              <input type="file" accept=".mp4,.webm,.ogv" onChange={(e) => pickMedia('video', e.target.files?.[0])} />
            </label>
            {element.objectUrl && (
              <video className="media-preview" controls src={element.objectUrl} style={{ width: '100%', borderRadius: 6 }} />
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
              <input type="file" accept=".mp3,.wav" onChange={(e) => pickMedia('audio', e.target.files?.[0])} />
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
        {(element.kind === 'dragWords' || element.kind === 'markWords' || element.kind === 'continuousText' || element.kind === 'exportableText') && (
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
          <label className="field-label">
            Deskripsi
            <textarea rows={3} value={element.description} onChange={(e) => patch({ description: e.target.value })} />
          </label>
        )}
        {element.kind === 'table' && (
          <>
            <label className="field-label">
              Baris
              <input type="number" min={1} max={20} value={element.rows} onChange={(e) => patch({ rows: Number(e.target.value) })} />
            </label>
            <label className="field-label">
              Kolom
              <input type="number" min={1} max={20} value={element.cols} onChange={(e) => patch({ cols: Number(e.target.value) })} />
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
  };

  return (
    <aside className="st-panel st-right" aria-label="Properti">
      <div className="st-panel-head">
        <h2 className="st-title">Properti {element ? 'Interaksi' : 'Slide'}</h2>
        {element ? (
          <>
            <span className="st-badge">{KIND_LABEL[element.kind]}</span>
            <button
              className="small-icon-button danger"
              type="button"
              aria-label="Hapus elemen"
              title="Hapus elemen"
              onClick={() => onDeleteElement(element.id)}
            >
              <TrashIcon />
            </button>
          </>
        ) : null}
      </div>

      {quiz && (
        <div
          role="tablist"
          aria-label="Bagian properti"
          className="st-tabs"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const order: QuizTab[] = ['konten', 'jawaban', 'penilaian', 'umpanbalik'];
            const idx = order.indexOf(tab);
            const next = order[(idx + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
            setTab(next);
          }}
        >
          {QUIZ_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="st-tab"
              aria-selected={tab === t.id}
              aria-controls={`st-panel-${t.id}`}
              id={`st-tab-${t.id}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="inspector-body">
        {(!quiz || tab === 'konten') && renderKonten()}
        {quiz && tab === 'jawaban' && (
          <div role="tabpanel" id="st-panel-jawaban" aria-labelledby="st-tab-jawaban">
            <QuizQuestionFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
        {quiz && tab === 'penilaian' && (
          <div role="tabpanel" id="st-panel-penilaian" aria-labelledby="st-tab-penilaian">
            <QuizBehaviourFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
        {quiz && tab === 'umpanbalik' && (
          <div role="tabpanel" id="st-panel-umpanbalik" aria-labelledby="st-tab-umpanbalik">
            <QuizFeedbackFields element={quiz} onPatch={(p) => onUpdateElement(quiz.id, p)} />
          </div>
        )}
      </div>

      <hr className="st-divider" />
      <details>
        <summary className="st-settings-toggle">Pengaturan cerita</summary>
        <div className="st-settings-body">
          <StorySettings settings={settings} slideCount={slideCount} onChange={onUpdateSettings} />
        </div>
      </details>

      <hr className="st-divider" />
      <ValidationPanel project={project} />
    </aside>
  );
}

