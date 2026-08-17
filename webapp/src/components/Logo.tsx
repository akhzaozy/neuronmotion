import styles from './Logo.module.css';

/**
 * Tanda identitas visual NeuronMotion.
 * Menampilkan ikon pita gerak neurologis beserta tipografi "NEURON | MOTION".
 */
export default function Logo({
  size = 20,
  showIcon = true,
}: {
  size?: number;
  showIcon?: boolean;
}) {
  const iconHeight = Math.round(size * 1.3);

  return (
    <span
      className={styles.mark}
      style={{ fontSize: `${size}px` }}
      data-no-translate=""
    >
      {showIcon && (
        <span
          className={styles.iconWrap}
          style={{ height: `${iconHeight}px`, width: `${Math.round(iconHeight * 0.72)}px` }}
        >
          <img
            src="/logo.png"
            alt="NeuronMotion"
            className={styles.logoImg}
            width={Math.round(iconHeight * 0.72)}
            height={iconHeight}
          />
        </span>
      )}
      <span className={styles.textWrap}>
        <span className={styles.strong}>NEURON</span>
        <span className={styles.bar} aria-hidden="true" />
        <span className={styles.light}>MOTION</span>
      </span>
    </span>
  );
}
