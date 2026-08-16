import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme';
import { I18nProvider, LANG_INIT_SCRIPT } from '@/lib/i18n';
import './globals.css';

/**
 * Dua huruf, dua pekerjaan.
 *
 * Hanken Grotesk membawa seluruh isi. Ia grotesk humanis dengan tinggi-x besar
 * dan bukaan lebar, yang artinya huruf seperti a, e, dan s tidak menutup saat
 * ukurannya kecil atau saat pembacanya melihat dari jarak jauh. Untuk produk
 * yang penggunanya lansia, itu bukan urusan selera.
 *
 * Gabarito hanya untuk judul. Terminalnya membulat dan perutnya lebar,
 * sehingga judul bisa tetap besar dan tegas tanpa terbaca mengepal. Ini
 * jawaban langsung atas keluhan bahwa dunia sebelumnya terasa kaku: di sana
 * judul diset serapat mungkin dengan tracking -0.03em dan bobot 800, dan
 * ketegangan itu memang disengaja oleh sistem dokumen. Dunia ini tidak
 * menginginkannya.
 *
 * JetBrains Mono tetap, dan tetap hanya untuk pengukuran, label arsip, dan
 * data. Ia tidak pernah dipakai sebagai kostum teknis untuk prosa.
 *
 * Ketiganya font variabel dan disimpan di dalam repositori, dimuat lewat
 * next/font/local, bukan diambil dari Google Fonts saat halaman dibuka. Tidak
 * ada permintaan ke domain luar yang menahan render, tidak ada pergeseran tata
 * letak saat font selesai dimuat, dan tampilan tetap sama meski jaringan ke
 * layanan itu terhalang.
 */
const hanken = localFont({
  src: './fonts/HankenGrotesk-latin.woff2',
  weight: '300 800',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
});

const gabarito = localFont({
  src: './fonts/Gabarito-latin.woff2',
  weight: '400 900',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
});

/** Dipakai untuk kode berbagi dan angka yang perlu lebar tetap. */
const mono = localFont({
  src: './fonts/JetBrainsMono-latin.woff2',
  weight: '400 500',
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
});

/**
 * Kontrak arah desain. Bertahan sampai markup produksi supaya keputusan
 * visualnya bisa diaudit dari halaman yang sudah jadi, bukan hanya dari repo.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: Skrining gerak sebagai ruang periksa yang terang dan tenang, bukan
sebagai arsip. Menolak dua susunan sekaligus: lembar dokumen bertinta gelap
dengan sudut tajam yang dipakai dunia sebelumnya, dan templat pemasaran rumah
sakit yang menjual angka bangga (jumlah pasien, jumlah dokter, jumlah kamar)
yang produk ini tidak punya dan tidak boleh mengarang.

OWN-WORLD: Ruang Periksa Terang. Ground biru sangat pucat #eef4f8, permukaan
kartu putih membulat 24px dengan bayangan lembut ber-offset, biru medis pekat
#1d6d86 untuk aksi dan teks, biru bubuk #8ebfd2 mengisi bidang utuh. Tinta
adalah biru tua #12313d, bukan hitam. Gabarito untuk judul, Hanken Grotesk
untuk isi, JetBrains Mono hanya untuk pengukuran. Tanda tangan visualnya jejak
tremor sungguhan yang digambar ulang di beberapa tempat.

STORY: Pengunjung memahami bahwa alat ini mengukur dan bukan mendiagnosis,
mempercayainya karena perhitungan terjadi di perangkatnya sendiri, lalu
menyelesaikan satu tes gerakan dan membaca artinya.

FIRST VIEWPORT: Judul rata kiri di kolom kiri dengan dua aksi berbentuk pil di
bawahnya; kolom kanan berisi panel putih melayang yang memutar jejak tremor
sungguhan beserta frekuensi dan amplitudonya. Di bawah keduanya, satu baris
kartu berisi tiga fakta mekanisme, bukan angka pemasaran.

FORM: Ruang Periksa Terang, arah yang dipin tim lewat gambar referensi;
tidak ada roll konsep karena brief yang dipin mengalahkan roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`;

export const metadata: Metadata = {
  title: 'NeuronMotion - Skrining Gangguan Saraf',
  description: 'Sistem skrining gangguan saraf berbasis kamera dan computer vision real-time. Deteksi dini Parkinson, tremor, dan gangguan gait.',
  keywords: 'parkinson, tremor, skrining saraf, deteksi dini, computer vision, mediapipe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${hanken.variable} ${gabarito.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Terapkan tema sebelum paint pertama agar tidak ada kedipan warna */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body>
        {/*
          Kontrak arah desain ditulis sebagai komentar HTML sungguhan, bukan
          komentar JSX. Komentar JSX dibuang compiler dan tidak pernah sampai
          ke markup produksi, sehingga kontrak yang seharusnya bisa diaudit
          justru hilang tepat di tempat ia perlu dibaca.
        */}
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <ThemeProvider>
          <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
