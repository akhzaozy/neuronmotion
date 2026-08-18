'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Info, HelpCircle, Activity, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useBiomarkerCapture } from '@/hooks/useBiomarkerCapture';
import { getTest } from '@/lib/tests';
import { useI18n } from '@/lib/i18n';
import CameraView from '@/components/CameraView';
import ScreeningInstruction from '@/components/ScreeningInstruction';
import ProcessButton from '@/components/ProcessButton';
import Logo from '@/components/Logo';
import styles from './demo.module.css';

interface TremorResult {
  dominantFrequencyHz: number;
  amplitudeMillimeter: number;
  category: string;
  interpretation: string;
  score: number;
}

export default function DemoPage() {
  const { t } = useI18n();
  const test = getTest('tremor');

  const {
    videoRef, canvasRef, cameraReady, poseReady,
    activeTest, isCapturing, liveMetrics, countdown, capturedData,
    detectionWarning, lightingWarning, fault,
    facingMode, switchCamera,
    startCamera, startCapture, stopCapture,
  } = useBiomarkerCapture();

  const [showInstruction, setShowInstruction] = useState(false);
  const [result, setResult] = useState<TremorResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const [canExport, setCanExport] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'copied' | 'downloaded'>('idle');

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setCanExport(new URLSearchParams(window.location.search).get('export') === '1'),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const buildTraceJson = () => {
    const raw = (capturedData?.payload as { samples?: Array<{ timestamp: number; x: number; y: number }> })?.samples;
    if (!raw?.length || !result) return null;

    const t0 = raw[0].timestamp;
    const round = (n: number, d: number) => Number(n.toFixed(d));

    return JSON.stringify(
      {
        capturedAt: new Date().toISOString().slice(0, 10),
        durationSec: round((raw[raw.length - 1].timestamp - t0) / 1000, 1),
        dominantFrequencyHz: result.dominantFrequencyHz,
        amplitudeMillimeter: result.amplitudeMillimeter,
        samples: raw.map(s => ({ t: Math.round(s.timestamp - t0), x: round(s.x, 4), y: round(s.y, 4) })),
      },
      null,
      2,
    );
  };

  const exportTrace = async () => {
    const json = buildTraceJson();
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setExportState('copied');
    } catch {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tremorTrace.json';
      a.click();
      URL.revokeObjectURL(url);
      setExportState('downloaded');
    }
  };

  return (
    <div className={styles.page}>
      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <Link href="/" className={styles.homeLink}>
                <Logo size={15} />
              </Link>
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
                  facingMode={facingMode}
                  onSwitchCamera={switchCamera}
                  showMetrics
                  onStart={() => startCamera()}
                  onStop={stopCapture}
                />
              )}

              {cameraReady && poseReady && !isCapturing && !showInstruction && !analyzing && (
                <ProcessButton
                  type="button"
                  size="lg"
                  fullWidth
                  onClick={() => setShowInstruction(true)}
                >
                  {t('scr.beginTest')}
                </ProcessButton>
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <ProcessButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setResult(null);
                    setShowInstruction(false);
                  }}
                >
                  Uji Coba Ulang Tes
                </ProcessButton>
              </div>

              {canExport && (
                <div className={styles.exportRow}>
                  <button type="button" className="btn" onClick={exportTrace}>
                    Salin rekaman (JSON)
                  </button>
                  {exportState !== 'idle' && (
                    <span role="status" className={styles.exportOk}>
                      {exportState === 'copied'
                        ? 'Tersalin. Tempel ke src/data/tremorTrace.ts'
                        : 'Terunduh sebagai tremorTrace.json'}
                    </span>
                  )}
                </div>
              )}

              <p className="note note--lead">{t('res.notDiagnosis')}</p>

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

          {/* ── Panduan Penjelasan Parameter & Warna (Revisi Faiq) ─── */}
          <section className={styles.guideCard} aria-labelledby="param-guide-title">
            <div className={styles.guideHead}>
              <HelpCircle size={20} aria-hidden="true" />
              <h3 id="param-guide-title">Panduan Membaca Angka & Perubahan Warna</h3>
            </div>

            <div className={styles.guideGrid}>
              <div className={styles.guideItem}>
                <span className={styles.guideItemTitle}>Frekuensi Dominan (Hz)</span>
                <p className={styles.guideItemText}>
                  Menunjukkan jumlah getaran per detik. <strong>4-6 Hz</strong> adalah ritme khas tremor istirahat Parkinson. Di luar rentang ini biasanya merupakan variasi alami atau tremor fisiologis normal (&gt;8 Hz).
                </p>
              </div>

              <div className={styles.guideItem}>
                <span className={styles.guideItemTitle}>Amplitudo Simpangan (mm)</span>
                <p className={styles.guideItemText}>
                  Menunjukkan rentang/jarak goyangan tangan dalam milimeter. Nilai <strong>&lt; 1.5 mm</strong> menandakan tangan sangat stabil tanpa pergeseran berlebih.
                </p>
              </div>
            </div>

            <div className={styles.colorLegendSection}>
              <h4 className={styles.colorLegendTitle}>Arti Perubahan Warna Parameter:</h4>
              <div className={styles.colorLegendList}>
                <div className={styles.colorLegendRow}>
                  <span className={`${styles.colorTag} ${styles.tagLow}`}>● Hijau (Risiko Rendah / Skor &lt; 35)</span>
                  <span>Gerak tangan stabil dalam batas normal, tidak ada osilasi ritmis 4-6 Hz yang signifikan.</span>
                </div>
                <div className={styles.colorLegendRow}>
                  <span className={`${styles.colorTag} ${styles.tagMid}`}>● Kuning (Risiko Sedang / Skor 35-64)</span>
                  <span>Terdeteksi sedikit getaran atau variasi ritme yang melebihi ambang batas tenang.</span>
                </div>
                <div className={styles.colorLegendRow}>
                  <span className={`${styles.colorTag} ${styles.tagHigh}`}>● Merah (Risiko Tinggi / Skor ≥ 65)</span>
                  <span>Pola tremor istirahat ritmis 4-6 Hz terdeteksi dengan amplitudo jelas. Disarankan konsultasi medis.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

