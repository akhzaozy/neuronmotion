'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, UserProfile } from '@/lib/api';
import DoctorNav from '@/components/DoctorNav';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import styles from '../../profil/profil.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

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
        <div className={styles.container}><p>Memuat profil...</p></div>
      </div>
    );
  }

  const locationText = [profile?.city, profile?.state, profile?.countryName]
    .filter(Boolean).join(', ') || 'Belum diisi';

  return (
    <div className={styles.page}>
      <DoctorNav />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{profile?.name?.charAt(0) || 'D'}</div>
          <div>
            <div className={styles.profileName}>{profile?.name}</div>
            <div className={styles.profileRole}>
              {profile?.specialization || 'Tenaga Kesehatan'}
              {profile?.institution ? ` · ${profile.institution}` : ''}
            </div>
            <div className={styles.profileEmail}>{profile?.email}</div>
          </div>
        </div>

        {message && <div className={styles.successMsg}>{message}</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Data Profesional</h2>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Ubah</button>
            )}
          </div>

          {editing ? (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Lengkap</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profesi</label>
                <select className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                  <option value="">Pilih profesi</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Institusi / Tempat Praktik</label>
                <input className="input" value={institution} onChange={e => setInstitution(e.target.value)}
                  placeholder="Contoh: RS Siloam Jakarta" />
              </div>

              <LocationFields value={location} onChange={setLocation} />

              <div className={styles.actionRow}>
                <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>Batal</button>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving && <span className="btnSpinner" />}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama</span>
                <span className={styles.infoValue}>{profile?.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Profesi</span>
                <span className={styles.infoValue}>{profile?.specialization || 'Belum diisi'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Institusi</span>
                <span className={styles.infoValue}>{profile?.institution || 'Belum diisi'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Wilayah Praktik</span>
                <span className={styles.infoValue}>{locationText}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{profile?.email}</span>
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Keamanan</h2>
            {!showPwForm && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowPwForm(true)}>Ganti Password</button>
            )}
          </div>
          {showPwForm ? (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password Saat Ini</label>
                <input type="password" className="input" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password Baru</label>
                <input type="password" className="input" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
              </div>
              <div className={styles.actionRow}>
                <button className="btn btn-outline" onClick={() => { setShowPwForm(false); setCurrentPassword(''); setNewPassword(''); }}>
                  Batal
                </button>
                <button className="btn btn-primary" onClick={changePassword}
                  disabled={pwSaving || newPassword.length < 6 || !currentPassword}>
                  {pwSaving && <span className="btnSpinner" />}
                  {pwSaving ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Gunakan password yang kuat dan tidak dipakai di layanan lain, karena akun ini dapat
              mengakses data kesehatan pasien.
            </p>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 12 }}>Tanggung Jawab Akses Data</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            Akun ini dapat melihat data kesehatan pasien yang menautkan diri kepada Anda. Gunakan akses
            tersebut sebatas keperluan perawatan, dan lepaskan tautan bila hubungan perawatan telah
            berakhir. Pasien berhak menghapus riwayat maupun akunnya kapan saja.
          </p>
          <button className={styles.logoutBtn} style={{ marginTop: 18 }}
            onClick={() => { logout(); router.push('/login'); }}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
