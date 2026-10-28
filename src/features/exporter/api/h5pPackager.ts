/**
 * Packager .h5p client-side (§5, FR-11/FR-12) — frontend-only sampai backend menyusul.
 * Skema mengikuti semantics.json resmi h5p-course-presentation:
 * elemen {x,y,width,height,action|goToSlideType/goToSlide,title,
 * displayAsButton,buttonLabel,buttonSize,invisible},
 * slide {elements,keywords,slideBackgroundSelector},
 * root {presentation,override,l10n}, manifest h5p.json.
 * Arsip ZIP hanya berisi entri berkas (tanpa entri direktori).
 */
import { strToU8, strFromU8, unzipSync, zipSync } from 'fflate';
import { actionLibrary } from '../../studio/constants/h5pLibraries';
import { COURSE_PRESENTATION, DEFAULT_CP_MINOR } from '../../studio/constants/h5pLibraries';
import {
  countBlanks,
  createElement,
  createProject,
  createSlide,
  extractBlankAnswers,
  uid,
} from '../../studio/constants/h5pModel';
import type {
  AspectRatio,
  AudioRecorderElement,
  BlanksElement,
  ContinuousTextElement,
  DialogCardsElement,
  DragDropElement,
  DragWordsElement,
  ElementKind,
  ExportableTextElement,
  InteractiveVideoElement,
  LinkElement,
  MarkWordsElement,
  MultiChoiceElement,
  MultimediaChoiceElement,
  Project,
  ShapeElement,
  SingleChoiceElement,
  Slide,
  SlideElement,
  SummaryElement,
  TableElement,
  TrueFalseElement,
  VideoElement,
} from '../../studio/constants/h5pModel';

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};
const AUDIO_MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav' };
const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
};

export function sanitizeExt(name: string, fallback: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{2,4}$/.test(ext) ? ext : fallback;
}

function fileRef(path: string, mime: string, title: string) {
  return { path, mime, copyright: { license: 'U' }, title };
}

function clampPct(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
}

function behaviourOf(el: { enableRetry: boolean; showSolution: boolean }, extra: Record<string, unknown> = {}) {
  return {
    enableRetry: el.enableRetry,
    enableSolutionsButton: el.showSolution,
    ...extra,
  };
}

/** Jawaban MultiChoice bisa string HTML atau objek {text} (toleran saat impor). */
function mcAnswerText(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && typeof (a as { text?: unknown }).text === 'string') {
    const t = (a as { text: string }).text;
    // dukung {text:{text}} warisan
    return mcAnswerText(t);
  }
  return '';
}

function toAction(el: SlideElement, cpMinor: number, assets: Map<string, Uint8Array>): Record<string, unknown> | null {
  void assets;
  switch (el.kind) {
    case 'advancedText':
      return { library: actionLibrary(el.kind, cpMinor), params: { text: el.text } };
    case 'image': {
      const ext = sanitizeExt(el.fileName, 'png');
      const name = `images/el-${el.id.slice(0, 8)}.${ext}`;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          file: fileRef(name, IMAGE_MIME[ext] ?? 'image/png', el.title || el.alt),
          alt: el.alt,
          title: el.title,
        },
      };
    }
    case 'audio': {
      const ext = sanitizeExt(el.fileName, 'mp3');
      const name = `audios/el-${el.id.slice(0, 8)}.${ext}`;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          files: [fileRef(name, AUDIO_MIME[ext] ?? 'audio/mpeg', el.title || name)],
          playerMode: 'minimalistic',
        },
      };
    }
    case 'video': {
      const v = el as VideoElement;
      const ext = sanitizeExt(v.fileName || 'video.mp4', 'mp4');
      const name = `videos/el-${v.id.slice(0, 8)}.${ext}`;
      const sources: Array<Record<string, unknown>> = [];
      if (v.file) {
        sources.push(fileRef(name, VIDEO_MIME[ext] ?? 'video/mp4', v.title || name));
      } else if (v.videoUrl) {
        sources.push({
          path: v.videoUrl,
          mime: VIDEO_MIME[ext] ?? 'video/mp4',
          copyright: { license: 'U' },
        });
      }
      return {
        library: actionLibrary(v.kind, cpMinor),
        params: {
          sources,
          visuals: {
            fit: true,
            controls: true,
          },
          playback: {
            autoplay: false,
            loop: false,
          },
        },
      };
    }
    case 'multiChoice': {
      const m = el as MultiChoiceElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
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
          behaviour: behaviourOf(m, { singleAnswer: m.singleAnswer }),
        },
      };
    }
    case 'trueFalse': {
      const t = el as TrueFalseElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          question: t.question,
          correct: t.correctAnswer ? 'true' : 'false',
          behaviour: behaviourOf(t),
          confirmCheckDialog: false,
        },
      };
    }
    case 'blanks': {
      const b = el as BlanksElement;
      const answers = extractBlankAnswers(b.text);
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          text: b.text,
          questions: answers,
          behaviour: behaviourOf(b, { enableCheckButton: true }),
        },
      };
    }
    case 'link': {
      const l = el as LinkElement;
      let protocol = 'https://';
      let cleanUrl = l.url || '';
      if (/^https?:\/\//i.test(cleanUrl)) {
        protocol = cleanUrl.toLowerCase().startsWith('https://') ? 'https://' : 'http://';
        cleanUrl = cleanUrl.replace(/^https?:\/\//i, '');
      } else if (cleanUrl.startsWith('/')) {
        protocol = '/';
        cleanUrl = cleanUrl.replace(/^\//, '');
      }
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          title: l.linkText || l.title || 'Link',
          linkWidget: {
            protocol,
            url: cleanUrl,
          },
        },
      };
    }
    case 'shape': {
      const s = el as ShapeElement;
      const shapeTypeMap: Record<string, string> = {
        circle: 'circle',
        rectangle: 'rectangle',
        square: 'rectangle',
        triangle: 'rectangle',
      };
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          type: shapeTypeMap[s.shapeType] ?? 'rectangle',
          shape: {
            fillColor: s.color || '#4CAF50',
            borderWidth: 0,
            borderStyle: 'solid',
            borderColor: '#333333',
            borderRadius: s.shapeType === 'circle' ? 50 : 0,
          },
        },
      };
    }
    case 'singleChoice': {
      const sc = el as SingleChoiceElement;
      const sortedOptions = [...sc.options].sort((a, b) => (b.correct ? 1 : 0) - (a.correct ? 1 : 0));
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          choices: [
            {
              question: `<p>${sc.question || 'Pertanyaan'}</p>`,
              answers: sortedOptions.map((o) => `<p>${o.text}</p>`),
            },
          ],
          behaviour: {
            timeoutCorrect: 2000,
            timeoutWrong: 3000,
            soundEffectsEnabled: true,
            enableRetry: sc.enableRetry,
            enableSolutionsButton: sc.showSolution,
            passPercentage: 100,
          },
        },
      };
    }
    case 'dragDrop': {
      const dd = el as DragDropElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          scoreShow: 'Check',
          tryAgain: 'Retry',
          question: {
            settings: {
              size: { width: 620, height: 310 },
            },
            task: {
              elements: [],
              dropZones: [],
            },
          },
          overallFeedback: [],
          behaviour: behaviourOf(dd, {
            preventResize: false,
            singlePoint: false,
            applyPenalties: true,
            dropZoneHighlighting: 'dragging',
            autoAlignSpacing: 2,
          }),
        },
      };
    }
    case 'summary': {
      const sm = el as SummaryElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          intro: `<p>${sm.intro || 'Ringkasan materi di slide ini.'}</p>`,
          summaries: [
            {
              summary: [
                { text: 'Pernyataan rangkuman benar' },
                { text: 'Pernyataan rangkuman salah (distraktor)' },
              ],
            },
          ],
          overallFeedback: [],
          solvedLabel: 'Solved!',
          scoreLabel: 'Wrong answers:',
        },
      };
    }
    case 'dragWords': {
      const dw = el as DragWordsElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          taskDescription: `<p>${dw.title || 'Drag the words into the correct boxes'}</p>`,
          textField: dw.text || 'Drag *kata* ke tempat yang *tepat*.',
          overallFeedback: [],
          behaviour: behaviourOf(dw, {
            instantFeedback: false,
          }),
        },
      };
    }
    case 'markWords': {
      const mw = el as MarkWordsElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          taskDescription: `<p>${mw.title || 'Click on all the correct words.'}</p>`,
          textField: `<p>${mw.text || 'Tandai *kata kunci* dalam kalimat ini.'}</p>`,
          overallFeedback: [],
          behaviour: behaviourOf(mw),
        },
      };
    }
    case 'dialogCards': {
      const dc = el as DialogCardsElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          title: `<p>${dc.title || 'Kartu Dialog'}</p>`,
          description: `<p>${dc.description || 'Balik kartu untuk melihat jawaban.'}</p>`,
          mode: 'normal',
          dialogs: [
            {
              text: `<p style="text-align: center;">${dc.description || 'Pertanyaan kartu'}</p>`,
              answer: '<p style="text-align: center;">Jawaban kartu</p>',
            },
          ],
          behaviour: {
            enableRetry: true,
            scaleTextNotCard: false,
            randomCards: false,
            maxProficiency: 5,
          },
        },
      };
    }
    case 'continuousText': {
      const ct = el as ContinuousTextElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          text: ct.text.startsWith('<') ? ct.text : `<p>${ct.text || 'Teks narasi…'}</p>`,
        },
      };
    }
    case 'exportableText': {
      const et = el as ExportableTextElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          label: `<p>${et.title || 'Catatan Peserta'}</p>`,
          placeholderText: et.text || 'Tulis catatan Anda di sini…',
          exportNotSupported: 'Export not supported on your device',
          exportComments: false,
        },
      };
    }
    case 'table': {
      const tb = el as TableElement;
      const rCount = Math.max(1, Math.min(20, tb.rows || 3));
      const cCount = Math.max(1, Math.min(20, tb.cols || 3));
      let rowsHtml = '';
      for (let r = 0; r < rCount; r++) {
        rowsHtml += '<tr>';
        for (let c = 0; c < cCount; c++) {
          rowsHtml += r === 0 ? `<th>Header ${c + 1}</th>` : `<td>Baris ${r} Kol ${c + 1}</td>`;
        }
        rowsHtml += '</tr>';
      }
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          text: `<figure class="table"><table class="h5p-table">${rowsHtml}</table></figure>`,
        },
      };
    }
    case 'interactiveVideo': {
      const iv = el as InteractiveVideoElement;
      const url = iv.videoUrl || '';
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          interactiveVideo: {
            video: {
              files: url ? [{ path: url, mime: 'video/mp4', copyright: { license: 'U' } }] : [],
              startScreenOptions: {
                title: iv.title || 'Interactive Video',
                hideStartTitle: false,
              },
            },
            assets: {
              interactions: [],
              bookmarks: [],
            },
          },
        },
      };
    }
    case 'audioRecorder': {
      const ar = el as AudioRecorderElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          title: ar.description || ar.title || 'Rekam suara Anda',
          l10n: {
            recordAnswer: 'Record',
            pause: 'Pause',
            continue: 'Continue',
            download: 'Download',
            done: 'Done',
            retry: 'Retry',
          },
        },
      };
    }
    case 'multimediaChoice': {
      const mm = el as MultimediaChoiceElement;
      return {
        library: actionLibrary(el.kind, cpMinor),
        params: {
          question: `<p>${mm.question || 'Pilih jawaban yang benar'}</p>`,
          options: mm.options.map((o) => ({
            media: null,
            correct: o.correct,
            tipsAndFeedback: {
              tip: '',
              chosenFeedback: o.correct ? mm.feedbackCorrect : mm.feedbackWrong,
              notChosenFeedback: '',
            },
          })),
          behaviour: behaviourOf(mm),
        },
      };
    }
    case 'goToSlide':
      return null;
    default: {
      const exhaustiveCheck: never = el;
      throw new Error(`Tipe elemen tidak dikenal: ${(exhaustiveCheck as SlideElement).kind}`);
    }
  }
}

export function toCpElement(el: SlideElement, slideCount: number, cpMinor: number, assets: Map<string, Uint8Array>) {
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
  const action = toAction(el, cpMinor, assets);
  if (!action) {
    throw new Error(`Elemen bertipe "${(el as SlideElement).kind}" tidak menghasilkan konfigurasi action yang valid.`);
  }
  return { ...base, action };
}

export interface SlideBackgroundRef {
  path: string;
  mime: string;
}

export function toContentJson(
  project: Project,
  cpMinor: number,
  backgrounds?: SlideBackgroundRef[],
): Record<string, unknown> {
  const assets = new Map<string, Uint8Array>();
  const n = project.slides.length;
  const slides = project.slides.map((s, idx) => ({
    elements: s.elements.map((el) => toCpElement(el, n, cpMinor, assets)),
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

export function usedKinds(project: Project): ElementKind[] {
  const set = new Set<ElementKind>();
  for (const s of project.slides) for (const el of s.elements) set.add(el.kind);
  return [...set];
}

export function toManifest(project: Project, cpMinor: number) {
  const kinds = usedKinds(project);
  const deps = new Map<string, { machineName: string; majorVersion: number; minorVersion: number }>();
  deps.set(COURSE_PRESENTATION.machineName, {
    machineName: COURSE_PRESENTATION.machineName,
    majorVersion: COURSE_PRESENTATION.majorVersion,
    minorVersion: cpMinor,
  });
  for (const kind of kinds) {
    if (kind === 'goToSlide') continue;
    const lib = actionLibrary(kind, cpMinor);
    const [machineName, ver] = lib.split(' ');
    const [majorVersion, minorVersion] = ver.split('.').map(Number);
    deps.set(machineName, { machineName, majorVersion, minorVersion });
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

const TONE_GRADIENTS: Record<string, [string, string, string]> = {
  lime: ['#d9f7aa', '#88cf68', '#23734b'],
  forest: ['#c9e9ae', '#5ca45a', '#174d39'],
  mint: ['#ebf8d4', '#a5db87', '#327b55'],
  paper: ['#fbfdec', '#d6edbc', '#82bc74'],
};

function renderBackground(slide: Slide): Promise<Uint8Array> {
  const W = slide.aspect === '4:3' ? 1440 : 1920;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas tidak tersedia.'));
  const [c1, c2, c3] = TONE_GRADIENTS[slide.tone] ?? TONE_GRADIENTS.paper;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.47, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20, 63, 40, 0.62)';
  ctx.font = `700 ${Math.round(H * 0.022)}px sans-serif`;
  ctx.fillText(slide.chapter.toUpperCase(), W * 0.1, H * 0.14);
  ctx.fillStyle = '#123d2a';
  ctx.font = `700 ${Math.round(H * 0.075)}px sans-serif`;
  const words = slide.title.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W * 0.55 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
    if (lines.length === 3) break;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W * 0.1, H * (0.26 + i * 0.09)));
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal merender latar slide.'));
        return;
      }
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, 'image/png');
  });
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

const BG_FETCH_TIMEOUT_MS = 20_000;
const BG_MAX_BYTES = 8 * 1024 * 1024;

/** Tebak format gambar dari magic bytes (hanya yang lolos whitelist konten Lumi). */
function sniffImageKind(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    bytes.length > 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (bytes.length > 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  return null;
}

interface ResolvedBackground {
  bytes: Uint8Array;
  ext: string;
  mime: string;
  /** true = gambar asli slide; false = gradien pengganti. */
  real: boolean;
}

/**
 * Ambil gambar latar asli (hasil render server) bila slide memilikinya;
 * gagal/ketiadaan backend → gradien canvas. Tidak pernah melempar error.
 */
async function resolveSlideBackground(slide: Slide): Promise<ResolvedBackground> {
  if (slide.backgroundUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BG_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(slide.backgroundUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length === 0 || bytes.length > BG_MAX_BYTES) throw new Error('Ukuran tak wajar.');
        const kind = sniffImageKind(bytes);
        if (!kind) throw new Error('Bukan gambar.');
        return { bytes, ext: kind.ext, mime: kind.mime, real: true };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // jatuh ke gradien di bawah
    }
  }
  return { bytes: await renderBackground(slide), ext: 'png', mime: 'image/png', real: false };
}
/** Bangun paket .h5p utuh (hanya entri berkas, tanpa entri direktori). */
export interface H5pBuildResult {
  blob: Blob;
  /** Folder library yang ikut dibundel, mis. H5P.CoursePresentation-1.26. */
  bundled: string[];
  /** Dependensi yang tidak ketemu lokal (paket tetap jadi, tanpa library itu). */
  missing: string[];
  /** Latar: berapa slide pakai gambar asli vs gradien pengganti. */
  backgrounds: { real: number; gradient: number };
}

export interface H5pBuildOptions {
  /** Default true: bundel folder library (paket mandiri, bisa dibuka di Lumi). */
  includeLibraries?: boolean;
  /** Ambil berkas library; default fetch dari /h5p-libraries (browser). */
  readLibraryFile?: (relPath: string) => Promise<Uint8Array>;
}

async function fetchLibraryFile(relPath: string): Promise<Uint8Array> {
  const res = await fetch(`/h5p-libraries/${relPath}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${relPath}`);
  return new Uint8Array(await res.arrayBuffer());
}

function decodeJson(raw: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(raw));
}

interface LibDep {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

export type LibraryFileReader = (relPath: string) => Promise<Uint8Array>;

export interface LibraryBundle {
  /** Folder library yang ikut dibundel, mis. H5P.CoursePresentation-1.26. */
  bundled: string[];
  /** Dependensi yang tidak ketemu lokal. */
  missing: string[];
  /** Entri ZIP siap gabung: H5P.X-1.y/rel/path → bytes. */
  files: Record<string, Uint8Array>;
}

/**
 * Bundel tutup dependensi transitif ke entri ZIP. Dipakai buildH5p;
 * diekspor agar bisa diuji headless dengan provider berkas disk.
 */
export async function bundleLibraryFiles(
  deps: LibDep[],
  readFile: LibraryFileReader,
): Promise<LibraryBundle> {
  const missingAll = deps.map((d) => `${d.machineName}-${d.majorVersion}.${d.minorVersion}`);
  let index: Record<string, string[]>;
  try {
    index = (await (async () => decodeJson(await readFile('index.json')))()) as Record<
      string,
      string[]
    >;
  } catch {
    return { bundled: [], missing: [...new Set(missingAll)], files: {} };
  }
  const readJson = async (rel: string): Promise<unknown> => decodeJson(await readFile(rel));
  const { bundled, missing } = await resolveLibraryClosure(deps, readJson, index);
  const files: Record<string, Uint8Array> = {};
  await Promise.all(
    bundled.map(async (dir) => {
      // index menyimpan path relatif dari akar h5p-libraries (sudah termasuk dir)
      const got = await Promise.all(
        (index[dir] ?? []).map(async (rel) => {
          try {
            return { path: rel, bytes: await readFile(rel) } as const;
          } catch {
            return null;
          }
        }),
      );
      for (const entry of got) {
        if (entry) files[entry.path] = entry.bytes;
      }
    }),
  );
  return { bundled, missing: [...new Set(missing)], files };
}
async function resolveLibraryClosure(
  deps: LibDep[],
  readJson: (relPath: string) => Promise<unknown>,
  index: Record<string, string[]> | null,
): Promise<{ bundled: string[]; missing: string[] }> {
  const bundled: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  const queue = [...deps];
  while (queue.length > 0) {
    const dep = queue.shift() as LibDep;
    const dir = `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
    if (seen.has(dir)) continue;
    seen.add(dir);
    const meta = (await readJson(`${dir}/library.json`).catch((): null => null)) as {
      machineName?: string;
      preloadedDependencies?: LibDep[];
    } | null;
    if (!meta || meta.machineName !== dep.machineName || !index || !index[dir]) {
      missing.push(dir);
      continue;
    }
    bundled.push(dir);
    for (const sub of meta.preloadedDependencies ?? []) queue.push(sub);
  }
  return { bundled, missing };
}

export async function buildH5p(
  project: Project,
  cpMinor: number,
  opts: H5pBuildOptions = {},
): Promise<H5pBuildResult> {
  if (project.slides.length === 0) throw new Error('Proyek belum memiliki slide.');
  const manifest = toManifest(project, cpMinor);
  const files: Record<string, Uint8Array> = {};
  files['h5p.json'] = strToU8(JSON.stringify(manifest, null, 2));

  // Latar: gambar asli render server bila ada, gradien bila tidak.
  // Berkas konten wajib di bawah content/ (§5 + validasi Lumi).
  const bgRefs: SlideBackgroundRef[] = [];
  let bgReal = 0;
  for (const slide of project.slides) {
    const bg = await resolveSlideBackground(slide);
    const idx = bgRefs.length;
    bgRefs.push({ path: `images/slide-${idx + 1}.${bg.ext}`, mime: bg.mime });
    files[`content/images/slide-${idx + 1}.${bg.ext}`] = bg.bytes;
    if (bg.real) bgReal += 1;
  }
  files['content/content.json'] = strToU8(JSON.stringify(toContentJson(project, cpMinor, bgRefs)));
  for (const slide of project.slides) {
    for (const el of slide.elements) {
      if ((el.kind === 'image' || el.kind === 'audio' || el.kind === 'video') && el.file) {
        const ext = sanitizeExt(el.fileName, el.kind === 'image' ? 'png' : el.kind === 'audio' ? 'mp3' : 'mp4');
        const dir = el.kind === 'image' ? 'images' : el.kind === 'audio' ? 'audios' : 'videos';
        files[`content/${dir}/el-${el.id.slice(0, 8)}.${ext}`] = await fileToBytes(el.file);
      }
    }
  }

  // Bundel library agar paket mandiri (Lumi Desktop menolak paket tanpa
  // library bila Hub tak terjangkau). Gagal total → paket konten saja.
  let bundled: string[] = [];
  let missing: string[] = [];
  if (opts.includeLibraries !== false) {
    const bundle = await bundleLibraryFiles(
      manifest.preloadedDependencies,
      opts.readLibraryFile ?? fetchLibraryFile,
    );
    bundled = bundle.bundled;
    missing = bundle.missing;
    Object.assign(files, bundle.files);
  }
  const zipped = zipSync(files, { level: 6 });
  // fflate hanya menulis entri berkas — selaras aturan `zip -rDX` (§5).
  return {
    blob: new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }),
    bundled,
    missing: [...new Set(missing)],
    backgrounds: { real: bgReal, gradient: project.slides.length - bgReal },
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeFileName(title: string): string {
  const clean = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${clean || 'modul'}.h5p`;
}

function bytesToUrl(bytes: Uint8Array, mime: string): string {
  return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: mime }));
}

function mimeForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_MIME[ext] ?? AUDIO_MIME[ext] ?? VIDEO_MIME[ext] ?? 'application/octet-stream';
}

/**
 * Path di params konten relatif terhadap folder content/ (§5).
 * Toleransi paket lama (pra-perbaikan) yang menaruh berkas di akar.
 */
function resolveContentEntry(
  entries: Record<string, Uint8Array>,
  contentPath: string,
): Uint8Array | undefined {
  return entries[`content/${contentPath}`] ?? entries[contentPath];
}

/** Impor ulang .h5p menjadi proyek yang bisa diedit (FR-12). */
export async function parseH5p(file: File): Promise<Project> {
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const manifestRaw = entries['h5p.json'];
  const contentRaw = entries['content/content.json'];
  if (!manifestRaw || !contentRaw) throw new Error('Berkas .h5p tidak valid (h5p.json/content absen).');
  const manifest = JSON.parse(strFromU8(manifestRaw)) as { title?: string; language?: string; mainLibrary?: string };
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
    };
    override?: {
      activeSurface?: boolean;
      hideSummarySlide?: boolean;
      showSolutionButton?: string | boolean;
      retryButton?: string | boolean;
    };
  };

  const project = createProject(manifest.title ?? file.name.replace(/\.h5p$/i, ''), '16:9', file.name);
  project.settings.language = manifest.language === 'en' ? 'en' : 'id';
  project.settings.keywordListEnabled = content.presentation?.keywordListEnabled ?? true;
  project.settings.activeSurface = content.override?.activeSurface ?? false;
  project.settings.hideSummarySlide = content.override?.hideSummarySlide ?? false;
  const sol = content.override?.showSolutionButton;
  project.settings.showSolutionButton = sol === undefined ? true : sol === 'on' || sol === true;
  const ret = content.override?.retryButton;
  project.settings.retryButton = ret === undefined ? true : ret === 'on' || ret === true;

  const cpSlides = content.presentation?.slides ?? [];
  const aspect: AspectRatio = '16:9';
  project.slides = cpSlides.map((cs, idx): Slide => {
    const slide = createSlide(idx + 1, '', aspect);
    const kws = (cs.keywords ?? []).filter((k) => (k.main ?? '').trim().length > 0);
    slide.keywords = kws.length > 0 ? kws.map((k) => ({ main: k.main ?? '', subs: k.subs ?? [] })) : [{ main: `Slide ${idx + 1}`, subs: [] }];
    slide.title = slide.keywords[0].main;
    const bgPath = cs.slideBackgroundSelector?.imageSlideBackground?.path;
    const bgBytes = bgPath ? resolveContentEntry(entries, bgPath) : undefined;
    if (bgPath && bgBytes) slide.backgroundUrl = bytesToUrl(bgBytes, mimeForPath(bgPath));
    slide.elements = (cs.elements ?? []).map((e) => parseElement(e, cpSlides.length, entries));
    return slide;
  });
  void DEFAULT_CP_MINOR;
  void countBlanks;
  return project;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function parseElement(e: Record<string, unknown>, slideCount: number, entries: Record<string, Uint8Array>): SlideElement {
  const position = {
    x: num(e.x, 8),
    y: num(e.y, 8),
    width: num(e.width, 40),
    height: num(e.height, 30),
  };
  const displayAsButton = bool(e.displayAsButton, false);
  const buttonLabel = str(e.buttonLabel);
  const title = str(e.title);

  if (typeof e.goToSlideType === 'string') {
    const targetType = (e.goToSlideType === 'next' || e.goToSlideType === 'previous' ? e.goToSlideType : 'specified') as 'specified' | 'next' | 'previous';
    const g = createElement('goToSlide', slideCount);
    return {
      ...g,
      position,
      displayAsButton,
      buttonLabel,
      title,
      label: title || 'Pilihan',
      targetType,
      targetSlide: targetType === 'specified' ? Math.min(slideCount, Math.max(1, num(e.goToSlide, 1))) : g.targetSlide,
      invisible: bool(e.invisible, false),
    };
  }

  const action = (e.action ?? {}) as { library?: string; params?: Record<string, unknown> };
  const machine = str(action.library).split(' ')[0];
  const params = (action.params ?? {}) as Record<string, unknown>;

  if (machine === 'H5P.AdvancedText') {
    const t = createElement('advancedText', slideCount);
    return { ...t, position, displayAsButton, buttonLabel, title, text: str(params.text, '') };
  }
  if (machine === 'H5P.Image') {
    const img = createElement('image', slideCount);
    const f = (params.file ?? {}) as { path?: string };
    const path = str(f.path);
    const imgBytes = path ? resolveContentEntry(entries, path) : undefined;
    return {
      ...img,
      position,
      displayAsButton,
      buttonLabel,
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
      position,
      displayAsButton,
      buttonLabel,
      title,
      fileName: path.split('/').pop() ?? '',
      objectUrl: path && audioBytes ? bytesToUrl(audioBytes, mimeForPath(path)) : null,
      file: null,
    };
  }
  if (machine === 'H5P.Video') {
    const vd = createElement('video', slideCount);
    const sources = (params.sources ?? []) as Array<{ path?: string }>;
    const path = str(sources[0]?.path);
    const isRemote = /^https?:\/\//i.test(path);
    const videoBytes = !isRemote && path ? resolveContentEntry(entries, path) : undefined;
    return {
      ...vd,
      position,
      displayAsButton,
      buttonLabel,
      title,
      videoUrl: isRemote ? path : '',
      fileName: !isRemote ? (path.split('/').pop() ?? '') : '',
      objectUrl: !isRemote && path && videoBytes ? bytesToUrl(videoBytes, mimeForPath(path)) : null,
      file: null,
    };
  }
  if (machine === 'H5P.MultiChoice') {
    const m = createElement('multiChoice', slideCount);
    const answers = (params.answers ?? []) as Array<{ text?: unknown; correct?: boolean }>;
    const behaviour = (params.behaviour ?? {}) as { singleAnswer?: boolean };
    return {
      ...m,
      position,
      displayAsButton,
      buttonLabel,
      title,
      question: str(params.question, 'Pertanyaan'),
      singleAnswer: bool(behaviour.singleAnswer, true),
      options: answers.map((a) => ({ id: uid(), text: mcAnswerText(a.text), correct: bool(a.correct, false) })),
    };
  }
  if (machine === 'H5P.TrueFalse') {
    const t = createElement('trueFalse', slideCount);
    const correct = params.correct;
    return {
      ...t,
      position,
      displayAsButton,
      buttonLabel,
      title,
      question: str(params.question, 'Pernyataan'),
      correctAnswer: correct === true || correct === 'true' || correct === 'True',
    };
  }
  if (machine === 'H5P.Blanks') {
    const b = createElement('blanks', slideCount);
    return {
      ...b,
      position,
      displayAsButton,
      buttonLabel,
      title,
      text: str(params.text, ''),
    };
  }
  const t = createElement('advancedText', slideCount);
  return { ...t, position, displayAsButton, buttonLabel, title, text: '' };
}
