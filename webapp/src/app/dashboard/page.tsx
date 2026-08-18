'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Activity, Footprints, Hand, MoveHorizontal, PersonStanding, RotateCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import { normalizeBiomarkers } from '@/lib/biomarkers';
import AppNav from '@/components/AppNav';
import LiveChat from '@/components/LiveChat';
import LoadFailure from '@/components/LoadFailure';
import LoadingScreen from '@/components/LoadingScreen';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import styles from './dashboard.module.css';

interface TimelinePoint {
  score: number;
  risk?: string;
  date?: string;
}

interface Summary {
  latestScore?: number;
  averageScore?: number;
  totalSessions?: number;
  trendDirection?: 'IMPROVING' | 'WORSENING' | 'STABLE';
  trendDelta?: number;
  timeline?: TimelinePoint[];
}

function levelOf(score: number): 'low' | 'mid' | 'high' {
  if (score >= 65) return 'high';
  if (score >= 35) return 'mid';
  return 'low';
}

function greeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === 'en') {
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/* ═══════════════════════════════════════════════════════════════════════════
   CINCIN SKOR

   Menempati posisi yang pada rujukan diisi gambar jantung tiga dimensi. Yang
   ditaruh di sini bukan gambar organ, melainkan angkanya sendiri: gambar
   jantung adalah hiasan yang tidak menyampaikan apa pun tentang pasien yang
   sedang melihatnya, sedangkan cincin ini panjang busurnya adalah skornya.

   Tiga penanda dibawa sekaligus, sesuai aturan produk ini: panjang busur,
   warna tingkat, dan label teks penuh di bawahnya. Pengguna yang tidak
   membedakan warna tetap membaca tingkatnya dari busur dan dari labelnya.
   ══════════════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 1000, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const startVal = prevValue.current;
    const endVal = value;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      if (spanRef.current) {
        spanRef.current.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        prevValue.current = endVal;
      }
    };

    requestAnimationFrame(frame);
  }, [value, duration, decimals]);

  return <span ref={spanRef}>{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CINCIN SKOR (MOTION RADIX PROGRESS DONUT GAUGE) - 100% GPU ACCELERATED
   Inspirasi: https://motion.dev/examples/react-radix-progress
   ══════════════════════════════════════════════════════════════════════════ */
function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 76;
  const circumference = 2 * Math.PI * r; // ~477.52
  const clamped = Math.max(0, Math.min(100, score));
  const targetOffset = circumference * (1 - clamped / 100);
  const level = levelOf(score);

  return (
    <motion.div
      className={styles.ringWrap}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg viewBox="0 0 200 200" className={styles.ring} role="img" aria-label={`${Math.round(score)} / 100. ${label}`}>
        <defs>
          <linearGradient id="scoreRingGradLow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="scoreRingGradMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="scoreRingGradHigh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Track */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--inset, rgba(0, 0, 0, 0.06))"
          strokeWidth="15"
        />

        {/* Animated Motion Radix Progress Arc */}
        <motion.circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={
            level === 'high'
              ? 'url(#scoreRingGradHigh)'
              : level === 'mid'
                ? 'url(#scoreRingGradMid)'
                : 'url(#scoreRingGradLow)'
          }
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          transform="rotate(-90 100 100)"
          className={styles.ringArc}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringValue}>
          <AnimatedNumber value={score} duration={1300} />
        </span>
        <span className={styles.ringUnit}>{label}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BATANG ANTAR SESI

   Menggantikan grafik detak jantung real-time pada rujukan. Perbedaannya
   menentukan: grafik di sana menggambar aliran yang terus berjalan, sedangkan
   di sini setiap batang adalah satu sesi pemeriksaan yang benar-benar
   dikerjakan seseorang. Jumlah batangnya karena itu tidak pernah dikarang
   untuk memenuhi lebar panel.
   ══════════════════════════════════════════════════════════════════════════ */
function RiskColorLegend() {
  const { t } = useI18n();

  const categories = [
    {
      level: 'low' as const,
      badgeKey: 'dash.legendLowTitle',
      descKey: 'dash.legendLowDesc',
      range: '< 35',
    },
    {
      level: 'mid' as const,
      badgeKey: 'dash.legendMidTitle',
      descKey: 'dash.legendMidDesc',
      range: '35 - 64',
    },
    {
      level: 'high' as const,
      badgeKey: 'dash.legendHighTitle',
      descKey: 'dash.legendHighDesc',
      range: '≥ 65',
    },
  ];

  return (
    <div className={styles.legendWrap} aria-label={t('dash.legendTitle')}>
      <div className={styles.legendHead}>{t('dash.legendTitle')}</div>
      <ul className={styles.legendList}>
        {categories.map(c => (
          <li key={c.level} className={styles.legendItem}>
            <div className={`${styles.legendBadge} ${styles[`legendBadge_${c.level}`]}`}>
              <span className={styles.legendBadgeDot} />
              <span>{c.range}</span>
            </div>
            <div className={styles.legendBody}>
              <strong className={styles.legendLabel}>{t(c.badgeKey)}</strong>
              <span className={styles.legendDesc}>{t(c.descKey)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionBars({ points, label }: { points: TimelinePoint[]; label: string }) {
  const { lang } = useI18n();
  if (points.length < 2) return null;
  const shown = points.slice(-14);

  return (
    <div className={styles.bars}>
      <div className={styles.barsHead}>
        <span className={styles.barsTitle}>{label}</span>
        <span className={styles.miniLabel}>{shown.length} sesi</span>
      </div>
      <div
        className={styles.barsRow}
        role="img"
        aria-label={`${label}: ${shown.map(p => Math.round(p.score)).join(', ')}`}
      >
        {shown.map((p, i) => {
          const roundedScore = Math.round(p.score);
          const dateStr = p.date
            ? new Date(p.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
                day: 'numeric',
                month: 'short',
              })
            : `#${i + 1}`;
          return (
            <div key={i} className={styles.barSlot} title={`${dateStr}: ${roundedScore}`}>
              <div className={styles.barTooltip}>
                {dateStr}: {roundedScore}
              </div>
              <div
                className={`${styles.bar} ${styles[`bar_${levelOf(p.score)}`]}`}
                /* Lantai 8% supaya sesi berskor sangat rendah tetap punya
                   batang yang terlihat, bukan garis yang hilang sama sekali. */
                style={{ height: `${Math.max(8, p.score)}%` }}
              />
            </div>
          );
        })}
      </div>

      <RiskColorLegend />
    </div>
  );
}

/* Biomarker yang ditampilkan sebagai kartu pengukuran.
   ─────────────────────────────────────────────────────────────────────────────
   Daftar ini menempati posisi "Muscle Recovery / Steps / Calories" pada
   rujukan. Bedanya, ketiga angka di sana adalah metrik kebugaran yang produk
   ini tidak pernah mengukurnya, sedangkan keenam di sini dibaca langsung dari
   rekaman kamera pasien.

   Nilainya diambil lewat normalizeBiomarkers, bukan dari rawBiomarkers
   langsung, karena kolom itu diisi dua penulis dengan nama berbeda. Lihat
   lib/biomarkers.ts. Null berarti tesnya tidak dikerjakan, dan kartunya tidak
   dirender sama sekali: menampilkan nol untuk tes yang tidak pernah
   dijalankan adalah mengarang hasil. */
type BioRead = {
  key: string;
  labelKey: string;
  unitKey: string;
  icon: typeof Activity;
  digits: number;
  read: (b: ReturnType<typeof normalizeBiomarkers>) => number | null;
};

const BIOMARKERS: BioRead[] = [
  { key: 'tremor', labelKey: 'card.tremorFreq', unitKey: 'card.tremorFreqUnit', icon: Activity, digits: 2, read: b => b.tremorHz },
  { key: 'tap', labelKey: 'card.tapRate', unitKey: 'card.tapRateUnit', icon: Hand, digits: 2, read: b => b.tapRate },
  { key: 'cadence', labelKey: 'card.cadence', unitKey: 'card.cadenceUnit', icon: Footprints, digits: 0, read: b => b.cadence },
  { key: 'symmetry', labelKey: 'card.symmetry', unitKey: 'card.symmetryUnit', icon: MoveHorizontal, digits: 0, read: b => b.symmetryPercent },
  { key: 'sway', labelKey: 'card.sway', unitKey: 'card.swayUnit', icon: PersonStanding, digits: 2, read: b => b.swayAreaCm2 },
  { key: 'rom', labelKey: 'card.rom', unitKey: 'card.romUnit', icon: RotateCw, digits: 0, read: b => b.romDeg },
];

const heroStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const heroStaggerItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const heroCardSpring: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 22,
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const { t, lang } = useI18n();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  /* Indeks sesi yang sedang dilihat pada pita tanggal. 0 berarti yang
     terbaru, karena history datang terurut menurun dari server. */
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'PATIENT') {
      router.push('/login');
      return;
    }

    let alive = true;

    (async () => {
      try {
        const [sumRes, histRes] = await Promise.all([
          api.getPatientSummary(user.id, token!),
          api.getHistory(user.id, token!),
        ]);
        if (!alive) return;
        setSummary(sumRes as Summary);
        setHistory(histRes.sessions || []);
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setFailed(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, token, isLoading, router, attempt]);

  /* Dibungkus useMemo supaya rujukannya stabil. Tanpa ini, `?? []` membuat
     array baru pada setiap render, sehingga useMemo di bawahnya menghitung
     ulang terus-menerus dan tidak pernah benar-benar menjadi memo. */
  const timeline = useMemo(() => summary?.timeline ?? [], [summary]);

  /* Terendah dan tertinggi dihitung dari timeline, bukan diminta ke server.
     Datanya sudah ada di tangan, dan menambah endpoint untuk dua angka yang
     bisa diturunkan dari array yang sama hanya menambah tempat untuk tidak
     sinkron. */
  const stats = useMemo(() => {
    if (!timeline.length) return null;
    const scores = timeline.map(p => p.score);
    return {
      average: summary?.averageScore ?? scores.reduce((a, b) => a + b, 0) / scores.length,
      lowest: Math.min(...scores),
      highest: Math.max(...scores),
    };
  }, [timeline, summary]);

  const activeSession = history[activeIndex] ?? null;
  const previousSession = history[activeIndex + 1] ?? null;
  const activeBio = useMemo(() => normalizeBiomarkers(activeSession), [activeSession]);
  const previousBio = useMemo(() => normalizeBiomarkers(previousSession), [previousSession]);

  if (isLoading || (loading && !summary && history.length === 0)) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet">
          <LoadingScreen
            title={t('dash.loading')}
            subtitle="Menyiapkan ringkasan klinis dan data biomarker terbaru..."
          />
        </main>
      </div>
    );
  }

  if (failed && !summary && history.length === 0) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet" id="main">
          <div className={styles.pad}>
            <header className={styles.pageHead}>
              <h1 className={styles.pageTitle}>{t('dash.recentHistory')}</h1>
            </header>
            <LoadFailure
              detail={failed}
              onRetry={() => {
                setLoading(true);
                setFailed(null);
                setAttempt(n => n + 1);
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  const hasData = history.length > 0 && (summary || history.length > 0);
  const latestScore = summary?.latestScore ?? history[0]?.compositeScore ?? 0;
  const latestRisk = timeline[timeline.length - 1]?.risk;
  const level = latestRisk === 'HIGH' ? 'high' : latestRisk === 'MEDIUM' ? 'mid' : levelOf(latestScore);
  const riskLabel =
    level === 'high' ? t('risk.high') : level === 'mid' ? t('risk.medium') : t('risk.low');
  const trendWord =
    summary?.trendDirection === 'WORSENING'
      ? t('dash.worsening')
      : summary?.trendDirection === 'IMPROVING'
        ? t('dash.improving')
        : t('dash.stable');

  return (
    <div className={styles.page}>
      <AppNav />
      <LiveChat />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          {/* ── Kop ──────────────────────────────────────────────────────── */}
          <motion.header
            className={styles.pageHead}
            variants={heroStaggerItem}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.pageHeadText}>
              <h1 className={styles.pageTitle}>
                {greeting(lang)}, <span data-no-translate="">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className={styles.pageLead}>{t('dash.overviewTitle')}</p>
            </div>
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/screening" className="btn btn--primary btn--lg">
                {t('dash.startNow')}
              </Link>
            </motion.div>
          </motion.header>

          {!hasData ? (
            <motion.section
              className={styles.empty}
              variants={heroCardSpring}
              initial="hidden"
              animate="visible"
            >
              <h2 className={styles.emptyTitle}>{t('dash.noData')}</h2>
              <p className={styles.emptyBody}>{t('dash.emptyBody')}</p>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                <Link href="/screening" className="btn btn--primary btn--lg">
                  {t('dash.startNow')}
                </Link>
              </motion.div>
            </motion.section>
          ) : (
            <motion.div
              className={styles.layout}
              variants={heroStaggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* ══ Kolom utama ══════════════════════════════════════════ */}
              <div className={styles.main}>
                {/* Kartu biomarker (Staggered Hero Animation) */}
                <motion.section aria-labelledby="measuresHead" variants={heroStaggerItem}>
                  <div className={styles.sectionHead}>
                    <h2 id="measuresHead" className={styles.sectionTitle}>
                      {t('dash.latestMeasures')}
                    </h2>
                    <span className={styles.sectionMeta}>
                      {activeSession &&
                        new Date(activeSession.timestamp).toLocaleDateString(dateLocale(lang), {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                    </span>
                  </div>

                  <motion.div className={styles.bioGrid} variants={heroStaggerContainer}>
                    {activeSession &&
                      BIOMARKERS.map(b => {
                        const value = b.read(activeBio);
                        if (value === null) return null;
                        const prev = previousSession ? b.read(previousBio) : null;
                        const delta = prev !== null ? value - prev : null;
                        const Icon = b.icon;

                        return (
                          <motion.article
                            key={b.key}
                            className={styles.bioCard}
                            variants={heroCardSpring}
                            whileHover={{ y: -5, scale: 1.025 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                          >
                            <div className={styles.bioHead}>
                              <motion.span
                                className={styles.bioIcon}
                                whileHover={{ rotate: 12, scale: 1.12 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              >
                                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                              </motion.span>
                              <h3 className={styles.bioLabel}>{t(b.labelKey)}</h3>
                            </div>
                            <p className={styles.bioValue}>
                              <AnimatedNumber value={value} duration={1100} decimals={b.digits} />
                              <span className={styles.bioUnit}>{t(b.unitKey)}</span>
                            </p>
                            <p className={styles.bioDelta}>
                              {delta === null ? (
                                t('dash.noPrevious')
                              ) : (
                                <>
                                  <span className={styles.bioDeltaValue}>
                                    {delta > 0 ? '+' : ''}
                                    {delta.toFixed(b.digits)}
                                  </span>{' '}
                                  {t('dash.vsPrevious')}
                                </>
                              )}
                            </p>
                          </motion.article>
                        );
                      })}
                  </motion.div>
                </motion.section>

                {/* Pita tanggal sesi. */}
                {history.length > 1 && (
                  <motion.section aria-labelledby="stripHead" variants={heroStaggerItem}>
                    <div className={styles.sectionHead}>
                      <h2 id="stripHead" className={styles.sectionTitle}>
                        {t('dash.sessionStrip')}
                      </h2>
                      <Link href="/riwayat" className={styles.sectionLink}>
                        {t('dash.viewAll')}
                      </Link>
                    </div>

                    <motion.div className={styles.strip} variants={heroStaggerContainer}>
                      {history.slice(0, 10).map((s, i) => {
                        const d = new Date(s.timestamp);
                        const active = i === activeIndex;
                        return (
                          <motion.button
                            key={s.id}
                            type="button"
                            className={styles.stripItem}
                            data-active={active ? '' : undefined}
                            aria-pressed={active}
                            onClick={() => setActiveIndex(i)}
                            variants={heroCardSpring}
                            whileHover={{ y: -3, scale: 1.06 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className={styles.stripDay}>
                              {d.toLocaleDateString(dateLocale(lang), { weekday: 'short' })}
                            </span>
                            <span className={styles.stripDate}>{d.getDate()}</span>
                            <span className={styles.stripScore}>{Math.round(s.compositeScore)}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </motion.section>
                )}

                {/* Tabel riwayat. */}
                <motion.section aria-labelledby="histHead" variants={heroStaggerItem}>
                  <div className={styles.sectionHead}>
                    <h2 id="histHead" className={styles.sectionTitle}>
                      {t('dash.recentHistory')}
                    </h2>
                    <Link href="/riwayat" className={styles.sectionLink}>
                      {t('dash.viewAll')}
                    </Link>
                  </div>

                  <div className={styles.tableCard}>
                    <table className="dataTable">
                      <thead>
                        <tr>
                          <th scope="col">{t('hist.date')}</th>
                          <th scope="col">{t('hist.finding')}</th>
                          <th scope="col" className="num">
                            {t('res.compositeScore')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 5).map(session => (
                          <tr key={session.id}>
                            <td>
                              <time dateTime={String(session.timestamp)}>
                                {new Date(session.timestamp).toLocaleDateString(dateLocale(lang), {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </time>
                            </td>
                            <td>
                              {session.mlPrediction?.predictedLabel
                                ? translateServerLabel(session.mlPrediction.predictedLabel, lang)
                                : t('dash.motorScreening')}
                              {session.doctorNote && (
                                <span className={styles.doctorNote}>
                                  <strong>{t('hist.doctorNote')}:</strong>{' '}
                                  <span data-no-translate="">{session.doctorNote}</span>
                                </span>
                              )}
                            </td>
                            <td className="num">{Math.round(session.compositeScore)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              </div>

              {/* ══ Panel skor ═══════════════════════════════════════════ */}
              <motion.aside className={styles.aside} variants={heroStaggerItem}>
                <motion.section
                  className={`${styles.scorePanel} ${styles[`panel_${level}`]}`}
                  variants={heroCardSpring}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <h2 className={styles.scorePanelTitle}>{t('dash.scorePanel')}</h2>

                  <ScoreRing score={latestScore} label={t('dash.scoreUnit')} />

                  <p className={`level level--${level} ${styles.levelChip}`}>{riskLabel}</p>

                  <p className={styles.trend}>
                    {t('dash.trend')}: <strong>{trendWord}</strong>
                    {typeof summary?.trendDelta === 'number' && summary.trendDelta !== 0 && (
                      <span className={styles.delta}>
                        {' '}
                        ({summary.trendDelta > 0 ? '+' : ''}
                        {summary.trendDelta})
                      </span>
                    )}
                  </p>

                  <p className={styles.lowerBetter}>{t('dash.lowerBetter')}</p>

                  {stats && (
                    <motion.dl className={styles.miniStats} variants={heroStaggerContainer}>
                      <motion.div
                        className={styles.miniStat}
                        variants={heroStaggerItem}
                        whileHover={{ y: -2, scale: 1.04 }}
                      >
                        <dt className={styles.miniLabel}>{t('dash.statAverage')}</dt>
                        <dd className={styles.miniValue}>
                          <AnimatedNumber value={stats.average} duration={1100} />
                        </dd>
                      </motion.div>
                      <motion.div
                        className={styles.miniStat}
                        variants={heroStaggerItem}
                        whileHover={{ y: -2, scale: 1.04 }}
                      >
                        <dt className={styles.miniLabel}>{t('dash.statLowest')}</dt>
                        <dd className={styles.miniValue}>
                          <AnimatedNumber value={stats.lowest} duration={1100} />
                        </dd>
                      </motion.div>
                      <motion.div
                        className={styles.miniStat}
                        variants={heroStaggerItem}
                        whileHover={{ y: -2, scale: 1.04 }}
                      >
                        <dt className={styles.miniLabel}>{t('dash.statHighest')}</dt>
                        <dd className={styles.miniValue}>
                          <AnimatedNumber value={stats.highest} duration={1100} />
                        </dd>
                      </motion.div>
                    </motion.dl>
                  )}
                </motion.section>

                {timeline.length > 1 && (
                  <motion.section
                    className={styles.chartCard}
                    variants={heroCardSpring}
                    whileHover={{ y: -2, scale: 1.01 }}
                  >
                    <SessionBars points={timeline} label={t('dash.trendChart')} />
                  </motion.section>
                )}
              </motion.aside>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
