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
    <section className={styles.block}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{t('doc.geoTitle')}</h2>
          <p className={styles.subtitle}>{t('doc.geoSubtitle')}</p>
        </div>
        <div className={styles.tabs} role="group" aria-label={t('doc.geoTitle')}>
          {LEVELS.map(l => (
            <button
              key={l.key}
              type="button"
              className={`${styles.tab} ${level === l.key ? styles.tabActive : ''}`}
              aria-pressed={level === l.key}
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
        <div className={styles.tableScroll}>
          <table className="dataTable">
            <thead>
              <tr>
                <th scope="col">{t(LEVELS.find(l => l.key === level)!.labelKey)}</th>
                <th scope="col" className="num">{t('geo.patients')}</th>
                <th scope="col" className="num">{t('geo.high')}</th>
                <th scope="col" className="num">{t('geo.medium')}</th>
                <th scope="col" className="num">{t('geo.low')}</th>
                <th scope="col">
                  <span className="srOnly">{t('doc.geoTitle')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name}>
                  <th scope="row" className={styles.name} data-no-translate="">
                    {r.name}
                  </th>
                  <td className="num">{r.total}</td>
                  <td className="num">{r.HIGH}</td>
                  <td className="num">{r.MEDIUM}</td>
                  <td className="num">{r.LOW}</td>
                  <td>
                    {r.HIGH + r.MEDIUM + r.LOW === 0 ? (
                      <span className={styles.none}>{t('geo.notScreened')}</span>
                    ) : (
                      /* Satu batang dibagi menurut proporsi risiko, panjangnya
                         relatif terhadap wilayah dengan pasien terbanyak */
                      <span
                        className={styles.bar}
                        style={{ width: `${(r.total / maxTotal) * 100}%` }}
                        aria-hidden="true"
                      >
                        {r.HIGH > 0 && (
                          <span className={styles.segHigh} style={{ flex: r.HIGH }} title={`${t('geo.highRiskTip')}: ${r.HIGH}`} />
                        )}
                        {r.MEDIUM > 0 && (
                          <span className={styles.segMid} style={{ flex: r.MEDIUM }} title={`${t('geo.mediumRiskTip')}: ${r.MEDIUM}`} />
                        )}
                        {r.LOW > 0 && (
                          <span className={styles.segLow} style={{ flex: r.LOW }} title={`${t('geo.lowRiskTip')}: ${r.LOW}`} />
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.unknownCount > 0 && (
        <p className={styles.note}>
          {lang === 'en'
            ? `${data.unknownCount} of ${data.totalPatients} patients have not filled in their region, so they are not counted above.`
            : `${data.unknownCount} dari ${data.totalPatients} pasien belum mengisi data wilayah, sehingga tidak masuk dalam hitungan di atas.`}
        </p>
      )}
    </section>
  );
}
