'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/auth';
import { api, UserProfile } from '@/lib/api';
import AppNav from '@/components/AppNav';
import LocationFields, { LocationValue } from '@/components/LocationFields';
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

/** Satu baris keterangan: label di kiri, nilai di kanan, dipisah garis rambut. */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <dt className={`label ${styles.infoLabel}`}>{label}</dt>
      <dd className={styles.infoValue}>{children}</dd>
    </div>
  );
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
        <main className="sheet">
          <p className={styles.loading} role="status" aria-live="polite">
            {t('prof.loading')}
          </p>
        </main>
      </div>
    );
  }

  const age = calcAge(profile.dateOfBirth);

  return (
    <div className={styles.page}>
      <AppNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span data-no-translate={isDoctor ? '' : undefined}>
                {isDoctor
                  ? `${profile.specialization || t('prof.doctorNakes')}${profile.institution ? ` · ${profile.institution}` : ''}`
                  : t('dash.registeredPatient')}
              </span>
              <span data-no-translate="">{profile.email}</span>
            </div>
            <h1 data-no-translate="">{profile.name}</h1>
          </header>

          {message && (
            <p className={styles.successMsg} role="status">{message}</p>
          )}
          {error && (
            <p className={styles.errorMsg} role="alert">{error}</p>
          )}

          {/* ── Data pribadi ──────────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('prof.personalInfo')}</h2>
              {!editing && (
                <button className="btn" onClick={() => setEditing(true)}>{t('common.edit')}</button>
              )}
            </div>

            {!editing ? (
              <dl className={styles.infoList}>
                <InfoRow label={t('prof.name')}>
                  <span data-no-translate="">{profile.name}</span>
                </InfoRow>
                {!isDoctor && (
                  <InfoRow label={t('prof.dob')}>
                    {formatDob(profile.dateOfBirth, lang, t('common.notFilled'))}
                    {age !== null ? ` (${age} ${t('common.years')})` : ''}
                  </InfoRow>
                )}
                <InfoRow label={t('prof.gender')}>
                  {profile.gender === 'M' ? t('prof.male') : profile.gender === 'F' ? t('prof.female') : t('common.notFilled')}
                </InfoRow>
                <InfoRow label={t('prof.region')}>
                  <span data-no-translate="">
                    {[profile.city, profile.state, profile.countryName].filter(Boolean).join(', ') || t('common.notFilled')}
                  </span>
                </InfoRow>
                {isDoctor && (
                  <>
                    <InfoRow label={t('prof.profession')}>
                      {profile.specialization || t('common.notFilled')}
                    </InfoRow>
                    <InfoRow label={t('prof.institution')}>
                      <span data-no-translate="">{profile.institution || t('common.notFilled')}</span>
                    </InfoRow>
                  </>
                )}
              </dl>
            ) : (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="prof-name">{t('prof.fullName')}</label>
                  <input id="prof-name" className="input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                {!isDoctor && (
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="prof-dob">{t('prof.dob')}</label>
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
                  <label className="label" htmlFor="prof-gender">{t('prof.gender')}</label>
                  <select id="prof-gender" className="input" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">{t('prof.preferNotSay')}</option>
                    <option value="M">{t('prof.male')}</option>
                    <option value="F">{t('prof.female')}</option>
                  </select>
                </div>
                {isDoctor && (
                  <>
                    <div className={styles.formGroup}>
                      <label className="label" htmlFor="prof-specialization">{t('prof.profession')}</label>
                      <select id="prof-specialization" className="input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                        <option value="">{t('prof.selectProfession')}</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="label" htmlFor="prof-institution">{t('prof.institutionLabel')}</label>
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
                  <button className="btn btn--primary" onClick={saveProfile} disabled={busy}>
                    {busy ? t('common.loading') : t('prof.saveChanges')}
                  </button>
                  <button className="btn" onClick={() => setEditing(false)} disabled={busy}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── Keamanan ──────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('prof.security')}</h2>
              {!showPwForm && (
                <button className="btn" onClick={() => setShowPwForm(true)}>{t('prof.changePassword')}</button>
              )}
            </div>

            {!showPwForm ? (
              <p className={styles.note}>{t('prof.securityNote')}</p>
            ) : (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className="label" htmlFor="prof-current-pw">{t('prof.currentPassword')}</label>
                  <input
                    id="prof-current-pw"
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className="label" htmlFor="prof-new-pw">{t('prof.newPassword')}</label>
                    {/* Pengalih kata sandi memakai kata, bukan ikon mata, dan
                        tetap memenuhi lantai sasaran sentuh. */}
                    <button
                      type="button"
                      className={styles.reveal}
                      onClick={() => setShowPw(v => !v)}
                      aria-pressed={showPw}
                    >
                      {showPw ? t('prof.hidePassword') : t('prof.showPassword')}
                    </button>
                  </div>
                  <input
                    id="prof-new-pw"
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
                <div className={styles.actionRow}>
                  <button
                    className="btn btn--primary"
                    onClick={savePassword}
                    disabled={busy || !currentPassword || newPassword.length < 6}
                  >
                    {busy ? t('common.loading') : t('prof.savePassword')}
                  </button>
                  <button
                    className="btn"
                    onClick={() => { setShowPwForm(false); setCurrentPassword(''); setNewPassword(''); }}
                    disabled={busy}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── Privasi dan data ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('prof.privacyData')}</h2>
            </div>
            <p className={styles.note}>{t('prof.privacyNote')}</p>
            <div className={styles.actionRow}>
              {!isDoctor && (
                <button className="btn btn--danger" onClick={() => setConfirmAction('history')} disabled={busy}>
                  {t('prof.deleteHistory')}
                </button>
              )}
              <button className="btn btn--danger" onClick={() => setConfirmAction('account')} disabled={busy}>
                {t('prof.deleteMyAccount')}
              </button>
            </div>
          </section>

          {/* Keluar adalah tindakan biasa yang bisa dibatalkan dengan masuk
              kembali, jadi ia tombol netral, bukan bidang merah. */}
          <div className={styles.logoutRow}>
            <button className="btn btn--block" onClick={() => { logout(); router.push('/login'); }}>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </main>

      <Dialog.Root open={!!confirmAction} onOpenChange={o => !o && !busy && setConfirmAction(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialogScrim" />
          <Dialog.Content className="dialogSheet">
            <Dialog.Title className={styles.confirmTitle}>
              {confirmAction === 'history' ? t('prof.confirmHistTitle') : t('prof.confirmAccTitle')}
            </Dialog.Title>
            <Dialog.Description className={styles.confirmText}>
              {confirmAction === 'history' ? t('prof.confirmHistText') : t('prof.confirmAccText')}
            </Dialog.Description>
            <div className={styles.actionRow}>
              <button
                className="btn btn--danger"
                onClick={confirmAction === 'history' ? doDeleteHistory : doDeleteAccount}
                disabled={busy}
              >
                {busy
                  ? t('common.loading')
                  : confirmAction === 'history'
                    ? t('prof.yesDeleteHist')
                    : t('prof.yesDeleteAcc')}
              </button>
              <button className="btn" onClick={() => setConfirmAction(null)} disabled={busy}>
                {t('common.cancel')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
