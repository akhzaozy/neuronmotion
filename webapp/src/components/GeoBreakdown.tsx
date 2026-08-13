'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
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
  { key: 'byCountry' as const, labelKey: 'geo.country' },
  { key: 'byState' as const, labelKey: 'geo.state' },
  { key: 'byCity' as const, labelKey: 'geo.city' },
];

export default function GeoBreakdown({ data }: { data?: GeoData | null }) {
  const { t, lang } = useI18n();
  const [level, setLevel] = useState<'byCountry' | 'byState' | 'byCity'>('byCountry');

  if (!data) return null;

  const rows = data[level] || [];
  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t('doc.geoTitle')}</h2>
          <p className={styles.subtitle}>{t('doc.geoSubtitle')}</p>
        </div>
        <div className={styles.tabs}>
          {LEVELS.map(l => (
            <button
              key={l.key}
              className={`${styles.tab} ${level === l.key ? styles.tabActive : ''}`}
              onClick={() => setLevel(l.key)}
            >
              {t(l.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>{t('geo.empty')}</p>
      ) : (
        <div className={styles.list}>
          {rows.map(r => (
            <div key={r.name} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rowName} data-no-translate="">{r.name}</span>
                <span className={styles.rowTotal}>{r.total} {t('geo.patients')}</span>
              </div>
              {/* Satu batang dibagi menurut proporsi risiko, panjangnya relatif
                  terhadap wilayah dengan pasien terbanyak */}
              <div className={styles.barTrack} style={{ width: `${(r.total / maxTotal) * 100}%` }}>
                {r.HIGH > 0 && (
                  <span className={styles.segHigh} style={{ flex: r.HIGH }} title={`${t('geo.highRiskTip')}: ${r.HIGH}`} />
                )}
                {r.MEDIUM > 0 && (
                  <span className={styles.segMed} style={{ flex: r.MEDIUM }} title={`${t('geo.mediumRiskTip')}: ${r.MEDIUM}`} />
                )}
                {r.LOW > 0 && (
                  <span className={styles.segLow} style={{ flex: r.LOW }} title={`${t('geo.lowRiskTip')}: ${r.LOW}`} />
                )}
                {r.HIGH + r.MEDIUM + r.LOW === 0 && (
                  <span className={styles.segNone} style={{ flex: 1 }} title={t('doc.noSessionsYet')} />
                )}
              </div>
              <div className={styles.rowMeta}>
                {r.HIGH > 0 && <span className={styles.tagHigh}>{r.HIGH} {t('geo.high')}</span>}
                {r.MEDIUM > 0 && <span className={styles.tagMed}>{r.MEDIUM} {t('geo.medium')}</span>}
                {r.LOW > 0 && <span className={styles.tagLow}>{r.LOW} {t('geo.low')}</span>}
                {r.HIGH + r.MEDIUM + r.LOW === 0 && <span className={styles.tagNone}>{t('geo.notScreened')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.unknownCount > 0 && (
        <p className={styles.note}>
          {lang === 'en'
            ? `${data.unknownCount} of ${data.totalPatients} patients have not filled in their region, so they are not counted above.`
            : `${data.unknownCount} dari ${data.totalPatients} pasien belum mengisi data wilayah, sehingga tidak masuk dalam hitungan di atas.`}
        </p>
      )}
    </div>
  );
}
