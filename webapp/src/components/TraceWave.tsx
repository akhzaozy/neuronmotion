'use client';
import { useMemo } from 'react';
import { tremorTrace } from '@/data/tremorTrace';

/**
 * Jejak tremor sebagai bentuk dekoratif.
 *
 * Ini bukan komponen data. `TremorPlate` sudah menangani penyajian jejak
 * sebagai bukti, lengkap dengan garis nol dan keterangan asal-usulnya. Yang
 * dilakukan berkas ini hanya meminjam bentuk gelombang yang sama untuk
 * melintas di dasar pita biru dan di dalam kartu penutup, sehingga halaman
 * dibuka dan ditutup oleh bentuk yang sama.
 *
 * Karena perannya dekoratif, ia `aria-hidden` dan tidak pernah membawa angka.
 * Bila datanya kosong, ia tidak merender apa pun dan kedua blok itu tetap utuh
 * tanpa perlu tahu apa-apa.
 *
 * Kurvanya diratakan dengan rerata bergerak. Pada tinggi 120px dan lebar penuh
 * layar, getaran 5 Hz sepanjang sepuluh detik menjadi kabut vertikal alih-alih
 * gelombang; yang dipinjam di sini adalah selubungnya, bukan sinyal mentahnya,
 * dan itu memang yang ingin dilihat mata di lapisan latar.
 */
export default function TraceWave({ className }: { className?: string }) {
  const path = useMemo(() => {
    if (!tremorTrace || tremorTrace.samples.length < 32) return null;

    const { samples } = tremorTrace;
    const W = 1200;
    const H = 120;
    const padY = 8;

    const meanX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
    const dev = samples.map(s => s.x - meanX);

    // Rerata bergerak berjendela 18 sampel.
    //
    // Datanya dicuplik tiap 25 ms, jadi satu siklus tremor 5 Hz memakan sekitar
    // delapan sampel. Jendela lima sampel, yang dicoba lebih dulu, lebih pendek
    // daripada satu siklus dan karena itu meloloskan hampir seluruh getarannya:
    // pada lebar layar penuh hasilnya terbaca sebagai sisir berduri, bukan
    // gelombang. Jendela 18 sampel mencakup lebih dari dua siklus penuh
    // sehingga getaran per siklus saling meniadakan dan yang tersisa adalah
    // selubungnya, dan selubung itulah yang memang ingin dipinjam di lapisan
    // latar.
    const win = 18;
    const smooth = dev.map((_, i) => {
      const from = Math.max(0, i - win);
      const to = Math.min(dev.length, i + win + 1);
      let sum = 0;
      for (let j = from; j < to; j += 1) sum += dev[j];
      return sum / (to - from);
    });

    const peak = Math.max(...smooth.map(Math.abs)) || 1;
    const tSpan = samples[samples.length - 1].t - samples[0].t || 1;
    const t0 = samples[0].t;

    const d = samples
      .map((s, i) => {
        const x = ((s.t - t0) / tSpan) * W;
        const y = H / 2 - (smooth[i] / peak) * (H / 2 - padY);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return { W, H, d };
  }, []);

  if (!path) return null;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${path.W} ${path.H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={path.d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
