'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import styles from '../login/auth.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 6;
  const isDoctor = role === 'DOCTOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register({
        email, password, name, role, gender,
        dateOfBirth: !isDoctor && dateOfBirth ? dateOfBirth : undefined,
        specialization: isDoctor ? specialization : undefined,
        institution: isDoctor ? institution : undefined,
      });
      // Auto-login after register
      const data = await api.login(email, password);
      // We don't have direct access to auth context here without wrapping or importing,
      // but usually register redirects to login or handles it.
      // Let's just redirect to login for simplicity.
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Email mungkin sudah terpakai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgElements}>
        <div className={styles.circle1} />
        <div className={styles.circle2} />
      </div>

      <div className={`${styles.authCard} glass`}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo} aria-label="Kembali ke beranda">
            <Logo />
          </Link>
          <h1 className={styles.title}>Buat Akun</h1>
          <p className={styles.subtitle}>Mulai deteksi dini hari ini</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nama Lengkap</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: budi@email.com"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                style={passwordTooShort ? { borderColor: 'var(--red)' } : undefined}
              />
              <button
                type="button"
                className={styles.togglePw}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordTooShort && (
              <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>Password minimal 6 karakter</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Saya mendaftar sebagai:</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="PATIENT">Pasien</option>
              <option value="DOCTOR">Dokter / Nakes</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Jenis Kelamin (opsional)</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Tidak ingin menyebutkan</option>
              <option value="M">Laki-laki</option>
              <option value="F">Perempuan</option>
            </select>
          </div>

          {!isDoctor && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Tanggal Lahir</label>
              <input
                type="date"
                className="input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Dipakai untuk membandingkan hasil skrining dengan rentang normal sesuai kelompok usia Anda.
              </span>
            </div>
          )}

          {isDoctor && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profesi</label>
                <select className="input" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required>
                  <option value="" disabled>Pilih profesi</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Institusi / Tempat Praktik</label>
                <input
                  type="text"
                  className="input"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: RS Siloam Jakarta"
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || passwordTooShort} style={{ marginTop: 10 }}>
            {loading && <span className="btnSpinner" />}
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className={styles.footer}>
          Sudah punya akun? <Link href="/login" className={styles.link}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
