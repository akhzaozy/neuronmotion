'use client';
import { useEffect, useState } from 'react';

/**
 * Gerak halus untuk halaman publik.
 *
 * Dua hal saja: menandai kapan sebuah blok masuk layar, dan menaikkan angka
 * ke nilai akhirnya. Keduanya diam total bila pengguna meminta gerak
 * dikurangi. Untuk produk yang penggunanya bisa punya gangguan vestibular
 * atau Parkinson, itu bukan kesantunan, itu syarat.
 *
 * Animasi CSS sudah diredam oleh blok prefers-reduced-motion global di
 * globals.css, tetapi hitungan angka berjalan di JavaScript dan tidak
 * tersentuh blok itu, jadi ia harus memeriksa sendiri.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Menandai elemen begitu ia masuk layar, lalu berhenti mengamati. Sekali
 * tampil tetap tampil, karena blok yang berkedip saat digulir naik turun
 * lebih mengganggu daripada membantu.
 */
export function useReveal<T extends HTMLElement>() {
  // Simpul disimpan lewat ref panggil-balik, bukan objek ref. Membaca
  // .current saat render melanggar aturan React, dan versi sebelumnya
  // membuat pemeriksa menandainya di setiap tempat pemakaian. Ref
  // panggil-balik memberi tahu React kapan simpulnya terpasang, jadi efek di
  // bawah berjalan tepat setelah elemennya ada tanpa perlu membacanya saat
  // render.
  //
  // Kembaliannya tuple, bukan objek. Ketika keduanya dibungkus objek,
  // pemeriksa memperlakukan seluruh objek itu sebagai wadah ref, sehingga
  // membaca `shown` pun ikut ditandai meski ia hanya sebuah boolean.
  const [el, attach] = useState<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!el) return;

    // Tanpa IntersectionObserver, isi langsung ditampilkan. Konten tidak
    // pernah boleh bergantung pada gerak untuk bisa dibaca. Penetapannya
    // ditunda satu bingkai agar tidak terjadi render berantai di dalam efek.
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return [attach, shown] as const;
}

/**
 * Menaikkan angka dari nol ke nilai tujuan setelah blok tampil. Memakai
 * pelonggaran yang sama dengan riseIn agar terasa satu keluarga, dan
 * requestAnimationFrame agar berhenti sendiri saat tab tidak aktif.
 *
 * Mengembalikan null selama nilai tujuan belum ada, supaya pemanggil tetap
 * bisa menampilkan tanda pisah alih-alih angka nol yang keliru dibaca
 * sebagai hasil pengukuran.
 */
export function useCountUp(target: number | null, start: boolean, duration = 900) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    // Setiap penetapan nilai ditunda satu bingkai. Selain menghindari render
    // berantai di dalam efek, ini memberi peramban kesempatan melukis keadaan
    // awal lebih dulu, sehingga hitungannya benar-benar terlihat bergerak
    // alih-alih melompat ke nilai akhir.
    let frame = requestAnimationFrame(function begin(t0: number) {
      if (target === null) {
        setValue(null);
        return;
      }
      if (!start || prefersReducedMotion()) {
        setValue(target);
        return;
      }

      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(target * eased);
        if (p < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [target, start, duration]);

  return value;
}
