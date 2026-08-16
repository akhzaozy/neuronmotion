import { TEST_DURATION, TestType } from '@/hooks/useBiomarkerCapture';

/**
 * Sumber kebenaran tunggal untuk keenam tes gerakan.
 *
 * Sebelumnya deskripsi tes hidup di tiga tempat sekaligus, yaitu halaman
 * skrining, komponen kamera, dan kamus i18n, dan ketiganya saling bertentangan:
 * satu menyuruh berdiri sementara yang lain menyuruh duduk, satu menyuruh kaki
 * rapat sementara yang lain menyuruh selebar bahu. Pengguna mengikuti satu teks
 * dan mesin mengukur dengan protokol yang lain.
 *
 * Berkas ini menghapus kemungkinan itu. Durasi diambil dari TEST_DURATION di
 * hook perekaman, bukan ditulis ulang, sehingga teks dan mesin tidak akan
 * pernah menyebut angka yang berbeda.
 */

export type ScreeningTest = Exclude<TestType, null>;

export interface TestSpec {
  type: ScreeningTest;
  /** Kunci i18n untuk nama tes. */
  nameKey: string;
  /** Kunci i18n untuk ringkasan satu kalimat. */
  descKey: string;
  /** Kunci i18n untuk satu baris instruksi yang tampil selama perekaman. */
  cueKey: string;
  /** Kunci i18n tiap langkah persiapan, maksimal empat. */
  stepKeys: string[];
  /** Detik perekaman, diambil dari mesin, bukan ditulis ulang. */
  duration: number;
  /** Tes ini butuh seluruh tubuh berdiri masuk frame. */
  wholeBody: boolean;
  /** Pengguna harus menjauh dari perangkat sebelum tes dimulai. */
  needsDistance: boolean;
}

const spec = (
  type: ScreeningTest,
  opts: { wholeBody?: boolean; needsDistance?: boolean; steps: number },
): TestSpec => ({
  type,
  nameKey: `test.${type}.name`,
  descKey: `test.${type}.desc`,
  cueKey: `test.${type}.cue`,
  stepKeys: Array.from({ length: opts.steps }, (_, i) => `test.${type}.step${i + 1}`),
  duration: TEST_DURATION[type] ?? 10,
  wholeBody: opts.wholeBody ?? false,
  needsDistance: opts.needsDistance ?? false,
});

export const TEST_SEQUENCE: TestSpec[] = [
  spec('tremor', { steps: 4 }),
  spec('fingerTapping', { steps: 4 }),
  spec('gait', { steps: 4, wholeBody: true, needsDistance: true }),
  spec('armSwing', { steps: 3, wholeBody: true, needsDistance: true }),
  spec('posture', { steps: 3, wholeBody: true, needsDistance: true }),
  spec('rom', { steps: 4, wholeBody: true, needsDistance: true }),
];

export const getTest = (type: ScreeningTest): TestSpec =>
  TEST_SEQUENCE.find(t => t.type === type) ?? TEST_SEQUENCE[0];

/**
 * Total detik perekaman murni. Dipakai untuk menyatakan biaya waktu dengan
 * jujur: layar pembuka sebelumnya menjanjikan lima sampai tujuh menit padahal
 * perekamannya hanya 75 detik, dan selisihnya adalah persiapan dan
 * perpindahan posisi yang tidak pernah dipandu.
 */
export const TOTAL_CAPTURE_SECONDS = TEST_SEQUENCE.reduce((sum, t) => sum + t.duration, 0);
