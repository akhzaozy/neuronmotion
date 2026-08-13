'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import styles from './auth.module.css';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { t, lang } = useI18n();

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Halaman skrining mengirim tujuan lewat ?next= ketika ia memindahkan
  // pengguna ke sini, supaya sesi bisa dilanjutkan di tempat yang sama.
  const next = params.get('next');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      const userRole = data.user.role;

      if (userRole !== 'PATIENT' && userRole !== 'DOCTOR') {
        setError(
          lang === 'en'
            ? `This account has the role "${userRole}", which cannot access this portal. Please contact an administrator.`
            : `Akun ini memiliki peran "${userRole}" yang tidak dapat mengakses portal ini. Hubungi administrator.`,
        );
        setLoading(false);
        return;
      }

      if (userRole !== role) {
        const actual = userRole === 'DOCTOR' ? t('auth.doctor') : t('auth.patient');
        setError(
          lang === 'en'
            ? `This account is registered as ${actual}. Choose the "${actual}" tab above.`
            : `Akun ini terdaftar sebagai ${actual}. Silakan pilih tab "${actual}" di atas.`,
        );
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      if (userRole === 'DOCTOR') router.push('/doctor');
      else router.push(next || '/dashboard');
    } catch (err) {
      setError(
        (err as Error).message ||
          (lang === 'en'
            ? 'Sign-in failed. Check your email and password.'
            : 'Gagal masuk. Periksa email dan kata sandi Anda.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <Link href="/" className={styles.brand}>
          <Logo size={16} />
        </Link>
        <div className={styles.barActions}>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>
      </header>

      <main className={styles.main} id="main">
        <div className={styles.form}>
          <div className="docHead">
            <div className="docHead__meta">
              <Link href="/" className={styles.backLink}>
                {t('common.backHome')}
              </Link>
            </div>
            <h1>{t('auth.welcome')}</h1>
          </div>

          {/* Peran dipilih lewat dua tombol berlabel teks penuh. */}
          <div className={styles.roleGroup} role="group" aria-label={t('auth.roleLabel')}>
            {(['PATIENT', 'DOCTOR'] as const).map(r => (
              <button
                key={r}
                type="button"
                className={styles.roleOption}
                aria-pressed={role === r}
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
              >
                {r === 'PATIENT' ? t('auth.patient') : t('auth.doctor')}
              </button>
            ))}
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.fields}>
            <div className={styles.field}>
              <label className="label" htmlFor="login-email">
                {t('auth.email')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className="label" htmlFor="login-password">
                  {t('auth.password')}
                </label>
                {/* Pengalih kata sandi memakai kata, bukan ikon mata, dan tetap
                    bisa dijangkau keyboard. */}
                <button
                  type="button"
                  className={styles.reveal}
                  onClick={() => setShowPassword(v => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading
                ? t('common.loading')
                : role === 'DOCTOR'
                  ? t('auth.loginAsDoctor')
                  : t('auth.loginAsPatient')}
            </button>
          </form>

          <p className={styles.footer}>
            {t('auth.noAccount')}{' '}
            <Link href="/register" className={styles.link}>
              {t('auth.registerHere')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
