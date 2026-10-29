/**
 * Packager .h5p Client-Side Facade (§5, FR-11/FR-12)
 *
 * Berkas ini bertindak sebagai fasad terpadu (clean re-export facade)
 * untuk seluruh sub-modul packager modular yang berada di subfolder ./packager:
 *
 * 1. packager/mediaResolver.ts: Sniffing magic bytes biner, pemetaan MIME, dan fetch media.
 * 2. packager/elementMapper.ts: Serialisasi elemen, pembuatan manifest dan content.json.
 * 3. packager/h5pParser.ts: Parsing & ekstraksi arsip .h5p lama ke model studio.
 * 4. packager/zipBundler.ts: Bundling dependensi library transitif, canvas render latar, dan build arsip .h5p.
 */

// 1. Ekspor modul resolusi & penanganan media
export {
  IMAGE_MIME,
  AUDIO_MIME,
  VIDEO_MIME,
  MEDIA_DIR,
  MEDIA_MIME,
  MEDIA_FALLBACK_EXT,
  MEDIA_LABEL,
  MEDIA_MAX_BYTES,
  ASSET_FETCH_TIMEOUT_MS,
  MIME_EXT,
  type MediaKind,
  type MediaElement,
  type ResolvedMedia,
  isMediaElement,
  mediaContentPath,
  extFromName,
  allowedExt,
  asciiAt,
  sniffImageKind,
  sniffMediaKind,
  chooseMediaExt,
  fetchMediaBytes,
  fileToBytes,
  resolveMediaElement,
  resolveProjectMedia,
  sanitizeExt,
  fileRef,
  clampPct,
} from './packager/mediaResolver';

// 2. Ekspor modul pemetaan semantik & serializer elemen
export {
  type SlideBackgroundRef,
  behaviourOf,
  mcAnswerText,
  splitLinkUrl,
  videoSource,
  escapeHtml,
  tableHtml,
  toAction,
  toCpElement,
  toContentJson,
  toManifest,
} from './packager/elementMapper';

// 3. Ekspor modul ekstraksi & import arsip H5P
export {
  bytesToUrl,
  mimeForPath,
  resolveContentEntry,
  num,
  str,
  bool,
  parseElement,
  parseH5p,
} from './packager/h5pParser';

// 4. Ekspor modul bundling pustaka & generator arsip ZIP .h5p
export {
  TONE_GRADIENTS,
  renderBackground,
  BG_FETCH_TIMEOUT_MS,
  BG_MAX_BYTES,
  type ResolvedBackground,
  resolveSlideBackground,
  type H5pBuildResult,
  type H5pBuildOptions,
  fetchLibraryFile,
  decodeJson,
  type LibDep,
  type LibraryFileReader,
  type LibraryBundle,
  bundleLibraryFiles,
  resolveLibraryClosure,
  buildH5p,
  downloadBlob,
  safeFileName,
} from './packager/zipBundler';
