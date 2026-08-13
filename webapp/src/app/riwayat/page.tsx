'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, Session } from '@/lib/api';
import AppNav from '@/components/AppNav';
import ReportTemplate from '@/components/ReportTemplate';
import ReportPrintHost from '@/components/ReportPrintHost';
import { useI18n, translateServerLabel, dateLocale, type Lang } from '@/lib/i18n';
import styles from './riwayat.module.css';

const RISK_COLOR: Record<string, string> = {
  HIGH: 'var(--red)',
  MEDIUM: 'var(--yellow)',
  LOW: 'var(--green)',
};

const RISK_LABEL: Record<Lang, Record<string, string>> = {
  id: { HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' },
  en: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
};

function riskLabel(category: string, lang: Lang) {
  return RISK_LABEL[lang][category] || category;
}

function formatDate(ts: string, lang: Lang = 'id') {
  return new Date(ts).toLocaleDateString(dateLocale(lang), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Grafik garis tren skor dengan pita warna hijau/kuning/merah sebagai latar. */
function TrendChart({ sessions }: { sessions: Session[] }) {
  const { t, lang } = useI18n();
  const w = 720, h = 220, padL = 38, padR = 12, padT = 12, padB = 28;
  const points = [...sessions].reverse(); // urut lama → baru
  if (points.length < 2) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{t('hist.needTwo')}</p>;
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
            <title>{`${t('hist.session')} #${p.id} - ${t('risk.score')} ${Math.round(p.compositeScore)} (${riskLabel(p.riskCategory, lang)})`}</title>
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

function getBiomarkerDeltas(a: Session, b: Session, t: (k: string) => string): BiomarkerDelta[] {
  const ra = a.rawBiomarkers, rb = b.rawBiomarkers;
  return [
    { label: t('bio.tremorShort'), unit: 'Hz', from: ra?.tremor?.dominantFrequencyHz, to: rb?.tremor?.dominantFrequencyHz, higherIsWorse: true },
    { label: t('bio.fingerTapping'), unit: t('unit.tapsPerSec'), from: ra?.fingerTapping?.tapRatePerSecond, to: rb?.fingerTapping?.tapRatePerSecond, higherIsWorse: false },
    { label: t('bio.gaitSymmetry'), unit: '%', from: ra?.gait?.symmetryPercent, to: rb?.gait?.symmetryPercent, higherIsWorse: false },
    { label: t('bio.armAsymmetry'), unit: '%', from: ra?.armSwing?.asymmetryPercent, to: rb?.armSwing?.asymmetryPercent, higherIsWorse: true },
    { label: t('bio.swayArea'), unit: 'cm²', from: ra?.posturalStability?.swayAreaCm2, to: rb?.posturalStability?.swayAreaCm2, higherIsWorse: true },
    { label: t('bio.kneeRom'), unit: '°', from: ra?.rom?.romDeg, to: rb?.rom?.romDeg, higherIsWorse: false },
  ];
}

export default function RiwayatPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const { t, lang } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);
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
    // Seluruh kolom diikutsertakan agar berkas dapat langsung diolah ulang,
    // tidak sekadar menampilkan ringkasan seperti versi sebelumnya.
    const num = (v: unknown) => (v === undefined || v === null ? '' : String(v));
    const header = lang === 'en'
      ? [
        'Session ID', 'Date', 'Composite Score', 'Risk Category',
        'Questionnaire Symptom Score', 'Closest Pattern (ML)', 'ML Confidence (%)',
        'Tremor Frequency (Hz)', 'Tremor Amplitude (mm)',
        'Finger Tapping (taps/sec)', 'Tapping Decrement (%)',
        'Step Symmetry (%)', 'Cadence (steps/min)',
        'Arm Swing Asymmetry (%)', 'Sway Area (cm2)', 'Knee ROM (degrees)',
        'AI Summary', 'AI Confidence', 'AI Suggestions', 'System Recommendations', 'Clinician Note',
      ]
      : [
        'ID Sesi', 'Tanggal', 'Skor Komposit', 'Kategori Risiko',
        'Skor Gejala Kuesioner', 'Pola Terdekat (ML)', 'Keyakinan ML (%)',
        'Tremor Frekuensi (Hz)', 'Tremor Amplitudo (mm)',
        'Finger Tapping (ketuk/detik)', 'Dekremen Tapping (%)',
        'Simetri Langkah (%)', 'Kadense (langkah/menit)',
        'Asimetri Ayunan Lengan (%)', 'Sway Area (cm2)', 'ROM Lutut (derajat)',
        'Ringkasan AI', 'Keyakinan AI', 'Saran AI', 'Rekomendasi Sistem', 'Catatan Nakes',
      ];
    const rows = [
      header,
      ...sessions.map(s => {
        const b = s.rawBiomarkers || {};
        const t = (s.tremorResult || {}) as Record<string, unknown>;
        return [
          String(s.id),
          formatDate(s.timestamp, lang),
          String(Math.round(s.compositeScore)),
          riskLabel(s.riskCategory, lang),
          num(s.questionnaireScore !== null && s.questionnaireScore !== undefined ? Math.round(s.questionnaireScore) : ''),
          translateServerLabel(s.mlPrediction?.predictedLabel, lang),
          num(s.mlPrediction?.confidence),
          num(b.tremor?.dominantFrequencyHz),
          num(t.amplitudeMillimeter),
          num(b.fingerTapping?.tapRatePerSecond),
          num((s.fingerTappingResult as Record<string, unknown> | undefined)?.decrementPercent),
          num(b.gait?.symmetryPercent),
          num(b.gait?.cadencePerMin),
          num(b.armSwing?.asymmetryPercent),
          num(b.posturalStability?.swayAreaCm2),
          num(b.rom?.romDeg),
          (s.aiAnalysis?.ringkasan || '').replace(/\n/g, ' '),
          s.aiAnalysis?.tingkatKeyakinan || '',
          (s.aiAnalysis?.saranTindakLanjut || []).join(' | ').replace(/\n/g, ' '),
          (s.recommendations || []).join(' | ').replace(/\n/g, ' '),
          (s.doctorNote || '').replace(/\n/g, ' '),
        ];
      }),
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
        <div className={styles.container}><p>{t('hist.loading')}</p></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>{t('hist.title')}</h1>
            <p>{t('hist.subtitle')}</p>
          </div>
          {sessions.length > 0 && (
            <div className={styles.exportRow}>
              <button className="btn btn-outline btn-sm" onClick={() => setPrinting(true)}>{t('hist.downloadPdf')}</button>
              <button className="btn btn-outline btn-sm" onClick={exportCSV}>{t('hist.exportCsv')}</button>
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.emptyState}>
              <div style={{ fontSize: '2.6rem', marginBottom: 12, opacity: 0.6 }}>📋</div>
              <p style={{ marginBottom: 16 }}>{t('hist.noHistory')}</p>
              <Link href="/screening" className="btn btn-primary">{t('hist.startFirst')}</Link>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>{t('hist.trendTitle')}</h2>
              <TrendChart sessions={sessions} />
            </div>

            {sessions.length >= 2 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>{t('hist.compareTitle')}</h2>
                <div className={styles.compareRow}>
                  <select className={styles.compareSelect} value={compareA ?? ''} onChange={e => setCompareA(Number(e.target.value))}>
                    {sessions.map(s => <option key={s.id} value={s.id} data-no-translate="">#{s.id} · {formatDate(s.timestamp, lang)}</option>)}
                  </select>
                  <span style={{ color: 'var(--text-muted)' }}>vs</span>
                  <select className={styles.compareSelect} value={compareB ?? ''} onChange={e => setCompareB(Number(e.target.value))}>
                    {sessions.map(s => <option key={s.id} value={s.id} data-no-translate="">#{s.id} · {formatDate(s.timestamp, lang)}</option>)}
                  </select>
                </div>

                {sessionA && sessionB && (
                  <div className={styles.deltaList}>
                    <div className={styles.deltaItem}>
                      <span className={styles.deltaLabel}>{t('hist.compositeScore')}</span>
                      <span className={styles.deltaValue}>
                        {Math.round(sessionA.compositeScore)} → {Math.round(sessionB.compositeScore)}{' '}
                        <span style={{ color: sessionB.compositeScore > sessionA.compositeScore ? 'var(--red)' : sessionB.compositeScore < sessionA.compositeScore ? 'var(--green)' : 'var(--text-muted)' }}>
                          {sessionB.compositeScore > sessionA.compositeScore ? `↑ ${t('hist.worsening')}`
                            : sessionB.compositeScore < sessionA.compositeScore ? `↓ ${t('hist.improving')}` : `→ ${t('hist.stable')}`}
                        </span>
                      </span>
                    </div>
                    {getBiomarkerDeltas(sessionA, sessionB, t).map(d => {
                      if (d.from === undefined || d.to === undefined) return null;
                      const worse = d.higherIsWorse ? d.to > d.from : d.to < d.from;
                      const better = d.higherIsWorse ? d.to < d.from : d.to > d.from;
                      return (
                        <div key={d.label} className={styles.deltaItem}>
                          <span className={styles.deltaLabel}>{d.label}</span>
                          <span className={styles.deltaValue}>
                            {d.from} → {d.to} {d.unit}{' '}
                            <span style={{ color: worse ? 'var(--red)' : better ? 'var(--green)' : 'var(--text-muted)' }}>
                              {worse ? `↑ ${t('hist.worsening')}` : better ? `↓ ${t('hist.improving')}` : `→ ${t('hist.stable')}`}
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
              <h2 className={styles.cardTitle}>{t('hist.allSessions')} ({sessions.length})</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t('hist.date')}</th>
                      <th>{t('risk.score')}</th>
                      <th>{t('hist.category')}</th>
                      <th>{t('hist.aiAnalysis')}</th>
                      <th>{t('hist.doctorNote')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td>{formatDate(s.timestamp, lang)}</td>
                        <td style={{ fontWeight: 700, color: RISK_COLOR[s.riskCategory] }}>{Math.round(s.compositeScore)}</td>
                        <td>
                          <span className={styles.riskPill} style={{ background: `color-mix(in srgb, ${RISK_COLOR[s.riskCategory]} 15%, transparent)`, color: RISK_COLOR[s.riskCategory] }}>
                            {riskLabel(s.riskCategory, lang)}
                          </span>
                        </td>
                        <td>
                          {s.aiAnalysis?.available
                            ? <span className={styles.aiPill}>✨ {t('hist.available')}</span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t('hist.none')}</span>}
                        </td>
                        <td className={styles.noteCell}>
                          {s.doctorNote
                            ? <span data-no-translate="">{s.doctorNote}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>{t('hist.noDoctorNote')}</span>}
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => setDetail(s)}>{t('hist.detail')}</button>
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
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{t('hist.sessionDetail')} #{detail.id}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>{formatDate(detail.timestamp, lang)}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: RISK_COLOR[detail.riskCategory] }}>
                {Math.round(detail.compositeScore)}
              </span>
              <span className={styles.riskPill} style={{ background: `color-mix(in srgb, ${RISK_COLOR[detail.riskCategory]} 15%, transparent)`, color: RISK_COLOR[detail.riskCategory] }}>
                {t('dash.riskPrefix')} {riskLabel(detail.riskCategory, lang)}
              </span>
            </div>

            {detail.mlPrediction?.predictedLabel && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                {t('hist.closestPattern')}: <strong style={{ color: 'var(--purple)' }}>{translateServerLabel(detail.mlPrediction.predictedLabel, lang)}</strong>
                {detail.mlPrediction.confidence !== undefined && ` (${detail.mlPrediction.confidence}%)`}
              </p>
            )}

            <div className={styles.biomarkerGrid}>
              {detail.rawBiomarkers?.tremor?.dominantFrequencyHz !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.tremorShort')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.tremor.dominantFrequencyHz} Hz</div>
                </div>
              )}
              {detail.rawBiomarkers?.fingerTapping?.tapRatePerSecond !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.fingerTapping')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.fingerTapping.tapRatePerSecond} {t('unit.perSec')}</div>
                </div>
              )}
              {detail.rawBiomarkers?.gait?.symmetryPercent !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.gaitSymmetry')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.gait.symmetryPercent}%</div>
                </div>
              )}
              {detail.rawBiomarkers?.armSwing?.asymmetryPercent !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.armAsymmetry')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.armSwing.asymmetryPercent}%</div>
                </div>
              )}
              {detail.rawBiomarkers?.posturalStability?.swayAreaCm2 !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.swayArea')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.posturalStability.swayAreaCm2} cm²</div>
                </div>
              )}
              {detail.rawBiomarkers?.rom?.romDeg !== undefined && (
                <div className={styles.biomarkerItem}>
                  <div className={styles.biomarkerLabel}>{t('bio.kneeRom')}</div>
                  <div className={styles.biomarkerValue}>{detail.rawBiomarkers.rom.romDeg}°</div>
                </div>
              )}
            </div>

            {/* Analisis AI yang tersimpan dari sesi ini, supaya rekomendasinya
                masih bisa dibaca ulang kapan saja, bukan hanya sekali saat selesai tes */}
            {detail.aiAnalysis?.available && (
              <div className={styles.aiBox}>
                <div className={styles.aiHeader}>
                  <span className={styles.aiTitle}>✨ {t('hist.aiCombined')}</span>
                  {detail.aiAnalysis.tingkatKeyakinan && (
                    <span className={styles.aiConfidence}>{t('hist.confidence')}: {detail.aiAnalysis.tingkatKeyakinan}</span>
                  )}
                </div>

                {detail.aiAnalysis.ringkasan && (
                  <p className={styles.aiSummary}>{detail.aiAnalysis.ringkasan}</p>
                )}

                {detail.aiAnalysis.korelasiGejala && detail.aiAnalysis.korelasiGejala.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <h4 className={styles.aiSubTitle}>{t('hist.symptomLink')}</h4>
                    {detail.aiAnalysis.korelasiGejala.map((k, i) => (
                      <div key={i} className={styles.correlationItem}>
                        <span className={k.konsisten ? styles.dotOk : styles.dotWarn} />
                        <div>
                          <div className={styles.correlationSymptom}>{k.gejala}</div>
                          <div className={styles.correlationFinding}>{k.temuanPengukuran}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detail.aiAnalysis.saranTindakLanjut && detail.aiAnalysis.saranTindakLanjut.length > 0 && (
                  <div>
                    <h4 className={styles.aiSubTitle}>{t('hist.followUp')}</h4>
                    <ul className={styles.aiList}>
                      {detail.aiAnalysis.saranTindakLanjut.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {detail.aiAnalysis.perluPerhatianSegera && (
                  <div className={styles.urgentNote}>
                    {t('hist.urgentNote')}
                  </div>
                )}
              </div>
            )}

            {detail.recommendations && detail.recommendations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 className={styles.aiSubTitle}>{t('hist.systemRec')}</h3>
                <ul className={styles.aiList}>
                  {detail.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {detail.doctorNote && (
              <div className={styles.doctorNoteBox}>
                <strong className={styles.doctorNoteLabel}>{t('hist.doctorNote')}</strong>
                <p className={styles.doctorNoteText} data-no-translate="">{detail.doctorNote}</p>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setDetail(null)}>{t('common.close')}</button>
          </div>
        </div>
      )}

      {/* Laporan cetak memakai template khusus, bukan menyalin tampilan halaman */}
      <div data-report-host="">
        <ReportPrintHost open={printing} onClose={() => setPrinting(false)}>
          <ReportTemplate
            patient={{
              name: user?.name,
              email: user?.email,
              gender: user?.gender,
              dateOfBirth: user?.dateOfBirth,
              city: user?.city,
              state: user?.state,
              countryName: user?.countryName,
            }}
            sessions={sessions}
          />
        </ReportPrintHost>
      </div>
    </div>
  );
}
