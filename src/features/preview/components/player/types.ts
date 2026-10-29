import type { SlideElement } from '../../../studio/constants/h5pModel';

export type Answer = string[] | boolean | null;

export interface BlankSegment {
  key: number;
  gap: boolean;
  value: string;
}

export function blanksSegments(text: string): BlankSegment[] {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((p, i) => {
      const m = p.match(/^\*([^*]+)\*$/);
      return m ? { key: i, gap: true, value: m[1] } : { key: i, gap: false, value: p };
    });
}

export function quizLabel(el: SlideElement): string {
  if (el.kind === 'summary') return el.intro || 'Summary';
  if ('question' in el) return el.question;
  if ('text' in el) return el.text;
  return el.title || el.kind;
}
