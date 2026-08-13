'use client';
import { useEffect, useState } from 'react';
import { COUNTRIES, REGIONS, getCountry } from '@/lib/countries';
import { STATES_BY_COUNTRY } from '@/lib/states';
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
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const states = value.country ? (STATES_BY_COUNTRY[value.country] || []) : [];

  /**
   * Daftar kota diambil sesuai negara terpilih, bukan dibundel, karena datanya
   * mencakup lebih dari 140 ribu kota di seluruh dunia dan akan memberatkan
   * pemuatan awal bila ikut dikirim ke peramban.
   */
  useEffect(() => {
    if (!value.countryName) { setCities([]); return; }
    let cancelled = false;
    setLoadingCities(true);
    fetch(`${API_BASE}/api/geo/cities?country=${encodeURIComponent(value.countryName)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setCities(d.cities || []); })
      .catch(() => { if (!cancelled) setCities([]); })
      .finally(() => { if (!cancelled) setLoadingCities(false); });
    return () => { cancelled = true; };
  }, [value.countryName]);

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
        <label className={styles.label}>Negara {required && <span className={styles.req}>*</span>}</label>
        <select className="input" value={value.country || ''} onChange={e => selectCountry(e.target.value)} required={required}>
          <option value="">Pilih negara</option>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Kawasan</label>
        <select
          className="input"
          value={value.region || ''}
          onChange={e => onChange({ ...value, region: e.target.value || undefined })}
        >
          <option value="">Pilih kawasan</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className={styles.note}>Terisi otomatis mengikuti negara yang dipilih.</span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Provinsi / Negara Bagian</label>
          {states.length > 0 ? (
            <select
              className="input"
              value={value.state || ''}
              onChange={e => onChange({ ...value, state: e.target.value || undefined })}
              disabled={!value.country}
            >
              <option value="">{value.country ? 'Pilih provinsi' : 'Pilih negara dulu'}</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            // Sebagian negara tidak memiliki pembagian provinsi pada sumber data,
            // sehingga tetap disediakan isian bebas agar tidak menghalangi pengguna
            <input
              type="text"
              className="input"
              value={value.state || ''}
              onChange={e => onChange({ ...value, state: e.target.value || undefined })}
              placeholder={value.country ? 'Ketik provinsi' : 'Pilih negara dulu'}
              disabled={!value.country}
            />
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Kota</label>
          {/* Daftar kota bisa mencapai ribuan per negara, jadi memakai isian
              berpelengkap otomatis agar dapat dicari sambil mengetik, sekaligus
              tetap menerima nama kota yang belum ada di data */}
          <input
            type="text"
            className="input"
            list="city-options"
            value={value.city || ''}
            onChange={e => onChange({ ...value, city: e.target.value || undefined })}
            placeholder={
              !value.country ? 'Pilih negara dulu'
                : loadingCities ? 'Memuat daftar kota...'
                : cities.length ? 'Ketik untuk mencari kota'
                : 'Ketik nama kota'
            }
            disabled={!value.country}
          />
          <datalist id="city-options">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
          {value.country && cities.length > 0 && (
            <span className={styles.note}>{cities.length} kota tersedia, ketik untuk menyaring.</span>
          )}
        </div>
      </div>
    </div>
  );
}
