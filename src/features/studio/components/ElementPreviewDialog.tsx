import { useEffect, useMemo, useRef } from 'react';
import { H5PRealPlayer } from '../../preview/components/H5PRealPlayer';
import type { Project, Slide, SlideElement } from '../constants/h5pModel';
import './ElementPreviewDialog.css';

export function ElementPreviewDialog({ project, slide, element, onClose }: {
  project: Project;
  slide: Slide;
  element: SlideElement;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewProject = useMemo<Project>(() => {
    const copy = structuredClone(project);
    copy.id = `element-preview-${crypto.randomUUID()}`;
    copy.settings.activeSurface = false;
    copy.settings.hideSummarySlide = true;
    copy.slides = [{ ...structuredClone(slide), order: 1, backgroundUrl: null,
      elements: [{ ...structuredClone(element), displayAsButton: false,
        position: { x: 3, y: 3, width: 94, height: 90 } }],
    }];
    return copy;
  }, [project, slide, element]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="st-element-preview" aria-labelledby="st-element-preview-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <header className="st-element-preview-header">
        <div><h2 id="st-element-preview-title">{element.buttonLabel || element.title || 'Pratinjau interaksi'}</h2>
          <p>Coba interaksi di sini. Jawaban percobaan tidak mengubah materi Anda.</p></div>
        <button type="button" className="secondary-button" onClick={onClose} autoFocus>Tutup</button>
      </header>
      <H5PRealPlayer project={previewProject} />
    </dialog>
  );
}
