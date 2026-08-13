'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBiomarkerCapture } from '@/hooks/useBiomarkerCapture';
import CameraView from '@/components/CameraView';
import Logo from '@/components/Logo';
import styles from '../screening/screening.module.css';

interface TremorResult {
  dominantFrequencyHz: number;
  amplitudeMillimeter: number;
  category: string;
  interpretation: string;
  score: number;
}

export default function DemoPage() {
  const {
    videoRef, canvasRef, cameraReady, poseReady, error,
    activeTest, isCapturing, liveMetrics, countdown, capturedData, detectionWarning, lightingWarning,
    startCamera, startCapture, stopCapture,
  } = useBiomarkerCapture();

  const [showInstruction, setShowInstruction] = useState(false);
  const [result, setResult] = useState<TremorResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useEffect(() => {
    if (capturedData && capturedData.testType === 'tremor') {
      setAnalyzing(true);
      setAnalyzeError('');
      api.analyzeTremor(capturedData.payload as object)
        .then((res: any) => setResult(res))
        .catch((e: any) => setAnalyzeError(e.message || 'Gagal menganalisis data.'))
        .finally(() => setAnalyzing(false));
    }
  }, [capturedData]);

  const handleInstructionDone = () => {
    setShowInstruction(false);
    startCapture('tremor');
  };

  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ gridTemplateColumns: '1fr', maxWidth: 640, margin: '0 auto' }}>
        <div className={styles.header}>
          <Link href="/" style={{ display: 'inline-flex', marginBottom: 16 }} aria-label="Kembali ke beranda">
            <Logo size={40} />
          </Link>
          <h1>Coba Deteksi Tremor, Gratis</h1>
          <p>Tanpa perlu bikin akun dulu, coba 1 dari 6 tes biomarker NeuronMotion di sini.</p>
        </div>

        <div className={styles.mainColumn}>
          {!result && !analyzing && (
            <div className={styles.instructions}>
              <h4>🤚 Instruksi Tremor</h4>
              <p>Angkat tangan kanan Anda sejajar dada dan tahan dalam keadaan rileks selama 10 detik. Kamera akan mengukur frekuensi dan amplitudo getaran.</p>
            </div>
          )}

          {!result && (
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraReady={cameraReady}
              poseReady={poseReady}
              isCapturing={isCapturing}
              activeTest={activeTest}
              liveMetrics={liveMetrics}
              countdown={countdown}
              error={error}
              detectionWarning={detectionWarning}
              lightingWarning={lightingWarning}
              onStart={startCamera}
              onStartCapture={handleInstructionDone}
              showInstruction={showInstruction}
              instructionTestType="tremor"
              onInstructionDone={handleInstructionDone}
              onInstructionSkip={handleInstructionDone}
            />
          )}

          {!result && cameraReady && poseReady && !isCapturing && !analyzing && (
            <div className={styles.controls}>
              <button className="btn btn-primary btn-lg" onClick={() => setShowInstruction(true)} disabled={showInstruction}>
                Mulai Rekam &bull; Tremor
              </button>
            </div>
          )}

          {!result && isCapturing && (
            <div className={styles.controls}>
              <button className="btn btn-danger btn-lg" onClick={stopCapture}>Hentikan Rekaman</button>
            </div>
          )}

          {analyzing && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>Menganalisis data getaran...</div>
          )}

          {analyzeError && (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--red-text)' }}>{analyzeError}</div>
          )}

          {result && (
            <div className={styles.stepCard} style={{ textAlign: 'center' }}>
              <div
                className={styles.scoreCircle}
                style={{
                  borderColor: result.score >= 65 ? 'var(--red)' : result.score >= 35 ? 'var(--yellow)' : 'var(--green)',
                  color: result.score >= 65 ? 'var(--red-text)' : result.score >= 35 ? 'var(--yellow-text)' : 'var(--green-text)',
                }}
              >
                {Math.round(result.score)}
              </div>
              <h3 style={{ margin: '8px 0' }}>{result.category.replace(/_/g, ' ')}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{result.interpretation}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                Frekuensi dominan: {result.dominantFrequencyHz} Hz &bull; Amplitudo: {result.amplitudeMillimeter} mm
              </p>
              <div style={{ background: 'var(--brand-dim)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <p style={{ marginBottom: 12, fontWeight: 600 }}>Ini baru 1 dari 6 parameter biomarker.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Daftar akun gratis untuk skrining lengkap (tremor, finger tapping, gait, arm swing, postur, ROM) dan simpan riwayat pemeriksaan Anda.
                </p>
                <Link href="/register" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Daftar &amp; Mulai Skrining Lengkap
                </Link>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Hasil demo ini tidak disimpan. Ini bukan diagnosis medis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
