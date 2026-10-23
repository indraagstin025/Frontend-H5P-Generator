/**
 * Alur konversi Tahap 1 (FR-01/02/03, versi frontend-only).
 * PPTX: hyperlink → hotspot, notes → dialog, media → elemen (non-AI).
 * Backend menyusul (NFR-01 <15 dtk): tahap render diganti API,
 * kontrak onDone(slides, info) tidak berubah.
 */
import { useRef, useState } from 'react';
import { MAX_SLIDES_PER_PROJECT } from '../constants/uploadLimits';
import { buildSlidesFromPptx } from '../api/pptxConverter';
import type { PptxCounts } from '../api/pptxConverter';
import { inspectPptx } from '../../studio/api/pptxParser';
import { inspectPdf } from '../../studio/api/pdfInspector';
import { createSlide } from '../../studio/constants/h5pModel';
import type { AspectRatio, Slide } from '../../studio/constants/h5pModel';

export type ConvertPhase = 'idle' | 'validating' | 'extracting' | 'rendering' | 'done' | 'error';

export interface ConvertInfo {
  fileName: string;
  aspect: AspectRatio;
  counts: PptxCounts;
}

const EMPTY_COUNTS: PptxCounts = { hotspots: 0, notes: 0, media: 0, quizzes: 0 };

export function useIngest(onDone: (slides: Slide[], info: ConvertInfo) => void) {
  const [phase, setPhase] = useState<ConvertPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const timer = useRef<number | null>(null);

  const reset = () => {
    if (timer.current) window.clearInterval(timer.current);
    setPhase('idle');
    setProgress(0);
    setStatus('');
    setError('');
  };

  const convert = async (file: File) => {
    reset();
    setPhase('validating');
    setStatus('Memeriksa file…');
    setProgress(6);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    try {
      let slides: Slide[];
      let aspect: AspectRatio;
      let count: number;
      let counts: PptxCounts = { ...EMPTY_COUNTS };

      setPhase('extracting');
      setStatus('Membaca halaman, link, catatan & gambar…');
      if (ext === 'pptx') {
        const info = await inspectPptx(file);
        count = info.slideCount;
        aspect = info.aspect;
        if (count < 1) throw new Error('Tidak ada halaman yang bisa dibaca dari file ini.');
        if (count > MAX_SLIDES_PER_PROJECT) {
          throw new Error(`File-nya ada ${count} halaman, maksimal ${MAX_SLIDES_PER_PROJECT} slide per materi.`);
        }
        const built = buildSlidesFromPptx(info);
        slides = built.slides;
        counts = built.counts;
        setStatus(`Ketemu ${counts.hotspots} tautan, ${counts.notes} catatan, ${counts.media} gambar/suara, dan ${counts.quizzes} draf kuis. Semua dipasang otomatis…`);
      } else {
        const info = await inspectPdf(file);
        count = info.pageCount;
        aspect = '16:9';
        if (count < 1) throw new Error('Tidak ada halaman yang bisa dibaca dari file ini.');
        if (count > MAX_SLIDES_PER_PROJECT) {
          throw new Error(`File-nya ada ${count} halaman, maksimal ${MAX_SLIDES_PER_PROJECT} slide per materi.`);
        }
        slides = Array.from({ length: count }, (_, i) => createSlide(i + 1, `Halaman ${i + 1}`, aspect));
      }

      // Simulasi render latar (diganti render server di backend, NFR-02)
      setPhase('rendering');
      await new Promise<void>((resolve) => {
        const started = Date.now();
        const DURATION = Math.min(3200, 700 + count * 120);
        timer.current = window.setInterval(() => {
          const ratio = Math.min(1, (Date.now() - started) / DURATION);
          setProgress(12 + Math.round(ratio * 86));
          setStatus(`Menyiapkan tampilan slide ${Math.min(count, Math.floor(ratio * count) + 1)} dari ${count}…`);
          if (ratio >= 1) {
            if (timer.current) window.clearInterval(timer.current);
            resolve();
          }
        }, 90);
      });

      setProgress(100);
      setPhase('done');
      const auto = counts.hotspots + counts.notes + counts.media + counts.quizzes;
      setStatus(auto > 0 ? `${count} slide + ${auto} isi otomatis siap dirapikan.` : `${count} slide siap dirapikan.`);
      onDone(slides, { fileName: file.name, aspect, counts });
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Gagal mengubah file.');
    }
  };

  return { state: { phase, progress, status, error }, actions: { convert, reset } };
}
