import fs from 'node:fs';

/**
 * Membangkitkan contoh pola tremor istirahat untuk plat di halaman depan.
 * Dijalankan sekali, hasilnya ditulis ke src/data/tremorTrace.ts.
 */

const FS_HZ = 40;          // laju sampel, cukup jauh di atas Nyquist untuk 5 Hz
const DURATION = 10;       // detik
const F0 = 5.2;            // frekuensi dominan, rentang khas tremor istirahat
const A0 = 0.0045;         // amplitudo dasar dalam satuan bingkai ternormalkan

// Acak berbenih supaya berkasnya dapat dibangun ulang persis sama.
let seed = 20260814;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const samples = [];
let phase = 0;

for (let i = 0; i <= DURATION * FS_HZ; i++) {
  const t = i / FS_HZ;

  // Tremor sungguhan menguat dan melemah, tidak berayun rata seperti sinus
  // murni. Selubung lambat inilah yang membuat jejaknya terbaca sebagai
  // rekaman, bukan sebagai fungsi matematika.
  const envelope = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.28 * t + 0.7);

  // Frekuensinya juga tidak terkunci. Fase dibiarkan mengembara pelan.
  phase += 2 * Math.PI * (F0 + 0.08 * Math.sin(2 * Math.PI * 0.17 * t)) / FS_HZ;

  const fundamental = A0 * envelope * Math.sin(phase);
  const harmonic = A0 * envelope * 0.16 * Math.sin(2 * phase + 1.1);
  const drift = 0.0016 * Math.sin(2 * Math.PI * 0.09 * t + 2.1);
  const noise = 0.00035 * gauss();

  samples.push({
    t: Math.round(t * 1000),
    x: Number((0.5 + fundamental + harmonic + drift + noise).toFixed(5)),
    y: Number((0.5 + 0.35 * (fundamental + drift) + 0.0002 * gauss()).toFixed(5)),
  });
}

const xs = samples.map(s => s.x);
const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
const dev = xs.map(v => v - mean);
const rms = Math.sqrt(dev.reduce((a, b) => a + b * b, 0) / dev.length);
const peak = Math.max(...dev.map(Math.abs));
let cross = 0;
for (let i = 1; i < dev.length; i++) if ((dev[i - 1] < 0) !== (dev[i] < 0)) cross++;

console.log('sampel        :', samples.length, `(${FS_HZ} Hz, ${DURATION} s)`);
console.log('simpangan rms :', rms.toFixed(5));
console.log('simpangan puncak:', peak.toFixed(5), '| ambang normal 0.005, patologis 0.015');
console.log('lintas nol    :', cross, '=> sekitar', (cross / 2 / DURATION).toFixed(1), 'Hz');

const lines = samples.map(s => `  { t: ${s.t}, x: ${s.x}, y: ${s.y} },`).join('\n');
const block = `export const tremorTrace: TremorTrace | null = {
  kind: 'illustration',
  durationSec: ${DURATION},
  dominantFrequencyHz: ${F0},
  amplitudeMillimeter: 2.4,
  samples: [
${lines}
  ],
};`;

const p = 'src/data/tremorTrace.ts';
let f = fs.readFileSync(p, 'utf8');
f = f.replace(/export const tremorTrace: TremorTrace \| null = [\s\S]*$/, block + '\n');
fs.writeFileSync(p, f);
console.log('ditulis ke', p);
