import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuronMotion - Skrining Gangguan Saraf',
  description: 'Sistem skrining gangguan saraf berbasis kamera dan computer vision real-time. Deteksi dini Parkinson, tremor, dan gangguan gait.',
  keywords: 'parkinson, tremor, skrining saraf, deteksi dini, computer vision, mediapipe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Terapkan tema sebelum paint pertama agar tidak ada kedipan warna */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
