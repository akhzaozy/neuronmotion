'use client';
import { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  Table as TableIcon,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Globe,
  MapPin,
  Building,
  Layers,
  AlertCircle,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import styles from './GeoBreakdown.module.css';

export interface GeoRow {
  name: string;
  code?: string;
  region?: string;
  countryName?: string;
  stateName?: string;
  total: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  states?: GeoStateRow[];
  cities?: GeoCityRow[];
  type?: 'country' | 'state' | 'city';
}

export interface GeoStateRow {
  name: string;
  countryName?: string;
  total: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  cities?: GeoCityRow[];
  type?: 'country' | 'state' | 'city';
}

export interface GeoCityRow {
  name: string;
  stateName?: string;
  countryName?: string;
  total: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  type?: 'country' | 'state' | 'city';
}

export interface GeoData {
  byCountry: GeoRow[];
  byState: GeoRow[];
  byCity: GeoRow[];
  hierarchy?: GeoRow[];
  unknownCount: number;
  totalPatients: number;
}

const PALETTE = [
  '#0284c7', // 1: Sky Blue / Cobalt
  '#10b981', // 2: Emerald Green
  '#6366f1', // 3: Indigo / Purple
  '#f59e0b', // 4: Amber / Warm Gold
  '#ec4899', // 5: Pink / Magenta
  '#06b6d4', // 6: Cyan / Ice
  '#8b5cf6', // 7: Violet
  '#f97316', // 8: Orange
  '#14b8a6', // 9: Teal
  '#64748b', // 10: Slate / Others
];

const CARD_THEMES = [
  {
    main: '#0284c7',
    gradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)',
    border: 'rgba(2, 132, 199, 0.32)',
    glow: 'rgba(2, 132, 199, 0.2)',
    tag: '#01',
  },
  {
    main: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.03) 100%)',
    border: 'rgba(16, 185, 129, 0.32)',
    glow: 'rgba(16, 185, 129, 0.2)',
    tag: '#02',
  },
  {
    main: '#6366f1',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(167, 139, 250, 0.03) 100%)',
    border: 'rgba(99, 102, 241, 0.32)',
    glow: 'rgba(99, 102, 241, 0.2)',
    tag: '#03',
  },
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

type ModeTab = 'drilldown' | 'byCountry' | 'byState' | 'byCity';

export default function GeoBreakdown({ data }: { data?: GeoData | null }) {
  const { t, lang } = useI18n();

  // Navigation & Drilldown State
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModeTab>('drilldown');
  const [viewMode, setViewMode] = useState<'pie' | 'table'>('pie');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tableSort, setTableSort] = useState<'total' | 'high' | 'name'>('total');
  const [showAllRegions, setShowAllRegions] = useState(false);

  if (!data) return null;

  const hierarchy = data.hierarchy || data.byCountry || [];
  const isSingleCountry = hierarchy.length <= 1;
  const singleCountryObj = hierarchy[0];

  // Hitung data saat ini berdasarkan mode atau posisi drilldown (Scope: Indonesia)
  const { currentRows, currentLevelLabel, breadcrumbItems, canDrillFurther } = useMemo(() => {
    if (activeTab === 'byCountry') {
      return {
        currentRows: data.byCountry || [],
        currentLevelLabel: t('geo.country'),
        breadcrumbItems: [{ label: t('geo.country'), key: 'country' }],
        canDrillFurther: false,
      };
    }
    if (activeTab === 'byState') {
      return {
        currentRows: data.byState || [],
        currentLevelLabel: t('geo.state'),
        breadcrumbItems: [{ label: t('geo.state'), key: 'state' }],
        canDrillFurther: false,
      };
    }
    if (activeTab === 'byCity') {
      return {
        currentRows: data.byCity || [],
        currentLevelLabel: t('geo.city'),
        breadcrumbItems: [{ label: t('geo.city'), key: 'city' }],
        canDrillFurther: false,
      };
    }

    // Default 'drilldown' mode
    if (isSingleCountry) {
      // Scope Indonesia: Level 1 adalah Provinsi
      const allStates = singleCountryObj?.states || data.byState || [];

      if (!selectedState) {
        return {
          currentRows: allStates,
          currentLevelLabel: t('geo.state'),
          breadcrumbItems: [{ label: t('geo.allCountries'), key: 'all' }],
          canDrillFurther: true,
        };
      }

      // Level 2: Kota dalam Provinsi terpilih
      const stateObj = allStates.find(s => s.name === selectedState);
      return {
        currentRows: stateObj?.cities || [],
        currentLevelLabel: `${t('geo.city')} (${selectedState})`,
        breadcrumbItems: [
          { label: t('geo.allCountries'), key: 'all' },
          { label: selectedState, key: 'state' },
        ],
        canDrillFurther: false,
      };
    }

    // Multi-country fallback
    if (!selectedCountry) {
      return {
        currentRows: hierarchy,
        currentLevelLabel: t('geo.country'),
        breadcrumbItems: [{ label: t('geo.allCountries'), key: 'all' }],
        canDrillFurther: true,
      };
    }

    const countryObj = hierarchy.find(c => c.name === selectedCountry);
    if (!countryObj) {
      return {
        currentRows: hierarchy,
        currentLevelLabel: t('geo.country'),
        breadcrumbItems: [{ label: t('geo.allCountries'), key: 'all' }],
        canDrillFurther: true,
      };
    }

    if (!selectedState) {
      return {
        currentRows: countryObj.states || [],
        currentLevelLabel: `${t('geo.state')} (${countryObj.name})`,
        breadcrumbItems: [
          { label: t('geo.allCountries'), key: 'all' },
          { label: countryObj.name, key: 'country' },
        ],
        canDrillFurther: true,
      };
    }

    const stateObj = countryObj.states?.find(s => s.name === selectedState);
    return {
      currentRows: stateObj?.cities || [],
      currentLevelLabel: `${t('geo.city')} (${stateObj?.name}, ${countryObj.name})`,
      breadcrumbItems: [
        { label: t('geo.allCountries'), key: 'all' },
        { label: countryObj.name, key: 'country' },
        { label: stateObj?.name || selectedState, key: 'state' },
      ],
      canDrillFurther: false,
    };
  }, [activeTab, data, hierarchy, isSingleCountry, singleCountryObj, selectedCountry, selectedState, t]);

  // Filter pencarian cerdas menyeluruh (Multi-tier Universal Search)
  const isSearchActive = searchQuery.trim().length > 0;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) {
      let rows = [...currentRows];
      if (tableSort === 'high') {
        rows.sort((a, b) => b.HIGH - a.HIGH || b.total - a.total);
      } else if (tableSort === 'name') {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        rows.sort((a, b) => b.total - a.total || b.HIGH - a.HIGH);
      }
      return rows;
    }

    // Pencarian Lintas Provinsi & Kota di Indonesia
    const results: (GeoRow | GeoStateRow | GeoCityRow)[] = [];
    const seen = new Set<string>();

    // 1. Cari di Provinsi / State
    for (const s of (data.byState || [])) {
      const sName = (s.name || '').toLowerCase();
      const sRegion = ((s as any).region || '').toLowerCase();
      if (sName.includes(q) || sRegion.includes(q)) {
        const key = `s-${s.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ ...s, type: 'state' });
        }
      }
    }

    // 2. Cari di Kota & Kabupaten
    for (const ct of (data.byCity || [])) {
      const ctName = (ct.name || '').toLowerCase();
      const ctState = ((ct as any).stateName || '').toLowerCase();
      if (ctName.includes(q) || ctState.includes(q)) {
        const key = `ct-${ct.name}-${ctState}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ ...ct, type: 'city' });
        }
      }
    }

    // Pengurutan hasil pencarian
    if (tableSort === 'high') {
      results.sort((a, b) => b.HIGH - a.HIGH || b.total - a.total);
    } else if (tableSort === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      results.sort((a, b) => b.total - a.total || b.HIGH - a.HIGH);
    }

    return results;
  }, [currentRows, data, searchQuery, tableSort]);

  // Top 3 dan Sisanya
  const top3Rows = useMemo(() => filteredRows.slice(0, 3), [filteredRows]);
  const otherRows = useMemo(() => filteredRows.slice(3), [filteredRows]);

  // Statistik ringkasan
  const totalPatientsInView = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.total, 0),
    [filteredRows]
  );
  const totalHighRiskInView = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.HIGH, 0),
    [filteredRows]
  );

  // Grouping Pie Slices: Top 6 Slices untuk estetika warna warni + sisa kecil
  const pieSlices = useMemo(() => {
    if (totalPatientsInView === 0) return [];

    const MAX_DONUT_SLICES = 6;
    let mainRows = filteredRows;
    let hasOthers = false;
    let othersTotal = 0;
    let othersHigh = 0;
    let othersMed = 0;
    let othersLow = 0;

    if (filteredRows.length > MAX_DONUT_SLICES) {
      mainRows = filteredRows.slice(0, MAX_DONUT_SLICES);
      const rest = filteredRows.slice(MAX_DONUT_SLICES);
      othersTotal = rest.reduce((acc, r) => acc + r.total, 0);
      othersHigh = rest.reduce((acc, r) => acc + r.HIGH, 0);
      othersMed = rest.reduce((acc, r) => acc + r.MEDIUM, 0);
      othersLow = rest.reduce((acc, r) => acc + r.LOW, 0);
      hasOthers = true;
    }

    let currentAngle = -Math.PI / 2;
    const allItems = [
      ...mainRows.map((r, i) => ({ ...r, rank: i + 1, isOthers: false })),
      ...(hasOthers
        ? [
            {
              name: lang === 'en' ? `Other Regions (${filteredRows.length - MAX_DONUT_SLICES})` : `Wilayah Lainnya (${filteredRows.length - MAX_DONUT_SLICES})`,
              total: othersTotal,
              HIGH: othersHigh,
              MEDIUM: othersMed,
              LOW: othersLow,
              rank: MAX_DONUT_SLICES + 1,
              isOthers: true,
            },
          ]
        : []),
    ];

    const gap = allItems.length > 1 ? 0.025 : 0;

    return allItems.map((r, i) => {
      const sliceAngle = (r.total / totalPatientsInView) * 2 * Math.PI;
      const startAngle = currentAngle + gap / 2;
      const endAngle = currentAngle + sliceAngle - gap / 2;
      currentAngle += sliceAngle;

      const percentage = ((r.total / totalPatientsInView) * 100).toFixed(1);
      const color = (r as any).isOthers ? PALETTE[PALETTE.length - 1] : PALETTE[i % PALETTE.length];
      const pathData = describeArc(110, 110, 62, 102, startAngle, endAngle);

      return {
        ...r,
        index: i,
        color,
        percentage,
        pathData,
      };
    });
  }, [filteredRows, totalPatientsInView, lang]);

  const activeSlice =
    hoveredIndex !== null && pieSlices[hoveredIndex] ? pieSlices[hoveredIndex] : null;

  // Handler klik kartu / slice untuk navigasi & drilldown
  const handleItemClick = (rowOrName: any, isOthers?: boolean) => {
    if (isOthers) return;

    if (isSearchActive && typeof rowOrName === 'object') {
      const type = rowOrName.type;
      if (type === 'state') {
        setSelectedState(rowOrName.name);
      } else if (type === 'city') {
        setSelectedState(rowOrName.stateName || null);
      }
      setSearchQuery('');
      setActiveTab('drilldown');
      setHoveredIndex(null);
      setShowAllRegions(false);
      return;
    }

    const name = typeof rowOrName === 'string' ? rowOrName : rowOrName.name;
    if (activeTab !== 'drilldown') return;

    if (isSingleCountry) {
      if (!selectedState) {
        setSelectedState(name);
        setSearchQuery('');
        setHoveredIndex(null);
        setShowAllRegions(false);
      }
    } else {
      if (!selectedCountry) {
        setSelectedCountry(name);
        setSearchQuery('');
        setHoveredIndex(null);
        setShowAllRegions(false);
      } else if (!selectedState) {
        setSelectedState(name);
        setSearchQuery('');
        setHoveredIndex(null);
        setShowAllRegions(false);
      }
    }
  };

  const handleBreadcrumbClick = (key: string) => {
    if (key === 'all') {
      setSelectedCountry(null);
      setSelectedState(null);
    } else if (key === 'country') {
      setSelectedState(null);
    }
    setHoveredIndex(null);
    setShowAllRegions(false);
  };

  const resetAllDrilldown = () => {
    setSelectedCountry(null);
    setSelectedState(null);
    setSearchQuery('');
    setHoveredIndex(null);
    setShowAllRegions(false);
  };

  return (
    <section className={styles.block}>
      {/* ── Top Header Strip ────────────────────────────────────────────── */}
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <div className={styles.titleIconBox}>
            <Globe className={styles.titleIcon} size={20} />
          </div>
          <div>
            <h2 className={styles.title}>{t('doc.geoTitle')}</h2>
            <p className={styles.subtitle}>{t('doc.geoSubtitle')}</p>
          </div>
        </div>

        {/* Metric Quick Stats Badges (Scope: Indonesia) */}
        <div className={styles.statsStrip}>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>{t('geo.totalMapped')}</span>
            <strong className={styles.statValue}>{data.totalPatients}</strong>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>{t('geo.activeCountries')}</span>
            <strong className={styles.statValue}>{(data.byState || []).length}</strong>
          </div>
          <div className={`${styles.statBadge} ${styles.statBadgeHigh}`}>
            <span className={styles.statLabel}>{t('geo.highRiskCount')}</span>
            <strong className={styles.statValueHigh}>{totalHighRiskInView}</strong>
          </div>
        </div>
      </div>

      {/* ── Unified Toolbar: Navigation Tabs & Search & View Mode ──────────── */}
      <div className={styles.toolbarCard}>
        {/* Left: Mode Selection Tabs */}
        <div className={styles.navTabs} role="tablist" aria-label="Tingkat Wilayah">
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'drilldown' && !isSearchActive ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('drilldown');
              resetAllDrilldown();
            }}
          >
            <Layers size={13} />
            <span>{t('geo.drilldown')}</span>
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'byState' && !isSearchActive ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('byState');
              resetAllDrilldown();
            }}
          >
            <MapPin size={13} />
            <span>{t('geo.state')}</span>
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'byCity' && !isSearchActive ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('byCity');
              resetAllDrilldown();
            }}
          >
            <Building size={13} />
            <span>{t('geo.city')}</span>
          </button>
        </div>

        {/* Right: Search Input & View Toggle */}
        <div className={styles.toolbarRight}>
          {/* Search Box with instant filtering */}
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('geo.searchPlaceholder')}
              className={styles.searchInput}
              autoComplete="off"
            />
            {isSearchActive && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.searchClear}
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Toggle View (Pie / Table) */}
          <div className={styles.viewToggle} role="group" aria-label="Mode Tampilan">
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'pie' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('pie')}
              title={t('geo.pieView')}
              aria-pressed={viewMode === 'pie'}
            >
              <PieIcon size={14} />
              <span>{t('geo.pieView')}</span>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title={t('geo.tableView')}
              aria-pressed={viewMode === 'table'}
            >
              <TableIcon size={14} />
              <span>{t('geo.tableView')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search Active Notice Banner ────────────────────────────────────── */}
      {isSearchActive && (
        <div className={styles.searchNoticeBanner}>
          <div className={styles.searchNoticeLeft}>
            <Search size={13} className={styles.searchNoticeIcon} />
            <span>
              Menampilkan <strong>{filteredRows.length}</strong> hasil untuk &ldquo;{searchQuery}&rdquo; di seluruh provinsi & kota
            </span>
          </div>
          <button
            type="button"
            className={styles.clearNoticeBtn}
            onClick={() => setSearchQuery('')}
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* ── Breadcrumb Navigation Strip (Only when drilled down & not searching) ─ */}
      {!isSearchActive && activeTab === 'drilldown' && (isSingleCountry ? Boolean(selectedState) : Boolean(selectedCountry)) && (
        <div className={styles.breadcrumbBar}>
          <div className={styles.breadcrumbs}>
            {breadcrumbItems.map((item, idx) => {
              const isLast = idx === breadcrumbItems.length - 1;
              return (
                <div key={item.key} className={styles.crumbItem}>
                  {idx > 0 && <ChevronRight size={13} className={styles.crumbSep} />}
                  {isLast ? (
                    <span className={styles.crumbCurrent}>{item.label}</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.crumbLink}
                      onClick={() => handleBreadcrumbClick(item.key)}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              setSelectedState(null);
              setShowAllRegions(false);
            }}
          >
            <ArrowLeft size={12} />
            <span>{t('geo.backTo')}</span>
          </button>
        </div>
      )}

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      {filteredRows.length === 0 ? (
        <div className={styles.emptyCard}>
          <AlertCircle size={26} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            {isSearchActive ? t('geo.noSearchResults') : t('geo.empty')}
          </p>
          {isSearchActive && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : viewMode === 'pie' ? (
        /* ── Donut Chart Ringkas + Top 3 Wilayah Konsentrasi ───────────────── */
        <div className={styles.dashboardGrid}>
          {/* Kolom Kiri: Sleek Donut Chart Card */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartLevelTag}>
                {isSearchActive ? 'Hasil Pencarian' : currentLevelLabel}
              </span>
              <span className={styles.chartCountBadge}>
                {filteredRows.length} {lang === 'en' ? 'regions' : 'wilayah'}
              </span>
            </div>

            <div className={styles.chartWrapper}>
              <div className={styles.chartAmbientGlow} />
              <svg
                key={`pie-svg-${activeTab}-${selectedCountry || 'global'}-${selectedState || 'root'}-${isSearchActive ? 's' : 'n'}`}
                className={styles.pieSvg}
                viewBox="0 0 220 220"
                width="220"
                height="220"
                role="img"
                aria-label={`${t('doc.geoTitle')}: ${filteredRows.length} wilayah`}
              >
                <g className={styles.pieGroup}>
                  {pieSlices.map(slice => {
                    const isHovered = hoveredIndex === slice.index;
                    return (
                      <path
                        key={slice.name}
                        d={slice.pathData}
                        fill={slice.color}
                        className={`${styles.pieSlice} ${isHovered ? styles.pieSliceHovered : ''}`}
                        onMouseEnter={() => setHoveredIndex(slice.index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => handleItemClick(slice, (slice as any).isOthers)}
                        style={{ transformOrigin: '110px 110px' }}
                      >
                        <title>{`${slice.name}: ${slice.total} ${t('geo.patients')} (${slice.percentage}%)`}</title>
                      </path>
                    );
                  })}
                </g>
              </svg>

              {/* Donut Center Readout */}
              <div className={styles.pieCenter}>
                {activeSlice ? (
                  <div className={styles.centerActive}>
                    <span className={styles.centerPercent}>{activeSlice.percentage}%</span>
                    <span className={styles.centerName} data-no-translate="">
                      {activeSlice.name}
                    </span>
                    <span className={styles.centerCount}>
                      {activeSlice.total} {t('geo.patients')}
                    </span>
                  </div>
                ) : (
                  <div className={styles.centerDefault}>
                    <span className={styles.centerTotalNum}>{totalPatientsInView}</span>
                    <span className={styles.centerTotalLabel}>{t('geo.patients')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Legend Dots (Top Slices + Lainnya) */}
            <div className={styles.miniLegendGrid}>
              {pieSlices.map(slice => (
                <button
                  key={slice.name}
                  type="button"
                  className={`${styles.miniLegendItem} ${hoveredIndex === slice.index ? styles.miniLegendItemActive : ''}`}
                  onMouseEnter={() => setHoveredIndex(slice.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleItemClick(slice, (slice as any).isOthers)}
                >
                  <span className={styles.miniDot} style={{ backgroundColor: slice.color }} />
                  <span className={styles.miniText} data-no-translate="">{slice.name}</span>
                </button>
              ))}
            </div>

            {(canDrillFurther || isSearchActive) && (
              <div className={styles.chartHint}>
                <Sparkles size={12} className={styles.hintSparkle} />
                <span>{t('geo.clickToDrill')}</span>
              </div>
            )}
          </div>

          {/* Kolom Kanan: 3 Wilayah Konsentrasi Terbesar + Expandable Others */}
          <div className={styles.spotlightContainer}>
            {/* Header Section */}
            <div className={styles.spotlightHeader}>
              <div className={styles.spotlightTitleWrap}>
                <ShieldAlert size={16} className={styles.alertIcon} />
                <span className={styles.spotlightTitle}>
                  {isSearchActive
                    ? 'Hasil Pencarian Wilayah Teratas'
                    : tableSort === 'high'
                    ? '3 Wilayah Risiko Tertinggi'
                    : tableSort === 'name'
                    ? '3 Wilayah Teratas (Abjad A-Z)'
                    : '3 Wilayah Konsentrasi Terbesar'}
                </span>
              </div>
              <div className={styles.sortToggle}>
                <button
                  type="button"
                  className={`${styles.sortBtn} ${tableSort === 'total' ? styles.sortBtnActive : ''}`}
                  onClick={() => setTableSort('total')}
                >
                  Total Pasien
                </button>
                <button
                  type="button"
                  className={`${styles.sortBtn} ${tableSort === 'high' ? styles.sortBtnActive : ''}`}
                  onClick={() => setTableSort('high')}
                >
                  <span className={styles.sortDotHigh} />
                  <span>Risiko Tinggi</span>
                </button>
                <button
                  type="button"
                  className={`${styles.sortBtn} ${tableSort === 'name' ? styles.sortBtnActive : ''}`}
                  onClick={() => setTableSort('name')}
                >
                  A-Z (Abjad)
                </button>
              </div>
            </div>

            {/* ── TOP 3 CLINICAL FOCUS CARDS (TELEMETRY GLASS STYLE) ────────── */}
            <div className={styles.top3Grid}>
              {top3Rows.map((row, idx) => {
                const isHovered = hoveredIndex === idx;
                const percent = ((row.total / totalPatientsInView) * 100).toFixed(1);
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                const regionTag = (row as any).region || (row.name.length >= 2 ? row.name.slice(0, 3).toUpperCase() : 'WLY');
                const isItemDrillable = canDrillFurther || isSearchActive;

                return (
                  <div
                    key={`${row.name}-${idx}`}
                    className={`${styles.top3Card} ${
                      isHovered ? styles.cardHovered : ''
                    } ${isItemDrillable ? styles.cardClickable : ''}`}
                    style={{
                      '--card-accent': theme.main,
                      '--card-border': theme.border,
                      '--card-glow': theme.glow,
                      '--card-bg': theme.gradient,
                    } as any}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => handleItemClick(row)}
                    role={isItemDrillable ? 'button' : undefined}
                    tabIndex={isItemDrillable ? 0 : undefined}
                  >
                    {/* Left Priority Indicator */}
                    <div className={styles.telemetryPill}>
                      <span className={styles.telemetryTag}>#{idx + 1}</span>
                      <span className={styles.codeBadge}>
                        {(row as any).type === 'city' ? 'KOTA' : 'PROV'}
                      </span>
                    </div>

                    <div className={styles.cardCenterBody}>
                      {/* Top Row: Name, Subtitle, Count & Percent */}
                      <div className={styles.cardInfoRow}>
                        <div className={styles.cardNameBlock}>
                          <strong className={styles.regionName} data-no-translate="">
                            {row.name}
                          </strong>
                          {Boolean((row as any).region) && (
                            <span className={styles.regionSub}>{(row as any).region}</span>
                          )}
                          {Boolean((row as any).stateName) && (
                            <span className={styles.regionSub}>
                              {(row as any).stateName}
                            </span>
                          )}
                        </div>

                        <div className={styles.countBadgeGroup}>
                          <span className={styles.patientTotalNum}>
                            {row.total}{' '}
                            <span className={styles.patientUnit}>{t('geo.patients')}</span>
                          </span>
                          <span className={styles.percentPillBadge}>{percent}%</span>
                        </div>
                      </div>

                      {/* Middle: Clinical Risk Tag Pills */}
                      <div className={styles.riskCapsuleStrip}>
                        <span className={`${styles.riskCapsule} ${styles.capsuleHigh}`}>
                          <span className={styles.pulseDotRed} />
                          <strong>{row.HIGH}</strong> {t('geo.high')}
                        </span>
                        <span className={`${styles.riskCapsule} ${styles.capsuleMid}`}>
                          <span className={styles.dotYellow} />
                          <strong>{row.MEDIUM}</strong> {t('geo.medium')}
                        </span>
                        <span className={`${styles.riskCapsule} ${styles.capsuleLow}`}>
                          <span className={styles.dotGreen} />
                          <strong>{row.LOW}</strong> {t('geo.low')}
                        </span>
                      </div>

                      {/* Bottom: Glowing Risk Distribution Track */}
                      {row.HIGH + row.MEDIUM + row.LOW > 0 && (
                        <div className={styles.telemetryBarTrack} aria-hidden="true">
                          {row.HIGH > 0 && (
                            <span
                              className={styles.barHigh}
                              style={{ flex: row.HIGH }}
                              title={`Tinggi: ${row.HIGH}`}
                            />
                          )}
                          {row.MEDIUM > 0 && (
                            <span
                              className={styles.barMid}
                              style={{ flex: row.MEDIUM }}
                              title={`Sedang: ${row.MEDIUM}`}
                            />
                          )}
                          {row.LOW > 0 && (
                            <span
                              className={styles.barLow}
                              style={{ flex: row.LOW }}
                              title={`Rendah: ${row.LOW}`}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Drilldown Arrow Action Button */}
                    {isItemDrillable && (
                      <div className={styles.drillActionBtn} title="Jelajahi Rincian Wilayah">
                        <span className={styles.drillLabel}>Rincian</span>
                        <ArrowUpRight size={14} className={styles.drillArrowIcon} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── EXPANDABLE OTHER REGIONS ─────────────────────────────────── */}
            {otherRows.length > 0 && (
              <div className={styles.expandableSection}>
                <button
                  type="button"
                  className={styles.toggleExpandBtn}
                  onClick={() => setShowAllRegions(!showAllRegions)}
                  aria-expanded={showAllRegions}
                >
                  <span>
                    {showAllRegions
                      ? 'Sembunyikan Wilayah Lainnya'
                      : `Lihat Wilayah Lainnya (${otherRows.length})`}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`${styles.toggleChevron} ${showAllRegions ? styles.toggleChevronOpen : ''}`}
                  />
                </button>

                {showAllRegions && (
                  <div className={styles.othersList}>
                    {otherRows.map((row, idx) => {
                      const overallRank = idx + 4;
                      const percent = ((row.total / totalPatientsInView) * 100).toFixed(1);
                      const isItemDrillable = canDrillFurther || isSearchActive;

                      return (
                        <div
                          key={`${row.name}-${idx}`}
                          className={`${styles.otherCard} ${isItemDrillable ? styles.cardClickable : ''}`}
                          onClick={() => handleItemClick(row)}
                          role={isItemDrillable ? 'button' : undefined}
                          tabIndex={isItemDrillable ? 0 : undefined}
                        >
                          <div className={styles.otherLeft}>
                            <span className={styles.otherRank}>#{overallRank}</span>
                            <div className={styles.otherNameBlock}>
                              <div className={styles.otherTitleLine}>
                                <strong className={styles.otherName} data-no-translate="">
                                  {row.name}
                                </strong>
                                {Boolean((row as any).type) && (
                                  <span className={styles.typeBadgeSmall}>
                                    {(row as any).type === 'state' ? 'Provinsi' : 'Kota'}
                                  </span>
                                )}
                              </div>
                              {Boolean((row as any).region) && (
                                <span className={styles.otherSub}>{(row as any).region}</span>
                              )}
                              {Boolean((row as any).stateName) && (
                                <span className={styles.otherSub}>{(row as any).stateName}</span>
                              )}
                            </div>
                          </div>

                          <div className={styles.otherRight}>
                            <div className={styles.otherRiskPills}>
                              {row.HIGH > 0 && (
                                <span className={styles.tagHigh}>
                                  <span className={styles.dotHigh} /> {row.HIGH}
                                </span>
                              )}
                              {row.MEDIUM > 0 && (
                                <span className={styles.tagMid}>
                                  <span className={styles.dotMid} /> {row.MEDIUM}
                                </span>
                              )}
                              {row.LOW > 0 && (
                                <span className={styles.tagLow}>
                                  <span className={styles.dotLow} /> {row.LOW}
                                </span>
                              )}
                            </div>
                            <div className={styles.otherCountBox}>
                              <span className={styles.otherCount}>{row.total}</span>
                              <span className={styles.otherPercent}>{percent}%</span>
                            </div>
                            {isItemDrillable && (
                              <ChevronRight size={14} className={styles.otherChevron} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Tampilan Tabel Data Komprehensif ──────────────────────────────── */
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col" onClick={() => setTableSort('name')} className={styles.sortableHead}>
                    {isSearchActive ? 'Wilayah' : currentLevelLabel} {tableSort === 'name' ? '▲' : ''}
                  </th>
                  <th scope="col" className="num" onClick={() => setTableSort('total')} style={{ cursor: 'pointer' }}>
                    {t('geo.patients')} {tableSort === 'total' ? '▼' : ''}
                  </th>
                  <th scope="col" className="num" onClick={() => setTableSort('high')} style={{ cursor: 'pointer' }}>
                    <span className={styles.thRiskGroup}>
                      <span className={styles.dotHigh} />
                      <span>{t('geo.high')}</span>
                    </span>
                    {tableSort === 'high' ? ' ▼' : ''}
                  </th>
                  <th scope="col" className="num">
                    <span className={styles.thRiskGroup}>
                      <span className={styles.dotMid} />
                      <span>{t('geo.medium')}</span>
                    </span>
                  </th>
                  <th scope="col" className="num">
                    <span className={styles.thRiskGroup}>
                      <span className={styles.dotLow} />
                      <span>{t('geo.low')}</span>
                    </span>
                  </th>
                  <th scope="col" style={{ minWidth: '130px' }}>{t('geo.riskRatio')}</th>
                  {(canDrillFurther || isSearchActive) && <th scope="col" className="num">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr
                    key={`${r.name}-${i}`}
                    className={canDrillFurther || isSearchActive ? styles.tableRowClickable : ''}
                    onClick={() => (canDrillFurther || isSearchActive) && handleItemClick(r)}
                  >
                    <th scope="row" className={styles.tableName} data-no-translate="">
                      <div className={styles.tableRowNameWrap}>
                        <span className={styles.tableRankNum}>#{i + 1}</span>
                        <span>{r.name}</span>
                        {Boolean((r as any).type) && (
                          <span className={styles.typeBadgeSmall}>
                            {(r as any).type === 'state' ? 'Provinsi' : 'Kota'}
                          </span>
                        )}
                        {Boolean((r as any).region) && (
                          <span className={styles.badgeMuted}>{(r as any).region}</span>
                        )}
                        {Boolean((r as any).stateName) && (
                          <span className={styles.badgeMuted}>{(r as any).stateName}</span>
                        )}
                      </div>
                    </th>
                    <td className="num font-semibold">{r.total}</td>
                    <td className={`num ${r.HIGH > 0 ? styles.textHigh : ''}`}>{r.HIGH}</td>
                    <td className={`num ${r.MEDIUM > 0 ? styles.textMid : ''}`}>{r.MEDIUM}</td>
                    <td className={`num ${r.LOW > 0 ? styles.textLow : ''}`}>{r.LOW}</td>
                    <td>
                      {r.HIGH + r.MEDIUM + r.LOW === 0 ? (
                        <span className={styles.none}>{t('geo.notScreened')}</span>
                      ) : (
                        <div className={styles.tableRiskCell}>
                          <div className={styles.tableBar}>
                            {r.HIGH > 0 && (
                              <span
                                className={styles.barHigh}
                                style={{ flex: r.HIGH }}
                                title={`${t('geo.highRiskTip')}: ${r.HIGH}`}
                              />
                            )}
                            {r.MEDIUM > 0 && (
                              <span
                                className={styles.barMid}
                                style={{ flex: r.MEDIUM }}
                                title={`${t('geo.mediumRiskTip')}: ${r.MEDIUM}`}
                              />
                            )}
                            {r.LOW > 0 && (
                              <span
                                className={styles.barLow}
                                style={{ flex: r.LOW }}
                                title={`${t('geo.lowRiskTip')}: ${r.LOW}`}
                              />
                            )}
                          </div>
                          <div className={styles.tableRiskMetrics}>
                            <span className={styles.tableRiskLabel}>
                              {r.HIGH > 0 ? `${r.HIGH} Tinggi` : '0 Kasus Tinggi'}
                            </span>
                            <span className={styles.tableRiskPercent}>
                              {Math.round(((r.HIGH) / (r.total || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    {(canDrillFurther || isSearchActive) && (
                      <td className="num">
                        <button
                          type="button"
                          className={styles.tableDrillBtn}
                          onClick={e => {
                            e.stopPropagation();
                            handleItemClick(r);
                          }}
                        >
                          Rincian →
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer Note ────────────────────────────────────────────────────── */}
      {data.unknownCount > 0 && (
        <p className={styles.note}>
          ℹ️{' '}
          {lang === 'en'
            ? `${data.unknownCount} of ${data.totalPatients} patients have not completed their region profile.`
            : `${data.unknownCount} dari ${data.totalPatients} pasien belum mengisi data wilayah.`}
        </p>
      )}
    </section>
  );
}
