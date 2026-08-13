import styles from './Logo.module.css';

/**
 * Tanda nama tipografis.
 *
 * Dunia visual ini tidak memakai ikon, jadi tandanya adalah namanya sendiri:
 * "NEURON" berbobot penuh, "MOTION" berbobot ringan, dipisah garis aksen
 * vertikal. Bacaan gandanya disengaja, satu kata yang diam dan satu kata yang
 * bergerak, yang persis pekerjaan produk ini.
 *
 * Prop `size` mengatur ukuran huruf dalam piksel agar pemanggil lama tetap
 * berjalan tanpa perubahan.
 */
export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <span
      className={styles.mark}
      style={{ fontSize: `${size}px` }}
      data-no-translate=""
    >
      <span className={styles.strong}>NEURON</span>
      <span className={styles.bar} aria-hidden="true" />
      <span className={styles.light}>MOTION</span>
    </span>
  );
}
