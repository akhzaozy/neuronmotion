'use client';
import { COUNTRIES, REGIONS, getCountry } from '@/lib/countries';
import styles from './LocationFields.module.css';

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
  /** Label kolom disesuaikan konteks, misalnya wilayah praktik untuk nakes */
  title?: string;
  hint?: string;
}

export default function LocationFields({ value, onChange, required = false, title, hint }: Props) {
  /**
   * Memilih negara sekaligus mengisi kawasan secara otomatis, karena kawasan
   * dapat diturunkan dari data ISO. Pengguna tetap dapat menggantinya bila
   * merasa kawasan lain lebih tepat.
   */
  function selectCountry(code: string) {
    const c = getCountry(code);
    onChange({
      ...value,
      country: code || undefined,
      countryName: c?.name,
      region: c?.region || value.region,
    });
  }

  return (
    <div className={styles.wrap}>
      {title && <div className={styles.title}>{title}</div>}
      {hint && <p className={styles.hint}>{hint}</p>}

      <div className={styles.field}>
        <label className={styles.label}>Negara {required && <span className={styles.req}>*</span>}</label>
        <select
          className="input"
          value={value.country || ''}
          onChange={e => selectCountry(e.target.value)}
          required={required}
        >
          <option value="">Pilih negara</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
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
          <input
            type="text"
            className="input"
            value={value.state || ''}
            onChange={e => onChange({ ...value, state: e.target.value || undefined })}
            placeholder="Contoh: Jawa Timur"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Kota</label>
          <input
            type="text"
            className="input"
            value={value.city || ''}
            onChange={e => onChange({ ...value, city: e.target.value || undefined })}
            placeholder="Contoh: Surabaya"
          />
        </div>
      </div>
    </div>
  );
}
