import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme';
import { I18nProvider, LANG_INIT_SCRIPT } from '@/lib/i18n';
import './globals.css';

/**
 * Plus Jakarta Sans dipakai menggantikan Inter.
 *
 * Inter adalah pilihan bawaan hampir semua templat, sehingga antarmuka yang
 * memakainya cenderung terbaca seragam dan tanpa sikap. Plus Jakarta Sans
 * dirancang Tokotype untuk identitas kota Jakarta, hurufnya sedikit lebih
 * hangat dan terbuka, dan sebagai karya Indonesia pilihannya punya alasan,
 * bukan sekadar bawaan.
 *
 * Berkasnya disimpan di dalam repositori dan dimuat lewat next/font/local,
 * bukan diambil dari Google Fonts saat halaman dibuka. Dengan begitu tidak ada
 * permintaan ke domain luar yang menahan render, tidak ada pergeseran tata
 * letak saat font selesai dimuat, dan tampilan tetap sama meski jaringan ke
 * layanan itu terhalang. Keduanya berupa font variabel, jadi seluruh ketebalan
 * 400 sampai 800 berasal dari satu berkas 27 kB.
 */
const jakarta = localFont({
  src: './fonts/PlusJakartaSans-latin.woff2',
  weight: '400 800',
  style: 'normal',
  variable: '--font-sans',
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
THESIS: Pengukuran tubuh disajikan sebagai dokumen klinis yang jujur. Menolak
susunan bawaan kategori, yaitu kartu membulat, biru teal lembut, badge pil, dan
ilustrasi ramah aplikasi telehealth.

OWN-WORLD: Dokumentasi farmasi Swiss era Geigy. Ground kertas #f2f1ec, tinta
near-black #17181c, satu aksen vermilion #c8402a sebagai struktur bukan alarm.
Garis rambut dan grid asimetris menggantikan kartu dan bayangan. Nol ikon:
hierarki dari bobot huruf, status dari label teks penuh. Angka tabular adalah
materi utama.

STORY: Pengunjung memahami bahwa alat ini mengukur dan bukan mendiagnosis,
mempercayainya karena perhitungan terjadi di perangkatnya sendiri, lalu
menyelesaikan satu tes gerakan dan membaca artinya.

FIRST VIEWPORT: Kepala dokumen bergaris tebal, judul tes rata kiri, satu bidang
pengukuran menempati dua pertiga layar. Aksi utama sebagai baris bergaris di
bawah bidang, terbaca dari dua meter.

FORM: Lembar Klinis Basel, kandidat 7 dari daftar grounded, seed 69d13ede.

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
    <html lang="id" className={`${jakarta.variable} ${mono.variable}`} suppressHydrationWarning>
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
