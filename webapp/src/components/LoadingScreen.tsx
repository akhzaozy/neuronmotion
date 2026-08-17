'use client';
import { Activity } from 'lucide-react';
import styles from './LoadingScreen.module.css';

interface Props {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  title = 'Memuat data...',
  subtitle = 'Sistem sedang menghubungkan dan menyiapkan informasi klinis...',
  fullScreen = false,
}: Props) {
  return (
    <div
      className={fullScreen ? styles.containerFullscreen : styles.containerInline}
      role="status"
      aria-live="polite"
    >
      <div className={styles.loaderCard}>
        <div className={styles.spinnerArea}>
          <div className={styles.outerRing} />
          <div className={styles.innerRing} />
          <Activity size={26} className={styles.centerIcon} aria-hidden="true" />
        </div>

        <div className={styles.textGroup}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressShimmer} />
        </div>
      </div>
    </div>
  );
}
