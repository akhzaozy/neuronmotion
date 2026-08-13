'use client';
import styles from './Camera.module.css';
import { LiveMetrics, TestType } from '@/hooks/useBiomarkerCapture';
import ScreeningInstruction from './ScreeningInstruction';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraReady: boolean;
  poseReady: boolean;
  isCapturing: boolean;
  activeTest: TestType;
  liveMetrics: LiveMetrics;
  countdown: number;
  error: string | null;
  detectionWarning?: string | null;
  lightingWarning?: string | null;
  onStart: () => void;           // aktifkan kamera
  onStartCapture: () => void;    // mulai rekaman (dipanggil setelah instruksi)
  showInstruction: boolean;      // tampilkan overlay instruksi
  instructionTestType?: TestType;// tipe tes untuk instruksi (bisa ada sebelum activeTest di-set)
  onInstructionDone: () => void; // instruksi selesai → mulai
  onInstructionSkip: () => void; // lewati instruksi
}

// Icon SVG medis, tidak ada nuansa AI
const IconCamera = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconAlert = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const TEST_LABELS: Record<string, string> = {
  tremor:        'Tahan tangan rileks sejajar dada',
  fingerTapping: 'Ketuk ibu jari ke telunjuk berulang kali',
  gait:          'Berjalan lurus mendekati kamera',
  armSwing:      'Berjalan dan biarkan lengan berayun natural',
  posture:       'Berdiri tegak dan diam di depan kamera',
  rom:           'Tekuk dan luruskan lutut secara penuh',
};

export default function CameraView({
  videoRef, canvasRef, cameraReady, poseReady,
  isCapturing, activeTest, liveMetrics, countdown, error, detectionWarning, lightingWarning,
  onStart, onStartCapture, showInstruction, instructionTestType, onInstructionDone, onInstructionSkip,
}: Props) {
  return (
    <div className={styles.wrapper}>
      {/* Video + Canvas overlay */}
      <div className={styles.videoContainer}>
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Not started overlay */}
        {!cameraReady && !error && (
          <div className={styles.overlay}>
            <div className={styles.startBox}>
              <div className={styles.cameraIcon}><IconCamera /></div>
              <h3>Aktifkan Kamera</h3>
              <p>Kamera diperlukan untuk pengukuran biomarker motorik</p>
              <button className="btn btn-primary" onClick={onStart}>
                Izinkan Akses Kamera
              </button>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className={styles.overlay}>
            <div className={styles.errorBox}>
              <div className={styles.cameraIcon} style={{ color: 'var(--red)' }}><IconAlert /></div>
              <h3>Terjadi Masalah</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={onStart}>Coba Lagi</button>
            </div>
          </div>
        )}

        {/* Loading MediaPipe, tampilkan progress & petunjuk */}
        {cameraReady && !poseReady && !error && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <p className={styles.loadingTitle}>Memuat sistem pengukuran...</p>
              <p className={styles.loadingHint}>
                Mengunduh model estimasi pose dari server.<br />
                Proses ini memakan 10 sampai 30 detik tergantung koneksi.
              </p>
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isCapturing && (
          <div className={styles.recBadge}>
            <span className={styles.recDot} />
            REC {countdown}s
          </div>
        )}

        {/* Instruction overlay, blur + animated guide */}
        {showInstruction && instructionTestType && (
          <ScreeningInstruction
            testType={instructionTestType}
            onReady={onInstructionDone}
            onSkip={onInstructionSkip}
          />
        )}

        {/* Test instruction (minimal badge, setelah instruksi) */}
        {activeTest && !isCapturing && poseReady && !showInstruction && (
          <div className={styles.instructionBadge}>
            {TEST_LABELS[activeTest]}
          </div>
        )}

        {/* Peringatan pencahayaan, muncul kapan saja kamera aktif, bukan cuma saat rekam */}
        {cameraReady && poseReady && lightingWarning && (
          <div className={styles.lightingWarning}>
            💡 {lightingWarning}
          </div>
        )}

        {/* Peringatan live: bagian tubuh yang diminta tidak terdeteksi */}
        {isCapturing && detectionWarning && (
          <div className={styles.detectionWarning} style={lightingWarning ? { top: 92 } : undefined}>
            ⚠️ {detectionWarning}
          </div>
        )}

        {/* Scan lines effect when capturing */}
        {isCapturing && <div className={styles.scanline} />}
      </div>

      {/* Live Metrics bar */}
      {cameraReady && (
        <div className={styles.metricsBar}>
          <MetricChip label="Sensor" value={poseReady ? 'Aktif' : 'Loading'} color={poseReady ? 'green' : 'yellow'} dot />
          {liveMetrics.tremorAmp !== undefined && (
            <MetricChip label="Tremor Amp" value={`${liveMetrics.tremorAmp} mm`} color="blue" />
          )}
          {liveMetrics.tapRate !== undefined && (
            <MetricChip label="Tap Rate" value={`${liveMetrics.tapRate} /s`} color="purple" />
          )}
          {liveMetrics.tapCount !== undefined && (
            <MetricChip label="Tap Count" value={String(liveMetrics.tapCount)} color="blue" />
          )}
          {liveMetrics.gaitSteps !== undefined && (
            <MetricChip label="Langkah Terdeteksi" value={String(liveMetrics.gaitSteps)} color="blue" />
          )}
          {liveMetrics.armAsymmetry !== undefined && (
            <MetricChip
              label="Asimetri Lengan"
              value={`${liveMetrics.armAsymmetry}%`}
              color={liveMetrics.armAsymmetry < 15 ? 'green' : liveMetrics.armAsymmetry < 30 ? 'yellow' : 'red'}
            />
          )}
          {liveMetrics.swayArea !== undefined && (
            <MetricChip
              label="Sway Area"
              value={`${liveMetrics.swayArea} cm²`}
              color={liveMetrics.swayArea < 30 ? 'green' : liveMetrics.swayArea < 80 ? 'yellow' : 'red'}
            />
          )}
          {liveMetrics.romKnee !== undefined && (
            <MetricChip label="ROM Lutut" value={`${liveMetrics.romKnee}°`} color="blue" />
          )}
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value, color, dot }: { label: string; value: string; color: string; dot?: boolean }) {
  const colorMap: Record<string, string> = {
    green: 'var(--green)', blue: 'var(--brand-light)',
    yellow: 'var(--yellow)', red: 'var(--red)', purple: 'var(--purple)',
  };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '6px 12px', background: 'var(--chip-bg)',
      border: '1px solid var(--border)', borderRadius: 8, minWidth: 80,
    }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: colorMap[color] || '#fff', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
        {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap[color], display: 'inline-block', flexShrink: 0 }} />}
        {value}
      </span>
    </div>
  );
}
