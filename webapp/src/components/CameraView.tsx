'use client';
import { RefObject, useEffect, useRef } from 'react';
import { RotateCcw, SwitchCamera } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CameraFault, LiveMetrics, TestType } from '@/hooks/useBiomarkerCapture';
import { TestSpec } from '@/lib/tests';
import styles from './Camera.module.css';

/**
 * Jendela perekaman.
 */
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
  facingMode?: 'user' | 'environment';
  hasMultipleCameras?: boolean;
  onSwitchCamera?: () => void;
  streamAspectRatio?: number | null;
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
  facingMode = 'user',
  hasMultipleCameras = false,
  onSwitchCamera,
  streamAspectRatio,
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

  /* Keadaan sebelum panggung siap.
     Ketiganya dulu berupa return terpisah, dan itulah sumber kemacetannya:
     elemen video baru dipasang pada cabang terakhir, padahal startCamera
     memasang aliran kamera ke videoRef.current segera setelah izin
     diberikan. Ref-nya masih null pada saat dibutuhkan, sehingga izin sudah
     diberikan, lampu kamera menyala, tetapi layar berhenti di ajakan
     mengaktifkan kamera tanpa pesan galat apa pun.

     Sekarang cabangnya hanya menentukan pesan yang tampil. Elemen video dan
     kanvas berada di luar percabangan supaya React tidak pernah
     membongkarnya, sebab elemen yang dibongkar akan kehilangan srcObject
     yang sudah terpasang padanya. */
  const canRetry = fault === 'inUse' || fault === 'modelTimeout' || fault === 'modelFailed';

  let stateBox = null;
  if (fault) {
    stateBox = (
      <div className={styles.stateBox} role="alert">
        <h2 className={styles.stateTitle}>{t(`cam.fault.${fault}.title`)}</h2>
        <p className={styles.stateBody}>{t(`cam.fault.${fault}.body`)}</p>
        {canRetry && (
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            {t('cam.retry')}
          </button>
        )}
      </div>
    );
  } else if (!cameraReady) {
    /* Layar ini menyebut bahwa video tidak pernah diunggah. Itu pembeda utama
       produk ini, dan sebelumnya justru absen persis di titik pengguna
       memutuskan untuk percaya atau tidak. */
    stateBox = (
      <div className={styles.stateBox}>
        <h2 className={styles.stateTitle}>{t('cam.enable')}</h2>
        <p className={styles.stateBody}>{t('cam.enableBody')}</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
          {t('cam.allow')}
        </button>
      </div>
    );
  } else if (!poseReady) {
    stateBox = (
      <div className={styles.stateBox} aria-live="polite">
        <h2 className={styles.stateTitle}>{t('cam.loading')}</h2>
        <p className={styles.stateBody}>{t('cam.loadingBody')}</p>
      </div>
    );
  }

  const ready = stateBox === null;

  return (
    <section className={styles.stage} data-capturing={isCapturing && ready ? '' : undefined}>
      {stateBox}

      <div
        className={`${ready ? styles.frame : styles.offstage} ${facingMode === 'user' ? styles.mirrored : ''}`}
        style={
          streamAspectRatio
            ? ({ '--stream-aspect': `${streamAspectRatio}` } as React.CSSProperties)
            : undefined
        }
        aria-hidden={ready ? undefined : true}
      >
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={t(test.cueKey)}
        />

        {/* Tombol switch kamera depan / belakang (hanya tampil di HP / perangkat multi-kamera) */}
        {ready && !isCapturing && hasMultipleCameras && onSwitchCamera && (
          <button
            type="button"
            className={styles.btnSwitchCamera}
            onClick={onSwitchCamera}
            aria-label={facingMode === 'environment' ? 'Ganti ke Kamera Depan' : 'Ganti ke Kamera Belakang'}
            title={facingMode === 'environment' ? 'Kamera Belakang Aktif (Klik untuk Kamera Depan)' : 'Kamera Depan Aktif (Klik untuk Kamera Belakang)'}
          >
            <RotateCcw size={15} />
            <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
          </button>
        )}

        {/* Peringatan kondisi. Keduanya ditumpuk di satu jalur supaya tidak
            saling menimpa, dan keduanya diumumkan ke pembaca layar. */}
        {ready && (lightingWarning || detectionWarning) && (
          <div className={styles.warnStack} aria-live="polite">
            {lightingWarning && <p className={styles.warn}>{lightingWarning}</p>}
            {detectionWarning && <p className={styles.warn}>{detectionWarning}</p>}
          </div>
        )}

        {/* Pita instruksi. Inilah yang dulu dihapus tepat saat dibutuhkan. */}
        {ready && isCapturing && (
          <div className={styles.cueBand}>
            <p className={styles.cueText}>{t(test.cueKey)}</p>
            <p className={styles.cueCount} aria-live="assertive">
              <span className={styles.cueNum}>{countdown}</span>
              <span className={styles.cueUnit}>{t('scr.secondsLeft')}</span>
            </p>
          </div>
        )}

        {ready && isCapturing && (
          <p className={styles.recFlag}>
            <span className={styles.recDot} aria-hidden="true" />
            {t('scr.recording')}
          </p>
        )}

        {ready && isCapturing && (
          <div className={styles.signalBadge}>
            <span className={styles.signalDot} aria-hidden="true" />
            {test.type === 'rom'
              ? 'Lutut & Sendi Aktif'
              : test.type === 'tremor' || test.type === 'fingerTapping'
                ? 'Landmark Jari Aktif'
                : 'Pelacakan Pose Aktif'}
          </div>
        )}
      </div>

      {/* Bilah metrik mentah. Tersembunyi dari pasien secara bawaan: angka
          tanpa satuan dan tanpa rentang normal, yang berubah merah saat tubuh
          pengguna diukur, hanya menambah kecemasan tanpa memberi informasi. */}
      {ready && showMetrics && (
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

      {ready && isCapturing && (
        <button type="button" className="btn btn--danger btn--lg btn--block" onClick={onStop}>
          {t('scr.stop')}
        </button>
      )}
    </section>
  );
}
