'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'id' | 'en';

/**
 * Kamus teks antarmuka.
 *
 * Label yang isinya tetap sengaja diterjemahkan di sini, bukan lewat DeepL,
 * karena kuota DeepL terbatas dan teks ini tidak pernah berubah. DeepL hanya
 * dipakai untuk isi yang dinamis, misalnya ringkasan AI dan catatan dokter.
 */
const DICT: Record<string, { id: string; en: string }> = {
  // Navigasi
  'nav.dashboard': { id: 'Dashboard', en: 'Dashboard' },
  'nav.riwayat': { id: 'Riwayat', en: 'History' },
  'nav.edukasi': { id: 'Edukasi', en: 'Education' },
  'nav.bantuan': { id: 'Bantuan', en: 'Help' },
  'nav.profil': { id: 'Profil', en: 'Profile' },
  'nav.portalNakes': { id: 'Portal Nakes', en: 'Clinician Portal' },

  // Umum
  'common.save': { id: 'Simpan', en: 'Save' },
  'common.cancel': { id: 'Batal', en: 'Cancel' },
  'common.close': { id: 'Tutup', en: 'Close' },
  'common.edit': { id: 'Ubah', en: 'Edit' },
  'common.back': { id: 'Kembali', en: 'Back' },
  'common.next': { id: 'Lanjut', en: 'Next' },
  'common.loading': { id: 'Memuat...', en: 'Loading...' },
  'common.logout': { id: 'Keluar', en: 'Log out' },
  'common.backHome': { id: 'Kembali ke Beranda', en: 'Back to Home' },
  'common.notFilled': { id: 'Belum diisi', en: 'Not provided' },
  'common.years': { id: 'tahun', en: 'years' },

  // Risiko
  'risk.high': { id: 'Tinggi', en: 'High' },
  'risk.medium': { id: 'Sedang', en: 'Medium' },
  'risk.low': { id: 'Rendah', en: 'Low' },
  'risk.score': { id: 'Skor Risiko', en: 'Risk Score' },

  // Autentikasi
  'auth.welcome': { id: 'Selamat Datang', en: 'Welcome' },
  'auth.loginAsPatient': { id: 'Masuk sebagai Pasien', en: 'Sign in as Patient' },
  'auth.loginAsDoctor': { id: 'Masuk sebagai Dokter/Nakes', en: 'Sign in as Clinician' },
  'auth.patient': { id: 'Pasien', en: 'Patient' },
  'auth.doctor': { id: 'Dokter / Nakes', en: 'Doctor / Clinician' },
  'auth.email': { id: 'Email', en: 'Email' },
  'auth.password': { id: 'Password', en: 'Password' },
  'auth.createAccount': { id: 'Buat Akun', en: 'Create Account' },
  'auth.noAccount': { id: 'Belum punya akun?', en: "Don't have an account?" },
  'auth.hasAccount': { id: 'Sudah punya akun?', en: 'Already have an account?' },
  'auth.registerHere': { id: 'Daftar di sini', en: 'Sign up here' },
  'auth.loginHere': { id: 'Masuk di sini', en: 'Sign in here' },
  'auth.fullName': { id: 'Nama Lengkap', en: 'Full Name' },
  'auth.gender': { id: 'Jenis Kelamin', en: 'Gender' },
  'auth.male': { id: 'Laki-laki', en: 'Male' },
  'auth.female': { id: 'Perempuan', en: 'Female' },
  'auth.preferNotSay': { id: 'Tidak ingin menyebutkan', en: 'Prefer not to say' },
  'auth.dateOfBirth': { id: 'Tanggal Lahir', en: 'Date of Birth' },
  'auth.registerNow': { id: 'Daftar Sekarang', en: 'Sign Up' },

  // Lokasi
  'loc.country': { id: 'Negara', en: 'Country' },
  'loc.region': { id: 'Kawasan', en: 'Region' },
  'loc.state': { id: 'Provinsi / Negara Bagian', en: 'State / Province' },
  'loc.city': { id: 'Kota', en: 'City' },
  'loc.selectCountry': { id: 'Pilih negara', en: 'Select country' },
  'loc.selectRegion': { id: 'Pilih kawasan', en: 'Select region' },
  'loc.selectState': { id: 'Pilih provinsi', en: 'Select state' },
  'loc.selectCountryFirst': { id: 'Pilih negara dulu', en: 'Select a country first' },
  'loc.autoFilled': { id: 'Terisi otomatis mengikuti negara yang dipilih.', en: 'Filled automatically based on the selected country.' },
  'loc.searchCity': { id: 'Ketik untuk mencari kota', en: 'Type to search for a city' },
  'loc.loadingCities': { id: 'Memuat daftar kota...', en: 'Loading cities...' },
  'loc.residence': { id: 'Wilayah Tempat Tinggal', en: 'Place of Residence' },
  'loc.practice': { id: 'Wilayah Praktik', en: 'Practice Location' },

  // Dashboard
  'dash.latestScore': { id: 'Skor Risiko Terkini', en: 'Latest Risk Score' },
  'dash.startScreening': { id: 'Mulai Tes Skrining', en: 'Start Screening Test' },
  'dash.startNow': { id: 'Mulai Skrining Sekarang', en: 'Start Screening Now' },
  'dash.recentHistory': { id: 'Riwayat Terkini', en: 'Recent History' },
  'dash.viewAll': { id: 'Lihat Semua Riwayat', en: 'View All History' },
  'dash.noData': { id: 'Belum ada data. Lakukan skrining pertama Anda.', en: 'No data yet. Take your first screening.' },
  'dash.trend': { id: 'Tren', en: 'Trend' },
  'dash.stable': { id: 'Stabil', en: 'Stable' },
  'dash.worsening': { id: 'Meningkat', en: 'Worsening' },
  'dash.improving': { id: 'Membaik', en: 'Improving' },

  // Riwayat
  'hist.title': { id: 'Riwayat Pemeriksaan', en: 'Examination History' },
  'hist.downloadPdf': { id: 'Unduh PDF', en: 'Download PDF' },
  'hist.exportCsv': { id: 'Ekspor CSV', en: 'Export CSV' },
  'hist.trendChart': { id: 'Tren Skor Risiko per Sesi', en: 'Risk Score Trend per Session' },
  'hist.compare': { id: 'Perbandingan Sesi', en: 'Session Comparison' },
  'hist.doctorNote': { id: 'Catatan Nakes', en: 'Clinician Note' },
  'hist.detail': { id: 'Detail', en: 'Details' },
  'hist.date': { id: 'Tanggal', en: 'Date' },
  'hist.category': { id: 'Kategori', en: 'Category' },

  // Skrining
  'scr.title': { id: 'Skrining Klinis NeuronMotion', en: 'NeuronMotion Clinical Screening' },
  'scr.step': { id: 'Langkah', en: 'Step' },
  'scr.of': { id: 'dari', en: 'of' },
  'scr.ready': { id: 'Saya Siap, Mulai', en: "I'm Ready, Start" },
  'scr.skip': { id: 'Lewati', en: 'Skip' },
  'scr.startRecording': { id: 'Mulai Rekam', en: 'Start Recording' },
  'scr.stopRecording': { id: 'Hentikan Rekaman', en: 'Stop Recording' },
  'scr.nextTest': { id: 'Lanjut ke Tes Berikutnya', en: 'Continue to Next Test' },
  'scr.submit': { id: 'Kirim Hasil Skrining', en: 'Submit Screening Results' },
  'scr.enableCamera': { id: 'Aktifkan Kamera', en: 'Enable Camera' },
  'scr.allowCamera': { id: 'Izinkan Akses Kamera', en: 'Allow Camera Access' },

  // Profil
  'prof.personalInfo': { id: 'Informasi Pribadi', en: 'Personal Information' },
  'prof.security': { id: 'Keamanan', en: 'Security' },
  'prof.changePassword': { id: 'Ganti Password', en: 'Change Password' },
  'prof.privacyData': { id: 'Privasi & Data', en: 'Privacy & Data' },
  'prof.deleteHistory': { id: 'Hapus Riwayat', en: 'Delete History' },
  'prof.deleteAccount': { id: 'Hapus Akun Saya', en: 'Delete My Account' },
  'prof.profession': { id: 'Profesi', en: 'Profession' },
  'prof.institution': { id: 'Institusi', en: 'Institution' },
  'prof.region': { id: 'Wilayah', en: 'Location' },

  // Bahasa
  'lang.switch': { id: 'Bahasa', en: 'Language' },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'id',
  setLang: () => {},
  t: (k, f) => f ?? k,
});

/** Skrip pra-render agar bahasa tersimpan langsung terpasang, tanpa kedipan. */
export const LANG_INIT_SCRIPT = `
(function(){try{var l=localStorage.getItem('lang')||'id';document.documentElement.setAttribute('lang',l);}catch(e){}})();
`;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'id' || saved === 'en') setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
    document.documentElement.setAttribute('lang', l);
  }, []);

  const t = useCallback((key: string, fallback?: string) => {
    const entry = DICT[key];
    if (!entry) return fallback ?? key;
    return entry[lang] || entry.id;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

/**
 * Menerjemahkan teks dinamis (ringkasan AI, catatan dokter) lewat DeepL di server.
 * Mengembalikan teks asli bila bahasa aktif Indonesia atau penerjemahan gagal,
 * sehingga antarmuka tidak pernah kosong.
 */
export function useDynamicTranslation(texts: string[]) {
  const { lang } = useI18n();
  const [translated, setTranslated] = useState<string[]>(texts);
  const [loading, setLoading] = useState(false);

  const joined = texts.join(' ');

  useEffect(() => {
    const list = joined ? joined.split(' ') : [];
    if (lang === 'id' || list.length === 0 || list.every(t => !t)) {
      setTranslated(list);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${base}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: list.filter(Boolean), target: 'EN' }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelled && d.translations) setTranslated(d.translations); })
      .catch(() => { if (!cancelled) setTranslated(list); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [joined, lang]);

  return { translated, loading };
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 99,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {(['id', 'en'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          style={{
            padding: '5px 11px',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            background: lang === l ? 'var(--gradient-brand)' : 'transparent',
            color: lang === l ? '#fff' : 'var(--text-secondary)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
