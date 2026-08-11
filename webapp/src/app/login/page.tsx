'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);

      // Validasi tab yang dipilih cocok dengan role akun sungguhan,
      // supaya pasien & dokter tidak salah masuk ke portal yang salah.
      if (data.user.role !== role) {
        const actualLabel = data.user.role === 'DOCTOR' ? 'Dokter / Nakes' : 'Pasien';
        setError(`Akun ini terdaftar sebagai ${actualLabel}. Silakan pilih tab "${actualLabel}" di atas.`);
        setLoading(false);
        return;
      }

      login(data.user, data.token);

      if (data.user.role === 'DOCTOR') {
        router.push('/doctor');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login. Periksa email dan password Anda.');
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
          <h1 className={styles.title}>Selamat Datang</h1>
          <p className={styles.subtitle}>
            Masuk sebagai {role === 'DOCTOR' ? 'dokter / tenaga kesehatan' : 'pasien'}
          </p>
        </div>

        <div className={styles.roleTabs}>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'PATIENT' ? styles.roleTabActive : ''}`}
            onClick={() => { setRole('PATIENT'); setError(''); }}
          >
            🧍 Pasien
          </button>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'DOCTOR' ? styles.roleTabActive : ''}`}
            onClick={() => { setRole('DOCTOR'); setError(''); }}
          >
            🩺 Dokter / Nakes
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'DOCTOR' ? 'Contoh: dokter@neuronmotion.id' : 'Contoh: pasien@neuronmotion.id'}
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
                placeholder="Masukkan password"
                required
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
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 10 }}>
            {loading && <span className="btnSpinner" />}
            {loading ? 'Memproses...' : `Masuk sebagai ${role === 'DOCTOR' ? 'Dokter/Nakes' : 'Pasien'}`}
          </button>
        </form>

        <div className={styles.footer}>
          Belum punya akun? <Link href="/register" className={styles.link}>Daftar di sini</Link>
        </div>
      </div>
    </div>
  );
}
