'use client';
import { RefObject, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { CameraFault, LiveMetrics, TestType } from '@/hooks/useBiomarkerCapture';
import { TestSpec } from '@/lib/tests';
import styles from './Camera.module.css';

/**
 * Jendela perekaman.
 *
 * Aturan utama komponen ini adalah kebalikan dari versi sebelumnya: instruksi
 * TAMPIL selama perekaman, bukan disembunyikan. Pengguna menekan tombol,
 * menjauh dua meter, lalu melakukan gerakan yang tidak bisa ia lihat umpan
 * baliknya. Pada saat itulah satu-satunya kalimat yang penting justru dulu
 * dihapus dari layar.
 *
 * Karena itu semua yang tampil saat merekam diukur untuk jarak dua meter, dan
 * pengaturan waktunya juga diberikan lewat suara, supaya tidak menuntut
 * membaca sama sekali.
 */

/** Nada aba-aba. Dibangkitkan WebAudio, tanpa berkas audio yang harus diunduh. */
function useCues(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const beep = (freq: number, ms: number, gain = 0.09) => {
    if (!enabled) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = ctxRef.current ?? new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume();

      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(amp).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000);
    } catch {
      /* Aba-aba suara adalah tambahan, bukan syarat. */
    }
  };

  return {
    tick: () => beep(660, 120),
    start: () => beep(880, 220),
    end: () => beep(440, 420),
  };
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cameraReady: boolean;
  poseReady: boolean;
  isCapturing: boolean;
  activeTest: TestType;
  test: TestSpec;
  liveMetrics: LiveMetrics;
  countdown: number;
  fault: CameraFault | null;
  detectionWarning: string | null;
  lightingWarning: string | null;
  /** Bilah metrik mentah hanya untuk peragaan, tidak pernah tampil ke pasien. */
  showMetrics?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function CameraView({
  videoRef,
  canvasRef,
  cameraReady,
  poseReady,
  isCapturing,
  test,
  liveMetrics,
  countdown,
  fault,
  detectionWarning,
  lightingWarning,
  showMetrics = false,
  onStart,
  onStop,
}: Props) {
  const { t } = useI18n();
  const cues = useCues(true);
  const lastTickRef = useRef<number | null>(null);

  // Aba-aba suara mengikuti hitung mundur mesin, jadi ia selalu sinkron dengan
  // durasi yang sebenarnya direkam.
  useEffect(() => {
    if (!isCapturing) {
      lastTickRef.current = null;
      return;
    }
    if (lastTickRef.current === countdown) return;
    lastTickRef.current = countdown;
    if (countdown > 0 && countdown <= 3) cues.tick();
    if (countdown === 0) cues.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isCapturing]);

  useEffect(() => {
    if (isCapturing) cues.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturing]);

  /* ── Kegagalan kamera ─────────────────────────────────────────────────────
     Setiap sebab punya layarnya sendiri dengan pemulihan yang benar. Versi
     sebelumnya meringkas semuanya jadi satu kalimat dan menawarkan tombol
     coba lagi yang, setelah blokir permanen, tidak melakukan apa pun. */
  if (fault) {
    const canRetry = fault === 'inUse' || fault === 'modelTimeout' || fault === 'modelFailed';
    return (
      <section className={styles.stateBox} role="alert">
        <h2 className={styles.stateTitle}>{t(`cam.fault.${fault}.title`)}</h2>
        <p className={styles.stateBody}>{t(`cam.fault.${fault}.body`)}</p>
        {canRetry && (
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            {t('cam.retry')}
          </button>
        )}
      </section>
    );
  }

  /* ── Sebelum izin diberikan ───────────────────────────────────────────────
     Layar ini menyebut bahwa video tidak pernah diunggah. Itu pembeda utama
     produk ini, dan sebelumnya justru absen persis di titik pengguna
     memutuskan untuk percaya atau tidak. */
  if (!cameraReady) {
    return (
      <section className={styles.stateBox}>
        <h2 className={styles.stateTitle}>{t('cam.enable')}</h2>
        <p className={styles.stateBody}>{t('cam.enableBody')}</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
          {t('cam.allow')}
        </button>
      </section>
    );
  }

  if (!poseReady) {
    return (
      <section className={styles.stateBox} aria-live="polite">
        <h2 className={styles.stateTitle}>{t('cam.loading')}</h2>
        <p className={styles.stateBody}>{t('cam.loadingBody')}</p>
      </section>
    );
  }

  return (
    <section className={styles.stage} data-capturing={isCapturing ? '' : undefined}>
      <div className={styles.frame}>
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={t(test.cueKey)}
        />

        {/* Peringatan kondisi. Keduanya ditumpuk di satu jalur supaya tidak
            saling menimpa, dan keduanya diumumkan ke pembaca layar. */}
        {(lightingWarning || detectionWarning) && (
          <div className={styles.warnStack} aria-live="polite">
            {lightingWarning && <p className={styles.warn}>{lightingWarning}</p>}
            {detectionWarning && <p className={styles.warn}>{detectionWarning}</p>}
          </div>
        )}

        {/* Pita instruksi. Inilah yang dulu dihapus tepat saat dibutuhkan. */}
        {isCapturing && (
          <div className={styles.cueBand}>
            <p className={styles.cueText}>{t(test.cueKey)}</p>
            <p className={styles.cueCount} aria-live="assertive">
              <span className={styles.cueNum}>{countdown}</span>
              <span className={styles.cueUnit}>{t('scr.secondsLeft')}</span>
            </p>
          </div>
        )}

        {isCapturing && (
          <p className={styles.recFlag}>
            <span className={styles.recDot} aria-hidden="true" />
            {t('scr.recording')}
          </p>
        )}
      </div>

      {/* Bilah metrik mentah. Tersembunyi dari pasien secara bawaan: angka
          tanpa satuan dan tanpa rentang normal, yang berubah merah saat tubuh
          pengguna diukur, hanya menambah kecemasan tanpa memberi informasi. */}
      {showMetrics && (
        <dl className={styles.metrics}>
          {liveMetrics.tremorAmp !== undefined && (
            <div className={styles.metric}>
              <dt>Tremor amp</dt>
              <dd>{liveMetrics.tremorAmp.toFixed(1)} mm</dd>
            </div>
          )}
          {liveMetrics.tapCount !== undefined && (
            <div className={styles.metric}>
              <dt>Tap count</dt>
              <dd>{liveMetrics.tapCount}</dd>
            </div>
          )}
          {liveMetrics.gaitSteps !== undefined && (
            <div className={styles.metric}>
              <dt>Langkah</dt>
              <dd>{liveMetrics.gaitSteps}</dd>
            </div>
          )}
          {liveMetrics.armAsymmetry !== undefined && (
            <div className={styles.metric}>
              <dt>Asimetri lengan</dt>
              <dd>{liveMetrics.armAsymmetry.toFixed(0)} %</dd>
            </div>
          )}
          {liveMetrics.swayArea !== undefined && (
            <div className={styles.metric}>
              <dt>Sway area</dt>
              <dd>{liveMetrics.swayArea.toFixed(1)} cm²</dd>
            </div>
          )}
          {liveMetrics.romKnee !== undefined && (
            <div className={styles.metric}>
              <dt>ROM lutut</dt>
              <dd>{liveMetrics.romKnee.toFixed(0)}°</dd>
            </div>
          )}
        </dl>
      )}

      {isCapturing && (
        <button type="button" className="btn btn--danger btn--lg btn--block" onClick={onStop}>
          {t('scr.stop')}
        </button>
      )}
    </section>
  );
}
