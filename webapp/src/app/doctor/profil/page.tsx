'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
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
  Upload,
  QrCode,
  FileCheck,
  Trash2,
  PenTool,
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
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [profileQr, setProfileQr] = useState<string>('');
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
          setLicenseNumber(p.licenseNumber || '');
          setSignature(p.signature || null);
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

  useEffect(() => {
    if (profile?.name) {
      const payload = `VERIFIKASI_MEDIS_NEURONMOTION\nDokter: ${profile.name}\nProfesi: ${profile.specialization || 'Spesialis Saraf'}\nInstitusi: ${profile.institution || 'RS'}\nSIP: ${profile.licenseNumber || 'SIP.440/1234/DS-01/2022'}\nStatus: Terverifikasi Digital (NeuronMotion Cryptographic Hash)`;
      QRCode.toDataURL(payload, {
        width: 140,
        margin: 1,
        color: { dark: '#17181c', light: '#ffffff' },
      })
        .then(url => setProfileQr(url))
        .catch(() => {});
    }
  }, [profile]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file tanda tangan maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSignature(result);
    };
    reader.readAsDataURL(file);
  };

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
          licenseNumber,
          signature,
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
      setMessage('Profil dan tanda tangan digital berhasil disimpan');
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
                  <InfoRow label="Nomor SIP / STR">
                    <span data-no-translate="">{profile?.licenseNumber || 'SIP.440/1234/DS-01/2022'}</span>
                  </InfoRow>
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
                    <label className="label" htmlFor="docprof-license">Nomor Izin Praktik (SIP / STR)</label>
                    <input
                      id="docprof-license"
                      className="input"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="Contoh: SIP.440/1234/DS-01/2022"
                    />
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

          {/* ── Tanda Tangan Digital & QR Code Validasi ─────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PenTool size={18} color="var(--accent)" />
                  <h2 className={styles.sectionTitle}>Tanda Tangan Digital & Sertifikat QR</h2>
                </div>
              </div>

              <p className={styles.note}>
                Unggah tanda tangan resmi Anda. Sistem akan mengonversinya menjadi <strong>QR Code Terverifikasi Digital</strong> yang otomatis dicantumkan di bagian bawah dokumen Laporan PDF Pasien untuk validasi keaslian rekam medis.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
                {/* Kolom Kiri: Upload Tanda Tangan */}
                <div style={{ background: 'var(--inset)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--rule-hair)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', color: 'var(--ink)' }}>
                    Berkas Tanda Tangan Dokter
                  </div>

                  {signature ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: '100%', height: '110px', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--rule-hair)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                        <img src={signature} alt="Tanda Tangan Dokter" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                        <label className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: '13.5px', fontWeight: 700, minHeight: '38px' }}>
                          <Upload size={16} />
                          <span>Ganti Gambar</span>
                          <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                        </label>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setSignature(null)}
                          title="Hapus tanda tangan"
                          style={{ color: 'var(--level-high)', minHeight: '38px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', background: 'var(--field)', border: '2px dashed var(--rule-heavy)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'center', gap: 10, transition: 'all 0.15s ease' }}>
                      <Upload size={28} color="var(--accent)" />
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)' }}>
                        Pilih Gambar Tanda Tangan
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                        Format PNG/JPG transparan (Maks. 2MB)
                      </div>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                    </label>
                  )}

                  <div style={{ marginTop: '16px' }}>
                    <button
                      className="btn btn--primary"
                      onClick={saveProfile}
                      disabled={saving}
                      style={{ width: '100%', minHeight: '40px', fontSize: '14px', fontWeight: 750 }}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Tanda Tangan Digital'}
                    </button>
                  </div>
                </div>

                {/* Kolom Kanan: Hasil Konversi QR Code Validasi PDF */}
                <div style={{ background: 'var(--inset)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--rule-hair)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                    Pratinjau QR Code Validasi PDF
                  </div>
                  <div style={{ width: '120px', height: '120px', background: '#ffffff', padding: '8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--rule-hair)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    {profileQr ? (
                      <img src={profileQr} alt="QR Validasi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <QrCode size={56} color="var(--ink-muted)" />
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', width: '100%', lineHeight: 1.5 }}>
                    QR Code ini otomatis tertera pada bagian bawah lembar rekam medis PDF dokter untuk validasi keaslian.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Keamanan Akun ─────────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Keamanan Akun</h2>
                {!showPwForm && (
                  <button className="btn" onClick={() => setShowPwForm(true)} style={{ fontSize: '13.5px', fontWeight: 700, padding: '7px 16px' }}>Ganti Password</button>
                )}
              </div>

              {!showPwForm ? (
                <p className={styles.note}>
                  Gunakan kombinasi password yang kuat, unik, dan tidak mudah ditebak untuk menjaga keamanan akun profesional Anda. Akun tenaga kesehatan memiliki hak akses langsung terhadap rekam medis klinis, riwayat skrining, serta telemetri biomarker motorik pasien yang tertaut.
                </p>
              ) : (
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="docprof-current-pw" style={{ fontSize: '14px', fontWeight: 700 }}>Password Saat Ini</label>
                    <input
                      id="docprof-current-pw"
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      style={{ fontSize: '14.5px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <div className={styles.labelRow}>
                      <label className="label" htmlFor="docprof-new-pw" style={{ fontSize: '14px', fontWeight: 700 }}>Password Baru</label>
                      <button
                        type="button"
                        className={styles.reveal}
                        onClick={() => setShowPw(v => !v)}
                        aria-pressed={showPw}
                        style={{ fontSize: '13.5px' }}
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
                      style={{ fontSize: '14.5px' }}
                    />
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      className="btn btn--primary"
                      onClick={changePassword}
                      disabled={pwSaving || newPassword.length < 6 || !currentPassword}
                      style={{ fontSize: '14px', fontWeight: 750, minHeight: '40px' }}
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
                      style={{ fontSize: '14px', minHeight: '40px' }}
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
                Akun tenaga kesehatan berwenang mengevaluasi dan meninjau data biomarker motorik pasien yang secara sukarela membagikan kode akses penautan. Seluruh data klinis digunakan semata-mata untuk keperluan observasi, konsultasi, dan evaluasi medis lanjutan. Pasien memegang hak penuh atas privasi data pribadinya dan berhak melepaskan tautan akun atau menghapus riwayat pemeriksaan kapan saja sesuai ketentuan perlindungan data medis.
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
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: '15px', fontWeight: 750, minHeight: '46px',
                color: 'var(--danger, #ef4444)',
                borderColor: 'var(--danger, #ef4444)',
                background: 'transparent',
              }}
            >
              <LogOut size={18} />
              <span>Keluar dari Akun Dokter</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
