/**
 * Panel kanan Studio - "Tambah elemen"
 * Menampilkan semua jenis elemen yang bisa ditambahkan ke slide
 * sesuai desain referensi.
 */
import type { ElementKind } from '../constants/h5pModel';

type ElementPanelProps = {
  onAddElement: (kind: ElementKind) => void;
};

type DropdownItem = {
  kind: ElementKind;
  label: string;
};

const DROPDOWN_ITEMS: DropdownItem[] = [
  { kind: 'dragWords', label: 'Drag the Words' },
  { kind: 'markWords', label: 'Mark the Words' },
  { kind: 'dialogCards', label: 'Dialog Cards' },
  { kind: 'continuousText', label: 'Continuous Text' },
  { kind: 'exportableText', label: 'Exportable Text Area' },
  { kind: 'table', label: 'Table' },
  { kind: 'interactiveVideo', label: 'Interactive Video' },
  { kind: 'audioRecorder', label: 'Audio Recorder' },
  { kind: 'multimediaChoice', label: 'Multimedia Choice' },
];

const INTERACTION_ITEMS: Array<{ kind: ElementKind; label: string }> = [
  { kind: 'blanks', label: 'Fill In The Blank' },
  { kind: 'singleChoice', label: 'Single Choice Set' },
  { kind: 'multiChoice', label: 'Multiple Choice' },
  { kind: 'trueFalse', label: 'True False Question' },
  { kind: 'dragDrop', label: 'Drag And Drop' },
  { kind: 'summary', label: 'Summary' },
];

export function ElementPanel({ onAddElement }: ElementPanelProps) {
  return (
    <aside className="hs-element-panel" aria-label="Tambah elemen">
      {/* Header */}
      <div className="hs-ep-header">
        <h2 className="hs-ep-title">Tambah elemen</h2>
        <p className="hs-ep-subtitle">Pilih konten untuk slide ini</p>
      </div>

      {/* ELEMEN DASAR */}
      <div className="hs-ep-section-label">ELEMEN DASAR</div>
      <div className="hs-ep-basic-grid">
        <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('advancedText')}
          title="Tambah Teks"
        >
          <span className="hs-ep-basic-icon hs-icon-text">T</span>
          <span>Add Text</span>
        </button>
        <button
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
        </button>
        <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('image')}
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
        </button>
        <button
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
        </button>
        <button
          type="button"
          className="hs-ep-basic-btn"
          onClick={() => onAddElement('video')}
          title="Tambah Video"
        >
          <span className="hs-ep-basic-icon hs-icon-video">
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M1 3.5C1 2.67 1.67 2 2.5 2H9.5C10.33 2 11 2.67 11 3.5V11.5C11 12.33 10.33 13 9.5 13H2.5C1.67 13 1 12.33 1 11.5V3.5Z" stroke="currentColor"/>
              <path d="M11 5.5L14 3.5V11.5L11 9.5V5.5Z" stroke="currentColor" strokeLinejoin="round"/>
            </svg>
          </span>
          <span>Add Video</span>
        </button>
        <button
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
          <span>Audio</span>
        </button>
      </div>

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
    </aside>
  );
}
