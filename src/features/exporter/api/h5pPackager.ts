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
import { actionLibraryFor, libraryForElement } from '../../studio/constants/h5pLibraries';
import { COURSE_PRESENTATION } from '../../studio/constants/h5pLibraries';
import {
  createElement,
  createProject,
  createSlide,
  uid,
} from '../../studio/constants/h5pModel';
import type {
  AspectRatio,
  AudioElement,
  BlanksElement,
  DialogCardsElement,
  DragDropElement,
  ImageElement,
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
  TrueFalseElement,
  VideoElement,
  DragWordsElement,
} from '../../studio/constants/h5pModel';

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};
const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};
const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
};

type MediaKind = 'image' | 'audio' | 'video';
type MediaElement = ImageElement | AudioElement | VideoElement;

const MEDIA_DIR: Record<MediaKind, string> = {
  image: 'images',
  audio: 'audios',
  video: 'videos',
};
const MEDIA_MIME: Record<MediaKind, Record<string, string>> = {
  image: IMAGE_MIME,
  audio: AUDIO_MIME,
  video: VIDEO_MIME,
};
const MEDIA_FALLBACK_EXT: Record<MediaKind, string> = { image: 'png', audio: 'mp3', video: 'mp4' };
const MEDIA_LABEL: Record<MediaKind, string> = { image: 'Gambar', audio: 'Suara', video: 'Video' };
/** Batas ukuran mengikuti editor properti (video 50 MB, media lain 10 MB). */
const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};
const ASSET_FETCH_TIMEOUT_MS = 20_000;

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

/** Aset media yang sudah siap ditulis ke content/ dan dirujuk action. */
interface ResolvedMedia {
  bytes: Uint8Array;
  ext: string;
  mime: string;
  /** Path relatif terhadap folder content/ di paket .h5p. */
  path: string;
}

function isMediaElement(el: SlideElement): el is MediaElement {
  return el.kind === 'image' || el.kind === 'audio' || el.kind === 'video';
}

function mediaContentPath(kind: MediaKind, id: string, ext: string): string {
  return `${MEDIA_DIR[kind]}/el-${id.slice(0, 8)}.${ext}`;
}

function extFromName(name: string): string {
  const clean = name.split('?')[0].split('#')[0];
  return sanitizeExt(clean.split('/').pop() ?? '', '');
}

function allowedExt(kind: MediaKind, ext: string): string {
  return ext && MEDIA_MIME[kind][ext] ? ext : '';
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return '';
  let out = '';
  for (let i = 0; i < length; i += 1) out += String.fromCharCode(bytes[offset + i]);
  return out;
}

/**
 * Tebak jenis media dari magic bytes. Ekstensi hasil tebakan dipakai agar
 * path di content.json selalu cocok dengan isi berkas, walau nama dari
 * server keliru atau URL tidak punya ekstensi.
 */
function sniffMediaKind(kind: MediaKind, bytes: Uint8Array): { ext: string; mime: string } | null {
  if (kind === 'image') return sniffImageKind(bytes);
  if (kind === 'audio') {
    if (asciiAt(bytes, 0, 3) === 'ID3') return { ext: 'mp3', mime: 'audio/mpeg' };
    if (bytes.length > 1 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
      return { ext: 'mp3', mime: 'audio/mpeg' };
    }
    if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WAVE') {
      return { ext: 'wav', mime: 'audio/wav' };
    }
    if (asciiAt(bytes, 0, 4) === 'OggS') return { ext: 'ogg', mime: 'audio/ogg' };
    if (asciiAt(bytes, 4, 4) === 'ftyp') return { ext: 'm4a', mime: 'audio/mp4' };
    return null;
  }
  if (asciiAt(bytes, 4, 4) === 'ftyp') return { ext: 'mp4', mime: 'video/mp4' };
  if (bytes.length > 3 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { ext: 'webm', mime: 'video/webm' };
  }
  if (asciiAt(bytes, 0, 4) === 'OggS') return { ext: 'ogv', mime: 'video/ogg' };
  return null;
}

function chooseMediaExt(kind: MediaKind, bytes: Uint8Array, mime: string, names: string[]): string {
  const sniffed = sniffMediaKind(kind, bytes);
  if (sniffed) return sniffed.ext;
  const fromMime = allowedExt(kind, MIME_EXT[mime.toLowerCase()] ?? '');
  if (fromMime) return fromMime;
  for (const name of names) {
    const ext = allowedExt(kind, extFromName(name));
    if (ext) return ext;
  }
  return MEDIA_FALLBACK_EXT[kind];
}

async function fetchMediaBytes(
  url: string,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; mime: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSET_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error(`ukuran melebihi ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0) throw new Error('berkas kosong');
    if (bytes.length > maxBytes) {
      throw new Error(`ukuran melebihi ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    return { bytes, mime: (res.headers.get('content-type') ?? '').split(';')[0].trim() };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('waktu pengambilan habis');
    }
    if (err instanceof TypeError) {
      throw new Error('tidak bisa diambil (jaringan/CORS)');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Ambil bytes + ekstensi aset elemen, baik dari File lokal maupun objectUrl server. */
async function resolveMediaElement(el: MediaElement): Promise<ResolvedMedia | null> {
  let bytes: Uint8Array;
  let mime = '';
  let names: string[] = [];
  if (el.file) {
    bytes = await fileToBytes(el.file);
    mime = el.file.type;
    names = [el.file.name, el.fileName];
  } else {
    if (!el.objectUrl) return null;
    const fetched = await fetchMediaBytes(el.objectUrl, MEDIA_MAX_BYTES[el.kind]);
    bytes = fetched.bytes;
    mime = fetched.mime;
    names = [el.fileName, el.objectUrl];
  }
  const sniffed = sniffMediaKind(el.kind, bytes);
  const ext = chooseMediaExt(el.kind, bytes, mime, names);
  return {
    bytes,
    ext,
    mime: MEDIA_MIME[el.kind][ext] ?? sniffed?.mime ?? 'application/octet-stream',
    path: mediaContentPath(el.kind, el.id, ext),
  };
}

/**
 * Kumpulkan aset gambar/audio/video dari semua slide. Aset server (objectUrl)
 * di-fetch ulang supaya ikut masuk paket; batasi 4 fetch paralel agar tidak
 * membanjiri backend saat satu presentasi berisi banyak gambar.
 */
async function resolveProjectMedia(project: Project): Promise<{
  media: Map<string, ResolvedMedia>;
  failed: string[];
}> {
  const media = new Map<string, ResolvedMedia>();
  const failed: string[] = [];
  const queue: Array<{ el: MediaElement; order: number }> = [];
  for (const slide of project.slides) {
    for (const el of slide.elements) {
      if (isMediaElement(el) && (el.file || el.objectUrl)) queue.push({ el, order: slide.order });
    }
  }
  let cursor = 0;
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;
      const { el, order } = queue[index];
      try {
        const resolved = await resolveMediaElement(el);
        if (resolved) media.set(el.id, resolved);
      } catch (err) {
        const name = el.fileName || el.title || 'tanpa nama';
        const detail = err instanceof Error ? err.message : String(err);
        failed.push(`Slide ${order}: ${MEDIA_LABEL[el.kind]} ${name} — ${detail}`);
      }
    }
  });
  await Promise.all(workers);
  return { media, failed };
}

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

function splitLinkUrl(raw: string): { protocol: string; url: string } {
  const url = raw.trim();
  if (url.startsWith('https://')) return { protocol: 'https://', url: url.slice(8) };
  if (url.startsWith('http://')) return { protocol: 'http://', url: url.slice(7) };
  if (url.startsWith('/')) return { protocol: '/', url: url.slice(1) };
  return { protocol: 'other', url };
}

function videoSource(
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tableHtml(el: { rows: number; cols: number }): string {
  const rows = Math.max(1, Math.min(20, Math.round(el.rows)));
  const cols = Math.max(1, Math.min(20, Math.round(el.cols)));
  const body = Array.from({ length: rows }, () => `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`).join('');
  return `<figure class="table"><table class="h5p-table">${body}</table></figure>`;
}

function toAction(
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
  }
  return null;
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
  return { ...base, action: toAction(el, cpMinor, media) };
}

export interface SlideBackgroundRef {
  path: string;
  mime: string;
}

export function toContentJson(
  project: Project,
  cpMinor: number,
  backgrounds?: SlideBackgroundRef[],
  media: Map<string, ResolvedMedia> = new Map(),
): Record<string, unknown> {
  const n = project.slides.length;
  const slides = project.slides.map((s, idx) => ({
    elements: s.elements.map((el) => toCpElement(el, n, cpMinor, media)),
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
  /** Media elemen yang ikut dibundel dan yang gagal diambil dari server. */
  media: { bundled: number; failed: string[] };
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

  // Ambil media elemen (termasuk gambar/audio hasil ekstraksi server) sambil
  // latar slide dirender, supaya preview dengan banyak gambar tidak lambat.
  const mediaPromise = resolveProjectMedia(project);

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
  const { media, failed: mediaFailed } = await mediaPromise;
  files['content/content.json'] = strToU8(JSON.stringify(toContentJson(project, cpMinor, bgRefs, media)));
  for (const asset of media.values()) {
    files[`content/${asset.path}`] = asset.bytes;
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
    media: { bundled: media.size, failed: mediaFailed },
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
    const isRemote = /^(https?:|data:|blob:)/i.test(path) || path.startsWith('//');
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
      position,
      displayAsButton,
      buttonLabel,
      title,
      text,
    };
  }
  const t = createElement('advancedText', slideCount);
  return { ...t, position, displayAsButton, buttonLabel, title, text: '' };
}
