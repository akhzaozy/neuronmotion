'use client';
import { useState, useMemo } from 'react';
import { PieChart as PieIcon, Table as TableIcon } from 'lucide-react';
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

const PALETTE = [
  '#0284c7', // Sky blue
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
];

function describeArc(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
) {
  const diff = endAngle - startAngle;
  // Jika lingkaran penuh (100%)
  if (diff >= 2 * Math.PI - 0.001) {
    return [
      `M ${cx} ${cy - rOuter}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy + rOuter}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy - rOuter}`,
      `M ${cx} ${cy - rInner}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner}`,
      'Z',
    ].join(' ');
  }

  const x1 = cx + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(endAngle);
  const y2 = cy + rOuter * Math.sin(endAngle);

  const x3 = cx + rInner * Math.cos(endAngle);
  const y3 = cy + rInner * Math.sin(endAngle);
  const x4 = cx + rInner * Math.cos(startAngle);
  const y4 = cy + rInner * Math.sin(startAngle);

  const largeArcFlag = diff > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

export default function GeoBreakdown({ data }: { data?: GeoData | null }) {
  const { t, lang } = useI18n();
  const [level, setLevel] = useState<'byCountry' | 'byState' | 'byCity'>('byCountry');
  const [viewMode, setViewMode] = useState<'pie' | 'table'>('pie');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data) return null;

  const rows = data[level] || [];
  const totalPatientsInLevel = useMemo(() => rows.reduce((acc, r) => acc + r.total, 0), [rows]);
  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  // Hitung sudut dan segmen untuk Pie Chart
  const pieSlices = useMemo(() => {
    if (totalPatientsInLevel === 0) return [];
    let currentAngle = -Math.PI / 2; // Mulai dari atas (jam 12)
    const gap = rows.length > 1 ? 0.025 : 0; // Jarak antar slice jika lebih dari 1

    return rows.map((r, i) => {
      const sliceAngle = (r.total / totalPatientsInLevel) * 2 * Math.PI;
      const startAngle = currentAngle + (gap / 2);
      const endAngle = currentAngle + sliceAngle - (gap / 2);
      currentAngle += sliceAngle;

      const percentage = ((r.total / totalPatientsInLevel) * 100).toFixed(1);
      const color = PALETTE[i % PALETTE.length];
      const pathData = describeArc(130, 130, 70, 115, startAngle, endAngle);

      return {
        ...r,
        index: i,
        color,
        percentage,
        pathData,
      };
    });
  }, [rows, totalPatientsInLevel]);

  const activeSlice = hoveredIndex !== null && pieSlices[hoveredIndex] ? pieSlices[hoveredIndex] : null;

  return (
    <section className={styles.block}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{t('doc.geoTitle')}</h2>
          <p className={styles.subtitle}>{t('doc.geoSubtitle')}</p>
        </div>

        <div className={styles.controlsRow}>
          {/* View Mode Toggle (Pie Chart / Table) */}
          <div className={styles.viewToggle} role="group" aria-label="Mode Tampilan">
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'pie' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('pie')}
              title={t('geo.pieView')}
              aria-pressed={viewMode === 'pie'}
            >
              <PieIcon size={16} />
              <span>{t('geo.pieView')}</span>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title={t('geo.tableView')}
              aria-pressed={viewMode === 'table'}
            >
              <TableIcon size={16} />
              <span>{t('geo.tableView')}</span>
            </button>
          </div>

          {/* Level Tabs (Negara, Provinsi, Kota) */}
          <div className={styles.tabs} role="group" aria-label={t('doc.geoTitle')}>
            {LEVELS.map(l => (
              <button
                key={l.key}
                type="button"
                className={`${styles.tab} ${level === l.key ? styles.tabActive : ''}`}
                aria-pressed={level === l.key}
                onClick={() => {
                  setLevel(l.key);
                  setHoveredIndex(null);
                }}
              >
                {t(l.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>{t('geo.empty')}</p>
      ) : viewMode === 'pie' ? (
        /* ── Tampilan Grafik Pie/Donut Interaktif Beranimasi ────────────────── */
        <div className={styles.pieContainer}>
          {/* Kolom Kiri: SVG Donut Chart */}
          <div className={styles.chartWrapper}>
            <svg
              className={styles.pieSvg}
              viewBox="0 0 260 260"
              width="260"
              height="260"
              role="img"
              aria-label={`${t('doc.geoTitle')}: ${rows.length} wilayah`}
            >
              <g className={styles.pieGroup}>
                {pieSlices.map((slice) => {
                  const isHovered = hoveredIndex === slice.index;
                  return (
                    <path
                      key={slice.name}
                      d={slice.pathData}
                      fill={slice.color}
                      className={`${styles.pieSlice} ${isHovered ? styles.pieSliceHovered : ''}`}
                      onMouseEnter={() => setHoveredIndex(slice.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        transformOrigin: '130px 130px',
                      }}
                    >
                      <title>{`${slice.name}: ${slice.total} ${t('geo.patients')} (${slice.percentage}%)`}</title>
                    </path>
                  );
                })}
              </g>
            </svg>

            {/* Readout Tengah Donut */}
            <div className={styles.pieCenter}>
              {activeSlice ? (
                <div className={styles.centerActive}>
                  <span className={styles.centerPercent}>{activeSlice.percentage}%</span>
                  <span className={styles.centerName} data-no-translate="">{activeSlice.name}</span>
                  <span className={styles.centerCount}>
                    {activeSlice.total} {t('geo.patients')}
                  </span>
                </div>
              ) : (
                <div className={styles.centerDefault}>
                  <span className={styles.centerTotalNum}>{totalPatientsInLevel}</span>
                  <span className={styles.centerTotalLabel}>{t('geo.totalRegionPatients')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Rincian Wilayah & Risiko */}
          <div className={styles.legendGrid}>
            {pieSlices.map((slice) => {
              const isHovered = hoveredIndex === slice.index;
              return (
                <div
                  key={slice.name}
                  className={`${styles.legendCard} ${isHovered ? styles.legendCardActive : ''}`}
                  onMouseEnter={() => setHoveredIndex(slice.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className={styles.legendHead}>
                    <span
                      className={styles.legendDot}
                      style={{ backgroundColor: slice.color }}
                    />
                    <strong className={styles.legendTitle} data-no-translate="">
                      {slice.name}
                    </strong>
                    <span className={styles.legendPercent}>
                      {slice.percentage}%
                    </span>
                  </div>

                  <div className={styles.legendMetrics}>
                    <span className={styles.legendTotalCount}>
                      {slice.total} {t('geo.patients')}
                    </span>
                    <div className={styles.riskPills}>
                      {slice.HIGH > 0 && (
                        <span className={styles.riskPillHigh} title={`${t('geo.highRiskTip')}: ${slice.HIGH}`}>
                          🔴 {slice.HIGH}
                        </span>
                      )}
                      {slice.MEDIUM > 0 && (
                        <span className={styles.riskPillMid} title={`${t('geo.mediumRiskTip')}: ${slice.MEDIUM}`}>
                          🟡 {slice.MEDIUM}
                        </span>
                      )}
                      {slice.LOW > 0 && (
                        <span className={styles.riskPillLow} title={`${t('geo.lowRiskTip')}: ${slice.LOW}`}>
                          🟢 {slice.LOW}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batang Proporsi Risiko */}
                  {slice.HIGH + slice.MEDIUM + slice.LOW > 0 && (
                    <div className={styles.miniBar} aria-hidden="true">
                      {slice.HIGH > 0 && (
                        <span className={styles.segHigh} style={{ flex: slice.HIGH }} />
                      )}
                      {slice.MEDIUM > 0 && (
                        <span className={styles.segMid} style={{ flex: slice.MEDIUM }} />
                      )}
                      {slice.LOW > 0 && (
                        <span className={styles.segLow} style={{ flex: slice.LOW }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Tampilan Tabel Data Klasik ─────────────────────────────────────── */
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
