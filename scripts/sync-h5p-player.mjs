/** Salin aset h5p-standalone (frame + css + font + gambar) ke public/. */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'h5p-standalone', 'dist');
const dest = join(root, 'public', 'h5p-player');

if (!existsSync(src)) {
  console.error('h5p-standalone belum terinstal. Jalankan npm install dulu.');
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
for (const name of ['frame.bundle.js', 'styles', 'fonts', 'images']) {
  const from = join(src, name);
  if (existsSync(from)) cpSync(from, join(dest, name), { recursive: true });
}
console.log('Aset H5P player tersalin ke public/h5p-player/');
