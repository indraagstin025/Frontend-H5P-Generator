/**
 * Modul Parser Impor H5P (packager/h5pParser.ts)
 * 
 * Bertanggung jawab atas:
 * 1. Mengekstrak arsip ZIP .h5p Course Presentation (FR-12).
 * 2. Membaca metadata manifest h5p.json dan slide structure content.json.
 * 3. Memetakan elemen interaktif kembali ke model Project/Slide Studio.
 * 4. Mengekstrak aset gambar latar dan media elemen ke object URL lokal.
 */

import { strFromU8, unzipSync } from 'fflate';
import {
  type AspectRatio,
  createElement,
  createProject,
  createSlide,
  type Project,
  type ShapeElement,
  type Slide,
  type SlideElement,
  uid,
} from '../../../studio/constants/h5pModel';
import { mcAnswerText, plainH5pText } from './elementMapper';
import { AUDIO_MIME, clampPct, IMAGE_MIME, VIDEO_MIME } from './mediaResolver';

export function bytesToUrl(bytes: Uint8Array, mime: string): string {
  return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: mime }));
}

export function mimeForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_MIME[ext] ?? AUDIO_MIME[ext] ?? VIDEO_MIME[ext] ?? 'application/octet-stream';
}

/**
 * Path di params konten relatif terhadap folder content/ (§5).
 * Toleransi paket lama (pra-perbaikan) yang menaruh berkas di akar.
 */
export function resolveContentEntry(
  entries: Record<string, Uint8Array>,
  contentPath: string,
): Uint8Array | undefined {
  return entries[`content/${contentPath}`] ?? entries[contentPath];
}

export function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function parseElement(
  e: Record<string, unknown>,
  slideCount: number,
  entries: Record<string, Uint8Array>,
): SlideElement {
  const position = {
    x: num(e.x, 8),
    y: num(e.y, 8),
    width: num(e.width, 40),
    height: num(e.height, 30),
  };
  const rotation = ((num(e.rotation, 0) % 360) + 360) % 360;
  const displayAsButton = bool(e.displayAsButton, false);
  const popupButtonInvisible = bool(e.popupButtonInvisible, false);
  const popupButtonOpacity = clampPct(num(e.popupButtonOpacity, 100));
  const popupButtonAutoHide = bool(e.popupButtonAutoHide, false);
  const popupButtonVisibleSeconds = Math.min(300, Math.max(0.5, num(e.popupButtonVisibleSeconds, 3)));
  const buttonLabel = str(e.buttonLabel);
  const title = str(e.title);

  // Elemen ber-`action` adalah konten; `goToSlideType` hanya penanda elemen
  // navigasi (yang tidak punya action). Cek action lebih dulu supaya paket
  // lama yang (pernah) mengisi goToSlideType di semua elemen tetap terbaca.
  if (!e.action && typeof e.goToSlideType === 'string') {
    const targetType = (
      e.goToSlideType === 'next' || e.goToSlideType === 'previous'
        ? e.goToSlideType
        : 'specified'
    ) as 'specified' | 'next' | 'previous';
    const g = createElement('goToSlide', slideCount);
    return {
      ...g,
      position,
      rotation,
      displayAsButton,
      popupButtonInvisible,
      popupButtonOpacity,
      popupButtonAutoHide,
      popupButtonVisibleSeconds,
      buttonLabel,
      title,
      label: title || 'Pilihan',
      targetType,
      targetSlide:
        targetType === 'specified'
          ? Math.min(slideCount, Math.max(1, num(e.goToSlide, 1)))
          : g.targetSlide,
      invisible: bool(e.invisible, false),
    };
  }

  const action = (e.action ?? {}) as { library?: string; params?: Record<string, unknown> };
  const machine = str(action.library).split(' ')[0];
  const params = (action.params ?? {}) as Record<string, unknown>;

  const common = {
    position,
    rotation,
    displayAsButton,
    popupButtonInvisible,
    popupButtonOpacity,
    popupButtonAutoHide,
    popupButtonVisibleSeconds,
    buttonLabel,
    title,
  };
  const behaviour = (params.behaviour ?? {}) as Record<string, unknown>;
  const feedback = Array.isArray(params.overallFeedback)
    ? (params.overallFeedback as Array<{ from?: number; to?: number; feedback?: string }>)
    : [];
  const quizSettings = {
    enableRetry: bool(behaviour.enableRetry, true),
    showSolution: bool(behaviour.enableSolutionsButton, true),
    feedbackCorrect: str(
      behaviour.feedbackOnCorrect,
      str(feedback.find((f) => f.to === 100)?.feedback, 'Benar!'),
    ),
    feedbackWrong: str(
      behaviour.feedbackOnWrong,
      str(feedback.find((f) => f.from === 0)?.feedback, 'Coba lagi.'),
    ),
  };

  if (machine === 'H5P.Link') {
    const link = (params.linkWidget ?? {}) as { protocol?: string; url?: string };
    return {
      ...createElement('link', slideCount),
      ...common,
      linkText: str(params.title),
      url: (link.protocol === 'other' ? '' : str(link.protocol)) + str(link.url),
    };
  }
  if (machine === 'H5P.Shape') {
    const shape = (params.shape ?? {}) as { fillColor?: string };
    const line = (params.line ?? {}) as { borderColor?: string };
    const shapeType = ['circle', 'rectangle', 'vertical-line', 'horizontal-line'].includes(str(params.type))
      ? (str(params.type) as ShapeElement['shapeType'])
      : 'rectangle';
    return {
      ...createElement('shape', slideCount),
      ...common,
      shapeType,
      color: str(shape.fillColor, str(line.borderColor, '#4CAF50')),
    };
  }
  if (machine === 'H5P.DragText') {
    return {
      ...createElement('dragWords', slideCount),
      ...common,
      ...quizSettings,
      text: str(params.textField),
    };
  }
  if (machine === 'H5P.Summary') {
    const groups = (params.summaries ?? []) as Array<{ summary?: string[]; tip?: string }>;
    return {
      ...createElement('summary', slideCount),
      ...common,
      ...quizSettings,
      intro: str(params.intro),
      statements: (groups[0]?.summary ?? []).map((text, index) => ({
        id: uid(),
        text,
        correct: index === 0,
      })),
    };
  }
  if (machine === 'H5P.AdvancedText') {
    const t = createElement('advancedText', slideCount);
    return { ...t, ...common, text: str(params.text, '') };
  }
  if (machine === 'H5P.Image') {
    const img = createElement('image', slideCount);
    const f = (params.file ?? {}) as { path?: string };
    const path = str(f.path);
    const imgBytes = path ? resolveContentEntry(entries, path) : undefined;
    return {
      ...img,
      ...common,
      title: str(params.title, title),
      alt: str(params.alt),
      fileName: path.split('/').pop() ?? '',
      objectUrl: path && imgBytes ? bytesToUrl(imgBytes, mimeForPath(path)) : null,
      file: null,
    };
  }
  if (machine === 'H5P.Audio') {
    const au = createElement('audio', slideCount);
    const files = (params.files ?? []) as Array<{ path?: string }>;
    const path = str(files[0]?.path);
    const audioBytes = path ? resolveContentEntry(entries, path) : undefined;
    return {
      ...au,
      ...common,
      fileName: path.split('/').pop() ?? '',
      objectUrl: path && audioBytes ? bytesToUrl(audioBytes, mimeForPath(path)) : null,
      file: null,
    };
  }
  if (machine === 'H5P.Video') {
    const vd = createElement('video', slideCount);
    const sources = (params.sources ?? []) as Array<{ path?: string }>;
    const path = str(sources[0]?.path);
    const isRemote = /^(https?:|data:|blob:)/i.test(path) || path.startsWith('//');
    const videoBytes = !isRemote && path ? resolveContentEntry(entries, path) : undefined;
    return {
      ...vd,
      ...common,
      videoUrl: isRemote ? path : '',
      fileName: !isRemote ? (path.split('/').pop() ?? '') : '',
      objectUrl: !isRemote && path && videoBytes ? bytesToUrl(videoBytes, mimeForPath(path)) : null,
      file: null,
    };
  }
  if (machine === 'H5P.MultiChoice') {
    const m = createElement('multiChoice', slideCount);
    const answers = (params.answers ?? []) as Array<{ text?: unknown; correct?: boolean }>;
    const choiceBehaviour = (params.behaviour ?? {}) as { singleAnswer?: boolean; type?: string };
    return {
      ...m,
      ...quizSettings,
      ...common,
      question: str(params.question, 'Pertanyaan'),
      singleAnswer: choiceBehaviour.type
        ? choiceBehaviour.type === 'single'
        : bool(choiceBehaviour.singleAnswer, false),
      options: answers.map((a) => ({
        id: uid(),
        text: mcAnswerText(a.text),
        correct: bool(a.correct, false),
      })),
    };
  }
  if (machine === 'H5P.TrueFalse') {
    const t = createElement('trueFalse', slideCount);
    const correct = params.correct;
    return {
      ...t,
      ...quizSettings,
      ...common,
      question: str(params.question, 'Pernyataan'),
      correctAnswer: correct === true || correct === 'true' || correct === 'True',
    };
  }
  if (machine === 'H5P.Blanks') {
    const b = createElement('blanks', slideCount);
    const qs = Array.isArray(params.questions) ? (params.questions as unknown[]) : [];
    const text =
      qs
        .map((q) =>
          typeof q === 'string'
            ? q
            : str((q as { question?: unknown } | null)?.question),
        )
        .filter((q) => q.length > 0)
        .join('\n') || str(params.text, '');
    return {
      ...b,
      ...common,
      text,
    };
  }
  if (machine === 'H5P.DragQuestion') {
    const dd = createElement('dragDrop', slideCount);
    const question = (params.question ?? {}) as {
      settings?: { questionTitle?: string };
      task?: {
        dropZones?: Array<{ label?: string; single?: boolean; correctElements?: string[] }>;
        elements?: Array<{ type?: { params?: { text?: string } } }>;
      };
    };
    const rawZones = question.task?.dropZones ?? [];
    const zones = rawZones.map((zone) => ({ id: uid(), label: plainH5pText(str(zone.label)) }));
    const items = (question.task?.elements ?? []).map((item, index) => ({
      id: uid(),
      text: plainH5pText(str(item.type?.params?.text)),
      zoneId: zones[rawZones.findIndex((zone) => zone.correctElements?.includes(String(index)))]?.id ?? '',
    }));
    return {
      ...dd,
      ...quizSettings,
      ...common,
      question: plainH5pText(str(question.settings?.questionTitle, dd.question)),
      zones,
      items,
      allowMultipleItemsPerZone: rawZones.some((zone) => zone.single === false),
    };
  }
  const t = createElement('advancedText', slideCount);
  return { ...t, ...common, text: '' };
}

/** Impor ulang .h5p menjadi proyek yang bisa diedit (FR-12). */
export async function parseH5p(file: File): Promise<Project> {
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const manifestRaw = entries['h5p.json'];
  const contentRaw = entries['content/content.json'];
  if (!manifestRaw || !contentRaw) {
    throw new Error('Berkas .h5p tidak valid (h5p.json/content absen).');
  }
  const manifest = JSON.parse(strFromU8(manifestRaw)) as {
    title?: string;
    language?: string;
    mainLibrary?: string;
  };
  if (manifest.mainLibrary !== 'H5P.CoursePresentation') {
    throw new Error('Paket ini bukan Course Presentation.');
  }
  const content = JSON.parse(strFromU8(contentRaw)) as {
    presentation?: {
      slides?: Array<{
        elements?: Array<Record<string, unknown>>;
        keywords?: Array<{ main?: string; subs?: string[] }>;
        slideBackgroundSelector?: { imageSlideBackground?: { path?: string } };
      }>;
      keywordListEnabled?: boolean;
      generatorRequireQuestionsBeforeNavigation?: boolean;
    };
    override?: {
      activeSurface?: boolean;
      hideSummarySlide?: boolean;
      showSolutionButton?: string | boolean;
      retryButton?: string | boolean;
    };
  };

  const project = createProject(
    manifest.title ?? file.name.replace(/\.h5p$/i, ''),
    '16:9',
    file.name,
  );
  project.settings.language = manifest.language === 'en' ? 'en' : 'id';
  project.settings.keywordListEnabled = content.presentation?.keywordListEnabled ?? true;
  project.settings.requireQuestionsBeforeNavigation = content.presentation?.generatorRequireQuestionsBeforeNavigation ?? true;
  project.settings.activeSurface = content.override?.activeSurface ?? false;
  project.settings.hideSummarySlide = content.override?.hideSummarySlide ?? false;
  const sol = content.override?.showSolutionButton;
  project.settings.showSolutionButton = sol === undefined ? true : sol === 'on' || sol === true;
  const ret = content.override?.retryButton;
  project.settings.retryButton = ret === undefined ? true : ret === 'on' || ret === true;

  let editorMetadata: { version?: number; slides?: Array<Array<Record<string, unknown>>> } = {};
  try {
    if (entries['content/studio-metadata.json']) {
      editorMetadata = JSON.parse(strFromU8(entries['content/studio-metadata.json']));
    }
  } catch {
    /* Optional metadata; standard H5P content remains usable. */
  }
  const cpSlides = content.presentation?.slides ?? [];
  const aspect: AspectRatio = '16:9';
  project.slides = cpSlides.map((cs, idx): Slide => {
    const slide = createSlide(idx + 1, '', aspect);
    const kws = (cs.keywords ?? []).filter((k) => (k.main ?? '').trim().length > 0);
    slide.keywords =
      kws.length > 0
        ? kws.map((k) => ({ main: k.main ?? '', subs: k.subs ?? [] }))
        : [{ main: `Slide ${idx + 1}`, subs: [] }];
    slide.title = slide.keywords[0].main;
    const bgPath = cs.slideBackgroundSelector?.imageSlideBackground?.path;
    const bgBytes = bgPath ? resolveContentEntry(entries, bgPath) : undefined;
    if (bgPath && bgBytes) slide.backgroundUrl = bytesToUrl(bgBytes, mimeForPath(bgPath));
    slide.elements = (cs.elements ?? []).map((e, elementIndex) => {
      let parsed = parseElement(e, cpSlides.length, entries);
      const metadata = editorMetadata?.version === 1 ? editorMetadata.slides?.[idx]?.[elementIndex] : undefined;
      if (metadata && parsed.kind === 'multiChoice' && metadata.kind === 'multimediaChoice') {
        parsed = { ...parsed, kind: 'multimediaChoice' };
      }
      if (metadata && 'enableRetry' in parsed) {
        if (typeof metadata.enableRetry === 'boolean') parsed.enableRetry = metadata.enableRetry;
        if (typeof metadata.showSolution === 'boolean') parsed.showSolution = metadata.showSolution;
        if (typeof metadata.feedbackCorrect === 'string') parsed.feedbackCorrect = metadata.feedbackCorrect;
        if (typeof metadata.feedbackWrong === 'string') parsed.feedbackWrong = metadata.feedbackWrong;
      }
      return parsed;
    });
    return slide;
  });
  return project;
}
