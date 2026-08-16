'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import PageTranslator from './pageTranslator';
import langStyles from './i18n.module.css';

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

  // NeuroBot
  'bot.welcome': {
    id: 'Halo! Saya **NeuroBot**, asisten kesehatan virtual NeuronMotion.\n\nSaya siap membantu Anda memahami hasil skrining, menjawab pertanyaan seputar kesehatan motorik, dan memberikan informasi umum tentang gangguan saraf.\n\nApa yang ingin Anda tanyakan hari ini?',
    en: 'Hello! I am **NeuroBot**, the NeuronMotion virtual health assistant.\n\nI can help you understand your screening results, answer questions about motor health, and share general information about neurological conditions.\n\nWhat would you like to ask today?',
  },
  'bot.errorPrefix': { id: 'Gagal:', en: 'Failed:' },
  'bot.error': { id: 'Terjadi kesalahan. Silakan coba lagi.', en: 'Something went wrong. Please try again.' },
  'bot.openChat': { id: 'Buka chat dengan NeuroBot', en: 'Open chat with NeuroBot' },
  'bot.closeChat': { id: 'Tutup chat', en: 'Close chat' },
  'bot.chatWith': { id: 'Chat dengan NeuroBot AI', en: 'Chat with NeuroBot AI' },
  'bot.status': { id: 'Asisten AI · Powered by Last Dance', en: 'AI Assistant · Powered by Last Dance' },
  'bot.clearHistory': { id: 'Hapus riwayat chat', en: 'Clear chat history' },
  'bot.q1': { id: 'Apa arti skor risiko saya?', en: 'What does my risk score mean?' },
  'bot.q2': { id: 'Apa itu tremor Parkinson?', en: 'What is a Parkinsonian tremor?' },
  'bot.q3': { id: 'Kapan saya harus ke dokter?', en: 'When should I see a doctor?' },
  /* Petunjuk tombol Enter dikeluarkan dari placeholder. Digabung begitu,
     teksnya membungkus jadi dua baris di dalam kotak setinggi satu baris
     sehingga separuhnya terpotong, dan petunjuk yang terpotong tidak
     menolong siapa pun. Ia kini punya barisnya sendiri di bawah isian. */
  'bot.placeholder': { id: 'Ketik pertanyaan Anda', en: 'Type your question' },
  'bot.enterHint': { id: 'Enter kirim, Shift+Enter baris baru', en: 'Enter to send, Shift+Enter for a new line' },
  'bot.messageLabel': { id: 'Pesan untuk NeuroBot', en: 'Message for NeuroBot' },
  'bot.send': { id: 'Kirim pesan', en: 'Send message' },
  'bot.sendShort': { id: 'Kirim', en: 'Send' },
  // Label penutur pada tiap giliran percakapan. Ia menggantikan avatar berikon
  // dan sisi kiri kanan gelembung sebagai penanda siapa yang berbicara.
  'bot.you': { id: 'Anda', en: 'You' },
  // Penanda pesan yang belum dibaca, menggantikan titik warna pada tombol.
  'bot.newMessage': { id: 'Pesan baru', en: 'New message' },
  'bot.disclaimer': {
    id: 'NeuroBot bukan dokter, selalu konsultasikan kondisi Anda ke tenaga medis',
    en: 'NeuroBot is not a doctor, always consult a healthcare professional about your condition',
  },

  // Sebaran wilayah
  'geo.country': { id: 'Negara', en: 'Country' },
  'geo.state': { id: 'Provinsi', en: 'State' },
  'geo.city': { id: 'Kota', en: 'City' },
  'geo.empty': {
    id: 'Belum ada pasien dengan data wilayah pada tingkat ini. Data terisi ketika pasien melengkapi wilayahnya saat mendaftar atau melalui halaman profil.',
    en: 'No patients have region data at this level yet. It fills in once patients complete their region at sign-up or on their profile page.',
  },
  'geo.patients': { id: 'pasien', en: 'patients' },
  'geo.high': { id: 'tinggi', en: 'high' },
  'geo.medium': { id: 'sedang', en: 'medium' },
  'geo.low': { id: 'rendah', en: 'low' },
  'geo.notScreened': { id: 'belum skrining', en: 'not screened' },
  'geo.highRiskTip': { id: 'Risiko tinggi', en: 'High risk' },
  'geo.mediumRiskTip': { id: 'Risiko sedang', en: 'Medium risk' },
  'geo.lowRiskTip': { id: 'Risiko rendah', en: 'Low risk' },

  // Laporan cetak
  'report.previewHint': {
    id: 'Pratinjau laporan. Simpan sebagai PDF melalui dialog cetak.',
    en: 'Report preview. Save as PDF from the print dialog.',
  },
  'report.print': { id: 'Cetak / Simpan PDF', en: 'Print / Save PDF' },

  'auth.namePlaceholder': { id: 'Contoh: Budi Santoso', en: 'e.g. Alex Johnson' },
  'auth.emailPlaceholder': { id: 'Contoh: budi@email.com', en: 'e.g. alex@email.com' },
  'auth.passwordPlaceholder': { id: 'Minimal 6 karakter', en: 'At least 6 characters' },
  'auth.passwordTooShort': { id: 'Password minimal 6 karakter', en: 'Password must be at least 6 characters' },
  'auth.registerFailed': { id: 'Gagal mendaftar. Email mungkin sudah terpakai.', en: 'Sign-up failed. The email may already be in use.' },
  'auth.dobHint': {
    id: 'Dipakai untuk membandingkan hasil skrining dengan rentang normal sesuai kelompok usia Anda.',
    en: 'Used to compare your screening results against the normal range for your age group.',
  },
  'auth.institutionPlaceholder': { id: 'Contoh: RS Siloam Jakarta', en: 'e.g. Siloam Hospital Jakarta' },
  'loc.hintDoctor': {
    id: 'Dipakai untuk memetakan sebaran wilayah pasien yang Anda tangani.',
    en: 'Used to map the regional spread of the patients you care for.',
  },
  'loc.hintPatient': {
    id: 'Menjadi bagian identitas Anda dan membantu memahami sebaran pengguna antar wilayah.',
    en: 'Part of your profile, and it helps us understand how users are spread across regions.',
  },

  // Instruksi tes skrining
  'ins.tremor.badge': { id: 'Tes Tremor', en: 'Tremor Test' },
  'ins.tremor.title': { id: 'Tahan Tangan Rileks', en: 'Hold Your Hand Relaxed' },
  'ins.tremor.s1': { id: 'Angkat tangan kanan sejajar dada, telapak menghadap bawah', en: 'Raise your right hand to chest height, palm facing down' },
  'ins.tremor.s2': { id: 'Rilekskan seluruh otot tangan, jangan sengaja menahan', en: 'Relax every muscle in your hand, do not tense up' },
  'ins.tremor.s3': { id: 'Diam selama 10 detik, tahan posisi ini', en: 'Stay still for 10 seconds, hold this position' },
  'ins.tremor.s4': { id: 'Jangan gerakkan tangan secara sengaja', en: 'Do not move your hand on purpose' },

  'ins.fingerTapping.badge': { id: 'Tes Finger Tapping', en: 'Finger Tapping Test' },
  'ins.fingerTapping.title': { id: 'Ketuk Ibu Jari ke Telunjuk', en: 'Tap Thumb to Index Finger' },
  'ins.fingerTapping.s1': { id: 'Angkat tangan ke depan kamera, telapak menghadap kamera', en: 'Raise your hand towards the camera, palm facing it' },
  'ins.fingerTapping.s2': { id: 'Ketuk ibu jari ke telunjuk se-cepat dan se-keras mungkin', en: 'Tap thumb to index finger as fast and as wide as you can' },
  'ins.fingerTapping.s3': { id: 'Lakukan berulang tanpa henti selama 10 detik', en: 'Keep tapping without stopping for 10 seconds' },
  'ins.fingerTapping.s4': { id: 'Usahakan ritme konsisten, jangan melambat di tengah', en: 'Keep a steady rhythm, do not slow down midway' },

  'ins.gait.badge': { id: 'Tes Gait', en: 'Gait Test' },
  'ins.gait.title': { id: 'Berjalan di Depan Kamera', en: 'Walk in Front of the Camera' },
  'ins.gait.s1': { id: 'Letakkan kamera/HP ±2 meter di depan Anda', en: 'Place the camera or phone about 2 metres in front of you' },
  'ins.gait.s2': { id: 'Pastikan seluruh tubuh terlihat di kamera saat berdiri', en: 'Make sure your whole body is visible while standing' },
  'ins.gait.s3': { id: 'Berjalan maju-mundur secara natural selama 10 detik', en: 'Walk back and forth naturally for 10 seconds' },
  'ins.gait.s4': { id: 'Jangan mempercepat atau mengubah gaya jalan', en: 'Do not speed up or change your walking style' },

  'ins.armSwing.badge': { id: 'Tes Arm Swing', en: 'Arm Swing Test' },
  'ins.armSwing.title': { id: 'Berjalan dan Biarkan Tangan Berayun', en: 'Walk and Let Your Arms Swing' },
  'ins.armSwing.s1': { id: 'Posisi kamera sama seperti tes gait (±2 meter)', en: 'Same camera position as the gait test (about 2 metres)' },
  'ins.armSwing.s2': { id: 'Berjalan dengan kecepatan normal, jangan paksa tangan', en: 'Walk at your normal pace, do not force your arms' },
  'ins.armSwing.s3': { id: 'Biarkan kedua tangan berayun natural mengikuti langkah', en: 'Let both arms swing naturally with your steps' },
  'ins.armSwing.s4': { id: 'Lakukan selama 10 detik tanpa menahan ayunan', en: 'Keep going for 10 seconds without holding the swing back' },

  'ins.posture.badge': { id: 'Tes Stabilitas Postur', en: 'Postural Stability Test' },
  'ins.posture.title': { id: 'Berdiri Tegak dan Diam', en: 'Stand Upright and Still' },
  'ins.posture.s1': { id: 'Berdiri tegak dengan kedua kaki selebar bahu', en: 'Stand upright with your feet shoulder-width apart' },
  'ins.posture.s2': { id: 'Pastikan seluruh tubuh terlihat di kamera', en: 'Make sure your whole body is visible to the camera' },
  'ins.posture.s3': { id: 'Tutup mata (opsional) untuk tes lebih akurat', en: 'Close your eyes (optional) for a more accurate test' },
  'ins.posture.s4': { id: 'Diam selama 10 detik, jangan sengaja menahan badan', en: 'Stay still for 10 seconds, do not brace your body' },

  'ins.rom.badge': { id: 'Tes Range of Motion', en: 'Range of Motion Test' },
  'ins.rom.title': { id: 'Tekuk dan Luruskan Lutut', en: 'Bend and Straighten Your Knee' },
  'ins.rom.s1': { id: 'Duduk di kursi tanpa sandaran tangan, kamera di samping', en: 'Sit on a chair without armrests, camera to your side' },
  'ins.rom.s2': { id: 'Angkat satu kaki dan luruskan sepenuhnya', en: 'Raise one leg and straighten it fully' },
  'ins.rom.s3': { id: 'Kembalikan ke posisi awal (lutut ±90°)', en: 'Return to the starting position (knee at about 90°)' },
  'ins.rom.s4': { id: 'Ulang gerakan secara penuh selama 10 detik', en: 'Repeat the full movement for 10 seconds' },

  'ins.startingIn': { id: 'Memulai dalam', en: 'Starting in' },
  'ins.seconds': { id: 'detik...', en: 'seconds...' },
  'ins.go': { id: 'Mulai!', en: 'Go!' },

  // Umum
  'common.save': { id: 'Simpan', en: 'Save' },
  'common.cancel': { id: 'Batal', en: 'Cancel' },
  'common.close': { id: 'Tutup', en: 'Close' },
  'common.edit': { id: 'Ubah', en: 'Edit' },
  'common.delete': { id: 'Hapus', en: 'Delete' },
  'common.back': { id: 'Kembali', en: 'Back' },
  'common.next': { id: 'Lanjut', en: 'Next' },
  'common.loading': { id: 'Memuat...', en: 'Loading...' },
  'common.logout': { id: 'Keluar', en: 'Log out' },
  'common.backHome': { id: 'Kembali ke Beranda', en: 'Back to Home' },
  'common.notFilled': { id: 'Belum diisi', en: 'Not provided' },
  'common.years': { id: 'tahun', en: 'years' },

  // Sesi berakhir. Teksnya menyebut sebabnya dan menyatakan bahwa data aman,
  // karena pengguna yang tiba-tiba dikeluarkan pada alat kesehatan akan
  // menduga datanya hilang sebelum menduga tokennya kedaluwarsa.
  'session.expiredTitle': { id: 'Sesi Anda telah berakhir', en: 'Your session has ended' },
  'session.expiredBody': {
    id: 'Demi keamanan, Anda otomatis keluar setelah 24 jam. Riwayat pemeriksaan Anda tetap tersimpan. Silakan masuk kembali untuk melanjutkan.',
    en: 'For your security, you are signed out automatically after 24 hours. Your examination history is safely stored. Please sign in again to continue.',
  },

  // Dashboard pasien.
  'dash.overviewTitle': { id: 'Ringkasan kesehatan gerak Anda', en: 'Your movement health overview' },
  'dash.scorePanel': { id: 'Skor risiko Anda', en: 'Your risk score' },
  'dash.statAverage': { id: 'Rata-rata', en: 'Average' },
  'dash.statLowest': { id: 'Terendah', en: 'Lowest' },
  'dash.statHighest': { id: 'Tertinggi', en: 'Highest' },
  'dash.statSessions': { id: 'Total sesi', en: 'Total sessions' },
  'dash.scoreUnit': { id: 'dari 100', en: 'of 100' },
  'dash.trendChart': { id: 'Perubahan antar sesi', en: 'Change between sessions' },
  'dash.sessionStrip': { id: 'Sesi pemeriksaan Anda', en: 'Your examination sessions' },
  'dash.latestMeasures': { id: 'Pengukuran terakhir', en: 'Latest measurements' },
  'dash.vsPrevious': { id: 'dibanding sesi sebelumnya', en: 'vs previous session' },
  'dash.noPrevious': { id: 'Sesi pertama Anda', en: 'Your first session' },
  'dash.notMeasured': { id: 'Tes ini belum dikerjakan', en: 'This test has not been done' },
  'dash.selectSession': { id: 'Lihat sesi ini', en: 'View this session' },
  'dash.lowerBetter': { id: 'Makin rendah makin baik', en: 'Lower is better' },

  // Kartu pengukuran di beranda. Diberi awalan tersendiri karena namespace
  // 'bio.' sudah dipakai pustaka edukasi untuk nama dan penjelasan tes.
  // Satuan selalu ikut angkanya dan tidak pernah dilepas.
  'card.tremorFreq': { id: 'Frekuensi tremor', en: 'Tremor frequency' },
  'card.tremorFreqUnit': { id: 'Hz', en: 'Hz' },
  'card.tapRate': { id: 'Laju ketukan jari', en: 'Finger tap rate' },
  'card.tapRateUnit': { id: '/detik', en: '/sec' },
  'card.cadence': { id: 'Irama langkah', en: 'Step cadence' },
  'card.cadenceUnit': { id: '/menit', en: '/min' },
  'card.symmetry': { id: 'Simetri langkah', en: 'Gait symmetry' },
  'card.symmetryUnit': { id: '%', en: '%' },
  'card.sway': { id: 'Goyang postur', en: 'Postural sway' },
  'card.swayUnit': { id: 'cm²', en: 'cm²' },
  'card.rom': { id: 'Rentang gerak', en: 'Range of motion' },
  'card.romUnit': { id: '°', en: '°' },

  // Panel akun demo di halaman masuk. Sengaja hanya dua tombol kategori:
  // panel ini perancah untuk mencoba, dan menjelaskan isi datanya panjang
  // lebar justru membuatnya menyaingi formulir masuk yang ia layani.
  // Kredensialnya toh langsung terlihat di formulir setelah ditekan.
  'demoAcc.title': { id: 'Masuk dengan akun demo', en: 'Sign in with a demo account' },
  'demoAcc.patient': { id: 'Pasien', en: 'Patient' },
  'demoAcc.doctor': { id: 'Dokter', en: 'Clinician' },
  'demoAcc.filled': { id: 'Terisi di bawah.', en: 'Filled in below.' },

  // Halaman depan bagi pengguna yang sudah masuk.
  'landing.continueScreening': { id: 'Mulai skrining', en: 'Start screening' },
  'landing.toDashboard': { id: 'Buka dashboard', en: 'Open dashboard' },
  'landing.toPortal': { id: 'Buka portal nakes', en: 'Open clinician portal' },
  'landing.welcomeBack': { id: 'Anda sudah masuk', en: 'You are signed in' },

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
  'dash.loading': { id: 'Memuat dashboard...', en: 'Loading dashboard...' },
  'dash.subtitle': { id: 'Pantau perkembangan kesehatan motorik Anda secara berkala.', en: 'Track your motor health over time.' },
  'dash.registeredPatient': { id: 'Pasien Terdaftar', en: 'Registered Patient' },
  'dash.riskPrefix': { id: 'Risiko', en: 'Risk' },
  'dash.quickSub': { id: 'Lakukan skrining berkala menggunakan kamera perangkat Anda.', en: 'Run a periodic screening using your device camera.' },
  'dash.motorScreening': { id: 'Skrining Motorik', en: 'Motor Screening' },
  'dash.noHistory': { id: 'Belum ada riwayat pemeriksaan.', en: 'No examination history yet.' },
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
  'hist.loading': { id: 'Memuat riwayat...', en: 'Loading history...' },
  'hist.startFirst': { id: 'Mulai Skrining Pertama', en: 'Start Your First Screening' },
  'hist.trendTitle': { id: 'Tren Skor Risiko per Sesi', en: 'Risk Score Trend per Session' },
  'hist.needTwo': { id: 'Minimal 2 sesi diperlukan untuk menampilkan grafik tren.', en: 'At least 2 sessions are needed to show the trend chart.' },
  'hist.compareTitle': { id: 'Perbandingan Sesi', en: 'Session Comparison' },
  'hist.compositeScore': { id: 'Skor Komposit', en: 'Composite Score' },
  'hist.allSessions': { id: 'Semua Sesi', en: 'All Sessions' },
  'hist.stable': { id: 'stabil', en: 'stable' },
  'hist.available': { id: 'Tersedia', en: 'Available' },
  'hist.none': { id: 'Tidak ada', en: 'None' },
  'hist.noDoctorNote': { id: 'Belum ada catatan dari nakes', en: 'No clinician note yet' },
  'hist.sessionDetail': { id: 'Detail Sesi', en: 'Session Detail' },
  'hist.closestPattern': { id: 'Pola terdekat', en: 'Closest pattern' },
  'hist.aiCombined': { id: 'Analisis Gabungan AI', en: 'Combined AI Analysis' },
  'hist.confidence': { id: 'Keyakinan', en: 'Confidence' },
  'hist.symptomLink': { id: 'Kaitan keluhan dengan hasil ukur', en: 'How symptoms relate to measurements' },
  'hist.followUp': { id: 'Saran tindak lanjut', en: 'Follow-up suggestions' },
  'hist.urgentNote': {
    id: 'Kombinasi tanda pada sesi ini sebaiknya diperiksa tenaga medis dalam waktu dekat.',
    en: 'The combination of signs in this session should be reviewed by a clinician soon.',
  },
  'hist.systemRec': { id: 'Rekomendasi Sistem', en: 'System Recommendations' },
  'bio.tremorShort': { id: 'Tremor', en: 'Tremor' },
  'bio.fingerTapping': { id: 'Finger Tapping', en: 'Finger Tapping' },
  'bio.gaitSymmetry': { id: 'Simetri Gait', en: 'Gait Symmetry' },
  'bio.armAsymmetry': { id: 'Asimetri Lengan', en: 'Arm Asymmetry' },
  'bio.swayArea': { id: 'Sway Area', en: 'Sway Area' },
  'bio.kneeRom': { id: 'ROM Lutut', en: 'Knee ROM' },
  'unit.tapsPerSec': { id: 'ketukan/dtk', en: 'taps/sec' },
  'unit.perSec': { id: '/dtk', en: '/sec' },
  'share.title': { id: 'Bagikan ke Tenaga Kesehatan', en: 'Share With a Clinician' },
  'share.desc': {
    id: 'Berikan kode ini kepada dokter atau perawat yang Anda percayai. Setelah kode dimasukkan, mereka dapat melihat hasil skrining Anda dan menuliskan catatan klinis.',
    en: 'Give this code to a doctor or nurse you trust. Once they enter it, they can see your screening results and add clinical notes.',
  },
  'share.copy': { id: 'Salin kode', en: 'Copy code' },
  'share.copied': { id: 'Kode disalin', en: 'Code copied' },
  'share.reset': { id: 'Ganti kode', en: 'Reset code' },
  'share.resetHint': {
    id: 'Mengganti kode akan membuat kode lama tidak berlaku. Tenaga kesehatan yang sudah tertaut tetap tertaut.',
    en: 'Resetting invalidates the old code. Clinicians already linked stay linked.',
  },
  'share.confirmReset': {
    id: 'Ganti kode berbagi? Kode lama tidak akan berlaku lagi.',
    en: 'Reset your share code? The old code will stop working.',
  },
  'share.loading': { id: 'Menyiapkan kode...', en: 'Preparing code...' },

  'link.title': { id: 'Tautkan Pasien', en: 'Link a Patient' },
  'link.desc': {
    id: 'Masukkan kode berbagi yang ditunjukkan pasien dari halaman Riwayat miliknya.',
    en: 'Enter the share code the patient shows you from their History page.',
  },
  'link.placeholder': { id: 'Contoh: A7K2M9QX', en: 'e.g. A7K2M9QX' },
  'link.submit': { id: 'Tautkan', en: 'Link' },
  'link.linking': { id: 'Menautkan...', en: 'Linking...' },
  'link.unlink': { id: 'Lepaskan tautan', en: 'Unlink' },
  'link.confirmUnlink': {
    id: 'Lepaskan tautan pasien ini? Datanya tidak akan muncul lagi di panel Anda.',
    en: 'Unlink this patient? Their data will no longer appear in your portal.',
  },
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
  'scr.enableCamera': { id: 'Aktifkan Kamera', en: 'Enable Camera' },
  'scr.allowCamera': { id: 'Izinkan Akses Kamera', en: 'Allow Camera Access' },

  // Profil
  'prof.loading': { id: 'Memuat profil...', en: 'Loading profile...' },
  'prof.loadFailed': { id: 'Gagal memuat profil.', en: 'Failed to load profile.' },
  'prof.saved': { id: 'Data pribadi berhasil diperbarui.', en: 'Your personal details have been updated.' },
  'prof.saveFailed': { id: 'Gagal menyimpan perubahan.', en: 'Failed to save changes.' },
  'prof.pwSaved': { id: 'Password berhasil diperbarui.', en: 'Password updated.' },
  'prof.pwFailed': { id: 'Gagal mengganti password.', en: 'Failed to change password.' },
  'prof.histDeleted': { id: 'Riwayat pemeriksaan berhasil dihapus', en: 'Examination history deleted' },
  'prof.sessions': { id: 'sesi', en: 'sessions' },
  'prof.histDeleteFailed': { id: 'Gagal menghapus riwayat.', en: 'Failed to delete history.' },
  'prof.accDeleteFailed': { id: 'Gagal menghapus akun.', en: 'Failed to delete account.' },
  'prof.doctorNakes': { id: 'Dokter / Nakes', en: 'Doctor / Clinician' },
  'prof.name': { id: 'Nama', en: 'Name' },
  'prof.fullName': { id: 'Nama Lengkap', en: 'Full Name' },
  'prof.dob': { id: 'Tanggal Lahir', en: 'Date of Birth' },
  'prof.gender': { id: 'Jenis Kelamin', en: 'Gender' },
  'prof.male': { id: 'Laki-laki', en: 'Male' },
  'prof.female': { id: 'Perempuan', en: 'Female' },
  'prof.preferNotSay': { id: 'Tidak ingin menyebutkan', en: 'Prefer not to say' },
  'prof.selectProfession': { id: 'Pilih profesi', en: 'Select a profession' },
  'prof.institutionLabel': { id: 'Institusi / Tempat Praktik', en: 'Institution / Practice' },
  'prof.saveChanges': { id: 'Simpan Perubahan', en: 'Save Changes' },
  'prof.currentPassword': { id: 'Password Saat Ini', en: 'Current Password' },
  'prof.newPassword': { id: 'Password Baru (minimal 6 karakter)', en: 'New Password (at least 6 characters)' },
  'prof.savePassword': { id: 'Simpan Password', en: 'Save Password' },
  'prof.securityNote': {
    id: 'Gunakan password yang kuat dan tidak dipakai di layanan lain.',
    en: 'Use a strong password that you do not reuse on other services.',
  },
  'prof.privacyNote': {
    id: 'Sesuai UU Perlindungan Data Pribadi, Anda berhak menghapus data Anda kapan saja. Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.',
    en: 'Under personal data protection law, you may delete your data at any time. The actions below are permanent and cannot be undone.',
  },
  'prof.deleteMyAccount': { id: 'Hapus Akun Saya', en: 'Delete My Account' },
  'prof.confirmHistTitle': { id: 'Hapus Semua Riwayat?', en: 'Delete All History?' },
  'prof.confirmAccTitle': { id: 'Hapus Akun Secara Permanen?', en: 'Permanently Delete Account?' },
  'prof.confirmHistText': {
    id: 'Seluruh sesi pemeriksaan Anda, termasuk skor risiko dan catatan dari nakes, akan dihapus permanen. Akun Anda tetap aktif dan Anda masih bisa melakukan skrining baru.',
    en: 'All of your examination sessions, including risk scores and clinician notes, will be permanently deleted. Your account stays active and you can still run new screenings.',
  },
  'prof.confirmAccText': {
    id: 'Akun Anda beserta seluruh riwayat pemeriksaan dan data profil akan dihapus permanen. Anda akan langsung keluar dari aplikasi dan data ini tidak dapat dipulihkan.',
    en: 'Your account, together with all examination history and profile data, will be permanently deleted. You will be signed out immediately and the data cannot be recovered.',
  },
  'prof.yesDeleteHist': { id: 'Ya, Hapus Riwayat', en: 'Yes, Delete History' },
  'prof.yesDeleteAcc': { id: 'Ya, Hapus Akun Saya', en: 'Yes, Delete My Account' },
  'prof.hidePassword': { id: 'Sembunyikan password', en: 'Hide password' },
  'prof.showPassword': { id: 'Tampilkan password', en: 'Show password' },
  'prof.personalInfo': { id: 'Informasi Pribadi', en: 'Personal Information' },
  'prof.security': { id: 'Keamanan', en: 'Security' },
  'prof.changePassword': { id: 'Ganti Password', en: 'Change Password' },
  'prof.privacyData': { id: 'Privasi & Data', en: 'Privacy & Data' },
  'prof.deleteHistory': { id: 'Hapus Riwayat', en: 'Delete History' },
  'prof.deleteAccount': { id: 'Hapus Akun Saya', en: 'Delete My Account' },
  'prof.profession': { id: 'Profesi', en: 'Profession' },
  'prof.institution': { id: 'Institusi', en: 'Institution' },
  'prof.region': { id: 'Wilayah', en: 'Location' },


  // Landing
  'land.badge': { id: 'Alat Skrining Klinis Berbasis Kamera', en: 'Camera-Based Clinical Screening Tool' },
  'land.title1': { id: 'Deteksi Dini', en: 'Early Detection of' },
  'land.title2': { id: 'Gangguan Saraf', en: 'Neurological Disorders' },
  'land.title3': { id: 'Dari Kamera Anda', en: 'From Your Camera' },
  'land.desc': {
    id: 'NeuronMotion menganalisis tremor, pola jalan, dan biomarker motorik melalui kamera perangkat Anda, membantu deteksi awal Parkinson dan gangguan neurologis lainnya tanpa perangkat tambahan.',
    en: 'NeuronMotion analyses tremor, gait, and motor biomarkers through your device camera, supporting early detection of Parkinson\u2019s and other neurological conditions without extra hardware.',
  },
  'land.startFree': { id: 'Mulai Skrining Gratis', en: 'Start Free Screening' },
  'land.hasAccount': { id: 'Sudah Punya Akun', en: 'I Have an Account' },
  'land.tryDemo': { id: 'Coba tanpa akun', en: 'Try without an account' },
  'land.tryDemoSub': { id: 'Tes tremor singkat, tanpa daftar', en: 'Quick tremor test, no sign-up' },
  'land.login': { id: 'Masuk', en: 'Sign In' },
  'land.registerFree': { id: 'Daftar Gratis', en: 'Sign Up Free' },
  'land.statProfiles': { id: 'Profil Sintetis Referensi', en: 'Synthetic Reference Profiles' },
  'land.statBiomarkers': { id: 'Parameter Biomarker', en: 'Biomarker Parameters' },
  'land.statAccuracy': { id: 'Akurasi Uji Internal', en: 'Internal Test Accuracy' },
  'land.statRealtime': { id: 'Via Kamera', en: 'Via Camera' },
  'land.accuracyNote': {
    id: 'Akurasi dihitung dari validasi holdout 80/20 pada dataset sintetis (bukan uji klinis pada pasien nyata).',
    en: 'Accuracy comes from an 80/20 holdout validation on synthetic data, not a clinical trial on real patients.',
  },
  'land.featuresTitle': { id: '6 Biomarker yang Dianalisis', en: '6 Biomarkers Analysed' },
  'land.featuresDesc': {
    id: 'Setiap parameter diukur menggunakan estimasi pose dari kamera, tanpa sensor fisik tambahan',
    en: 'Each parameter is measured using camera pose estimation, with no additional physical sensors',
  },
  'land.conditionsTitle': { id: 'Kondisi yang Dapat Dideteksi', en: 'Conditions That Can Be Detected' },
  'land.ctaTitle': { id: 'Mulai Skrining Sekarang', en: 'Start Screening Now' },
  'land.ctaDesc': {
    id: 'Gratis, privat, dan tidak memerlukan perangkat tambahan, hanya kamera.',
    en: 'Free, private, and needs no extra hardware, just a camera.',
  },
  'land.ctaButton': { id: 'Buat Akun dan Mulai Skrining', en: 'Create an Account and Start Screening' },
  'land.footerDisclaimer': {
    id: 'NeuronMotion adalah alat skrining awal. Bukan pengganti diagnosis tenaga medis.',
    en: 'NeuronMotion is an early screening tool. It does not replace a clinical diagnosis.',
  },

  // Biomarker
  'bio.tremor': { id: 'Deteksi Tremor', en: 'Tremor Detection' },
  'bio.tremorDesc': {
    id: 'Analisis frekuensi dan amplitudo tremor istirahat menggunakan estimasi pose tangan secara real-time.',
    en: 'Analyses rest tremor frequency and amplitude using real-time hand pose estimation.',
  },
  'bio.tapping': { id: 'Finger Tapping', en: 'Finger Tapping' },
  'bio.tappingDesc': {
    id: 'Ukur kecepatan ketukan dan konsistensi gerak, indikator utama bradikinesia pada evaluasi motorik.',
    en: 'Measures tap speed and movement consistency, a key indicator of bradykinesia in motor assessment.',
  },
  'bio.gait': { id: 'Analisis Gait', en: 'Gait Analysis' },
  'bio.gaitDesc': {
    id: 'Deteksi asimetri langkah dan kadense berjalan dari rekaman kamera tanpa sensor tambahan.',
    en: 'Detects step asymmetry and walking cadence from camera footage without extra sensors.',
  },
  'bio.armSwing': { id: 'Arm Swing', en: 'Arm Swing' },
  'bio.armSwingDesc': {
    id: 'Ukur asimetri ayunan lengan kiri vs kanan, penanda motorik awal yang terukur secara objektif.',
    en: 'Measures left versus right arm swing asymmetry, an early motor marker that can be quantified objectively.',
  },
  'bio.posture': { id: 'Stabilitas Postur', en: 'Postural Stability' },
  'bio.postureDesc': {
    id: 'Hitung sway area dan panjang jalur untuk menilai risiko jatuh dan keseimbangan postural.',
    en: 'Computes sway area and path length to assess fall risk and postural balance.',
  },
  'bio.rom': { id: 'Range of Motion', en: 'Range of Motion' },
  'bio.romDesc': {
    id: 'Evaluasi ROM sendi lutut, bahu, dan siku menggunakan estimasi pose tubuh secara non-invasif.',
    en: 'Evaluates knee, shoulder, and elbow joint range of motion non-invasively via body pose estimation.',
  },

  // Kondisi
  'cond.parkinson': { id: 'Parkinson', en: "Parkinson's" },
  'cond.essentialTremor': { id: 'Essential Tremor', en: 'Essential Tremor' },
  'cond.postStroke': { id: 'Pasca Stroke', en: 'Post-Stroke' },
  'cond.ataxia': { id: 'Ataksia Serebelar', en: 'Cerebellar Ataxia' },

  // Riwayat tambahan
  'hist.subtitle': {
    id: 'Pantau perubahan skor risiko dan biomarker Anda dari waktu ke waktu.',
    en: 'Track how your risk score and biomarkers change over time.',
  },
  'hist.noHistory': { id: 'Belum ada riwayat pemeriksaan.', en: 'No examination history yet.' },
  'hist.session': { id: 'Sesi', en: 'Session' },
  'hist.recommendation': { id: 'Rekomendasi', en: 'Recommendations' },
  'hist.aiAnalysis': { id: 'Analisis AI', en: 'AI Analysis' },
  'hist.biomarker': { id: 'Biomarker', en: 'Biomarkers' },
  'hist.worsening': { id: 'memburuk', en: 'worsened' },
  'hist.improving': { id: 'membaik', en: 'improved' },

  // Edukasi & Bantuan
  'edu.title': { id: 'Edukasi', en: 'Education' },
  'edu.subtitlePatient': {
    id: 'Bacaan singkat untuk memahami kondisi dan hasil skrining Anda.',
    en: 'Short reads to help you understand your condition and screening results.',
  },
  'edu.subtitleDoctor': {
    id: 'Referensi klinis, panduan interpretasi, dan evidensi untuk tenaga kesehatan.',
    en: 'Clinical references, interpretation guidance, and evidence for healthcare professionals.',
  },
  'edu.clinicalSection': { id: 'Materi Klinis', en: 'Clinical Material' },
  'edu.patientSection': { id: 'Materi untuk Pasien', en: 'Patient Material' },
  'edu.copyForPatient': { id: 'Salin untuk pasien', en: 'Copy for patient' },
  'edu.copied': { id: 'Tersalin', en: 'Copied' },
  'edu.readTime': { id: 'menit baca', en: 'min read' },
  'help.title': { id: 'Bantuan', en: 'Help' },
  'help.faq': { id: 'Pertanyaan yang Sering Diajukan', en: 'Frequently Asked Questions' },
  'help.contact': { id: 'Kontak Tim', en: 'Contact the Team' },
  'help.portalGuide': { id: 'Panduan Portal', en: 'Portal Guide' },

  // Dokter
  'doc.loadingPatients': { id: 'Memuat daftar pasien...', en: 'Loading patient list...' },
  'doc.loadingPortal': { id: 'Memuat Portal Nakes...', en: 'Loading Clinician Portal...' },
  'doc.loadDetailFailed': { id: 'Gagal memuat detail pasien', en: 'Failed to load patient detail' },
  'doc.noteSaved': { id: 'Catatan berhasil disimpan', en: 'Note saved' },
  'doc.saveFailed': { id: 'Gagal menyimpan', en: 'Failed to save' },
  'doc.specialist': { id: 'Dokter Spesialis', en: 'Specialist' },
  'doc.updatedAt': { id: 'Diperbarui', en: 'Updated' },
  'doc.autoEvery30': { id: 'otomatis setiap 30 detik', en: 'automatically every 30 seconds' },
  'doc.refreshNow': { id: 'Perbarui data sekarang', en: 'Refresh data now' },
  'doc.refreshing': { id: 'Memperbarui...', en: 'Refreshing...' },
  'doc.age': { id: 'Usia', en: 'Age' },
  'doc.yearsShort': { id: 'th', en: 'yrs' },
  'doc.scoreShort': { id: 'Skor', en: 'Score' },
  'doc.unknown': { id: 'Tidak diketahui', en: 'Unknown' },
  'doc.noPatients': { id: 'Belum ada pasien tertaut.', en: 'No linked patients yet.' },
  'doc.noMatch': { id: 'Tidak ada pasien dengan nama', en: 'No patient found with the name' },
  'doc.screeningSession': { id: 'Sesi Skrining', en: 'Screening Session' },
  'doc.clinicalClassification': { id: 'Hasil Klasifikasi Klinis', en: 'Clinical Classification Result' },
  'doc.confidence': { id: 'Keyakinan', en: 'Confidence' },
  'doc.notePlaceholder': {
    id: 'Tulis hasil evaluasi dan rekomendasi medis untuk pasien...',
    en: 'Write your evaluation and medical recommendations for this patient...',
  },
  'doc.saving': { id: 'Menyimpan...', en: 'Saving...' },
  'doc.noSessions': { id: 'Pasien ini belum melakukan skrining sama sekali.', en: 'This patient has not completed any screening yet.' },
  'doc.selectPatientHint': {
    id: 'Klik nama pasien di menu sebelah kiri untuk melihat detail klinis lengkap dan analisis biomarker.',
    en: 'Select a patient on the left to see their full clinical detail and biomarker analysis.',
  },
  'doc.noSessionsYet': { id: 'Belum ada sesi skrining', en: 'No screening sessions yet' },
  'doc.portalTitle': { id: 'Portal Tenaga Kesehatan', en: 'Clinician Portal' },
  'doc.welcome': { id: 'Selamat datang', en: 'Welcome' },
  'doc.totalPatients': { id: 'Total Pasien Aktif', en: 'Active Patients' },
  'doc.highRisk': { id: 'Pasien Risiko Tinggi (Rujukan)', en: 'High-Risk Patients (Referral)' },
  'doc.mediumRisk': { id: 'Pasien Risiko Sedang (Pantau)', en: 'Medium-Risk Patients (Monitor)' },
  'doc.earlyParkinson': { id: 'Deteksi Parkinson Awal', en: 'Early Parkinson Detections' },
  'doc.patientList': { id: 'Daftar Pasien', en: 'Patient List' },
  'doc.searchPatient': { id: 'Cari nama pasien...', en: 'Search patient name...' },
  'doc.selectPatient': { id: 'Pilih Pasien', en: 'Select a Patient' },
  'doc.refresh': { id: 'Perbarui', en: 'Refresh' },
  'doc.geoTitle': { id: 'Sebaran Wilayah Pasien', en: 'Patient Geographic Distribution' },
  'doc.geoSubtitle': {
    id: 'Distribusi pasien tertaut beserta kategori risiko pada sesi terakhir mereka.',
    en: 'Distribution of linked patients with the risk category from their latest session.',
  },
  'doc.patients': { id: 'pasien', en: 'patients' },
  'doc.clinicalNote': { id: 'Catatan Klinis Dokter', en: 'Clinical Notes' },
  'doc.saveNote': { id: 'Simpan Catatan & Rekomendasi', en: 'Save Notes & Recommendations' },

  // ── Tes gerakan ────────────────────────────────────────────────────────────
  // Satu-satunya teks instruksi yang berlaku. Token {d} diganti durasi nyata
  // dari mesin perekam, jadi teks dan mesin tidak akan pernah berbeda.
  'test.tremor.name': { id: 'Tremor', en: 'Tremor' },
  'test.tremor.desc': {
    id: 'Mengukur frekuensi dan amplitudo getaran tangan saat diam.',
    en: 'Measures the frequency and amplitude of hand tremor at rest.',
  },
  'test.tremor.cue': { id: 'Tahan tangan setinggi dada, rileks', en: 'Hold your hand at chest height, relaxed' },
  'test.tremor.step1': { id: 'Duduk atau berdiri menghadap kamera', en: 'Sit or stand facing the camera' },
  'test.tremor.step2': { id: 'Angkat tangan kanan setinggi dada', en: 'Raise your right hand to chest height' },
  'test.tremor.step3': { id: 'Telapak menghadap ke bawah, jari rileks', en: 'Palm facing down, fingers relaxed' },
  'test.tremor.step4': { id: 'Tahan tanpa menegangkan otot selama {d} detik', en: 'Hold without tensing for {d} seconds' },

  'test.fingerTapping.name': { id: 'Ketukan Jari', en: 'Finger Tapping' },
  'test.fingerTapping.desc': {
    id: 'Mengukur kecepatan ketukan dan penurunan amplitudo akibat kelelahan gerak.',
    en: 'Measures tapping speed and the amplitude decrement caused by motor fatigue.',
  },
  'test.fingerTapping.cue': { id: 'Ketuk ibu jari dan telunjuk, selebar mungkin', en: 'Tap thumb and index finger, as wide as you can' },
  'test.fingerTapping.step1': { id: 'Angkat satu tangan menghadap kamera', en: 'Raise one hand toward the camera' },
  'test.fingerTapping.step2': { id: 'Buka ibu jari dan telunjuk selebar mungkin', en: 'Open thumb and index finger as wide as you can' },
  // Terjemahan lama menulis "se-keras mungkin", yang membuat pengguna mengetuk
  // sekuat tenaga alih-alih selebar mungkin, dan itu merusak pembacaan amplitudo.
  'test.fingerTapping.step3': { id: 'Ketuk keduanya secepat dan selebar mungkin', en: 'Tap them as fast and as wide as you can' },
  'test.fingerTapping.step4': { id: 'Lanjutkan tanpa berhenti selama {d} detik', en: 'Keep going without stopping for {d} seconds' },

  'test.gait.name': { id: 'Pola Jalan', en: 'Gait' },
  'test.gait.desc': {
    id: 'Mengukur kadense, panjang langkah, dan simetri berjalan.',
    en: 'Measures cadence, stride length, and walking symmetry.',
  },
  'test.gait.cue': { id: 'Berjalan lurus mendekati kamera', en: 'Walk straight toward the camera' },
  'test.gait.step1': { id: 'Mundur 2 sampai 3 meter dari perangkat', en: 'Step back 2 to 3 metres from the device' },
  'test.gait.step2': { id: 'Pastikan seluruh tubuh sampai kaki terlihat', en: 'Make sure your whole body down to your feet is visible' },
  'test.gait.step3': { id: 'Berjalan lurus mendekati kamera dengan langkah biasa', en: 'Walk straight toward the camera at your normal pace' },
  'test.gait.step4': { id: 'Terus berjalan sampai aba-aba selesai, sekitar {d} detik', en: 'Keep walking until the end cue, about {d} seconds' },

  'test.armSwing.name': { id: 'Ayunan Lengan', en: 'Arm Swing' },
  'test.armSwing.desc': {
    id: 'Mengukur selisih amplitudo ayunan lengan kiri dan kanan saat berjalan.',
    en: 'Measures the amplitude difference between left and right arm swing while walking.',
  },
  'test.armSwing.cue': { id: 'Berjalan di tempat, biarkan lengan berayun', en: 'Walk in place, let your arms swing' },
  'test.armSwing.step1': { id: 'Mundur sampai tubuh bagian atas terlihat penuh', en: 'Step back until your upper body is fully visible' },
  'test.armSwing.step2': { id: 'Berjalan di tempat dengan langkah santai', en: 'Walk in place at a relaxed pace' },
  'test.armSwing.step3': { id: 'Biarkan kedua lengan berayun alami selama {d} detik', en: 'Let both arms swing naturally for {d} seconds' },

  'test.posture.name': { id: 'Keseimbangan', en: 'Postural Stability' },
  'test.posture.desc': {
    id: 'Mengukur goyangan titik berat tubuh saat berdiri diam.',
    en: 'Measures centre-of-mass sway while standing still.',
  },
  'test.posture.cue': { id: 'Berdiri diam, kaki selebar bahu', en: 'Stand still, feet shoulder-width apart' },
  'test.posture.step1': { id: 'Mundur sampai seluruh tubuh terlihat', en: 'Step back until your whole body is visible' },
  // Dua teks lama bertentangan, satu menyuruh kaki rapat dan satu menyuruh
  // selebar bahu, padahal keduanya menghasilkan pengukuran sway yang berbeda.
  'test.posture.step2': { id: 'Berdiri tegak, kaki selebar bahu, tangan di samping', en: 'Stand upright, feet shoulder-width apart, arms at your sides' },
  'test.posture.step3': { id: 'Tahan posisi tanpa bergerak selama {d} detik', en: 'Hold the position without moving for {d} seconds' },

  'test.rom.name': { id: 'Rentang Gerak Lutut', en: 'Knee Range of Motion' },
  'test.rom.desc': {
    id: 'Mengukur sudut maksimum tekukan dan luruskan lutut.',
    en: 'Measures the maximum knee flexion and extension angle.',
  },
  'test.rom.cue': { id: 'Tekuk dan luruskan lutut secara penuh', en: 'Bend and straighten your knee fully' },
  // Instruksi lama bertentangan antara berdiri menyamping dan duduk di kursi.
  // Versi ini memilih duduk, karena berdiri satu kaki adalah risiko jatuh bagi
  // pengguna lansia yang justru diskrining karena gangguan keseimbangan.
  'test.rom.step1': { id: 'Duduk menyamping di kursi, seluruh kaki terlihat kamera', en: 'Sit sideways on a chair with your whole leg visible to the camera' },
  'test.rom.step2': { id: 'Luruskan satu kaki ke depan sejauh yang nyaman', en: 'Straighten one leg forward as far as is comfortable' },
  'test.rom.step3': { id: 'Tekuk kembali sampai telapak menyentuh lantai', en: 'Bend it back until your foot touches the floor' },
  'test.rom.step4': { id: 'Ulangi gerakan penuh selama {d} detik', en: 'Repeat the full movement for {d} seconds' },

  'test.safety.chair': {
    id: 'Kalau Anda merasa goyah, lakukan sambil berpegangan pada kursi atau minta seseorang mendampingi.',
    en: 'If you feel unsteady, hold on to a chair or ask someone to stay with you.',
  },

  // ── Kamera ─────────────────────────────────────────────────────────────────
  'cam.enable': { id: 'Nyalakan kamera', en: 'Turn on the camera' },
  'cam.enableBody': {
    id: 'Perekaman gerakan berjalan di perangkat Anda sendiri. Video tidak dikirim ke mana pun dan tidak disimpan, yang dikirim hanya angka hasil pengukuran.',
    en: 'Movement capture runs on your own device. The video is never uploaded and never stored; only the resulting measurements are sent.',
  },
  'cam.allow': { id: 'Izinkan akses kamera', en: 'Allow camera access' },
  'cam.loading': { id: 'Menyiapkan sistem pengukuran', en: 'Preparing the measurement system' },
  'cam.loadingBody': {
    id: 'Mengunduh model estimasi pose. Sekali unduh memakan 10 sampai 30 detik tergantung koneksi.',
    en: 'Downloading the pose estimation model. The one-time download takes 10 to 30 seconds depending on your connection.',
  },
  'cam.retry': { id: 'Coba lagi', en: 'Try again' },

  'cam.fault.denied.title': { id: 'Izin kamera ditolak', en: 'Camera permission denied' },
  'cam.fault.denied.body': {
    id: 'Browser memblokir kamera untuk halaman ini, jadi menekan coba lagi tidak akan memunculkan permintaan izin. Buka ikon gembok atau pengaturan situs di bilah alamat, ubah Kamera menjadi Izinkan, lalu muat ulang halaman ini.',
    en: 'Your browser has blocked the camera for this page, so trying again will not bring the permission prompt back. Open the lock icon or site settings in the address bar, set Camera to Allow, then reload this page.',
  },
  'cam.fault.notFound.title': { id: 'Kamera tidak ditemukan', en: 'No camera found' },
  'cam.fault.notFound.body': {
    id: 'Perangkat ini tidak punya kamera yang bisa dipakai. Coba buka NeuronMotion dari ponsel, atau sambungkan kamera lalu muat ulang halaman.',
    en: 'This device has no usable camera. Try opening NeuronMotion on a phone, or connect a camera and reload the page.',
  },
  'cam.fault.inUse.title': { id: 'Kamera sedang dipakai aplikasi lain', en: 'The camera is in use by another app' },
  'cam.fault.inUse.body': {
    id: 'Tutup aplikasi lain yang sedang memakai kamera, misalnya panggilan video, lalu tekan coba lagi.',
    en: 'Close the other app using the camera, such as a video call, then try again.',
  },
  'cam.fault.insecure.title': { id: 'Halaman tidak dilayani secara aman', en: 'This page is not served securely' },
  'cam.fault.insecure.body': {
    id: 'Browser hanya mengizinkan kamera pada alamat HTTPS. Buka NeuronMotion lewat alamat resminya.',
    en: 'Browsers only allow camera access over HTTPS. Please open NeuronMotion at its official address.',
  },
  'cam.fault.modelTimeout.title': { id: 'Sistem pengukuran gagal dimuat', en: 'The measurement system failed to load' },
  'cam.fault.modelTimeout.body': {
    id: 'Pengunduhan model melebihi 30 detik, biasanya karena koneksi lambat. Sambungkan ke jaringan yang lebih stabil lalu coba lagi.',
    en: 'The model download passed 30 seconds, usually because the connection is slow. Move to a more stable network and try again.',
  },
  'cam.fault.modelFailed.title': { id: 'Sistem pengukuran gagal dimuat', en: 'The measurement system failed to load' },
  'cam.fault.modelFailed.body': {
    id: 'Model tidak bisa diambil. Periksa koneksi Anda lalu coba lagi.',
    en: 'The model could not be fetched. Check your connection and try again.',
  },
  'cam.fault.unknown.title': { id: 'Kamera tidak bisa diakses', en: 'The camera could not be opened' },
  'cam.fault.unknown.body': {
    id: 'Terjadi kesalahan yang tidak dikenali saat membuka kamera. Muat ulang halaman lalu coba lagi.',
    en: 'An unrecognised error occurred while opening the camera. Reload the page and try again.',
  },

  // ── Perekaman ──────────────────────────────────────────────────────────────
  'scr.recording': { id: 'Merekam', en: 'Recording' },
  'scr.secondsLeft': { id: 'detik lagi', en: 'seconds left' },
  'scr.getReady': { id: 'Bersiap', en: 'Get ready' },
  'scr.startNow': { id: 'Mulai sekarang', en: 'Start now' },
  'scr.addTime': { id: 'Tambah 10 detik', en: 'Add 10 seconds' },
  'scr.pause': { id: 'Jeda', en: 'Pause' },
  'scr.resume': { id: 'Lanjutkan', en: 'Resume' },
  'scr.skipTest': { id: 'Lewati tes ini', en: 'Skip this test' },
  'scr.stop': { id: 'Hentikan perekaman', en: 'Stop recording' },
  'scr.retake': { id: 'Ulangi tes ini', en: 'Redo this test' },
  'scr.beginTest': { id: 'Mulai tes', en: 'Start test' },
  'scr.backToTests': { id: 'Batal, kembali ke daftar tes', en: 'Cancel, back to the test list' },
  'scr.next': { id: 'Lanjut ke tes berikutnya', en: 'Next test' },
  'scr.submit': { id: 'Kirim hasil skrining', en: 'Submit screening' },
  'scr.done': { id: 'Selesai', en: 'Done' },
  'scr.pending': { id: 'Belum dikerjakan', en: 'Not yet done' },
  'scr.skipped': { id: 'Dilewati', en: 'Skipped' },

  // Kirim sebagian. Jumlah tes disebut di tombolnya sendiri supaya pengguna
  // tahu persis apa yang sedang ia kirim sebelum menekannya.
  'scr.submitPartial': { id: 'Kirim {n} tes yang sudah selesai', en: 'Submit {n} completed tests' },
  'scr.submitAll': { id: 'Kirim hasil skrining', en: 'Submit screening' },
  'scr.partialHint': {
    id: 'Anda boleh mengirim tanpa menyelesaikan keenam tes. Semakin banyak tes yang terisi, semakin lengkap gambaran yang bisa dibaca.',
    en: 'You may submit without finishing all six tests. The more tests you complete, the fuller the picture your results can show.',
  },
  'scr.current': { id: 'Sedang dikerjakan', en: 'In progress' },
  'scr.sequence': { id: 'Urutan tes', en: 'Test sequence' },
  'scr.stepOf': { id: 'Tes {a} dari {b}', en: 'Test {a} of {b}' },
  'scr.analysing': { id: 'Menghitung hasil', en: 'Calculating results' },
  'scr.analysingBody': {
    id: 'Menggabungkan pengukuran gerakan dengan keluhan yang Anda laporkan.',
    en: 'Combining your movement measurements with the symptoms you reported.',
  },

  'scr.reject.tooFew.title': { id: 'Rekaman belum bisa dipakai', en: 'That take cannot be used yet' },
  'scr.reject.tooFew.body': {
    id: 'Gerakan Anda hanya terekam sebagian, jadi hasilnya tidak cukup untuk dihitung. Biasanya ini terjadi kalau tubuh keluar dari frame atau ruangan terlalu gelap.',
    en: 'Only part of your movement was captured, so there is not enough data to compute a result. This usually happens when the body leaves the frame or the room is too dark.',
  },
  'scr.reject.bodyPart.title': { id: 'Bagian tubuh yang diukur tidak terlihat', en: 'The measured body part was not visible' },

  // ── Hasil ──────────────────────────────────────────────────────────────────
  'res.title': { id: 'Hasil skrining', en: 'Screening result' },
  'res.scoreOf': { id: 'dari 100', en: 'of 100' },
  'res.scaleNote': {
    id: 'Makin tinggi angkanya, makin perlu diperiksa tenaga medis. Ini bukan nilai ujian dan bukan vonis.',
    en: 'The higher the number, the more worth checking with a clinician. This is not a grade and not a verdict.',
  },
  'res.notDiagnosis': {
    id: 'Ini bukan diagnosis medis. NeuronMotion mengukur gerakan, dan hanya tenaga medis yang bisa menegakkan diagnosis.',
    en: 'This is not a medical diagnosis. NeuronMotion measures movement; only a clinician can make a diagnosis.',
  },
  'res.experimental': {
    id: 'Model eksperimental, belum tervalidasi klinis',
    en: 'Experimental model, not yet clinically validated',
  },
  'res.experimentalBody': {
    id: 'Dugaan pola di bawah ini berasal dari model yang masih dalam pengembangan dan belum diuji bersama tenaga medis. Jangan dijadikan dasar pengobatan.',
    en: 'The pattern suggested below comes from a model still in development that has not been validated with clinicians. Do not use it as a basis for treatment.',
  },
  'res.symptomScore': { id: 'Skor gejala, dari kuesioner', en: 'Symptom score, from the questionnaire' },
  'res.measuredScore': { id: 'Skor pengukuran, dari kamera', en: 'Measured score, from the camera' },
  'res.compositeScore': { id: 'Skor gabungan', en: 'Composite score' },
  'res.lowTitle': { id: 'Tidak ada tanda yang menonjol', en: 'No notable signs' },
  'res.lowBody': {
    id: 'Pengukuran hari ini tidak menunjukkan tanda yang menonjol. Simpan hasil ini sebagai titik awal, lalu ulangi skrining beberapa bulan lagi supaya perubahannya terlihat.',
    en: 'Today’s measurements show no notable signs. Keep this as your baseline and screen again in a few months so any change becomes visible.',
  },
  'res.correlation': { id: 'Kaitan keluhan dengan hasil ukur', en: 'How your symptoms relate to the measurements' },
  'res.consistent': { id: 'Sejalan', en: 'Consistent' },
  'res.inconsistent': { id: 'Belum sejalan', en: 'Not yet consistent' },
  'res.followUp': { id: 'Saran tindak lanjut', en: 'Suggested next steps' },
  'res.urgent': {
    id: 'Kombinasi tanda yang Anda laporkan sebaiknya diperiksa tenaga medis dalam waktu dekat.',
    en: 'The combination of signs you reported is worth having checked by a clinician soon.',
  },
  'res.aiNote': {
    id: 'Ringkasan ini disusun AI untuk membantu Anda membaca hasil. Skor dihitung mesin analisis terpisah dan tidak diubah oleh AI.',
    en: 'This summary was written by AI to help you read the result. The score is computed by a separate analysis engine and is not altered by the AI.',
  },
  'res.saveForDoctor': { id: 'Simpan untuk dokter', en: 'Save for your doctor' },
  'res.viewHistory': { id: 'Lihat riwayat', en: 'View history' },
  'res.backToDashboard': { id: 'Kembali ke beranda', en: 'Back to dashboard' },
  'res.needHelp': { id: 'Butuh penjelasan lebih lanjut', en: 'Need more explanation' },

  // ── Pembuka ────────────────────────────────────────────────────────────────
  'intro.title': { id: 'Sebelum mulai', en: 'Before you start' },
  'intro.lead': {
    id: 'Anda akan melakukan tes ini sendiri di depan kamera, tanpa didampingi tenaga medis. Berikut yang perlu disiapkan.',
    en: 'You will run this test yourself in front of the camera, with no clinician present. Here is what to prepare.',
  },
  'intro.room': { id: 'Ruangan', en: 'Room' },
  'intro.roomBody': {
    id: 'Cahaya cukup dan ruang gerak sekitar tiga meter untuk tes berjalan.',
    en: 'Enough light, and about three metres of space for the walking tests.',
  },
  'intro.device': { id: 'Perangkat', en: 'Device' },
  'intro.deviceBody': {
    id: 'Sandarkan ponsel pada benda yang stabil setinggi pinggang, lalu pastikan Anda masih terlihat saat mundur.',
    en: 'Prop your phone against something stable at waist height, then check you are still visible when you step back.',
  },
  'intro.time': { id: 'Waktu', en: 'Time' },
  'intro.timeBody': {
    id: 'Perekaman totalnya sekitar {s} detik. Sisanya adalah persiapan dan berpindah posisi, jadi sediakan sekitar sepuluh menit tanpa terburu-buru.',
    en: 'Recording totals about {s} seconds. The rest is setup and repositioning, so allow around ten minutes without rushing.',
  },
  'intro.privacy': { id: 'Privasi', en: 'Privacy' },
  'intro.privacyBody': {
    id: 'Video diproses di perangkat Anda dan tidak pernah diunggah. Yang dikirim hanya angka hasil pengukuran.',
    en: 'Video is processed on your device and never uploaded. Only the resulting measurements are sent.',
  },
  'intro.begin': { id: 'Saya siap, mulai', en: 'I am ready, begin' },

  // ── Masuk dan daftar ───────────────────────────────────────────────────────
  'auth.roleLabel': { id: 'Masuk sebagai', en: 'Sign in as' },
  'auth.showPassword': { id: 'Tampilkan', en: 'Show' },
  'auth.hidePassword': { id: 'Sembunyikan', en: 'Hide' },

  // ── Beranda pasien ─────────────────────────────────────────────────────────
  'dash.traceLabel': { id: 'Skor gabungan antar sesi', en: 'Composite score across sessions' },
  'dash.emptyBody': {
    id: 'Skrining pertama Anda akan jadi titik acuan. Perubahan baru terlihat setelah ada sesi kedua, jadi mulailah sekarang supaya ada pembandingnya nanti.',
    en: 'Your first screening becomes the baseline. Change only becomes visible once there is a second session, so start now to have something to compare against later.',
  },
  'hist.finding': { id: 'Temuan', en: 'Finding' },

  // ── Halaman publik ─────────────────────────────────────────────────────────
  'land.specimen': { id: 'Yang diukur', en: 'What is measured' },
  'land.colTest': { id: 'Tes', en: 'Test' },
  'land.colMeasures': { id: 'Mengukur', en: 'Measures' },
  'land.colDuration': { id: 'Durasi', en: 'Duration' },
  'land.mechanismTitle': {
    id: 'Perhitungannya terjadi di perangkat Anda',
    en: 'The computation happens on your device',
  },
  'land.mechanismBody': {
    id: 'Deteksi titik tubuh dan penghitungan biomarker berjalan di dalam browser Anda. Video tidak pernah diunggah, tidak pernah disimpan, dan tidak pernah melewati server kami. Yang dikirim hanya angka hasil pengukuran.',
    en: 'Body keypoint detection and biomarker extraction run inside your browser. The video is never uploaded, never stored, and never passes through our servers. Only the resulting numbers are sent.',
  },
  'land.mechanismBody2': {
    id: 'Karena itu NeuronMotion tidak butuh server GPU dan tetap berjalan di ponsel biasa. Itulah yang membuatnya bisa dipakai di daerah yang tidak punya akses ke dokter saraf.',
    en: 'That is why NeuronMotion needs no GPU server and still runs on an ordinary phone. It is what makes the tool usable in places with no access to a neurologist.',
  },
  // Plat instruksional di hero. Keterangannya menyebut ini posisi tangan,
  // bukan hasil pengukuran, sebab gambarnya memang ilustrasi cara memakai dan
  // bukan rekaman siapa pun.
  'land.plateFigure': { id: 'Gbr. 1', en: 'Fig. 1' },
  'land.plateCaption': {
    id: 'Posisi tangan saat tes tremor istirahat. Kamera membaca 21 titik pada satu tangan.',
    en: 'Hand position during the rest tremor test. The camera reads 21 landmarks on one hand.',
  },
  // Dua keterangan untuk panel jejak, dipilih oleh medan `kind` pada datanya.
  // Yang satu menyebut rekaman sungguhan, yang lain menyebut contoh pola.
  // Memisahkannya begini membuat label tidak mungkin tertinggal saat datanya
  // berganti.
  'land.plateCaptionRecording': {
    id: 'Atas, posisi tangan saat tes tremor istirahat. Bawah, simpangan pergelangan yang terekam pada satu sesi sungguhan.',
    en: 'Top, hand position during the rest tremor test. Bottom, the wrist displacement recorded in one actual session.',
  },
  'land.plateCaptionIllustration': {
    id: 'Atas, posisi tangan saat tes tremor istirahat. Bawah, contoh pola tremor istirahat, bukan pengukuran seseorang.',
    en: 'Top, hand position during the rest tremor test. Bottom, an illustrative rest tremor pattern, not anyone’s measurement.',
  },
  'land.plateAlt': {
    id: 'Sebuah tangan menghadap kamera dengan jari terbuka, dicetak sebagai raster titik dua warna.',
    en: 'A hand facing the camera with fingers apart, printed as a two-colour halftone screen.',
  },
  // Plat rekaman tremor. Keterangannya menegaskan ini rekaman sungguhan,
  // sebab itulah yang membedakannya dari grafik hiasan.
  'land.traceFigure': { id: 'Gbr. 2', en: 'Fig. 2' },
  'land.traceTitle': {
    id: 'Simpangan pergelangan tangan terhadap waktu',
    en: 'Wrist displacement over time',
  },
  'land.traceCaption': {
    id: 'Rekaman sungguhan dari satu sesi tes tremor istirahat, bukan gambar contoh. Nilai terukur:',
    en: 'An actual recording from one rest tremor session, not a sample illustration. Measured values:',
  },
  'land.traceAlt': {
    id: 'Grafik garis memperlihatkan getaran halus pergelangan tangan naik turun di sekitar garis nol.',
    en: 'A line chart showing fine wrist tremor oscillating above and below the zero line.',
  },
  'land.provenance': { id: 'Asal-usul model', en: 'Model provenance' },
  'land.testProfiles': { id: 'Profil uji terpisah', en: 'Held-out test profiles' },
  'land.referenceLead': { id: 'Rentang klinis mengacu pada', en: 'Clinical ranges reference' },

  // ── Halaman depan, Ruang Periksa Terang ────────────────────────────────────
  // Tautan bagian pada kop. Ketiganya menuju bagian yang benar-benar ada.
  'land.navMeasured': { id: 'Yang diukur', en: 'What we measure' },
  'land.navHow': { id: 'Cara kerja', en: 'How it works' },
  'land.navEvidence': { id: 'Bukti', en: 'Evidence' },

  // Panel bukti di hero.
  'land.panelTitle': { id: 'Tes tremor istirahat', en: 'Rest tremor test' },
  'land.tagRecording': { id: 'Rekaman', en: 'Recording' },
  'land.tagIllustration': { id: 'Contoh pola', en: 'Sample pattern' },
  'land.readDuration': { id: 'Durasi rekam', en: 'Capture length' },
  'land.readFrequency': { id: 'Frekuensi dominan', en: 'Dominant frequency' },
  'land.readAmplitude': { id: 'Amplitudo', en: 'Amplitude' },

  // Tiga jaminan yang menempati posisi angka pemasaran pada templat rujukan.
  // Ketiganya pernyataan tentang cara kerja, bukan tentang popularitas: produk
  // ini belum punya pengguna, mitra, atau validasi klinis untuk diakui.
  'land.assurePrivacyTitle': { id: 'Video tidak keluar dari perangkat', en: 'Video never leaves your device' },
  'land.assurePrivacyText': {
    id: 'Deteksi titik tubuh berjalan di dalam browser. Yang terkirim hanya angka hasil pengukuran.',
    en: 'Keypoint detection runs inside the browser. Only the resulting numbers are sent.',
  },
  'land.assureGearTitle': { id: 'Tanpa alat tambahan', en: 'No extra hardware' },
  'land.assureGearText': {
    id: 'Cukup kamera dan browser. Tidak ada sensor, tidak ada jam tangan pintar, tidak ada pemasangan aplikasi.',
    en: 'A camera and a browser is enough. No sensors, no smartwatch, no app install.',
  },
  'land.assureTimeTitle': { id: 'Enam tes, 75 detik rekam', en: 'Six tests, 75 seconds of capture' },
  'land.assureTimeText': {
    id: 'Setiap tes dipandu satu kalimat di layar, dan hasilnya bisa dibandingkan antar sesi.',
    en: 'Each test is guided by one on-screen line, and results can be compared across sessions.',
  },

  // Tiga langkah pada pita biru.
  'land.step1Title': { id: 'Rekam', en: 'Capture' },
  'land.step1Text': {
    id: 'Ikuti satu instruksi gerakan di layar. Kamera membaca titik tubuh dan tangan Anda selama beberapa detik.',
    en: 'Follow one movement instruction on screen. The camera reads your body and hand landmarks for a few seconds.',
  },
  'land.step2Title': { id: 'Ukur', en: 'Measure' },
  'land.step2Text': {
    id: 'Dari titik-titik itu dihitung frekuensi, amplitudo, simetri, dan kecepatan gerak. Semuanya di perangkat Anda.',
    en: 'From those landmarks it derives frequency, amplitude, symmetry, and movement speed. All on your device.',
  },
  'land.step3Title': { id: 'Baca artinya', en: 'Read what it means' },
  'land.step3Text': {
    id: 'Setiap angka tampil bersama rentang normalnya dan asal rentang itu, jadi Anda tahu apa yang sedang dibandingkan.',
    en: 'Every number appears with its normal range and where that range comes from, so you know what is being compared.',
  },

  // Keterangan pendek untuk panel jejak di hero. Versi panjangnya
  // (land.plateCaption*) menerangkan dua panel sekaligus, dan sejak panel itu
  // hanya berisi jejak, kalimatnya menyebut gambar yang tidak ada lagi.
  'land.traceCaptionShort': {
    id: 'Simpangan pergelangan tangan dari satu sesi tes sungguhan.',
    en: 'Wrist displacement from one actual test session.',
  },
  'land.traceCaptionShortIllustration': {
    id: 'Contoh pola tremor istirahat, bukan pengukuran seseorang.',
    en: 'An illustrative rest tremor pattern, not anyone’s measurement.',
  },

  // Teks alternatif foto. Ditulis menerangkan isi fotonya, bukan perannya di
  // halaman, karena pembaca layar butuh yang pertama.
  'land.heroPhotoAlt': {
    id: 'Seorang dokter berjas putih dengan stetoskop tersenyum sambil memegang tablet.',
    en: 'A doctor in a white coat with a stethoscope smiling while holding a tablet.',
  },
  'land.consultAlt': {
    id: 'Seorang perempuan lanjut usia berbincang dengan dokter di meja periksa yang terang.',
    en: 'An older woman talking with a doctor at a brightly lit consultation desk.',
  },
  'land.photoCredit': {
    id: 'Foto: StockSnap.io, lisensi CC0',
    en: 'Photos: StockSnap.io, CC0 licence',
  },

  // Bagian bukti.
  'land.evidenceTitle': { id: 'Dari mana angkanya datang', en: 'Where the numbers come from' },
  'land.evidenceLead': {
    id: 'Halaman ini tidak menampilkan satu pun angka yang tidak bisa ditelusuri asalnya.',
    en: 'This page shows no number whose origin cannot be traced.',
  },

  // ── Kuesioner ──────────────────────────────────────────────────────────────
  'quest.cat.MOTORIK': { id: 'Gejala gerakan', en: 'Movement symptoms' },
  'quest.cat.NON_MOTORIK': { id: 'Gejala non-gerakan', en: 'Non-movement symptoms' },
  'quest.cat.RIWAYAT': { id: 'Riwayat kesehatan', en: 'Medical history' },
  'quest.cat.TAMBAHAN': { id: 'Keterangan tambahan', en: 'Additional notes' },
  'quest.kicker': { id: 'Kuesioner gejala', en: 'Symptom questionnaire' },
  'quest.count': { id: '{n} pertanyaan', en: '{n} questions' },
  'quest.loading': { id: 'Memuat kuesioner', en: 'Loading the questionnaire' },
  'quest.unavailable': { id: 'Kuesioner tidak dapat dimuat', en: 'The questionnaire could not be loaded' },
  'quest.unavailableBody': {
    id: 'Anda tetap dapat melanjutkan ke tes gerakan. Hasil skrining akan dihitung dari pengukuran kamera saja.',
    en: 'You can still continue to the movement tests. The screening will be computed from the camera measurements alone.',
  },
  'quest.continueToTests': { id: 'Lanjut ke tes gerakan', en: 'Continue to the movement tests' },
  'quest.introTitle': {
    id: 'Sebelum tes gerakan, ceritakan kondisi Anda',
    en: 'Before the movement tests, tell us how you feel',
  },
  'quest.introLead': {
    id: 'Kamera dapat mengukur bagaimana tubuh Anda bergerak, tetapi tidak dapat mengetahui apa yang Anda rasakan sehari-hari. Beberapa tanda awal justru berupa keluhan yang hanya Anda sendiri yang tahu, misalnya berkurangnya kemampuan membau atau perubahan tulisan tangan.',
    en: 'A camera can measure how your body moves, but it cannot know what you feel day to day. Some of the earliest signs are things only you would notice, such as a reduced sense of smell or a change in your handwriting.',
  },
  'quest.point1': { id: 'Ada {n} pertanyaan singkat, sekitar dua menit.', en: 'There are {n} short questions, about two minutes.' },
  'quest.point2': { id: 'Jawab sejujurnya. Tidak ada jawaban benar atau salah.', en: 'Answer honestly. There are no right or wrong answers.' },
  'quest.point3': {
    id: 'Jawaban Anda digabungkan dengan hasil pengukuran kamera untuk memberi gambaran yang lebih utuh.',
    en: 'Your answers are combined with the camera measurements to give a fuller picture.',
  },
  'quest.point4': {
    id: 'Anda boleh melewati kuesioner ini, tetapi hasil skriningnya akan kurang lengkap.',
    en: 'You may skip this questionnaire, but the screening result will be less complete.',
  },
  'quest.begin': { id: 'Mulai kuesioner', en: 'Start the questionnaire' },
  'quest.skip': { id: 'Lewati kuesioner', en: 'Skip the questionnaire' },
  'quest.progress': { id: 'Pertanyaan {a} dari {b}', en: 'Question {a} of {b}' },
  'quest.optional': { id: 'Boleh dikosongkan', en: 'May be left blank' },
  'quest.placeholder': {
    id: 'Contoh: getaran muncul terutama saat pagi hari dan berkurang setelah beraktivitas',
    en: 'For example: the tremor appears mostly in the morning and eases after moving around',
  },
  'quest.back': { id: 'Pertanyaan sebelumnya', en: 'Previous question' },
  'quest.backToIntro': { id: 'Kembali ke penjelasan', en: 'Back to the introduction' },
  'quest.next': { id: 'Lanjut', en: 'Next' },
  'quest.finish': { id: 'Selesai, lanjut ke tes gerakan', en: 'Done, continue to the movement tests' },
  'quest.needAnswer': { id: 'Pilih salah satu jawaban untuk melanjutkan.', en: 'Choose an answer to continue.' },

  // ── Peragaan ───────────────────────────────────────────────────────────────
  'demo.kicker': { id: 'Peragaan terbuka', en: 'Open demonstration' },
  'demo.title': { id: 'Coba satu pengukuran, tanpa akun', en: 'Try one measurement, no account' },
  'demo.lead': {
    id: 'Satu dari enam tes NeuronMotion, berjalan penuh di perangkat Anda. Video tidak diunggah dan hasilnya tidak disimpan.',
    en: 'One of the six NeuronMotion tests, running entirely on your device. No video is uploaded and no result is stored.',
  },
  'demo.measured': { id: 'Nilai terukur', en: 'Measured values' },
  'demo.frequency': { id: 'Frekuensi dominan', en: 'Dominant frequency' },
  'demo.amplitude': { id: 'Amplitudo', en: 'Amplitude' },
  'demo.oneOfSix': { id: 'Ini baru satu dari enam parameter', en: 'This is one of six parameters' },
  'demo.inviteBody': {
    id: 'Skrining lengkap menggabungkan enam pengukuran dengan kuesioner gejala, dan menyimpan riwayat supaya perubahan antar waktu terlihat.',
    en: 'A full screening combines six measurements with a symptom questionnaire, and keeps a history so change over time becomes visible.',
  },
  'demo.register': { id: 'Buat akun untuk skrining lengkap', en: 'Create an account for the full screening' },
  'demo.notStored': {
    id: 'Hasil peragaan ini tidak disimpan di mana pun.',
    en: 'This demonstration result is not stored anywhere.',
  },

  // ── Gagal muat ─────────────────────────────────────────────────────────────
  // Kalimatnya sengaja menegaskan bahwa data pasien tetap utuh. Yang gagal
  // adalah pengambilannya, bukan datanya, dan pasien berhak tahu bedanya.
  'err.loadTitle': { id: 'Data tidak berhasil dimuat', en: 'Could not load your data' },
  'err.loadBody': {
    id: 'Sambungan ke server terputus, jadi riwayat pemeriksaan Anda belum bisa ditampilkan. Data Anda tetap tersimpan dan tidak ada yang hilang. Periksa sambungan internet Anda, lalu coba lagi.',
    en: 'The connection to the server failed, so your examination history cannot be shown yet. Your data is still stored and nothing has been lost. Check your internet connection, then try again.',
  },
  'err.retry': { id: 'Coba lagi', en: 'Try again' },

  // Bahasa
  'lang.switch': { id: 'Bahasa', en: 'Language' },
  'nav.label': { id: 'Navigasi utama', en: 'Main navigation' },
  'nav.skipToContent': { id: 'Lewati ke isi halaman', en: 'Skip to content' },
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
      {/* Kamus di atas menangani label utama tanpa jeda, sedangkan penerjemah
          halaman menyapu sisanya sehingga tidak ada teks yang tertinggal */}
      <PageTranslator lang={lang} />
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

/**
 * Catatan: penerjemahan teks dinamis tidak lagi ditangani per komponen. Sejak
 * PageTranslator dipasang di provider ini, seluruh isi halaman, termasuk
 * ringkasan AI dan rekomendasi, diterjemahkan langsung dari DOM. Hook khusus
 * untuk itu dihapus agar satu teks tidak diterjemahkan dua kali.
 */

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      // Label "ID"/"EN" adalah kode bahasa, bukan kalimat. Tanpa penanda ini
      // penerjemah halaman akan mengubah "ID" menjadi "Identity".
      data-no-translate=""
      className={langStyles.group}
    >
      {(['id', 'en'] as Lang[]).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={langStyles.option}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/**
 * Label kondisi dan tren datang dari server dalam bahasa Indonesia. Nilainya
 * berasal dari daftar tertutup, jadi dipetakan langsung di sini alih-alih
 * memanggil DeepL untuk teks yang tidak pernah berubah.
 */
const SERVER_LABELS: Record<string, string> = {
  'Sehat': 'Healthy',
  'Parkinson Awal (Hoehn-Yahr 1-2)': 'Early Parkinson\u2019s (Hoehn-Yahr 1-2)',
  'Parkinson Lanjut (Hoehn-Yahr 3-4)': 'Advanced Parkinson\u2019s (Hoehn-Yahr 3-4)',
  'Pasca Stroke (Hemiplegia)': 'Post-Stroke (Hemiplegia)',
  'Essential Tremor': 'Essential Tremor',
  'Ataksia Serebelar': 'Cerebellar Ataxia',
};

export function translateServerLabel(label: string | undefined | null, lang: Lang): string {
  if (!label) return '';
  if (lang !== 'en') return label;
  return SERVER_LABELS[label] || label;
}

/** Format tanggal mengikuti bahasa aktif. */
export function dateLocale(lang: Lang) {
  return lang === 'en' ? 'en-GB' : 'id-ID';
}
