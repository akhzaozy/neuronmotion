#!/usr/bin/env node
/**
 * Menolak em dash dan en dash di seluruh sumber.
 *
 * Kedua tanda ini jarang diketik orang Indonesia dan menjadi penanda tulisan
 * mesin, sehingga dilarang dipakai di repositori ini. Gunakan koma, titik,
 * tanda titik dua, atau kata "sampai" untuk rentang angka.
 *
 * Dijalankan lewat `npm run lint:dash`, dan otomatis oleh kait pre-commit.
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const FORBIDDEN = [
  { char: '—', name: 'em dash (—)' },
  { char: '–', name: 'en dash (–)' },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.md', '.json', '.html']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.claude']);

/**
 * Berkas data pihak ketiga memuat nama tempat asli yang memang mengandung
 * tanda ini, jadi tidak boleh ikut diubah.
 */
const SKIP_FILES = new Set(['cities.json', 'states.ts', 'translation-cache.json', 'package-lock.json']);

/** Berkas ini sendiri wajib memuat karakter yang dilarang untuk bisa mencarinya. */
const SELF = basename(new URL(import.meta.url).pathname);

function walk(dir, found) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      walk(full, found);
      continue;
    }
    if (!EXTENSIONS.has(extname(entry)) || SKIP_FILES.has(basename(entry))) continue;
    if (basename(entry) === SELF) continue;

    let text;
    try { text = readFileSync(full, 'utf8'); } catch { continue; }

    text.split('\n').forEach((line, i) => {
      for (const { char, name } of FORBIDDEN) {
        if (line.includes(char)) {
          found.push({ file: full, line: i + 1, name, text: line.trim().slice(0, 100) });
        }
      }
    });
  }
}

const found = [];
walk(process.cwd(), found);

if (found.length === 0) {
  console.log('Tidak ada em dash maupun en dash. Bersih.');
  process.exit(0);
}

console.error(`Ditemukan ${found.length} tanda terlarang:\n`);
for (const f of found) {
  console.error(`  ${f.file}:${f.line}  ${f.name}`);
  console.error(`    ${f.text}\n`);
}
console.error('Ganti dengan koma, titik, titik dua, atau kata "sampai" untuk rentang angka.');
process.exit(1);
