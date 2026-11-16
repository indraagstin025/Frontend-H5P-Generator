/**
 * Uji ulang bug #1: export membuang tipe elemen (action: null).
 * Menjalankan toCpElement/toContentJson/toManifest untuk SEMUA ElementKind.
 *
 * Usage: node --experimental-strip-types scripts/export-coverage.mjs
 * (fallback: npx tsx scripts/export-coverage.ts)
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, '..', 'out');

const ALL_KINDS = [
  'advancedText',
  'link',
  'image',
  'shape',
  'video',
  'audio',
  'goToSlide',
  'blanks',
  'singleChoice',
  'multiChoice',
  'trueFalse',
  'dragDrop',
  'summary',
  'dragWords',
  'markWords',
  'dialogCards',
  'continuousText',
  'exportableText',
  'table',
  'interactiveVideo',
  'audioRecorder',
  'multimediaChoice',
];

async function main() {
  const server = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });

  try {
    const model = await server.ssrLoadModule('/src/features/studio/constants/h5pModel.ts');
    const packager = await server.ssrLoadModule('/src/features/exporter/api/h5pPackager.ts');

    const { createProject, createSlide, createElement } = model;
    const { toCpElement, toContentJson, toManifest } = packager;

    const project = createProject('Export Coverage Test', '16:9', null);
    const slide = createSlide(1, 'Semua Tipe', '16:9');
    slide.elements = ALL_KINDS.map((kind) => {
      const el = createElement(kind, 1);
      // isi minimal supaya mapping media tidak kosong total
      if (kind === 'image') {
        el.fileName = 'sample.png';
        el.alt = 'sample';
      }
      if (kind === 'audio') el.fileName = 'sample.mp3';
      if (kind === 'video') {
        el.videoUrl = 'https://example.com/sample.mp4';
        el.fileName = 'sample.mp4';
      }
      if (kind === 'link') el.url = 'https://example.com';
      if (kind === 'interactiveVideo') el.videoUrl = 'https://example.com/iv.mp4';
      return el;
    });
    project.slides = [slide];

    const cpMinor = 24;
    const assets = new Map();
    const perElement = [];
    const libraryCounts = {};
    const nullActions = [];
    const errors = [];

    for (const el of slide.elements) {
      try {
        const cp = toCpElement(el, 1, cpMinor, assets);
        const action = cp.action ?? null;
        const isGoTo = el.kind === 'goToSlide';
        const library = isGoTo
          ? 'goToSlide'
          : action && typeof action.library === 'string'
            ? action.library
            : 'NULL (dibuang)';

        if (!isGoTo && (action == null || typeof action !== 'object')) {
          nullActions.push(el.kind);
        }

        libraryCounts[library] = (libraryCounts[library] ?? 0) + 1;
        perElement.push({
          kind: el.kind,
          library,
          hasAction: action != null,
          hasGoToSlideType: typeof cp.goToSlideType === 'string',
          keys: Object.keys(cp).sort(),
        });
      } catch (err) {
        errors.push({ kind: el.kind, message: String(err?.message ?? err) });
        libraryCounts['ERROR'] = (libraryCounts['ERROR'] ?? 0) + 1;
        perElement.push({ kind: el.kind, library: 'ERROR', error: String(err?.message ?? err) });
      }
    }

    let contentJson;
    let manifest;
    let contentBuildError = null;
    try {
      contentJson = toContentJson(project, cpMinor);
      manifest = toManifest(project, cpMinor);
    } catch (err) {
      contentBuildError = String(err?.message ?? err);
    }

    // scan content.json for action:null
    const contentStr = contentJson ? JSON.stringify(contentJson) : '';
    const actionNullCount = (contentStr.match(/"action":null/g) ?? []).length;

    const exportedKinds = perElement
      .filter((p) => p.library !== 'NULL (dibuang)' && p.library !== 'ERROR')
      .map((p) => p.kind);
    const missingKinds = ALL_KINDS.filter((k) => !exportedKinds.includes(k));

    // parseElement round-trip check (import side) — apakah library dikenali saat re-import
    const parseSupportedMachines = [
      'H5P.AdvancedText',
      'H5P.Image',
      'H5P.Audio',
      'H5P.Video',
      'H5P.MultiChoice',
      'H5P.TrueFalse',
      'H5P.Blanks',
    ];
    const roundTripLost = perElement
      .filter((p) => p.library && p.library !== 'goToSlide' && p.library !== 'ERROR' && p.library !== 'NULL (dibuang)')
      .filter((p) => !parseSupportedMachines.includes(String(p.library).split(' ')[0]))
      .map((p) => ({ kind: p.kind, library: p.library }));

    const report = {
      testedAt: new Date().toISOString(),
      totalKinds: ALL_KINDS.length,
      exportedCount: exportedKinds.length,
      nullActionCount: nullActions.length + actionNullCount,
      nullActions,
      missingKinds,
      errors,
      contentBuildError,
      libraryCounts,
      perElement,
      manifestDeps: manifest?.preloadedDependencies ?? [],
      roundTripImportGaps: roundTripLost,
      verdict:
        nullActions.length === 0 &&
        missingKinds.length === 0 &&
        errors.length === 0 &&
        !contentBuildError &&
        actionNullCount === 0
          ? 'PASS — tidak ada elemen yang dibuang (action:null)'
          : 'FAIL — masih ada elemen hilang / error',
    };

    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'export-coverage.json');
    writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('=== EXPORT COVERAGE RETEST ===');
    console.log(`Total kinds     : ${report.totalKinds}`);
    console.log(`Exported        : ${report.exportedCount}`);
    console.log(`NULL (dibuang)  : ${report.nullActionCount}`);
    console.log(`Errors          : ${errors.length}`);
    console.log('Library counts:');
    for (const [lib, n] of Object.entries(libraryCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      console.log(`  ${lib.padEnd(36)} : ${n}`);
    }
    if (missingKinds.length) console.log('Missing kinds:', missingKinds.join(', '));
    if (nullActions.length) console.log('Null actions :', nullActions.join(', '));
    if (errors.length) console.log('Errors       :', JSON.stringify(errors, null, 2));
    if (roundTripLost.length) {
      console.log(`\n[Catatan terkait] Import parseElement belum mengenali ${roundTripLost.length} library (jatuh ke AdvancedText kosong):`);
      for (const r of roundTripLost) console.log(`  - ${r.kind} → ${r.library}`);
    }
    console.log(`\nVerdict: ${report.verdict}`);
    console.log(`Report : ${outPath} (${Buffer.byteLength(JSON.stringify(report))} bytes raw object)`);
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
