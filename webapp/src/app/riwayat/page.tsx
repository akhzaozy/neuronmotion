'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, Session, UserProfile } from '@/lib/api';
import { normalizeBiomarkers } from '@/lib/biomarkers';
import AppNav from '@/components/AppNav';
import ReportTemplate from '@/components/ReportTemplate';
import ReportPrintHost from '@/components/ReportPrintHost';
import LoadFailure from '@/components/LoadFailure';
import LoadingScreen from '@/components/LoadingScreen';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Download,
  FileSpreadsheet,
  Share2,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  History,
  User,
  Layers,
} from 'lucide-react';
import { useI18n, translateServerLabel, dateLocale, type Lang } from '@/lib/i18n';
import styles from './riwayat.module.css';

/**
 * Warna tingkat pengukuran, dipakai untuk titik grafik dan pita latarnya.
 * Ia tidak pernah berdiri sendiri: setiap tempat yang memakainya juga membawa
 * label teks penuh lewat kelas .level.
 */
const RISK_FILL: Record<string, string> = {
  HIGH: 'var(--level-high)',
  MEDIUM: 'var(--level-mid)',
  LOW: 'var(--level-low)',
};

const RISK_LABEL: Record<Lang, Record<string, string>> = {
  id: { HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' },
  en: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
};

function riskLabel(category: string, lang: Lang) {
  return RISK_LABEL[lang][category] || category;
}

/**
 * Kelas tingkat dari kategori risiko.
 *
 * Warna tidak pernah jadi penanda tunggal: kelas .level membawa label teks,
 * bobot garis kiri yang berbeda per tingkat, dan warna sekaligus.
 */
function levelClass(category: string) {
  return category === 'HIGH' ? 'level level--high'
    : category === 'MEDIUM' ? 'level level--mid'
    : 'level level--low';
}

function formatDate(ts: string, lang: Lang = 'id') {
  return new Date(ts).toLocaleDateString(dateLocale(lang), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Grafik garis tren skor dengan pita tingkat rendah, sedang, dan tinggi. */
function TrendChart({ sessions }: { sessions: Session[] }) {
  const { t, lang } = useI18n();
  const w = 720, h = 240, padL = 44, padR = 12, padT = 12, padB = 34;
  const points = [...sessions].reverse(); // urut lama → baru
  if (points.length < 2) {
    return <p className={styles.note}>{t('hist.needTwo')}</p>;
  }

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const yFor = (score: number) => padT + (1 - score / 100) * plotH;
  const xFor = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.compositeScore)}`).join(' ');

  // Pita: 0-35 rendah, 35-65 sedang, 65-100 tinggi
  const bandLow = { y: yFor(35), height: yFor(0) - yFor(35) };
  const bandMed = { y: yFor(65), height: yFor(35) - yFor(65) };
  const bandHigh = { y: yFor(100), height: yFor(65) - yFor(100) };

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={260} style={{ display: 'block', minWidth: 560 }}>
        <rect x={padL} y={bandLow.y} width={plotW} height={bandLow.height} fill="var(--level-low)" opacity="0.09" />
        <rect x={padL} y={bandMed.y} width={plotW} height={bandMed.height} fill="var(--level-mid)" opacity="0.09" />
        <rect x={padL} y={bandHigh.y} width={plotW} height={bandHigh.height} fill="var(--level-high)" opacity="0.09" />

        {[0, 35, 65, 100].map(v => (
          <g key={v}>
            <line x1={padL} y1={yFor(v)} x2={w - padR} y2={yFor(v)} stroke="var(--rule-hair)" strokeWidth="1" />
            <text x={padL - 10} y={yFor(v) + 5} textAnchor="end" fontSize="14" fill="var(--ink-muted)">{v}</text>
          </g>
        ))}

        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={xFor(i)} cy={yFor(p.compositeScore)} r="4.5" fill={RISK_FILL[p.riskCategory] || 'var(--ink)'} stroke="var(--sheet)" strokeWidth="2" />
            <title>{`${t('hist.session')} #${p.id} - ${t('risk.score')} ${Math.round(p.compositeScore)} (${riskLabel(p.riskCategory, lang)})`}</title>
          </g>
        ))}

        {points.map((p, i) => (
          (i === 0 || i === points.length - 1 || points.length <= 6) ? (
            <text key={`x-${p.id}`} x={xFor(i)} y={h - 10} textAnchor="middle" fontSize="14" fill="var(--ink-muted)">
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
  /* Dibaca lewat penormal, bukan dari rawBiomarkers langsung. Sebelumnya baris
     simetri, sway, ROM, dan asimetri lengan di sini membaca nama field yang
     hanya ditulis analisator live, sehingga keempatnya kosong untuk seluruh
     pasien yang datanya berasal dari seed. Lihat lib/biomarkers.ts. */
  const ra = normalizeBiomarkers(a), rb = normalizeBiomarkers(b);
  return [
    { label: t('bio.tremorShort'), unit: 'Hz', from: ra.tremorHz ?? undefined, to: rb.tremorHz ?? undefined, higherIsWorse: true },
    { label: t('bio.fingerTapping'), unit: t('unit.tapsPerSec'), from: ra.tapRate ?? undefined, to: rb.tapRate ?? undefined, higherIsWorse: false },
    { label: t('bio.gaitSymmetry'), unit: '%', from: ra.symmetryPercent ?? undefined, to: rb.symmetryPercent ?? undefined, higherIsWorse: false },
    { label: t('bio.armAsymmetry'), unit: '%', from: ra.armAsymmetryPercent ?? undefined, to: rb.armAsymmetryPercent ?? undefined, higherIsWorse: true },
    { label: t('bio.swayArea'), unit: 'cm²', from: ra.swayAreaCm2 ?? undefined, to: rb.swayAreaCm2 ?? undefined, higherIsWorse: true },
    { label: t('bio.kneeRom'), unit: '°', from: ra.romDeg ?? undefined, to: rb.romDeg ?? undefined, higherIsWorse: false },
  ];
}

/** Satu baris biomarker pada detail sesi: label di kiri, angka rata kanan. */
function BiomarkerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.biomarkerItem}>
      <dt className={`label ${styles.biomarkerLabel}`}>{label}</dt>
      <dd className={styles.biomarkerValue}>{children}</dd>
    </div>
  );
}

export default function RiwayatPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [detail, setDetail] = useState<Session | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  // Lihat catatan yang sama di beranda pasien: riwayat yang gagal diambil
  // tidak boleh tampil sebagai riwayat yang memang kosong.
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (user) setProfile(user);
  }, [user]);

  useEffect(() => {
    if (!token) return;
    api.getMe(token).then(p => {
      if (p) {
        setProfile(p);
        localStorage.setItem('gs_user', JSON.stringify(p));
      }
    }).catch(() => {});
  }, [token]);

  const activeUser = profile || user;

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'PATIENT') { router.push('/login'); return; }

    let alive = true;

    // Kode berbagi dibuatkan saat pertama diminta, jadi pemanggilannya
    // sekaligus menjadi penyiapan untuk pasien yang belum pernah punya.
    api.getShareCode(user.id, token!)
      .then(res => { if (alive) setShareCode(res.shareCode); })
      .catch(() => { if (alive) setShareCode(null); });

    api.getHistory(user.id, token!)
      .then(res => {
        if (!alive) return;
        const list = res.sessions || [];
        setSessions(list);
        if (list.length >= 2) {
          setCompareA(list[list.length - 1].id);
          setCompareB(list[0].id);
        }
      })
      .catch(e => {
        if (!alive) return;
        console.error(e);
        setFailed(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [user, token, isLoading, router, attempt]);

  const sessionA = useMemo(() => sessions.find(s => s.id === compareA) || null, [sessions, compareA]);
  const sessionB = useMemo(() => sessions.find(s => s.id === compareB) || null, [sessions, compareB]);

  const copyShareCode = async () => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Penyalinan otomatis bisa ditolak peramban
    }
  };

  const resetShareCode = async () => {
    if (!user || !window.confirm(t('share.confirmReset'))) return;
    try {
      const res = await api.resetShareCode(user.id, token!);
      setShareCode(res.shareCode);
    } catch {
      // Kode lama tetap berlaku bila penggantian gagal
    }
  };

  const exportCSV = async () => {
    if (isExportingCsv || sessions.length === 0) return;
    try {
      setIsExportingCsv(true);
      await new Promise(r => setTimeout(r, 750));

      // Seluruh kolom diikutsertakan agar berkas dapat langsung diolah ulang
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
          const nb = normalizeBiomarkers(s);
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
            num(nb.symmetryPercent),
            num(nb.cadence),
            num(nb.armAsymmetryPercent),
            num(nb.swayAreaCm2),
            num(nb.romDeg),
            (s.aiAnalysis?.ringkasan || '').replace(/\n/g, ' '),
            s.aiAnalysis?.tingkatKeyakinan || '',
            (s.aiAnalysis?.saranTindakLanjut || []).join(' | ').replace(/\n/g, ' '),
            (s.recommendations || []).join(' | ').replace(/\n/g, ' '),
            (s.doctorNote || '').replace(/\n/g, ' '),
          ];
        }),
      ];
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (activeUser?.name || 'pasien')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      a.download = `${cleanName || 'pasien'}-riwayat-${day}-${month}-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengekspor CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet">
          <LoadingScreen
            title={t('hist.loading')}
            subtitle="Memuat riwayat sesi pemeriksaan dan data komparasi biomarker..."
          />
        </main>
      </div>
    );
  }

  // Halaman berhenti sebelum kop dokumen dan kode berbagi, sebab keduanya
  // menyiratkan bahwa isi berkas di bawahnya sudah lengkap.
  if (failed) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet" id="main">
          <div className={styles.pad}>
            <header className="docHead">
              <div className="docHead__meta">
                <span>{t('hist.title')}</span>
                <span data-no-translate="">{user?.name}</span>
              </div>
              <h1>{t('hist.title')}</h1>
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

  return (
    <div className={styles.page}>
      <AppNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <div className={styles.metaPillGroup}>
                <span className={styles.metaChip}>
                  <History size={13} aria-hidden="true" />
                  {t('hist.title')}
                </span>
                <span className={styles.metaChip} data-no-translate="">
                  <User size={13} aria-hidden="true" />
                  {user?.name}
                </span>
                <span className={styles.metaChip}>
                  <Layers size={13} aria-hidden="true" />
                  {sessions.length} {t('prof.sessions')}
                </span>
              </div>
              <h1>{t('hist.title')}</h1>
              <p className={styles.lead}>{t('hist.subtitle')}</p>
            </div>
            {sessions.length > 0 && (
              <div className={styles.exportRow}>
                <button
                  type="button"
                  className={`btn btn--primary ${styles.btnExport}`}
                  onClick={() => setPrinting(true)}
                >
                  <Download size={16} aria-hidden="true" />
                  {t('hist.downloadPdf')}
                </button>
                <button
                  type="button"
                  className={`btn ${styles.btnExport}`}
                  onClick={exportCSV}
                >
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  {t('hist.exportCsv')}
                </button>
              </div>
            )}
          </header>

          {/* Kartu Bagikan ke Tenaga Kesehatan */}
          <section className={styles.shareCard}>
            <div className={styles.shareCardHead}>
              <div className={styles.shareIconBadge} aria-hidden="true">
                <Share2 size={22} strokeWidth={2} />
              </div>
              <div>
                <h2 className={styles.shareCardTitle}>{t('share.title')}</h2>
                <p className={styles.shareCardDesc}>{t('share.desc')}</p>
              </div>
            </div>

            <div className={styles.shareCardBody}>
              <div className={styles.shareCodeWrap}>
                <span className={styles.shareCodeLabel}>Kode Akses Dokter</span>
                <code className={styles.shareCode} data-no-translate="">
                  {shareCode || '········'}
                </code>
              </div>
              <div className={styles.shareActions}>
                <button
                  type="button"
                  className={`btn ${codeCopied ? styles.btnCopied : ''}`}
                  onClick={copyShareCode}
                  disabled={!shareCode}
                >
                  {codeCopied ? (
                    <Check size={16} className={styles.checkIcon} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  {codeCopied ? t('share.copied') : t('share.copy')}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={resetShareCode}
                  disabled={!shareCode}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  {t('share.reset')}
                </button>
              </div>
            </div>

            <div className={styles.shareFooter}>
              <ShieldCheck size={16} className={styles.shieldIcon} aria-hidden="true" />
              <span>{shareCode ? t('share.resetHint') : t('share.loading')}</span>
            </div>
          </section>

          {sessions.length === 0 ? (
            <section className={styles.section}>
              <div className={styles.emptyState}>
                <p>{t('hist.noHistory')}</p>
                <div className={styles.exportRow}>
                  <Link href="/screening" className="btn btn--primary">{t('hist.startFirst')}</Link>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{t('hist.trendTitle')}</h2>
                </div>
                <TrendChart sessions={sessions} />
              </section>

              {sessions.length >= 2 && (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>{t('hist.compareTitle')}</h2>
                  </div>
                  <div className={styles.compareRow}>
                    <select
                      className={styles.compareSelect}
                      aria-label={lang === 'en' ? 'First session to compare' : 'Sesi pertama yang dibandingkan'}
                      value={compareA ?? ''}
                      onChange={e => setCompareA(Number(e.target.value))}
                    >
                      {sessions.map(s => <option key={s.id} value={s.id} data-no-translate="">#{s.id} · {formatDate(s.timestamp, lang)}</option>)}
                    </select>
                    <span className={styles.compareVs}>vs</span>
                    <select
                      className={styles.compareSelect}
                      aria-label={lang === 'en' ? 'Second session to compare' : 'Sesi kedua yang dibandingkan'}
                      value={compareB ?? ''}
                      onChange={e => setCompareB(Number(e.target.value))}
                    >
                      {sessions.map(s => <option key={s.id} value={s.id} data-no-translate="">#{s.id} · {formatDate(s.timestamp, lang)}</option>)}
                    </select>
                  </div>

                  {sessionA && sessionB && (
                    <div className={styles.deltaList}>
                      <div className={styles.deltaItem}>
                        <span className={styles.deltaLabel}>{t('hist.compositeScore')}</span>
                        <span className={styles.deltaValue}>
                          {Math.round(sessionA.compositeScore)} → {Math.round(sessionB.compositeScore)}{' '}
                          {/* Arah perubahan dibawa kata penuh dan bobot huruf,
                              bukan panah berwarna. */}
                          <span className={
                            sessionB.compositeScore > sessionA.compositeScore ? styles.deltaWorse
                              : sessionB.compositeScore < sessionA.compositeScore ? styles.deltaBetter
                                : styles.deltaSame
                          }>
                            {sessionB.compositeScore > sessionA.compositeScore ? t('hist.worsening')
                              : sessionB.compositeScore < sessionA.compositeScore ? t('hist.improving') : t('hist.stable')}
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
                              <span className={worse ? styles.deltaWorse : better ? styles.deltaBetter : styles.deltaSame}>
                                {worse ? t('hist.worsening') : better ? t('hist.improving') : t('hist.stable')}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{t('hist.allSessions')} ({sessions.length})</h2>
                </div>
                <div className={styles.tableScroll}>
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th scope="col">{t('hist.date')}</th>
                        <th scope="col" className="num">{t('risk.score')}</th>
                        <th scope="col">{t('hist.category')}</th>
                        <th scope="col">{t('hist.aiAnalysis')}</th>
                        <th scope="col">{t('hist.doctorNote')}</th>
                        <th scope="col"><span className="srOnly">{t('hist.detail')}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id}>
                          <td>
                            <time dateTime={String(s.timestamp)}>{formatDate(s.timestamp, lang)}</time>
                          </td>
                          <td className="num"><strong>{Math.round(s.compositeScore)}</strong></td>
                          <td>
                            <span className={levelClass(s.riskCategory)}>
                              {riskLabel(s.riskCategory, lang)}
                            </span>
                          </td>
                          <td>
                            {s.aiAnalysis?.available
                              ? t('hist.available')
                              : <span className={styles.muted}>{t('hist.none')}</span>}
                          </td>
                          <td className={styles.noteCell}>
                            {s.doctorNote
                              ? <span data-no-translate="">{s.doctorNote}</span>
                              : <span className={styles.muted}>{t('hist.noDoctorNote')}</span>}
                          </td>
                          <td>
                            <button className="btn" onClick={() => setDetail(s)}>{t('hist.detail')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Panel detail memakai Radix Dialog, bukan div dengan klik di luar.
          Bentuk lamanya tidak punya role dialog, tidak menjebak fokus, dan
          tidak menanggapi Escape, sehingga menekan Tab dari dalamnya justru
          berjalan ke halaman di belakangnya. */}
      <Dialog.Root open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialogScrim" />
          <Dialog.Content className="dialogSheet">
            {detail && (
              <>
                <Dialog.Title className={styles.detailTitle}>
                  {t('hist.sessionDetail')} #{detail.id}
                </Dialog.Title>
                <Dialog.Description className={styles.detailDate}>
                  <time dateTime={String(detail.timestamp)}>{formatDate(detail.timestamp, lang)}</time>
                </Dialog.Description>

                <div className={styles.detailScore}>
                  <span className={styles.detailScoreValue}>{Math.round(detail.compositeScore)}</span>
                  <span className={levelClass(detail.riskCategory)}>
                    {t('dash.riskPrefix')} {riskLabel(detail.riskCategory, lang)}
                  </span>
                </div>

                {detail.mlPrediction?.predictedLabel && (
                  <p className={styles.detailPattern}>
                    {t('hist.closestPattern')}: <strong>{translateServerLabel(detail.mlPrediction.predictedLabel, lang)}</strong>
                    {detail.mlPrediction.confidence !== undefined && ` (${detail.mlPrediction.confidence}%)`}
                  </p>
                )}

                {/* Dibaca lewat penormal. Empat dari enam baris di bawah ini
                    sebelumnya tidak pernah muncul untuk pasien seed, karena
                    keduanya menyebut nama field yang hanya ditulis analisator
                    live. Lihat lib/biomarkers.ts. */}
                <dl className={styles.biomarkerList}>
                  {(() => {
                    const nb = normalizeBiomarkers(detail);
                    const rows: [string, string, number | null][] = [
                      [t('bio.tremorShort'), 'Hz', nb.tremorHz],
                      [t('bio.fingerTapping'), t('unit.perSec'), nb.tapRate],
                      [t('bio.gaitSymmetry'), '%', nb.symmetryPercent],
                      [t('bio.armAsymmetry'), '%', nb.armAsymmetryPercent],
                      [t('bio.swayArea'), 'cm²', nb.swayAreaCm2],
                      [t('bio.kneeRom'), '°', nb.romDeg],
                    ];
                    return rows.map(([label, unit, value]) =>
                      value === null ? null : (
                        <BiomarkerRow key={label} label={label}>
                          {value.toFixed(2)} {unit}
                        </BiomarkerRow>
                      ),
                    );
                  })()}
                </dl>

                {/* Analisis AI yang tersimpan dari sesi ini, supaya rekomendasinya
                    masih bisa dibaca ulang kapan saja, bukan hanya sekali saat selesai tes */}
                {detail.aiAnalysis?.available && (
                  <div className={`field ${styles.aiBox}`}>
                    <div className={styles.aiHeader}>
                      <span className={styles.aiTitle}>{t('hist.aiCombined')}</span>
                      {detail.aiAnalysis.tingkatKeyakinan && (
                        <span className={styles.aiConfidence}>{t('hist.confidence')}: {detail.aiAnalysis.tingkatKeyakinan}</span>
                      )}
                    </div>

                    {detail.aiAnalysis.ringkasan && (
                      <p className={styles.aiSummary}>{detail.aiAnalysis.ringkasan}</p>
                    )}

                    {detail.aiAnalysis.korelasiGejala && detail.aiAnalysis.korelasiGejala.length > 0 && (
                      <div className={styles.aiGroup}>
                        <h4 className={styles.aiSubTitle}>{t('hist.symptomLink')}</h4>
                        {detail.aiAnalysis.korelasiGejala.map((k, i) => (
                          <div
                            key={i}
                            className={`${styles.correlationItem} ${k.konsisten ? styles.corrOk : styles.corrWarn}`}
                          >
                            <div className={styles.correlationSymptom}>{k.gejala}</div>
                            <div className={styles.correlationFinding}>{k.temuanPengukuran}</div>
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
                      <p className={styles.urgentNote}>{t('hist.urgentNote')}</p>
                    )}
                  </div>
                )}

                {detail.recommendations && detail.recommendations.length > 0 && (
                  <div className={styles.aiGroup}>
                    <h3 className={styles.aiSubTitle}>{t('hist.systemRec')}</h3>
                    <ul className={styles.aiList}>
                      {detail.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {detail.doctorNote && (
                  <div className={`field ${styles.doctorNoteBox}`}>
                    <strong className={`label ${styles.doctorNoteLabel}`}>{t('hist.doctorNote')}</strong>
                    <p className={styles.doctorNoteText} data-no-translate="">{detail.doctorNote}</p>
                  </div>
                )}

                <Dialog.Close asChild>
                  <button className={`btn btn--primary btn--lg btn--block ${styles.dialogClose}`}>
                    {t('common.close')}
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Laporan cetak memakai template khusus, bukan menyalin tampilan halaman */}
      <ReportPrintHost
        open={printing}
        onClose={() => setPrinting(false)}
        patientName={activeUser?.name}
      >
        <ReportTemplate
          patient={{
            name: activeUser?.name,
            email: activeUser?.email,
            gender: activeUser?.gender,
            dateOfBirth: activeUser?.dateOfBirth,
            region: activeUser?.region,
            city: activeUser?.city,
            state: activeUser?.state,
            country: activeUser?.country,
            countryName: activeUser?.countryName,
          }}
          sessions={sessions}
        />
      </ReportPrintHost>

      {/* Modal Animasi Ekspor CSV */}
      {isExportingCsv && (
        <div className={styles.exportOverlay} role="status" aria-live="polite">
          <div className={styles.exportCard}>
            <div className={styles.exportIconArea}>
              <div className={styles.exportSpinner} />
              <FileSpreadsheet size={32} className={styles.exportIcon} />
            </div>
            <div>
              <h3 className={styles.exportTitle}>Menyiapkan Berkas CSV...</h3>
              <p className={styles.exportSubtitle}>
                Menyusun seluruh data riwayat sesi dan biomarker ke format spreadsheet...
              </p>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressShimmer} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
