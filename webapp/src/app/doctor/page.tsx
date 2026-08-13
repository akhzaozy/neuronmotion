'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, PatientDetail } from '@/lib/api';
import DoctorNav from '@/components/DoctorNav';
import GeoBreakdown from '@/components/GeoBreakdown';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import styles from './doctor.module.css';

const POLL_INTERVAL_MS = 30_000; // 30 detik

/** Memetakan kategori risiko server ke kelas tingkat pada globals.css. */
function levelOf(risk?: string) {
  return risk === 'HIGH' ? 'high' : risk === 'MEDIUM' ? 'mid' : 'low';
}

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
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
      // Detail yang sedang terbuka ikut ditutup karena datanya tidak lagi boleh tampil
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
    setIsSavingNote(true);
    try {
      await api.saveNote(activePatient.sessions[activeSessionIndex].id, { note: noteText, doctorId: user!.id }, token!);
      alert(t('doc.noteSaved'));
    } catch (e: any) {
      alert(`${t('doc.saveFailed')}: ${e.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading || !dashboard) {
    return (
      <div className={styles.page}>
        <DoctorNav />
        <main className="sheet" id="main">
          <div className={styles.pad}>
            <header className="docHead">
              <div className="docHead__meta">
                <span>{t('doc.portalTitle')}</span>
              </div>
              <h1>{t('doc.loadingPortal')}</h1>
            </header>
            <p className={styles.loading} role="status" aria-live="polite">
              {t('doc.loadingPatients')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const filteredPatients = search.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : patients;

  const session = activePatient?.sessions[activeSessionIndex];

  return (
    <div className={styles.page}>
      <DoctorNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span>{t('doc.portalTitle')}</span>
              <span data-no-translate="">{user?.name}</span>
              <span>{user?.specialization || t('doc.specialist')}</span>
              {user?.institution && <span data-no-translate="">{user.institution}</span>}
            </div>
            <div className={styles.headRow}>
              <div>
                <h1>{t('doc.portalTitle')}</h1>
                <p className={styles.lead}>
                  {t('doc.welcome')}, <span data-no-translate="">{user?.name}</span>
                </p>
                {lastUpdated && (
                  <p className={styles.stamp}>
                    {t('doc.updatedAt')}: {lastUpdated.toLocaleTimeString(dateLocale(lang))} · {t('doc.autoEvery30')}
                  </p>
                )}
              </div>
              <div className={styles.headActions}>
                <button
                  className="btn"
                  onClick={() => refreshData(user, token, activePatientId)}
                  disabled={isRefreshing}
                  title={t('doc.refreshNow')}
                >
                  {isRefreshing ? t('doc.refreshing') : t('doc.refresh')}
                </button>
                <button className="btn" onClick={() => { logout(); router.push('/login'); }}>
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </header>

          {/* Ringkasan angka. Warna tidak dipakai di sini: labelnya yang
              membedakan, dan angkanya yang memimpin. */}
          <section className={styles.stats}>
            <div className={styles.stat}>
              <output className={styles.statValue}>{dashboard.totalPatients}</output>
              <span className={`label ${styles.statLabel}`}>{t('doc.totalPatients')}</span>
            </div>
            <div className={styles.stat}>
              <output className={styles.statValue}>{dashboard.riskBreakdown?.HIGH || 0}</output>
              <span className={`label ${styles.statLabel}`}>{t('doc.highRisk')}</span>
            </div>
            <div className={styles.stat}>
              <output className={styles.statValue}>{dashboard.riskBreakdown?.MEDIUM || 0}</output>
              <span className={`label ${styles.statLabel}`}>{t('doc.mediumRisk')}</span>
            </div>
            <div className={styles.stat}>
              <output className={styles.statValue}>{dashboard.conditionBreakdown?.PARKINSON_EARLY || 0}</output>
              <span className={`label ${styles.statLabel}`}>{t('doc.earlyParkinson')}</span>
            </div>
          </section>

          <GeoBreakdown data={dashboard.geoBreakdown} />

          <div className={styles.layout}>
            {/* ── Indeks pasien ──────────────────────────────────────────── */}
            <section className={styles.index}>
              <div className={styles.indexHead}>
                <h2 className={styles.indexTitle}>{t('doc.patientList')}</h2>
                <span className={styles.count}>
                  {filteredPatients.length}{search ? ` / ${patients.length}` : ''}
                </span>
              </div>

              <div className={styles.linkBox}>
                <h3 className="label">{t('link.title')}</h3>
                <p className={styles.linkDesc}>{t('link.desc')}</p>
                <div className={styles.linkRow}>
                  <input
                    className={`input ${styles.linkInput}`}
                    type="text"
                    aria-label={t('link.title')}
                    placeholder={t('link.placeholder')}
                    value={linkCode}
                    maxLength={12}
                    onChange={e => setLinkCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') linkByCode(); }}
                  />
                  <button
                    className="btn btn--primary"
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

              <div className={styles.searchBox}>
                <input
                  className="input"
                  type="text"
                  aria-label={t('doc.searchPatient')}
                  placeholder={t('doc.searchPatient')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.listBody}>
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.patientItem} ${activePatient?.id === p.id ? styles.active : ''}`}
                    aria-current={activePatient?.id === p.id ? 'true' : undefined}
                    onClick={() => loadPatientDetail(p.id)}
                  >
                    <span>
                      <span className={styles.patientName} data-no-translate="">{p.name}</span>
                      <span className={styles.patientInfo}>
                        {t('doc.age')}: {p.age || '?'} {t('doc.yearsShort')} · {t('doc.scoreShort')}: {p.lastSession ? Math.round(p.lastSession.compositeScore) : '-'}
                      </span>
                    </span>
                    {p.lastSession && (
                      <span className={`level level--${levelOf(p.lastSession.riskCategory)}`}>
                        {p.lastSession.riskCategory === 'HIGH'
                          ? t('risk.high')
                          : p.lastSession.riskCategory === 'MEDIUM'
                            ? t('risk.medium')
                            : t('risk.low')}
                      </span>
                    )}
                  </button>
                ))}
                {patients.length === 0 && <p className={styles.listEmpty}>{t('doc.noPatients')}</p>}
                {patients.length > 0 && filteredPatients.length === 0 && (
                  <p className={styles.listEmpty}>{t('doc.noMatch')} &ldquo;{search}&rdquo;.</p>
                )}
              </div>
            </section>

            {/* ── Isi pemeriksaan ────────────────────────────────────────── */}
            <section className={styles.detail}>
              {activePatient ? (
                <>
                  <div className={styles.detailHead}>
                    <div>
                      <h2 className={styles.detailTitle} data-no-translate="">{activePatient.name}</h2>
                      <p className={styles.detailMeta}>
                        <span data-no-translate="">{activePatient.email}</span> · {t('doc.age')} {activePatient.age || '?'} {t('common.years')} · {activePatient.gender === 'M' ? t('prof.male') : activePatient.gender === 'F' ? t('prof.female') : t('doc.unknown')}
                      </p>
                    </div>
                    <div className={styles.detailActions}>
                      <button className="btn" onClick={() => unlinkPatient(activePatient.id)}>
                        {t('link.unlink')}
                      </button>
                      {session && (
                        <p className={`level level--${levelOf(session.riskCategory)}`}>
                          {t('dash.riskPrefix')}{' '}
                          {session.riskCategory === 'HIGH'
                            ? t('risk.high')
                            : session.riskCategory === 'MEDIUM'
                              ? t('risk.medium')
                              : t('risk.low')}
                          {' · '}
                          {t('doc.scoreShort')} {Math.round(session.compositeScore)}
                        </p>
                      )}
                    </div>
                  </div>

                  {session ? (
                    <div className={styles.section}>
                      <div className={styles.sectionHead}>
                        <h3 className={styles.sectionTitle}>
                          {t('doc.screeningSession')}:{' '}
                          <time dateTime={String(session.timestamp)}>
                            {new Date(session.timestamp).toLocaleDateString(dateLocale(lang))}
                          </time>
                        </h3>
                        {activePatient.sessions.length > 1 && (
                          <select
                            className={`input ${styles.sessionSelect}`}
                            aria-label={t('doc.screeningSession')}
                            value={activeSessionIndex}
                            onChange={e => {
                              const idx = Number(e.target.value);
                              setActiveSessionIndex(idx);
                              setNoteText(activePatient.sessions[idx]?.doctorNote || '');
                            }}
                          >
                            {activePatient.sessions.map((s, idx) => (
                              <option key={s.id} value={idx}>
                                {new Date(s.timestamp).toLocaleString(dateLocale(lang))} - {t('doc.scoreShort')} {Math.round(s.compositeScore)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {session.mlPrediction?.predictedLabel && (
                        <div className={styles.classification}>
                          <h4 className="label">{t('doc.clinicalClassification')}</h4>
                          <p className={styles.classificationValue}>
                            {translateServerLabel(session.mlPrediction.predictedLabel, lang)}
                          </p>
                          <p className={styles.classificationSub}>
                            {t('doc.confidence')}: {session.mlPrediction.confidence || '?'}%
                          </p>
                        </div>
                      )}

                      <div className={styles.section}>
                        <div className={styles.tableScroll}>
                          <table className="dataTable">
                            <thead>
                              <tr>
                                <th scope="col">{t('hist.biomarker')}</th>
                                <th scope="col" className="num">{t('demo.measured')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <th scope="row">Tremor Amplitude</th>
                                <td className="num">
                                  {(session.tremorResult as any)?.amplitudeMillimeter || '-'} mm
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Finger Tapping Rate</th>
                                <td className="num">
                                  {(session.fingerTappingResult as any)?.tapRatePerSecond || '-'} tap/s
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Gait Symmetry</th>
                                <td className="num">
                                  {(session.gaitResult as any)?.symmetryPercent || '-'}%
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Postural Sway Area</th>
                                <td className="num">
                                  {(session.posturalResult as any)?.swayAreaCm2 || '-'} cm²
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className={styles.noteSection}>
                        <h3 className={styles.sectionTitle}>{t('doc.clinicalNote')}</h3>
                        <div className={styles.noteField}>
                          <textarea
                            className="input"
                            aria-label={t('doc.clinicalNote')}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder={t('doc.notePlaceholder')}
                          />
                        </div>
                        <button className="btn btn--primary btn--lg" onClick={saveNote} disabled={isSavingNote}>
                          {isSavingNote ? t('doc.saving') : t('doc.saveNote')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>{t('doc.noSessions')}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <h2>{t('doc.selectPatient')}</h2>
                  <p>{t('doc.selectPatientHint')}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
