'use client';
import { useState } from 'react';
import styles from './GeoBreakdown.module.css';

export interface GeoRow {
  name: string;
  total: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface GeoData {
  byCountry: GeoRow[];
  byState: GeoRow[];
  byCity: GeoRow[];
  unknownCount: number;
  totalPatients: number;
}

const LEVELS = [
  { key: 'byCountry' as const, label: 'Negara' },
  { key: 'byState' as const, label: 'Provinsi' },
  { key: 'byCity' as const, label: 'Kota' },
];

export default function GeoBreakdown({ data }: { data?: GeoData | null }) {
  const [level, setLevel] = useState<'byCountry' | 'byState' | 'byCity'>('byCountry');

  if (!data) return null;

  const rows = data[level] || [];
  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Sebaran Wilayah Pasien</h2>
          <p className={styles.subtitle}>
            Distribusi pasien tertaut beserta kategori risiko pada sesi terakhir mereka.
          </p>
        </div>
        <div className={styles.tabs}>
          {LEVELS.map(l => (
            <button
              key={l.key}
              className={`${styles.tab} ${level === l.key ? styles.tabActive : ''}`}
              onClick={() => setLevel(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>
          Belum ada pasien dengan data wilayah pada tingkat ini. Data terisi ketika pasien
          melengkapi wilayahnya saat mendaftar atau melalui halaman profil.
        </p>
      ) : (
        <div className={styles.list}>
          {rows.map(r => (
            <div key={r.name} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rowName}>{r.name}</span>
                <span className={styles.rowTotal}>{r.total} pasien</span>
              </div>
              {/* Satu batang dibagi menurut proporsi risiko, panjangnya relatif
                  terhadap wilayah dengan pasien terbanyak */}
              <div className={styles.barTrack} style={{ width: `${(r.total / maxTotal) * 100}%` }}>
                {r.HIGH > 0 && (
                  <span className={styles.segHigh} style={{ flex: r.HIGH }} title={`Risiko tinggi: ${r.HIGH}`} />
                )}
                {r.MEDIUM > 0 && (
                  <span className={styles.segMed} style={{ flex: r.MEDIUM }} title={`Risiko sedang: ${r.MEDIUM}`} />
                )}
                {r.LOW > 0 && (
                  <span className={styles.segLow} style={{ flex: r.LOW }} title={`Risiko rendah: ${r.LOW}`} />
                )}
                {r.HIGH + r.MEDIUM + r.LOW === 0 && (
                  <span className={styles.segNone} style={{ flex: 1 }} title="Belum ada sesi skrining" />
                )}
              </div>
              <div className={styles.rowMeta}>
                {r.HIGH > 0 && <span className={styles.tagHigh}>{r.HIGH} tinggi</span>}
                {r.MEDIUM > 0 && <span className={styles.tagMed}>{r.MEDIUM} sedang</span>}
                {r.LOW > 0 && <span className={styles.tagLow}>{r.LOW} rendah</span>}
                {r.HIGH + r.MEDIUM + r.LOW === 0 && <span className={styles.tagNone}>belum skrining</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.unknownCount > 0 && (
        <p className={styles.note}>
          {data.unknownCount} dari {data.totalPatients} pasien belum mengisi data wilayah,
          sehingga tidak masuk dalam hitungan di atas.
        </p>
      )}
    </div>
  );
}
