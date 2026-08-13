'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from '@/components/icons';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import styles from '../login/auth.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

export default function RegisterPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState<LocationValue>({});
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
        country: location.country,
        countryName: location.countryName,
        region: location.region,
        state: location.state,
        city: location.city,
      });
      // Auto-login after register
      const data = await api.login(email, password);
      // We don't have direct access to auth context here without wrapping or importing,
      // but usually register redirects to login or handles it.
      // Let's just redirect to login for simplicity.
      router.push('/login');
    } catch (err: any) {
      setError(err.message || t('auth.registerFailed'));
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
          <h1 className={styles.title}>{t('auth.createAccount')}</h1>
          <p className={styles.subtitle}>{lang === 'en' ? 'Start early detection today' : 'Mulai deteksi dini hari ini'}</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.fullName')}</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.email')}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.password')}</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                minLength={6}
                style={passwordTooShort ? { borderColor: 'var(--red)' } : undefined}
              />
              <button
                type="button"
                className={styles.togglePw}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? t('prof.hidePassword') : t('prof.showPassword')}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordTooShort && (
              <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>{t('auth.passwordTooShort')}</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{lang === 'en' ? 'I am registering as:' : 'Saya mendaftar sebagai:'}</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="PATIENT">{t('auth.patient')}</option>
              <option value="DOCTOR">{t('auth.doctor')}</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.gender')}{lang === 'en' ? ' (optional)' : ' (opsional)'}</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t('auth.preferNotSay')}</option>
              <option value="M">{t('auth.male')}</option>
              <option value="F">{t('auth.female')}</option>
            </select>
          </div>

          {!isDoctor && (
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('auth.dateOfBirth')}</label>
              <input
                type="date"
                className="input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {t('auth.dobHint')}
              </span>
            </div>
          )}

          {isDoctor && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('prof.profession')}</label>
                <select className="input" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required>
                  <option value="" disabled>{t('prof.selectProfession')}</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('prof.institutionLabel')}</label>
                <input
                  type="text"
                  className="input"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={t('auth.institutionPlaceholder')}
                  required
                />
              </div>
            </>
          )}

          <LocationFields
            value={location}
            onChange={setLocation}
            title={isDoctor ? t('loc.practice') : t('loc.residence')}
            hint={isDoctor ? t('loc.hintDoctor') : t('loc.hintPatient')}
          />

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || passwordTooShort} style={{ marginTop: 10 }}>
            {loading && <span className="btnSpinner" />}
            {loading ? t('common.loading') : t('auth.registerNow')}
          </button>
        </form>

        <div className={styles.footer}>
          {t('auth.hasAccount')} <Link href="/login" className={styles.link}>{t('auth.loginHere')}</Link>
        </div>
      </div>
    </div>
  );
}
