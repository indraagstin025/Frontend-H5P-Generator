/**
 * Daftarkan semua berkas di public/h5p-libraries ke index.json
 * (dipakai packager untuk membundel library ke dalam .h5p).
 * Jalankan ulang tiap kali isi folder library berubah:
 *   npm run sync:h5p-index
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'public', 'h5p-libraries');

function walk(dir, base) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === 'index.json') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, base ?? out);
    else (base ?? out).push(relative(root, full).split(sep).join('/'));
  }
  return base ?? out;
}

const index = {};
for (const name of readdirSync(root).sort()) {
  const full = join(root, name);
  if (!statSync(full).isDirectory()) continue;
  if (name === 'index.json') continue;
  const files = [];
  walk(full, files);
  index[name] = files.sort();
}

writeFileSync(join(root, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
const nLib = Object.keys(index).length;
const nFile = Object.values(index).reduce((a, f) => a + f.length, 0);
console.log(`index.json: ${nLib} library, ${nFile} berkas.`);
