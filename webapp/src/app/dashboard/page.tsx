'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import AppNav from '@/components/AppNav';
import LiveChat from '@/components/LiveChat';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import styles from './dashboard.module.css';

interface TimelinePoint {
  score: number;
  risk?: string;
}

interface Summary {
  latestScore?: number;
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

/**
 * Jejak pengukuran antar sesi.
 *
 * Digambar sebagai trace di atas kertas bergaris, bukan sparkline dekoratif:
 * ia punya sumbu, punya garis acuan, dan setiap titiknya adalah satu sesi
 * nyata. Pekerjaan produk ini memang memantau perubahan antar waktu, jadi
 * grafik ini adalah isi, bukan hiasan.
 */
function Trace({ points, label }: { points: TimelinePoint[]; label: string }) {
  if (points.length < 2) return null;

  const w = 640;
  const h = 150;
  const padX = 8;
  const padY = 14;
  const xStep = (w - padX * 2) / (points.length - 1);
  const yFor = (s: number) => padY + (1 - s / 100) * (h - padY * 2);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${padX + i * xStep} ${yFor(p.score)}`)
    .join(' ');

  return (
    <figure className={styles.trace}>
      <figcaption className="label">{label}</figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={styles.traceSvg}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: ${points.map(p => Math.round(p.score)).join(', ')}`}
      >
        {/* Garis acuan 35 dan 65, ambang antar tingkat. */}
        {[35, 65].map(v => (
          <g key={v}>
            <line
              x1={padX}
              x2={w - padX}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="var(--rule-hair)"
              strokeWidth="1"
            />
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={padX + i * xStep}
            cy={yFor(p.score)}
            r={i === points.length - 1 ? 4 : 2.5}
            fill={i === points.length - 1 ? 'var(--accent)' : 'var(--ink)'}
          />
        ))}
      </svg>
    </figure>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const { t, lang } = useI18n();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'PATIENT') {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        const [sumRes, histRes] = await Promise.all([
          api.getPatientSummary(user.id, token!),
          api.getHistory(user.id, token!),
        ]);
        setSummary(sumRes as Summary);
        setHistory(histRes.sessions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token, isLoading, router]);

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

  const timeline = summary?.timeline;
  const latestRisk =
    timeline?.[timeline.length - 1]?.risk ||
    ((summary?.latestScore ?? 0) >= 65 ? 'HIGH' : (summary?.latestScore ?? 0) >= 35 ? 'MEDIUM' : 'LOW');
  const level = latestRisk === 'HIGH' ? 'high' : latestRisk === 'MEDIUM' ? 'mid' : 'low';
  const riskLabel =
    latestRisk === 'HIGH' ? t('risk.high') : latestRisk === 'MEDIUM' ? t('risk.medium') : t('risk.low');
  const trendWord =
    summary?.trendDirection === 'WORSENING'
      ? t('dash.worsening')
      : summary?.trendDirection === 'IMPROVING'
        ? t('dash.improving')
        : t('dash.stable');

  const hasScore = summary?.latestScore !== undefined;

  return (
    <div className={styles.page}>
      <AppNav />
      <LiveChat />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span>{t('dash.registeredPatient')}</span>
              <span data-no-translate="">{user?.name}</span>
            </div>
            <h1>
              {greeting(lang)}, <span data-no-translate="">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className={styles.lead}>{t('dash.subtitle')}</p>
          </header>

          <div className={styles.layout}>
            <section className={styles.primary}>
              {hasScore ? (
                <>
                  <h2 className="label">{t('dash.latestScore')}</h2>
                  <p className={styles.scoreLine}>
                    <span className={styles.scoreValue}>{Math.round(summary!.latestScore!)}</span>
                    <span className={styles.scoreOf}>{t('res.scoreOf')}</span>
                  </p>

                  <p className={`level level--${level} ${styles.levelChip}`}>{riskLabel}</p>

                  <p className={styles.trend}>
                    {t('dash.trend')}: <strong>{trendWord}</strong>
                    {typeof summary?.trendDelta === 'number' && (
                      <>
                        {' '}
                        <span className={styles.delta}>
                          ({summary.trendDelta > 0 ? '+' : ''}
                          {summary.trendDelta})
                        </span>
                      </>
                    )}
                  </p>

                  {timeline && timeline.length > 1 && (
                    <Trace points={timeline} label={t('dash.traceLabel')} />
                  )}
                </>
              ) : (
                <div className={styles.empty}>
                  <h2>{t('dash.noData')}</h2>
                  <p>{t('dash.emptyBody')}</p>
                </div>
              )}
            </section>

            <aside className={styles.action}>
              <h2 className={styles.actionTitle}>{t('dash.startScreening')}</h2>
              <p className={styles.actionBody}>{t('dash.quickSub')}</p>
              <Link href="/screening" className="btn btn--primary btn--lg btn--block">
                {t('dash.startNow')}
              </Link>
            </aside>
          </div>

          {/* ── Riwayat terbaru ──────────────────────────────────────────── */}
          <section className={styles.historySection}>
            <div className={styles.historyHead}>
              <h2 className={styles.historyTitle}>{t('dash.recentHistory')}</h2>
              {history.length > 0 && (
                <Link href="/riwayat" className="btn">
                  {t('dash.viewAll')}
                </Link>
              )}
            </div>

            {history.length > 0 ? (
              <div className={styles.tableScroll}>
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
            ) : (
              <p className={styles.emptyRow}>{t('dash.noHistory')}</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
