'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Accordion from '@radix-ui/react-accordion';
import {
  Stethoscope,
  BookOpen,
  HelpCircle,
  Link2,
  LayoutDashboard,
  FileText,
  FileDown,
  AlertTriangle,
  ChevronDown,
  Mail,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import DoctorNav from '@/components/DoctorNav';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './doctorBantuan.module.css';

const PORTAL_STEPS = [
  {
    icon: Link2,
    title: 'Tautkan pasien ke akun Anda',
    desc: 'Pasien membagikan kode akses unik dari halaman Riwayat atau laporan PDF mereka. Masukkan kode tersebut untuk menghubungkan rekam skrining pasien ke daftar Anda.',
  },
  {
    icon: LayoutDashboard,
    title: 'Pantau tren & detail biomarker',
    desc: 'Buka dashboard nakes untuk melihat sebaran risiko, grafik komposit antar sesi, serta nilai obyektif tiap biomarker fisik (tremor, tapping, gait, sway, dll).',
  },
  {
    icon: FileText,
    title: 'Berikan evaluasi & catatan klinis',
    desc: 'Tuliskan catatan evaluasi medis dan rencana tindak lanjut langsung di detail sesi. Catatan ini otomatis tersinkronisasi ke tampilan dashboard pasien.',
  },
  {
    icon: FileDown,
    title: 'Unduh laporan PDF medis',
    desc: 'Unduh laporan komprehensif beresolusi tinggi yang terstandarisasi untuk dilampirkan ke berkas rekam medis RS/klinik atau dibahas saat konsultasi tatap muka.',
  },
];

const FAQ = [
  {
    q: 'Apakah data NeuronMotion bisa dipakai untuk diagnosis?',
    a: 'Tidak bila berdiri sendiri. Data di sini berperan sebagai penunjang evaluasi awal: mengukur biomarker gerakan secara objektif dan memantau perubahannya antar waktu. Diagnosis tetap memerlukan anamnesis, pemeriksaan fisik langsung, dan pertimbangan klinis dokter.',
  },
  {
    q: 'Bagaimana Risk Score dihitung?',
    a: 'Skor komposit adalah rata-rata tertimbang penilaian tiap biomarker terhadap ambang klinis, dengan bobot terbesar pada tremor dan finger tapping. Terpisah dari itu, model K-NN mencocokkan profil pasien dengan pola kondisi terdekat. Rincian bobot dijelaskan pada halaman Edukasi.',
  },
  {
    q: 'Bagaimana jika kualitas data pasien rendah?',
    a: 'Setiap sesi mencatat proporsi frame valid yang berhasil mendeteksi bagian tubuh. Sesi berkualitas rendah ditolak sistem. Jika hasil tersimpan tampak janggal, minta pasien mengulang di ruangan terang dengan jarak 2-3 meter tanpa memegang kamera.',
  },
  {
    q: 'Bagaimana privasi pasien dijaga?',
    a: 'Video tidak pernah dikirim atau disimpan di server. Seluruh estimasi pose berjalan lokal di perangkat pasien (on-device). Yang dikirim hanya angka biomarker terenkripsi. Pasien memegang kendali penuh atas kode akses dan riwayat mereka.',
  },
  {
    q: 'Bagaimana cara melepaskan tautan pasien?',
    a: 'Buka detail pasien pada daftar, lalu pilih Lepaskan Tautan. Data pasien tidak akan muncul lagi di portal Anda kecuali pasien membagikan kode tautan baru. Catatan klinis terdahulu tetap tersimpan pada riwayat pasien.',
  },
  {
    q: 'Berapa lama verifikasi akun tenaga kesehatan?',
    a: 'Akun tenaga kesehatan aktif langsung setelah pendaftaran dengan melengkapi profesi dan institusi. Gunakan akses data pasien semata-mata untuk kepentingan perawatan medis yang sah.',
  },
];

export default function DoctorBantuanPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <DoctorNav />
        <main className="sheet">
          <LoadingScreen
            title="Memuat Panduan Nakes..."
            subtitle="Menyiapkan alur kerja klinis dan dokumentasi sistem..."
          />
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'DOCTOR') {
    router.push('/login');
    return null;
  }

  return (
    <div className={styles.page}>
      <DoctorNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          {/* ── Header Halaman ────────────────────────────────────────────── */}
          <header className={styles.header}>
            <div className={styles.metaPillGroup}>
              <span className={styles.metaChip}>
                <Stethoscope size={14} color="var(--accent)" />
                Portal Tenaga Kesehatan
              </span>
              <span className={styles.metaChip}>
                <BookOpen size={14} color="var(--accent)" />
                {PORTAL_STEPS.length} Langkah Alur Kerja
              </span>
              <span className={styles.metaChip}>
                <HelpCircle size={14} color="var(--accent)" />
                {FAQ.length} Pertanyaan Umum
              </span>
            </div>
            <h1 className={styles.title}>Pusat Bantuan & Panduan Nakes</h1>
            <p className={styles.lead}>
              Panduan integrasi alur kerja klinis, interpretasi data objektif pasien, serta tanya jawab seputar operasional portal NeuronMotion.
            </p>
          </header>

          {/* ── Disclaimer Medis Klinis ───────────────────────────────────── */}
          <section className={styles.disclaimerCard} aria-label="Batas kemampuan klinis">
            <div className={styles.disclaimerIconWrap}>
              <AlertTriangle size={22} />
            </div>
            <div className={styles.disclaimerContent}>
              <h2 className={styles.disclaimerTitle}>Pedoman Penggunaan Klinis</h2>
              <p className={styles.disclaimerText}>
                NeuronMotion adalah instrumen skrining kuantitatif penunjang evaluasi fisik, <strong>bukan pengganti diagnosis medis dokter</strong>. Seluruh metrik motorik dan klasifikasi pola harus dikonfirmasi melalui anamnesis, pemeriksaan neurologis langsung, dan penilaian komprehensif.
              </p>
            </div>
          </section>

          {/* ── 4 Langkah Alur Kerja Portal ───────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Alur Kerja Portal Tenaga Kesehatan</h2>
              <p className={styles.sectionDesc}>
                Empat langkah praktis menghubungkan, mengevaluasi, dan mendokumentasikan data kesehatan pasien.
              </p>
            </div>

            <div className={styles.stepGrid}>
              {PORTAL_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className={styles.stepCard}>
                    <div className={styles.stepCardHead}>
                      <span className={styles.stepBadge}>Langkah {i + 1}</span>
                      <span className={styles.stepIconWrap}>
                        <Icon size={20} />
                      </span>
                    </div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ── Tanya Jawab Klinis (FAQ) ──────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan</h2>
              <p className={styles.sectionDesc}>
                Jawaban seputar metodologi estimasi pose, akurasi, dan kepatuhan privasi data medis.
              </p>
            </div>

            <Accordion.Root type="single" collapsible className={styles.faqRoot}>
              {FAQ.map((item, i) => (
                <Accordion.Item key={item.q} value={`faq-${i}`} className={styles.faqItem}>
                  <Accordion.Header className={styles.faqHeader}>
                    <Accordion.Trigger className={styles.faqTrigger}>
                      <span className={styles.faqQuestion}>{item.q}</span>
                      <ChevronDown size={18} className={styles.chevronIcon} aria-hidden="true" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className={styles.faqContent}>
                    <div className={styles.faqAnswerWrap}>
                      <p className={styles.faqAnswer}>{item.a}</p>
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>

          {/* ── Bantuan & Kontak ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Dukungan & Sumber Daya Klinis</h2>
              <p className={styles.sectionDesc}>
                Hubungi tim medis teknis kami atau pelajari artikel referensi metodologi.
              </p>
            </div>

            <div className={styles.contactGrid}>
              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}>
                  <Mail size={22} />
                </div>
                <div className={styles.contactBody}>
                  <h3 className={styles.contactTitle}>Konsultasi Teknis Nakes</h3>
                  <p className={styles.contactText}>Pertanyaan seputar integrasi rekam medis dan format laporan.</p>
                  <a href="mailto:nakes@neuronmotion.id" className={styles.contactLink}>
                    nakes@neuronmotion.id
                  </a>
                </div>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}>
                  <BookOpen size={22} />
                </div>
                <div className={styles.contactBody}>
                  <h3 className={styles.contactTitle}>Dokumentasi Metodologi</h3>
                  <p className={styles.contactText}>Pelajari rincian formula pembobotan skor dan klasifikasi K-NN.</p>
                  <Link href="/doctor/edukasi" className={styles.contactLink}>
                    Buka Halaman Edukasi &rarr;
                  </Link>
                </div>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}>
                  <ShieldCheck size={22} />
                </div>
                <div className={styles.contactBody}>
                  <h3 className={styles.contactTitle}>Standar Keamanan PDP</h3>
                  <p className={styles.contactText}>Enkripsi data klinis lokal sesuai regulasi UU PDP Indonesia.</p>
                  <span className={styles.contactBadge}>Enkripsi On-Device</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
