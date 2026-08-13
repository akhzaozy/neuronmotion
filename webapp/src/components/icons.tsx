export function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function EyeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 1 11s4 7 11 7a9.26 9.26 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * ============================================================
 * Set ikon antarmuka
 * ============================================================
 * Seluruhnya digambar dengan aturan yang sama: kanvas 24x24, garis mengikuti
 * warna teks induknya, tebal 1,7, dan ujung membulat. Keseragaman itu yang
 * membuat ikon terbaca sebagai satu keluarga.
 *
 * Sebelumnya peran ini dipegang emoji. Emoji digambar ulang oleh setiap sistem
 * operasi, jadi rupa, warna, dan bobot visualnya berbeda di tiap perangkat dan
 * tidak pernah menyatu dengan tipografi di sekitarnya.
 * ============================================================
 */

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ── Biomarker dan tes gerakan ─────────────────────────────────────────────── */

/** Telapak terbuka, dipakai untuk tes tremor. */
export const HandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
    <path d="M11 12V4.5a1.5 1.5 0 0 1 3 0V12" />
    <path d="M14 12V6.5a1.5 1.5 0 0 1 3 0V13" />
    <path d="M17 13v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a7 7 0 0 1-7-7v-3a1.5 1.5 0 0 1 3 0" />
  </Svg>
);

/** Ibu jari dan telunjuk saling mendekat, untuk tes finger tapping. */
export const TapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M12 11V7a5 5 0 0 1 5 5v4a6 6 0 0 1-6 6 7 7 0 0 1-5-2l-3-4a1.6 1.6 0 0 1 2.4-2.1L7 15" />
    <path d="M4 6.5 6 5M4.5 3 6 4.2M8 3v1.6" />
  </Svg>
);

/** Sosok berjalan, untuk analisis pola jalan. */
export const WalkIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="13" cy="4" r="1.8" />
    <path d="M11.5 21.5 13 15l-2.5-2.8V8.5L14 7l2.2 3.2 2.8 1" />
    <path d="M10.5 12.2 7 14l-1 4" />
    <path d="M13 15l3 2.5.8 4" />
  </Svg>
);

/** Lengan berayun, untuk pengukuran asimetri ayunan. */
export const ArmSwingIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4" r="1.8" />
    <path d="M12 6.2V15" />
    <path d="M12 8 7.5 11l-1 4" />
    <path d="M12 8l4.5 3 1 4" />
    <path d="M12 15l-2.5 6M12 15l2.5 6" />
  </Svg>
);

/** Sosok berdiri tegak di atas garis, untuk stabilitas postur. */
export const PostureIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4" r="1.8" />
    <path d="M12 6.2v8" />
    <path d="M8.5 9h7" />
    <path d="M12 14.2 9.5 20M12 14.2 14.5 20" />
    <path d="M4 22h16" />
  </Svg>
);

/** Tungkai menekuk, untuk rentang gerak lutut. */
export const KneeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3v6.5a3 3 0 0 0 1 2.2l4 3.6a3 3 0 0 1 1 2.2V21" />
    <circle cx="10.6" cy="11.6" r="2.6" />
    <path d="M18 7a10 10 0 0 1 1.2 5" />
  </Svg>
);

/* ── Konsep klinis dan edukasi ─────────────────────────────────────────────── */

/**
 * Otak, untuk materi tentang sistem saraf.
 *
 * Bentuknya sengaja disederhanakan menjadi satu siluet dengan tiga lekuk.
 * Versi dua belahan yang lebih rinci berubah menjadi lingkaran bergaris tengah
 * ketika dikecilkan ke 22 piksel, ukuran yang justru paling sering dipakai.
 */
export const BrainIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.2c-2.8-1.7-6.6-.2-6.9 3-1.6.7-2.2 2.8-1.1 4.2-1 1.6-.2 3.8 1.6 4.3.2 2.3 2.7 3.7 4.8 2.7V21" />
    <path d="M12 4.2c2.8-1.7 6.6-.2 6.9 3 1.6.7 2.2 2.8 1.1 4.2 1 1.6.2 3.8-1.6 4.3-.2 2.3-2.7 3.7-4.8 2.7" />
    <path d="M12 4.2V13" />
    <path d="M8.7 9.5c1 .6 2.2.7 3.3.3M15.3 12.5c-1-.6-2.2-.7-3.3-.3" />
  </Svg>
);

/** Denyut, untuk kondisi mendadak seperti stroke. */
export const PulseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12h4l2.5-7 4 14 3-7H22" />
  </Svg>
);

/** Kalender, untuk jadwal dan frekuensi pemeriksaan. */
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M8 14h2M14 14h2M8 18h2" />
  </Svg>
);

/** Gembok, untuk privasi dan perlindungan data. */
export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.5" r="1.3" />
  </Svg>
);

/** Papan catatan, untuk daftar dan rekam pemeriksaan. */
export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    <path d="M9 11h6M9 15h4" />
  </Svg>
);

/** Pena, untuk langkah pendaftaran dan pengisian. */
export const PenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4.5 19.5 9 8 20.5l-5 1 1-5Z" />
    <path d="M13.5 6 18 10.5" />
  </Svg>
);

/** Bola lampu, untuk kiat dan penjelasan singkat. */
export const BulbIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 17a5.5 5.5 0 1 1 6 0v2a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19Z" />
    <path d="M10 21h4" />
  </Svg>
);

/** Kamera, untuk persiapan perekaman. */
export const VideoIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
    <path d="M15.5 10.5 21.5 7v10l-6-3.5Z" />
  </Svg>
);

/** Sosok bergerak, untuk latihan dan rehabilitasi. */
export const ActivityIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4" r="1.8" />
    <path d="M12 6.2v5.3" />
    <path d="M12 7.5 6.5 6M12 7.5 17.5 6" />
    <path d="M12 11.5 8 21M12 11.5 16 21" />
  </Svg>
);

/** Diagram batang, untuk hasil dan statistik. */
export const ChartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <rect x="7.5" y="12" width="3" height="5" rx="1" />
    <rect x="12.5" y="8" width="3" height="9" rx="1" />
    <rect x="17.5" y="5" width="3" height="12" rx="1" />
  </Svg>
);

/** Penggaris, untuk metodologi dan pengukuran. */
export const RulerIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.5 2.5 21.5 8.5 8.5 21.5 2.5 15.5Z" />
    <path d="M13 5 15 7M10.5 7.5 12.5 9.5M8 10l2 2M5.5 12.5l2 2" />
  </Svg>
);

/** Mikroskop, untuk rujukan penelitian. */
export const MicroscopeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21h13" />
    <path d="M9 21a6 6 0 0 0 6-9" />
    <path d="M10 6 8 4l2.5-2.5L14 5l-2 2" />
    <path d="M12 7 8.5 10.5 6 8l3.5-3.5" />
    <path d="M9.5 12 8 13.5" />
  </Svg>
);

/** Sasaran, untuk indikator dan tujuan klinis. */
export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.8" />
    <circle cx="12" cy="12" r="1.4" />
  </Svg>
);

/** Segitiga peringatan. */
export const WarningIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 3.6 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4.5M12 17.2v.1" />
  </Svg>
);

/** Kilau, penanda bagian yang dihasilkan AI. */
export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
    <path d="M18.5 16.5 19.1 18.4 21 19l-1.9.6-.6 1.9-.6-1.9L16 19l1.9-.6Z" />
  </Svg>
);

/** Centang. */
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="4 12.5 9.5 18 20 6.5" />
  </Svg>
);

/** Centang dalam lingkaran, untuk langkah yang sudah selesai. */
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12.3 11 15.3 16 8.8" />
  </Svg>
);

/** Jam, untuk langkah yang sedang berjalan. */
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.3l3.2 2" />
  </Svg>
);

/** Panah tren naik, dipakai ketika skor memburuk. */
export const TrendUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="3 17 9.5 10.5 13.5 14.5 21 7" />
    <polyline points="15.5 7 21 7 21 12.5" />
  </Svg>
);

/** Panah tren turun, dipakai ketika skor membaik. */
export const TrendDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="3 7 9.5 13.5 13.5 9.5 21 17" />
    <polyline points="15.5 17 21 17 21 11.5" />
  </Svg>
);

/** Garis datar, untuk kondisi stabil. */
export const TrendFlatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h16" />
  </Svg>
);

/** Panah berputar, untuk memuat ulang data. */
export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11.5A8 8 0 1 0 18.4 17" />
    <polyline points="20 5.5 20 11.5 14 11.5" />
  </Svg>
);

/** Sosok orang, untuk peran pasien. */
export const PersonIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="7.5" r="3.7" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

/** Stetoskop, untuk peran tenaga kesehatan. */
export const StethoscopeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3v5a4.5 4.5 0 0 0 9 0V3" />
    <path d="M4.5 3h3M13.5 3h3" />
    <path d="M10.5 12.5v2a5.5 5.5 0 0 0 8 4.9" />
    <circle cx="19.5" cy="16.5" r="2.5" />
  </Svg>
);

/** Palang medis, untuk penafian layanan kesehatan. */
export const MedicalCrossIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5Z" />
  </Svg>
);
