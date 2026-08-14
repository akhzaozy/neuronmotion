'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';
import plateHand from '@/assets/plate-hand.webp';
import { api, ModelAccuracy } from '@/lib/api';
import Logo from '@/components/Logo';
import TremorPlate from '@/components/TremorPlate';
import { tremorTrace } from '@/data/tremorTrace';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import { TEST_SEQUENCE } from '@/lib/tests';
import { useReveal, useCountUp } from '@/lib/reveal';
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

  const [specimenRef, specimenShown] = useReveal<HTMLDivElement>();
  const [mechanismRef, mechanismShown] = useReveal<HTMLDivElement>();
  const [provenanceRef, provenanceShown] = useReveal<HTMLDivElement>();

  // Angka naik ke nilainya sendiri begitu blok provenans terlihat. Selama
  // backend belum menjawab, nilainya null dan yang tampil tetap tanda pisah,
  // bukan nol yang bisa salah dibaca sebagai hasil.
  const trainSize = useCountUp(modelInfo?.trainSize ?? null, provenanceShown);
  const testSize = useCountUp(modelInfo?.testSize ?? null, provenanceShown);
  const accuracy = useCountUp(modelInfo?.accuracy ?? null, provenanceShown);

  const locale = lang === 'en' ? 'en' : 'id';
  const whole = (v: number | null) => (v === null ? '—' : Math.round(v).toLocaleString(locale));
  const num = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 1 });

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
            <Link href="/login" className="btn">
              {t('land.login')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Tesis ───────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={`sheet ${styles.heroGrid}`}>
            <div>
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

            {/* Plat dua panel.
                Atas, posisi tangan saat tes. Bawah, jejak yang dihasilkannya.
                Keduanya menjelaskan hal yang sama dari dua sisi, jadi
                memisahkannya menjadi dua gambar bernomor hanya menyuruh
                pembaca menautkannya sendiri.

                Panel atas sengaja ilustrasi, bukan tangkapan layar
                pengukuran. Panel bawah sebaliknya, wajib rekaman sungguhan,
                dan tidak dirender sama sekali selama belum ada. */}
            <figure className={styles.plate}>
              <div className={styles.plateFrame}>
                <span className={styles.plateMark} aria-hidden="true" />
                <Image
                  src={plateHand}
                  alt={t('land.plateAlt')}
                  className={styles.plateImg}
                  sizes="(max-width: 900px) 60vw, 360px"
                  quality={88}
                  priority
                />
              </div>

              <TremorPlate />

              <figcaption className={styles.plateCaption}>
                <span className={styles.plateFigure}>{t('land.plateFigure')}</span>
                {!tremorTrace
                  ? t('land.plateCaption')
                  : tremorTrace.kind === 'recording'
                    ? t('land.plateCaptionRecording')
                    : t('land.plateCaptionIllustration')}
                {tremorTrace && (
                  <>
                    {' '}
                    <span data-no-translate="">
                      {[
                        `${num(tremorTrace.durationSec)} s`,
                        `${num(tremorTrace.dominantFrequencyHz)} Hz`,
                        `${num(tremorTrace.amplitudeMillimeter)} mm`,
                      ].join(' · ')}
                    </span>
                  </>
                )}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Spesimen: apa yang sebenarnya diukur ────────────────────────── */}
        <section className={styles.section}>
          <div
            ref={specimenRef}
            className={`sheet ${styles.reveal} ${specimenShown ? styles.revealShown : ''}`}
          >
            <div className="docHead">
              <div className="docHead__meta">
                <span>{t('land.specimen')}</span>
                <span>{TEST_SEQUENCE.length} {t('land.statBiomarkers')}</span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.featuresTitle')}</h2>
              <p className={styles.sectionLead}>{t('land.featuresDesc')}</p>
              <div
                aria-hidden="true"
                className={`${styles.rule} ${specimenShown ? styles.ruleShown : ''}`}
              />
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
                  {TEST_SEQUENCE.map((spec, i) => (
                    <tr
                      key={spec.type}
                      style={{ '--i': i } as CSSProperties}
                      className={`${styles.revealRow} ${specimenShown ? styles.revealRowShown : ''}`}
                    >
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
          <div
            ref={mechanismRef}
            className={`sheet ${styles.reveal} ${mechanismShown ? styles.revealShown : ''}`}
          >
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
          <div
            ref={provenanceRef}
            className={`sheet ${styles.reveal} ${provenanceShown ? styles.revealShown : ''}`}
          >
            <div className="docHead">
              <div className="docHead__meta">
                <span>{t('land.provenance')}</span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.conditionsTitle')}</h2>
              <div
                aria-hidden="true"
                className={`${styles.rule} ${provenanceShown ? styles.ruleShown : ''}`}
              />
            </div>

            <div className={styles.tableScroll}>
              <table className="dataTable">
                <tbody>
                  <tr>
                    <th scope="row">{t('land.statProfiles')}</th>
                    <td className="num">{whole(trainSize)}</td>
                  </tr>
                  <tr>
                    <th scope="row">{t('land.testProfiles')}</th>
                    <td className="num">{whole(testSize)}</td>
                  </tr>
                  <tr>
                    <th scope="row">{t('land.statAccuracy')}</th>
                    <td className="num">
                      {accuracy === null ? '—' : `${accuracy.toFixed(1)} %`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.provenanceNote}>{t('land.accuracyNote')}</p>

            <ul className={styles.conditionList}>
              {CONDITIONS.map((k, i) => (
                <li
                  key={k}
                  style={{ '--i': i } as CSSProperties}
                  className={`${styles.conditionRow} ${styles.revealRow} ${
                    provenanceShown ? styles.revealRowShown : ''
                  }`}
                >
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
          <p className="note note--lead">{t('land.footerDisclaimer')}</p>
          <p className={styles.references}>
            {t('land.referenceLead')} MDS-UPDRS &middot; Hoehn &amp; Yahr &middot; Zhang dkk. 2017
            &middot; Zanardi dkk. 2021 &middot; Lewek dkk. 2010
          </p>
        </div>
      </footer>
    </div>
  );
}
