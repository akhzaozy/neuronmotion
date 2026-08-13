---
name: NeuronMotion
description: Lembar Klinis Basel, sistem visual dokumen klinis untuk skrining gerak berbasis kamera.
colors:
  sheet: "#f2f1ec"
  field: "#fbfaf7"
  margin-ground: "#e7e5dd"
  inset: "#e2e0d7"
  ink: "#17181c"
  ink-secondary: "#454a52"
  ink-muted: "#5f656e"
  accent: "#c8402a"
  accent-deep: "#9c2f1e"
  accent-wash: "rgba(200, 64, 42, 0.09)"
  rule-hair: "rgba(23, 24, 28, 0.14)"
  rule: "rgba(23, 24, 28, 0.28)"
  rule-heavy: "rgba(23, 24, 28, 0.72)"
  level-low: "#2f6b4f"
  level-low-wash: "rgba(47, 107, 79, 0.10)"
  level-mid: "#8a5a12"
  level-mid-wash: "rgba(138, 90, 18, 0.10)"
  level-high: "#a32d1c"
  level-high-wash: "rgba(163, 45, 28, 0.10)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
    fontFeature: "tnum 1"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  head:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  record:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  radius: "2px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
  s9: "96px"
  touch: "44px"
  touch-lg: "56px"
components:
  btn:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-hover:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
  btn-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.radius}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "#ffffff"
  btn-danger:
    backgroundColor: "transparent"
    textColor: "{colors.level-high}"
    rounded: "{rounded.radius}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-lg:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.lead}"
    padding: "16px 32px"
    height: "{spacing.touch-lg}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius}"
    padding: "12px 12px"
    height: "{spacing.touch}"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "24px"
  level-low:
    backgroundColor: "{colors.level-low-wash}"
    textColor: "{colors.level-low}"
    typography: "{typography.record}"
    padding: "8px 12px"
  level-mid:
    backgroundColor: "{colors.level-mid-wash}"
    textColor: "{colors.level-mid}"
    typography: "{typography.record}"
    padding: "8px 12px"
  level-high:
    backgroundColor: "{colors.level-high-wash}"
    textColor: "{colors.level-high}"
    typography: "{typography.record}"
    padding: "8px 12px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.record}"
    padding: "0 4px"
    height: "{spacing.touch}"
  dialog:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "32px"
    width: "min(640px, calc(100vw - 48px))"
---

# Design System: NeuronMotion

## Overview

**Creative North Star: "Lembar Klinis Basel"**

Dunia visual ini diturunkan dari dokumentasi farmasi Swiss era Geigy (1955-1970), dan sumbernya ditulis apa adanya di kepala `webapp/src/app/globals.css`. Tesis arahnya juga tidak disimpan di repo saja: ia dicetak ke markup produksi sebagai komentar HTML lewat konstanta `DIRECTION_CONTRACT` di `webapp/src/app/layout.tsx`, supaya keputusan visualnya bisa diaudit dari halaman yang sudah jadi. Yang ditolak dinyatakan eksplisit di sana: kartu membulat, biru teal lembut, badge pil, dan ilustrasi ramah khas telehealth.

Karakternya kertas dan tinta, bukan layar dan kaca. Ground adalah kertas hangat kelabu, tinta adalah near-black dingin, dan satu aksen vermilion dipakai sebagai penanda struktur, bukan sebagai alarm. Kepadatannya tinggi tetapi tidak sempit: garis rambut dan pergeseran ground melakukan pekerjaan yang biasanya diserahkan pada sudut membulat dan bayangan. Halaman terbaca seperti lembar pemeriksaan yang bisa dicetak dan disimpan, dan memang bisa: blok `@media print` di akhir `globals.css` memperlakukan cetakan sebagai bentuk asli, bukan penyesuaian.

Tiga aturan mengikat, dan setiap bagian dokumen ini tunduk padanya:

1. **Nol ikon.** Hierarki dibawa bobot huruf, ukuran, dan garis rule. Status dibawa label teks penuh. Satu-satunya tanda non-huruf yang sah adalah garis rule, batang aksen pada logo (`webapp/src/components/Logo.module.css`, `.bar`, lebar 2px), dan enam figur gerak beranimasi di `webapp/src/components/ScreeningInstruction.tsx` yang merupakan isi instruksional, bukan ikon.
2. **Dokumen, bukan kartu.** Bidang dipisahkan garis rambut dan pergeseran ground. `--radius` bernilai 2px, dan seluruh nama radius lama diratakan ke nilai itu.
3. **Angka adalah materi utama.** Tabular, rata kanan pada kolom, satuan selalu ikut.

**Key Characteristics:**
- Kertas hangat (`#f2f1ec`) dan tinta near-black (`#17181c`), bukan putih layar dan hitam murni.
- Satu aksen vermilion, dipakai untuk struktur: garis kepala, tautan aktif, penanda terpilih.
- Empat bobot garis menggantikan seluruh kosakata bayangan; bayangan hanya ada pada dialog.
- Lantai ukuran huruf 14px dan lantai sasaran sentuh 44px, tanpa perkecualian.
- Angka tabular di mana-mana, termasuk lewat pemilih elemen `table`, `time`, `data`, `output`.
- Satu gerakan yang diotori (`riseIn`), dengan blok `prefers-reduced-motion` global.

## Colors

Palet kertas cetak: ground hangat kelabu, tinta dingin, satu aksen panas, dan tiga warna tingkat pengukuran yang tidak pernah berdiri sendiri.

Semua token didefinisikan di `webapp/src/app/globals.css`. Mode gelap punya dua jalur yang nilainya identik: `[data-theme='dark']` untuk pilihan eksplisit pengguna (disimpan lewat `webapp/src/lib/theme.tsx`), dan blok `@media (prefers-color-scheme: dark)` yang dijaga selektor `:root:not([data-theme='light'])` supaya setelan sistem berlaku ketika pengguna belum memilih apa-apa, tetapi tidak pernah menimpa pilihan terang yang eksplisit. Nilai gelap ditulis dua kali; keduanya harus diubah bersamaan.

### Primary
- **Vermilion Geigy** (`--accent`, terang `#c8402a`, gelap `#f0674c`): penanda struktur. Garis bawah tautan navigasi aktif (`AppNav.module.css .linkActive`), garis kiri baris tes yang sedang berjalan, nomor langkah instruksi, garis atas pita instruksi kamera, kotak terpilih pada kuesioner, dan cincin fokus. Bukan warna tombol utama dan bukan warna bahaya.
- **Vermilion dalam** (`--accent-deep`, terang `#9c2f1e`, gelap `#ff8168`): satu-satunya pemakaian nyata adalah hover tombol utama, yang berpindah dari bidang tinta ke bidang vermilion.
- **Cuci vermilion** (`--accent-wash`): latar bidang terpilih dan badge warisan.

### Neutral
- **Lembar** (`--sheet`, terang `#f2f1ec`, gelap `#16171a`): ground halaman. Dipakai juga sebagai warna teks di atas bidang tinta.
- **Bidang** (`--field`, terang `#fbfaf7`, gelap `#1e2024`): blok isi yang diangkat sedikit dari lembar, isian formulir, dan permukaan dialog.
- **Ground margin** (`--margin-ground`, terang `#e7e5dd`, gelap `#101114`): area paling tenang, dipakai untuk keadaan tekan tombol dan kilau skeleton.
- **Inset** (`--inset`, terang `#e2e0d7`, gelap `#0c0d0f`): ground tersorot dan tertekan, latar bingkai kamera, kotak figur instruksi, blok disclaimer.
- **Tinta** (`--ink`), **tinta sekunder** (`--ink-secondary`), **tinta redup** (`--ink-muted`): tiga tingkat teks. Redup hanya untuk label mono, catatan kaki, dan satuan, tidak pernah untuk kalimat yang harus dibaca.

### Garis
Empat bobot, meniru rule cetak. `--rule-hair` untuk pemisah dalam satu blok dan batas bidang. `--rule` untuk batas kontrol dan isian. `--rule-heavy` untuk kepala dokumen dan kepala tabel. Aksen untuk penanda aktif.

### Tingkat pengukuran
- **Rendah** (`--level-low`, terang `#2f6b4f`, gelap `#6fc99b`)
- **Sedang** (`--level-mid`, terang `#8a5a12`, gelap `#e0b062`)
- **Tinggi** (`--level-high`, terang `#a32d1c`, gelap `#f5836c`)

Ketiganya punya pasangan `-wash` untuk latar. Nilai gelap dinaikkan terangnya agar tetap lewat ambang kontras di atas ground gelap.

### Named Rules

**The Structure Not Alarm Rule.** Vermilion adalah tanda struktur. Bahaya punya bahasanya sendiri (`--level-high` plus label teks plus garis kiri 6px). Jangan pakai `--accent` untuk menyatakan sesuatu buruk, dan jangan pakai `--level-high` untuk sekadar menarik perhatian.

**The Ink Is Loudest Rule.** Aksi paling penting di sebuah lembar adalah yang paling gelap, bukan yang paling berwarna. `.btn--primary` adalah bidang `--ink` penuh dengan teks `--sheet`; tidak ada tombol vermilion dalam keadaan diam.

**The Never Colour Alone Rule.** Warna tidak pernah jadi penanda tunggal. Setiap keadaan yang memakai warna wajib membawa label teks dan perbedaan bentuk atau bobot. Uji: matikan seluruh warna; jika keadaannya masih terbaca, lolos.

## Typography

**Display / Body Font:** Plus Jakarta Sans (fallback `system-ui, sans-serif`), variabel 400 sampai 800, satu berkas 27 kB.
**Label / Mono Font:** JetBrains Mono (fallback `ui-monospace, monospace`), variabel 400 sampai 500.

Keduanya dipasang sendiri lewat `next/font/local` di `webapp/src/app/layout.tsx`, berkasnya di `webapp/src/app/fonts/`, dengan `display: 'swap'` dan variabel CSS `--font-sans` serta `--font-mono`. Tidak ada permintaan ke Google Fonts saat halaman dibuka, jadi tidak ada render yang tertahan jaringan dan tidak ada pergeseran tata letak.

**Character:** Plus Jakarta Sans dipilih menggantikan Inter dengan alasan yang ditulis di komentar `layout.tsx`: Inter adalah bawaan hampir semua templat, sedangkan Plus Jakarta Sans dirancang Tokotype, sedikit lebih hangat dan terbuka, dan sebagai karya Indonesia pilihannya punya alasan. Judul diset rapat dan berat (`font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.15`, `text-wrap: balance`), karena dalam sistem ini judul adalah penanda bagian dokumen, bukan dekorasi.

### Hierarchy
- **`--t-display`** (3.5rem / 56px, bobot 800, `line-height` 0.92, `letter-spacing` -0.04em, tabular): angka pengukuran. Skor risiko di `/screening` dan `/demo`. Di `/dashboard` skor terakhir naik lebih jauh lagi lewat `clamp(3.5rem, 11vw, 6rem)`.
- **`--t-title`** (2.25rem / 36px, `letter-spacing` -0.03em): `h1`, judul halaman, judul lembar instruksi. Halaman landing melampauinya dengan `clamp(2.5rem, 7vw, 5rem)` pada `.heroTitle`.
- **`--t-head`** (1.5rem / 24px): `h2`, judul bidang, judul dialog, nilai hitung mundur.
- **`--t-lead`** (1.125rem / 18px): `h3`, paragraf pembuka, isi langkah instruksi, teks tombol besar.
- **`--t-body`** (1rem / 16px): isi. `line-height` 1.55 di `body`.
- **`--t-record`** (0.875rem / 14px): label kolom, catatan kaki, tautan navigasi, label arsip, isi chip tingkat.

Paragraf dibatasi 68ch lewat pemilih `p` global. Lead landing dibatasi 46ch, disclaimer 78ch, teks keselamatan instruksi 60ch.

### Named Rules

**The 14px Floor Rule.** Tidak ada teks di bawah `--t-record` (14px), tanpa perkecualian. Alasannya ada di komentar `globals.css`: pengguna utama produk ini lansia yang membaca dari jarak jauh. Kalau sebuah label terasa perlu 12px, labelnya yang terlalu panjang, bukan skalanya yang terlalu besar.

**The Mono Is Data Rule.** JetBrains Mono hanya untuk pengukuran, label arsip, dan data: `.label`, `.docHead__meta`, `th` pada `.dataTable`, nomor indeks tes, nomor langkah, pengalih tema dan bahasa. Ia tidak pernah dipakai sebagai kostum "teknis" untuk prosa, judul, atau tombol.

**The Big Step Rule.** Jarak antar tingkat skala sengaja besar, bukan gradasi halus. Hierarki harus terbaca sekilas tanpa membandingkan dua ukuran berdampingan.

## Layout

Kolom isi adalah primitif `.sheet`: lebar penuh, `max-width` 1180px, terpusat, padding samping `--s5` (24px) yang turun ke `--s4` (16px) di bawah 640px. Navigasi memakai batas dan padding yang sama supaya kop dan isi berbagi satu margin dokumen.

Irama ruang adalah satu skala kelipatan 4: `--s1` 4px, `--s2` 8px, `--s3` 12px, `--s4` 16px, `--s5` 24px, `--s6` 32px, `--s7` 48px, `--s8` 64px, `--s9` 96px. Padding bidang `--s5`, jarak antar bagian `--s8`, napas hero `--s9`.

Grid halaman asimetris, bukan kolom sama lebar:
- `/dashboard`: `minmax(0, 1fr) 300px`, isi pengukuran memimpin dan ajakan skrining duduk di margin kanan sebagai satu-satunya bidang tinta di halaman. Runtuh ke satu kolom di bawah 900px.
- `/screening`: `minmax(0, 1fr) 260px`, kolom perekaman memimpin dan indeks tes duduk di margin seperti daftar isi. Runtuh di bawah 980px.
- Landing `.split`: `minmax(0, 1fr) minmax(0, 1.1fr)`, runtuh di bawah 860px.
- Lembar instruksi `.body`: `180px 1fr` untuk figur dan langkah, mengecil ke `120px 1fr` di bawah 720px.

Titik henti tidak diseragamkan; masing-masing surface memakai ambang di mana tata letaknya benar-benar patah (560, 640, 720, 860, 900, 980px). Ini pilihan sadar per surface, bukan skala breakpoint bersama.

Lantai sasaran sentuh `--touch` 44px berlaku untuk semua kontrol, termasuk tautan teks (`.linkAction`) dan tombol kecil warisan (`.btn-sm`). `--touch-lg` 56px dipakai untuk aksi yang ditekan dari jarak jauh atau oleh tangan yang tidak stabil: tombol besar, pilihan peran pada formulir masuk, dan baris pilihan kuesioner.

Tabel lebar menggulir di dalam wadahnya sendiri (`.tableScroll` dengan `overflow-x: auto`); badan halaman tidak pernah menggulir mendatar (`body { overflow-x: hidden }`).

**The Sidebar Is Margin Rule.** Kolom kedua selalu lebih sempit dan selalu sekunder. Ia daftar isi atau ajakan, tidak pernah tempat isi utama, dan di layar sempit ia turun ke bawah karena saat merekam yang penting hanya satu hal.

## Elevation & Depth

Sistem ini datar. Tidak ada kosakata bayangan untuk permukaan biasa: kedalaman dibawa pergeseran ground (lembar, bidang, ground margin, inset) dan bobot garis. Seluruh token bayangan lama (`--shadow-sm`, `--shadow-md`, `--shadow-glow`, `--shadow-glow-green`) dipetakan ke `none` di lapisan migrasi, dan seluruh token gradien lama juga `none`.

### Shadow Vocabulary
- **Angkat dialog** (`--lift`, terang `0 2px 4px rgba(23,24,28,0.08), 0 12px 32px rgba(23,24,28,0.16)`; gelap `0 2px 4px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.55)`): satu-satunya bayangan yang hidup, dipakai hanya pada `.dialogSheet`, yaitu satu-satunya lapisan yang benar-benar melayang di atas lembar.

### Named Rules

**The Rules Not Shadows Rule.** Kalau sebuah blok perlu terpisah dari sekitarnya, beri ia garis atau ground yang berbeda. `box-shadow` di luar `--lift` dan garis fokus isian tidak punya tempat di sini.

**The One Ink Field Rule.** Bidang tinta penuh (`--ink` sebagai latar) adalah tekanan paling keras dalam sistem. Satu halaman maksimal satu: blok penutup di landing, atau ajakan skrining di dashboard, bukan keduanya sekaligus dalam satu layar.

## Shapes

Bentuknya persegi. `--radius` bernilai 2px, dan nilai itu ada supaya konsisten, bukan supaya dipakai besar-besar; komentar sumbernya menyebut alasannya langsung, lembar cetak tidak punya sudut membulat. Nama radius lama (`--radius-sm` sampai `--radius-xl`) semuanya dipetakan ke nilai yang sama, jadi kode lama otomatis ikut rata.

Kosakata bentuk yang nyata adalah garis:
- Kepala dokumen (`.docHead`): garis atas 3px `--rule-heavy`, lalu baris label arsip mono huruf besar di bawahnya. Ini pengganti breadcrumb dan eyebrow, dan ia membawa informasi nyata.
- Kop halaman dan navigasi: garis bawah 2px `--rule-heavy`.
- Bidang (`.field`): garis 1px `--rule-hair`, tanpa bayangan. Varian `.field--flush` melepas padding.
- Pemisah (`.rule`): garis atas 1px `--rule-hair`; `.rule--heavy` 2px `--rule-heavy`.
- Kepala tabel: garis bawah 2px `--rule-heavy`; baris data 1px `--rule-hair`.
- Blok penekanan: garis kiri tebal, bukan latar penuh. Disclaimer memakai 3px `--ink` di atas `--inset`; peringatan mendesak memakai 6px `--level-high` di atas `--level-high-wash`.
- Blok eksperimental (`.experimental` di `screening.module.css`): satu-satunya garis putus-putus dalam sistem, `1px dashed var(--rule)`, menandai hasil yang belum tervalidasi.

Satu-satunya lingkaran penuh dalam kode adalah titik penanda merekam (`.recDot`, `border-radius: 50%`) dan spinner warisan (`.btnSpinner`). Titik merekam selalu ditemani kata "Merekam", jadi ia bukan ikon yang berdiri sendiri.

## Components

### Buttons
- **Bentuk:** persegi (radius 2px), garis 1px `--rule`, tinggi minimum 44px, padding `12px 24px`, bobot 600.
- **Dasar (`.btn`):** latar transparan di atas ground apa pun, teks `--ink`. Hover mengisi `--inset` dan menguatkan garis ke `--rule-heavy`; tekan mengisi `--margin-ground`.
- **Utama (`.btn--primary`):** bidang tinta penuh, teks `--sheet`. Hover berpindah ke `--accent-deep`. Dalam tema gelap teks hover kembali ke `--sheet` lewat aturan khusus.
- **Bahaya (`.btn--danger`):** hanya garis dan teks `--level-high`; hover mengisi `--level-high-wash`. Tidak pernah bidang merah penuh.
- **Besar (`.btn--lg`):** tinggi minimum 56px, padding `16px 32px`, ukuran `--t-lead`. Dipakai untuk aksi yang dibaca dari dua meter.
- **Blok (`.btn--block`):** lebar penuh.
- **Nonaktif:** `opacity: 0.45`, dan pada kuesioner disertai teks yang menyebut apa yang masih kurang.
- **Pembalikan di bidang tinta:** di dalam `.closing` (landing) dan `.action` (dashboard), tombol dibalik; `.btn--primary` menjadi bidang `--sheet` dengan teks `--ink`, dan hover-nya vermilion.
- **Tautan aksi (`.linkAction`):** teks bergaris bawah dengan `text-underline-offset` 0.25em, tetap wajib memenuhi lantai 44px.

### Inputs / Fields
- **Gaya (`.input`):** lebar penuh, latar `--field`, garis 1px `--rule`, radius 2px, tinggi minimum 44px, padding 12px. Placeholder `--ink-muted`.
- **Hover:** garis menguat ke `--rule-heavy`.
- **Fokus:** garis menjadi `--accent` plus garis bawah tebal di dalam kotak (`box-shadow: inset 0 -2px 0 var(--accent)`), `outline: none` karena perlakuan fokusnya sudah ada di dalam.
- **Textarea:** tinggi minimum 120px, hanya bisa diubah vertikal.
- **Galat formulir:** blok teks bergaris kiri 4px `--level-high` di atas `--level-high-wash`, bobot 600. Tidak ada ikon peringatan.

### Focus
Satu perlakuan untuk seluruh elemen interaktif: `:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px }`. Tebal dan berkontras karena pengguna keyboard harus melihatnya dari jarak baca jauh. Ada juga `.skipToContent` yang tersembunyi di atas viewport dan turun ke posisi saat fokus, serta `.srOnly` untuk teks khusus pembaca layar.

### Data Table
Tabel pengukuran (`.dataTable`) adalah komponen tanda tangan sistem ini. Riwayat dan hasil biomarker hidup di sini: `border-collapse: collapse`, angka tabular, kepala kolom mono huruf besar `--t-record` warna `--ink-muted` dengan garis bawah 2px `--rule-heavy`, sel data berpadding `--s3` dengan garis bawah `--rule-hair`, dan kelas `.num` yang membuat kolom angka rata kanan. Caption rata kiri sebagai label tabel. Dipakai di landing, dashboard, screening, dan demo.

### Chip Tingkat Risiko
`.level` plus salah satu dari `.level--low`, `.level--mid`, `.level--high`. Tiga penanda dibawa sekaligus:
1. **Label teks penuh** di dalam chip (bobot 700, huruf besar, `letter-spacing` 0.04em).
2. **Bobot garis kiri** yang berbeda: 2px untuk rendah, 4px untuk sedang, 6px untuk tinggi.
3. **Warna** teks, garis, dan latar cuci.

Pengguna yang tidak bisa membedakan warna tetap membaca tingkatnya dari label dan dari ketebalan garis. Chip tidak pernah dipakai tanpa angka yang menyertainya, dan angka tidak pernah berdiri tanpa skalanya (`.scoreLine` selalu memasangkan `.scoreValue` dengan `.scoreOf`).

### Navigation
`AppNav.module.css` adalah kepala dokumen, bukan bilah mengambang: latar `--sheet` solid, garis bawah 2px `--rule-heavy`, tanpa blur dan tanpa bayangan, tinggi minimum 64px. Tautan adalah teks penuh `--t-record` huruf besar dengan `letter-spacing` 0.05em, warna `--ink-secondary`. Hover menaikkan warna ke `--ink` dan memunculkan garis bawah `--rule`. Aktif menaikkan bobot ke 700 dan mengubah garis bawah menjadi `--accent`, jadi keadaannya terbaca tanpa membedakan warna. Aksi (pengalih tema dan bahasa) dipisahkan garis kiri `--rule-hair`.

Di bawah 860px navigasi turun ke barisnya sendiri dan menggulir mendatar dengan scrollbar disembunyikan. Tidak ada menu hamburger, karena itu ikon, dan karena menyembunyikan lima tautan di balik satu tombol menambah beban ingatan bagi pengguna yang dilayani produk ini.

### Toggles (tema dan bahasa)
`webapp/src/lib/theme.module.css` dan `webapp/src/lib/i18n.module.css` sengaja berbagi satu bentuk: label mono pendek huruf besar di dalam kotak bergaris `--rule-hair`, radius 2px, ukuran minimum 44x44px. Pengalih bahasa adalah kelompok dua tombol; yang terpilih ditandai bobot 700 dan bidang tinta (`background: var(--ink); color: var(--sheet)`), bukan warna saja.

### Camera View
`Camera.module.css` adalah jendela perekaman. Rasio frame mengikuti orientasi layar (16:9 mendatar, 3:4 pada ponsel portrait di bawah 900px) karena mengunci 16:9 memotong tubuh di lutut, dan lutut justru bagian yang dibaca biomarker gait. Di atasnya ada tiga lapisan teks:
- **Pita instruksi** (`.cueBand`): menempel di bawah frame karena di sanalah mata jatuh saat orang melihat dirinya sendiri. Latar `rgba(12,13,15,0.88)`, garis atas 2px `--accent`, teks `clamp(20px, 4.4vw, 34px)`, hitungan `clamp(40px, 12vw, 92px)` tabular dengan satuan yang selalu ikut.
- **Penanda merekam** (`.recFlag`): titik berkedip 1.6s DAN kata "Merekam".
- **Tumpukan peringatan** (`.warnStack`): peringatan kondisi bergaris kiri 3px `--accent`, ditumpuk pada satu jalur supaya peringatan ketiga tetap punya tempat.

Izin, pemuatan, dan kegagalan tidak memakai overlay gelap melainkan `.stateBox`, sebuah lembar bergaris atas 3px `--accent`, karena ketiganya adalah isi halaman, bukan gangguan sesaat.

### Screening Instruction
`ScreeningInstruction.module.css` adalah lembar penuh, bukan kartu bersarang di dalam kotak video. Kepala membawa label mono vermilion, judul `--t-title`, dan deskripsi 52ch. Badan membagi figur gerak dan daftar langkah bernomor mono. Enam figur SVG (tremor, ketukan jari, gait, ayun lengan, postur, dan rentang gerak sebagai cabang terakhir di `Figure()`) adalah isi instruksional: mereka menunjukkan gerakan yang harus ditiru, jadi mereka bukan ikon.

### Dialog
Memakai Radix untuk jebakan fokus, Escape, dan atribut aria; `globals.css` hanya memberi tampilannya. `.dialogScrim` adalah bidang `rgba(23,24,28,0.55)` (0.7 hitam dalam tema gelap). `.dialogSheet` lebar `min(640px, calc(100vw - 48px))`, latar `--field`, garis 1px `--rule` dengan garis atas 3px `--rule-heavy` sehingga ia terbaca sebagai lembar berkop, satu-satunya pemakai `--lift`. Di bawah 640px ia menjadi lembar layar penuh tanpa garis samping.

### Motion
Hanya satu gerakan yang diotori: `riseIn`, opasitas 0 ke 1 dengan `translateY(10px)` ke nol, `0.42s cubic-bezier(0.16, 1, 0.3, 1) both`. Transisi keadaan seragam pada `0.14s ease-out` dan hanya menyentuh warna, garis, dan bayangan. Gerak berulang hanya ada pada tiga tempat yang isinya memang gerak: titik merekam, spinner warisan dan skeleton, serta enam figur instruksi.

Blok `@media (prefers-reduced-motion: reduce)` global memangkas seluruh animasi dan transisi ke 0.01ms. Ini penting secara khusus di sini: getaran figur tremor sengaja diset pelan (`trembleShift`, 0.34s, pergeseran 1.5px, sekitar 3Hz) karena figur berkedip cepat yang ditunjukkan kepada orang yang sedang diskrining tremornya adalah pilihan yang keliru.

**The Motion Is Never Load-Bearing Rule.** Tidak ada yang bergantung pada animasi untuk bisa dibaca. `riseIn` berangkat dari keadaan yang sudah terlihat isinya, dan setiap keadaan tetap lengkap ketika seluruh gerak dimatikan.

## Do's and Don'ts

### Do:
- **Do** bangun hierarki dari bobot huruf, ukuran, dan garis. Kalau sebuah blok terasa kurang menonjol, naikkan bobotnya atau beri ia garis atas `--rule-heavy`.
- **Do** tulis status sebagai label teks penuh. "Selesai", "Sedang berjalan", "Risiko sedang", bukan tanda atau titik warna.
- **Do** pasangkan setiap angka dengan skalanya dan satuannya, dan rata kanan di kolom lewat `.num`.
- **Do** buka setiap halaman dengan `.docHead` berisi label arsip mono yang membawa informasi nyata.
- **Do** pakai `--touch` 44px sebagai lantai untuk semua yang bisa ditekan, dan `--touch-lg` 56px untuk aksi yang dilakukan dari jarak jauh atau oleh tangan yang tidak stabil.
- **Do** tulis nilai gelap di dua tempat sekaligus, `[data-theme='dark']` dan blok `prefers-color-scheme` yang dijaga `:root:not([data-theme='light'])`.
- **Do** batasi prosa ke sekitar 68ch dan pakai `--t-record` sebagai ukuran terkecil yang boleh ada.

### Don't:
- **Don't** tambahkan ikon, termasuk pustaka ikon, ikon font, glyph emoji sebagai penanda, atau menu hamburger. Satu-satunya tanda non-huruf yang sah adalah garis rule, batang aksen logo, dan enam figur instruksi.
- **Don't** pakai sudut membulat di atas 2px, bayangan di luar `--lift`, gradien, blur, atau efek kaca.
- **Don't** sampaikan keadaan hanya lewat warna. Setiap keadaan berwarna wajib membawa label teks plus perbedaan bentuk atau bobot.
- **Don't** pakai JetBrains Mono untuk prosa, judul, atau teks tombol. Ia untuk pengukuran, label arsip, dan data.
- **Don't** buat tombol utama berwarna vermilion dalam keadaan diam; aksi utama adalah bidang tinta.
- **Don't** tumpuk dua bidang tinta penuh dalam satu layar.
- **Don't** pakai nama token atau kelas dari lapisan migrasi di bawah pada kode baru.
- **Don't** tambahkan animasi berulang baru tanpa memastikan blok `prefers-reduced-motion` mematikannya, dan jangan pernah menampilkan gerak cepat berulang kepada pengguna yang sedang diskrining.

## Lapisan Migrasi dan Cakupan Konversi

Bagian ini bukan bagian dari sistem. Ia catatan keadaan, dan ia ada supaya perancah tidak keliru dibaca sebagai tata bahasa.

### Dua blok sementara di globals.css

`webapp/src/app/globals.css` memuat dua blok yang keduanya diberi kepala komentar "LAPISAN MIGRASI, SEMENTARA":

1. **Pemetaan nama token lama** (`--bg-primary`, `--bg-card`, `--text-primary`, `--brand`, `--green`, `--yellow`, `--red`, `--purple`, `--glass-bg`, `--chip-bg`, `--track-bg`, `--radius-sm` sampai `--radius-xl`, serta seluruh `--shadow-*` dan `--gradient-*` yang dipetakan ke `none`). Nama lama diarahkan ke nilai Basel supaya halaman yang belum digarap ulang tetap tampil utuh dan sewarna.
2. **Pemetaan kelas lama** (`.btn-primary`, `.btn-outline`, `.btn-danger`, `.btn-lg`, `.btn-sm`, `.badge` beserta varian warnanya, `.glass`, `.risk-*`, `.btnSpinner`, `.skeleton`, `.animate-fadeInUp`, dan keyframes `spin` serta `shimmer`).

Keduanya adalah perancah. Kode baru tidak boleh menyentuhnya. Blok-blok ini dihapus begitu pemakai terakhirnya hilang.

### Sudah dikonversi ke Basel

Surface: `/` (`app/page.tsx` + `landing.module.css`), `/dashboard`, `/screening`, `/login` dan `/register` (keduanya memakai `login/auth.module.css`), `/demo`.
Komponen: `AppNav`, `Logo`, `CameraView`, `ScreeningInstruction`, `PreScreeningQuestionnaire`, `lib/theme.module.css`, `lib/i18n.module.css`.

### Belum dikonversi, masih berjalan di atas perancah

Rute: `/riwayat`, `/edukasi`, `/bantuan`, `/profil`, dan empat rute dokter (`/doctor`, `/doctor/edukasi`, `/doctor/bantuan`, `/doctor/profil`, berbagi `app/doctor/doctor.module.css`).
Komponen: `DoctorNav`, `ReportTemplate`, `ReportPrintHost`, `LiveChat`, `GeoBreakdown`, `LocationFields`.
Dan `webapp/src/components/icons.tsx`, yang masih diimpor oleh `bantuan`, `edukasi`, `profil`, `riwayat`, `doctor/page.tsx`, dan `doctor/edukasi/page.tsx`. Selama berkas itu masih punya pemakai, aturan nol ikon belum berlaku menyeluruh di aplikasi ini. Itu fakta, bukan pengecualian yang direstui.

### Ketidakkonsistenan yang tercatat di kode saat ini

- `webapp/src/components/DoctorNav.tsx` memakai `AppNav.module.css` yang sudah dikonversi, tetapi masih merujuk `styles.brandText` dan `styles.brandSuffix` yang sudah tidak ada di berkas itu. Dua span itu kini tampil tanpa gaya sama sekali.
- `webapp/src/app/page.module.css` tidak diimpor berkas mana pun; landing memakai `landing.module.css`. Ia sisa yang belum dihapus dan masih memuat nama token lama.
- Nilai tema gelap ditulis dua kali di `globals.css`, di `[data-theme='dark']` dan di dalam blok `prefers-color-scheme`. Keduanya identik hari ini, dan tidak ada mekanisme yang menjaga keduanya tetap sama.
- Titik henti responsif tidak diseragamkan menjadi satu skala; setiap surface memakai ambangnya sendiri.
