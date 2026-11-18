/**
 * Modul Pemetaan Semantik Elemen H5P (packager/elementMapper.ts)
 * 
 * Bertanggung jawab atas:
 * 1. Serialisasi 18 varian elemen kanvas ke format aksi Course Presentation H5P.
 * 2. Pembuatan struktur content.json sesuai semantics.json resmi.
 * 3. Pembuatan berkas manifest h5p.json dengan preloadedDependencies yang lengkap.
 */

import {
  actionLibraryFor,
  COURSE_PRESENTATION,
  libraryForElement,
} from '../../../studio/constants/h5pLibraries';
import type {
  BlanksElement,
  DialogCardsElement,
  DragDropElement,
  DragWordsElement,
  LinkElement,
  MarkWordsElement,
  MultiChoiceElement,
  MultimediaChoiceElement,
  Project,
  ShapeElement,
  SingleChoiceElement,
  SlideElement,
  SummaryElement,
  TrueFalseElement,
  VideoElement,
} from '../../../studio/constants/h5pModel';
import {
  AUDIO_MIME,
  clampPct,
  fileRef,
  IMAGE_MIME,
  mediaContentPath,
  type ResolvedMedia,
  sanitizeExt,
  VIDEO_MIME,
} from './mediaResolver';

export interface SlideBackgroundRef {
  path: string;
  mime: string;
}

export interface LibDep {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

export function decodeJson(raw: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(raw));
}

/**
 * Potongan semantics.json yang relevan untuk mengisi default.
 *
 * Kenapa perlu: library H5P membaca params seperti `params.UI.checkAnswerButton`
 * atau `dropZone.tipsAndFeedback.tip` TANPA guard. Params yang tidak kita tulis
 * dan tidak diisi default (karena paket tidak melewati editor H5P) membuat
 * player meledak: "Cannot read properties of undefined". Dengan mengisi default
 * dari semantics.json milik library itu sendiri, isi paket selalu lengkap dan
 * mengikuti versi library yang ikut dibundel.
 */
export interface SemanticsField {
  name: string;
  type?: string;
  default?: unknown;
  optional?: boolean;
  defaultNum?: number;
  min?: number;
  options?: Array<{ value?: unknown }>;
  fields?: SemanticsField[];
  field?: SemanticsField;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function defaultFor(node: SemanticsField): unknown {
  if (node.default !== undefined) return node.default;
  const type = node.type ?? 'text';

  if (type === 'library') return undefined;
  if (type === 'file' || type === 'image' || type === 'video' || type === 'audio') return undefined;

  if (type === 'group') {
    const fields = node.fields ?? [];
    const sameName = fields.find((f) => f.name === node.name && f.type === 'list');
    if (sameName) {
      const count = sameName.defaultNum ?? sameName.min ?? 0;
      const out: unknown[] = [];
      for (let i = 0; i < count; i++) out.push(defaultFor(sameName.field ?? sameName));
      return out;
    }
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = defaultFor(f);
      if (v !== undefined) out[f.name] = v;
    }
    return out;
  }

  if (type === 'list') {
    const count = node.defaultNum ?? 0;
    const out: unknown[] = [];
    for (let i = 0; i < count; i++) out.push(defaultFor(node.field ?? node));
    return out;
  }

  if (type === 'number') return node.min ?? 0;
  if (type === 'boolean') return false;
  if (type === 'select') {
    const first = node.options?.find((o) => o.value !== undefined)?.value;
    return first ?? '';
  }
  return '';
}

export function fillSemanticsDefaults(
  semantics: SemanticsField[],
  params: Record<string, unknown>,
): Record<string, unknown> {
  for (const node of semantics) {
    const value = params[node.name];
    if (value === undefined) {
      const d = defaultFor(node);
      if (d !== undefined) params[node.name] = d;
      continue;
    }
    if (node.type === 'group' && isPlainObject(value)) {
      if (node.fields) fillSemanticsDefaults(node.fields, value);
      continue;
    }
    if (node.type === 'list' && Array.isArray(value) && node.field?.type === 'group' && node.field.fields) {
      for (const item of value) {
        if (isPlainObject(item)) fillSemanticsDefaults(node.field.fields, item);
      }
    }
  }
  return params;
}

export async function loadLibrarySemantics(
  deps: LibDep[],
  readFile: (relPath: string) => Promise<Uint8Array>,
): Promise<Record<string, SemanticsField[]>> {
  const out: Record<string, SemanticsField[]> = {};
  await Promise.all(
    deps.map(async (dep) => {
      try {
        const dir = `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
        const parsed = decodeJson(await readFile(`${dir}/semantics.json`)) as SemanticsField[];
        if (Array.isArray(parsed) && parsed.length > 0) out[dep.machineName] = parsed;
      } catch {
        // library tanpa semantics.json — biarkan tanpa default tambahan
      }
    }),
  );
  return out;
}

export function applySemanticsDefaults(
  content: Record<string, unknown>,
  semantics: Record<string, SemanticsField[]> | undefined,
): void {
  if (!semantics) return;
  const cpSemantics = semantics[COURSE_PRESENTATION.machineName];
  if (cpSemantics) {
    fillSemanticsDefaults(
      cpSemantics.filter((f) => f.name !== 'presentation'),
      content,
    );
  }

  const presentation = content.presentation as
    | { slides?: Array<{ elements?: Array<Record<string, unknown>> }> }
    | undefined;
  for (const slide of presentation?.slides ?? []) {
    for (const el of slide.elements ?? []) {
      const action = el.action as { library?: string; params?: Record<string, unknown> } | undefined;
      if (!action?.library || !isPlainObject(action.params)) continue;
      const machineName = action.library.split(' ')[0];
      const libSemantics = semantics[machineName];
      if (libSemantics) fillSemanticsDefaults(libSemantics, action.params);
    }
  }
}

export function behaviourOf(
  el: { enableRetry: boolean; showSolution: boolean },
  extra: Record<string, unknown> = {},
) {
  return {
    enableRetry: el.enableRetry,
    enableSolutionsButton: el.showSolution,
    ...extra,
  };
}

/** Jawaban MultiChoice bisa string HTML atau objek {text} (toleran saat impor). */
export function mcAnswerText(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && typeof (a as { text?: unknown }).text === 'string') {
    const t = (a as { text: string }).text;
    // dukung {text:{text}} warisan
    return mcAnswerText(t);
  }
  return '';
}

export function splitLinkUrl(raw: string): { protocol: string; url: string } {
  const url = raw.trim();
  if (url.startsWith('https://')) return { protocol: 'https://', url: url.slice(8) };
  if (url.startsWith('http://')) return { protocol: 'http://', url: url.slice(7) };
  if (url.startsWith('/')) return { protocol: '/', url: url.slice(1) };
  return { protocol: 'other', url };
}

export function videoSource(
  el: { fileName: string; file: File | null; objectUrl?: string | null; videoUrl: string; title: string },
  id: string,
  asset?: ResolvedMedia,
) {
  if (asset) {
    return fileRef(asset.path, asset.mime, el.title || el.fileName || asset.path);
  }
  if (el.file) {
    const ext = sanitizeExt(el.fileName, 'mp4');
    return fileRef(
      `videos/el-${id.slice(0, 8)}.${ext}`,
      VIDEO_MIME[ext] ?? 'video/mp4',
      el.title || el.fileName,
    );
  }
  const url = el.videoUrl.trim() || (el.objectUrl ?? '').trim();
  if (!url) return null;
  const clean = url.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase() ?? '';
  return fileRef(url, VIDEO_MIME[ext] ?? 'video/mp4', el.title || url);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text fields exported into H5P HTML must decode once on re-import. */
export function plainH5pText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (!code.startsWith('#')) return named[code.toLowerCase()] ?? entity;
    const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  });
}

export function tableHtml(el: { rows: number; cols: number }): string {
  const rows = Math.max(1, Math.min(20, Math.round(el.rows)));
  const cols = Math.max(1, Math.min(20, Math.round(el.cols)));
  const body = Array.from({ length: rows }, () => `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`).join('');
  return `<figure class="table"><table class="h5p-table">${body}</table></figure>`;
}

export function overallFeedbackOf(el: { feedbackCorrect: string; feedbackWrong: string }) {
  return [{ from: 0, to: 99, feedback: el.feedbackWrong }, { from: 100, to: 100, feedback: el.feedbackCorrect }];
}

export function toAction(
  el: SlideElement,
  cpMinor: number,
  media: Map<string, ResolvedMedia>,
): Record<string, unknown> | null {
  switch (el.kind) {
    case 'advancedText':
      return { library: actionLibraryFor(el, cpMinor), params: { text: el.fontSize && Number.isFinite(el.fontSize) ? `<div style="font-size: ${Math.max(1, el.fontSize)}px">${el.text}</div>` : el.text } };
    case 'link': {
      const link = el as LinkElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          title: link.linkText || link.title || link.url,
          linkWidget: splitLinkUrl(link.url),
        },
      };
    }
    case 'image': {
      const asset = media.get(el.id);
      const ext = asset?.ext ?? sanitizeExt(el.fileName, 'png');
      const name = asset?.path ?? mediaContentPath('image', el.id, ext);
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          file: fileRef(name, asset?.mime ?? IMAGE_MIME[ext] ?? 'image/png', el.title || el.alt),
          alt: el.alt,
          title: el.title,
        },
      };
    }
    case 'shape': {
      const shape = el as ShapeElement;
      const type =
        shape.shapeType === 'circle'
          ? 'circle'
          : shape.shapeType === 'vertical-line'
            ? 'vertical-line'
            : shape.shapeType === 'horizontal-line'
              ? 'horizontal-line'
              : 'rectangle';
      return {
        library: actionLibraryFor(el, cpMinor),
        params:
          type === 'circle' || type === 'rectangle'
            ? {
                type,
                shape: {
                  fillColor: shape.color,
                  borderColor: '#1f2937',
                  borderWidth: '2',
                  borderStyle: 'solid',
                  borderRadius: type === 'circle' ? '20' : '0',
                },
              }
            : {
                type,
                line: { borderColor: shape.color, borderWidth: '4', borderStyle: 'solid' },
              },
      };
    }
    case 'video': {
      const asset = media.get(el.id);
      const source = videoSource(el as VideoElement, el.id, asset);
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          sources: source ? [source] : [],
          visuals: { fit: true, controls: true },
          playback: { autoplay: false, loop: false },
          a11y: [],
        },
      };
    }
    case 'audio': {
      const asset = media.get(el.id);
      const ext = asset?.ext ?? sanitizeExt(el.fileName, 'mp3');
      const name = asset?.path ?? mediaContentPath('audio', el.id, ext);
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          files: [fileRef(name, asset?.mime ?? AUDIO_MIME[ext] ?? 'audio/mpeg', el.title || name)],
          playerMode: 'minimalistic',
        },
      };
    }
    case 'singleChoice': {
      const sc = el as SingleChoiceElement;
      const answers = [...sc.options]
        .sort((a, b) => Number(b.correct) - Number(a.correct))
        .map((o) => o.text);
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          choices: [{ question: sc.question, answers }],
          behaviour: {
            autoContinue: true,
            enableRetry: sc.enableRetry,
            enableSolutionsButton: sc.showSolution,
            passPercentage: 50,
            soundEffectsEnabled: false,
            timeoutCorrect: 2,
            timeoutWrong: 5,
          },
        },
      };
    }
    case 'multiChoice':
    case 'multimediaChoice': {
      const m = el as MultiChoiceElement | MultimediaChoiceElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          question: m.question,
          answers: m.options.map((o) => ({
            text: o.text,
            correct: o.correct,
            tipsAndFeedback: {
              tip: '',
              chosenFeedback: o.correct ? m.feedbackCorrect : m.feedbackWrong,
              notChosenFeedback: '',
            },
          })),
          behaviour: behaviourOf(m, {
            singlePoint: true,
            // MultimediaChoice mengikuti jumlah jawaban benar (auto);
            // MultiChoice tetap mengikuti sakelar singleAnswer.
            type:
              el.kind === 'multimediaChoice'
                ? 'auto'
                : (el as MultiChoiceElement).singleAnswer
                  ? 'single'
                  : 'multi',
          }),
        },
      };
    }
    case 'trueFalse': {
      const t = el as TrueFalseElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          question: t.question,
          correct: t.correctAnswer ? 'true' : 'false',
          behaviour: behaviourOf(t, {
            feedbackOnCorrect: t.feedbackCorrect,
            feedbackOnWrong: t.feedbackWrong,
            confirmCheckDialog: false,
            confirmRetryDialog: false,
          }),
        },
      };
    }
    case 'blanks': {
      const b = el as BlanksElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          // H5P.Blanks membaca baris soal (dengan *jawaban*) dari `questions`.
          text: '',
          questions: [b.text],
          behaviour: behaviourOf(b, { enableCheckButton: true }),
        },
      };
    }
    case 'dragDrop': {
      const dd = el as DragDropElement;
      const zones = dd.zones.length > 0 ? dd.zones : [{ id: 'zone-1', label: 'Zona 1' }];
      const items = dd.items.length > 0 ? dd.items : [{ id: 'item-1', text: 'Item 1', zoneId: zones[0].id }];
      const zoneIndex = new Map(zones.map((z, i) => [z.id, i]));
      const taskWidth = 640;
      const columns = Math.min(3, Math.max(items.length, zones.length));
      const gap = 16;
      const cellWidth = (taskWidth - gap * (columns + 1)) / columns;
      const itemWidth = cellWidth - 20;
      const itemHeight = Math.max(
        46,
        ...items.map(
          (item) =>
            Math.ceil(Math.max(1, item.text.length) / Math.max(1, Math.floor((itemWidth - 16) / 9))) * 24 + 16,
        ),
      );
      const targetFor = (item: typeof items[number]) => zoneIndex.get(item.zoneId) ?? -1;
      const capacity = dd.allowMultipleItemsPerZone === true ? items.length : 1;
      const zoneHeight = 40 + capacity * (itemHeight + 10);
      const zoneTop = gap + Math.ceil(items.length / columns) * (itemHeight + gap) + 32;
      const taskHeight = Math.max(420, zoneTop + Math.ceil(zones.length / columns) * (zoneHeight + gap));
      const xPct = (px: number) => (px / taskWidth) * 100;
      const yPct = (px: number) => (px / taskHeight) * 100;
      const dropZones = zones.map((zone, i) => ({
        label: escapeHtml(zone.label),
        showLabel: true,
        x: xPct(gap + (i % columns) * (cellWidth + gap)),
        y: yPct(zoneTop + Math.floor(i / columns) * (zoneHeight + gap)),
        width: cellWidth / 16,
        height: zoneHeight / 16,
        correctElements: items
          .map((it, itemIndex) => (targetFor(it) === i ? String(itemIndex) : null))
          .filter((v): v is string => v !== null),
        backgroundOpacity: 100,
        single: dd.allowMultipleItemsPerZone !== true,
        autoAlign: true,
      }));
      const elements = items.map((item, i) => ({
        type: {
          library: 'H5P.AdvancedText 1.1',
          params: { text: `<p>${escapeHtml(item.text)}</p>` },
          subContentId: item.id,
        },
        x: xPct(gap + (i % columns) * (cellWidth + gap) + 10),
        y: yPct(gap + Math.floor(i / columns) * (itemHeight + gap)),
        width: itemWidth / 16,
        height: itemHeight / 16,
        dropZones: zones.map((_, index) => String(index)),
        backgroundOpacity: 100,
        multiple: false,
      }));
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          scoreShow: 'Tampilkan nilai',
          submit: 'Periksa',
          tryAgain: 'Coba lagi',
          scoreExplanation: 'Penjelasan nilai',
          overallFeedback: overallFeedbackOf(dd),
          question: {
            settings: {
              questionTitle: escapeHtml(dd.question || dd.title || 'Seret item ke zona yang sesuai.'),
              size: { width: taskWidth, height: taskHeight },
            },
            task: { elements, dropZones },
          },
          behaviour: {
            enableRetry: dd.enableRetry,
            enableCheckButton: true,
            singlePoint: false,
            applyPenalties: false,
            dropZoneHighlighting: 'dragging',
            autoAlignSpacing: 10,
            enableFullScreen: false,
            showScorePoints: true,
            showTitle: true,
          },
        },
      };
    }
    case 'summary': {
      const sm = el as SummaryElement;
      const ordered = [...sm.statements].sort((a, b) => Number(b.correct) - Number(a.correct));
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          intro: sm.intro,
          summaries: [
            {
              summary: ordered.map((s) => s.text),
              tip: sm.feedbackCorrect,
            },
          ],
        },
      };
    }
    case 'dragWords': {
      const dw = el as DragWordsElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          taskDescription: dw.title || 'Lengkapi kalimat berikut',
          textField: dw.text,
          overallFeedback: overallFeedbackOf(dw),
          behaviour: behaviourOf(dw, { enableCheckButton: true }),
        },
      };
    }
    case 'markWords': {
      const mw = el as MarkWordsElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          taskDescription: mw.title || 'Tandai kata yang benar',
          textField: mw.text,
          behaviour: behaviourOf(mw, { enableCheckButton: true, showScorePoints: true }),
        },
      };
    }
    case 'dialogCards': {
      const dc = el as DialogCardsElement;
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          title: dc.title || 'Dialog Cards',
          mode: 'normal',
          description: dc.description,
          dialogs: dc.cards.map((card) => ({
            text: card.front,
            answer: card.back,
          })),
          behaviour: { scaleTextNotCard: true, randomCards: false, enableRetry: true },
        },
      };
    }
    case 'continuousText':
      return { library: actionLibraryFor(el, cpMinor), params: { text: el.text } };
    case 'exportableText':
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          label: el.text,
          index: 1,
          exportNotSupported: 'Ekspor tidak didukung di browser ini.',
        },
      };
    case 'table':
      return { library: actionLibraryFor(el, cpMinor), params: { text: tableHtml(el) } };
    case 'interactiveVideo': {
      const source = videoSource(
        {
          fileName: '',
          file: null,
          videoUrl: el.videoUrl,
          title: el.title,
        },
        el.id,
      );
      return {
        library: actionLibraryFor(el, cpMinor),
        params: {
          sources: source ? [source] : [],
          visuals: { fit: true, controls: true },
          playback: { autoplay: false, loop: false },
          a11y: [],
        },
      };
    }
    case 'audioRecorder':
      return {
        library: actionLibraryFor(el, cpMinor),
        params: { title: el.description || el.title || 'Audio Recorder' },
      };
    case 'goToSlide':
      return null;
    default: {
      const exhaustiveCheck: never = el;
      throw new Error(`Tipe elemen tidak dikenal: ${(exhaustiveCheck as SlideElement).kind}`);
    }
  }
}

export function toCpElement(
  el: SlideElement,
  slideCount: number,
  cpMinor: number,
  media: Map<string, ResolvedMedia>,
) {
  const base = {
    x: clampPct(el.position.x),
    y: clampPct(el.position.y),
    width: clampPct(el.position.width),
    height: clampPct(el.position.height),
    title: el.title || undefined,
    displayAsButton: el.displayAsButton,
    buttonLabel: el.buttonLabel || undefined,
    buttonSize: 'big',
    rotation: ((el.rotation ?? 0) % 360 + 360) % 360,
    popupButtonInvisible: el.displayAsButton && el.popupButtonInvisible === true,
    popupButtonOpacity: clampPct(el.popupButtonOpacity ?? 100),
    popupButtonAutoHide: el.displayAsButton && el.popupButtonAutoHide === true,
    popupButtonVisibleSeconds: Math.min(300, Math.max(0.5, el.popupButtonVisibleSeconds ?? 3)),
  };
  if (el.kind === 'goToSlide') {
    return {
      ...base,
      title: el.label,
      goToSlideType: el.targetType,
      ...(el.targetType === 'specified'
        ? { goToSlide: Math.min(slideCount, Math.max(1, el.targetSlide)) }
        : {}),
      invisible: el.invisible,
    };
  }
  const action = toAction(el, cpMinor, media);
  if (!action) return null;
  return { ...base, action: { ...action, subContentId: el.id } };
}

export function toContentJson(
  project: Project,
  cpMinor: number,
  backgrounds?: SlideBackgroundRef[],
  media: Map<string, ResolvedMedia> = new Map(),
  semantics?: Record<string, SemanticsField[]>,
): Record<string, unknown> {
  const n = project.slides.length;
  const slides = project.slides.map((s, idx) => ({
    elements: s.elements
      .map((el) => toCpElement(el, n, cpMinor, media))
      .filter((el): el is NonNullable<typeof el> => el !== null),
    keywords: s.keywords
      .filter((k) => k.main.trim().length > 0)
      .map((k) => ({ main: k.main, subs: k.subs.filter((x) => x.trim().length > 0) })),
    slideBackgroundSelector: {
      imageSlideBackground: fileRef(
        backgrounds?.[idx]?.path ?? `images/slide-${idx + 1}.png`,
        backgrounds?.[idx]?.mime ?? 'image/png',
        s.title,
      ),
    },
  }));
  const content: Record<string, unknown> = {
    presentation: {
      slides,
      keywordListEnabled: project.settings.keywordListEnabled,
      keywordListAlwaysShow: false,
      keywordListAutoHide: false,
      keywordListOpacity: 100,
      globalBackgroundSelector: {},
    },
    override: {
      activeSurface: project.settings.activeSurface,
      hideSummarySlide: project.settings.hideSummarySlide,
      showSolutionButton: project.settings.showSolutionButton ? 'on' : 'off',
      retryButton: project.settings.retryButton ? 'on' : 'off',
      summarySlideSolutionButton: project.settings.showSolutionButton,
      summarySlideRetryButton: project.settings.retryButton,
    },
    l10n: {},
  };
  applySemanticsDefaults(content, semantics);
  return content;
}

export function toManifest(project: Project, cpMinor: number, extraDeps: LibDep[] = []) {
  const deps = new Map<string, LibDep>();
  const add = (dep: LibDep) => {
    const prev = deps.get(dep.machineName);
    if (
      !prev ||
      dep.majorVersion > prev.majorVersion ||
      (dep.majorVersion === prev.majorVersion && dep.minorVersion > prev.minorVersion)
    ) {
      deps.set(dep.machineName, dep);
    }
  };
  add({
    machineName: COURSE_PRESENTATION.machineName,
    majorVersion: COURSE_PRESENTATION.majorVersion,
    minorVersion: cpMinor,
  });
  for (const slide of project.slides) {
    for (const el of slide.elements) {
      if (el.kind === 'goToSlide') continue;
      add(libraryForElement(el, cpMinor));
    }
  }
  for (const dep of extraDeps) add(dep);
  return {
    title: project.title,
    language: project.settings.language,
    mainLibrary: COURSE_PRESENTATION.machineName,
    embedTypes: ['div', 'iframe'],
    license: 'U',
    preloadedDependencies: [...deps.values()],
  };
}
