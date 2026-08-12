'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import AppNav from '@/components/AppNav';
import styles from './riwayat.module.css';

const RISK_COLOR: Record<string, string> = {
  HIGH: 'var(--red)',
  MEDIUM: 'var(--yellow)',
  LOW: 'var(--green)',
};

const RISK_LABEL: Record<string, string> = {
  HIGH: 'Tinggi',
  MEDIUM: 'Sedang',
  LOW: 'Rendah',
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Grafik garis tren skor dengan pita warna hijau/kuning/merah sebagai latar. */
function TrendChart({ sessions }: { sessions: Session[] }) {
  const w = 720, h = 220, padL = 38, padR = 12, padT = 12, padB = 28;
  const points = [...sessions].reverse(); // urut lama → baru
  if (points.length < 2) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Minimal 2 sesi diperlukan untuk menampilkan grafik tren.</p>;
  }

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const yFor = (score: number) => padT + (1 - score / 100) * plotH;
  const xFor = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.compositeScore)}`).join(' ');

  // Pita: 0-35 rendah (hijau), 35-65 sedang (kuning), 65-100 tinggi (merah)
  const bandLow = { y: yFor(35), height: yFor(0) - yFor(35) };
  const bandMed = { y: yFor(65), height: yFor(35) - yFor(65) };
  const bandHigh = { y: yFor(100), height: yFor(65) - yFor(100) };

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={240} style={{ display: 'block', minWidth: 560 }}>
        <rect x={padL} y={bandLow.y} width={plotW} height={bandLow.height} fill="var(--green)" opacity="0.09" />
        <rect x={padL} y={bandMed.y} width={plotW} height={bandMed.height} fill="var(--yellow)" opacity="0.09" />
        <rect x={padL} y={bandHigh.y} width={plotW} height={bandHigh.height} fill="var(--red)" opacity="0.09" />

        {[0, 35, 65, 100].map(v => (
          <g key={v}>
            <line x1={padL} y1={yFor(v)} x2={w - padR} y2={yFor(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padL - 8} y={yFor(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v}</text>
          </g>
        ))}

        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={xFor(i)} cy={yFor(p.compositeScore)} r="4.5" fill={RISK_COLOR[p.riskCategory] || 'var(--brand)'} stroke="var(--bg-card)" strokeWidth="2" />
            <title>{`Sesi #${p.id} - Skor ${Math.round(p.compositeScore)} (${RISK_LABEL[p.riskCategory] || p.riskCategory})`}</title>
          </g>
        ))}

        {points.map((p, i) => (
          (i === 0 || i === points.length - 1 || points.length <= 6) ? (
            <text key={`x-${p.id}`} x={xFor(i)} y={h - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
              #{p.id}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
}

interface BiomarkerDelta {
  label: string;
  unit: string;
  from?: number;
  to?: number;
  higherIsWorse: boolean;
}

function getBiomarkerDeltas(a: Session, b: Session): BiomarkerDelta[] {
  const ra = a.rawBiomarkers, rb = b.rawBiomarkers;
  return [
    { label: 'Tremor', unit: 'Hz', from: ra?.tremor?.dominantFrequencyHz, to: rb?.tremor?.dominantFrequencyHz, higherIsWorse: true },
    { label: 'Finger Tapping', unit: 'ketukan/dtk', from: ra?.fingerTapping?.tapRatePerSecond, to: rb?.fingerTapping?.tapRatePerSecond, higherIsWorse: false },
    { label: 'Simetri Gait', unit: '%', from: ra?.gait?.symmetryPercent, to: rb?.gait?.symmetryPercent, higherIsWorse: false },
    { label: 'Asimetri Lengan', unit: '%', from: ra?.armSwing?.asymmetryPercent, to: rb?.armSwing?.asymmetryPercent, higherIsWorse: true },
    { label: 'Sway Area', unit: 'cm²', from: ra?.posturalStability?.swayAreaCm2, to: rb?.posturalStability?.swayAreaCm2, higherIsWorse: true },
    { label: 'ROM Lutut', unit: '°', from: ra?.rom?.romDeg, to: rb?.rom?.romDeg, higherIsWorse: false },
  ];
}

export default function RiwayatPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [detail, setDetail] = useState<Session | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'PATIENT') { router.push('/login'); return; }

    api.getHistory(user.id, token!)
      .then(res => {
        const list = res.sessions || [];
        setSessions(list);
        if (list.length >= 2) {
          setCompareA(list[list.length - 1].id);
          setCompareB(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, token, isLoading, router]);

  const sessionA = useMemo(() => sessions.find(s => s.id === compareA) || null, [sessions, compareA]);
  const sessionB = useMemo(() => sessions.find(s => s.id === compareB) || null, [sessions, compareB]);

  const exportCSV = () => {
    const rows = [
      ['ID Sesi', 'Tanggal', 'Skor', 'Kategori Risiko', 'Prediksi', 'Catatan Nakes'],
      ...sessions.map(s => [
        String(s.id),
        formatDate(s.timestamp),
        String(Math.round(s.compositeScore)),
        RISK_LABEL[s.riskCategory] || s.riskCategory,
        s.mlPrediction?.predictedLabel || '',
        (s.doctorNote || '').replace(/\n/g, ' '),
      ]),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-neuronmotion-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <AppNav />
        <div className={styles.container}><p>Memuat riwayat...</p></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Riwayat Pemeriksaan</h1>
            <p>Pantau perubahan skor risiko dan biomarker Anda dari waktu ke waktu.</p>
          </div>
          {sessions.length > 0 && (
            <div className={styles.exportRow}>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Unduh PDF</button>
              <button className="btn btn-outline btn-sm" onClick={exportCSV}>Ekspor CSV</button>
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.emptyState}>
              <div style={{ fontSize: '2.6rem', marginBottom: 12, opacity: 0.6 }}>📋</div>
              <p style={{ marginBottom: 16 }}>Belum ada riwayat pemeriksaan.</p>
              <Link href="/screening" className="btn btn-primary">Mulai Skrining Pertama</Link>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tren Skor Risiko per Sesi</h2>
              <TrendChart sessions={sessions} />
            </div>

            {sessions.length >= 2 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Perbandingan Sesi</h2>
                <div className={styles.compareRow}>
                  <select className={styles.compareSelect} value={compareA ?? ''} onChange={e => setCompareA(Number(e.target.value))}>
                    {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} · {formatDate(s.timestamp)}</option>)}
                  </select>
                  <span style={{ color: 'var(--text-muted)' }}>vs</span>
                  <select className={styles.compareSelect} value={compareB ?? ''} onChange={e => setCompareB(Number(e.target.value))}>
                    {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} · {formatDate(s.timestamp)}</option>)}
                  </select>
                </div>

                {sessionA && sessionB && (
                  <div className={styles.deltaList}>
                    <div className={styles.deltaItem}>
                      <span className={styles.deltaLabel}>Skor Komposit</span>
                      <span className={styles.deltaValue}>
                        {Math.round(sessionA.compositeScore)} → {Math.round(sessionB.compositeScore)}{' '}
                        <span style={{ color: sessionB.compositeScore > sessionA.compositeScore ? 'var(--red)' : sessionB.compositeScore < sessionA.compositeScore ? 'var(--green)' : 'var(--text-muted)' }}>
                          {sessionB.compositeScore > sessionA.compositeScore ? '↑ memburuk'
                            : sessionB.compositeScore < sessionA.compositeScore ? '↓ membaik' : '→ stabil'}
                        </span>
                      </span>
                    </div>
                    {getBiomarkerDeltas(sessionA, sessionB).map(d => {
                      if (d.from === undefined || d.to === undefined) return null;
                      const worse = d.higherIsWorse ? d.to > d.from : d.to < d.from;
                      const better = d.higherIsWorse ? d.to < d.from : d.to > d.from;
                      return (
                        <div key={d.label} className={styles.deltaItem}>
                          <span className={styles.deltaLabel}>{d.label}</span>
                          <span className={styles.deltaValue}>
                            {d.from} → {d.to} {d.unit}{' '}
                            <span style={{ color: worse ? 'var(--red)' : better ? 'var(--green)' : 'var(--text-muted)' }}>
                              {worse ? '↑ memburuk' : better ? '↓ membaik' : '→ stabil'}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Semua Sesi ({sessions.length})</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Skor</th>
                      <th>Kategori</th>
                      <th>Catatan Nakes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td>{formatDate(s.timestamp)}</td>
                        <td style={{ fontWeight: 700, color: RISK_COLOR[s.riskCategory] }}>{Math.round(s.compositeScore)}</td>
                        <td>
                          <span className={styles.riskPill} style={{ background: `color-mix(in srgb, ${RISK_COLOR[s.riskCategory]} 15%, transparent)`, color: RISK_COLOR[s.riskCategory] }}>
                            {RISK_LABEL[s.riskCategory] || s.riskCategory}
                          </span>
                        </td>
                        <td className={styles.noteCell}>
                          {s.doctorNote || <span style={{ color: 'var(--text-muted)' }}>Belum ada catatan dari nakes</span>}
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => setDetail(s)}>Detail</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <div className={styles.detailPanel} onClick={() => setDetail(null)}>
          <div className={styles.detailCard} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Detail Sesi #{detail.id}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>{formatDate(detail.timestamp)}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: RISK_COLOR[detail.riskCategory] }}>
                {Math.round(detail.compositeScore)}
              </span>
              <span className={styles.riskPill} style={{ background: `color-mix(in srgb, ${RISK_COLOR[detail.riskCategory]} 15%, transparent)`, color: RISK_COLOR[detail.riskCategory] }}>
                Risiko {RISK_LABEL[detail.riskCategory] || detail.riskCategory}
              </span>
            </div>

            {detail.mlPrediction?.predictedLabel && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Pola terdekat: <strong style={{ color: 'var(--purple)' }}>{detail.mlPrediction.predictedLabel}</strong>
                {detail.mlPrediction.confidence !== undefined && ` (${detail.mlPrediction.confidence}%)`}
              </p>
            )}

            <div className={styles.biomarkerGrid}>
              {detail.rawBiomarkers?.tremor?.dominantFrequencyHz !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>Tremor</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.tremor.dominantFrequencyHz} Hz</div>
                </div>
              )}
              {detail.rawBiomarkers?.fingerTapping?.tapRatePerSecond !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>Finger Tapping</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.fingerTapping.tapRatePerSecond} /dtk</div>
                </div>
              )}
              {detail.rawBiomarkers?.gait?.symmetryPercent !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>Simetri Gait</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.gait.symmetryPercent}%</div>
                </div>
              )}
              {detail.rawBiomarkers?.armSwing?.asymmetryPercent !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>Asimetri Lengan</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.armSwing.asymmetryPercent}%</div>
                </div>
              )}
              {detail.rawBiomarkers?.posturalStability?.swayAreaCm2 !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>Sway Area</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.posturalStability.swayAreaCm2} cm²</div>
                </div>
              )}
              {detail.rawBiomarkers?.rom?.romDeg !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>ROM Lutut</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.rom.romDeg}°</div>
                </div>
              )}
            </div>

            {detail.recommendations && detail.recommendations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>Rekomendasi</h3>
                <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  {detail.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {detail.doctorNote && (
              <div style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--brand)', padding: '12px 14px', borderRadius: 6, marginBottom: 16 }}>
                <strong style={{ color: 'var(--brand-light)', fontSize: '0.85rem' }}>Catatan Nakes:</strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 4 }}>{detail.doctorNote}</p>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setDetail(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
