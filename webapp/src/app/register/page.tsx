'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import styles from '../login/auth.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      /* Langsung masuk memakai kredensial yang baru saja diketik.
         ─────────────────────────────────────────────────────────────────────
         Sebelumnya baris ini memanggil api.login, membuang hasilnya, lalu
         memindahkan pengguna ke /login, sehingga orang yang baru mendaftar
         harus mengetik email dan kata sandi yang sama untuk kedua kalinya
         berturut-turut. Konteks autentikasi memang tersedia di sini lewat
         useAuth, jadi tidak ada alasan menyimpan token itu lalu membuangnya. */
      const data = await api.login(email, password);
      login(data.user, data.token);

      /* Diarahkan sesuai peran, bukan ke satu tujuan tetap. Dokter yang tiba
         di dashboard pasien hanya akan dipantulkan kembali oleh penjaga
         rutenya sendiri. */
      router.replace(data.user.role === 'DOCTOR' ? '/doctor' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
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
                <ArrowLeft size={16} aria-hidden="true" />
                <span>{t('common.backHome')}</span>
              </Link>
            </div>
            <h1>{t('auth.createAccount')}</h1>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <form className={styles.fields} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className="label" htmlFor="reg-name">{t('auth.fullName')}</label>
            <input
              id="reg-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              required
            />
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="reg-email">{t('auth.email')}</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className="label" htmlFor="reg-password">{t('auth.password')}</label>
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
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={passwordTooShort || undefined}
              aria-describedby={passwordTooShort ? 'reg-password-error' : undefined}
            />
            {passwordTooShort && (
              <p id="reg-password-error" className={styles.error} role="alert">
                {t('auth.passwordTooShort')}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="reg-role">{lang === 'en' ? 'I am registering as:' : 'Saya mendaftar sebagai:'}</label>
            <select id="reg-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="PATIENT">{t('auth.patient')}</option>
              <option value="DOCTOR">{t('auth.doctor')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="reg-gender">{t('auth.gender')}{lang === 'en' ? ' (optional)' : ' (opsional)'}</label>
            <select id="reg-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t('auth.preferNotSay')}</option>
              <option value="M">{t('auth.male')}</option>
              <option value="F">{t('auth.female')}</option>
            </select>
          </div>

          {!isDoctor && (
            <div className={styles.field}>
              <label className="label" htmlFor="reg-dob">{t('auth.dateOfBirth')}</label>
              <input
                id="reg-dob"
                type="date"
                className="input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <span className={styles.hint}>
                {t('auth.dobHint')}
              </span>
            </div>
          )}

          {isDoctor && (
            <>
              <div className={styles.field}>
                <label className="label" htmlFor="reg-specialization">{t('prof.profession')}</label>
                <select id="reg-specialization" className="input" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required>
                  <option value="" disabled>{t('prof.selectProfession')}</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className="label" htmlFor="reg-institution">{t('prof.institutionLabel')}</label>
                <input
                  id="reg-institution"
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

            <button
              type="submit"
              className="btn btn--primary btn--lg btn--block"
              disabled={loading || passwordTooShort}
            >
              {loading ? t('common.loading') : t('auth.registerNow')}
            </button>
          </form>

          <p className={styles.footer}>
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className={styles.link}>
              {t('auth.loginHere')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
