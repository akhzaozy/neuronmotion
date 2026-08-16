import { Session } from '@/lib/api';

/**
 * Penormal biomarker: satu satuan, satu nama, apa pun bentuk asalnya.
 *
 * Kolom biomarker di basis data diisi oleh dua penulis yang memakai nama
 * berbeda untuk besaran yang sama. Analisator live menulis `symmetryPercent`
 * dan `swayAreaCm2`; data seed menulis `symmetryIndex` dan `swayAreaNorm`.
 * Selama ini setiap halaman membaca kolomnya langsung, jadi halaman yang
 * hanya tahu satu bentuk menampilkan kosong untuk separuh data yang ada,
 * tanpa satu pun galat yang bisa dilihat.
 *
 * Berkas ini menutup kemungkinan itu. Ia satu-satunya tempat yang boleh tahu
 * bahwa ada dua bentuk, dan ia mengembalikan satu bentuk saja ke seluruh
 * antarmuka.
 *
 * Konversi yang dilakukan, dan alasannya:
 *   simetri  index 0..1  ->  persen, dikali 100
 *   sway     norm        ->  cm², dikali 10000, mengikuti rumus yang sama
 *                            persis dengan analyzePosture di server
 *
 * Nilai null berarti tesnya tidak dikerjakan. Ia tidak pernah diganti nol,
 * karena nol adalah hasil pengukuran dan tes yang tidak dijalankan tidak
 * punya hasil.
 */
export interface NormalizedBiomarkers {
  /** Frekuensi tremor dominan, Hz. */
  tremorHz: number | null;
  /** Laju ketukan jari, per detik. */
  tapRate: number | null;
  /** Irama langkah, per menit. */
  cadence: number | null;
  /** Simetri langkah, persen. Makin tinggi makin simetris. */
  symmetryPercent: number | null;
  /** Asimetri ayunan lengan, persen. Makin tinggi makin timpang. */
  armAsymmetryPercent: number | null;
  /** Rentang gerak sendi, derajat. */
  romDeg: number | null;
  /** Luas goyang postur, cm². Makin tinggi makin tidak stabil. */
  swayAreaCm2: number | null;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/** Ambil nilai pertama yang benar-benar angka, dari beberapa kemungkinan. */
const firstNum = (...values: unknown[]): number | null => {
  for (const v of values) {
    const n = num(v);
    if (n !== null) return n;
  }
  return null;
};

/* Bentuk payload ketiga: /api/patients/:id mengurai hasil tes menjadi field
   datar (gaitResult, posturalResult, ...) alih-alih membungkusnya dalam
   rawBiomarkers seperti /api/tests/history. Portal nakes memakai yang ini.
   Ditampung di sini juga, supaya satu penormal melayani ketiga bentuk dan
   tidak ada halaman yang perlu tahu ia sedang membaca bentuk yang mana. */
interface FlatSession {
  tremorResult?: unknown;
  fingerTappingResult?: unknown;
  gaitResult?: unknown;
  armSwingResult?: unknown;
  romResult?: unknown;
  posturalResult?: unknown;
}

type AnySession = (Session | FlatSession) & Record<string, unknown>;

const obj = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined;

export function normalizeBiomarkers(
  session: AnySession | Session | null | undefined,
): NormalizedBiomarkers {
  const s = session as (Record<string, unknown> & { rawBiomarkers?: Record<string, unknown> }) | null | undefined;
  const wrapped = obj(s?.rawBiomarkers);

  /* Bentuk berbungkus didahulukan; kalau tidak ada, dipakai field datar. */
  const raw = {
    tremor: obj(wrapped?.tremor) ?? obj(s?.tremorResult),
    fingerTapping: obj(wrapped?.fingerTapping) ?? obj(s?.fingerTappingResult),
    gait: obj(wrapped?.gait) ?? obj(s?.gaitResult),
    armSwing: obj(wrapped?.armSwing) ?? obj(s?.armSwingResult),
    rom: obj(wrapped?.rom) ?? obj(s?.romResult),
    posturalStability: obj(wrapped?.posturalStability) ?? obj(s?.posturalResult),
  };

  const gait = raw.gait;
  const postural = raw.posturalStability;

  /* Simetri: persen dipakai apa adanya kalau ada. Kalau yang tersedia hanya
     indeks 0..1, ia dikali 100 di sini, sekali, supaya satuan yang tertulis
     di antarmuka benar-benar satuan angkanya. */
  const symmetryIndex = firstNum(gait?.strideSymmetryIndex, gait?.symmetryIndex);
  const symmetryPercent =
    num(gait?.symmetryPercent) ?? (symmetryIndex !== null ? symmetryIndex * 100 : null);

  /* Sway: cm² dipakai apa adanya kalau ada. Faktor 10000 adalah rumus yang
     sama dengan analyzePosture di server, bukan angka yang dikira-kira. */
  const swayNorm = num(postural?.swayAreaNorm);
  const swayAreaCm2 = num(postural?.swayAreaCm2) ?? (swayNorm !== null ? swayNorm * 10000 : null);

  return {
    tremorHz: num(raw.tremor?.dominantFrequencyHz),
    tapRate: num(raw.fingerTapping?.tapRatePerSecond),
    cadence: num(gait?.cadencePerMin),
    symmetryPercent,
    armAsymmetryPercent: num(raw.armSwing?.asymmetryPercent),
    romDeg: num(raw.rom?.romDeg),
    swayAreaCm2,
  };
}
