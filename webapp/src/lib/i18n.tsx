'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import PageTranslator from './pageTranslator';

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
  'bot.placeholder': { id: 'Ketik pertanyaan Anda... (Enter kirim)', en: 'Type your question... (Enter to send)' },
  'bot.messageLabel': { id: 'Pesan untuk NeuroBot', en: 'Message for NeuroBot' },
  'bot.send': { id: 'Kirim pesan', en: 'Send message' },
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
  'scr.submit': { id: 'Kirim Hasil Skrining', en: 'Submit Screening Results' },
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
          // Tinggi minimum 32px agar tetap nyaman disentuh di layar sentuh;
          // sebelumnya kotak singgungnya hanya 25px.
          style={{
            minHeight: 32,
            padding: '0 12px',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            // Warna rata, bukan gradien. Gradien pada kepingan selebar 32 piksel
            // hanya terbaca sebagai warna kotor, bukan sebagai gradasi.
            background: lang === l ? 'var(--brand)' : 'transparent',
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
