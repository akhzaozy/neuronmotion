'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, PatientDetail, Session } from '@/lib/api';
import styles from './doctor.module.css';

const POLL_INTERVAL_MS = 30_000; // 30 detik

export default function DoctorPortal() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  
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
      alert('Gagal memuat detail pasien');
    }
  };

  const saveNote = async () => {
    if (!activePatient || !activePatient.sessions[activeSessionIndex]) return;
    setIsSavingNote(true);
    try {
      await api.saveNote(activePatient.sessions[activeSessionIndex].id, { note: noteText, doctorId: user!.id }, token!);
      alert('Catatan berhasil disimpan');
    } catch (e: any) {
      alert('Gagal menyimpan: ' + e.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading || !dashboard) {
    return (
      <div className={styles.page}>
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
              <div className={styles.listHeader}>Memuat daftar pasien...</div>
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
                <div className={styles.emptyStateIcon}>📋</div>
                <h3>Memuat Portal Nakes...</h3>
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Portal Tenaga Kesehatan</h1>
            <p>Selamat datang, {user?.name} — {user?.specialization || 'Dokter Spesialis'}</p>
            {lastUpdated && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')} · otomatis setiap 30 detik
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => refreshData(user, token, activePatientId)}
              disabled={isRefreshing}
              title="Perbarui data sekarang"
            >
              {isRefreshing ? 'Memperbarui...' : '↻ Perbarui'}
            </button>
            <button className="btn btn-outline" onClick={() => { logout(); router.push('/login'); }}>
              Keluar
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Pasien Aktif</div>
            <div className={styles.statValue} style={{ color: 'var(--brand-light)' }}>{dashboard.totalPatients}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Pasien Risiko Tinggi (Rujukan)</div>
            <div className={styles.statValue} style={{ color: 'var(--red)' }}>{dashboard.riskBreakdown?.HIGH || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Pasien Risiko Sedang (Pantau)</div>
            <div className={styles.statValue} style={{ color: 'var(--yellow)' }}>{dashboard.riskBreakdown?.MEDIUM || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Deteksi Parkinson Awal</div>
            <div className={styles.statValue} style={{ color: 'var(--purple)' }}>{dashboard.conditionBreakdown?.PARKINSON_EARLY || 0}</div>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Patient List */}
          <div className={styles.patientList}>
            <div className={styles.listHeader}>
              <span>Daftar Pasien ({filteredPatients.length}{search ? ` / ${patients.length}` : ''})</span>
            </div>
            <div className={styles.searchBox}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Cari nama pasien..."
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
                    <div className={styles.patientName}>{p.name}</div>
                    <div className={styles.patientInfo}>Usia: {p.age || '?'} th • Skor: {p.lastSession ? Math.round(p.lastSession.compositeScore) : '-'}</div>
                  </div>
                  {p.lastSession && (
                    <div className={`${styles.riskIndicator} ${styles[p.lastSession.riskCategory]}`} title={`Risiko ${p.lastSession.riskCategory}`} />
                  )}
                </div>
              ))}
              {patients.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada pasien tertaut.</div>}
              {patients.length > 0 && filteredPatients.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Tidak ada pasien dengan nama &ldquo;{search}&rdquo;.</div>
              )}
            </div>
          </div>

          {/* Detail View */}
          <div className={styles.detailView}>
            {activePatient ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>{activePatient.name}</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>{activePatient.email} • Usia {activePatient.age || '?'} tahun • {activePatient.gender === 'M' ? 'Laki-laki' : activePatient.gender === 'F' ? 'Perempuan' : 'Tidak diketahui'}</div>
                  </div>
                  {activePatient.sessions[activeSessionIndex] && (
                    <div className={`badge ${
                      activePatient.sessions[activeSessionIndex].riskCategory === 'HIGH' ? 'badge-red' : 
                      activePatient.sessions[activeSessionIndex].riskCategory === 'MEDIUM' ? 'badge-yellow' : 'badge-green'
                    }`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                      Risiko {activePatient.sessions[activeSessionIndex].riskCategory} (Skor: {Math.round(activePatient.sessions[activeSessionIndex].compositeScore)})
                    </div>
                  )}
                </div>

                {activePatient.sessions[activeSessionIndex] ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3>Sesi Skrining: {new Date(activePatient.sessions[activeSessionIndex].timestamp).toLocaleDateString('id-ID')}</h3>
                      {activePatient.sessions.length > 1 && (
                        <select 
                          className="input" 
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
                              {new Date(s.timestamp).toLocaleString('id-ID')} - Skor {Math.round(s.compositeScore)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    {activePatient.sessions[activeSessionIndex].mlPrediction?.predictedLabel && (
                      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 24, borderLeft: '4px solid var(--purple)' }}>
                        <h4 style={{ color: 'var(--purple)', marginBottom: 4, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasil Klasifikasi Klinis</h4>
                        <p style={{ fontWeight: 600 }}>{activePatient.sessions[activeSessionIndex].mlPrediction.predictedLabel}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          Keyakinan: {activePatient.sessions[activeSessionIndex].mlPrediction.confidence || '?'}%
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
                      <h3 style={{ marginBottom: 16 }}>Catatan Klinis Dokter</h3>
                      <textarea 
                        className="input" 
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Tulis hasil evaluasi dan rekomendasi medis untuk pasien..."
                      />
                      <button className="btn btn-primary" onClick={saveNote} disabled={isSavingNote}>
                        {isSavingNote ? 'Menyimpan...' : 'Simpan Catatan & Rekomendasi'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>Pasien ini belum melakukan skrining sama sekali.</p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📋</div>
                <h3>Pilih Pasien</h3>
                <p>Klik nama pasien di menu sebelah kiri untuk melihat detail klinis lengkap dan analisis biomarker.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
