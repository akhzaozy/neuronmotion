'use client';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DoctorNav from '@/components/DoctorNav';
import LoadingScreen from '@/components/LoadingScreen';
import { useI18n } from '@/lib/i18n';
import styles from './doctorEdukasi.module.css';

interface Article {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  readTime: string;
  body: React.ReactNode;
}

/* ── Seksi 1: Materi klinis untuk tenaga kesehatan ───────────────────────── */

const CLINICAL_ARTICLES: Article[] = [
  {
    id: 'metodologi',
    tag: 'Metodologi',
    title: 'Bagaimana Skor Risiko Dihitung',
    excerpt: 'Rincian bobot per biomarker, ambang kategori, dan peran K-NN dalam menyusun skor komposit.',
    readTime: '4 menit baca',
    body: (
      <>
        <p>Skor risiko NeuronMotion dihitung dari dua lapis yang terpisah dan sengaja tidak saling menimpa.</p>
        <h3>Lapis pertama: penilaian per biomarker</h3>
        <p>Setiap biomarker dinilai secara mandiri terhadap ambang klinis, menghasilkan skor 0 sampai 100 beserta kategori. Skor komposit adalah rata-rata tertimbang dari biomarker yang berhasil diukur, dengan bobot:</p>
        <ul>
          <li>Tremor 0,25 dan finger tapping 0,25, karena keduanya paling banyak dipakai pada penilaian motorik baku</li>
          <li>Gait 0,20</li>
          <li>Arm swing 0,12 dan stabilitas postural 0,12</li>
          <li>Range of motion 0,06, sebagai penunjang</li>
        </ul>
        <p>Kategori risiko: skor 65 ke atas Tinggi, 35 sampai 64 Sedang, di bawah 35 Rendah.</p>
        <h3>Lapis kedua: klasifikasi pola K-NN</h3>
        <p>Terpisah dari skor, model K-NN (k=11, normalisasi Z-score, bobot jarak invers) mencocokkan profil biomarker pasien dengan pola kondisi terdekat. Keluarannya berupa label pola dan tingkat keyakinan, bukan diagnosis.</p>
        <h3>Peran AI generatif</h3>
        <p>Analisis naratif disusun oleh model bahasa, namun model tersebut tidak diizinkan mengubah skor. Skor tetap berasal dari mesin rule-based dan K-NN yang deterministik, sehingga hasil yang sama selalu menghasilkan angka yang sama dan dapat diaudit.</p>
        <h3>Penyesuaian usia</h3>
        <p>Rentang normal cadence dan range of motion diturunkan mengikuti kelompok usia pasien, karena penurunan tersebut lazim terjadi pada lansia sehat. Tanpa penyesuaian ini, pasien lansia berisiko ditandai tidak normal hanya karena dibandingkan dengan ambang dewasa muda.</p>
      </>
    ),
  },
  {
    id: 'interpretasi',
    tag: 'Interpretasi',
    title: 'Membaca Hasil Biomarker di Portal',
    excerpt: 'Arti tiap angka yang tampil pada detail pasien dan batas kewajaran interpretasinya.',
    readTime: '4 menit baca',
    body: (
      <>
        <h3>Tremor</h3>
        <p>Ditampilkan sebagai frekuensi dominan (Hz) dan amplitudo (mm). Frekuensi 4 sampai 6 Hz saat istirahat merupakan pola yang dalam literatur dikaitkan dengan Parkinson, namun rentang ini beririsan dengan essential tremor sehingga frekuensi saja tidak memisahkan keduanya. Amplitudo lebih menentukan dalam membedakan tremor fisiologis dari patologis.</p>
        <h3>Finger tapping</h3>
        <p>Dua angka: kecepatan ketuk per detik dan dekremen amplitudo dalam persen. Dekremen justru sering lebih informatif daripada kecepatan absolut, karena pada tempo bebas kecepatan pasien Parkinson dan kontrol dapat serupa, sedangkan penurunan amplitudo sepanjang percobaan lebih khas.</p>
        <h3>Gait</h3>
        <p>Indeks simetri langkah dan cadence. Perlu diingat cadence pada Parkinson tidak selalu lebih rendah dari kontrol; meta-analisis menemukan cadence justru sedikit lebih tinggi, sedangkan yang memendek adalah panjang langkah. Karena itu simetri langkah lebih layak diperhatikan daripada cadence semata.</p>
        <h3>Arm swing</h3>
        <p>Persentase asimetri ayunan lengan kiri dan kanan. Literatur melaporkan asimetri sekitar 13,9 persen pada Parkinson tahap awal dibanding 5,1 persen pada kontrol, dengan sebaran yang beririsan.</p>
        <h3>Stabilitas postural</h3>
        <p>Sway area dan panjang jalur pusat massa. Nilai pada sistem ini berada dalam satuan ternormalisasi kamera dan tidak dapat disamakan langsung dengan hasil force plate.</p>
      </>
    ),
  },
  {
    id: 'keterbatasan',
    tag: 'Keterbatasan',
    title: 'Batas Kemampuan Sistem yang Perlu Diketahui',
    excerpt: 'Apa yang belum dapat dijamin sistem ini, dan mengapa penilaian klinis tetap menentukan.',
    readTime: '3 menit baca',
    body: (
      <>
        <h3>Belum divalidasi pada pasien nyata</h3>
        <p>Model dilatih dan diuji pada data sintetis yang dibangkitkan dari rentang literatur, bukan rekam medis pasien. Akurasi internal sekitar 97 persen hanya berlaku pada data tersebut dan tidak boleh dibaca sebagai akurasi klinis. Validasi terhadap pasien nyata bersama tenaga medis belum dilakukan.</p>
        <h3>Kualitas pengukuran bergantung kondisi perekaman</h3>
        <p>Pencahayaan kurang, kamera goyang, pakaian longgar, atau bagian tubuh yang tidak seluruhnya masuk bingkai dapat menurunkan mutu estimasi pose. Sistem menandai sesi dengan proporsi frame valid yang rendah, namun penanda ini tidak menangkap seluruh bentuk gangguan.</p>
        <h3>Beberapa parameter belum berbasis rujukan spesifik</h3>
        <p>Amplitudo tremor dalam milimeter, kecepatan tapping maksimal, sway area absolut, indeks simetri, dan nilai ROM ditetapkan dari pertimbangan umum dan belum dikalibrasi terhadap publikasi tertentu. Rinciannya tercantum pada berkas referensi dataset.</p>
        <h3>Tidak menggantikan pemeriksaan langsung</h3>
        <p>Sistem tidak menilai rigiditas, refleks, fungsi kognitif, maupun respons terhadap terapi. Temuan di sini paling tepat diposisikan sebagai data penunjang untuk memutuskan perlu tidaknya evaluasi lebih lanjut.</p>
      </>
    ),
  },
  {
    id: 'kualitas-data',
    tag: 'Praktik',
    title: 'Menilai Mutu Sesi Skrining Pasien',
    excerpt: 'Cara mengenali sesi dengan data lemah dan meminta pasien mengulang dengan benar.',
    readTime: '3 menit baca',
    body: (
      <>
        <h3>Tanda sesi bermutu rendah</h3>
        <ul>
          <li>Hanya sebagian biomarker terisi, sisanya kosong karena tes dilewati atau gagal</li>
          <li>Nilai ekstrem yang tidak sejalan dengan biomarker lain pada sesi yang sama</li>
          <li>Skor melonjak tajam dibanding sesi sebelumnya tanpa perubahan klinis yang menyertai</li>
          <li>Kuesioner gejala dan hasil pengukuran saling bertentangan</li>
        </ul>
        <h3>Meminta pasien mengulang</h3>
        <p>Sampaikan hal spesifik yang perlu diperbaiki, bukan sekadar meminta mengulang. Yang paling sering menjadi penyebab: ruangan kurang terang, jarak kamera terlalu dekat sehingga tubuh tidak utuh terlihat, dan tes berjalan dilakukan di ruang yang terlalu sempit.</p>
        <h3>Membandingkan antar sesi</h3>
        <p>Halaman riwayat pasien menyediakan perbandingan dua sesi berdampingan. Perhatikan arah perubahan tiap biomarker, bukan hanya skor komposit, karena skor yang stabil dapat menyembunyikan perbaikan pada satu domain yang tertutup perburukan pada domain lain.</p>
      </>
    ),
  },
];

/* ── Seksi 2: Materi yang dapat dibagikan kepada pasien ──────────────────── */

const PATIENT_ARTICLES: Article[] = [
  {
    id: 'p-tremor',
    tag: 'Untuk Pasien',
    title: 'Apa Itu Tremor dan Kapan Perlu Diperiksa',
    excerpt: 'Penjelasan bahasa awam tentang beda getaran biasa dan yang perlu dievaluasi.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Tremor adalah gerakan bergetar yang terjadi tanpa disengaja. Hampir semua orang pernah mengalaminya saat lelah, cemas, kedinginan, atau setelah minum kopi berlebihan. Tremor semacam ini normal dan biasanya hilang sendiri.</p>
        <h3>Kapan tremor perlu diperhatikan</h3>
        <ul>
          <li>Muncul saat tangan sedang diam dan rileks, bukan saat beraktivitas</li>
          <li>Terjadi terus-menerus selama berminggu-minggu</li>
          <li>Awalnya hanya di satu sisi tubuh</li>
          <li>Mulai mengganggu menulis atau memegang gelas</li>
        </ul>
        <p>Pemeriksaan kamera hanya memberi petunjuk awal. Pemastiannya tetap memerlukan pemeriksaan langsung oleh dokter.</p>
      </>
    ),
  },
  {
    id: 'p-skor',
    tag: 'Untuk Pasien',
    title: 'Memahami Arti Skor Skrining Anda',
    excerpt: 'Penjelasan kategori Rendah, Sedang, dan Tinggi tanpa istilah teknis.',
    readTime: '2 menit baca',
    body: (
      <>
        <p>Skor skrining berkisar 0 sampai 100. Semakin tinggi angkanya, semakin banyak tanda yang perlu diperiksa lebih lanjut. Angka ini bukan vonis penyakit.</p>
        <h3>Risiko Rendah, di bawah 35</h3>
        <p>Tidak ditemukan tanda menonjol. Cukup lakukan skrining berkala, misalnya setiap enam bulan.</p>
        <h3>Risiko Sedang, 35 sampai 64</h3>
        <p>Ada beberapa tanda yang sebaiknya dievaluasi. Jadwalkan pemeriksaan ke dokter dalam waktu dekat, tidak perlu panik.</p>
        <h3>Risiko Tinggi, 65 ke atas</h3>
        <p>Beberapa tanda muncul bersamaan. Sebaiknya berkonsultasi dengan dokter spesialis saraf. Perlu diingat, banyak kondisi lain juga dapat menimbulkan tanda serupa, termasuk efek samping obat tertentu.</p>
      </>
    ),
  },
  {
    id: 'p-persiapan',
    tag: 'Untuk Pasien',
    title: 'Persiapan Agar Hasil Tes Akurat',
    excerpt: 'Panduan praktis pencahayaan, jarak kamera, dan posisi tubuh saat tes.',
    readTime: '2 menit baca',
    body: (
      <>
        <h3>Pencahayaan</h3>
        <p>Gunakan ruangan yang cukup terang dan merata. Hindari cahaya kuat tepat di belakang badan, misalnya berdiri membelakangi jendela, karena tubuh akan tampak menjadi bayangan gelap bagi kamera.</p>
        <h3>Jarak dan posisi kamera</h3>
        <p>Untuk tes tangan, cukup posisi duduk biasa dengan tangan terlihat jelas. Untuk tes berjalan dan keseimbangan, mundur sekitar dua sampai tiga meter agar seluruh tubuh dari kepala sampai kaki masuk bingkai. Letakkan kamera setinggi pinggang dan pastikan tidak bergoyang.</p>
        <h3>Pakaian</h3>
        <p>Pakaian yang tidak terlalu longgar memudahkan sistem mengenali posisi sendi. Hindari rok panjang menutupi kaki saat tes berjalan.</p>
        <h3>Waktu pemeriksaan</h3>
        <p>Jika mengonsumsi obat yang memengaruhi gerakan, lakukan tes pada waktu yang konsisten setiap kali agar perbandingan antar sesi lebih bermakna.</p>
      </>
    ),
  },
];

export default function DoctorEdukasiPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [reading, setReading] = useState<Article | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <DoctorNav />
        <main className="sheet">
          <LoadingScreen
            title="Memuat Edukasi Klinis..."
            subtitle="Menyiapkan artikel metodologi dan materi edukasi pasien..."
          />
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'DOCTOR') {
    router.push('/login');
    return null;
  }

  /** Menyalin isi artikel sebagai teks agar mudah dibagikan ke pasien. */
  async function shareArticle(a: Article) {
    const plain = `${a.title}\n\n${a.excerpt}\n\nSelengkapnya di NeuronMotion.`;
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(a.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  /* Setiap artikel adalah satu baris arsip: label mono, judul, ringkasan, dan
     lama baca. Tidak ada kartu dan tidak ada ikon; pemisahnya garis rambut. */
  const renderRow = (a: Article, shareable = false) => (
    <div key={a.id} className={styles.entry}>
      <button type="button" className={styles.entryOpen} onClick={() => setReading(a)}>
        <span className={styles.entryHead}>
          <span className="label">{a.tag}</span>
          <span className={styles.entryTime}>{a.readTime}</span>
        </span>
        <span className={styles.entryTitle}>{a.title}</span>
        <span className={styles.entryExcerpt}>{a.excerpt}</span>
      </button>
      {shareable && (
        <button type="button" className="btn" onClick={() => shareArticle(a)}>
          {copied === a.id ? t('edu.copied') : t('edu.copyForPatient')}
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <DoctorNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span>Edukasi</span>
              <span>Portal Tenaga Kesehatan</span>
            </div>
            <h1>Edukasi</h1>
            <p className={styles.lead}>
              Referensi klinis, panduan interpretasi, dan evidensi untuk tenaga kesehatan.
            </p>
          </header>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Materi Klinis</h2>
              <p className={styles.sectionDesc}>
                Dasar perhitungan, cara membaca biomarker, dan batas kemampuan sistem.
              </p>
            </div>
            <div className={styles.entries}>
              {CLINICAL_ARTICLES.map(a => renderRow(a))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Materi untuk Pasien</h2>
              <p className={styles.sectionDesc}>
                Penjelasan berbahasa awam yang dapat Anda bagikan kepada pasien sebagai bahan edukasi.
              </p>
            </div>
            <div className={styles.entries}>
              {PATIENT_ARTICLES.map(a => renderRow(a, true))}
            </div>
          </section>
        </div>
      </main>

      {/* Radix menangani jebakan fokus, tombol Escape, dan atribut aria;
          tampilannya diambil dari primitif dialog di globals.css. */}
      <Dialog.Root open={reading !== null} onOpenChange={open => { if (!open) setReading(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialogScrim" />
          <Dialog.Content className="dialogSheet" aria-describedby={undefined}>
            {reading && (
              <>
                <Dialog.Title className={styles.readerTitle}>{reading.title}</Dialog.Title>
                <p className={styles.readerMeta}>{reading.tag} &bull; {reading.readTime}</p>
                <div className={styles.readerBody}>{reading.body}</div>
                <p className={`note ${styles.disclaimer}`}>
                  Materi ini bersifat edukatif dan tidak menggantikan penilaian klinis langsung.
                </p>
                <Dialog.Close asChild>
                  <button type="button" className="btn btn--primary btn--block">
                    Tutup
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
