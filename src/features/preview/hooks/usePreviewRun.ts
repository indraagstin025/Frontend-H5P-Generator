/**
 * Status lari preview interaktif (FR-10): navigasi + jawaban + skor.
 * Cerminan perilaku player Course Presentation + summary slide.
 */
import { useMemo, useState } from 'react';
import { extractBlankAnswers, isQuizElement, markWordTokens, maxScoreOf } from '../../studio/constants/h5pModel';
import type { GoToSlideElement, Project, SlideElement } from '../../studio/constants/h5pModel';

export type AnswerValue = string[] | boolean | null;

export function resolveTarget(el: GoToSlideElement, current: number, total: number): number {
  if (el.targetType === 'next') return Math.min(total - 1, current + 1);
  if (el.targetType === 'previous') return Math.max(0, current - 1);
  return Math.min(total - 1, Math.max(0, el.targetSlide - 1));
}

function scoreElement(el: SlideElement, answer: AnswerValue): number {
  if (answer == null) return 0;
  if (el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice') {
    if (!Array.isArray(answer)) return 0;
    const chosen = new Set(answer as string[]);
    const correct = new Set(el.options.filter((o) => o.correct).map((o) => o.id));
    if (chosen.size !== correct.size) return 0;
    for (const id of chosen) if (!correct.has(id)) return 0;
    return 1;
  }
  if (el.kind === 'trueFalse') {
    return (answer as boolean) === el.correctAnswer ? 1 : 0;
  }
  if (el.kind === 'blanks') {
    const expected = extractBlankAnswers(el.text);
    const given = (answer as string[]).map((s) => s.trim().toLowerCase());
    let score = 0;
    expected.forEach((exp, i) => {
      if ((given[i] ?? '').toLowerCase() === exp.toLowerCase()) score += 1;
    });
    return score;
  }
  if (el.kind === 'dragWords') {
    const expected = extractBlankAnswers(el.text);
    const given = (answer as string[]).map((s) => s.trim().toLowerCase());
    let score = 0;
    expected.forEach((exp, i) => {
      if ((given[i] ?? '').toLowerCase() === exp.toLowerCase()) score += 1;
    });
    return score;
  }
  if (el.kind === 'markWords') {
    const expected = markWordTokens(el.text)
      .map((t, i) => (t.marked ? String(i) : null))
      .filter((v): v is string => v !== null);
    const given = Array.isArray(answer) ? [...(answer as string[])].sort() : [];
    const want = [...expected].sort();
    if (given.length !== want.length) return 0;
    return given.every((v, i) => v === want[i]) ? 1 : 0;
  }
  if (el.kind === 'dragDrop') {
    if (!Array.isArray(answer)) return 0;
    const given = answer as string[];
    return el.items.reduce((score, item, i) => (given[i] === item.zoneId ? score + 1 : score), 0);
  }
  if (el.kind === 'summary') {
    if (!Array.isArray(answer)) return 0;
    const picked = (answer as string[])[0];
    return el.statements.some((s) => s.id === picked && s.correct) ? 1 : 0;
  }
  return 0;
}

export function usePreviewRun(project: Project) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [finished, setFinished] = useState(false);

  const total = project.slides.length;
  const slides = project.slides;
  const showSummary = !project.settings.hideSummarySlide;
  const activeSurface = project.settings.activeSurface;

  const quizzes = useMemo(
    () => slides.flatMap((s) => s.elements.filter(isQuizElement).map((el) => ({ slide: s, el }))),
    [slides],
  );
  const maxScore = useMemo(() => quizzes.reduce((acc, q) => acc + maxScoreOf(q.el), 0), [quizzes]);
  const obtained = useMemo(
    () => quizzes.reduce((acc, q) => acc + scoreElement(q.el, answers[q.el.id] ?? null), 0),
    [quizzes, answers],
  );

  const goTo = (i: number) => {
    setFinished(false);
    setIndex(Math.min(Math.max(0, i), total - 1));
  };

  const answer = (elementId: string, value: Exclude<AnswerValue, null>) => {
    setAnswers((prev) => ({ ...prev, [elementId]: value }));
  };

  const reset = () => {
    setAnswers({});
    setFinished(false);
    setIndex(0);
  };

  return {
    state: { index, answers, finished, total, showSummary, activeSurface, quizzes, maxScore, obtained },
    actions: { goTo, answer, reset, setFinished, scoreElement },
  };
}

export type PreviewRun = ReturnType<typeof usePreviewRun>;
