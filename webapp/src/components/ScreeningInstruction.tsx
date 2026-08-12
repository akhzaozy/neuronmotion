'use client';
import { useEffect, useState } from 'react';
import styles from './ScreeningInstruction.module.css';

interface InstructionConfig {
  badge: string;
  title: string;
  steps: string[];
  figure: React.ReactNode;
}

// ── Animated SVG Figures ─────────────────────────────────────────────────────

const FigureTremor = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    {/* Body */}
    <circle cx="60" cy="24" r="18" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    <line x1="60" y1="42" x2="60" y2="62" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    {/* Shoulder lines */}
    <line x1="60" y1="48" x2="32" y2="64" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
    <line x1="60" y1="48" x2="88" y2="64" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
    {/* Arm */}
    <line x1="60" y1="60" x2="60" y2="98" stroke="#4b91f7" strokeWidth="6" strokeLinecap="round"/>
    {/* Open hand (palm + thumb + 4 evenly-spaced fingers) that trembles as a whole */}
    <g className={styles.figureTremor}>
      <rect x="40" y="96" width="40" height="24" rx="12" fill="#4b91f7" opacity="0.85"/>
      <rect x="25" y="100" width="17" height="10" rx="5" fill="#4b91f7"/>
      <rect x="44" y="78" width="8" height="20" rx="4" fill="#4b91f7"/>
      <rect x="54" y="74" width="8" height="24" rx="4" fill="#4b91f7"/>
      <rect x="66" y="74" width="8" height="24" rx="4" fill="#4b91f7"/>
      <rect x="76" y="78" width="8" height="20" rx="4" fill="#4b91f7"/>
    </g>
    {/* Wavy lines, tremor indicator */}
    <path d="M24 114 Q31 108 38 114 Q45 120 52 114" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="4 2" opacity="0.8"/>
    <path d="M68 114 Q75 108 82 114 Q89 120 96 114" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="4 2" opacity="0.8"/>
  </svg>
);

const FigureTapping = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    {/* Palm */}
    <rect x="40" y="85" width="42" height="28" rx="10" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    {/* Thumb */}
    <rect x="30" y="90" width="14" height="8" rx="4" fill="#4b91f7"/>
    {/* Index finger animated */}
    <g className={styles.figureTapping}>
      <rect x="52" y="58" width="10" height="30" rx="5" fill="#4b91f7"/>
      <circle cx="57" cy="56" r="6" fill="#4b91f7"/>
    </g>
    {/* Other fingers */}
    <rect x="66" y="62" width="9" height="25" rx="4.5" fill="#4b91f7" opacity="0.6"/>
    <rect x="78" y="67" width="9" height="20" rx="4.5" fill="#4b91f7" opacity="0.4"/>
    {/* Target dot */}
    <circle cx="57" cy="98" r="5" fill="#f59e0b" opacity="0.9"/>
    <circle cx="57" cy="98" r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5"/>
    {/* Body */}
    <circle cx="60" cy="22" r="16" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    <line x1="60" y1="38" x2="60" y2="70" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    <line x1="60" y1="48" x2="38" y2="62" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const FigureGait = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    {/* Head */}
    <circle cx="60" cy="20" r="16" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    {/* Body + arms (sedikit ayun mengikuti langkah) */}
    <g className={styles.figureGaitBody}>
      <line x1="60" y1="36" x2="60" y2="82" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
      <line x1="60" y1="46" x2="36" y2="66" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="46" x2="84" y2="60" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
    </g>
    {/* Kaki depan & belakang bergerak berlawanan arah, siklus langkah yang jelas */}
    <g className={styles.figureLegFront} style={{ transformOrigin: '60px 82px' }}>
      <line x1="60" y1="82" x2="42" y2="118" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
      <line x1="42" y1="118" x2="30" y2="122" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
    </g>
    <g className={styles.figureLegBack} style={{ transformOrigin: '60px 82px' }}>
      <line x1="60" y1="82" x2="75" y2="115" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
      <line x1="75" y1="115" x2="88" y2="120" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
    </g>
    {/* Ground */}
    <line x1="10" y1="132" x2="110" y2="132" stroke="#4b91f7" strokeWidth="2" strokeDasharray="6 4" opacity="0.4"/>
    {/* Arrow direction */}
    <path d="M18 126 L30 120 L18 114" stroke="#f59e0b" fill="none" strokeWidth="2" strokeLinecap="round"/>
    <path d="M90 126 L102 120 L90 114" stroke="#f59e0b" fill="none" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FigureArmSwing = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    {/* Head */}
    <circle cx="60" cy="20" r="16" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    {/* Body */}
    <line x1="60" y1="36" x2="60" y2="85" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    {/* Left arm swinging */}
    <g className={styles.figureArm} style={{ transformOrigin: '60px 48px' }}>
      <line x1="60" y1="48" x2="28" y2="78" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="28" cy="78" r="5" fill="#f59e0b"/>
    </g>
    {/* Right arm swinging (counter) */}
    <g style={{ transformOrigin: '60px 48px', animation: 'swing 0.7s ease-in-out infinite alternate-reverse' }}>
      <line x1="60" y1="48" x2="92" y2="78" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="92" cy="78" r="5" fill="#4b91f7"/>
    </g>
    {/* Legs */}
    <line x1="60" y1="85" x2="46" y2="122" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    <line x1="60" y1="85" x2="74" y2="122" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    {/* Ground */}
    <line x1="10" y1="130" x2="110" y2="130" stroke="#4b91f7" strokeWidth="2" strokeDasharray="6 4" opacity="0.3"/>
  </svg>
);

const FigurePosture = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    <g className={styles.figurePosture}>
      {/* Head */}
      <circle cx="60" cy="18" r="16" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
      {/* Body */}
      <line x1="60" y1="34" x2="60" y2="88" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
      {/* Arms straight down */}
      <line x1="60" y1="46" x2="38" y2="74" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="46" x2="82" y2="74" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
      {/* Legs */}
      <line x1="60" y1="88" x2="48" y2="128" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
      <line x1="60" y1="88" x2="72" y2="128" stroke="#4b91f7" strokeWidth="5" strokeLinecap="round"/>
    </g>
    {/* Plumb line */}
    <line x1="60" y1="4" x2="60" y2="136" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
    {/* Balance base */}
    <line x1="30" y1="132" x2="90" y2="132" stroke="#4b91f7" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const FigureROM = () => (
  <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
    {/* Upper leg (fixed) */}
    <line x1="60" y1="20" x2="60" y2="80" stroke="#4b91f7" strokeWidth="7" strokeLinecap="round"/>
    {/* Knee joint */}
    <circle cx="60" cy="80" r="8" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2.5"/>
    {/* Lower leg (bending) */}
    <g className={styles.figureLeg} style={{ transformOrigin: '60px 80px' }}>
      <line x1="60" y1="80" x2="60" y2="130" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="60" cy="132" r="5" fill="#f59e0b"/>
    </g>
    {/* Angle arc */}
    <path d="M60 96 A16 16 0 0 1 74 84" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.7"/>
    {/* Degree label */}
    <text x="78" y="82" fontSize="10" fill="#f59e0b" fontFamily="monospace" opacity="0.8">ROM</text>
    {/* Hip */}
    <circle cx="60" cy="18" r="10" fill="#1e3a5f" stroke="#4b91f7" strokeWidth="2"/>
    <line x1="30" y1="18" x2="90" y2="18" stroke="#4b91f7" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

// ── Instruction Configs ───────────────────────────────────────────────────────

const INSTRUCTIONS: Record<string, InstructionConfig> = {
  tremor: {
    badge: 'Tes Tremor',
    title: 'Tahan Tangan Rileks',
    steps: [
      'Angkat tangan kanan sejajar dada, telapak menghadap bawah',
      'Rilekskan seluruh otot tangan, jangan sengaja menahan',
      'Diam selama 10 detik, tahan posisi ini',
      'Jangan gerakkan tangan secara sengaja',
    ],
    figure: <FigureTremor />,
  },
  fingerTapping: {
    badge: 'Tes Finger Tapping',
    title: 'Ketuk Ibu Jari ke Telunjuk',
    steps: [
      'Angkat tangan ke depan kamera, telapak menghadap kamera',
      'Ketuk ibu jari ke telunjuk se-cepat dan se-keras mungkin',
      'Lakukan berulang tanpa henti selama 10 detik',
      'Usahakan ritme konsisten, jangan melambat di tengah',
    ],
    figure: <FigureTapping />,
  },
  gait: {
    badge: 'Tes Gait',
    title: 'Berjalan di Depan Kamera',
    steps: [
      'Letakkan kamera/HP ±2 meter di depan Anda',
      'Pastikan seluruh tubuh terlihat di kamera saat berdiri',
      'Berjalan maju-mundur secara natural selama 10 detik',
      'Jangan mempercepat atau mengubah gaya jalan',
    ],
    figure: <FigureGait />,
  },
  armSwing: {
    badge: 'Tes Arm Swing',
    title: 'Berjalan dan Biarkan Tangan Berayun',
    steps: [
      'Posisi kamera sama seperti tes gait (±2 meter)',
      'Berjalan dengan kecepatan normal, jangan paksa tangan',
      'Biarkan kedua tangan berayun natural mengikuti langkah',
      'Lakukan selama 10 detik tanpa menahan ayunan',
    ],
    figure: <FigureArmSwing />,
  },
  posture: {
    badge: 'Tes Stabilitas Postur',
    title: 'Berdiri Tegak dan Diam',
    steps: [
      'Berdiri tegak dengan kedua kaki selebar bahu',
      'Pastikan seluruh tubuh terlihat di kamera',
      'Tutup mata (opsional) untuk tes lebih akurat',
      'Diam selama 10 detik, jangan sengaja menahan badan',
    ],
    figure: <FigurePosture />,
  },
  rom: {
    badge: 'Tes Range of Motion',
    title: 'Tekuk dan Luruskan Lutut',
    steps: [
      'Duduk di kursi tanpa sandaran tangan, kamera di samping',
      'Angkat satu kaki dan luruskan sepenuhnya',
      'Kembalikan ke posisi awal (lutut ±90°)',
      'Ulang gerakan secara penuh selama 10 detik',
    ],
    figure: <FigureROM />,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  testType: string;
  onReady: () => void;        // called when countdown reaches 0
  onSkip: () => void;         // called when user skips instruction
}

export default function ScreeningInstruction({ testType, onReady, onSkip }: Props) {
  const [countdown, setCountdown] = useState(5);
  const [started, setStarted] = useState(false);

  const config = INSTRUCTIONS[testType] || INSTRUCTIONS.tremor;
  const pct = ((5 - countdown) / 5) * 100;

  const startCountdown = () => {
    setStarted(true);
  };

  useEffect(() => {
    if (!started) return;
    if (countdown <= 0) { onReady(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown, onReady]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <span className={styles.badge}>{config.badge}</span>
        <p className={styles.title}>{config.title}</p>

        {/* Animated Figure */}
        <div className={styles.figureWrap}>{config.figure}</div>

        {/* Steps */}
        <div className={styles.steps}>
          {config.steps.map((step, i) => (
            <div key={i} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Countdown / Start, "Lewati" hanya muncul setelah countdown berjalan (pola "skip iklan") */}
        {!started ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={startCountdown}>
            Saya Siap, Mulai
          </button>
        ) : (
          <div className={styles.countdownWrap}>
            <div className={styles.countdownBar}>
              <div className={styles.countdownFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.countdownRow}>
              <p className={styles.countdownLabel}>
                {countdown > 0 ? `Memulai dalam ${countdown} detik...` : 'Mulai!'}
              </p>
              <button className={styles.skipLink} onClick={onSkip}>
                Lewati
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
