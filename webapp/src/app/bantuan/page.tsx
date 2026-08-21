'use client';
import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import {
  UserCheck,
  Maximize2,
  Camera,
  Activity,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  Mail,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  HeartPulse,
  Layers,
} from 'lucide-react';
import AppNav from '@/components/AppNav';
import styles from './bantuan.module.css';

const STEPS = [
  {
    icon: UserCheck,
    title: 'Daftar dan lengkapi profil',
    desc: 'Buat akun sebagai pasien, lalu isi tanggal lahir, jenis kelamin, dan wilayah. Data usia dipakai untuk membandingkan hasil Anda dengan rentang normal kelompok usia yang sesuai.',
  },
  {
    icon: Maximize2,
    title: 'Siapkan ruangan dan posisi',
    desc: 'Cari ruangan dengan pencahayaan cukup (tidak gelap, tidak silau). Untuk tes berjalan, sediakan ruang gerak sekitar 2 meter dan pastikan seluruh tubuh terlihat kamera.',
  },
  {
    icon: Camera,
    title: 'Izinkan akses kamera',
    desc: 'Browser akan meminta izin kamera. Video tidak pernah dikirim ke server, seluruh analisis estimasi gerakan berjalan langsung di perangkat Anda sendiri.',
  },
  {
    icon: Activity,
    title: 'Ikuti 6 tes gerakan',
    desc: 'Setiap tes diawali panduan visual dan hitung mundur. Ikuti instruksi gerakan yang diminta. Sistem akan memberi peringatan jika bagian tubuh tidak terdeteksi jelas.',
  },
  {
    icon: TrendingUp,
    title: 'Lihat hasil dan pantau tren',
    desc: 'Hasil skrining muncul lengkap dengan skor risiko dan rekomendasi. Semua sesi tersimpan di halaman Riwayat agar Anda bisa mengunduh PDF atau membandingkan perkembangan berkala.',
  },
];

const FAQS = [
  {
    q: 'Apakah video saya disimpan atau dikirim ke server?',
    a: 'Tidak. Seluruh analisis gerakan dilakukan langsung di browser perangkat Anda menggunakan model estimasi pose. Video tidak pernah diunggah ke server. Yang dikirim dan disimpan hanyalah hasil perhitungan berupa angka biomarker (misalnya frekuensi tremor dalam Hertz atau persentase simetri langkah).',
  },
  {
    q: 'Apakah hasil ini merupakan diagnosis medis?',
    a: 'Bukan. NeuronMotion adalah alat skrining awal untuk membantu mendeteksi perubahan pola gerakan, bukan alat diagnosis definitif. Hasil apa pun, terutama jika menunjukkan risiko sedang atau tinggi, perlu dikonfirmasi melalui pemeriksaan klinis langsung oleh dokter spesialis saraf.',
  },
  {
    q: 'Kamera saya tidak berfungsi, apa yang harus dilakukan?',
    a: 'Pastikan Anda sudah menekan "Izinkan" saat browser meminta akses kamera. Jika sebelumnya pernah menolak, buka pengaturan izin situs di browser dan aktifkan kembali izin kamera untuk web ini. Pastikan juga tidak ada aplikasi lain yang sedang mengunci kamera, lalu muat ulang halaman.',
  },
  {
    q: 'Seberapa sering saya sebaiknya melakukan skrining?',
    a: 'Untuk pemantauan umum tanpa keluhan, sekali dalam 6 bulan sudah memadai. Jika Anda berusia di atas 60 tahun atau memiliki riwayat keluarga dengan gangguan saraf, setiap 3 sampai 6 bulan lebih dianjurkan. Bagi yang sedang menjalani terapi, ikuti anjuran fisioterapis Anda (biasanya setiap 2 sampai 4 minggu).',
  },
  {
    q: 'Perangkat apa saja yang didukung?',
    a: 'NeuronMotion berjalan di browser modern pada laptop, tablet, maupun ponsel cerdas tanpa perlu instalasi aplikasi tambahan. Yang dibutuhkan hanyalah kamera depan/webcam dan browser modern (Chrome, Edge, Safari, atau Firefox).',
  },
  {
    q: 'Kenapa hasil saya berbeda dari sesi sebelumnya?',
    a: 'Variasi wajar antar sesi bisa dipengaruhi oleh kondisi kelelahan tubuh, waktu istirahat, pencahayaan ruangan, serta stabilitas sudut kamera. Karena itu, grafik tren jangka panjang di halaman Riwayat jauh lebih informatif dibanding satu sesi tunggal.',
  },
  {
    q: 'Bagaimana cara menghapus data saya?',
    a: 'Buka halaman Profil, lalu pada bagian Privasi dan Data Anda dapat memilih "Hapus Riwayat" untuk menghapus seluruh rekaman sesi, atau "Hapus Akun Saya" untuk menghapus akun secara permanen sesuai standar hak perlindungan data pribadi (UU PDP).',
  },
];

const CONTACTS = [
  {
    icon: Mail,
    label: 'Email Dukungan',
    value: 'support@neuronmotion.id',
    href: 'mailto:support@neuronmotion.id',
  },
  {
    icon: Sparkles,
    label: 'Tim Pengembang',
    value: 'Last Dance Team',
  },
  {
    icon: HeartPulse,
    label: 'Status Sistem',
    value: 'Operasional (Beta)',
    isStatus: true,
  },
];

export default function BantuanPage() {
  return (
    <div className={styles.page}>
      <AppNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          {/* Header Halaman */}
          <header className={styles.header}>
            <div className={styles.metaPillGroup}>
              <span className={styles.metaChip}>
                <BookOpen size={13} aria-hidden="true" />
                Panduan Pengguna
              </span>
              <span className={styles.metaChip}>
                <Layers size={13} aria-hidden="true" />
                {STEPS.length} Langkah Praktis
              </span>
              <span className={styles.metaChip}>
                <HelpCircle size={13} aria-hidden="true" />
                {FAQS.length} Pertanyaan Umum
              </span>
            </div>
            <h1 className={styles.title}>Pusat Bantuan & Panduan</h1>
            <p className={styles.lead}>
              Panduan lengkap persiapan ruangan, prosedur tes kamera, serta jawaban atas pertanyaan medis dan teknis seputar skrining motorik.
            </p>
          </header>

          {/* Batas Kemampuan Alat & Pernyataan Medis */}
          <motion.section
            className={styles.disclaimerCard}
            aria-label="Batas kemampuan alat"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className={styles.disclaimerHead}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.disclaimerBadge}>
                <ShieldAlert size={15} aria-hidden="true" />
                Disclaimer Medis
              </div>
              <h2 className={styles.disclaimerTitle}>Batas Kemampuan Alat Skrining</h2>
            </motion.div>
            <motion.p
              className={styles.disclaimerText}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              NeuronMotion adalah alat bantu skrining awal berbasis analisis pergerakan kamera cerdas, bukan alat diagnosis medis mandiri dan bukan pengganti konsultasi tenaga medis profesional. Model klasifikasi divalidasi menggunakan dataset berbasis literatur klinis. Untuk evaluasi dan tindakan medis, selalu konsultasikan kondisi Anda dengan dokter spesialis saraf.
            </motion.p>
            <motion.div
              className={styles.emergencyBox}
              role="alert"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <AlertTriangle size={20} className={styles.emergencyIcon} aria-hidden="true" />
              <div>
                <strong>Protokol Gejala Darurat: </strong>
                Jika Anda atau kerabat mengalami kelemahan mendadak pada satu sisi tubuh, wajah perot, atau kesulitan bicara tiba-tiba, segera cari pertolongan medis darurat (IGD) atau hubungi nomor darurat 112 / 119 terdekat.
              </div>
            </motion.div>
          </motion.section>

          {/* ── Panduan 5 Langkah ─────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <Layers size={22} className={styles.sectionIcon} aria-hidden="true" />
              <h2 className={styles.sectionTitle}>Panduan 5 Langkah Skrining</h2>
            </div>
            <div className={styles.stepsGrid}>
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className={styles.stepCard}>
                    <div className={styles.stepTop}>
                      <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                      <div className={styles.stepIconWrap} aria-hidden="true">
                        <Icon size={18} />
                      </div>
                    </div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Pertanyaan yang Sering Diajukan (FAQ) ───────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <HelpCircle size={22} className={styles.sectionIcon} aria-hidden="true" />
              <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan</h2>
            </div>

            <Accordion.Root type="single" collapsible defaultValue="faq-0" className={styles.faqList}>
              {FAQS.map((faq, i) => (
                <Accordion.Item key={faq.q} value={`faq-${i}`} className={styles.faqItem}>
                  <Accordion.Header className={styles.faqHeader}>
                    <Accordion.Trigger className={styles.faqTrigger}>
                      <span className={styles.faqQuestion}>{faq.q}</span>
                      <ChevronDown size={18} className={styles.faqChevron} aria-hidden="true" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className={styles.faqContent}>
                    <p className={styles.faqAnswer}>{faq.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>

          {/* ── Kontak & Dukungan ─────────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <Mail size={22} className={styles.sectionIcon} aria-hidden="true" />
              <h2 className={styles.sectionTitle}>Kontak & Dukungan Pengguna</h2>
            </div>
            <div className={styles.contactGrid}>
              {CONTACTS.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={styles.contactCard}>
                    <div className={styles.contactCardHead}>
                      <div className={styles.contactIconWrap} aria-hidden="true">
                        <Icon size={20} />
                      </div>
                      <span className={styles.contactLabel}>{item.label}</span>
                    </div>
                    {item.href ? (
                      <a href={item.href} className={styles.contactValue}>
                        {item.value}
                      </a>
                    ) : item.isStatus ? (
                      <span className={`${styles.contactValue} ${styles.statusLive}`}>
                        <span className={styles.statusBeacon} />
                        {item.value}
                      </span>
                    ) : (
                      <span className={styles.contactValue}>{item.value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
