'use client';
import { useEffect, useId, useState } from 'react';
import { COUNTRIES, REGIONS, getCountry } from '@/lib/countries';
import { STATES_BY_COUNTRY } from '@/lib/states';
import { useI18n } from '@/lib/i18n';
import styles from './LocationFields.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface LocationValue {
  country?: string;      // kode ISO 3166-1 alpha-2
  countryName?: string;
  region?: string;       // kawasan, misalnya Asia
  state?: string;        // provinsi atau negara bagian
  city?: string;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  required?: boolean;
  title?: string;
  hint?: string;
}

export default function LocationFields({ value, onChange, required = false, title, hint }: Props) {
  const { t, lang } = useI18n();
  // Komponen ini bisa muncul lebih dari sekali pada satu halaman, jadi id-nya
  // dibuat unik agar pasangan label dan isian tidak saling tertukar.
  const uid = useId();
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const states = value.country ? (STATES_BY_COUNTRY[value.country] || []) : [];

  /**
   * Daftar kota diambil sesuai negara dan provinsi terpilih, bukan dibundel,
   * karena datanya mencakup lebih dari 150 ribu kota di seluruh dunia dan akan
   * memberatkan pemuatan awal bila ikut dikirim ke peramban.
   *
   * Provinsi ikut dikirim supaya kota yang ditawarkan benar-benar berada di
   * provinsi itu. Sebelumnya seluruh kota di satu negara ditampilkan, sehingga
   * pengguna bisa memilih provinsi Jawa Timur dengan kota Medan.
   */
  useEffect(() => {
    if (!value.country) { setCities([]); return; }
    let cancelled = false;
    setLoadingCities(true);

    const params = new URLSearchParams({ country: value.country });
    if (value.state) params.set('state', value.state);
    const query = params.toString();

    async function fetchCities() {
      // 1. Coba route internal Next.js terlebih dahulu (bebas CORS & port mismatch)
      try {
        const r1 = await fetch(`/api/geo/cities?${query}`);
        if (r1.ok) {
          const d1 = await r1.json();
          if (!cancelled && Array.isArray(d1.cities) && d1.cities.length > 0) {
            setCities(d1.cities);
            return;
          }
        }
      } catch {
        // Abaikan dan lanjut ke backend server
      }

      // 2. Coba backend server API_BASE jika tersedia
      try {
        const r2 = await fetch(`${API_BASE}/api/geo/cities?${query}`);
        if (r2.ok) {
          const d2 = await r2.json();
          if (!cancelled && Array.isArray(d2.cities)) {
            setCities(d2.cities);
            return;
          }
        }
      } catch {
        // Gagal
      }

      if (!cancelled) setCities([]);
    }

    fetchCities().finally(() => {
      if (!cancelled) setLoadingCities(false);
    });

    return () => { cancelled = true; };
  }, [value.country, value.state]);

  function selectCountry(code: string) {
    const c = getCountry(code);
    // Provinsi dan kota dikosongkan karena tidak lagi relevan dengan negara baru
    onChange({
      country: code || undefined,
      countryName: c?.name,
      region: c?.region,
      state: undefined,
      city: undefined,
    });
  }

  return (
    <div className={styles.wrap}>
      {title && <div className={styles.title}>{title}</div>}
      {hint && <p className={styles.hint}>{hint}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${uid}-country`}>
          {t('loc.country')} {required && <span className={styles.req}>*</span>}
        </label>
        <select id={`${uid}-country`} className="input" value={value.country || ''} onChange={e => selectCountry(e.target.value)} required={required}>
          <option value="">{t('loc.selectCountry')}</option>
          {/* Nama negara, provinsi, dan kota adalah nama diri. Selain salah bila
              diterjemahkan, jumlahnya mencapai ribuan dan akan menghabiskan
              kuota penerjemahan bila ikut terbaca penerjemah halaman. */}
          {COUNTRIES.map(c => <option key={c.code} value={c.code} data-no-translate="">{c.name}</option>)}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${uid}-region`}>{t('loc.region')}</label>
        <select
          id={`${uid}-region`}
          className="input"
          value={value.region || ''}
          onChange={e => onChange({ ...value, region: e.target.value || undefined })}
        >
          <option value="">{t('loc.selectRegion')}</option>
          {REGIONS.map(r => <option key={r} value={r} data-no-translate="">{r}</option>)}
        </select>
        <span className={styles.note}>{t('loc.autoFilled')}</span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-state`}>{t('loc.state')}</label>
          {states.length > 0 ? (
            <select
              id={`${uid}-state`}
              className="input"
              value={value.state || ''}
              // Kota dikosongkan karena tidak lagi tentu berada di provinsi baru
              onChange={e => onChange({ ...value, state: e.target.value || undefined, city: undefined })}
              disabled={!value.country}
            >
              <option value="">{value.country ? t('loc.selectState') : t('loc.selectCountryFirst')}</option>
              {states.map(s => <option key={s} value={s} data-no-translate="">{s}</option>)}
            </select>
          ) : (
            // Sebagian negara tidak memiliki pembagian provinsi pada sumber data,
            // sehingga tetap disediakan isian bebas agar tidak menghalangi pengguna
            <input
              id={`${uid}-state`}
              type="text"
              className="input"
              value={value.state || ''}
              onChange={e => onChange({ ...value, state: e.target.value || undefined, city: undefined })}
              placeholder={value.country ? (lang === 'en' ? 'Type a state' : 'Ketik provinsi') : t('loc.selectCountryFirst')}
              disabled={!value.country}
            />
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-city`}>{t('loc.city')}</label>
          {/* Daftar kota bisa mencapai ribuan per negara, jadi memakai isian
              berpelengkap otomatis agar dapat dicari sambil mengetik, sekaligus
              tetap menerima nama kota yang belum ada di data */}
          <input
            id={`${uid}-city`}
            type="text"
            className="input"
            list={`${uid}-cities`}
            value={value.city || ''}
            onChange={e => onChange({ ...value, city: e.target.value || undefined })}
            placeholder={
              !value.country ? t('loc.selectCountryFirst')
                : loadingCities ? t('loc.loadingCities')
                : cities.length ? t('loc.searchCity')
                : (lang === 'en' ? 'Type a city name' : 'Ketik nama kota')
            }
            disabled={!value.country}
          />
          <datalist id={`${uid}-cities`} data-no-translate="">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
          {value.country && cities.length > 0 && (
            <span className={styles.note}>
              {lang === 'en'
                ? `${cities.length} cities available, type to filter.`
                : `${cities.length} kota tersedia, ketik untuk menyaring.`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
