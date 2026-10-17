/**
 * Hook upload sumber materi: validasi lokal + state drag/drop.
 * Pola return { state, actions } mengikuti WeSign useUploadDoc.
 */
import { useRef, useState } from 'react';
import { validateSourceFile } from '../api/ingestService';
import { createLogger } from '../../../utils/logger';

const log = createLogger('UploadSource');

type UseUploadSourceParams = {
  onAccepted: (file: File) => void;
  onNotice: (message: string) => void;
};

export function useUploadSource({ onAccepted, onNotice }: UseUploadSourceParams) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const acceptFile = (file?: File) => {
    if (!file) return;
    const result = validateSourceFile(file);
    if (result.valid === false) {
      onNotice(result.error);
      return;
    }
    log.info('Source accepted:', file.name);
    setUploadProgress(0);
    onAccepted(file);
  };

  return {
    state: { isDragging, uploadProgress },
    refs: { fileInputRef },
    actions: {
      acceptFile,
      openPicker: () => fileInputRef.current?.click(),
      handleDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
      },
      handleDragLeave: () => setIsDragging(false),
      handleDrop: (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFile(event.dataTransfer.files[0]);
      },
    },
  };
}
