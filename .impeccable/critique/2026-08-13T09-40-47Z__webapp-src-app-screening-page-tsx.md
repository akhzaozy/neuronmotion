---
target: screening
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-13T09-40-47Z
slug: webapp-src-app-screening-page-tsx
---
Metode: dua agen terpisah (A: tinjauan desain · B: detektor + bukti statis), keduanya berjalan terisolasi.

Target: `webapp/src/app/screening/page.tsx` dan seluruh alur skrining pasien (ScreeningInstruction, PreScreeningQuestionnaire, CameraView, useBiomarkerCapture). Mode: **Operate**.

## Skor Kesehatan Desain

| # | Heuristik | Skor | Masalah Utama |
|---|-----------|------|---------------|
| 1 | Visibilitas Status Sistem | 3 | Status ada dan cukup baik, tapi semua elemennya diukur untuk pembaca berjarak 50cm; tidak terbaca pada jarak operasi 2 meter |
| 2 | Kesesuaian dengan Dunia Nyata | 2 | Telemetri debug ("Tremor Amp 14.2 mm", "Sway Area cm²") disajikan ke orang awam yang sedang cemas, tanpa satuan, rentang normal, atau makna |
| 3 | Kontrol dan Kebebasan Pengguna | 1 | "Lewati" justru memulai rekaman; tidak ada tombol kembali, jeda, ulangi tes, atau keluar dari alur |
| 4 | Konsistensi dan Standar | 2 | Tiga teks instruksi yang saling bertentangan per tes; tertulis 10 detik padahal merekam 15 detik |
| 5 | Pencegahan Kesalahan | 2 | Ada quality gate yang bagus, tapi cek login baru dilakukan saat submit setelah ~7 menit tes, dan tidak ada pengecekan framing sebelum mulai |
| 6 | Pengenalan daripada Mengingat | 2 | Pengguna menghafal 4 langkah, lalu layar dikosongkan tepat saat perekaman |
| 7 | Fleksibilitas dan Efisiensi | 1 | Rangkaian kaku 6 dari 6; tidak ada mode tes tunggal untuk pemantauan berkala yang justru jadi alasan produk ini ada |
| 8 | Desain Estetis dan Minimalis | 2 | ~14 elemen bersamaan saat perekaman; yang paling mencolok di layar justru kata "Skrining" |
| 9 | Pemulihan dari Kesalahan | 1 | Penolakan izin kamera berujung buntu tanpa jalan keluar; empat jalur kegagalan memakai `window.alert()` |
| 10 | Bantuan dan Dokumentasi | 2 | Overlay instruksi adalah bantuan yang nyata, tapi tidak ada akses ke bantuan tanpa meninggalkan alur |
| **Total** | | **18/40** | **Buruk, perlu perombakan besar pada layar perekaman dan layar hasil** |

Tidak ada heuristik yang n/a. Ini permukaan Operate, kesepuluhnya berlaku.

## Putusan Kekhasan Desain

**Penilaian A: ini wizard SaaS multi-langkah yang generik, dengan webcam ditempelkan di slot kedua. Kira-kira hanya 15% permukaan ini yang benar-benar dirancang untuk situasi nyatanya.**

Bagian yang khas memang nyata dan harus dilindungi: enam figur SVG teranimasi yang gerakannya meniru gerakan yang diminta (`ScreeningInstruction.tsx:13-153`), peringatan deteksi bagian tubuh secara langsung, sampler kecerahan ruangan, dan dua quality gate perekaman (`useBiomarkerCapture.ts:218-231`). Ada yang benar-benar memikirkan kondisi ruangan yang tidak terkendali.

Selebihnya adalah chrome wizard standar, dan tiga hal ini membuktikannya:

1. **Tata letaknya dashboard desktop.** `screening.module.css:11` memakai `grid-template-columns: 1fr 350px` dengan rail status di kanan. Itu pola project tracker. Situasi sebenarnya: HP disandarkan ke buku, pengguna berdiri 2 meter jauhnya.
2. **Kamera bertentangan dengan pengukurannya sendiri.** `Camera.module.css:10` mengunci `aspect-ratio: 16/9` dan `useBiomarkerCapture.ts:109` meminta `1280x720` lanskap. Tiga dari enam tes butuh seluruh tubuh berdiri masuk frame. Strip lanskap di HP portrait secara fisik tidak bisa memuat orang dewasa berdiri pada jarak 2 meter.
3. **Jalur sukses dapat design system, jalur gagal dapat `alert()`** (`useBiomarkerCapture.ts:220, 229`, `page.tsx:92, 115`).

**Pemindaian deterministik: `detect.mjs` menghasilkan 0 temuan, exit 0, tanpa false positive.** Hasil bersih itu nyata tapi sempit cakupannya: detektor hanya memindai markup/TSX, jadi masalah CSS module dan i18n di bawah ini memang di luar jangkauannya. Sapuan statis menemukan yang tidak terjangkau detektor:

- **39 literal warna hardcoded** di empat CSS module, plus ~40 lagi di dalam SVG `ScreeningInstruction.tsx`. Banyak yang sudah punya padanan token persis di `globals.css` (`#475569` = `--text-secondary`, `#64748b` = `--text-muted`, `rgb(124,58,237)` = `--purple`, `rgb(220,38,38)` = `--red`). `ScreeningInstruction.module.css` dikunci mode terang lewat 13 literal dan tidak akan ikut berubah di tema gelap.
- **25 ukuran font di bawah 14px**, terkecil `0.68rem` (10,9px) di `PreScreeningQuestionnaire.module.css:46` dan `0.65rem` (10,4px) inline di `CameraView.tsx:195`.
- **Target sentuh di bawah 44px**: `.skipLink` terhitung ~23px (`ScreeningInstruction.module.css:159`) dan `.btn` dasar ~39px (`globals.css:260-277`). `.btn-sm` punya `min-height: 34px` eksplisit dengan komentar yang menunjukkan penulisnya sengaja menaikkannya, tapi berhenti 10px di bawah standar.
- **`prefers-reduced-motion` tidak ada sama sekali di seluruh repo**, padahal empat module ini saja punya 31 deklarasi transisi/animasi, beberapa berulang tanpa henti.
- **~90 string Bahasa Indonesia hardcoded** yang melewati `t()`. Hanya `ScreeningInstruction.tsx` yang memakai i18n; `page.tsx`, `CameraView.tsx`, dan `PreScreeningQuestionnaire.tsx` nol pemanggilan `t()`.

**Di mana keduanya sepakat:** celah reduced-motion dan celah i18n ditemukan keduanya secara independen. A sampai ke sana lewat penelusuran persona (pasien tremor ditunjukkan figur berkedip ~8Hz; tombol ganti bahasa yang menjanjikan sesuatu yang tidak dipenuhi halaman utamanya), B lewat grep. Cacat yang sama, dua jalur berbeda.

**Yang ditemukan B tapi terlewat A:** pemetaan token per literal, 25 ukuran font di bawah 14px, dan fakta bahwa `framer-motion@^12.43.0` terdaftar di `package.json` tapi **nol import** di `webapp/src`. Dependensi tak terpakai, padahal ada dokumen proyek yang menyebutnya bagian dari stack.

**Yang ditemukan A tapi tak mungkin dilihat B:** semua yang menyangkut ruangan nyata. Tidak ada detektor yang bisa melihat bahwa instruksi menghilang tepat saat paling dibutuhkan, bahwa "Lewati" berarti kebalikan dari yang dilakukannya, atau bahwa angka tanpa label dalam lingkaran merah terbaca sebagai diagnosis.

**Overlay visual: tidak ada.** Tidak ada otomasi browser di sesi ini, jadi tidak ada server dev yang dijalankan dan tidak ada overlay yang disuntikkan. Dua penghalang lain tetap berlaku: `/screening` langsung mengalihkan ke `/login` tanpa token (`page.tsx:91-95`), dan perekaman butuh izin kamera. **Semua temuan di atas bersifat level-sumber; tidak ada pengukuran kontras render, focus ring, atau target sentuh terkomputasi yang dilakukan.**

## Kesan Keseluruhan

Rekayasanya lebih maju daripada desainnya, dan jaraknya paling lebar tepat di titik pengguna paling rentan. Pipeline perekamannya matang: quality gate, peringatan deteksi langsung, pesan unduh model yang jujur. Antarmuka yang membungkusnya dirancang untuk orang yang duduk 50cm dari monitor, satu-satunya posisi yang tidak pernah dipakai produk ini.

Peluang terbesar: **rancang untuk dua meter itu.** Pengguna menekan tombol, menjauh dari perangkat, melakukan gerakan tanpa bisa melihat umpan balik, lalu kembali. Hampir semua P0 dan P1 di bawah adalah akibat dari situasi itu tidak pernah dirancang.

## Yang Sudah Bagus

1. **Figur instruksi teranimasi adalah artefak yang benar-benar khas produk ini.** `ScreeningInstruction.tsx:13-153` menggambar enam figur yang gerakannya mengikuti gerakan asli: tungkai bawah figur ROM berputar 55° pada sendi lutut, kaki figur gait berputar berlawanan ±14° dalam siklus 0,8 detik. Ini memecahkan masalah tersulit yang nyata, yaitu instruksi tertulis tidak bisa menyampaikan sebuah gerakan kepada orang yang belum pernah melakukannya, sekaligus menghapus ketergantungan pada bahasa. Itu penting untuk segmen lansia yang disebut PRODUCT.md.

2. **Quality gate menghormati kondisi ruangan.** `useBiomarkerCapture.ts:224-231` menolak rekaman yang bagian tubuhnya terdeteksi di bawah 35% frame, dan menyebutkan bagian tubuh mana yang bermasalah. Baris `:330-344` memunculkan peringatan itu secara langsung setelah ~1,5 detik, bukan membiarkan 15 detik pengguna terbuang. Kebanyakan demo menerima rekaman apa pun lalu menyalahkan model.

3. **Copy pembuka kuesioner adalah tulisan terbaik di produk ini.** `PreScreeningQuestionnaire.tsx:69-79` menjelaskan *mengapa* ia bertanya, memberi contoh jujur, menyebut biaya waktunya, menyatakan tidak ada jawaban benar atau salah, dan menyebut konsekuensi melewatinya tanpa memblokir. Itu persis suara tenang dan hati-hati secara klinis yang dijanjikan PRODUCT.md, sekaligus standar yang belum dipenuhi bagian lain alur ini.

## Masalah Prioritas

### [P0] Instruksi menghilang tepat pada 10 sampai 15 detik yang menentukan
`CameraView.tsx:121` menyembunyikan badge instruksi saat `!isCapturing` bernilai salah. Teks yang tersisa hanya 0,82rem (`Camera.module.css:158`) atau string canvas `bold 20px Inter` dalam ruang koordinat 1280px (`useBiomarkerCapture.ts:363`), yang di HP selebar 390px tampil sekitar 6px, dengan font yang bahkan tidak dimuat proyek ini.

**Kenapa penting:** PRODUCT.md menyatakannya terang-terangan, instruksi saat perekaman harus terbaca ketika pengguna berjarak beberapa meter dari layar. Desainnya melakukan kebalikannya. Orang yang berjalan menuju HP tidak punya panduan sama sekali, tidak bisa melihat hitung mundur, dan tidak tahu perekaman sudah dimulai. Setiap rekaman jadi tebak-tebakan.

**Perbaikan:** Balik aturannya. Saat `isCapturing`, tampilkan pita instruksi besar di bawah video, `clamp(20px, 5vw, 34px)`, kontras tinggi di atas latar gelap solid, tanpa `nowrap`. Hitung mundur `clamp(40px, 12vw, 96px)` sebagai DOM, bukan canvas. Hapus teks REC di canvas (`useBiomarkerCapture.ts:357-366`). Tambahkan aba-aba 3-2-1 dan nada penutup agar pengaturan waktu tidak menuntut membaca sama sekali.

**Perintah yang disarankan:** `/impeccable adapt`

### [P0] Penolakan izin kamera buntu total, dan login baru dicek setelah 7 menit kerja
Dua jalan buntu terpisah. (a) `useBiomarkerCapture.ts:119-122` meringkas semua penolakan `getUserMedia` jadi satu pesan, sehingga `NotAllowedError`, `NotFoundError`, `NotReadableError`, dan konteks tidak aman tak bisa dibedakan; "Coba Lagi" (`CameraView.tsx:84`) memanggil ulang `getUserMedia`, yang setelah blokir permanen langsung ditolak tanpa memunculkan prompt. Tombol yang secara kasat mata tidak melakukan apa-apa, selamanya. (b) `page.tsx:90-95` memeriksa `user && token` hanya di dalam `submitScreening`, lalu menampilkan alert dan mengarahkan ke `/login`, membuang keenam rekaman yang tersimpan di state lokal.

**Kenapa penting:** Izin kamera adalah satu-satunya gerbang produk ini. Pengguna lansia non-teknis yang sekali menekan "Blokir" tidak punya jalan kembali dan akan menyimpulkan produknya rusak. Dan kehilangan 7 menit tes fisik yang melelahkan, dikerjakan sendirian oleh orang dengan gangguan gerak, di langkah terakhir, adalah tempat terburuk untuk menaruh dinding autentikasi.

**Perbaikan:** Bedakan berdasarkan `e.name` dengan instruksi pemberian ulang izin spesifik per platform (jalur ikon gembok untuk Chrome Android dan Safari iOS); deteksi `!window.isSecureContext` sebelum memanggil `getUserMedia`. Pindahkan cek autentikasi ke saat halaman dimuat, jadikan gerbang masuk, bukan gerbang submit. Simpan `completedTests` dan `questionnaire` ke `sessionStorage` agar refresh, HP terkunci, atau perjalanan ke halaman login tidak menghancurkan sesi, dan tambahkan penjaga `beforeunload` selama masih ada rekaman tertunda.

**Perintah yang disarankan:** `/impeccable harden`

### [P1] "Lewati" memulai rekaman, dan tes yang salah waktu tidak bisa diulang
`ScreeningInstruction.tsx:226` memanggil `onSkip`, yaitu `handleInstructionSkip` (`page.tsx:85-88`), yang langsung memanggil `startCapture`. `handleNext` (`page.tsx:64-71`) hanya menambah indeks, jadi rekaman buruk permanen ikut masuk ke skor risiko.

**Kenapa penting:** "Lewati" adalah kata yang wajar untuk dua makna sekaligus, "lewati masa tunggu" dan "lewati tes ini", dan keduanya berkonsekuensi berlawanan. Orang yang belum siap dan menekannya untuk kabur justru langsung terekam. Pengguna yang *tahu* rekamannya jelek tidak bisa memperbaikinya, dan itu menggerus kepercayaan dalam konteks kesehatan.

**Perbaikan:** Ganti label jadi "Mulai sekarang". Tambahkan "Lewati tes ini" yang benar-benar melompat tanpa merekam. Buat hitung mundur 5 detik bisa dijeda dan diperpanjang ("+10 detik" untuk tes berjalan). Tambahkan "Ulangi tes ini" per tes di daftar sidebar (`page.tsx:241-252`).

**Perintah yang disarankan:** `/impeccable clarify`

### [P1] Layar hasil bisa terbaca sebagai diagnosis, dan disclaimernya hilang saat AI tidak tersedia
`page.tsx:276-294` memasangkan angka tanpa label di dalam cincin merah 8px dengan `mlClassification.predictedLabel` yang ditampilkan sebagai badge brand polos. Kalimat "Ini bukan diagnosis medis" ada di `page.tsx:357`, bersarang di dalam `result.aiAnalysis?.available`. Cabang `!result.aiAnalysis` (`:366-370`) **tidak memuat disclaimer sama sekali**. Terpisah dari itu, `:306` memberi label "Skor Pengukuran (Kamera)" tapi menampilkan `compositeScore`, nilai yang sama persis dengan yang sudah ada di lingkaran besar.

**Kenapa penting:** Ini layar paling berkonsekuensi bagi orang awam yang ketakutan sendirian di rumah, dan ia melanggar prinsip 2 dan 3 PRODUCT.md sekaligus batasan yang melarang UI menyiratkan model ML sudah selesai. Skenario gagalnya: layanan AI mati, pengguna melihat angka 72 merah, sebuah nama kondisi, dan nol peringatan. Secara fungsional itu diagnosis yang disampaikan oleh halaman web.

**Perbaikan:** Beri label skala dan arah pada angkanya ("72 dari 100 · makin tinggi makin perlu diperiksa") dan tambahkan pita legenda. Keluarkan disclaimer dari semua kondisional, jadikan elemen tetap persis di bawah lingkaran skor. Beri kualifikasi eksplisit pada `predictedLabel` sebagai sinyal eksperimental yang belum tervalidasi, atau hapus dari tampilan pasien. Perbaiki `:306` agar menampilkan subskor kamera saja, atau hapus kotak duplikatnya. Rancang state risiko rendah yang hangat, supaya desain emosionalnya tidak hanya berisi alarm. Tambahkan aksi "simpan / bagikan ke dokter", karena portal nakes sudah ada.

**Perintah yang disarankan:** `/impeccable clarify`

### [P1] Layar perekaman di HP secara fisik tidak sanggup menjalankan tiga dari enam tesnya
`Camera.module.css:10` mengunci 16:9 tanpa varian portrait; `useBiomarkerCapture.ts:109` meminta lanskap 1280x720. Tes `gait`, `armSwing`, dan `posture` butuh seluruh tubuh berdiri. Ditambah lagi, overlay instruksi diposisikan absolut *di dalam* kontainer itu (`ScreeningInstruction.module.css:3-19`), sehingga di HP sebuah kartu berisi badge, judul, figur 128px, empat langkah, dan tombol harus di-scroll di dalam kotak letterbox setinggi ~200px. Tim menyadarinya lalu memasang scrollbar (`:21-25`), bukan memperbaiki tata letaknya.

**Kenapa penting:** Tubuh vertikal dalam strip horizontal akan terpotong di lutut, justru bagian yang dibaca biomarker gait dan ROM. Dan "Saya Siap, Mulai" yang berada di bawah lipatan kontainer scroll 200px adalah aksi utama yang tersembunyi.

**Perbaikan:** Minta constraint portrait pada viewport sempit dan ubah kontainer jadi `aspect-ratio: 3/4` atau satu layar penuh lewat media query portrait. Naikkan overlay instruksi jadi sheet layar penuh di mobile. Tambahkan pengecekan framing yang memastikan kepala dan kedua pergelangan kaki terdeteksi sebelum tombol mulai aktif untuk tes seluruh tubuh.

**Perintah yang disarankan:** `/impeccable adapt`

### [P2] Copy instruksi saling bertentangan dan durasi yang tertulis salah
Ada tiga sumber kebenaran per tes (`page.tsx:26-32`, `CameraView.tsx:42-49`, `i18n.tsx:90-130`) yang saling bertentangan: posture menyebut kaki rapat vs selebar bahu; ROM menyebut berdiri menyamping vs duduk di kursi; gait menyebut berjalan mendekati kamera vs berjalan maju-mundur. Semua instruksi menulis **10 detik** padahal `useBiomarkerCapture.ts:29-31` merekam **15 detik** untuk tiga tes. Selain itu `i18n.tsx:100` salah menerjemahkan "as wide" jadi *"se-keras mungkin"*, yang membuat pengguna mengetuk sekuat tenaga alih-alih selebar mungkin, dan itu merusak pembacaan amplitudo.

**Kenapa penting:** Pengguna mengikuti satu teks, model mengukur dengan protokol lain, dan sepertiga terakhir tiga rekaman berisi orang yang sudah berhenti bergerak. Ini korupsi data diam-diam pada alat skrining kesehatan.

**Perbaikan:** Satu sumber kebenaran. Turunkan nama, deskripsi, badge, langkah, dan durasi dari satu record berkunci, dan sisipkan durasi ke dalam copy dari `TEST_DURATION` supaya tidak bisa melenceng lagi. Perbaiki terjemahan tapping jadi *"selebar mungkin"*.

**Perintah yang disarankan:** `/impeccable clarify`

## Temuan per Persona

**Jordan (baru pertama kali):** Onboarding berisi 5 poin berklausa ganda dengan fakta "bukan diagnosis" terkubur di poin ke-4; ia menekan "Saya Mengerti" tanpa membaca. `page.tsx:26` menyuruhnya mengangkat tangan sejajar dada, overlay menambahkan "telapak menghadap bawah" (`i18n.tsx:92`) yang tak pernah disebut teks pertama, dan ia tidak tahu mana yang benar. Ia menekan "Mulai Rekam · Tremor", tidak ada yang terlihat merekam, dan tombol yang barusan ditekan kini `disabled` dengan opasitas 0,5. Ia mengira rusak. Ia menekan "Lewati" berharap melompati tes, dan justru sedang direkam. Rekamannya gagal di gate 20 sampel, muncul kotak OS berbunyi *"Hanya 8 sampel terdeteksi"*. Kata "sampel" tidak punya makna baginya, dan kotak itu tidak memberi tahu apa yang harus diubah.

**Sam (bergantung pada aksesibilitas):** **Seluruh proses perekaman senyap bagi pembaca layar.** Nol region `aria-live` di `page.tsx`, `CameraView.tsx`, maupun `ScreeningInstruction.tsx`, jadi hitung mundur, peringatan deteksi, peringatan pencahayaan, dan peralihan mulai/berhenti merekam sama sekali tidak diumumkan. Elemen `<video>` diberi `opacity: 0` dan semua keluaran digambar ke `<canvas>` tanpa `role`, tanpa `aria-label`, tanpa alternatif teks. Keluaran utama produk ini tidak terlihat oleh teknologi bantu. **Empat overlay bukan dialog**: onboarding, hasil, instruksi, dan error semuanya tanpa `role="dialog"`, `aria-modal`, jebakan fokus, dan penanganan Escape; menekan Tab dari modal hasil justru masuk ke halaman di belakangnya. Motorik: `.skipLink` adalah target ~23px yang konsekuensinya *memulai rekaman*; `.controls button { flex: 1 }` digabung `white-space: nowrap` membuat label "Mulai Rekam · Tremor" tidak bisa membungkus dan meluber di HP sempit. Penglihatan rendah: kalimat paling penting secara hukum di layar hasil (`aiDisclaimer`, 0,75rem dengan `--text-muted`) adalah teks terkecil dan berkontras terendah di layar itu; `.countdownLabel` `#64748b` di atas kaca terang sekitar 4,3:1, di bawah AA, padahal isinya berapa detik tersisa. **Waktu: WCAG 2.2.1 mensyaratkan batas waktu bisa dimatikan, disesuaikan, atau diperpanjang. Hitung mundur 5 detik maupun durasi tes tidak memenuhi ketiganya.** Warna saja: `MetricChip` memakai hijau/kuning/merah tanpa ikon atau teks pendamping.

**Casey (satu tangan, koneksi lambat):** WASM MediaPipe dan dua berkas model `.task` diunduh dari `cdn.jsdelivr.net` dan `storage.googleapis.com` **setelah** izin kamera diberikan, dengan timeout keras 30 detik. Di jaringan 3G ia menonton lampu kameranya menyala sementara spinner berputar, lalu mendapat "timeout" dan disuruh me-refresh, yang mengunduh ulang semuanya. Fallback GPU ke CPU membuat ulang kedua landmarker dari nol tanpa indikator progres dan tanpa pesan bahwa fallback sedang terjadi. Tidak ada yang di-precache; setiap sesi mengunduh ulang. CTA utama berada di bawah header + progress + kartu instruksi + video 16:9, jadi ia harus scroll sebelum setiap tes, enam kali. Ada telepon masuk di tengah perekaman: tab masuk latar, `rAF` berhenti, pengecekan waktu memakai `Date.now()` jam dinding, jadi begitu kembali perekaman langsung dinyatakan selesai dengan sampel tak lengkap dan sebuah `alert`. Tidak ada yang tersimpan.

**Ibu Sri (68 tahun, tremor istirahat, sendirian, HP disandarkan ke buku) — persona proyek.** Inilah orang yang jadi dasar PRODUCT.md, dan **ia tidak bisa menyelesaikan tes gait.** Ia harus menekan "Saya Siap, Mulai", meletakkan HP, dan berjalan mundur 2 meter **dalam 5 detik**, tanpa bisa diperpanjang atau dijeda. Tremornya melawan antarmuka justru di saat presisi dituntut, dan satu-satunya kontrol yang bisa menyelamatkannya adalah tautan teks ~23px yang jika salah tekan malah *memulai* perekaman. Begitu ia 2 meter menjauh, antarmuka praktis kosong; ia akan berhenti berjalan di detik ke-10 karena begitu bunyi instruksinya, sementara sistem merekam 15 detik. Tubuhnya yang berdiri tidak akan muat di frame 16:9 terkunci pada jarak 2 meter, sehingga landmark pergelangan kaki yang jadi dasar gait jatuh di luar frame, peringatan deteksi muncul di pita 0,82rem yang tak terbaca dari jarak itu, lalu rekamannya ditolak menjadi `alert` yang harus ia hampiri untuk ditutup. Setelah itu ia mengulang seluruh siklus, karena "Ulangi tes ini" bukan sebuah tombol. Dua atau tiga putaran seperti ini, dikerjakan orang yang kondisinya membuat berjalan melelahkan, adalah titik ia menutup tab. Terpisah dari itu, instruksi ROM bertentangan sendiri antara berdiri dan duduk, dan "berdiri menyamping lalu angkat satu lutut setinggi mungkin" adalah risiko jatuh yang diminta pada lansia 68 tahun tanpa peringatan apa pun dan tanpa saran berpegangan pada kursi.

## Catatan Kecil

- `page.tsx` memuat ~20 objek `style={{}}` inline berdampingan dengan CSS module lengkap, dan `MetricChip` seluruhnya ditata inline. Design system-nya tidak menanggung beban di sini.
- Progress bar menulis "Langkah 1 dari 6" padahal pengguna sudah melewati modal onboarding dan kuesioner penuh. Alurnya tiga fase, indikatornya hanya tahu satu.
- Onboarding menjanjikan "± 5-7 menit total" padahal total waktu perekaman hanya 75 detik. Selisihnya adalah persiapan dan reposisi, yang tidak pernah dianggarkan atau dipandu desainnya.
- `stepItem.active` dan `.done` nyaris hanya dibedakan lewat rona latar; item pending bahkan tanpa ikon.
- `lightingWarning` muncul kapan pun kamera menyala, termasuk *di balik* overlay instruksi, tak terlihat di balik blur. Satu-satunya momen untuk membetulkan pencahayaan adalah sebelum merekam, dan justru saat itulah peringatannya tersembunyi.
- Layar izin kamera tidak pernah menyebut bahwa video tidak meninggalkan perangkat. Fakta privasi itu adalah seluruh pembeda produk ini, dan ia absen persis di layar tempat pengguna memutuskan untuk percaya atau tidak.
- `ScreeningInstruction.tsx:186-191`: `useEffect` bergantung pada `onReady`, yang identitas fungsinya baru di setiap render induk (`page.tsx:79`). Ini bug laten yang mereset hitung mundur.
- `PreScreeningQuestionnaire.tsx:92`: `isAnswered` dipaksa `true` untuk pertanyaan teks, jadi teks bebas kosong tetap lolos, sementara "Lanjut" di tempat lain dinonaktifkan tanpa menjelaskan apa yang kurang.
- `framer-motion` terdaftar sebagai dependensi tapi nol import di `webapp/src`; semua motion di sini ditulis tangan dengan CSS.
- Linter `check-em-dash` melaporkan 718 temuan, semuanya di dokumentasi skill yang di-vendor di `.agents/`. Sumber aplikasinya bersih. Cakupan linter sebaiknya mengecualikan dokumen vendor, kalau tidak ia akan terus memberi alarm palsu.

## Pertanyaan untuk Dipikirkan

1. **Kenapa harus enam tes?** Tidak ada jalan bagi pengguna lama untuk menjalankan satu tes saja. Kalau pekerjaannya adalah "memantau apakah memburuk", unit terkecilnya adalah satu biomarker sepanjang waktu, bukan rangkaian 7 menit yang harus selesai sendirian dalam sekali duduk atau hilang seluruhnya.
2. **Bilah metrik langsung itu untuk siapa?** Kalau untuk pengguna, ia gagal, karena tak satu angka pun dijelaskan. Kalau untuk penonton demo, ia sedang menimbulkan kecemasan nyata pada pengguna utama di tengah tesnya. Pilih salah satu, dan kalau untuk demo, sembunyikan di balik toggle.
3. **Pengguna tidak bisa melihat layar saat melakukan tes. Lalu kenapa desainnya visual?** Tiga nada audio untuk siap / merekam / selesai akan sekaligus menyelesaikan masalah jarak, masalah penglihatan rendah, dan masalah salah waktu, dengan usaha lebih kecil daripada enam figur SVG yang sudah dibangun.
4. **Apa yang produk ini lakukan ketika hasilnya benar-benar mengkhawatirkan dan penggunanya sendirian jam 11 malam?** Sekarang: sebuah angka merah dan dua tombol navigasi. Ada halaman `/bantuan`, ada portal dokter, ada model relasi di skema, dan tidak satu pun bisa dijangkau dari momen yang paling membutuhkannya.
5. **Kenapa layar izin kamera, satu-satunya gerbang seluruh produk, justru permukaan yang paling tidak dirancang di repo ini?**
