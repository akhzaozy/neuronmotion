'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, PersonIcon, StethoscopeIcon } from '@/components/icons';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, lang } = useI18n();
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
      const userRole = data.user.role;

      // Validasi tab yang dipilih cocok dengan role akun di database.
      // Hanya berlaku untuk PATIENT & DOCTOR. Role lain (misal ADMIN) tidak
      // termasuk dalam pilihan tab, jadi langsung tampilkan pesan informatif.
      if (userRole !== 'PATIENT' && userRole !== 'DOCTOR') {
        setError(lang === 'en'
          ? `This account has the role "${userRole}", which cannot access this portal. Please contact an administrator.`
          : `Akun ini memiliki peran "${userRole}" yang tidak dapat mengakses portal ini. Hubungi administrator.`);
        setLoading(false);
        return;
      }

      if (userRole !== role) {
        const actualLabel = userRole === 'DOCTOR' ? t('auth.doctor') : t('auth.patient');
        setError(lang === 'en'
          ? `This account is registered as ${actualLabel}. Please select the "${actualLabel}" tab above.`
          : `Akun ini terdaftar sebagai ${actualLabel}. Silakan pilih tab "${actualLabel}" di atas.`);
        setLoading(false);
        return;
      }

      login(data.user, data.token);

      if (userRole === 'DOCTOR') {
        router.push('/doctor');
      } else if (userRole === 'PATIENT') {
        router.push('/dashboard');
      } else {
        // Fallback aman, jangan biarkan route ke halaman yang tidak ada
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || (lang === 'en'
        ? 'Sign-in failed. Check your email and password.'
        : 'Gagal login. Periksa email dan password Anda.'));
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

      <Link href="/" className={styles.backHome}>
        <ArrowLeftIcon />
        {t('common.backHome')}
      </Link>

      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 2, display: 'flex', gap: 10, alignItems: 'center' }}>
        <LanguageToggle />
        <ThemeToggle size="sm" />
      </div>

      <div className={`${styles.authCard} glass`}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo} aria-label={t('common.backHome')}>
            <Logo />
          </Link>
          <h1 className={styles.title}>{t('auth.welcome')}</h1>
          <p className={styles.subtitle}>
            {lang === 'en'
              ? `Sign in as ${role === 'DOCTOR' ? 'a clinician' : 'a patient'}`
              : `Masuk sebagai ${role === 'DOCTOR' ? 'dokter / tenaga kesehatan' : 'pasien'}`}
          </p>
        </div>

        <div className={styles.roleTabs}>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'PATIENT' ? styles.roleTabActive : ''}`}
            onClick={() => { setRole('PATIENT'); setError(''); }}
          >
            <PersonIcon size={17} /> {t('auth.patient')}
          </button>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'DOCTOR' ? styles.roleTabActive : ''}`}
            onClick={() => { setRole('DOCTOR'); setError(''); }}
          >
            <StethoscopeIcon size={17} /> {t('auth.doctor')}
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-email">{t('auth.email')}</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`${lang === 'en' ? 'e.g.' : 'Contoh:'} ${role === 'DOCTOR' ? 'dokter' : 'pasien'}@neuronmotion.id`}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-password">{t('auth.password')}</label>
            <div className={styles.passwordWrap}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'en' ? 'Enter your password' : 'Masukkan password'}
                required
              />
              <button
                type="button"
                className={styles.togglePw}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword
                  ? (lang === 'en' ? 'Hide password' : 'Sembunyikan password')
                  : (lang === 'en' ? 'Show password' : 'Tampilkan password')}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 10 }}>
            {loading && <span className="btnSpinner" />}
            {loading ? t('common.loading') : (role === 'DOCTOR' ? t('auth.loginAsDoctor') : t('auth.loginAsPatient'))}
          </button>
        </form>

        <div className={styles.footer}>
          {t('auth.noAccount')} <Link href="/register" className={styles.link}>{t('auth.registerHere')}</Link>
        </div>
      </div>
    </div>
  );
}
