/**
 * Hook upload sumber materi: validasi lokal ketat + state drag/drop.
 * Pola return { state, actions } mengikuti WeSign useUploadDoc.
 */
import { useRef, useState } from 'react';
import { validateSourceFile, validateSourceFileStrict } from '../api/ingestService';
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
  const [isValidating, setIsValidating] = useState(false);

  const acceptFile = async (file?: File) => {
    if (!file) return;

    // 1. Validasi cepat (ukuran & ekstensi)
    const quickResult = validateSourceFile(file);
    if (quickResult.valid === false) {
      onNotice(quickResult.error);
      return;
    }

    // 2. Validasi ketat (magic bytes, enkripsi / password, dan hash)
    setIsValidating(true);
    try {
      const strictResult = await validateSourceFileStrict(file);
      if (!strictResult.valid) {
        onNotice(strictResult.error || 'Berkas tidak memenuhi syarat.');
        return;
      }
      log.info('Source accepted strictly:', file.name, 'hash:', strictResult.hash);
      setUploadProgress(0);
      onAccepted(file);
    } catch {
      onNotice('Gagal memvalidasi struktur berkas. Pastikan berkas tidak rusak.');
    } finally {
      setIsValidating(false);
    }
  };

  return {
    state: { isDragging, uploadProgress, isValidating },
    refs: { fileInputRef },
    actions: {
      acceptFile: (file?: File) => {
        void acceptFile(file);
      },
      openPicker: () => fileInputRef.current?.click(),
      handleDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
      },
      handleDragLeave: () => setIsDragging(false),
      handleDrop: (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files[0];
        void acceptFile(droppedFile);
      },
    },
  };
}
