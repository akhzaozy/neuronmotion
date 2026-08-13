'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, PatientDetail, Session } from '@/lib/api';
import DoctorNav from '@/components/DoctorNav';
import GeoBreakdown from '@/components/GeoBreakdown';
import { ClipboardIcon, RefreshIcon } from '@/components/icons';
import { useI18n, translateServerLabel, dateLocale } from '@/lib/i18n';
import styles from './doctor.module.css';

const POLL_INTERVAL_MS = 30_000; // 30 detik

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
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={styles.statCard}>
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 16 }}>.</div>
                <div className="skeleton" style={{ height: 32, width: '40%' }}>.</div>
              </div>
            ))}
          </div>
          <div className={styles.contentGrid}>
            <div className={styles.patientList}>
              <div className={styles.listHeader}>{t('doc.loadingPatients')}</div>
              <div className={styles.listBody}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={styles.patientItem}>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }}>.</div>
                      <div className="skeleton" style={{ height: 12, width: '40%' }}>.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.detailView}>
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}><ClipboardIcon size={34} /></div>
                <h3>{t('doc.loadingPortal')}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPatients = search.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : patients;

  return (
    <div className={styles.page}>
      <DoctorNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>{t('doc.portalTitle')}</h1>
            <p>
              {t('doc.welcome')}, <span data-no-translate="">{user?.name}</span>,{' '}
              {user?.specialization || t('doc.specialist')}
              {user?.institution ? <span data-no-translate="">{` • ${user.institution}`}</span> : ''}
            </p>
            {lastUpdated && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {t('doc.updatedAt')}: {lastUpdated.toLocaleTimeString(dateLocale(lang))} · {t('doc.autoEvery30')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => refreshData(user, token, activePatientId)}
              disabled={isRefreshing}
              title={t('doc.refreshNow')}
            >
              {isRefreshing ? t('doc.refreshing') : <><RefreshIcon size={15} /> {t('doc.refresh')}</>}
            </button>
            <button className="btn btn-outline" onClick={() => { logout(); router.push('/login'); }}>
              {t('common.logout')}
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>{t('doc.totalPatients')}</div>
            <div className={styles.statValue} style={{ color: 'var(--brand-text)' }}>{dashboard.totalPatients}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>{t('doc.highRisk')}</div>
            <div className={styles.statValue} style={{ color: 'var(--red-text)' }}>{dashboard.riskBreakdown?.HIGH || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>{t('doc.mediumRisk')}</div>
            <div className={styles.statValue} style={{ color: 'var(--yellow-text)' }}>{dashboard.riskBreakdown?.MEDIUM || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>{t('doc.earlyParkinson')}</div>
            <div className={styles.statValue} style={{ color: 'var(--purple-text)' }}>{dashboard.conditionBreakdown?.PARKINSON_EARLY || 0}</div>
          </div>
        </div>

        <GeoBreakdown data={dashboard.geoBreakdown} />

        <div className={styles.contentGrid}>
          {/* Patient List */}
          <div className={styles.patientList}>
            <div className={styles.listHeader}>
              <span>{t('doc.patientList')} ({filteredPatients.length}{search ? ` / ${patients.length}` : ''})</span>
            </div>
            <div className={styles.linkBox}>
              <div className={styles.linkTitle}>{t('link.title')}</div>
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
                  className="btn btn-primary btn-sm"
                  onClick={linkByCode}
                  disabled={linking || !linkCode.trim()}
                >
                  {linking ? t('link.linking') : t('link.submit')}
                </button>
              </div>
              {linkMsg && (
                <p className={linkMsg.ok ? styles.linkMsgOk : styles.linkMsgErr} data-no-translate="">
                  {linkMsg.text}
                </p>
              )}
            </div>

            <div className={styles.searchBox}>
              <input
                className={styles.searchInput}
                type="text"
                aria-label={t('doc.searchPatient')}
                placeholder={t('doc.searchPatient')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.listBody}>
              {filteredPatients.map(p => (
                <div 
                  key={p.id} 
                  className={`${styles.patientItem} ${activePatient?.id === p.id ? styles.active : ''}`}
                  onClick={() => loadPatientDetail(p.id)}
                >
                  <div>
                    <div className={styles.patientName} data-no-translate="">{p.name}</div>
                    <div className={styles.patientInfo}>
                      {t('doc.age')}: {p.age || '?'} {t('doc.yearsShort')} • {t('doc.scoreShort')}: {p.lastSession ? Math.round(p.lastSession.compositeScore) : '-'}
                    </div>
                  </div>
                  {p.lastSession && (
                    <div className={`${styles.riskIndicator} ${styles[p.lastSession.riskCategory]}`} title={`${t('dash.riskPrefix')} ${p.lastSession.riskCategory}`} />
                  )}
                </div>
              ))}
              {patients.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('doc.noPatients')}</div>}
              {patients.length > 0 && filteredPatients.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('doc.noMatch')} &ldquo;{search}&rdquo;.</div>
              )}
            </div>
          </div>

          {/* Detail View */}
          <div className={styles.detailView}>
            {activePatient ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle} data-no-translate="">{activePatient.name}</h2>
                    <div style={{ color: 'var(--text-secondary)' }}><span data-no-translate="">{activePatient.email}</span> • {t('doc.age')} {activePatient.age || '?'} {t('common.years')} • {activePatient.gender === 'M' ? t('prof.male') : activePatient.gender === 'F' ? t('prof.female') : t('doc.unknown')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => unlinkPatient(activePatient.id)}
                    >
                      {t('link.unlink')}
                    </button>
                  {activePatient.sessions[activeSessionIndex] && (
                    <div className={`badge ${
                      activePatient.sessions[activeSessionIndex].riskCategory === 'HIGH' ? 'badge-red' : 
                      activePatient.sessions[activeSessionIndex].riskCategory === 'MEDIUM' ? 'badge-yellow' : 'badge-green'
                    }`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                      {t('dash.riskPrefix')} {activePatient.sessions[activeSessionIndex].riskCategory} ({t('doc.scoreShort')}: {Math.round(activePatient.sessions[activeSessionIndex].compositeScore)})
                    </div>
                  )}
                  </div>
                </div>

                {activePatient.sessions[activeSessionIndex] ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3>{t('doc.screeningSession')}: {new Date(activePatient.sessions[activeSessionIndex].timestamp).toLocaleDateString(dateLocale(lang))}</h3>
                      {activePatient.sessions.length > 1 && (
                        <select
                          className="input"
                          aria-label={t('doc.screeningSession')}
                          style={{ width: 'auto', padding: '4px 8px' }}
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
                    
                    {activePatient.sessions[activeSessionIndex].mlPrediction?.predictedLabel && (
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, borderLeft: '4px solid var(--purple)' }}>
                        <h4 style={{ color: 'var(--purple-text)', marginBottom: 4, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('doc.clinicalClassification')}</h4>
                        <p style={{ fontWeight: 600 }}>{translateServerLabel(activePatient.sessions[activeSessionIndex].mlPrediction.predictedLabel, lang)}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          {t('doc.confidence')}: {activePatient.sessions[activeSessionIndex].mlPrediction.confidence || '?'}%
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Tremor Amplitude</h4>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {(activePatient.sessions[activeSessionIndex].tremorResult as any)?.amplitudeMillimeter || '-'} mm
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Finger Tapping Rate</h4>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {(activePatient.sessions[activeSessionIndex].fingerTappingResult as any)?.tapRatePerSecond || '-'} tap/s
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Gait Symmetry</h4>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {(activePatient.sessions[activeSessionIndex].gaitResult as any)?.symmetryPercent || '-'}%
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Postural Sway Area</h4>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {(activePatient.sessions[activeSessionIndex].posturalResult as any)?.swayAreaCm2 || '-'} cm²
                        </div>
                      </div>
                    </div>

                    <div className={styles.noteSection}>
                      <h3 style={{ marginBottom: 16 }}>{t('doc.clinicalNote')}</h3>
                      <textarea
                        className="input"
                        aria-label={t('doc.clinicalNote')}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder={t('doc.notePlaceholder')}
                      />
                      <button className="btn btn-primary" onClick={saveNote} disabled={isSavingNote}>
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
                <div className={styles.emptyStateIcon}><ClipboardIcon size={34} /></div>
                <h3>{t('doc.selectPatient')}</h3>
                <p>{t('doc.selectPatientHint')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
