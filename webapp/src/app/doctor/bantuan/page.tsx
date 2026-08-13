'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import DoctorNav from '@/components/DoctorNav';
import styles from '../../bantuan/bantuan.module.css';

const PORTAL_STEPS = [
  {
    title: 'Tautkan pasien ke akun Anda',
    desc: 'Pasien membagikan kode tautan dari halaman Riwayat atau laporan PDF mereka. Masukkan kode tersebut untuk menghubungkan akun, sehingga hasil skriningnya muncul di daftar pasien Anda.',
  },
  {
    title: 'Baca dashboard dan detail pasien',
    desc: 'Dashboard menampilkan jumlah pasien serta sebaran kategori risiko. Klik nama pasien untuk melihat skor komposit, tren antar sesi, dan angka tiap biomarker pada sesi terpilih.',
  },
  {
    title: 'Tambahkan catatan klinis',
    desc: 'Pada detail sesi, tulis hasil evaluasi dan rencana tindak lanjut Anda. Catatan ini tampil di dashboard pasien, sehingga mereka tahu langkah berikutnya.',
  },
  {
    title: 'Unduh laporan PDF',
    desc: 'Laporan berisi ringkasan skor, tren, dan rincian biomarker dalam format yang siap dilampirkan ke rekam medis atau dibaca saat konsultasi tanpa perlu membuka portal.',
  },
];

const FAQ = [
  {
    q: 'Apakah data NeuronMotion bisa dipakai untuk diagnosis?',
    a: 'Tidak, tidak bila berdiri sendiri. Data di sini berperan sebagai penunjang evaluasi awal: mengukur biomarker gerakan secara objektif dan memantau perubahannya antar waktu. Diagnosis tetap memerlukan anamnesis, pemeriksaan fisik langsung, dan pertimbangan klinis Anda. Sistem juga belum divalidasi pada pasien nyata, sehingga temuannya paling tepat dipakai untuk memutuskan perlu tidaknya evaluasi lanjutan.',
  },
  {
    q: 'Bagaimana Risk Score dihitung?',
    a: 'Skor komposit adalah rata-rata tertimbang penilaian tiap biomarker terhadap ambang klinis, dengan bobot terbesar pada tremor dan finger tapping. Terpisah dari itu, model K-NN mencocokkan profil pasien dengan pola kondisi terdekat. Rincian bobot, ambang kategori, dan peran AI generatif dijelaskan pada artikel Metodologi di halaman Edukasi.',
  },
  {
    q: 'Bagaimana jika kualitas data pasien rendah?',
    a: 'Setiap sesi mencatat proporsi frame yang berhasil mendeteksi bagian tubuh yang diminta. Sesi dengan proporsi rendah ditolak sistem dan pasien diminta mengulang. Bila hasil yang tersimpan tetap terlihat janggal, misalnya satu biomarker ekstrem sementara lainnya normal, mintalah pasien mengulang dengan perbaikan spesifik: ruangan lebih terang, jarak kamera dua sampai tiga meter agar seluruh tubuh terlihat, dan kamera tidak dipegang tangan.',
  },
  {
    q: 'Bagaimana privasi pasien dijaga?',
    a: 'Video tidak pernah dikirim maupun disimpan di server. Seluruh estimasi pose berjalan di perangkat pasien, dan yang dikirim hanya angka biomarker hasil pengukuran. Akses Anda terhadap data pasien berbasis tautan yang mereka setujui, bukan akses bebas ke seluruh pasien. Pasien juga dapat menghapus riwayat maupun akunnya kapan saja, sejalan dengan hak penghapusan data pada UU PDP.',
  },
  {
    q: 'Bagaimana melepaskan tautan pasien?',
    a: 'Buka detail pasien, lalu pilih lepaskan tautan. Setelah dilepas, data pasien tidak lagi muncul di daftar Anda dan Anda tidak dapat membuka riwayatnya kembali kecuali pasien menautkan ulang. Catatan klinis yang sudah Anda tulis tetap tersimpan pada sesi pasien tersebut.',
  },
  {
    q: 'Berapa lama verifikasi akun nakes?',
    a: 'Saat ini akun tenaga kesehatan aktif langsung setelah pendaftaran dengan mengisi profesi dan institusi. Verifikasi berbasis nomor STR belum diterapkan pada versi ini. Karena itu, jangan menautkan pasien di luar relasi perawatan yang sebenarnya, dan gunakan data pasien sebatas keperluan klinis.',
  },
];

export default function DoctorBantuanPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!isLoading && (!user || user.role !== 'DOCTOR')) {
    router.push('/login');
    return null;
  }

  return (
    <div className={styles.page}>
      <DoctorNav />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Bantuan</h1>
          <p>Panduan penggunaan portal dan pertanyaan yang sering diajukan tenaga kesehatan.</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Panduan Portal</h2>
          <div className={styles.steps}>
            {PORTAL_STEPS.map((s, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <div>
                  <div className={styles.stepTitle}>{s.title}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pertanyaan yang Sering Diajukan</h2>
          {FAQ.map((item, i) => (
            <div key={i} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {item.q}
                <span className={`${styles.faqIcon} ${openIndex === i ? styles.faqIconOpen : ''}`}>›</span>
              </button>
              {openIndex === i && <div className={styles.faqAnswer}>{item.a}</div>}
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Kontak Tim</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>Surel</div>
              <div className={styles.contactValue}>nakes@neuronmotion.id</div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>Dokumentasi metodologi</div>
              <div className={styles.contactValue}>
                <Link href="/doctor/edukasi" style={{ color: 'var(--brand-light)' }}>
                  Halaman Edukasi
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.disclaimer}>
            NeuronMotion adalah alat bantu skrining awal, bukan alat diagnosis. Model belum divalidasi
            pada pasien nyata, sehingga seluruh temuan perlu dikonfirmasi melalui pemeriksaan klinis
            langsung sebelum dijadikan dasar keputusan medis.
          </div>
        </div>
      </div>
    </div>
  );
}
