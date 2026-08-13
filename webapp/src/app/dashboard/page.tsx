'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import AppNav from '@/components/AppNav';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import LiveChat from '@/components/LiveChat';
import styles from './dashboard.module.css';

function getGreeting(lang: string) {
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

/** Angka skor yang "menghitung naik" ke nilai akhir, bukan langsung muncul statis. */
function useCountUp(target: number | undefined, durationMs = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === undefined) return;
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function Sparkline({ points }: { points: { score: number; risk: string }[] }) {
  if (points.length < 2) return null;
  const w = 100, h = 32, pad = 3;
  const scores = points.map(p => p.score);
  const min = Math.min(...scores, 0), max = Math.max(...scores, 100);
  const xStep = (w - pad * 2) / (points.length - 1);
  const yFor = (s: number) => h - pad - ((s - min) / (max - min || 1)) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${yFor(p.score)}`).join(' ');
  const lastRisk = points[points.length - 1].risk;
  const color = lastRisk === 'HIGH' ? 'var(--red)' : lastRisk === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={40} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={pad + i * xStep} cy={yFor(p.score)} r={i === points.length - 1 ? 2.5 : 1.5} fill={color} />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const { t, lang } = useI18n();
  
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'PATIENT') {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const [sumRes, histRes] = await Promise.all([
          api.getPatientSummary(user!.id),
          api.getHistory(user!.id, token!)
        ]);
        setSummary(sumRes);
        setHistory(histRes.sessions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, token, isLoading, router]);

  const displayScore = useCountUp(summary?.latestScore !== undefined ? Math.round(summary.latestScore) : undefined);

  if (isLoading || loading) return <div style={{ padding: 40, textAlign: 'center' }}>{t('dash.loading')}</div>;

  // riskDistribution adalah objek HITUNGAN ({HIGH: 4, LOW: 1, ...}), bukan urutan sesi.
  // Sebelumnya kode mengambil key terakhirnya, sehingga kategori yang tampil tidak ada
  // hubungannya dengan sesi terbaru: skor 88 bisa terlabel "Risiko LOW" berwarna hijau.
  // Sumber yang benar adalah entri terakhir pada timeline.
  const timeline = summary?.timeline as Array<{ risk?: string }> | undefined;
  const latestRisk =
    timeline?.[timeline.length - 1]?.risk ||
    (summary?.latestScore >= 65 ? 'HIGH' : summary?.latestScore >= 35 ? 'MEDIUM' : 'LOW');
  const riskLabel = latestRisk === 'HIGH' ? t('risk.high') : latestRisk === 'MEDIUM' ? t('risk.medium') : t('risk.low');

  return (
    <div className={styles.page}>
      <AppNav />
      <LiveChat />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>
              {getGreeting(lang)},{' '}
              <span data-no-translate="">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p>{t('dash.subtitle')}</p>
          </div>
          <div className={styles.userCard}>
            <div className={styles.avatar} data-no-translate="">{user?.name.charAt(0)}</div>
            <div>
              <div className={styles.userName} data-no-translate="">{user?.name}</div>
              <div className={styles.userRole}>{t('dash.registeredPatient')}</div>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Main Score Card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('dash.latestScore')}</h3>
            {summary?.latestScore !== undefined ? (
              <>
                <div
                  className={styles.scoreValue}
                  style={{ color: latestRisk === 'HIGH' ? 'var(--red-text)' : latestRisk === 'MEDIUM' ? 'var(--yellow-text)' : 'var(--green-text)' }}
                >
                  {displayScore}
                </div>
                <div className={`${styles.badge} ${
                  latestRisk === 'HIGH' ? 'risk-bg-high risk-high' :
                  latestRisk === 'MEDIUM' ? 'risk-bg-medium risk-medium' : 'risk-bg-low risk-low'
                }`}>
                  {t('dash.riskPrefix')} {riskLabel}
                </div>
                <div className={styles.trendBox}>
                  <span>{summary.trendDirection === 'WORSENING' ? '📈' : summary.trendDirection === 'IMPROVING' ? '📉' : '➖'}</span>
                  {t('dash.trend')}: {summary.trendDirection === 'WORSENING' ? t('dash.worsening') : summary.trendDirection === 'IMPROVING' ? t('dash.improving') : t('dash.stable')}
                  ({summary.trendDelta > 0 ? '+' : ''}{summary.trendDelta})
                </div>
                {summary.timeline?.length > 1 && (
                  <div style={{ marginTop: 16 }}>
                    <Sparkline points={summary.timeline} />
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 8, opacity: 0.6 }}>🧠</div>
                <p style={{ color: 'var(--text-secondary)' }}>{t('dash.noData')}</p>
              </div>
            )}
          </div>

          {/* Quick Start Card */}
          <div className={styles.ctaBox}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('dash.startScreening')}</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('dash.quickSub')}</p>
            <Link href="/screening" className="btn" style={{ background: '#fff', color: 'var(--brand)', width: '100%' }}>
              {t('dash.startNow')}
            </Link>
          </div>
        </div>

        {/* History */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('dash.recentHistory')}</h2>
          {history.length > 0 && (
            <Link href="/riwayat" className="btn btn-outline btn-sm">{t('dash.viewAll')}</Link>
          )}
        </div>
        <div className={styles.historyList}>
          {history.length > 0 ? history.slice(0, 3).map((session, i) => (
            <div key={session.id} className={styles.historyItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className={styles.historyDate}>
                    {new Date(session.timestamp).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={styles.historyDesc}>
                    {session.mlPrediction?.predictedLabel
                      ? translateServerLabel(session.mlPrediction.predictedLabel, lang)
                      : t('dash.motorScreening')}
                  </div>
                </div>
                <div
                  className={styles.historyScore}
                  style={{ color: session.riskCategory === 'HIGH' ? 'var(--red-text)' : session.riskCategory === 'MEDIUM' ? 'var(--yellow-text)' : 'var(--green-text)' }}
                >
                  {Math.round(session.compositeScore)}
                </div>
              </div>
              {session.recommendations && session.recommendations.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {session.recommendations[0]}
                </div>
              )}
              {session.doctorNote && (
                <div style={{ fontSize: '0.82rem', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--brand)', padding: '8px 12px', borderRadius: 4 }}>
                  <strong style={{ color: 'var(--brand-text)' }}>{t('hist.doctorNote')}:</strong>{' '}
                  <span data-no-translate="">{session.doctorNote}</span>
                </div>
              )}
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
              {t('dash.noHistory')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
