'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, UserProfile } from '@/lib/api';
import AppNav from '@/components/AppNav';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import styles from './profil.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function formatDob(dob?: string) {
  if (!dob) return 'Belum diisi';
  return new Date(dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, token, login, logout, isLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState<LocationValue>({});
  const [specialization, setSpecialization] = useState('');
  const [institution, setInstitution] = useState('');

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [confirmAction, setConfirmAction] = useState<'history' | 'account' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) { router.push('/login'); return; }

    api.getMe(token)
      .then(p => {
        setProfile(p);
        setName(p.name || '');
        setGender(p.gender || '');
        setDateOfBirth(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '');
        setLocation({ country: p.country, countryName: p.countryName, region: p.region, state: p.state, city: p.city });
        setSpecialization(p.specialization || '');
        setInstitution(p.institution || '');
      })
      .catch(() => setError('Gagal memuat profil.'));
  }, [user, token, isLoading, router]);

  const isDoctor = profile?.role === 'DOCTOR';

  const saveProfile = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await api.updateProfile(
        {
          name, gender, dateOfBirth: dateOfBirth || undefined, specialization, institution,
          country: location.country, countryName: location.countryName,
          region: location.region, state: location.state, city: location.city,
        },
        token!
      );
      setProfile(updated);
      // Sinkronkan juga data user di context supaya nama di navbar/sapaan ikut berubah
      login(updated, token!);
      setEditing(false);
      setMessage('Data pribadi berhasil diperbarui.');
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan perubahan.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      await api.changePassword(currentPassword, newPassword, token!);
      setShowPwForm(false);
      setCurrentPassword(''); setNewPassword('');
      setMessage('Password berhasil diperbarui.');
    } catch (e: any) {
      setError(e.message || 'Gagal mengganti password.');
    } finally {
      setBusy(false);
    }
  };

  const doDeleteHistory = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await api.deleteHistory(token!);
      setConfirmAction(null);
      setMessage(`Riwayat pemeriksaan berhasil dihapus (${res.deletedCount} sesi).`);
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus riwayat.');
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  };

  const doDeleteAccount = async () => {
    setBusy(true); setError('');
    try {
      await api.deleteAccount(token!);
      logout();
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus akun.');
      setConfirmAction(null);
      setBusy(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className={styles.page}>
        <AppNav />
        <div className={styles.container}><p>Memuat profil...</p></div>
      </div>
    );
  }

  const age = calcAge(profile.dateOfBirth);

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{profile.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div className={styles.profileName}>{profile.name}</div>
            <div className={styles.profileRole}>
              {isDoctor
                ? `${profile.specialization || 'Dokter / Nakes'}${profile.institution ? ` · ${profile.institution}` : ''}`
                : 'Pasien Terdaftar'}
            </div>
            <div className={styles.profileEmail}>{profile.email}</div>
          </div>
        </div>

        {message && <div className={styles.successMsg}>{message}</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Informasi Pribadi</h2>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Ubah</button>
            )}
          </div>

          {!editing ? (
            <>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama</span>
                <span className={styles.infoValue}>{profile.name}</span>
              </div>
              {!isDoctor && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tanggal Lahir</span>
                  <span className={styles.infoValue}>
                    {formatDob(profile.dateOfBirth)}{age !== null ? ` (${age} tahun)` : ''}
                  </span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jenis Kelamin</span>
                <span className={styles.infoValue}>
                  {profile.gender === 'M' ? 'Laki-laki' : profile.gender === 'F' ? 'Perempuan' : 'Belum diisi'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Wilayah</span>
                <span className={styles.infoValue}>
                  {[profile.city, profile.state, profile.countryName].filter(Boolean).join(', ') || 'Belum diisi'}
                </span>
              </div>
              {isDoctor && (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Profesi</span>
                    <span className={styles.infoValue}>{profile.specialization || 'Belum diisi'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Institusi</span>
                    <span className={styles.infoValue}>{profile.institution || 'Belum diisi'}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Lengkap</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              {!isDoctor && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tanggal Lahir</label>
                  <input
                    type="date"
                    className="input"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label}>Jenis Kelamin</label>
                <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Tidak ingin menyebutkan</option>
                  <option value="M">Laki-laki</option>
                  <option value="F">Perempuan</option>
                </select>
              </div>
              {isDoctor && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Profesi</label>
                    <select className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                      <option value="">Pilih profesi</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Institusi / Tempat Praktik</label>
                    <input className="input" value={institution} onChange={e => setInstitution(e.target.value)} />
                  </div>
                </>
              )}

              <LocationFields
                value={location}
                onChange={setLocation}
                title={isDoctor ? 'Wilayah Praktik' : 'Wilayah Tempat Tinggal'}
              />

              <div className={styles.actionRow}>
                <button className="btn btn-primary" onClick={saveProfile} disabled={busy}>
                  {busy && <span className="btnSpinner" />}Simpan Perubahan
                </button>
                <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={busy}>Batal</button>
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

          {!showPwForm ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Gunakan password yang kuat dan tidak dipakai di layanan lain.
            </p>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password Saat Ini</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password Baru (minimal 6 karakter)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    style={{ paddingRight: 44 }}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                    style={{
                      position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', color: 'var(--text-muted)', padding: 6,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className={styles.actionRow}>
                <button
                  className="btn btn-primary"
                  onClick={savePassword}
                  disabled={busy || !currentPassword || newPassword.length < 6}
                >
                  {busy && <span className="btnSpinner" />}Simpan Password
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowPwForm(false); setCurrentPassword(''); setNewPassword(''); }}
                  disabled={busy}
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`${styles.card} ${styles.dangerZone}`}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 12 }}>Privasi dan Data</h2>
          <p className={styles.dangerNote}>
            Sesuai UU Perlindungan Data Pribadi, Anda berhak menghapus data Anda kapan saja.
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
          </p>
          <div className={styles.actionRow}>
            {!isDoctor && (
              <button className="btn btn-danger" onClick={() => setConfirmAction('history')} disabled={busy}>
                Hapus Riwayat
              </button>
            )}
            <button className="btn btn-danger" onClick={() => setConfirmAction('account')} disabled={busy}>
              Hapus Akun Saya
            </button>
          </div>
        </div>

        <button className={`btn ${styles.logoutBtn}`} onClick={() => { logout(); router.push('/login'); }}>
          Keluar
        </button>
      </div>

      {confirmAction && (
        <div className={styles.overlay} onClick={() => !busy && setConfirmAction(null)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>
              {confirmAction === 'history' ? 'Hapus Semua Riwayat?' : 'Hapus Akun Secara Permanen?'}
            </h3>
            <p className={styles.confirmText}>
              {confirmAction === 'history'
                ? 'Seluruh sesi pemeriksaan Anda, termasuk skor risiko dan catatan dari nakes, akan dihapus permanen. Akun Anda tetap aktif dan Anda masih bisa melakukan skrining baru.'
                : 'Akun Anda beserta seluruh riwayat pemeriksaan dan data profil akan dihapus permanen. Anda akan langsung keluar dari aplikasi dan data ini tidak dapat dipulihkan.'}
            </p>
            <div className={styles.actionRow}>
              <button
                className="btn btn-danger"
                onClick={confirmAction === 'history' ? doDeleteHistory : doDeleteAccount}
                disabled={busy}
              >
                {busy && <span className="btnSpinner" />}
                {confirmAction === 'history' ? 'Ya, Hapus Riwayat' : 'Ya, Hapus Akun Saya'}
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)} disabled={busy}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
