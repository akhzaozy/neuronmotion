'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, UserProfile } from '@/lib/api';
import AppNav from '@/components/AppNav';
import LocationFields, { LocationValue } from '@/components/LocationFields';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { useI18n, dateLocale, type Lang } from '@/lib/i18n';
import styles from './profil.module.css';

const SPECIALIZATIONS = ['Neurolog', 'Dokter Umum', 'Fisioterapis', 'Perawat'];

function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function formatDob(dob: string | undefined, lang: Lang, fallback: string) {
  if (!dob) return fallback;
  return new Date(dob).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, token, login, logout, isLoading } = useAuth();
  const { t, lang } = useI18n();

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
      .catch(() => setError(t('prof.loadFailed')));
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
      setMessage(t('prof.saved'));
    } catch (e: any) {
      setError(e.message || t('prof.saveFailed'));
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
      setMessage(t('prof.pwSaved'));
    } catch (e: any) {
      setError(e.message || t('prof.pwFailed'));
    } finally {
      setBusy(false);
    }
  };

  const doDeleteHistory = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await api.deleteHistory(token!);
      setConfirmAction(null);
      setMessage(`${t('prof.histDeleted')} (${res.deletedCount} ${t('prof.sessions')}).`);
    } catch (e: any) {
      setError(e.message || t('prof.histDeleteFailed'));
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
      setError(e.message || t('prof.accDeleteFailed'));
      setConfirmAction(null);
      setBusy(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className={styles.page}>
        <AppNav />
        <div className={styles.container}><p>{t('prof.loading')}</p></div>
      </div>
    );
  }

  const age = calcAge(profile.dateOfBirth);

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar} data-no-translate="">{profile.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div className={styles.profileName} data-no-translate="">{profile.name}</div>
            <div className={styles.profileRole} data-no-translate={isDoctor ? '' : undefined}>
              {isDoctor
                ? `${profile.specialization || t('prof.doctorNakes')}${profile.institution ? ` · ${profile.institution}` : ''}`
                : t('dash.registeredPatient')}
            </div>
            <div className={styles.profileEmail} data-no-translate="">{profile.email}</div>
          </div>
        </div>

        {message && <div className={styles.successMsg}>{message}</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{t('prof.personalInfo')}</h2>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>{t('common.edit')}</button>
            )}
          </div>

          {!editing ? (
            <>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('prof.name')}</span>
                <span className={styles.infoValue} data-no-translate="">{profile.name}</span>
              </div>
              {!isDoctor && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('prof.dob')}</span>
                  <span className={styles.infoValue}>
                    {formatDob(profile.dateOfBirth, lang, t('common.notFilled'))}
                    {age !== null ? ` (${age} ${t('common.years')})` : ''}
                  </span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('prof.gender')}</span>
                <span className={styles.infoValue}>
                  {profile.gender === 'M' ? t('prof.male') : profile.gender === 'F' ? t('prof.female') : t('common.notFilled')}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('prof.region')}</span>
                <span className={styles.infoValue} data-no-translate="">
                  {[profile.city, profile.state, profile.countryName].filter(Boolean).join(', ') || t('common.notFilled')}
                </span>
              </div>
              {isDoctor && (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('prof.profession')}</span>
                    <span className={styles.infoValue}>{profile.specialization || t('common.notFilled')}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('prof.institution')}</span>
                    <span className={styles.infoValue} data-no-translate="">{profile.institution || t('common.notFilled')}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-name">{t('prof.fullName')}</label>
                <input id="prof-name" className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              {!isDoctor && (
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prof-dob">{t('prof.dob')}</label>
                  <input
                    id="prof-dob"
                    type="date"
                    className="input"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-gender">{t('prof.gender')}</label>
                <select id="prof-gender" className="input" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">{t('prof.preferNotSay')}</option>
                  <option value="M">{t('prof.male')}</option>
                  <option value="F">{t('prof.female')}</option>
                </select>
              </div>
              {isDoctor && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="prof-specialization">{t('prof.profession')}</label>
                    <select id="prof-specialization" className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                      <option value="">{t('prof.selectProfession')}</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="prof-institution">{t('prof.institutionLabel')}</label>
                    <input id="prof-institution" className="input" value={institution} onChange={e => setInstitution(e.target.value)} />
                  </div>
                </>
              )}

              <LocationFields
                value={location}
                onChange={setLocation}
                title={isDoctor ? t('loc.practice') : t('loc.residence')}
              />

              <div className={styles.actionRow}>
                <button className="btn btn-primary" onClick={saveProfile} disabled={busy}>
                  {busy && <span className="btnSpinner" />}{t('prof.saveChanges')}
                </button>
                <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={busy}>{t('common.cancel')}</button>
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{t('prof.security')}</h2>
            {!showPwForm && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowPwForm(true)}>{t('prof.changePassword')}</button>
            )}
          </div>

          {!showPwForm ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {t('prof.securityNote')}
            </p>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-current-pw">{t('prof.currentPassword')}</label>
                <input
                  id="prof-current-pw"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-new-pw">{t('prof.newPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="prof-new-pw"
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
                    aria-label={showPw ? t('prof.hidePassword') : t('prof.showPassword')}
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
                  {busy && <span className="btnSpinner" />}{t('prof.savePassword')}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowPwForm(false); setCurrentPassword(''); setNewPassword(''); }}
                  disabled={busy}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`${styles.card} ${styles.dangerZone}`}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 12 }}>{t('prof.privacyData')}</h2>
          <p className={styles.dangerNote}>
            {t('prof.privacyNote')}
          </p>
          <div className={styles.actionRow}>
            {!isDoctor && (
              <button className="btn btn-danger" onClick={() => setConfirmAction('history')} disabled={busy}>
                {t('prof.deleteHistory')}
              </button>
            )}
            <button className="btn btn-danger" onClick={() => setConfirmAction('account')} disabled={busy}>
              {t('prof.deleteMyAccount')}
            </button>
          </div>
        </div>

        <button className={`btn ${styles.logoutBtn}`} onClick={() => { logout(); router.push('/login'); }}>
          {t('common.logout')}
        </button>
      </div>

      {confirmAction && (
        <div className={styles.overlay} onClick={() => !busy && setConfirmAction(null)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>
              {confirmAction === 'history' ? t('prof.confirmHistTitle') : t('prof.confirmAccTitle')}
            </h3>
            <p className={styles.confirmText}>
              {confirmAction === 'history' ? t('prof.confirmHistText') : t('prof.confirmAccText')}
            </p>
            <div className={styles.actionRow}>
              <button
                className="btn btn-danger"
                onClick={confirmAction === 'history' ? doDeleteHistory : doDeleteAccount}
                disabled={busy}
              >
                {busy && <span className="btnSpinner" />}
                {confirmAction === 'history' ? t('prof.yesDeleteHist') : t('prof.yesDeleteAcc')}
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)} disabled={busy}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
