'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ModelAccuracy } from '@/lib/api';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import { TEST_SEQUENCE } from '@/lib/tests';
import styles from './landing.module.css';

const CONDITIONS = ['cond.parkinson', 'cond.essentialTremor', 'cond.postStroke', 'cond.ataxia'];

/**
 * Halaman publik.
 *
 * Buktinya adalah dokumennya sendiri. Enam biomarker tidak disajikan sebagai
 * kartu ikon, melainkan sebagai tabel pengukuran lengkap dengan durasi
 * perekaman yang diambil dari mesin, karena itulah yang benar-benar dilakukan
 * produk ini dan itulah yang tidak bisa disalin pesaing dengan menempel
 * kalimat.
 *
 * Angka akurasi diambil dari backend, hasil validasi holdout sungguhan, dan
 * selalu tampil bersama asal-usulnya. Tanpa itu ia jadi klaim, dan produk ini
 * belum melewati validasi klinis.
 */
export default function LandingPage() {
  const { t, lang } = useI18n();
  const [modelInfo, setModelInfo] = useState<ModelAccuracy | null>(null);

  useEffect(() => {
    api.getModelAccuracy().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  return (
    <div className={styles.page}>
      <a href="#main" className="skipToContent">
        {t('nav.skipToContent')}
      </a>

      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <Logo size={18} />
          <div className={styles.mastheadActions}>
            <LanguageToggle />
            <ThemeToggle size="sm" />
            <Link href="/login" className="btn btn-sm">
              {t('land.login')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Tesis ───────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className="sheet">
            <h1 className={styles.heroTitle}>
              {t('land.title1')} {t('land.title2')} {t('land.title3')}
            </h1>

            <p className={styles.heroLead}>{t('land.desc')}</p>

            <div className={styles.heroActions}>
              <Link href="/demo" className="btn btn--primary btn--lg">
                {t('land.tryDemo')}
              </Link>
              <Link href="/register" className="btn btn--lg">
                {t('land.startFree')}
              </Link>
            </div>

            <p className={styles.heroNote}>{t('land.tryDemoSub')}</p>
          </div>
        </section>

        {/* ── Spesimen: apa yang sebenarnya diukur ────────────────────────── */}
        <section className={styles.section}>
          <div className="sheet">
            <div className="docHead">
              <div className="docHead__meta">
                <span>{t('land.specimen')}</span>
                <span>{TEST_SEQUENCE.length} {t('land.statBiomarkers')}</span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.featuresTitle')}</h2>
              <p className={styles.sectionLead}>{t('land.featuresDesc')}</p>
            </div>

            <div className={styles.tableScroll}>
              <table className="dataTable">
                <thead>
                  <tr>
                    <th scope="col">{t('land.colTest')}</th>
                    <th scope="col">{t('land.colMeasures')}</th>
                    <th scope="col" className="num">{t('land.colDuration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TEST_SEQUENCE.map(spec => (
                    <tr key={spec.type}>
                      <th scope="row" className={styles.rowName}>{t(spec.nameKey)}</th>
                      <td>{t(spec.descKey)}</td>
                      <td className="num">{spec.duration} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Mekanisme ───────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className="sheet">
            <div className={styles.split}>
              <h2 className={styles.sectionTitle}>{t('land.mechanismTitle')}</h2>
              <div className={styles.splitBody}>
                <p>{t('land.mechanismBody')}</p>
                <p>{t('land.mechanismBody2')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Provenans model ─────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className="sheet">
            <div className="docHead">
              <div className="docHead__meta">
                <span>{t('land.provenance')}</span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.conditionsTitle')}</h2>
            </div>

            <div className={styles.tableScroll}>
              <table className="dataTable">
                <tbody>
                  <tr>
                    <th scope="row">{t('land.statProfiles')}</th>
                    <td className="num">
                      {modelInfo ? modelInfo.trainSize.toLocaleString(lang === 'en' ? 'en' : 'id') : '—'}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">{t('land.testProfiles')}</th>
                    <td className="num">
                      {modelInfo ? modelInfo.testSize.toLocaleString(lang === 'en' ? 'en' : 'id') : '—'}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">{t('land.statAccuracy')}</th>
                    <td className="num">{modelInfo ? `${modelInfo.accuracy} %` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.provenanceNote}>{t('land.accuracyNote')}</p>

            <ul className={styles.conditionList}>
              {CONDITIONS.map(k => (
                <li key={k} className={styles.conditionRow}>
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Penutup ─────────────────────────────────────────────────────── */}
        <section className={styles.closing}>
          <div className="sheet">
            <h2 className={styles.closingTitle}>{t('land.ctaTitle')}</h2>
            <p className={styles.closingLead}>{t('land.ctaDesc')}</p>
            <div className={styles.heroActions}>
              <Link href="/register" className="btn btn--primary btn--lg">
                {t('land.ctaButton')}
              </Link>
              <Link href="/login" className="btn btn--lg">
                {t('land.hasAccount')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="sheet">
          <p className={styles.disclaimer}>{t('land.footerDisclaimer')}</p>
          <p className={styles.references}>
            {t('land.referenceLead')} MDS-UPDRS &middot; Hoehn &amp; Yahr &middot; Zhang dkk. 2017
            &middot; Zanardi dkk. 2021 &middot; Lewek dkk. 2010
          </p>
        </div>
      </footer>
    </div>
  );
}
