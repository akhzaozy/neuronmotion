'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <dt className={`label ${styles.infoLabel}`}>{label}</dt>
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
    api.getMe(token!)
      .then(p => {
        setProfile(p);
        setName(p.name || '');
        setSpecialization(p.specialization || '');
        setInstitution(p.institution || '');
        setLocation({
          country: p.country, countryName: p.countryName,
          region: p.region, state: p.state, city: p.city,
        });
      })
      .catch(() => setError('Gagal memuat profil'))
      .finally(() => setLoading(false));
  }, [user, token, isLoading, router]);

  async function saveProfile() {
    setSaving(true); setError(''); setMessage('');
    try {
      const updated = await api.updateProfile({
        name, specialization, institution,
        country: location.country, countryName: location.countryName,
        region: location.region, state: location.state, city: location.city,
      }, token!);
      setProfile(updated);
      // Segarkan sesi agar nama dan institusi di navbar ikut terbarui
      if (token) login(updated, token);
      setEditing(false);
      setMessage('Profil berhasil diperbarui');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwSaving(true); setError(''); setMessage('');
    try {
      await api.changePassword(currentPassword, newPassword, token!);
      setShowPwForm(false);
      setCurrentPassword(''); setNewPassword('');
      setMessage('Password berhasil diperbarui');
      setTimeout(() => setMessage(''), 3000);
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
          <header className="docHead">
            <div className="docHead__meta">
              <span data-no-translate="">
                {profile?.specialization || 'Tenaga Kesehatan'}
                {profile?.institution ? ` · ${profile.institution}` : ''}
              </span>
              <span data-no-translate="">{profile?.email}</span>
            </div>
            <h1 data-no-translate="">{profile?.name}</h1>
          </header>

          {message && <p className={styles.successMsg} role="status">{message}</p>}
          {error && <p className={styles.errorMsg} role="alert">{error}</p>}

          {/* ── Data profesional ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Data Profesional</h2>
              {!editing && (
                <button className="btn" onClick={() => setEditing(true)}>Ubah</button>
              )}
            </div>

            {!editing ? (
              <dl className={styles.infoList}>
                <InfoRow label="Nama">
                  <span data-no-translate="">{profile?.name}</span>
                </InfoRow>
                <InfoRow label="Profesi">{profile?.specialization || 'Belum diisi'}</InfoRow>
                <InfoRow label="Institusi">
                  <span data-no-translate="">{profile?.institution || 'Belum diisi'}</span>
                </InfoRow>
                <InfoRow label="Wilayah Praktik">
                  <span data-no-translate="">{locationText}</span>
                </InfoRow>
                <InfoRow label="Email">
                  <span data-no-translate="">{profile?.email}</span>
                </InfoRow>
              </dl>
            ) : (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="docprof-name">Nama Lengkap</label>
                  <input id="docprof-name" className="input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="docprof-specialization">Profesi</label>
                  <select id="docprof-specialization" className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                    <option value="">Pilih profesi</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="docprof-institution">Institusi / Tempat Praktik</label>
                  <input id="docprof-institution" className="input" value={institution} onChange={e => setInstitution(e.target.value)}
                    placeholder="Contoh: RS Siloam Jakarta" />
                </div>

                <LocationFields value={location} onChange={setLocation} />

                <div className={styles.actionRow}>
                  <button className="btn btn--primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button className="btn" onClick={() => setEditing(false)} disabled={saving}>Batal</button>
                </div>
              </div>
            )}
          </section>

          {/* ── Keamanan ──────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Keamanan</h2>
              {!showPwForm && (
                <button className="btn" onClick={() => setShowPwForm(true)}>Ganti Password</button>
              )}
            </div>

            {!showPwForm ? (
              <p className={styles.note}>
                Gunakan password yang kuat dan tidak dipakai di layanan lain, karena akun ini dapat
                mengakses data kesehatan pasien.
              </p>
            ) : (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="docprof-current-pw">Password Saat Ini</label>
                  <input id="docprof-current-pw" type={showPw ? 'text' : 'password'} className="input" value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className="label" htmlFor="docprof-new-pw">Password Baru</label>
                    {/* Pengalih kata sandi memakai kata, bukan ikon mata. */}
                    <button
                      type="button"
                      className={styles.reveal}
                      onClick={() => setShowPw(v => !v)}
                      aria-pressed={showPw}
                    >
                      {showPw ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                  <input id="docprof-new-pw" type={showPw ? 'text' : 'password'} className="input" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" minLength={6} />
                </div>
                <div className={styles.actionRow}>
                  <button className="btn btn--primary" onClick={changePassword}
                    disabled={pwSaving || newPassword.length < 6 || !currentPassword}>
                    {pwSaving ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                  <button className="btn" onClick={() => { setShowPwForm(false); setCurrentPassword(''); setNewPassword(''); }}>
                    Batal
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── Tanggung jawab akses data ─────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Tanggung Jawab Akses Data</h2>
            </div>
            <p className={styles.note}>
              Akun ini dapat melihat data kesehatan pasien yang menautkan diri kepada Anda. Gunakan akses
              tersebut sebatas keperluan perawatan, dan lepaskan tautan bila hubungan perawatan telah
              berakhir. Pasien berhak menghapus riwayat maupun akunnya kapan saja.
            </p>
          </section>

          {/* Keluar adalah tindakan biasa yang bisa dibatalkan dengan masuk
              kembali, jadi ia tombol netral, bukan bidang merah. */}
          <div className={styles.logoutRow}>
            <button className="btn btn--block" onClick={() => { logout(); router.push('/login'); }}>
              Keluar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
