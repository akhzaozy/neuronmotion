'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type CSSProperties, type ComponentType } from 'react';
import {
  Activity,
  BookOpen,
  Camera,
  ChevronDown,
  Cpu,
  Footprints,
  Hand,
  Info,
  MoveHorizontal,
  PersonStanding,
  RotateCw,
  ShieldCheck,
  Timer,
  Video,
} from 'lucide-react';
import heroDoctor from '@/assets/hero-doctor.jpg';
import consultPhoto from '@/assets/consult.jpg';
import { api, ModelAccuracy } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import TremorPlate from '@/components/TremorPlate';
import TraceWave from '@/components/TraceWave';
import { tremorTrace } from '@/data/tremorTrace';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import { TEST_SEQUENCE, TOTAL_CAPTURE_SECONDS } from '@/lib/tests';
import { useReveal, useCountUp } from '@/lib/reveal';
import styles from './landing.module.css';

const CONDITIONS = ['cond.parkinson', 'cond.essentialTremor', 'cond.postStroke', 'cond.ataxia'];

/**
 * Ikon per tes. Dipetakan dari tipe tes, bukan dari urutan baris, supaya
 * penambahan tes di TEST_SEQUENCE tidak diam-diam menggeser ikon seluruh
 * tabel. Tipe yang belum punya ikon jatuh ke Activity.
 */
const TEST_ICON: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  tremor: Activity,
  fingerTapping: Hand,
  gait: Footprints,
  armSwing: MoveHorizontal,
  posture: PersonStanding,
  rom: RotateCw,
};

/**
 * Halaman publik.
 *
 * Susunannya menolak dua templat sekaligus. Yang pertama adalah lembar dokumen
 * dunia sebelumnya, yang membuat alat ini terbaca seperti arsip padahal ia
 * dipakai orang yang sedang khawatir tentang tubuhnya sendiri. Yang kedua
 * adalah templat pemasaran rumah sakit, yang membuka dengan potret dokter dan
 * sebaris angka bangga: jumlah pasien, jumlah kamar, jumlah dokter daring.
 *
 * Angka semacam itu tidak ada di produk ini, dan mengarangnya adalah hal yang
 * paling cepat dibongkar penilai. Maka posisi komposisi yang biasanya diisi
 * angka bangga diisi mekanismenya sendiri: jejak tremor yang menggambar
 * dirinya, beserta frekuensi dan amplitudo yang benar-benar dihitung darinya.
 *
 * Angka akurasi tetap diambil dari backend, hasil validasi holdout sungguhan,
 * dan tetap tampil bersama asal-usulnya. Tanpa itu ia jadi klaim, dan produk
 * ini belum melewati validasi klinis.
 */
export default function LandingPage() {
  const { t, lang } = useI18n();

  /* Halaman depan mengenali pengguna yang sudah masuk.
     ───────────────────────────────────────────────────────────────────────────
     Sebelumnya halaman ini selalu menawarkan "Masuk" dan "Daftar", termasuk
     kepada pasien yang tokennya masih berlaku dan riwayatnya sudah berisi.
     Ia juga tidak pernah menautkan ke /screening sama sekali, sehingga jalan
     terpendek menuju pekerjaan utama produk ini tidak ada di halaman yang
     paling banyak dibuka.

     isLoading dipakai untuk menahan tombol sampai localStorage terbaca. Tanpa
     itu, pengguna yang sudah masuk melihat "Daftar" berkedip lebih dulu. */
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const homeHref = isDoctor ? '/doctor' : '/dashboard';
  const homeLabel = isDoctor ? t('landing.toPortal') : t('landing.toDashboard');
  const [modelInfo, setModelInfo] = useState<ModelAccuracy | null>(null);
  const [stuck, setStuck] = useState(false);

  const [assuranceRef, assuranceShown] = useReveal<HTMLDivElement>();
  const [specimenRef, specimenShown] = useReveal<HTMLDivElement>();
  const [stepsRef, stepsShown] = useReveal<HTMLDivElement>();
  const [provenanceRef, provenanceShown] = useReveal<HTMLDivElement>();

  // Angka naik ke nilainya sendiri begitu blok provenans terlihat. Selama
  // backend belum menjawab, nilainya null dan yang tampil tetap tanda pisah,
  // bukan nol yang bisa salah dibaca sebagai hasil.
  const trainSize = useCountUp(modelInfo?.trainSize ?? null, provenanceShown);
  const testSize = useCountUp(modelInfo?.testSize ?? null, provenanceShown);
  const accuracy = useCountUp(modelInfo?.accuracy ?? null, provenanceShown);

  const locale = lang === 'en' ? 'en' : 'id';
  const whole = (v: number | null) => (v === null ? ' - ' : Math.round(v).toLocaleString(locale));
  const num = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 1 });

  useEffect(() => {
    api.getModelAccuracy().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  // Kop hanya menumbuhkan garis bawahnya setelah halaman digulir. Selama masih
  // di puncak, ia melayang tanpa batas sama sekali di atas ground biru pucat.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const assurances = [
    { icon: ShieldCheck, title: 'land.assurePrivacyTitle', text: 'land.assurePrivacyText' },
    { icon: Camera, title: 'land.assureGearTitle', text: 'land.assureGearText' },
    { icon: Timer, title: 'land.assureTimeTitle', text: 'land.assureTimeText' },
  ];

  const steps = [
    { icon: Video, title: 'land.step1Title', text: 'land.step1Text' },
    { icon: Cpu, title: 'land.step2Title', text: 'land.step2Text' },
    { icon: BookOpen, title: 'land.step3Title', text: 'land.step3Text' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.querySelector(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', targetId);
    }
  };

  return (
    <div className={styles.page}>
      <a href="#main" className="skipToContent">
        {t('nav.skipToContent')}
      </a>

      <header className={`${styles.masthead} ${stuck ? styles.mastheadStuck : ''}`}>
        <div className={styles.mastheadInner}>
          <Logo size={18} />

          <nav className={styles.mastheadNav} aria-label="Bagian halaman">
            <a
              href="#diukur"
              className={styles.navLink}
              onClick={(e) => handleScrollTo(e, '#diukur')}
            >
              {t('land.navMeasured')}
            </a>
            <a
              href="#cara"
              className={styles.navLink}
              onClick={(e) => handleScrollTo(e, '#cara')}
            >
              {t('land.navHow')}
            </a>
            <a
              href="#bukti"
              className={styles.navLink}
              onClick={(e) => handleScrollTo(e, '#bukti')}
            >
              {t('land.navEvidence')}
            </a>
          </nav>

          <div className={styles.mastheadActions}>
            <LanguageToggle />
            <ThemeToggle size="sm" />
            {authLoading ? null : user ? (
              <Link href={homeHref} className={`btn btn--primary ${styles.mastheadCta}`}>
                {homeLabel}
              </Link>
            ) : (
              <>
                <Link href="/login" className={`btn ${styles.mastheadLogin}`}>
                  {t('land.login')}
                </Link>
                <Link href="/demo" className={`btn btn--primary ${styles.mastheadCta}`}>
                  {t('land.tryDemo')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Tesis ───────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroBlob} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={styles.heroBadgeGroup}>
              <span className={styles.heroBadgeChip}>
                <Activity size={14} className={styles.heroBadgeIcon} />
                <span>Skrining Gangguan Neurologis Berbasis Computer Vision & AI</span>
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              {t('land.title1')} {t('land.title2')}{' '}
              <span className={styles.heroTitleAccent}>{t('land.title3')}</span>
            </h1>

            <p className={styles.heroLead}>{t('land.desc')}</p>

            {/* Bagi pengguna yang sudah masuk, aksi utama adalah mengerjakan
                skrining sungguhan atau masuk ke dasbor. */}
            <div className={styles.heroActions}>
              {authLoading ? null : user ? (
                <>
                  {!isDoctor && (
                    <Link href="/screening" className="btn btn--primary btn--lg">
                      {t('landing.continueScreening')}
                    </Link>
                  )}
                  <Link
                    href={homeHref}
                    className={`btn btn--lg${isDoctor ? ' btn--primary' : ''}`}
                  >
                    {homeLabel}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/demo" className="btn btn--primary btn--lg">
                    {t('land.tryDemo')}
                  </Link>
                  <Link href="/register" className="btn btn--lg">
                    {t('land.startFree')}
                  </Link>
                </>
              )}
            </div>

            <p className={styles.heroNote}>
              <Info size={16} strokeWidth={2} className={styles.heroNoteIcon} aria-hidden="true" />
              {t('land.tryDemoSub')}
            </p>

            {/* Centered Showcase Card */}
            <div className={styles.heroShowcase}>
              <div className={styles.heroShowcaseGrid}>
                <div className={styles.heroPhotoWrap}>
                  <Image
                    src={heroDoctor}
                    alt={t('land.heroPhotoAlt')}
                    className={styles.heroPhotoImg}
                    sizes="(max-width: 900px) 92vw, 420px"
                    priority
                  />
                </div>

                <figure className={styles.panel}>
                  <div className={styles.panelHead}>
                    <span className={styles.panelTitle}>{t('land.panelTitle')}</span>
                    {tremorTrace && (
                      <span className={styles.panelTag}>
                        {tremorTrace.kind === 'recording'
                          ? t('land.tagRecording')
                          : t('land.tagIllustration')}
                      </span>
                    )}
                  </div>

                  <TremorPlate />

                  {tremorTrace && (
                    <div className={styles.panelReadout}>
                      <div>
                        <span className={styles.readoutValue}>
                          {num(tremorTrace.durationSec)}
                          <span className={styles.readoutUnit}>s</span>
                        </span>
                        <span className={styles.readoutLabel}>{t('land.readDuration')}</span>
                      </div>
                      <div>
                        <span className={styles.readoutValue}>
                          {num(tremorTrace.dominantFrequencyHz)}
                          <span className={styles.readoutUnit}>Hz</span>
                        </span>
                        <span className={styles.readoutLabel}>{t('land.readFrequency')}</span>
                      </div>
                      <div>
                        <span className={styles.readoutValue}>
                          {num(tremorTrace.amplitudeMillimeter)}
                          <span className={styles.readoutUnit}>mm</span>
                        </span>
                        <span className={styles.readoutLabel}>{t('land.readAmplitude')}</span>
                      </div>
                    </div>
                  )}

                  <figcaption className={styles.panelCaption}>
                    {!tremorTrace
                      ? t('land.plateCaption')
                      : tremorTrace.kind === 'recording'
                        ? t('land.traceCaptionShort')
                        : t('land.traceCaptionShortIllustration')}
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>

          {/* Indikator Gulir ke Bawah Beranimasi */}
          <div className={`${styles.scrollDownWrapper} ${stuck ? styles.scrollDownHidden : ''}`}>
            <a
              href="#jaminan"
              className={styles.scrollDownBtn}
              onClick={(e) => handleScrollTo(e, '#jaminan')}
              aria-label={t('land.scrollDown')}
            >
              <span className={styles.scrollMouse}>
                <span className={styles.scrollWheel} />
              </span>
              <span className={styles.scrollText}>{t('land.scrollExplore')}</span>
              <ChevronDown size={14} className={styles.scrollChevron} />
            </a>
          </div>
        </section>

        {/* ── Jaminan ─────────────────────────────────────────────────────────
            Tiga pernyataan tentang cara kerja, menempati posisi yang pada
            templat rujukan diisi jumlah pasien dan jumlah kamar. */}
        <section id="jaminan" className={styles.assurance}>
          <div
            ref={assuranceRef}
            className={`sheet ${styles.assuranceGrid} ${styles.reveal} ${assuranceShown ? styles.revealShown : ''}`}
          >
            {assurances.map(({ icon: Icon, title, text }) => (
              <div key={title} className={styles.assuranceItem}>
                <span className={styles.assuranceIcon} aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className={styles.assuranceTitle}>{t(title)}</h2>
                  <p className={styles.assuranceText}>{t(text)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Spesimen: apa yang sebenarnya diukur ────────────────────────── */}
        <section id="diukur" className={styles.section}>
          <div
            ref={specimenRef}
            className={`sheet ${styles.reveal} ${specimenShown ? styles.revealShown : ''}`}
          >
            <div className={`docHead ${styles.sectionHeadCenter}`}>
              <div className="docHead__meta" style={{ justifyContent: 'center' }}>
                <span>{t('land.specimen')}</span>
                <span>
                  {TEST_SEQUENCE.length} {t('land.statBiomarkers')} &middot;{' '}
                  {TOTAL_CAPTURE_SECONDS} s
                </span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.featuresTitle')}</h2>
              <p className={styles.sectionLead}>{t('land.featuresDesc')}</p>
            </div>

            {/* Templat rujukan menaruh enam kotak ikon berjajar di posisi ini.
                Yang dipakai di sini tetap tabel: keenam tes punya besaran ukur
                dan durasi yang berbeda, dan itu justru informasi yang hilang
                begitu ia jadi kotak ikon berisi satu kalimat. */}
            <div className={`${styles.tableCard} ${styles.testsCard}`}>
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
                    {TEST_SEQUENCE.map((spec, i) => {
                      const Icon = TEST_ICON[spec.type] ?? Activity;
                      return (
                        <tr
                          key={spec.type}
                          style={{ '--i': i } as CSSProperties}
                          className={`${styles.revealRow} ${specimenShown ? styles.revealRowShown : ''}`}
                        >
                          <th scope="row" className={styles.rowName}>
                            <span className={styles.rowNameInner}>
                              <span className={styles.rowIcon} aria-hidden="true">
                                <Icon size={18} strokeWidth={1.75} />
                              </span>
                              {t(spec.nameKey)}
                            </span>
                          </th>
                          <td>{t(spec.descKey)}</td>
                          <td className="num">
                            <span className={styles.durationChip}>{spec.duration} s</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pita biru: cara kerja ────────────────────────────────────────
            Bidang warna utuh selebar layar dengan kartu putih melayang di
            atasnya. Ini gerakan komposisi yang paling dikenali dari rujukan
            tim, dan ia dipakai tepat sekali supaya tetap berarti. */}
        <section id="cara" className={styles.band}>
          <TraceWave className={styles.bandTrace} />

          <div
            ref={stepsRef}
            className={`sheet ${styles.bandInner} ${styles.reveal} ${
              stepsShown ? styles.revealShown : ''
            }`}
          >
            <h2 className={styles.bandTitle}>{t('land.mechanismTitle')}</h2>
            <p className={styles.bandLead}>{t('land.mechanismBody')}</p>

            <div className={styles.steps}>
              {steps.map(({ icon: Icon, title, text }) => (
                <div key={title} className={styles.step}>
                  <span className={styles.stepIcon} aria-hidden="true">
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <h3 className={styles.stepTitle}>{t(title)}</h3>
                  <p className={styles.stepText}>{t(text)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Provenans model ─────────────────────────────────────────────── */}
        <section id="bukti" className={styles.section}>
          <div
            ref={provenanceRef}
            className={`sheet ${styles.reveal} ${provenanceShown ? styles.revealShown : ''}`}
          >
            <div className={`docHead ${styles.sectionHeadCenter}`}>
              <div className="docHead__meta" style={{ justifyContent: 'center' }}>
                <span>{t('land.provenance')}</span>
              </div>
              <h2 className={styles.sectionTitle}>{t('land.evidenceTitle')}</h2>
              <p className={styles.sectionLead}>{t('land.evidenceLead')}</p>
            </div>

            <div className={styles.provenanceGrid}>
              <div>
                <div className={styles.tableCard} style={{ marginTop: 0 }}>
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
                          {accuracy === null ? ' - ' : `${accuracy.toFixed(1)} %`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className={styles.provenanceNote}>{t('land.accuracyNote')}</p>
              </div>

              <div>
                <h3>{t('land.conditionsTitle')}</h3>
                <ul className={styles.conditionList} style={{ marginTop: 'var(--s5)' }}>
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
            </div>
          </div>
        </section>

        {/* ── Penutup ─────────────────────────────────────────────────────── */}
        <section className={styles.closing}>
          <div className="sheet">
            {/* Foto konsultasi duduk di sisi kartu penutup, bukan di hero.
                Tempatnya memang di sini: kalimat terakhir halaman ini menyuruh
                pengguna menemui tenaga medis kalau hasilnya perlu
                ditindaklanjuti, dan itulah yang sedang terjadi di fotonya. */}
            <div className={styles.closingCard}>
              <TraceWave className={styles.closingTrace} />

              <div className={styles.closingPhoto}>
                <Image
                  src={consultPhoto}
                  alt={t('land.consultAlt')}
                  className={styles.closingPhotoImg}
                  sizes="(max-width: 860px) 92vw, 420px"
                />
              </div>

              <div className={styles.closingBody}>
                <h2 className={styles.closingTitle}>{t('land.ctaTitle')}</h2>
                <p className={styles.closingLead}>{t('land.ctaDesc')}</p>
                <div className={styles.closingActions}>
                  {authLoading ? null : user ? (
                    <Link
                      href={isDoctor ? homeHref : '/screening'}
                      className="btn btn--primary btn--lg"
                    >
                      {isDoctor ? homeLabel : t('landing.continueScreening')}
                    </Link>
                  ) : (
                    <>
                      <Link href="/register" className="btn btn--primary btn--lg">
                        {t('land.ctaButton')}
                      </Link>
                      <Link href="/login" className="btn btn--lg">
                        {t('land.hasAccount')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="sheet">
          <div className={styles.footerInner}>
            <p className={styles.footerDisclaimer}>
              <Info
                size={18}
                strokeWidth={2}
                className={styles.footerDisclaimerIcon}
                aria-hidden="true"
              />
              {t('land.footerDisclaimer')}
            </p>
            {/* Spasi setelah kalimat pembuka ditulis eksplisit: JSX memangkas
                spasi di ujung baris sebelum baris baru, sehingga tanpa ini
                keduanya menempel jadi "mengacu padaMDS-UPDRS". */}
            <p className={styles.references}>
              {t('land.referenceLead')}{' '}
              <span data-no-translate="">
                MDS-UPDRS &middot; Hoehn &amp; Yahr &middot; Zhang dkk. 2017 &middot; Zanardi dkk.
                2021 &middot; Lewek dkk. 2010
              </span>
            </p>
            <p className={styles.references}>{t('land.photoCredit')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
