'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api, ModelAccuracy } from '@/lib/api';
import Logo from '@/components/Logo';
import styles from './landing.module.css';

// SVG Icon medis minimalis — bukan AI/tech look
const IconTremor = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L8 15"/>
  </svg>
);
const IconTapping = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconGait = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="2"/><path d="M10.5 8.5 8 19"/><path d="m13.5 8.5 2.5 4-3.5 4 3 4"/><path d="m7.5 12 2-1.5"/>
  </svg>
);
const IconArmSwing = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="12" y1="20" x2="12" y2="24"/>
  </svg>
);
const IconPosture = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/><path d="m17 5-5 5-5-5"/><path d="m17 19-5-5-5 5"/>
  </svg>
);
const IconROM = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
    <circle cx="12" cy="12" r="9"/>
  </svg>
);

const FEATURES = [
  { Icon: IconTremor,   title: 'Deteksi Tremor',    desc: 'Analisis frekuensi dan amplitudo tremor istirahat menggunakan estimasi pose tangan secara real-time.' },
  { Icon: IconTapping,  title: 'Finger Tapping',     desc: 'Ukur kecepatan ketukan dan konsistensi gerak, indikator utama bradikinesia pada evaluasi motorik.' },
  { Icon: IconGait,     title: 'Analisis Gait',      desc: 'Deteksi asimetri langkah dan kadense berjalan dari rekaman kamera tanpa sensor tambahan.' },
  { Icon: IconArmSwing, title: 'Arm Swing',          desc: 'Ukur asimetri ayunan lengan kiri vs kanan, penanda motorik awal yang terukur secara objektif.' },
  { Icon: IconPosture,  title: 'Stabilitas Postur',  desc: 'Hitung sway area dan panjang jalur untuk menilai risiko jatuh dan keseimbangan postural.' },
  { Icon: IconROM,      title: 'Range of Motion',    desc: 'Evaluasi ROM sendi lutut, bahu, dan siku menggunakan estimasi pose tubuh secara non-invasif.' },
];

const IconBrain = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M12 5v13"/>
  </svg>
);
const IconHand = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L8 15"/>
  </svg>
);
const IconBalance = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V2"/><path d="M4 12h16"/><path d="m4 12 4-4"/><path d="m20 12-4 4"/>
  </svg>
);

const CONDITIONS = [
  { label: 'Parkinson',         color: '#ef4444', Icon: IconBrain },
  { label: 'Essential Tremor',  color: '#f59e0b', Icon: IconHand },
  { label: 'Pasca Stroke',      color: '#8b5cf6', Icon: IconBrain },
  { label: 'Ataksia Serebelar', color: '#3b82f6', Icon: IconBalance },
];

const AnimatedBrainGraphic = () => (
  <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }}>
    {/* Brain Outline */}
    <path 
      d="M150 40 C90 40, 50 80, 50 140 C50 180, 70 210, 100 230 C120 245, 130 260, 130 280 L170 280 C170 260, 180 245, 200 230 C230 210, 250 180, 250 140 C250 80, 210 40, 150 40 Z" 
      fill="none" 
      stroke="var(--border)" 
      strokeWidth="3" 
      strokeDasharray="6 6"
    />
    {/* Internal Brain Paths */}
    <path d="M 150 40 L 150 280" stroke="var(--brand-dim)" strokeWidth="4" />
    <path d="M 90 90 Q 150 130 210 90" stroke="var(--brand)" strokeWidth="2" fill="none" className={styles.nervePulse} />
    <path d="M 70 140 Q 150 170 230 140" stroke="var(--brand)" strokeWidth="2" fill="none" className={styles.nervePulse} style={{ animationDelay: '1s' }} />
    <path d="M 90 200 Q 150 190 210 200" stroke="var(--brand)" strokeWidth="2" fill="none" className={styles.nervePulse} style={{ animationDelay: '2s' }} />
    
    {/* Pulses */}
    <circle cx="0" cy="0" r="5" fill="var(--brand)">
      <animateMotion path="M 90 90 Q 150 130 210 90" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="0" cy="0" r="5" fill="var(--brand)">
      <animateMotion path="M 70 140 Q 150 170 230 140" dur="3s" begin="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const AnimatedSpineGraphic = () => (
  <svg viewBox="0 0 200 400" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }}>
    <line x1="100" y1="40" x2="100" y2="360" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
    <line x1="100" y1="40" x2="100" y2="360" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" className={styles.nervePulse} />
    
    {/* Nerve Roots */}
    {[80, 130, 180, 230, 280, 330].map((y, i) => (
      <g key={y}>
        <path d={`M 100 ${y} Q 70 ${y+10} 40 ${y+20}`} stroke="var(--brand-light)" strokeWidth="2" fill="none" />
        <path d={`M 100 ${y} Q 130 ${y+10} 160 ${y+20}`} stroke="var(--brand-light)" strokeWidth="2" fill="none" />
        <circle cx="0" cy="0" r="3" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px var(--brand))' }}>
          <animateMotion path={`M 100 ${y} Q 70 ${y+10} 40 ${y+20}`} dur="2s" begin={`${i*0.3}s`} repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="3" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px var(--brand))' }}>
          <animateMotion path={`M 100 ${y} Q 130 ${y+10} 160 ${y+20}`} dur="2s" begin={`${i*0.3}s`} repeatCount="indefinite" />
        </circle>
      </g>
    ))}
  </svg>
);

const AnimatedNerveGraphic = () => (
  <div style={{ position: 'relative', width: '100%', maxWidth: '460px', display: 'flex', justifyContent: 'center' }}>
    <svg viewBox="0 0 400 250" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }}>
      <defs>
        <linearGradient id="axonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-light)" />
        </linearGradient>
      </defs>
      {/* Dendrites */}
      <path d="M 120 120 Q 80 50 40 40" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 120 120 Q 70 80 30 90" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 120 120 Q 80 180 40 190" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 120 120 Q 70 150 30 140" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      
      {/* Axon Terminals (Next Neuron) */}
      <path d="M 320 120 Q 350 80 380 70" stroke="var(--brand-light)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 320 120 Q 360 120 390 120" stroke="var(--brand-light)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 320 120 Q 350 160 380 170" stroke="var(--brand-light)" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Synapses (Ends) */}
      <circle cx="380" cy="70" r="4.5" fill="var(--brand)" className={styles.nervePulse} />
      <circle cx="390" cy="120" r="4.5" fill="var(--brand)" className={styles.nervePulse} style={{ animationDelay: '0.4s' }} />
      <circle cx="380" cy="170" r="4.5" fill="var(--brand)" className={styles.nervePulse} style={{ animationDelay: '0.8s' }} />

      {/* Soma (Cell Body) */}
      <circle cx="120" cy="120" r="22" fill="var(--brand-dim)" stroke="var(--brand)" strokeWidth="4" />
      <circle cx="120" cy="120" r="7" fill="var(--brand)" />

      {/* Main Axon */}
      <line x1="142" y1="120" x2="320" y2="120" stroke="url(#axonGradient)" strokeWidth="6" strokeLinecap="round" />
      
      {/* Myelin Sheaths (Protective Layer) */}
      <rect x="160" y="113" width="35" height="14" rx="6" fill="var(--border)" stroke="var(--border-light)" strokeWidth="2" />
      <rect x="215" y="113" width="35" height="14" rx="6" fill="var(--border)" stroke="var(--border-light)" strokeWidth="2" />
      <rect x="270" y="113" width="35" height="14" rx="6" fill="var(--border)" stroke="var(--border-light)" strokeWidth="2" />

      {/* Animated Action Potentials (Signals) */}
      <circle cx="0" cy="0" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px var(--brand))' }}>
        <animateMotion path="M 40 40 Q 80 50 120 120 L 320 120 Q 350 80 380 70" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px var(--brand))' }}>
        <animateMotion path="M 40 190 Q 80 180 120 120 L 320 120 Q 350 160 380 170" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px var(--brand))' }}>
        <animateMotion path="M 30 140 Q 70 150 120 120 L 320 120 Q 360 120 390 120" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

const ANIMATIONS = [
  <AnimatedNerveGraphic key="neuron" />,
  <AnimatedBrainGraphic key="brain" />,
  <AnimatedSpineGraphic key="spine" />
];

const ThemeToggleBtn = ({ theme, toggleTheme }: { theme: string, toggleTheme: () => void }) => (
  <button 
    onClick={toggleTheme} 
    title="Toggle Theme"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      position: 'relative',
      width: '56px',
      height: '30px',
      borderRadius: '15px',
      background: theme === 'light' ? '#e2e8f0' : '#1e293b',
      border: '1px solid',
      borderColor: theme === 'light' ? '#cbd5e1' : '#334155',
      cursor: 'pointer',
      padding: '0',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}
  >
    {/* Thumb */}
    <div style={{
      position: 'absolute',
      top: '2px',
      left: theme === 'light' ? '2px' : '28px',
      width: '24px',
      height: '24px',
      background: '#fff',
      borderRadius: '50%',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 2,
    }} />
    
    {/* Sun Icon */}
    <div style={{ position: 'absolute', left: '6px', display: 'flex', zIndex: 1, color: theme === 'light' ? '#f59e0b' : '#64748b', transition: 'color 0.2s' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </div>

    {/* Moon Icon */}
    <div style={{ position: 'absolute', right: '6px', display: 'flex', zIndex: 1, color: theme === 'dark' ? '#60a5fa' : '#94a3b8', transition: 'color 0.2s' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </div>
  </button>
);

export default function LandingPage() {
  const [modelIndex, setModelIndex] = useState(0);
  const [theme, setTheme] = useState('light');
  const [modelInfo, setModelInfo] = useState<ModelAccuracy | null>(null);

  useEffect(() => {
    // Ambil akurasi model SUNGGUHAN (hasil validasi holdout di backend),
    // bukan angka klaim statis — bisa gagal jika backend belum siap.
    api.getModelAccuracy().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  useEffect(() => {
    // Check local storage or system preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const timer = setInterval(() => {
      setModelIndex(prev => (prev + 1) % ANIMATIONS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <Logo size={34} />
          <span className={styles.navName}>NeuronMotion</span>
          <span className="badge badge-brand">Beta</span>
        </div>
        <div className={styles.navLinks}>
          <ThemeToggleBtn theme={theme} toggleTheme={toggleTheme} />
          <Link href="/login" className="btn btn-outline btn-sm">Masuk</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Daftar Gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className="badge badge-brand" style={{ marginBottom: 20 }}>
            Alat Skrining Klinis Berbasis Kamera
          </div>
          <h1 className={styles.heroTitle}>
            Deteksi Dini<br />
            <span className={styles.gradientText}>Gangguan Saraf</span><br />
            Dari Kamera Anda
          </h1>
          <p className={styles.heroDesc}>
            NeuronMotion menganalisis tremor, pola jalan, dan biomarker motorik melalui kamera perangkat Anda,
            membantu deteksi awal Parkinson dan gangguan neurologis lainnya tanpa perangkat tambahan.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Mulai Skrining Gratis
            </Link>
            <Link href="/login" className="btn btn-outline btn-lg">
              Sudah Punya Akun
            </Link>
          </div>
          <div className={styles.heroStats}>
            {[
              [modelInfo ? `${modelInfo.trainSize + modelInfo.testSize}+` : '...', 'Profil Sintetis Referensi'],
              ['6', 'Parameter Biomarker'],
              [modelInfo ? `${modelInfo.accuracy}%` : '...', 'Akurasi Uji Internal'],
              ['Real-time', 'Via Kamera'],
            ].map(([val, label]) => (
              <div key={label} className={styles.statItem}>
                <span className={styles.statVal}>{val}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
            Akurasi dihitung dari validasi holdout 80/20 pada dataset sintetis (bukan uji klinis pada pasien nyata).
          </p>
        </div>
        <div className={styles.heroVisual} style={{ transition: 'opacity 0.5s', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: modelIndex === 0 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none' }}>
            {ANIMATIONS[0]}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: modelIndex === 1 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none' }}>
            {ANIMATIONS[1]}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: modelIndex === 2 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none' }}>
            {ANIMATIONS[2]}
          </div>
          {/* Spacer to keep layout height */}
          <div style={{ visibility: 'hidden' }}>{ANIMATIONS[0]}</div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>6 Biomarker yang Dianalisis</h2>
            <p>Setiap parameter diukur menggunakan estimasi pose dari kamera, tanpa sensor fisik tambahan</p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.container}>
          <div className={styles.conditionBox}>
            <div className={styles.sectionHeader}>
              <h2>Kondisi yang Dapat Dideteksi</h2>
              <p>
                Model klasifikasi dilatih dengan {modelInfo ? `${modelInfo.trainSize}` : '1.600+'} profil pasien sintetis
                (diuji pada {modelInfo ? modelInfo.testSize : 400} profil terpisah) berdasarkan standar klinis MDS-UPDRS
              </p>
            </div>
            <div className={styles.conditionGrid}>
              {CONDITIONS.map(c => (
                <div key={c.label} className={styles.conditionChip} style={{ borderColor: c.color + '44', background: c.color + '15' }}>
                  <div style={{ color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <c.Icon />
                  </div>
                  <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Mulai Skrining Sekarang</h2>
          <p>Gratis, privat, dan tidak memerlukan perangkat tambahan, hanya kamera.</p>
          <Link href="/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--brand)' }}>
            Buat Akun dan Mulai Skrining
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>NeuronMotion adalah alat skrining awal. Bukan pengganti diagnosis tenaga medis.</p>
        <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Referensi: MDS-UPDRS &bull; Shimoyama 1990 &bull; Zijlstra & Hof 2003 &bull; mPower Study
        </p>
      </footer>
    </div>
  );
}
