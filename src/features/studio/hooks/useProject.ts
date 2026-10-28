/**
 * State satu proyek: slide (FR-04), elemen, dan pengaturan cerita (FR-05/06/07).
 */
import { useCallback, useMemo, useState } from 'react';
import {
  chapterForOrder,
  createElement,
  createProject,
  createSlide,
  toneForOrder,
} from '../constants/h5pModel';
import type {
  AspectRatio,
  ElementKind,
  Project,
  ProjectSettings,
  Slide,
  SlideElement,
} from '../constants/h5pModel';

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

function renumber(slides: Slide[]): Slide[] {
  return slides.map((s, idx) => ({
    ...s,
    order: idx + 1,
    chapter: s.chapter.startsWith('Bab ') ? chapterForOrder(idx + 1) : s.chapter,
  }));
}

function syncGoToTargets(prevSlides: Slide[], nextSlides: Slide[]): Slide[] {
  const oldOrderToId = new Map<number, string>();
  for (const s of prevSlides) {
    oldOrderToId.set(s.order, s.id);
  }

  const idToNewOrder = new Map<string, number>();
  for (const s of nextSlides) {
    idToNewOrder.set(s.id, s.order);
  }

  return nextSlides.map((slide) => {
    let changed = false;
    const elements = slide.elements.map((el) => {
      if (el.kind !== 'goToSlide' || el.targetType !== 'specified') {
        return el;
      }
      const targetId = oldOrderToId.get(el.targetSlide);
      let newTarget = targetId ? idToNewOrder.get(targetId) : undefined;

      // Jika slide tujuan dihapus, arahkan ke slide valid terdekat
      if (newTarget === undefined) {
        newTarget = Math.max(1, Math.min(el.targetSlide, nextSlides.length));
      }

      if (newTarget !== el.targetSlide) {
        changed = true;
        return { ...el, targetSlide: newTarget };
      }
      return el;
    });

    return changed ? { ...slide, elements } : slide;
  });
}

export function useProject(initial: Project | null, aspectFallback: AspectRatio = '16:9') {
  const [project, setProject] = useState<Project>(() => initial ?? createProject('Modul baru', aspectFallback, null));
  const [activeSlideId, setActiveSlideId] = useState<string | null>(() => initial?.slides[0]?.id ?? null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const slides = project.slides;
  const activeSlide: Slide | null = useMemo(
    () => slides.find((s) => s.id === activeSlideId) ?? slides[0] ?? null,
    [slides, activeSlideId],
  );
  const selectedElement: SlideElement | null = useMemo(
    () => activeSlide?.elements.find((e) => e.id === selectedElementId) ?? null,
    [activeSlide, selectedElementId],
  );

  const replaceProject = useCallback((next: Project) => {
    setProject(next);
    setActiveSlideId(next.slides[0]?.id ?? null);
    setSelectedElementId(null);
  }, []);

  const updateSettings = useCallback((patch: Partial<ProjectSettings>) => {
    setProject((p) => touch({ ...p, settings: { ...p.settings, ...patch } }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setProject((p) => touch({ ...p, title, settings: { ...p.settings, projectTitle: title } }));
  }, []);

  const setSlides = useCallback(
    (next: Slide[], keepSelection = true) => {
      setProject((p) => touch({ ...p, slides: next }));
      if (!keepSelection) {
        setActiveSlideId(next[0]?.id ?? null);
        setSelectedElementId(null);
      } else if (activeSlideId && !next.some((s) => s.id === activeSlideId)) {
        setActiveSlideId(next[0]?.id ?? null);
        setSelectedElementId(null);
      }
    },
    [activeSlideId],
  );

  const addSlide = useCallback(() => {
    const order = slides.length + 1;
    const slide = createSlide(order, 'Slide baru', project.settings.aspect);
    setSlides([...slides, slide]);
    setActiveSlideId(slide.id);
  }, [slides, project.settings.aspect, setSlides]);

  const duplicateSlide = useCallback(
    (id: string) => {
      const idx = slides.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const src = slides[idx];
      const copy: Slide = {
        ...src,
        id: `${src.id}-copy-${Date.now().toString(36)}`,
        title: `${src.title} (salinan)`,
        keywords: src.keywords.map((k) => ({ main: `${k.main} (salinan)`, subs: [...k.subs] })),
        elements: src.elements.map((e) => ({ ...e, id: `${e.id}-copy` }) as SlideElement),
      };
      const next = [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)];
      const renumbered = renumber(next);
      setSlides(syncGoToTargets(slides, renumbered));
      setActiveSlideId(copy.id);
    },
    [slides, setSlides],
  );

  const deleteSlide = useCallback(
    (id: string) => {
      if (slides.length <= 1) return;
      const filtered = slides.filter((s) => s.id !== id);
      const renumbered = renumber(filtered);
      setSlides(syncGoToTargets(slides, renumbered));
    },
    [slides, setSlides],
  );

  const moveSlide = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = slides.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= slides.length) return;
      const next = [...slides];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      const renumbered = renumber(next);
      setSlides(syncGoToTargets(slides, renumbered));
    },
    [slides, setSlides],
  );

  const reorderSlide = useCallback(
    (id: string, toIndex: number) => {
      const idx = slides.findIndex((s) => s.id === id);
      const target = Math.min(slides.length - 1, Math.max(0, toIndex));
      if (idx < 0 || idx === target) return;
      const next = [...slides];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      const renumbered = renumber(next);
      setSlides(syncGoToTargets(slides, renumbered));
    },
    [slides, setSlides],
  );

  const updateSlide = useCallback(
    (id: string, patch: Partial<Slide>) => {
      setSlides(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [slides, setSlides],
  );

  const updateKeywordMain = useCallback(
    (slideId: string, main: string) => {
      setSlides(
        slides.map((s) =>
          s.id === slideId
            ? {
                ...s,
                title: main.trim() || s.title,
                keywords: [{ main: main.trim() || s.title, subs: s.keywords[0]?.subs ?? [] }],
              }
            : s,
        ),
      );
    },
    [slides, setSlides],
  );

  const addElement = useCallback(
    (kind: ElementKind) => {
      if (!activeSlide) return;
      const el = createElement(kind, slides.length);
      // Elemen baru terpilih agar langsung bisa diedit di inspektor
      updateSlide(activeSlide.id, { elements: [...activeSlide.elements, el] });
      setSelectedElementId(el.id);
    },
    [activeSlide, slides.length, updateSlide],
  );

  const updateElement = useCallback(
    (elementId: string, patch: Partial<SlideElement>) => {
      if (!activeSlide) return;
      updateSlide(
        activeSlide.id,
        {
          elements: activeSlide.elements.map((e) =>
            e.id === elementId ? ({ ...e, ...patch } as SlideElement) : e,
          ),
        },
      );
    },
    [activeSlide, updateSlide],
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      if (!activeSlide) return;
      updateSlide(
        activeSlide.id,
        { elements: activeSlide.elements.filter((e) => e.id !== elementId) },
      );
      if (selectedElementId === elementId) setSelectedElementId(null);
    },
    [activeSlide, selectedElementId, updateSlide],
  );

  const retoneProject = useCallback(() => {
    setSlides(slides.map((s) => ({ ...s, tone: toneForOrder(s.order) })));
  }, [slides, setSlides]);

  return {
    state: { project, slides, activeSlide, activeSlideId, selectedElement, selectedElementId },
    actions: {
      replaceProject,
      setTitle,
      updateSettings,
      setSlides,
      addSlide,
      duplicateSlide,
      deleteSlide,
      moveSlide,
      reorderSlide,
      updateSlide,
      updateKeywordMain,
      setActiveSlideId,
      setSelectedElementId,
      addElement,
      updateElement,
      deleteElement,
      retoneProject,
    },
  };
}

export type ProjectStore = ReturnType<typeof useProject>;
