'use client';
import * as Accordion from '@radix-ui/react-accordion';
import AppNav from '@/components/AppNav';
import styles from './bantuan.module.css';

const STEPS = [
  {
    title: 'Daftar dan lengkapi profil',
    desc: 'Buat akun sebagai pasien, lalu isi tanggal lahir dan jenis kelamin. Data usia dipakai untuk membandingkan hasil Anda dengan rentang normal kelompok usia yang sesuai.',
  },
  {
    title: 'Siapkan ruangan dan posisi',
    desc: 'Cari ruangan dengan pencahayaan cukup (tidak gelap, tidak silau). Untuk tes berjalan, sediakan ruang gerak sekitar 2 meter dan pastikan seluruh tubuh terlihat kamera.',
  },
  {
    title: 'Izinkan akses kamera',
    desc: 'Browser akan meminta izin kamera. Video tidak dikirim ke server, semua analisis gerakan berjalan di perangkat Anda sendiri.',
  },
  {
    title: 'Ikuti 6 tes gerakan',
    desc: 'Setiap tes diawali panduan bergambar dan hitung mundur. Ikuti instruksi bagian tubuh yang diminta. Sistem akan memberi peringatan jika bagian tubuh tidak terdeteksi jelas.',
  },
  {
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

const CONTACTS = [
  { label: 'Email Dukungan', value: 'support@neuronmotion.id' },
  { label: 'Tim Pengembang', value: 'Last Dance Team' },
  { label: 'Status Produk', value: 'Beta' },
];

export default function BantuanPage() {
  return (
    <div className={styles.page}>
      <AppNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span>Panduan Pengguna</span>
              <span>{STEPS.length} langkah</span>
              <span>{FAQS.length} pertanyaan</span>
            </div>
            <h1>Bantuan</h1>
            <p className={styles.lead}>
              Panduan penggunaan, pertanyaan yang sering diajukan, dan kontak tim NeuronMotion.
            </p>
          </header>

          {/* Batas kemampuan alat ditempatkan di atas isi, bukan di kaki halaman,
              supaya terbaca sebelum pengguna menarik kesimpulan dari hasilnya.
              Blok ini tidak punya syarat dan tidak bisa ditutup. */}
          <section className={styles.disclaimer} aria-label="Batas kemampuan alat">
            <p className={`label ${styles.disclaimerLabel}`}>Disclaimer</p>
            <p className={styles.disclaimerBody}>
              NeuronMotion adalah alat bantu skrining awal berbasis analisis gerakan, bukan alat
              diagnosis medis dan bukan pengganti pemeriksaan tenaga kesehatan. Model klasifikasi saat
              ini divalidasi menggunakan dataset sintetis berbasis literatur klinis, bukan uji klinis
              pada pasien nyata. Untuk keputusan medis apa pun, selalu konsultasikan dengan dokter.
            </p>
            <p className={styles.emergency}>
              Jika Anda mengalami gejala darurat seperti kelemahan mendadak pada satu sisi tubuh, wajah
              perot, atau kesulitan bicara tiba-tiba, segera cari pertolongan medis darurat.
            </p>
          </section>

          {/* ── Panduan langkah ───────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionHead}>Panduan 5 Langkah</h2>
            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.stepText}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Pertanyaan yang sering diajukan ───────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionHead}>Pertanyaan yang Sering Diajukan</h2>
            {/* Radix menangani keadaan buka tutup dan atribut aria; keadaannya
                tetap dibawa kata, bukan tanda tambah yang berputar. */}
            <Accordion.Root type="single" collapsible defaultValue="faq-0" className={styles.faq}>
              {FAQS.map((faq, i) => (
                <Accordion.Item key={faq.q} value={`faq-${i}`} className={styles.faqItem}>
                  <Accordion.Header className={styles.faqHeader}>
                    <Accordion.Trigger className={styles.faqTrigger}>
                      <span className={styles.faqQuestion}>{faq.q}</span>
                      {/* Keadaan dibawa dua kata yang saling menggantikan,
                          bukan tanda tambah yang berputar. */}
                      <span className={styles.faqState} aria-hidden="true">
                        <span className={styles.faqStateClosed}>Buka</span>
                        <span className={styles.faqStateOpen}>Tutup</span>
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className={styles.faqContent}>
                    <p className={styles.faqAnswer}>{faq.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>

          {/* ── Kontak ────────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionHead}>Kontak Tim</h2>
            <dl className={styles.contactList}>
              {CONTACTS.map(item => (
                <div key={item.label} className={styles.contactRow}>
                  <dt className={`label ${styles.contactLabel}`}>{item.label}</dt>
                  <dd className={styles.contactValue}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}
