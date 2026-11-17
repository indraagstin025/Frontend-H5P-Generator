import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { unzipSync, zipSync, strFromU8 } from 'fflate';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const model = await server.ssrLoadModule('/src/features/studio/constants/h5pModel.ts');
  const pack = await server.ssrLoadModule('/src/features/exporter/api/h5pPackager.ts');
  const validation = await server.ssrLoadModule('/src/features/studio/api/studioChecks.ts');
  const { resizeElement } = await server.ssrLoadModule('/src/features/studio/utils/resizeElement.ts');
  const kinds = ['advancedText', 'link', 'image', 'shape', 'video', 'audio', 'goToSlide', 'trueFalse', 'dragDrop', 'summary', 'dragWords', 'multimediaChoice'];
  const png = await readFile('public/dashboard-logo.png');
  const project = model.createProject('Active element regression', '16:9', null);
  const slide = model.createSlide(1, 'Audit', '16:9');
  slide.backgroundUrl = 'data:image/png;base64,' + png.toString('base64');
  const wav = Buffer.alloc(46);
  wav.write('RIFF'); wav.writeUInt32LE(38, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(2, 40);
  slide.elements = kinds.map(kind => {
    const el = model.createElement(kind, 1);
    el.title = 'Audit ' + kind;
    el.rotation = 30;
    if (kind === 'link') { el.url = 'https://example.com/path?q=1'; el.linkText = 'Test link'; }
    if (kind === 'shape') { el.shapeType = 'circle'; el.color = '#123456'; }
    if (kind === 'image') { el.file = new File([png], 'audit.png', { type: 'image/png' }); el.fileName = 'audit.png'; }
    if (kind === 'audio') { el.file = new File([wav], 'audit.wav', { type: 'audio/wav' }); el.fileName = 'audit.wav'; }
    if (kind === 'video') el.videoUrl = 'https://example.com/test.mp4';
    if (kind === 'dragDrop') {
      el.question = 'Pilih A & B < C';
      el.zones[0].label = 'A & B';
      el.items[0].text = 'A < B & C';
      el.items.push({ id: 'decoy', text: 'Pengecoh', zoneId: '' });
      el.allowMultipleItemsPerZone = true;
    }
    if ('enableRetry' in el) {
      el.enableRetry = false; el.showSolution = false;
      el.feedbackCorrect = 'Benar khusus'; el.feedbackWrong = 'Salah khusus';
    }
    if (kind !== 'goToSlide') el.displayAsButton = true;
    el.position = resizeElement({ x: 20, y: 20, width: 30, height: 25 }, 10, 5, 'se', kind === 'image');
    el.popupButtonOpacity = 45; el.popupButtonAutoHide = kind !== 'goToSlide'; el.popupButtonVisibleSeconds = 2;
    return el;
  });
  project.slides = [slide];
  assert.deepEqual(validation.getProjectIssues(project), [], 'valid project, including No Zone, must export');
  assert.equal(validation.getStudioChecks(project).find(x => x.id === 'ready').ok, true);
  const result = await pack.buildH5p(project, 26, {
    readLibraryFile: async rel => new Uint8Array(await readFile('public/h5p-libraries/' + rel)),
  });
  assert.deepEqual(result.missing, []);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  const entries = unzipSync(bytes);
  const content = JSON.parse(strFromU8(entries['content/content.json']));
  const imported = await pack.parseH5p(new File([bytes], 'audit.h5p'));
  for (const [i, original] of slide.elements.entries()) {
    const restored = imported.slides[0].elements[i];
    assert.equal(restored.kind, original.kind, original.kind + ' identity');
    for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(restored.position[key] - original.position[key]) <= 0.011, original.kind + ' resized ' + key);
    for (const key of ['rotation', 'url', 'linkText', 'shapeType', 'color', 'text', 'question', 'intro', 'videoUrl', 'feedbackCorrect', 'feedbackWrong', 'enableRetry', 'showSolution', 'popupButtonOpacity', 'popupButtonAutoHide', 'popupButtonVisibleSeconds']) {
      if (key in original) assert.deepEqual(restored[key], original[key], original.kind + '.' + key);
    }
    if (original.kind === 'summary') assert.deepEqual(restored.statements.map(({ text, correct }) => ({ text, correct })), original.statements.map(({ text, correct }) => ({ text, correct })));
    if (original.kind === 'image' || original.kind === 'audio') assert.ok(restored.objectUrl);
    if (original.kind === 'dragDrop') {
      assert.equal(restored.items[0].text, original.items[0].text);
      assert.equal(restored.zones[0].label, original.zones[0].label);
      assert.equal(restored.items[2].zoneId, '');
      assert.equal(restored.allowMultipleItemsPerZone, true);
      const params = content.presentation.slides[0].elements[i].action.params;
      assert.equal(params.overallFeedback[1].feedback, original.feedbackCorrect);
      assert.ok(params.question.task.dropZones.every(zone => !zone.single && !zone.correctElements.includes('2')));
    }
  }
  // Standard packages without our optional metadata must also retain known types/settings.
  delete entries['content/studio-metadata.json'];
  const plain = await pack.parseH5p(new File([zipSync(entries)], 'external.h5p'));
  for (const kind of ['link', 'shape', 'summary', 'dragWords', 'trueFalse', 'dragDrop']) {
    const i = kinds.indexOf(kind);
    assert.equal(plain.slides[0].elements[i].kind, kind);
    if (kind === 'trueFalse' || kind === 'dragWords' || kind === 'dragDrop') assert.equal(plain.slides[0].elements[i].enableRetry, false);
  }
  for (const kind of ['video', 'dragDrop', 'summary', 'dragWords', 'multimediaChoice']) {
    const el = model.createElement(kind, 1);
    if (kind === 'dragDrop') { el.items = []; el.zones = []; }
    if (kind === 'summary') el.statements = [];
    if (kind === 'dragWords') el.text = 'No answers';
    if (kind === 'multimediaChoice') el.options = [];
    slide.elements = [el];
    assert.ok(validation.getProjectIssues(project).length > 0, kind + ' incomplete must fail');
    assert.equal(validation.getStudioChecks(project).find(x => x.id === 'ready').ok, false);
  }
  console.log('PASS: 12 active types, full ZIP, media assets, editor settings, native parsers, No Zone and shared validation.');
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    for (const ratio of [false, true]) {
      for (const dx of [-200, -20, 0, 20, 200]) {
        for (const dy of [-200, -20, 0, 20, 200]) {
          const start = { x: 20, y: 25, width: 35, height: 30 };
          const next = resizeElement(start, dx, dy, corner, ratio);
          assert.ok(next.width >= 2 - 1e-9 && next.height >= 2 - 1e-9);
          assert.ok(next.x >= -1e-9 && next.y >= -1e-9);
          assert.ok(next.x + next.width <= 100 + 1e-9 && next.y + next.height <= 100 + 1e-9);
          assert.ok(Math.abs((corner.includes('w') ? next.x + next.width : next.x) - (corner.includes('w') ? start.x + start.width : start.x)) < 1e-9);
          assert.ok(Math.abs((corner.includes('n') ? next.y + next.height : next.y) - (corner.includes('n') ? start.y + start.height : start.y)) < 1e-9);
          if (ratio) assert.ok(Math.abs(next.width / next.height - start.width / start.height) < 1e-9);
        }
      }
    }
  }
  console.log('PASS: resized coordinates survive 12-type round-trip; 200 corner/ratio/bounds cases.');
  for (const angle of [15, 45, 90, 180, 270, 359]) {
    for (const corner of ['nw', 'ne', 'sw', 'se']) {
      const start = { x: 30, y: 30, width: 20, height: 20 };
      const next = resizeElement(start, 4, 3, corner, true, angle, 16 / 9);
      assert.ok(Math.abs(next.width / next.height - 1) < 1e-9);
      assert.ok(next.x >= 0 && next.y >= 0 && next.x + next.width <= 100 && next.y + next.height <= 100);
    }
  }
  assert.ok(strFromU8(entries['H5P.CoursePresentation-1.26/dist/h5p-course-presentation.js']).includes('H5P Generator: element rotation'));
  assert.ok(strFromU8(entries['H5P.CoursePresentation-1.26/semantics.json']).includes('"rotation"'));
  console.log('PASS: rotation saved for 12 types, runtime/semantics bundled, 24 rotated-resize cases.');
} finally {
  await server.close();
}
