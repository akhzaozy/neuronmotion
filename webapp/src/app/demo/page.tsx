'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBiomarkerCapture } from '@/hooks/useBiomarkerCapture';
import { getTest } from '@/lib/tests';
import { useI18n } from '@/lib/i18n';
import CameraView from '@/components/CameraView';
import ScreeningInstruction from '@/components/ScreeningInstruction';
import Logo from '@/components/Logo';
import styles from './demo.module.css';

interface TremorResult {
  dominantFrequencyHz: number;
  amplitudeMillimeter: number;
  category: string;
  interpretation: string;
  score: number;
}

/**
 * Peragaan satu tes tanpa akun.
 *
 * Ini satu-satunya permukaan yang menampilkan angka mentah pengukuran, karena
 * di sinilah angka itu memang jadi isinya: pengunjung datang untuk melihat
 * bahwa alatnya benar-benar mengukur sesuatu. Pada alur skrining pasien,
 * bilah metrik yang sama disembunyikan.
 */
export default function DemoPage() {
  const { t } = useI18n();
  const test = getTest('tremor');

  const {
    videoRef, canvasRef, cameraReady, poseReady,
    activeTest, isCapturing, liveMetrics, countdown, capturedData,
    detectionWarning, lightingWarning, fault,
    startCamera, startCapture, stopCapture,
  } = useBiomarkerCapture();

  const [showInstruction, setShowInstruction] = useState(false);
  const [result, setResult] = useState<TremorResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useEffect(() => {
    if (capturedData?.testType === 'tremor') {
      setAnalyzing(true);
      setAnalyzeError('');
      api.analyzeTremor(capturedData.payload as object)
        .then((res: unknown) => setResult(res as TremorResult))
        .catch((e: Error) => setAnalyzeError(e.message || 'Gagal menganalisis data.'))
        .finally(() => setAnalyzing(false));
    }
  }, [capturedData]);

  const level = result ? (result.score >= 65 ? 'high' : result.score >= 35 ? 'mid' : 'low') : 'low';

  return (
    <div className={styles.page}>
      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <Link href="/" className={styles.homeLink}>
                <Logo size={15} />
              </Link>
              <span>{t('demo.kicker')}</span>
            </div>
            <h1>{t('demo.title')}</h1>
            <p className={styles.lead}>{t('demo.lead')}</p>
          </header>

          {!result && (
            <div className={styles.stack}>
              {showInstruction ? (
                <ScreeningInstruction
                  test={test}
                  onStart={() => {
                    setShowInstruction(false);
                    startCapture('tremor');
                  }}
                  onSkipTest={() => setShowInstruction(false)}
                  onCancel={() => setShowInstruction(false)}
                />
              ) : (
                <CameraView
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  cameraReady={cameraReady}
                  poseReady={poseReady}
                  isCapturing={isCapturing}
                  activeTest={activeTest}
                  test={test}
                  liveMetrics={liveMetrics}
                  countdown={countdown}
                  fault={fault}
                  detectionWarning={detectionWarning}
                  lightingWarning={lightingWarning}
                  showMetrics
                  onStart={startCamera}
                  onStop={stopCapture}
                />
              )}

              {cameraReady && poseReady && !isCapturing && !showInstruction && !analyzing && (
                <button
                  type="button"
                  className="btn btn--primary btn--lg btn--block"
                  onClick={() => setShowInstruction(true)}
                >
                  {t('scr.beginTest')}
                </button>
              )}

              {analyzing && (
                <p className={styles.status} role="status" aria-live="polite">
                  {t('scr.analysing')}
                </p>
              )}

              {analyzeError && (
                <p className={styles.error} role="alert">
                  {analyzeError}
                </p>
              )}
            </div>
          )}

          {result && (
            <article className={styles.stack}>
              <p className={styles.scoreLine}>
                <span className={styles.scoreValue}>{Math.round(result.score)}</span>
                <span className={styles.scoreOf}>{t('res.scoreOf')}</span>
              </p>

              <p className={`level level--${level} ${styles.levelChip}`}>
                {result.category.replace(/_/g, ' ')}
              </p>

              <p>{result.interpretation}</p>

              <table className="dataTable">
                <caption>{t('demo.measured')}</caption>
                <tbody>
                  <tr>
                    <td>{t('demo.frequency')}</td>
                    <td className="num">{result.dominantFrequencyHz} Hz</td>
                  </tr>
                  <tr>
                    <td>{t('demo.amplitude')}</td>
                    <td className="num">{result.amplitudeMillimeter} mm</td>
                  </tr>
                </tbody>
              </table>

              <p className={styles.disclaimer}>{t('res.notDiagnosis')}</p>

              <section className={styles.invite}>
                <h2>{t('demo.oneOfSix')}</h2>
                <p>{t('demo.inviteBody')}</p>
                <Link href="/register" className="btn btn--primary btn--lg">
                  {t('demo.register')}
                </Link>
              </section>

              <p className={styles.footnote}>{t('demo.notStored')}</p>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
