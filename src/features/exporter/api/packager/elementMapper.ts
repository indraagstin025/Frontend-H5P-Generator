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

export function tableHtml(el: { rows: number; cols: number }): string {
  const rows = Math.max(1, Math.min(20, Math.round(el.rows)));
  const cols = Math.max(1, Math.min(20, Math.round(el.cols)));
  const body = Array.from({ length: rows }, () => `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`).join('');
  return `<figure class="table"><table class="h5p-table">${body}</table></figure>`;
}

export function toAction(
  el: SlideElement,
  cpMinor: number,
  media: Map<string, ResolvedMedia>,
): Record<string, unknown> | null {
  switch (el.kind) {
    case 'advancedText':
      return { library: actionLibraryFor(el, cpMinor), params: { text: el.text } };
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
      const taskHeight = 420;
      const dropZones = zones.map((zone, i) => ({
        label: zone.label,
        showLabel: true,
        x: 16 + (i % 3) * 205,
        y: 290 + Math.floor(i / 3) * 70,
        width: 190,
        height: 58,
        correctElements: items
          .map((it, itemIndex) => (it.zoneId === zone.id ? String(itemIndex) : null))
          .filter((v): v is string => v !== null),
        backgroundOpacity: 100,
        single: true,
        autoAlign: false,
      }));
      const elements = items.map((item, i) => ({
        type: {
          library: 'H5P.AdvancedText 1.1',
          params: { text: `<p>${escapeHtml(item.text)}</p>` },
          subContentId: item.id,
        },
        x: 16 + (i % 3) * 205,
        y: 16 + Math.floor(i / 3) * 56,
        width: 190,
        height: 46,
        dropZones: [String(zoneIndex.get(item.zoneId) ?? 0)],
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
          question: {
            settings: { size: { width: taskWidth, height: taskHeight } },
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
            showTitle: false,
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
              summary: ordered.map((s) => ({ text: s.text })),
              tip: { tip: sm.feedbackCorrect },
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
  return { ...base, action };
}

export function toContentJson(
  project: Project,
  cpMinor: number,
  backgrounds?: SlideBackgroundRef[],
  media: Map<string, ResolvedMedia> = new Map(),
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
  return {
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
}

export function toManifest(project: Project, cpMinor: number) {
  const deps = new Map<string, { machineName: string; majorVersion: number; minorVersion: number }>();
  deps.set(COURSE_PRESENTATION.machineName, {
    machineName: COURSE_PRESENTATION.machineName,
    majorVersion: COURSE_PRESENTATION.majorVersion,
    minorVersion: cpMinor,
  });
  for (const slide of project.slides) {
    for (const el of slide.elements) {
      if (el.kind === 'goToSlide') continue;
      const lib = libraryForElement(el, cpMinor);
      deps.set(lib.machineName, {
        machineName: lib.machineName,
        majorVersion: lib.majorVersion,
        minorVersion: lib.minorVersion,
      });
    }
  }
  return {
    title: project.title,
    language: project.settings.language,
    mainLibrary: COURSE_PRESENTATION.machineName,
    embedTypes: ['div', 'iframe'],
    license: 'U',
    preloadedDependencies: [...deps.values()],
  };
}
