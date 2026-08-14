'use client';
import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { tremorTrace } from '@/data/tremorTrace';
import styles from './TremorPlate.module.css';

/**
 * Panel jejak tremor.
 *
 * Bukan plat berdiri sendiri, melainkan panel bawah dari plat di hero: gambar
 * posisi tangan di atas, jejak yang dihasilkannya di bawah. Keduanya
 * menjelaskan hal yang sama dari dua sisi, jadi memisahkannya menjadi dua
 * gambar bernomor hanya menyuruh pembaca menautkannya sendiri.
 *
 * Jejaknya menggambar dirinya dari kiri ke kanan seperti pena perekam grafik,
 * lalu berhenti sejenak dan mengulang. Ia tidak menggulir, sebab rekaman
 * sungguhan tidak bisa disambung menjadi gelung tanpa jahitan; menggulirnya
 * akan memaksa saya mencerminkan atau memotong sinyal, dan keduanya mengubah
 * data.
 *
 * Komponen ini tidak peduli datanya rekaman atau contoh pola, sebab yang
 * digambar sama saja. Yang membedakan hanya kalimat keterangannya, dan itu
 * dipilih di halaman depan berdasarkan medan `kind` pada datanya, sehingga
 * pola buatan tidak pernah bisa mengaku sebagai pengukuran seseorang.
 *
 * Bila datanya kosong, komponen ini tidak merender apa pun dan platnya tinggal
 * panel gambar saja.
 */
export default function TremorPlate() {
  const { t } = useI18n();

  const geometry = useMemo(() => {
    if (!tremorTrace || tremorTrace.samples.length < 8) return null;

    const { samples } = tremorTrace;
    const W = 1000;
    const H = 150;
    const padY = 12;

    // Sinyal yang digambar adalah simpangan mendatar pergelangan terhadap
    // posisi rata-ratanya. Itulah besaran yang dibaca sebagai getaran; posisi
    // mutlak di dalam bingkai kamera tidak berarti apa-apa.
    const meanX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
    const dev = samples.map(s => s.x - meanX);
    const peak = Math.max(...dev.map(Math.abs)) || 1;

    const tSpan = samples[samples.length - 1].t - samples[0].t || 1;
    const t0 = samples[0].t;

    const path = samples
      .map((s, i) => {
        const x = ((s.t - t0) / tSpan) * W;
        const y = H / 2 - (dev[i] / peak) * (H / 2 - padY);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return { W, H, path, midY: H / 2 };
  }, []);

  if (!geometry) return null;
  const { W, H, path, midY } = geometry;

  return (
    <div className={styles.panel}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t('land.traceAlt')}
      >
        {/* Garis nol, yaitu posisi rata-rata pergelangan selama perekaman. */}
        <line x1="0" x2={W} y1={midY} y2={midY} className={styles.baseline} />
        <path d={path} className={styles.trace} pathLength={1} />
      </svg>
    </div>
  );
}
