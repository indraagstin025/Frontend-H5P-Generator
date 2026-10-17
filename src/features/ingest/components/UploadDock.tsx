import { UploadIcon } from '@radix-ui/react-icons';
import { MAX_UPLOAD_LABEL } from '../constants/uploadLimits';
import { useUploadSource } from '../hooks/useUploadSource';

type UploadDockProps = {
  onAccepted: (file: File) => void;
  onNotice: (message: string) => void;
};

export function UploadDock({ onAccepted, onNotice }: UploadDockProps) {
  const { state, refs, actions } = useUploadSource({ onAccepted, onNotice });

  return (
    <section
      className={`upload-dock ${state.isDragging ? 'dragging' : ''}`}
      onDragOver={actions.handleDragOver}
      onDragLeave={actions.handleDragLeave}
      onDrop={actions.handleDrop}
    >
      <div className="upload-icon">
        <UploadIcon />
      </div>
      <div>
        <strong>Pilih atau tarik file materi (.pptx / .pdf)</strong>
        <span>Bisa file presentasi atau dokumen, sampai {MAX_UPLOAD_LABEL}</span>
      </div>
      <input
        ref={refs.fileInputRef}
        type="file"
        accept=".pptx,.pdf"
        hidden
        onChange={(event) => actions.acceptFile(event.target.files?.[0])}
      />
      <button className="upload-button" type="button" onClick={actions.openPicker}>
        <UploadIcon /> Pilih file
      </button>
    </section>
  );
}
