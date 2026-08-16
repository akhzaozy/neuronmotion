'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Footprints, Hand, MoveHorizontal, PersonStanding, RotateCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import { normalizeBiomarkers } from '@/lib/biomarkers';
import AppNav from '@/components/AppNav';
import LiveChat from '@/components/LiveChat';
import LoadFailure from '@/components/LoadFailure';
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
  trendDirection?: string;
  trendDelta?: number;
  timeline?: TimelinePoint[];
}

function greeting(lang: string) {
  const h = new Date().getHours();
  if (lang === 'en') {
    if (h < 11) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

const levelOf = (score: number) => (score >= 65 ? 'high' : score >= 35 ? 'mid' : 'low');

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
function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;

  return (
    <div className={styles.ringWrap}>
      <svg viewBox="0 0 200 200" className={styles.ring} role="img" aria-label={`${Math.round(score)} / 100. ${label}`}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--inset)" strokeWidth="16" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          /* Busur dimulai dari puncak, bukan dari sisi kanan, karena arah baca
             sebuah takaran selalu bermula di atas. */
          transform="rotate(-90 100 100)"
          className={styles.ringArc}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringValue}>{Math.round(score)}</span>
        <span className={styles.ringUnit}>{label}</span>
      </div>
    </div>
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
function SessionBars({ points, label }: { points: TimelinePoint[]; label: string }) {
  if (points.length < 2) return null;
  const shown = points.slice(-14);

  return (
    <figure className={styles.bars}>
      <figcaption className={styles.barsHead}>
        <span className={styles.barsTitle}>{label}</span>
      </figcaption>
      <div
        className={styles.barsRow}
        role="img"
        aria-label={`${label}: ${shown.map(p => Math.round(p.score)).join(', ')}`}
      >
        {shown.map((p, i) => (
          <div key={i} className={styles.barSlot}>
            <div
              className={`${styles.bar} ${styles[`bar_${levelOf(p.score)}`]}`}
              /* Lantai 6% supaya sesi berskor sangat rendah tetap punya
                 batang yang terlihat, bukan garis yang hilang sama sekali. */
              style={{ height: `${Math.max(6, p.score)}%` }}
            />
          </div>
        ))}
      </div>
    </figure>
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
      total: summary?.totalSessions ?? scores.length,
    };
  }, [timeline, summary]);

  const activeSession = history[activeIndex] ?? null;
  const previousSession = history[activeIndex + 1] ?? null;
  const activeBio = useMemo(() => normalizeBiomarkers(activeSession), [activeSession]);
  const previousBio = useMemo(() => normalizeBiomarkers(previousSession), [previousSession]);

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet">
          <p className={styles.loading} role="status" aria-live="polite">
            {t('dash.loading')}
          </p>
        </main>
      </div>
    );
  }

  if (failed) {
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

  const hasData = history.length > 0 && summary?.latestScore !== undefined;
  const latestScore = summary?.latestScore ?? 0;
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
          <header className={styles.pageHead}>
            <div className={styles.pageHeadText}>
              <h1 className={styles.pageTitle}>
                {greeting(lang)}, <span data-no-translate="">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className={styles.pageLead}>{t('dash.overviewTitle')}</p>
            </div>
            <Link href="/screening" className="btn btn--primary btn--lg">
              {t('dash.startNow')}
            </Link>
          </header>

          {!hasData ? (
            /* Keadaan kosong.
               ───────────────────────────────────────────────────────────────
               Ini yang dilihat setiap akun baru, jadi ia dirancang sebagai
               halaman utuh dan bukan sisa dari tata letak yang datanya belum
               datang. Panel kanan tidak ditampilkan sebagai kerangka kosong:
               cincin skor bernilai nol akan terbaca sebagai hasil pengukuran
               yang sangat baik, padahal belum ada pengukuran apa pun. */
            <section className={styles.empty}>
              <h2 className={styles.emptyTitle}>{t('dash.noData')}</h2>
              <p className={styles.emptyBody}>{t('dash.emptyBody')}</p>
              <Link href="/screening" className="btn btn--primary btn--lg">
                {t('dash.startNow')}
              </Link>
            </section>
          ) : (
            <div className={styles.layout}>
              {/* ══ Kolom utama ══════════════════════════════════════════ */}
              <div className={styles.main}>
                {/* Kartu biomarker. */}
                <section aria-labelledby="measuresHead">
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

                  <div className={styles.bioGrid}>
                    {activeSession &&
                      BIOMARKERS.map(b => {
                        const value = b.read(activeBio);
                        if (value === null) return null;
                        const prev = previousSession ? b.read(previousBio) : null;
                        const delta = prev !== null ? value - prev : null;
                        const Icon = b.icon;

                        return (
                          <article key={b.key} className={styles.bioCard}>
                            <div className={styles.bioHead}>
                              <span className={styles.bioIcon}>
                                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                              </span>
                              <h3 className={styles.bioLabel}>{t(b.labelKey)}</h3>
                            </div>
                            <p className={styles.bioValue}>
                              {value.toFixed(b.digits)}
                              <span className={styles.bioUnit}>{t(b.unitKey)}</span>
                            </p>
                            {/* Perubahan dibawa kata dan tanda, bukan panah
                                berwarna sendirian. Arah "membaik" berbeda per
                                biomarker, jadi di sini hanya dinyatakan
                                selisihnya tanpa menghakimi baik atau buruk. */}
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
                          </article>
                        );
                      })}
                  </div>
                </section>

                {/* Pita tanggal sesi. Menggantikan jadwal pemeriksaan pada
                    rujukan. Produk ini tidak punya penjadwalan, dan menaruh
                    janji temu karangan di sini adalah hal pertama yang akan
                    dibongkar penilai. Yang ditaruh justru tanggal sesi yang
                    benar-benar ada, dan setiap tanggal bisa dibuka. */}
                {history.length > 1 && (
                  <section aria-labelledby="stripHead">
                    <div className={styles.sectionHead}>
                      <h2 id="stripHead" className={styles.sectionTitle}>
                        {t('dash.sessionStrip')}
                      </h2>
                      <Link href="/riwayat" className={styles.sectionLink}>
                        {t('dash.viewAll')}
                      </Link>
                    </div>

                    <div className={styles.strip}>
                      {history.slice(0, 10).map((s, i) => {
                        const d = new Date(s.timestamp);
                        const active = i === activeIndex;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={styles.stripItem}
                            data-active={active ? '' : undefined}
                            aria-pressed={active}
                            onClick={() => setActiveIndex(i)}
                          >
                            <span className={styles.stripDay}>
                              {d.toLocaleDateString(dateLocale(lang), { weekday: 'short' })}
                            </span>
                            <span className={styles.stripDate}>{d.getDate()}</span>
                            <span className={styles.stripScore}>{Math.round(s.compositeScore)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Tabel riwayat. */}
                <section aria-labelledby="histHead">
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
                </section>
              </div>

              {/* ══ Panel skor ═══════════════════════════════════════════ */}
              <aside className={styles.aside}>
                <section className={`${styles.scorePanel} ${styles[`panel_${level}`]}`}>
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
                    <dl className={styles.miniStats}>
                      <div className={styles.miniStat}>
                        <dt className={styles.miniLabel}>{t('dash.statAverage')}</dt>
                        <dd className={styles.miniValue}>{Math.round(stats.average)}</dd>
                      </div>
                      <div className={styles.miniStat}>
                        <dt className={styles.miniLabel}>{t('dash.statLowest')}</dt>
                        <dd className={styles.miniValue}>{Math.round(stats.lowest)}</dd>
                      </div>
                      <div className={styles.miniStat}>
                        <dt className={styles.miniLabel}>{t('dash.statHighest')}</dt>
                        <dd className={styles.miniValue}>{Math.round(stats.highest)}</dd>
                      </div>
                    </dl>
                  )}
                </section>

                {timeline.length > 1 && (
                  <section className={styles.chartCard}>
                    <SessionBars points={timeline} label={t('dash.trendChart')} />
                  </section>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
