'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
  KeyRound,
  LogOut,
  Check,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, UserProfile } from '@/lib/api';
import DoctorNav from '@/components/DoctorNav';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '../../profil/profil.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

/** Satu baris keterangan: label di kiri, nilai di kanan, dipisah garis rambut. */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <dt className={styles.infoLabel}>{label}</dt>
      <dd className={styles.infoValue}>{children}</dd>
    </div>
  );
}

export default function DoctorProfilPage() {
  const router = useRouter();
  const { user, token, logout, isLoading, login } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState<LocationValue>({});

  // Ganti password
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'DOCTOR') {
      router.push('/login');
      return;
    }

    if (token) {
      api.getMe(token)
        .then(p => {
          setProfile(p);
          setName(p.name || '');
          setSpecialization(p.specialization || '');
          setInstitution(p.institution || '');
          setLocation({
            country: p.country,
            countryName: p.countryName,
            region: p.region,
            state: p.state,
            city: p.city,
          });
        })
        .catch(() => setError('Gagal memuat profil'))
        .finally(() => setLoading(false));
    }
  }, [user, token, isLoading, router]);

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await api.updateProfile(
        {
          name,
          specialization,
          institution,
          country: location.country,
          countryName: location.countryName,
          region: location.region,
          state: location.state,
          city: location.city,
        },
        token
      );
      setProfile(updated);
      login(updated, token);
      setEditing(false);
      setMessage('Profil berhasil diperbarui');
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!token) return;
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    setPwSaving(true);
    setError('');
    setMessage('');

    try {
      await api.changePassword(currentPassword, newPassword, token);
      setShowPwForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password berhasil diubah');
    } catch (e: any) {
      setError(e.message || 'Gagal mengganti password');
    } finally {
      setPwSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <DoctorNav />
        <main className="sheet">
          <LoadingScreen
            title="Memuat Profil Dokter..."
            subtitle="Menghubungkan data identitas dan institusi nakes..."
          />
        </main>
      </div>
    );
  }

  const locationText = [profile?.city, profile?.state, profile?.countryName]
    .filter(Boolean).join(', ') || 'Belum diisi';

  return (
    <div className={styles.page}>
      <DoctorNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          {/* ── Header Halaman ────────────────────────────────────────────── */}
          <header className={styles.header}>
            <div className={styles.metaPillGroup}>
              <span className={styles.metaChip}>
                <Stethoscope size={14} color="var(--accent)" />
                Tenaga Kesehatan Terverifikasi
              </span>
              <span className={styles.metaChip}>
                <ShieldCheck size={14} color="var(--accent)" />
                Kepatuhan PDP
              </span>
            </div>
            <h1 className={styles.title}>Pengaturan Profil Nakes</h1>
            <p className={styles.lead}>
              Kelola informasi identitas profesional, afiliasi institusi praktik, dan preferensi keamanan akun.
            </p>
          </header>

          {/* ── Kartu Hero Profil Dokter ──────────────────────────────────── */}
          <div className={styles.profileHeroCard}>
            <div className={styles.avatarWrap}>
              <Stethoscope size={32} />
            </div>
            <div className={styles.heroDetails}>
              <h2 className={styles.heroName} data-no-translate="">{profile?.name}</h2>
              <div className={styles.heroMeta}>
                <span className={styles.heroMetaItem} data-no-translate="">
                  <Building2 size={15} color="var(--accent)" />
                  {profile?.specialization || 'Tenaga Kesehatan'}
                  {profile?.institution ? ` · ${profile.institution}` : ''}
                </span>
                <span className={styles.heroMetaItem} data-no-translate="">
                  <MapPin size={15} color="var(--accent)" />
                  {locationText}
                </span>
              </div>
            </div>
          </div>

          {message && (
            <p className={styles.successMsg} role="status">
              <Check size={18} />
              <span>{message}</span>
            </p>
          )}
          {error && (
            <p className={styles.errorMsg} role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </p>
          )}

          {/* ── Data Profesional ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Data Profesional & Institusi</h2>
                {!editing && (
                  <button className="btn" onClick={() => setEditing(true)}>Ubah Data</button>
                )}
              </div>

              {!editing ? (
                <dl className={styles.infoList}>
                  <InfoRow label="Nama Lengkap">
                    <span data-no-translate="">{profile?.name}</span>
                  </InfoRow>
                  <InfoRow label="Profesi">{profile?.specialization || 'Belum diisi'}</InfoRow>
                  <InfoRow label="Institusi / Rumah Sakit">
                    <span data-no-translate="">{profile?.institution || 'Belum diisi'}</span>
                  </InfoRow>
                  <InfoRow label="Wilayah Praktik">
                    <span data-no-translate="">{locationText}</span>
                  </InfoRow>
                  <InfoRow label="Alamat Surel">
                    <span data-no-translate="">{profile?.email}</span>
                  </InfoRow>
                </dl>
              ) : (
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="docprof-name">Nama Lengkap</label>
                    <input
                      id="docprof-name"
                      className="input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="docprof-specialization">Profesi</label>
                    <select
                      id="docprof-specialization"
                      className="input"
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                    >
                      <option value="">Pilih profesi</option>
                      {SPECIALIZATIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="docprof-institution">Institusi / Tempat Praktik</label>
                    <input
                      id="docprof-institution"
                      className="input"
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      placeholder="Contoh: RS Siloam Jakarta"
                    />
                  </div>

                  <LocationFields value={location} onChange={setLocation} />

                  <div className={styles.actionRow}>
                    <button
                      className="btn btn--primary"
                      onClick={saveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Keamanan Akun ─────────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Keamanan Akun</h2>
                {!showPwForm && (
                  <button className="btn" onClick={() => setShowPwForm(true)}>Ganti Password</button>
                )}
              </div>

              {!showPwForm ? (
                <p className={styles.note}>
                  Gunakan password yang kuat dan unik karena akun Anda memiliki akses langsung ke data riwayat skrining klinis pasien yang tertaut.
                </p>
              ) : (
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="docprof-current-pw">Password Saat Ini</label>
                    <input
                      id="docprof-current-pw"
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <div className={styles.labelRow}>
                      <label className="label" htmlFor="docprof-new-pw">Password Baru</label>
                      <button
                        type="button"
                        className={styles.reveal}
                        onClick={() => setShowPw(v => !v)}
                        aria-pressed={showPw}
                      >
                        {showPw ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                    <input
                      id="docprof-new-pw"
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                    />
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      className="btn btn--primary"
                      onClick={changePassword}
                      disabled={pwSaving || newPassword.length < 6 || !currentPassword}
                    >
                      {pwSaving ? 'Menyimpan...' : 'Simpan Password'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setShowPwForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Tanggung Jawab Akses Medis ────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Tanggung Jawab Akses Data</h2>
              </div>
              <p className={styles.note}>
                Akun tenaga kesehatan berwenang mengevaluasi data biomarker pasien yang secara sukarela membagikan kode akses. Gunakan data ini semata-mata untuk keperluan evaluasi klinis. Pasien memegang hak penuh untuk melepaskan tautan atau menghapus riwayat pemeriksaan kapan saja.
              </p>
            </div>
          </section>

          {/* ── Tombol Keluar ─────────────────────────────────────────────── */}
          <div className={styles.logoutRow}>
            <button
              className="btn btn--block"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <LogOut size={16} />
              <span>Keluar dari Akun Dokter</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
