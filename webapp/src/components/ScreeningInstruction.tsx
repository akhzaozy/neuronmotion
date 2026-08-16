'use client';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TestSpec } from '@/lib/tests';
import styles from './ScreeningInstruction.module.css';

/**
 * Lembar instruksi sebelum satu tes direkam.
 *
 * Figur gerakan dipertahankan dan digambar ulang. Ia bukan ikon dekoratif,
 * melainkan instruksi: sebuah gerakan tidak bisa disampaikan lewat kalimat
 * kepada orang yang belum pernah melakukannya, dan figur bergerak menghapus
 * ketergantungan pada bahasa, yang penting untuk pengguna lansia.
 *
 * Hitung mundur bisa dijeda dan diperpanjang. Versi sebelumnya mengunci lima
 * detik tanpa kelonggaran, padahal untuk tes berjalan pengguna harus menekan
 * tombol, meletakkan ponsel, dan mundur dua meter dalam waktu itu, yang tidak
 * mungkin bagi orang dengan langkah tidak stabil. WCAG 2.2.1 juga mensyaratkan
 * batas waktu bisa dimatikan, disesuaikan, atau diperpanjang.
 */

const READY_SECONDS = 5;

/* Figur gerakan. Semuanya garis, satu bobot, tinta dan aksen, tanpa isian
   gradien. Ukuran viewBox seragam supaya proporsinya konsisten antar tes. */

function Figure({ test }: { test: string }) {
  const common = {
    fill: 'none',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (test === 'tremor') {
    return (
      <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
        <g stroke="var(--ink)" {...common}>
          <circle cx="60" cy="26" r="11" />
          <path d="M60 37v34" />
          <path d="M60 71l-11 30M60 71l11 30" />
          <path d="M60 47h-18" />
        </g>
        <g stroke="var(--accent)" {...common} className={styles.tremble}>
          <path d="M42 47h-14" />
          <path d="M28 41v12" />
        </g>
      </svg>
    );
  }

  if (test === 'fingerTapping') {
    return (
      <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
        <g stroke="var(--ink)" {...common}>
          <path d="M38 96V54a8 8 0 0 1 16 0v18" />
          <path d="M54 72V44a8 8 0 0 1 16 0v28" />
        </g>
        <g stroke="var(--accent)" {...common} className={styles.tap}>
          <path d="M70 46l16-12" />
        </g>
      </svg>
    );
  }

  if (test === 'gait') {
    return (
      <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
        <g stroke="var(--ink)" {...common}>
          <circle cx="60" cy="24" r="10" />
          <path d="M60 34v34" />
          <path d="M46 46h28" />
        </g>
        <g stroke="var(--accent)" {...common}>
          <path d="M60 68l-13 32" className={styles.legFront} />
          <path d="M60 68l13 32" className={styles.legBack} />
        </g>
      </svg>
    );
  }

  if (test === 'armSwing') {
    return (
      <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
        <g stroke="var(--ink)" {...common}>
          <circle cx="60" cy="24" r="10" />
          <path d="M60 34v36" />
          <path d="M60 70l-10 30M60 70l10 30" />
        </g>
        <g stroke="var(--accent)" {...common}>
          <path d="M60 44l-18 14" className={styles.armLeft} />
          <path d="M60 44l18 14" className={styles.armRight} />
        </g>
      </svg>
    );
  }

  if (test === 'posture') {
    return (
      <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
        <g stroke="var(--ink)" {...common} className={styles.sway}>
          <circle cx="60" cy="24" r="10" />
          <path d="M60 34v36" />
          <path d="M60 44l-14 20M60 44l14 20" />
          <path d="M60 70l-9 30M60 70l9 30" />
        </g>
        <g stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 4">
          <path d="M32 104h56" />
        </g>
      </svg>
    );
  }

  // rom
  return (
    <svg viewBox="0 0 120 120" className={styles.figure} aria-hidden="true">
      <g stroke="var(--ink)" {...common}>
        <circle cx="42" cy="26" r="10" />
        <path d="M42 36v30" />
        <path d="M42 66h22" />
      </g>
      <g stroke="var(--accent)" {...common}>
        <g className={styles.shin} style={{ transformOrigin: '64px 66px' }}>
          <path d="M64 66v30" />
          <path d="M64 96h14" />
        </g>
      </g>
    </svg>
  );
}

interface Props {
  test: TestSpec;
  onStart: () => void;
  onSkipTest: () => void;
  onCancel: () => void;
}

export default function ScreeningInstruction({ test, onStart, onSkipTest, onCancel }: Props) {
  const { t } = useI18n();
  const [remaining, setRemaining] = useState(READY_SECONDS);
  const [paused, setPaused] = useState(false);

  // onStart datang dari induk sebagai fungsi baru pada setiap render, jadi ia
  // disimpan dalam ref. Menaruhnya di daftar dependensi akan mereset pewaktu
  // setiap kali induk merender ulang, yang merupakan bug laten pada versi
  // sebelumnya.
  const startRef = useRef(onStart);
  startRef.current = onStart;

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      startRef.current();
      return;
    }
    const id = setTimeout(() => setRemaining(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, paused]);

  const fill = (s: string) => s.replace('{d}', String(test.duration));

  return (
    <div className={styles.sheet} role="group" aria-labelledby="instructionTitle">
      <div className={styles.head}>
        <span className={styles.kind}>{t('scr.getReady')}</span>
        <h2 id="instructionTitle" className={styles.title}>
          {t(test.nameKey)}
        </h2>
        <p className={styles.desc}>{t(test.descKey)}</p>
      </div>

      <div className={styles.body}>
        <div className={styles.figureBox}>
          <Figure test={test.type} />
        </div>

        <ol className={styles.steps}>
          {test.stepKeys.map((k, i) => (
            <li key={k} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <span>{fill(t(k))}</span>
            </li>
          ))}
        </ol>
      </div>

      {test.needsDistance && <p className={styles.safety}>{t('test.safety.chair')}</p>}

      <div className={styles.countdown}>
        <p className={styles.countdownValue} aria-live="polite">
          {paused
            ? t('scr.pause')
            : `${remaining} ${t('scr.secondsLeft')}`}
        </p>

        <div className={styles.countdownControls}>
          <button type="button" className="btn" onClick={() => setPaused(p => !p)}>
            {paused ? t('scr.resume') : t('scr.pause')}
          </button>
          <button type="button" className="btn" onClick={() => setRemaining(s => s + 10)}>
            {t('scr.addTime')}
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
          {t('scr.startNow')}
        </button>
        <button type="button" className="btn btn--lg" onClick={onSkipTest}>
          {t('scr.skipTest')}
        </button>
      </div>

      <button type="button" className={styles.cancel} onClick={onCancel}>
        {t('scr.backToTests')}
      </button>
    </div>
  );
}
