/**
 * Panel kanan Studio - "Tambah elemen"
 * Menampilkan semua jenis elemen yang bisa ditambahkan ke slide
 * sesuai desain referensi.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { apiFetch } from '../../../services/api';
import { apiUpload } from '../../../services/apiUpload';
import { getAuthToken } from '../../../services/authService';
import { absUrl } from '../../ingest/api/serverIngest';
import type { ElementKind } from '../constants/h5pModel';

export type AccountMedia = { fileName: string; assetUrl: string; previewUrl: string; kind: 'image' | 'video' };

type ElementPanelProps = {
  onAddElement: (kind: ElementKind) => void;
  mode?: 'elements' | 'text' | 'image' | 'video';
  mediaRevision: string;
  onAddMedia: (media: AccountMedia) => void;
};

type DropdownItem = {
  kind: ElementKind;
  label: string;
};

const DROPDOWN_ITEMS: DropdownItem[] = [
  { kind: 'dragWords', label: 'Drag the Words' },
  { kind: 'multimediaChoice', label: 'Multimedia Choice (teks)' },
];

const INTERACTION_ITEMS: Array<{ kind: ElementKind; label: string }> = [
  { kind: 'trueFalse', label: 'True False Question' },
  { kind: 'dragDrop', label: 'Drag And Drop' },
  { kind: 'summary', label: 'Summary' },
];

export function ElementPanel({ onAddElement, mode = 'elements', mediaRevision, onAddMedia }: ElementPanelProps) {
  const [media, setMedia] = useState<AccountMedia[]>([]);
  const [mediaStatus, setMediaStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadRevision, setUploadRevision] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);
  const mediaGridRef = useRef<HTMLDivElement>(null);
  const [mediaGridWidth, setMediaGridWidth] = useState(0);
  const [mediaRatios, setMediaRatios] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const grid = mediaGridRef.current;
    if (!grid) return;
    const observer = new ResizeObserver(() => setMediaGridWidth(grid.clientWidth));
    observer.observe(grid);
    setMediaGridWidth(grid.clientWidth);
    return () => observer.disconnect();
  }, [mode]);
  useEffect(() => {
    if (mode !== 'image' && mode !== 'video') return;
    let cancelled = false;
    const urls: string[] = [];
    setMediaStatus('loading');
    void apiFetch<{ data: AccountMedia[] }>('/projects/media').then(async (response) => {
      const token = getAuthToken();
      const items = await Promise.all(response.data.filter((item) => item.kind === mode).map(async (item) => {
        const assetUrl = absUrl(item.assetUrl) ?? item.assetUrl;
        const result = await fetch(assetUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!result.ok) throw new Error('Media tidak dapat dimuat.');
        const previewUrl = URL.createObjectURL(await result.blob());
        urls.push(previewUrl);
        return { ...item, assetUrl, previewUrl };
      }));
      if (cancelled) { urls.forEach((url) => URL.revokeObjectURL(url)); return; }
      setMedia(items);
      setMediaStatus('ready');
    }).catch(() => { urls.forEach((url) => URL.revokeObjectURL(url)); if (!cancelled) setMediaStatus('error'); });
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [mode, mediaRevision, uploadRevision]);
  const uploadMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    const failures: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      try {
        await apiUpload('/projects/media', form);
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Unggah gagal.'}`);
      }
    }
    setUploadError(failures.join(' '));
    setUploadRevision((revision) => revision + 1);
    setUploading(false);
  };
  const title = { elements: 'Tambah elemen', text: 'Teks', image: 'Gambar', video: 'Video' }[mode];
  return (
    <aside className="hs-element-panel" aria-label={title}>
      {/* Header */}
      <div className="hs-ep-header">
        <h2 className="hs-ep-title">{title}</h2>
        <p className="hs-ep-subtitle">{mode === 'elements' ? 'Pilih konten untuk slide ini' : `Tambahkan ${title.toLowerCase()} ke slide`}</p>
      </div>
      {(mode === 'image' || mode === 'video') && <input ref={uploadRef} type="file" hidden multiple accept={mode === 'image' ? '.png,.jpg,.jpeg,.gif,.webp,.svg' : '.mp4,.m4v,.webm,.ogv'} onChange={(event) => { void uploadMedia(event.currentTarget.files); event.currentTarget.value = ''; }} />}

      {/* ELEMEN DASAR */}
      {mode === 'elements' && <div className="hs-ep-section-label">ELEMEN DASAR</div>}
      <div ref={mode === 'image' || mode === 'video' ? mediaGridRef : undefined} className={mode === 'image' || mode === 'video' ? 'hs-media-library' : 'hs-ep-basic-grid'}>
        {mode === 'text' && <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('advancedText')}
          title="Tambah Teks"
        >
          <span className="hs-ep-basic-icon hs-icon-text">T</span>
          <span>Add Text</span>
        </button>}
        {mode === 'elements' && <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('link')}
          title="Tambah Link"
        >
          <span className="hs-ep-basic-icon hs-icon-link">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M8.51 3.06a3.5 3.5 0 0 1 4.95 4.95l-2 2a3.5 3.5 0 0 1-4.95-4.95l.5-.5" stroke="currentColor" strokeLinecap="round"/>
              <path d="M6.49 11.94a3.5 3.5 0 0 1-4.95-4.95l2-2a3.5 3.5 0 0 1 4.95 4.95l-.5.5" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Add Link</span>
        </button>}
        {mode === 'image' && <button
          type="button"
          className="hs-add-slide-btn hs-media-add-btn"
          style={{ gridRowEnd: `span ${Math.max(1, Math.ceil(((mediaGridWidth - 10) / 2 * 10 / 16 + 10) / 14))}` }}
          onClick={() => uploadRef.current?.click()}
          disabled={uploading}
          title="Tambah Gambar"
        >
          <span className="hs-ep-basic-icon hs-icon-image">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor"/>
              <path d="M1 10l3.5-3.5 3 3 2.5-2.5L14 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="4.5" r="1" fill="currentColor"/>
            </svg>
          </span>
          <span>Add Image</span>
        </button>}
        {mode === 'elements' && <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('shape')}
          title="Tambah Shape"
        >
          <span className="hs-ep-basic-icon hs-icon-shape">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <rect x="1.5" y="1.5" width="12" height="12" rx="1" stroke="currentColor"/>
            </svg>
          </span>
          <span>Add Shape</span>
        </button>}
        {mode === 'video' && <button
          type="button"
          className="hs-add-slide-btn hs-media-add-btn"
          style={{ gridRowEnd: `span ${Math.max(1, Math.ceil(((mediaGridWidth - 10) / 2 * 10 / 16 + 10) / 14))}` }}
          onClick={() => uploadRef.current?.click()}
          disabled={uploading}
          title="Tambah Video"
        >
          <span className="hs-ep-basic-icon hs-icon-video">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M1 3.5C1 2.67 1.67 2 2.5 2H9.5C10.33 2 11 2.67 11 3.5V11.5C11 12.33 10.33 13 9.5 13H2.5C1.67 13 1 12.33 1 11.5V3.5Z" stroke="currentColor"/>
              <path d="M11 5.5L14 3.5V11.5L11 9.5V5.5Z" stroke="currentColor" strokeLinejoin="round"/>
            </svg>
          </span>
          <span>Add Video</span>
        </button>}
        {mode === 'elements' && <><button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('goToSlide')}
          title="Go To Slide"
        >
          <span className="hs-ep-basic-icon hs-icon-goto">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M7.5 1L13 7.5L7.5 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 7.5H13" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Go To Slide ..</span>
        </button>
        <button
          type="button"
          className="hs-ep-basic-btn hs-ep-basic-btn--audio"
          onClick={() => onAddElement('audio')}
          title="Tambah Audio"
        >
          <span className="hs-ep-basic-icon hs-icon-audio">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M7 2L7 13M4 4L4 11M1 6L1 9M10 4L10 11M13 6L13 9" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Add Audio</span>
        </button></>}
      {(mode === 'image' || mode === 'video') && <>
          {media.filter((item) => item.kind === mode).map((item) => <button key={item.fileName} type="button" className="hs-media-library-item" style={{ gridRowEnd: `span ${Math.max(1, Math.ceil(((mediaGridWidth - 10) / 2 / (mediaRatios[item.fileName] || 1) + 12) / 14))}` }} title={`Tambahkan ${item.fileName}`} aria-label={`Tambahkan ${item.fileName}`} onClick={() => onAddMedia(item)}>
            {item.kind === 'image' ? <img src={item.previewUrl} alt="" onLoad={(event) => { const ratio = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight; setMediaRatios((ratios) => ({ ...ratios, [item.fileName]: ratio })); }} /> : <video src={item.previewUrl} muted preload="metadata" onLoadedMetadata={(event) => { const ratio = event.currentTarget.videoWidth / event.currentTarget.videoHeight; setMediaRatios((ratios) => ({ ...ratios, [item.fileName]: ratio })); }} />}
          </button>)}
      </>}
      </div>
      {(mode === 'image' || mode === 'video') && mediaStatus === 'loading' && <p>Memuat media…</p>}
      {(mode === 'image' || mode === 'video') && mediaStatus === 'error' && <p>Media tidak dapat dimuat.</p>}
      {(mode === 'image' || mode === 'video') && uploading && <p>Mengunggah media…</p>}
      {(mode === 'image' || mode === 'video') && uploadError && <p role="alert">{uploadError}</p>}

      {mode === 'elements' && <>
      {/* INTERAKSI & KUIS */}
      <div className="hs-ep-section-label" style={{ marginTop: '16px' }}>INTERAKSI & KUIS</div>
      <div className="hs-ep-interaction-list">
        {INTERACTION_ITEMS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            className="hs-ep-interaction-item"
            onClick={() => onAddElement(kind)}
            title={`Tambah ${label}`}
          >
            <span className="hs-ep-interaction-label">{label}</span>
            <span className="hs-ep-interaction-plus">+</span>
          </button>
        ))}
      </div>

      {/* KONTEN LAINNYA (dropdown) */}
      <div className="hs-ep-section-label" style={{ marginTop: '16px' }}>KONTEN LAINNYA</div>
      <div className="hs-ep-dropdown-list">
        {DROPDOWN_ITEMS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            className="hs-ep-interaction-item"
            onClick={() => onAddElement(kind)}
            title={`Tambah ${label}`}
          >
            <span className="hs-ep-interaction-label">{label}</span>
            <span className="hs-ep-interaction-plus">+</span>
          </button>
        ))}
      </div>
      </>}
    </aside>
  );
}
