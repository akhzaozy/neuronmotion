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
