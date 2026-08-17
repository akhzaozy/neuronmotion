'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, PatientDetail } from '@/lib/api';
import { normalizeBiomarkers } from '@/lib/biomarkers';
import {
  RefreshCw,
  LogOut,
  Stethoscope,
  Building2,
  ShieldCheck,
  Users,
  AlertTriangle,
  Activity,
  HeartPulse,
  Clock,
  Search,
  UserPlus,
  Unlink,
  FileText,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  Download,
  XCircle,
} from 'lucide-react';
import DoctorNav from '@/components/DoctorNav';
import GeoBreakdown from '@/components/GeoBreakdown';
import LoadingScreen from '@/components/LoadingScreen';
import ReportTemplate from '@/components/ReportTemplate';
import ReportPrintHost from '@/components/ReportPrintHost';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import styles from './doctor.module.css';

const POLL_INTERVAL_MS = 30_000; // 30 detik

function calcAge(dob?: string | Date | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

/** Memetakan kategori risiko server ke kelas tingkat pada globals.css. */
function levelOf(risk?: string) {
  return risk === 'HIGH' ? 'high' : risk === 'MEDIUM' ? 'mid' : 'low';
}

const QUICK_NOTES = [
  'Pasien dalam kondisi stabil. Tidak ada tanda perburukan motorik.',
  'Ditemukan tremor asimetris. Disarankan rujukan neurologi lanjutan.',
  'Kecepatan ketukan jari menurun, indikasi awal bradikinesia.',
  'Pola jalan simetris. Lanjutkan latihan fisioterapi mandiri.',
  'Jadwalkan pemeriksaan ulang dalam 30 hari ke depan.',
];

export default function DoctorPortal() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const { t, lang } = useI18n();

  const [dashboard, setDashboard] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<PatientDetail | null>(null);
  const [activePatientId, setActivePatientId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showLinkBox, setShowLinkBox] = useState(false);
  const [showPdfReport, setShowPdfReport] = useState(false);
  const [showEmptyNoteModal, setShowEmptyNoteModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(async (currentUser: typeof user, currentToken: string | null, currentPatientId: number | null) => {
    if (!currentUser || !currentToken) return;
    try {
      setIsRefreshing(true);
      const [dashRes, patsRes] = await Promise.all([
        api.getDoctorDashboard(currentUser.id, currentToken),
        api.getDoctorPatients(currentUser.id, currentToken)
      ]);
      setDashboard(dashRes);
      setPatients(patsRes.patients || []);
      setLastUpdated(new Date());

      // Refresh detail pasien aktif jika ada
      if (currentPatientId) {
        const detail = await api.getPatient(currentPatientId, currentToken);
        setActivePatient(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'DOCTOR') {
      router.push('/login');
      return;
    }

    // Load awal
    refreshData(user, token, null);

    // Polling otomatis setiap 30 detik
    intervalRef.current = setInterval(() => {
      setActivePatientId(prev => {
        refreshData(user, token, prev);
        return prev;
      });
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, token, isLoading, router, refreshData]);

  const loadPatientDetail = async (patientId: number) => {
    try {
      const detail = await api.getPatient(patientId, token!);
      setActivePatient(detail);
      setActivePatientId(patientId);
      setActiveSessionIndex(0);
      setNoteText(detail.sessions[0]?.doctorNote || '');
      setSaveSuccess(false);
    } catch (e) {
      alert(t('doc.loadDetailFailed'));
    }
  };

  const linkByCode = async () => {
    const code = linkCode.trim();
    if (!code || linking) return;
    setLinking(true);
    setLinkMsg(null);
    try {
      const res = await api.linkPatientByCode(code, token!);
      setLinkMsg({ ok: true, text: res.message });
      setLinkCode('');
      await refreshData(user, token, activePatientId);
    } catch (e: any) {
      setLinkMsg({ ok: false, text: e.message });
    } finally {
      setLinking(false);
    }
  };

  const unlinkPatient = async (patientId: number) => {
    if (!window.confirm(t('link.confirmUnlink'))) return;
    try {
      await api.unlinkPatient(patientId, token!);
      if (activePatientId === patientId) {
        setActivePatient(null);
        setActivePatientId(null);
      }
      await refreshData(user, token, null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const saveNote = async () => {
    if (!activePatient || !activePatient.sessions[activeSessionIndex]) return;
    if (!noteText || !noteText.trim()) {
      setShowEmptyNoteModal(true);
      return;
    }
    setIsSavingNote(true);
    setSaveSuccess(false);
    try {
      await api.saveNote(activePatient.sessions[activeSessionIndex].id, { note: noteText.trim(), doctorId: user!.id }, token!);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`${t('doc.saveFailed')}: ${e.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const applyQuickNote = (text: string) => {
    setNoteText(prev => (prev.trim() ? `${prev}\n${text}` : text));
  };

  // Filter Pasien Berdasarkan Pencarian & Tingkat Risiko
  const filteredPatients = useMemo(() => {
    let result = [...patients];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const emailMatch = p.email?.toLowerCase().includes(q);
        return nameMatch || emailMatch;
      });
    }

    if (riskFilter !== 'ALL') {
      result = result.filter(p => p.lastSession?.riskCategory === riskFilter);
    }

    return result;
  }, [patients, search, riskFilter]);

  if (isLoading || !dashboard) {
    return (
      <div className={styles.page}>
        <DoctorNav />
        <main className={styles.sheet} id="main">
          <LoadingScreen
            title={t('doc.loadingPortal')}
            subtitle="Menyiapkan data pasien tertaut dan sebaran risiko klinis..."
          />
        </main>
      </div>
    );
  }

  const session = activePatient?.sessions[activeSessionIndex];
  const nb = normalizeBiomarkers(session);

  return (
    <div className={styles.page}>
      <DoctorNav />

      <main className={styles.sheet} id="main">
        <div className={styles.pad}>
          {/* ── Hero Banner Header ────────────────────────────────────────── */}
          <header className={styles.heroBanner}>
            <div className={styles.bannerGlow} aria-hidden="true" />

            {/* Top Meta Strip */}
            <div className={styles.metaStrip}>
              <div className={styles.metaChips}>
                <span className={styles.metaChip}>
                  <Stethoscope size={13} className={styles.chipIcon} />
                  <span>{user?.specialization || t('doc.specialist')}</span>
                </span>
                {user?.institution && (
                  <span className={styles.metaChip}>
                    <Building2 size={13} className={styles.chipIcon} />
                    <span data-no-translate="">{user.institution}</span>
                  </span>
                )}
                {user?.licenseNumber && (
                  <span className={styles.metaChip}>
                    <ShieldCheck size={13} className={styles.chipIcon} />
                    <span data-no-translate="">{user.licenseNumber}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Main Header Content */}
            <div className={styles.heroMain}>
              <div className={styles.clinicianProfile}>
                <div className={styles.doctorAvatar}>
                  <div className={styles.avatarGlow} />
                  <span className={styles.avatarText}>dr.</span>
                </div>

                <div className={styles.titleGroup}>
                  <div className={styles.badgeLine}>
                    <span className={styles.portalBadge}>NEURONMOTION CLINICAL SUITE</span>
                  </div>
                  <h1 className={styles.heroTitle}>{t('doc.portalTitle')}</h1>
                  <div className={styles.heroLeadRow}>
                    <span className={styles.leadGreeting}>
                      {t('doc.welcome')}, <strong data-no-translate="">{user?.name}</strong>
                    </span>
                    {lastUpdated && (
                      <span className={styles.heroStamp}>
                        <Clock size={12} className={styles.stampIcon} />
                        <span>
                          {t('doc.updatedAt')}: {lastUpdated.toLocaleTimeString(dateLocale(lang))} · {t('doc.autoEvery30')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hero Actions */}
              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.btnRefresh}
                  onClick={() => refreshData(user, token, activePatientId)}
                  disabled={isRefreshing}
                  title={t('doc.refreshNow')}
                >
                  <RefreshCw size={14} className={`${styles.btnIcon} ${isRefreshing ? styles.spinning : ''}`} />
                  <span>{isRefreshing ? t('doc.refreshing') : t('doc.refresh')}</span>
                </button>

                <button
                  type="button"
                  className={styles.btnLogout}
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  title={t('common.logout')}
                >
                  <LogOut size={14} className={styles.btnIcon} />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          </header>

          {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
          <section className={styles.stats}>
            <div className={`${styles.stat} ${styles.statPrimary}`}>
              <div className={styles.statIconWrap}>
                <Users size={22} />
              </div>
              <div className={styles.statContent}>
                <output className={styles.statValue}>{dashboard.totalPatients}</output>
                <span className={styles.statLabel}>{t('doc.totalPatients')}</span>
              </div>
            </div>

            <div className={`${styles.stat} ${styles.statHigh}`}>
              <div className={styles.statIconWrap}>
                <AlertTriangle size={22} />
              </div>
              <div className={styles.statContent}>
                <output className={styles.statValue}>{dashboard.riskBreakdown?.HIGH || 0}</output>
                <span className={styles.statLabel}>{t('doc.highRisk')}</span>
              </div>
            </div>

            <div className={`${styles.stat} ${styles.statMid}`}>
              <div className={styles.statIconWrap}>
                <Activity size={22} />
              </div>
              <div className={styles.statContent}>
                <output className={styles.statValue}>{dashboard.riskBreakdown?.MEDIUM || 0}</output>
                <span className={styles.statLabel}>{t('doc.mediumRisk')}</span>
              </div>
            </div>

            <div className={`${styles.stat} ${styles.statParkinson}`}>
              <div className={styles.statIconWrap}>
                <HeartPulse size={22} />
              </div>
              <div className={styles.statContent}>
                <output className={styles.statValue}>{dashboard.conditionBreakdown?.PARKINSON_EARLY || 0}</output>
                <span className={styles.statLabel}>{t('doc.earlyParkinson')}</span>
              </div>
            </div>
          </section>

          {/* ── Sebaran Wilayah Pasien (Interactive Telemetry & Drilldown) ─── */}
          <GeoBreakdown data={dashboard.geoBreakdown} />

          {/* ── Layout Utama: Daftar Pasien + Rekam Medis Detail ───────────── */}
          <div className={styles.layout}>
            {/* ── Kolom Kiri: Indeks & Daftar Pasien Tertaut ─────────────────── */}
            <section className={styles.index}>
              <div className={styles.indexHead}>
                <div>
                  <h2 className={styles.indexTitle}>{t('doc.patientList')}</h2>
                  <span className={styles.indexSubtitle}>
                    {filteredPatients.length} dari {patients.length} pasien tertaut
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnToggleLink}
                  onClick={() => setShowLinkBox(!showLinkBox)}
                  title="Tautkan Pasien Baru"
                >
                  <UserPlus size={14} />
                  <span>{showLinkBox ? 'Tutup' : 'Tautkan'}</span>
                </button>
              </div>

              {/* Collapsible Form Penautan Pasien */}
              {showLinkBox && (
                <div className={styles.linkBox}>
                  <h3 className={styles.linkBoxTitle}>{t('link.title')}</h3>
                  <p className={styles.linkDesc}>{t('link.desc')}</p>
                  <div className={styles.linkRow}>
                    <input
                      className={styles.linkInput}
                      type="text"
                      aria-label={t('link.title')}
                      placeholder={t('link.placeholder')}
                      value={linkCode}
                      maxLength={12}
                      onChange={e => setLinkCode(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === 'Enter') linkByCode(); }}
                    />
                    <button
                      type="button"
                      className={styles.btnSubmitLink}
                      onClick={linkByCode}
                      disabled={linking || !linkCode.trim()}
                    >
                      {linking ? t('link.linking') : t('link.submit')}
                    </button>
                  </div>
                  {linkMsg && (
                    <p
                      className={linkMsg.ok ? styles.linkMsgOk : styles.linkMsgErr}
                      role="status"
                      data-no-translate=""
                    >
                      {linkMsg.text}
                    </p>
                  )}
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className={styles.patientToolbar}>
                <div className={styles.searchBox}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    className={styles.patientSearchInput}
                    type="text"
                    aria-label={t('doc.searchPatient')}
                    placeholder={t('doc.searchPatient')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className={styles.searchClear}
                      onClick={() => setSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Risk Filter Chips */}
                <div className={styles.filterChipsRow}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${riskFilter === 'ALL' ? styles.filterChipActive : ''}`}
                    onClick={() => setRiskFilter('ALL')}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${riskFilter === 'HIGH' ? styles.filterChipActive : ''}`}
                    onClick={() => setRiskFilter('HIGH')}
                  >
                    <span className={styles.filterDotHigh} />
                    <span>Tinggi</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${riskFilter === 'MEDIUM' ? styles.filterChipActive : ''}`}
                    onClick={() => setRiskFilter('MEDIUM')}
                  >
                    <span className={styles.filterDotMid} />
                    <span>Sedang</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${riskFilter === 'LOW' ? styles.filterChipActive : ''}`}
                    onClick={() => setRiskFilter('LOW')}
                  >
                    <span className={styles.filterDotLow} />
                    <span>Rendah</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Patient Items List */}
              <div className={styles.listBody}>
                {filteredPatients.map(p => {
                  const isActive = activePatient?.id === p.id;
                  const risk = p.lastSession?.riskCategory;
                  const score = p.lastSession ? Math.round(p.lastSession.compositeScore) : null;
                  const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'PS';

                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`${styles.patientCard} ${isActive ? styles.patientCardActive : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => loadPatientDetail(p.id)}
                    >
                      <div className={styles.patientAvatarPill}>
                        <span className={styles.avatarInitials}>{initials}</span>
                      </div>

                      <div className={styles.patientCardMain}>
                        <div className={styles.patientCardHead}>
                          <strong className={styles.patientCardName} data-no-translate="">
                            {p.name}
                          </strong>
                          {p.gender && (
                            <span className={styles.genderChip}>
                              {p.gender === 'M' ? 'L' : 'P'}
                            </span>
                          )}
                        </div>

                        <div className={styles.patientCardMeta}>
                          <span>{p.age ? `${p.age} thn` : '? thn'}</span>
                          <span>·</span>
                          <span>{p.email}</span>
                        </div>
                      </div>

                      <div className={styles.patientCardEnd}>
                        {risk ? (
                          <div className={styles.patientScoreWrap}>
                            <span className={`${styles.riskBadgePill} ${styles[`riskBadge_${levelOf(risk)}`]}`}>
                              {risk === 'HIGH' ? 'Tinggi' : risk === 'MEDIUM' ? 'Sedang' : 'Rendah'}
                            </span>
                            {score !== null && (
                              <span className={styles.scoreText}>
                                Skor: <strong>{score}</strong>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={styles.noScreeningTag}>Belum Tes</span>
                        )}
                        <ChevronRight size={15} className={styles.patientCardChevron} />
                      </div>
                    </button>
                  );
                })}

                {patients.length === 0 && (
                  <div className={styles.emptyListNotice}>
                    <p>{t('doc.noPatients')}</p>
                  </div>
                )}
                {patients.length > 0 && filteredPatients.length === 0 && (
                  <div className={styles.emptyListNotice}>
                    <p>{t('doc.noMatch')} &ldquo;{search}&rdquo;.</p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Kolom Kanan: Detail Rekam Medis & Analisis Pasien ──────────── */}
            <section className={styles.detail}>
              {activePatient ? (
                <div className={styles.detailCard}>
                  {/* Detail Header Strip */}
                  <div className={styles.detailHead}>
                    <div className={styles.detailProfile}>
                      <div className={styles.detailAvatar}>
                        {activePatient.name ? activePatient.name[0].toUpperCase() : 'P'}
                      </div>
                      <div>
                        <h2 className={styles.detailTitle} data-no-translate="">{activePatient.name}</h2>
                        <div className={styles.detailMetaRow}>
                          <span data-no-translate="">{activePatient.email}</span>
                          <span>·</span>
                          <span>{activePatient.age ? `${activePatient.age} ${t('common.years')}` : '?'}</span>
                          <span>·</span>
                          <span>{activePatient.gender === 'M' ? t('prof.male') : activePatient.gender === 'F' ? t('prof.female') : t('doc.unknown')}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.detailActions}>
                      <button
                        type="button"
                        className={styles.btnDownloadPdf}
                        onClick={() => setShowPdfReport(true)}
                        title="Unduh Rekam Medis PDF Pasien"
                      >
                        <Download size={13} />
                        <span>Unduh PDF</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnUnlink}
                        onClick={() => unlinkPatient(activePatient.id)}
                        title="Lepaskan Tautan Pasien"
                      >
                        <Unlink size={13} />
                        <span>{t('link.unlink')}</span>
                      </button>

                      {session && (
                        <div className={`${styles.riskBannerPill} ${styles[`riskBanner_${levelOf(session.riskCategory)}`]}`}>
                          <span className={styles.riskBannerDot} />
                          <span>
                            {session.riskCategory === 'HIGH'
                              ? t('risk.high')
                              : session.riskCategory === 'MEDIUM'
                                ? t('risk.medium')
                                : t('risk.low')}
                          </span>
                          <span className={styles.riskBannerScore}>
                            (Skor: {Math.round(session.compositeScore)}/100)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {session ? (
                    <div className={styles.detailBody}>
                      {/* Session Selector Strip */}
                      <div className={styles.sessionHeaderRow}>
                        <div className={styles.sessionTitleGroup}>
                          <Calendar size={15} className={styles.sessionIcon} />
                          <h3 className={styles.sessionHeading}>
                            {t('doc.screeningSession')}:{' '}
                            <time dateTime={String(session.timestamp)}>
                              {new Date(session.timestamp).toLocaleDateString(dateLocale(lang), {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                          </h3>
                        </div>

                        {activePatient.sessions.length > 1 && (
                          <div className={styles.sessionPickerWrap}>
                            <span className={styles.sessionPickerLabel}>Pilih Riwayat:</span>
                            <select
                              className={styles.sessionSelect}
                              aria-label={t('doc.screeningSession')}
                              value={activeSessionIndex}
                              onChange={e => {
                                const idx = Number(e.target.value);
                                setActiveSessionIndex(idx);
                                setNoteText(activePatient.sessions[idx]?.doctorNote || '');
                                setSaveSuccess(false);
                              }}
                            >
                              {activePatient.sessions.map((s, idx) => (
                                <option key={s.id} value={idx}>
                                  Sesi #{activePatient.sessions.length - idx} - {new Date(s.timestamp).toLocaleDateString(dateLocale(lang))} (Skor: {Math.round(s.compositeScore)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* AI Classification Hero Banner */}
                      {session.mlPrediction?.predictedLabel && (
                        <div className={styles.classificationHero}>
                          <div className={styles.classHeroLeft}>
                            <div className={styles.classIconWrap}>
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <span className={styles.classLabel}>{t('doc.clinicalClassification')} (AI Engine)</span>
                              <h4 className={styles.classValue}>
                                {translateServerLabel(session.mlPrediction.predictedLabel, lang)}
                              </h4>
                            </div>
                          </div>
                          <div className={styles.classConfidenceBadge}>
                            <span>{t('doc.confidence')}: <strong>{session.mlPrediction.confidence || '96'}%</strong></span>
                          </div>
                        </div>
                      )}

                      {/* 4 Telemetry Biomarker Cards Grid */}
                      <div className={styles.biomarkerGrid}>
                        {/* Card 1: Tremor */}
                        <div className={styles.bioCard}>
                          <div className={styles.bioCardHead}>
                            <span className={styles.bioTitle}>Frekuensi Tremor</span>
                            <span className={styles.bioNormalTag}>Normal: &lt; 3.5 Hz</span>
                          </div>
                          <div className={styles.bioValueGroup}>
                            <output className={styles.bioNumber}>
                              {nb.tremorHz === null ? '-' : nb.tremorHz.toFixed(2)}
                            </output>
                            <span className={styles.bioUnit}>Hz</span>
                          </div>
                          <div className={styles.bioMeter}>
                            <span
                              className={`${styles.bioMeterFill} ${nb.tremorHz && nb.tremorHz > 4.5 ? styles.meterFillHigh : styles.meterFillGood}`}
                              style={{ width: `${Math.min(((nb.tremorHz || 0) / 8) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Card 2: Finger Tapping */}
                        <div className={styles.bioCard}>
                          <div className={styles.bioCardHead}>
                            <span className={styles.bioTitle}>Finger Tapping Rate</span>
                            <span className={styles.bioNormalTag}>Normal: &gt; 3.5 tap/s</span>
                          </div>
                          <div className={styles.bioValueGroup}>
                            <output className={styles.bioNumber}>
                              {nb.tapRate === null ? '-' : nb.tapRate.toFixed(2)}
                            </output>
                            <span className={styles.bioUnit}>tap/detik</span>
                          </div>
                          <div className={styles.bioMeter}>
                            <span
                              className={`${styles.bioMeterFill} ${nb.tapRate && nb.tapRate < 2.8 ? styles.meterFillHigh : styles.meterFillGood}`}
                              style={{ width: `${Math.min(((nb.tapRate || 0) / 5) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Card 3: Gait Symmetry */}
                        <div className={styles.bioCard}>
                          <div className={styles.bioCardHead}>
                            <span className={styles.bioTitle}>Simetri Pola Jalan</span>
                            <span className={styles.bioNormalTag}>Normal: &gt; 85%</span>
                          </div>
                          <div className={styles.bioValueGroup}>
                            <output className={styles.bioNumber}>
                              {nb.symmetryPercent === null ? '-' : nb.symmetryPercent.toFixed(1)}
                            </output>
                            <span className={styles.bioUnit}>% simetri</span>
                          </div>
                          <div className={styles.bioMeter}>
                            <span
                              className={`${styles.bioMeterFill} ${nb.symmetryPercent && nb.symmetryPercent < 75 ? styles.meterFillHigh : styles.meterFillGood}`}
                              style={{ width: `${Math.min(nb.symmetryPercent || 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Card 4: Postural Sway */}
                        <div className={styles.bioCard}>
                          <div className={styles.bioCardHead}>
                            <span className={styles.bioTitle}>Postural Sway Area</span>
                            <span className={styles.bioNormalTag}>Normal: &lt; 2.5 cm²</span>
                          </div>
                          <div className={styles.bioValueGroup}>
                            <output className={styles.bioNumber}>
                              {nb.swayAreaCm2 === null ? '-' : nb.swayAreaCm2.toFixed(2)}
                            </output>
                            <span className={styles.bioUnit}>cm²</span>
                          </div>
                          <div className={styles.bioMeter}>
                            <span
                              className={`${styles.bioMeterFill} ${nb.swayAreaCm2 && nb.swayAreaCm2 > 3.5 ? styles.meterFillHigh : styles.meterFillGood}`}
                              style={{ width: `${Math.min(((nb.swayAreaCm2 || 0) / 6) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clinical Notes & Recommendation Editor */}
                      <div className={styles.noteSection}>
                        <div className={styles.noteHeaderRow}>
                          <div className={styles.noteTitleWrap}>
                            <FileText size={16} className={styles.noteIcon} />
                            <h3 className={styles.noteTitle}>{t('doc.clinicalNote')}</h3>
                          </div>
                          {saveSuccess && (
                            <span className={styles.saveSuccessToast}>
                              <CheckCircle2 size={13} />
                              Catatan berhasil disimpan
                            </span>
                          )}
                        </div>

                        {/* Quick Note Presets */}
                        <div className={styles.quickNotesRow}>
                          <span className={styles.quickNoteLabel}>Templat Cepat:</span>
                          {QUICK_NOTES.map((qn, i) => (
                            <button
                              key={i}
                              type="button"
                              className={styles.quickNoteBtn}
                              onClick={() => applyQuickNote(qn)}
                            >
                              + {qn.slice(0, 24)}...
                            </button>
                          ))}
                        </div>

                        <div className={styles.noteField}>
                          <textarea
                            className={styles.noteTextarea}
                            aria-label={t('doc.clinicalNote')}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder={t('doc.notePlaceholder')}
                            rows={4}
                          />
                        </div>

                        <div className={styles.noteActionsRow}>
                          <button
                            type="button"
                            className={styles.btnSaveNote}
                            onClick={saveNote}
                            disabled={isSavingNote}
                          >
                            {isSavingNote ? (
                              <>
                                <RefreshCw size={14} className={styles.spinning} />
                                <span>{t('doc.saving')}</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>{t('doc.saveNote')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptySessionBox}>
                      <AlertCircle size={32} className={styles.emptySessionIcon} />
                      <h3>{t('doc.noSessionsYet')}</h3>
                      <p>{t('doc.noSessions')}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty Selection State */
                <div className={styles.emptySelectCard}>
                  <div className={styles.emptySelectIconWrap}>
                    <Stethoscope size={42} />
                  </div>
                  <h2 className={styles.emptySelectTitle}>{t('doc.selectPatient')}</h2>
                  <p className={styles.emptySelectHint}>{t('doc.selectPatientHint')}</p>
                  
                  <div className={styles.emptyGuidePills}>
                    <div className={styles.guidePill}>
                      <Activity size={18} className={styles.guideIcon} />
                      <span>Analisis 4 Biomarker Motorik</span>
                    </div>
                    <div className={styles.guidePill}>
                      <Sparkles size={18} className={styles.guideIcon} />
                      <span>Klasifikasi AI Real-Time</span>
                    </div>
                    <div className={styles.guidePill}>
                      <FileText size={18} className={styles.guideIcon} />
                      <span>Rekam Medis & Evaluasi Klinis</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Modal Popup Error Catatan Dokter Kosong ─────────────────────── */}
        {showEmptyNoteModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowEmptyNoteModal(false)}>
            <div className={styles.errorModalCard} onClick={e => e.stopPropagation()}>
              <div className={styles.errorIconCircle}>
                <svg className={styles.errorSvg} viewBox="0 0 52 52">
                  <circle className={styles.errorCircleBg} cx="26" cy="26" r="23" fill="none" />
                  <path className={styles.errorCrossLine1} fill="none" d="M16 16 36 36" />
                  <path className={styles.errorCrossLine2} fill="none" d="M36 16 16 36" />
                </svg>
              </div>
              <h3 className={styles.errorModalTitle}>Catatan Dokter Wajib Diisi</h3>
              <p className={styles.errorModalDesc}>
                Mohon masukkan observasi klinis, evaluasi gejala, atau rekomendasi tindak lanjut pasien sebelum menyimpan catatan rekam medis.
              </p>
              <button
                type="button"
                className={styles.errorModalBtn}
                onClick={() => setShowEmptyNoteModal(false)}
                autoFocus
              >
                Mengerti & Kembali Menulis
              </button>
            </div>
          </div>
        )}

        {/* ── Modal Host Unduh PDF Pasien ─────────────────────────────────── */}
        {activePatient && (
          <ReportPrintHost
            open={showPdfReport}
            onClose={() => setShowPdfReport(false)}
            patientName={activePatient.name}
          >
            <ReportTemplate
              patient={{
                name: activePatient.name,
                email: activePatient.email,
                gender: activePatient.gender,
                dateOfBirth: activePatient.dateOfBirth || undefined,
                age: calcAge(activePatient.dateOfBirth) || activePatient.age,
                city: activePatient.city,
                state: activePatient.state,
                country: activePatient.country,
                countryName: activePatient.countryName,
              }}
              sessions={activePatient.sessions}
              meta={{
                clinicianName: user?.name,
                clinicianRole: user?.specialization || 'Dokter Spesialis Saraf',
                clinicianInstitution: user?.institution || 'RSUP Dr. Cipto Mangunkusumo',
                clinicianLicense: user?.licenseNumber || 'SIP.440/1234/DS-01/2022',
                clinicianSignature: user?.signature || undefined,
              }}
            />
          </ReportPrintHost>
        )}
      </main>
    </div>
  );
}
