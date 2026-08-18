'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  AlertCircle,
  Info,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import ProcessButton from '@/components/ProcessButton';
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

  // AuthProvider menambahkan ?expired=1 ketika server menolak token yang
  // sudah lewat 24 jam. Tanpa penanda ini, pengguna tiba di halaman masuk
  // tanpa tahu mengapa ia dikeluarkan dari alat kesehatan yang menyimpan
  // riwayat pemeriksaannya.
  const sessionExpired = params.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email.trim().toLowerCase(), password);
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
        <Link href="/" className={styles.brand} aria-label="NeuronMotion Home">
          <Logo size={16} />
        </Link>
        <div className={styles.barActions}>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>
      </header>

      <main className={styles.main} id="main">
        <div className={styles.form}>
          <div className={styles.cardHead}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t('common.backHome')}</span>
            </Link>
            <h1 className={styles.cardTitle}>{t('auth.welcome')}</h1>
            <p className={styles.cardSubtitle}>{t('auth.welcomeSubtitle')}</p>
          </div>

          {/* Pemberitahuan sesi berakhir */}
          {sessionExpired && (
            <div className={styles.notice} role="status">
              <Info size={18} className={styles.noticeIcon} aria-hidden="true" />
              <div className={styles.noticeText}>
                <p className={styles.noticeTitle}>{t('session.expiredTitle')}</p>
                <p className={styles.noticeBody}>{t('session.expiredBody')}</p>
              </div>
            </div>
          )}

          {/* Pilihan peran dengan ikon dan helper */}
          <div className={styles.roleSection}>
            <div className={styles.roleGroup} role="group" aria-label={t('auth.roleLabel')}>
              <button
                type="button"
                className={styles.roleOption}
                aria-pressed={role === 'PATIENT'}
                onClick={() => {
                  setRole('PATIENT');
                  setError('');
                }}
              >
                <User size={16} aria-hidden="true" />
                <span>{t('auth.patient')}</span>
              </button>
              <button
                type="button"
                className={styles.roleOption}
                aria-pressed={role === 'DOCTOR'}
                onClick={() => {
                  setRole('DOCTOR');
                  setError('');
                }}
              >
                <Stethoscope size={16} aria-hidden="true" />
                <span>{t('auth.doctor')}</span>
              </button>
            </div>
            <p className={styles.roleHint}>
              {role === 'PATIENT' ? t('auth.patientDesc') : t('auth.doctorDesc')}
            </p>
          </div>

          {/* Pesan galat */}
          {error && (
            <div className={styles.error} role="alert">
              <AlertCircle size={18} className={styles.errorIcon} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.fields} noValidate>
            <div className={styles.field}>
              <label className="label" htmlFor="login-email">
                {t('auth.email')}
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`input ${styles.inputWithIcon}`}
                  placeholder={lang === 'en' ? 'name@email.com' : 'nama@email.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className="label" htmlFor="login-password">
                  {t('auth.password')}
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input ${styles.inputWithIconAndAction}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <ProcessButton
              type="submit"
              size="lg"
              fullWidth
              status={loading ? 'loading' : 'idle'}
              disabled={loading || !email.trim() || !password}
              loadingText={t('common.loading')}
            >
              {role === 'DOCTOR' ? t('auth.loginAsDoctor') : t('auth.loginAsPatient')}
            </ProcessButton>
          </form>

          <div className={styles.footer}>
            <p style={{ margin: 0 }}>
              {t('auth.noAccount')}{' '}
              <Link href="/register" className={styles.link}>
                {t('auth.registerHere')}
              </Link>
            </p>
            <div className={styles.securityNote}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>{lang === 'en' ? 'Encrypted & HIPAA/GDPR aware privacy' : 'Terenkripsi & Perlindungan Privasi Data Klinis'}</span>
            </div>
          </div>
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
