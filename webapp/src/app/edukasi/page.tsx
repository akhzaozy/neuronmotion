'use client';
import { useState } from 'react';
import AppNav from '@/components/AppNav';
import styles from './edukasi.module.css';

interface Article {
  id: string;
  icon: string;
  tag: string;
  title: string;
  excerpt: string;
  readTime: string;
  body: React.ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: 'tremor',
    icon: '🤚',
    tag: 'Gejala',
    title: 'Apa Itu Tremor dan Kapan Perlu Diperiksa?',
    excerpt: 'Tidak semua getaran tangan berbahaya. Kenali beda tremor biasa dan yang perlu dievaluasi dokter.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Tremor adalah gerakan bergetar yang terjadi tanpa kita sengaja. Hampir semua orang pernah mengalaminya, misalnya saat lelah, cemas, kedinginan, atau setelah minum kopi berlebihan. Tremor semacam ini normal dan biasanya hilang sendiri.</p>
        <h3>Kapan tremor perlu diperhatikan?</h3>
        <ul>
          <li>Muncul saat tangan sedang <strong>diam dan rileks</strong>, bukan saat sedang beraktivitas</li>
          <li>Terjadi terus-menerus selama berminggu-minggu, bukan sesekali</li>
          <li>Awalnya hanya di satu sisi tubuh (satu tangan saja)</li>
          <li>Mulai mengganggu aktivitas sehari-hari seperti menulis atau memegang gelas</li>
        </ul>
        <h3>Apa yang diukur NeuronMotion?</h3>
        <p>Sistem mengukur dua hal: seberapa cepat getaran terjadi (frekuensi, dalam Hertz) dan seberapa besar simpangannya (amplitudo). Pola getaran sekitar 4 sampai 6 Hz saat tangan diam adalah pola yang dalam literatur klinis sering dikaitkan dengan Parkinson, sementara getaran lebih cepat cenderung mengarah ke kondisi lain seperti essential tremor.</p>
        <p>Perlu dicatat: pola ini hanya petunjuk awal. Diagnosis sebenarnya membutuhkan pemeriksaan langsung oleh dokter spesialis saraf.</p>
      </>
    ),
  },
  {
    id: 'parkinson',
    icon: '🧠',
    tag: 'Kondisi',
    title: 'Mengenali Tanda Awal Parkinson',
    excerpt: 'Parkinson tidak selalu dimulai dengan tremor. Ada tanda lain yang sering terlewat.',
    readTime: '3 menit baca',
    body: (
      <>
        <p>Penyakit Parkinson berkembang perlahan, sering kali bertahun-tahun sebelum gejalanya jelas terlihat. Karena itu deteksi dini sangat berharga: semakin awal ditangani, semakin baik kualitas hidup yang bisa dipertahankan.</p>
        <h3>Empat tanda motorik utama</h3>
        <ul>
          <li><strong>Tremor saat istirahat</strong>: getaran muncul justru ketika anggota tubuh sedang diam</li>
          <li><strong>Bradikinesia</strong>: gerakan menjadi lebih lambat, misalnya langkah mengecil atau tulisan tangan mengecil</li>
          <li><strong>Kekakuan otot</strong>: lengan terasa kaku, ayunan tangan saat berjalan berkurang di satu sisi</li>
          <li><strong>Gangguan keseimbangan</strong>: mudah goyah saat berdiri atau berbalik badan</li>
        </ul>
        <h3>Tanda non-motorik yang sering terlewat</h3>
        <p>Beberapa gejala justru muncul lebih dulu, bertahun-tahun sebelum gejala motorik: berkurangnya kemampuan membau, gangguan tidur (bergerak aktif saat bermimpi), sembelit menahun, dan perubahan suasana hati.</p>
        <p>Jika Anda atau keluarga mengalami beberapa hal di atas secara bersamaan dan menetap, konsultasi ke dokter saraf adalah langkah yang tepat.</p>
      </>
    ),
  },
  {
    id: 'gait',
    icon: '🚶',
    tag: 'Biomarker',
    title: 'Kenapa Cara Berjalan Bisa Menunjukkan Kesehatan Saraf?',
    excerpt: 'Berjalan terlihat sederhana, padahal melibatkan koordinasi otak yang rumit.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Berjalan tampak otomatis, tetapi sebenarnya membutuhkan kerja sama antara otak, saraf tulang belakang, otot, dan sistem keseimbangan. Ketika ada gangguan pada jalur saraf, perubahannya sering muncul pada cara berjalan lebih dulu, bahkan sebelum penderitanya menyadari.</p>
        <h3>Yang diukur dari pola jalan</h3>
        <ul>
          <li><strong>Kadense</strong>: jumlah langkah per menit. Melambat bisa menjadi tanda bradikinesia</li>
          <li><strong>Simetri langkah</strong>: apakah langkah kiri dan kanan seimbang. Asimetri sering muncul pada Parkinson tahap awal maupun pasca stroke</li>
          <li><strong>Ayunan lengan</strong>: berkurangnya ayunan pada satu sisi adalah salah satu tanda paling awal Parkinson</li>
        </ul>
        <h3>Perlu diingat soal usia</h3>
        <p>Kecepatan berjalan memang menurun secara alami seiring bertambahnya usia, bahkan pada orang yang sehat. Karena itu NeuronMotion menyesuaikan rentang normal berdasarkan kelompok usia Anda, supaya lansia yang sehat tidak salah ditandai sebagai berisiko.</p>
      </>
    ),
  },
  {
    id: 'stroke',
    icon: '⚡',
    tag: 'Kondisi',
    title: 'Rehabilitasi Pasca Stroke dan Pemantauan Mandiri',
    excerpt: 'Pemulihan stroke adalah proses panjang. Pemantauan berkala membantu melihat kemajuan.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Setelah stroke, banyak penyintas mengalami kelemahan pada satu sisi tubuh. Proses pemulihan bisa berlangsung berbulan-bulan hingga bertahun-tahun, dan kemajuannya sering terasa lambat sehingga sulit dinilai dari perasaan saja.</p>
        <h3>Kenapa pemantauan berkala membantu</h3>
        <ul>
          <li>Perubahan kecil yang tidak terasa sehari-hari bisa terlihat dalam grafik tren beberapa bulan</li>
          <li>Data objektif memudahkan fisioterapis menyesuaikan program latihan</li>
          <li>Melihat kemajuan yang terukur bisa menjaga motivasi selama rehabilitasi</li>
        </ul>
        <h3>Tetap konsultasikan ke tenaga medis</h3>
        <p>Skrining mandiri melengkapi, bukan menggantikan, pemeriksaan fisioterapis atau dokter. Jika muncul gejala stroke baru seperti wajah tiba-tiba perot, lengan lemas mendadak, atau bicara pelo, segera cari pertolongan medis darurat.</p>
      </>
    ),
  },
  {
    id: 'skrining-rutin',
    icon: '📅',
    tag: 'Tips',
    title: 'Seberapa Sering Sebaiknya Melakukan Skrining?',
    excerpt: 'Terlalu sering bisa membuat cemas, terlalu jarang bisa melewatkan perubahan.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Frekuensi skrining yang tepat tergantung kondisi Anda. Berikut panduan umum sebagai titik awal, yang sebaiknya disesuaikan dengan saran tenaga medis Anda.</p>
        <h3>Panduan umum</h3>
        <ul>
          <li><strong>Tanpa keluhan, usia di bawah 50</strong>: cukup sekali dalam 6 sampai 12 bulan</li>
          <li><strong>Usia di atas 60 atau ada riwayat keluarga</strong>: setiap 3 sampai 6 bulan</li>
          <li><strong>Sedang menjalani rehabilitasi</strong>: setiap 2 sampai 4 minggu, sesuai arahan fisioterapis</li>
          <li><strong>Hasil sebelumnya risiko sedang atau tinggi</strong>: ikuti jadwal yang disarankan dokter</li>
        </ul>
        <h3>Tips agar hasil konsisten</h3>
        <p>Lakukan skrining pada waktu yang kurang lebih sama setiap kali, misalnya pagi hari setelah istirahat cukup. Hindari melakukan tes setelah aktivitas fisik berat, saat sangat lelah, atau setelah minum kopi, karena hal-hal ini dapat memengaruhi hasil pengukuran.</p>
      </>
    ),
  },
  {
    id: 'privasi',
    icon: '🔒',
    tag: 'Privasi',
    title: 'Bagaimana Data Gerakan Anda Diproses?',
    excerpt: 'Video Anda tidak dikirim ke server. Ini penjelasan teknisnya secara sederhana.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Salah satu kekhawatiran wajar saat menggunakan aplikasi berbasis kamera adalah: ke mana video saya pergi? Berikut penjelasan apa yang sebenarnya terjadi.</p>
        <h3>Video diproses di perangkat Anda</h3>
        <p>Analisis gerakan dilakukan langsung di browser perangkat Anda menggunakan model estimasi pose. Video dari kamera tidak diunggah ke server mana pun. Yang dikirim ke server hanyalah hasil perhitungan berupa angka, misalnya frekuensi tremor dalam Hertz atau persentase simetri langkah.</p>
        <h3>Apa yang tersimpan</h3>
        <ul>
          <li>Angka hasil pengukuran biomarker</li>
          <li>Skor risiko dan rekomendasi dari setiap sesi</li>
          <li>Data profil dasar seperti nama, tanggal lahir, dan jenis kelamin</li>
        </ul>
        <h3>Hak Anda atas data</h3>
        <p>Anda dapat menghapus seluruh riwayat pemeriksaan atau menghapus akun beserta datanya kapan saja melalui halaman Profil, sesuai prinsip hak penghapusan data dalam UU Perlindungan Data Pribadi.</p>
      </>
    ),
  },
];

export default function EdukasiPage() {
  const [active, setActive] = useState<Article | null>(null);

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Edukasi</h1>
          <p>Bacaan singkat dengan bahasa sederhana untuk memahami hasil skrining dan kesehatan saraf Anda.</p>
        </div>

        <div className={styles.grid}>
          {ARTICLES.map(article => (
            <button key={article.id} className={styles.articleCard} onClick={() => setActive(article)}>
              <span className={styles.articleIcon}>{article.icon}</span>
              <span className={styles.articleTag}>{article.tag}</span>
              <span className={styles.articleTitle}>{article.title}</span>
              <span className={styles.articleExcerpt}>{article.excerpt}</span>
              <span className={styles.readTime}>{article.readTime}</span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.readerCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{active.icon}</div>
            <h2 className={styles.readerTitle}>{active.title}</h2>
            <p className={styles.readerMeta}>{active.tag} &bull; {active.readTime}</p>
            <div className={styles.readerBody}>{active.body}</div>
            <div className={styles.disclaimer}>
              Artikel ini bersifat edukatif dan bukan pengganti nasihat medis. Untuk keputusan terkait
              kondisi Anda, konsultasikan dengan dokter atau tenaga kesehatan.
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => setActive(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
