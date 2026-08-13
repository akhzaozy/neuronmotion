'use client';
import { useState } from 'react';
import AppNav from '@/components/AppNav';
import { PenIcon, BulbIcon, VideoIcon, ActivityIcon, ChartIcon } from '@/components/icons';
import styles from './bantuan.module.css';

const STEPS = [
  {
    icon: PenIcon,
    title: 'Daftar dan lengkapi profil',
    desc: 'Buat akun sebagai pasien, lalu isi tanggal lahir dan jenis kelamin. Data usia dipakai untuk membandingkan hasil Anda dengan rentang normal kelompok usia yang sesuai.',
  },
  {
    icon: BulbIcon,
    title: 'Siapkan ruangan dan posisi',
    desc: 'Cari ruangan dengan pencahayaan cukup (tidak gelap, tidak silau). Untuk tes berjalan, sediakan ruang gerak sekitar 2 meter dan pastikan seluruh tubuh terlihat kamera.',
  },
  {
    icon: VideoIcon,
    title: 'Izinkan akses kamera',
    desc: 'Browser akan meminta izin kamera. Video tidak dikirim ke server, semua analisis gerakan berjalan di perangkat Anda sendiri.',
  },
  {
    icon: ActivityIcon,
    title: 'Ikuti 6 tes gerakan',
    desc: 'Setiap tes diawali panduan bergambar dan hitung mundur. Ikuti instruksi bagian tubuh yang diminta. Sistem akan memberi peringatan jika bagian tubuh tidak terdeteksi jelas.',
  },
  {
    icon: ChartIcon,
    title: 'Lihat hasil dan pantau tren',
    desc: 'Hasil skrining muncul lengkap dengan skor risiko dan rekomendasi. Semua sesi tersimpan di halaman Riwayat agar Anda bisa membandingkan perkembangan dari waktu ke waktu.',
  },
];

const FAQS = [
  {
    q: 'Apakah video saya disimpan atau dikirim ke server?',
    a: 'Tidak. Seluruh analisis gerakan dilakukan langsung di browser perangkat Anda menggunakan model estimasi pose. Video tidak pernah diunggah ke server. Yang dikirim dan disimpan hanyalah hasil perhitungan berupa angka, misalnya frekuensi tremor dalam Hertz atau persentase simetri langkah.',
  },
  {
    q: 'Apakah hasil ini merupakan diagnosis medis?',
    a: 'Bukan. NeuronMotion adalah alat skrining awal untuk membantu mendeteksi perubahan pola gerakan, bukan alat diagnosis. Hasil apa pun, terutama jika menunjukkan risiko sedang atau tinggi, perlu dikonfirmasi melalui pemeriksaan langsung oleh dokter spesialis saraf.',
  },
  {
    q: 'Kamera saya tidak berfungsi, apa yang harus dilakukan?',
    a: 'Pertama, pastikan Anda sudah menekan "Izinkan" saat browser meminta akses kamera. Jika sebelumnya pernah menolak, buka pengaturan izin situs di browser dan aktifkan kembali akses kamera untuk situs ini. Pastikan juga tidak ada aplikasi lain yang sedang memakai kamera, lalu muat ulang halaman. Jika masih bermasalah, coba gunakan browser lain seperti Chrome atau Safari versi terbaru.',
  },
  {
    q: 'Seberapa sering saya sebaiknya melakukan skrining?',
    a: 'Untuk pemantauan umum tanpa keluhan, sekali dalam 6 bulan sudah memadai. Jika Anda berusia di atas 60 tahun atau memiliki riwayat keluarga dengan gangguan saraf, setiap 3 sampai 6 bulan lebih dianjurkan. Bagi yang sedang menjalani rehabilitasi, ikuti jadwal yang disarankan fisioterapis Anda, biasanya setiap 2 sampai 4 minggu.',
  },
  {
    q: 'Perangkat apa saja yang didukung?',
    a: 'NeuronMotion berjalan di browser modern pada laptop, tablet, maupun ponsel, tanpa perlu instalasi aplikasi. Yang dibutuhkan hanya kamera dan browser terbaru (Chrome, Edge, Safari, atau Firefox). Untuk tes yang melibatkan seluruh tubuh seperti berjalan, ponsel yang disandarkan atau laptop dengan jarak sekitar 2 meter akan memberi hasil terbaik.',
  },
  {
    q: 'Kenapa hasil saya berbeda dari sesi sebelumnya?',
    a: 'Variasi kecil antar sesi adalah hal wajar dan bisa dipengaruhi kondisi tubuh (lelah, baru minum kopi, kurang tidur), pencahayaan ruangan, serta posisi dan jarak Anda terhadap kamera. Karena itu tren jangka panjang di halaman Riwayat lebih bermakna dibanding satu hasil tunggal.',
  },
  {
    q: 'Bagaimana cara menghapus data saya?',
    a: 'Buka halaman Profil, lalu pada bagian Privasi dan Data Anda dapat memilih Hapus Riwayat untuk menghapus seluruh sesi pemeriksaan, atau Hapus Akun Saya untuk menghapus akun beserta seluruh datanya secara permanen. Ini adalah hak Anda sesuai UU Perlindungan Data Pribadi.',
  },
];

export default function BantuanPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Bantuan</h1>
          <p>Panduan penggunaan, pertanyaan yang sering diajukan, dan kontak tim NeuronMotion.</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Panduan 5 Langkah</h2>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}><step.icon size={20} /></div>
                <div>
                  <div className={styles.stepTitle}>{i + 1}. {step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pertanyaan yang Sering Diajukan</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <span className={`${styles.faqIcon} ${openIndex === i ? styles.faqIconOpen : ''}`}>+</span>
              </button>
              {openIndex === i && <div className={styles.faqAnswer}>{faq.a}</div>}
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Kontak Tim</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>Email Dukungan</div>
              <div className={styles.contactValue}>support@neuronmotion.id</div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>Tim Pengembang</div>
              <div className={styles.contactValue}>Last Dance Team</div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>Status Produk</div>
              <div className={styles.contactValue}>Beta</div>
            </div>
          </div>
        </div>

        <div className={styles.disclaimer}>
          <strong>Disclaimer:</strong> NeuronMotion adalah alat bantu skrining awal berbasis analisis
          gerakan, bukan alat diagnosis medis dan bukan pengganti pemeriksaan tenaga kesehatan. Model
          klasifikasi saat ini divalidasi menggunakan dataset sintetis berbasis literatur klinis, bukan
          uji klinis pada pasien nyata. Untuk keputusan medis apa pun, selalu konsultasikan dengan dokter.
          Jika Anda mengalami gejala darurat seperti kelemahan mendadak pada satu sisi tubuh, wajah perot,
          atau kesulitan bicara tiba-tiba, segera cari pertolongan medis darurat.
        </div>
      </div>
    </div>
  );
}
