---
name: NeuronMotion
description: Ruang Periksa Terang, sistem visual biru medis untuk skrining gerak berbasis kamera.
colors:
  sheet: "#eef4f8"
  field: "#ffffff"
  margin-ground: "#e2edf3"
  inset: "#dbe9f0"
  ink: "#12313d"
  ink-secondary: "#38596a"
  ink-muted: "#4d6b78"
  accent: "#1d6d86"
  accent-deep: "#145266"
  accent-soft: "#8ebfd2"
  accent-soft-deep: "#6ba7be"
  accent-wash: "#dcecf3"
  cta-field: "#1d6d86"
  cta-ink: "#ffffff"
  rule-hair: "rgba(18, 49, 61, 0.10)"
  rule: "rgba(18, 49, 61, 0.20)"
  rule-heavy: "rgba(18, 49, 61, 0.42)"
  level-low: "#1f7a55"
  level-low-wash: "#dff2e9"
  level-mid: "#9a6410"
  level-mid-wash: "#fbeed6"
  level-high: "#b83f2f"
  level-high-wash: "#fbe4e0"
typography:
  display:
    fontFamily: "Gabarito, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Gabarito, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  head:
    fontFamily: "Gabarito, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  record:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  radius: "12px"
  radius-lg: "24px"
  radius-xl: "32px"
  radius-pill: "999px"
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
  s10: "128px"
  touch: "44px"
  touch-lg: "56px"
components:
  btn:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-pill}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-hover:
    borderColor: "{colors.accent}"
    textColor: "{colors.accent}"
  btn-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.radius-pill}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "#ffffff"
  btn-danger:
    backgroundColor: "{colors.field}"
    textColor: "{colors.level-high}"
    rounded: "{rounded.radius-pill}"
    padding: "12px 24px"
    height: "{spacing.touch}"
  btn-lg:
    typography: "{typography.lead}"
    padding: "16px 48px"
    height: "{spacing.touch-lg}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
    height: "{spacing.touch}"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-lg}"
    padding: "32px"
  level-low:
    backgroundColor: "{colors.level-low-wash}"
    textColor: "{colors.level-low}"
    typography: "{typography.record}"
    rounded: "{rounded.radius-pill}"
    padding: "8px 16px"
  level-mid:
    backgroundColor: "{colors.level-mid-wash}"
    textColor: "{colors.level-mid}"
    typography: "{typography.record}"
    rounded: "{rounded.radius-pill}"
    padding: "8px 16px"
  level-high:
    backgroundColor: "{colors.level-high-wash}"
    textColor: "{colors.level-high}"
    typography: "{typography.record}"
    rounded: "{rounded.radius-pill}"
    padding: "8px 16px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-pill}"
    padding: "0 16px"
    height: "{spacing.touch}"
  dialog:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-xl}"
    padding: "48px"
    width: "min(640px, calc(100vw - 48px))"
---

# Design System: NeuronMotion

## Overview

**Creative North Star: "Ruang Periksa Terang"**

Dunia ini menggantikan Lembar Klinis Basel, dan penggantiannya diminta secara
eksplisit oleh tim: subtema karyanya kesehatan, sedangkan Basel terbaca sebagai
arsip cetak, dengan warna kertas kelabu, aksen vermilion, sudut tajam, dan judul
yang diset serapat mungkin. Keluhan yang disampaikan tepat sasaran. Produk ini
dipakai orang yang sedang khawatir tentang tubuhnya sendiri, di rumah, sering
sendirian, dan yang dibutuhkannya bukan lemari arsip melainkan ruang periksa
yang terang dan tenang.

Arahnya dipin oleh gambar rujukan yang dibawa tim, sebuah landing page rumah
sakit: biru medis lembut, kartu membulat, banyak napas, foto orang sungguhan.
Karena arah yang dipin mengalahkan segalanya, tidak ada turnamen konsep yang
dijalankan untuk dunia ini.

Yang **tidak** ikut disalin dari rujukan itu adalah susunan isinya. Rujukan
membuka dengan potret dokter dan sebaris angka bangga: 4500+ pasien, 200 kamar,
2500+ dokter daring, tombol Book Appointment, dan grid departemen. NeuronMotion
tidak punya satu pun dari itu. Mengarang angka klinis adalah hal yang paling
cepat dibongkar penilai, dan `PRODUCT.md` melarangnya. Maka posisi komposisi
yang biasanya diisi angka bangga diisi mekanismenya sendiri.

Tiga aturan mengikat, dan seluruh dokumen ini tunduk padanya:

1. **Biru adalah bidang, bukan aksen.** Warna merek menempati wilayah utuh: pita
   cara kerja selebar layar, kartu penutup, bidang organik di belakang foto
   hero. Ia tidak dipercik sebagai garis dan titik di atas ground netral.
2. **Permukaan melayang, bukan garis membagi.** Blok dipisahkan kartu putih
   membulat dengan bayangan lembut ber-offset. Garis rambut hanya untuk pemisah
   di dalam satu kartu.
3. **Angka tetap materi utama.** Ini satu-satunya aturan yang diwarisi utuh dari
   dunia sebelumnya, dan ia yang menjaga halaman tetap terbaca sebagai alat ukur
   alih-alih brosur rumah sakit. Tabular, rata kanan pada kolom, satuan selalu
   ikut.

Kontrak arahnya dicetak ke markup produksi sebagai komentar HTML lewat konstanta
`DIRECTION_CONTRACT` di `webapp/src/app/layout.tsx`, supaya keputusan visualnya
bisa diaudit dari halaman jadi, bukan hanya dari repo.

**Key Characteristics:**
- Ground biru sangat pucat (`#eef4f8`) dan tinta biru tua (`#12313d`), bukan
  putih layar dan hitam.
- Dua biru dengan tugas berbeda: `--accent` pekat untuk teks dan tombol,
  `--accent-soft` bubuk untuk mengisi bidang besar.
- Kartu membulat 24px dengan bayangan ber-offset, tombol berbentuk pil penuh.
- Ikon dipakai, dari lucide-react, satu ketebalan garis 1.75 di seluruh halaman.
- Tanda tangan visualnya jejak tremor sungguhan, digambar tiga kali di halaman
  depan dengan tiga peran berbeda.
- Lantai ukuran huruf 14px dan lantai sasaran sentuh 44px, tanpa perkecualian.

## Colors

Semua token didefinisikan di `webapp/src/app/globals.css`. Mode gelap punya dua
jalur yang nilainya identik: `[data-theme='dark']` untuk pilihan eksplisit
pengguna, dan blok `@media (prefers-color-scheme: dark)` yang dijaga selektor
`:root:not([data-theme='light'])` supaya setelan sistem berlaku ketika pengguna
belum memilih apa pun, tetapi tidak pernah menimpa pilihan terang yang eksplisit.
Nilai gelap ditulis dua kali; keduanya harus diubah bersamaan.

### Primary
- **Biru medis** (`--accent`, terang `#1d6d86`, gelap `#6ec4dd`): warna aksi.
  Tombol utama, tautan, ikon di dalam kotak wash, kata terakhir judul hero,
  label arsip, cincin fokus.
- **Biru dalam** (`--accent-deep`, terang `#145266`, gelap `#9adcef`): hover
  tombol utama.
- **Biru bubuk** (`--accent-soft`, terang `#8ebfd2`, gelap `#2f647c`): mengisi
  bidang utuh, yaitu pita cara kerja dan bentuk organik di belakang foto hero.
- **Cuci biru** (`--accent-wash`): latar kotak ikon, chip, dan cincin fokus
  isian.

### Neutral
- **Langit** (`--sheet`, terang `#eef4f8`, gelap `#0d1c23`): ground halaman.
- **Permukaan** (`--field`, terang `#ffffff`, gelap `#162b34`): kartu.
- **Ground margin** dan **inset**: bidang tenang, chip durasi, isian.
- **Tinta** (`--ink`), **sekunder**, **redup**: tiga tingkat teks, semuanya biru
  tua dan bukan abu netral, sehingga teks duduk dalam keluarga warna yang sama
  dengan bidang mereknya alih-alih menabraknya.

### Bidang ajakan
`--cta-field` dan `--cta-ink` adalah pasangan token tersendiri untuk bidang biru
penuh yang membawa teks di atasnya: kartu penutup dan tautan lewati-ke-isi.

**The CTA Field Is Not The Accent Rule.** Bidang ajakan tidak boleh memakai
`--accent` langsung. Alasannya terukur: `--accent` dibalik terangnya di tema
gelap menjadi `#6ec4dd`, dan teks putih di atasnya hanya 1,98:1. `--cta-field`
justru tetap gelap di tema gelap (`#12455a`), sehingga pasangan bidang dan teks
lolos ambang kontras di kedua tema. Aturan ini lahir dari kegagalan kontras yang
benar-benar terjadi pada bangunan ini dan tertangkap saat audit.

### Tingkat pengukuran
Rendah `#1f7a55`, sedang `#9a6410`, tinggi `#b83f2f`, masing-masing dengan
pasangan `-wash`. Nilai gelap dinaikkan terangnya.

### Named Rules

**The Never Colour Alone Rule.** Warna tidak pernah jadi penanda tunggal. Setiap
keadaan berwarna wajib membawa label teks penuh dan perbedaan bentuk atau bobot.
Uji: matikan seluruh warna; jika keadaannya masih terbaca, lolos. Chip tingkat
risiko mematuhi ini lewat tiga penanda sekaligus, lihat bagian Components.

## Typography

**Display:** Gabarito (fallback Hanken Grotesk lalu `system-ui`), variabel 400
sampai 900, satu berkas 34 kB.
**Body:** Hanken Grotesk (fallback `system-ui`), variabel 300 sampai 800, 34 kB.
**Mono:** JetBrains Mono, variabel 400 sampai 500, 31 kB.

Ketiganya dipasang lewat `next/font/local` di `webapp/src/app/layout.tsx`,
berkasnya di `webapp/src/app/fonts/`, dengan `display: 'swap'` dan variabel CSS
`--font-display`, `--font-sans`, `--font-mono`. Tidak ada permintaan ke Google
Fonts saat halaman dibuka.

**Character:** Plus Jakarta Sans dilepas karena keluhan tim bahwa tipografinya
kaku. Sebagian keluhan itu sebenarnya tertuju pada cara pakainya, bukan pada
hurufnya: judul Basel diset bobot 800 dengan tracking -0.03em sampai -0.04em dan
`line-height` 0.92, dan ketegangan itu memang disengaja oleh sistem dokumen.
Dunia ini melonggarkan keduanya, ke bobot 700 dan tracking -0.015em sampai
-0.02em, lalu mengganti hurufnya juga. Gabarito dipilih untuk judul karena
terminalnya membulat dan perutnya lebar, sehingga judul tetap tegas tanpa
terbaca mengepal. Hanken Grotesk dipilih untuk isi karena tinggi-x-nya besar dan
bukaannya lebar, yang berarti a, e, dan s tidak menutup pada ukuran kecil atau
jarak baca jauh. Untuk produk yang penggunanya lansia, itu bukan urusan selera.

### Hierarchy
- **Judul hero**: `clamp(2.5rem, 6vw, 4.5rem)`, bobot 700, `line-height` 1.08.
- **`--t-title`** (2.25rem): `h1`, judul halaman.
- **`--t-head`** (1.5rem): `h2`, judul kartu, judul dialog.
- **`--t-lead`** (1.125rem): `h3`, paragraf pembuka, teks tombol besar.
- **`--t-body`** (1rem): isi. `line-height` 1.6 di `body`.
- **`--t-record`** (0.875rem): label kolom, catatan kaki, chip.

Prosa dibatasi 68ch lewat pemilih `p` global; lead hero 52ch, catatan 78ch.

### Named Rules

**The 14px Floor Rule.** Tidak ada teks di bawah `--t-record` (14px), tanpa
perkecualian, karena pengguna utama produk ini lansia yang membaca dari jarak
jauh. Aturan ini punya satu jebakan yang sudah pernah dilanggar: satuan pada
panel bacaan diset `0.7em` relatif terhadap angkanya, dan di layar 390px angka
itu turun ke 18px sehingga satuannya jadi 12,6px. Perbaikannya `max(0.7em,
var(--t-record))`. Ukuran relatif apa pun di bawah `--t-body` wajib punya lantai
serupa.

**The Mono Is Data Rule.** JetBrains Mono hanya untuk pengukuran, label arsip,
dan data: `.label`, `.docHead__meta`, `th` pada `.dataTable`, nilai bacaan,
chip durasi, pengalih tema dan bahasa. Ia tidak pernah jadi kostum "teknis"
untuk prosa, judul, atau teks tombol.

**The Row Name Is Prose Rule.** Nama tes di dalam `.dataTable` adalah prosa dan
harus tampil huruf biasa berkapitalisasi kalimat, meski ia berada di dalam `th`.
Aturan `.dataTable th` yang membuat kepala tabel jadi mono huruf besar punya
kekhususan 0,1,1, jadi kelas penimpanya ditulis dua kali (`.rowName.rowName`)
untuk mencapai 0,2,0. Tanpa itu, nama tes muncul sebagai TREMOR dan KETUKAN JARI
dalam monospace, yang persis melanggar aturan di atas.

## Layout

Kolom isi adalah primitif `.sheet`: `max-width` 1180px, terpusat, padding samping
`--s5` yang turun ke `--s4` di bawah 640px.

Irama ruang adalah satu skala kelipatan 4, `--s1` 4px sampai `--s10` 128px.
Padding kartu `--s6`, jarak antar bagian `--s9`, napas hero `--s9`.

Grid halaman depan:
- **Hero** `minmax(0, 1fr) minmax(0, 0.92fr)`, runtuh di bawah 900px.
- **Jaminan dan langkah**: tiga kolom sama lebar, runtuh di bawah 860px.
- **Bukti** `minmax(0, 1.15fr) minmax(0, 0.85fr)`; kolom kanan lebih sempit
  karena isinya hanya empat pil nama kondisi.
- **Kartu penutup** `minmax(0, 0.8fr) minmax(0, 1fr)`, foto kiri teks kanan,
  runtuh di bawah 860px.

Lantai sasaran sentuh `--touch` 44px berlaku pada **kedua sumbu**, bukan tinggi
saja. Ini pernah dilanggar oleh pengalih bahasa, yang tingginya 44px tetapi
lebarnya 42px karena labelnya hanya dua huruf; perbaikannya `min-width`.
`--touch-lg` 56px untuk aksi yang ditekan dari jarak jauh atau oleh tangan yang
tidak stabil.

### Named Rules

**The Sticky Header Must Fit Rule.** Kop halaman adalah baris flex tanpa wrap,
jadi ketika isinya melebihi lebar layar yang terjadi bukan tata letak yang
menyempit melainkan isi yang terpotong diam-diam. Diukur pada 390px, kop menuntut
459px. Yang dilepas di bawah 560px adalah dua tombol akun, bukan pengalih bahasa
dan tema, karena kedua tombol akun punya duplikat di hero dan di blok penutup
sedangkan kedua pengalih tidak punya duplikat di mana pun.

**The Overlap Is A Wide-Screen Move Rule.** Kartu pengukuran yang melayang
menimpa foto hero hanya berlaku di atas 900px. Diukur pada 390px, fotonya 269px
sedangkan kartunya 346px, sehingga kartu yang melayang bukan menimpa sebagian
foto melainkan menghapusnya. Di kolom sempit kartu turun ke bawah foto
(`position: static`).

## Elevation & Depth

Kedalaman dibawa bayangan lembut, bukan garis. Seluruh bayangan berwarna tinta
encer, bukan hitam netral, dan semuanya punya offset ke bawah beserta blur;
cahaya datang dari atas.

- **`--shadow-card`**: kartu biasa, bidang jaminan, tabel.
- **`--shadow-raised`**: kartu yang benar-benar melayang, yaitu panel hero, tiga
  kartu langkah di atas pita biru, dan kartu penutup.
- **`--lift`**: hanya dialog.

**The Shadow Has An Offset Rule.** Tidak ada bayangan ber-offset nol. Lingkaran
cahaya berwarna tanpa offset adalah dekorasi, bukan sistem kedalaman.

## Shapes

- `--radius` 12px: isian, kotak ikon langkah.
- `--radius-lg` 24px: kartu, tabel, foto penutup.
- `--radius-xl` 32px: panel hero, foto hero, kartu penutup, dialog.
- `--radius-pill`: seluruh tombol, chip, pil kondisi, pengalih, kotak ikon bulat.

Satu bentuk organik ada di halaman depan, yaitu `.heroBlob`
(`border-radius: 58% 42% 46% 54% / 52% 48% 52% 48%`). Ia satu-satunya bentuk
dekoratif murni di seluruh sistem, `aria-hidden`, dan ia ada karena bidang warna
utuh di belakang subjek adalah gerakan komposisi yang paling dikenali dari
rujukan tim. Ia melebihi lebar viewport secara sengaja dan dipotong oleh
`overflow-x: clip` pada `.page`; itulah satu-satunya elemen yang boleh muncul
pada pemeriksaan luber mendatar.

## Components

### Buttons
Pil penuh, tinggi minimum 44px, bobot 600. Dasar berlatar `--field` dengan garis
`--rule`; hover menaikkan garis dan teks ke `--accent`. Utama adalah bidang
`--accent` penuh dengan teks putih dan bayangan berwarna biru. Di tema gelap
teksnya `#06222c`, bukan putih. Bahaya hanya garis dan teks `--level-high`,
tidak pernah bidang merah penuh. Besar (`.btn--lg`) 56px dengan padding
`16px 48px`.

Di dalam `.closingCard` tombol dibalik: yang utama menjadi bidang `--cta-ink`
penuh dengan teks `--cta-field`.

### Data Table
Komponen tanda tangan yang diwarisi utuh dari dunia sebelumnya, kini duduk di
dalam kartu putih (`.tableCard`). Kepala kolom mono huruf besar `--t-record`
dengan garis bawah `--rule`; baris data dipisah `--rule-hair`; baris terakhir
tanpa garis. Kelas `.num` membuat kolom angka rata kanan.

Di halaman depan setiap baris membawa ikon lucide di dalam kotak bulat
`--accent-wash`, dan durasi tampil sebagai chip mono, bukan angka telanjang.

**The Table Drops Columns, Never Scrolls Rule.** Di bawah 640px kolom durasi
dilepas dari tata letak dan tabel beralih ke `table-layout: fixed` dengan kolom
nama 36%. Tabelnya tidak digulir mendatar: pengguna produk ini bisa punya tremor
atau gerak jari yang terbatas, dan menggeser tabel dengan satu jari adalah
gerakan presisi yang justru sedang diukur. Perlu dicatat bahwa pada
`table-layout: fixed`, lebar kolom diambil dari baris kepala, bukan dari sel mana
pun di badan tabel.

### Chip Tingkat Risiko
`.level` plus `.level--low`, `.level--mid`, atau `.level--high`. Bentuknya pil,
tetapi tiga penandanya utuh: label teks penuh, bobot garis kiri yang berbeda
(2px, 4px, 6px), dan warna. Chip tidak pernah dipakai tanpa angka yang
menyertainya.

### Jejak Tremor
Tanda tangan visual sistem ini, dan satu-satunya bukti di halaman depan yang
tidak bisa disalin pesaing dengan menempel kalimat. Datanya di
`webapp/src/data/tremorTrace.ts`, dan medan `kind` padanya yang memilih apakah
keterangannya menyebut rekaman sungguhan atau contoh pola, sehingga pola buatan
tidak pernah bisa mengaku sebagai pengukuran seseorang.

Dua komponen memakainya dengan peran berbeda:
- **`TremorPlate`** menyajikannya sebagai data: sinyal mentah, garis nol, warna
  `--accent`, menggambar dirinya dari kiri ke kanan lalu mengulang.
- **`TraceWave`** meminjam bentuknya sebagai dekorasi di dasar pita biru dan di
  dalam kartu penutup. Kurvanya diratakan dengan rerata bergerak berjendela 18
  sampel. Angka itu bukan selera: cuplikannya tiap 25 ms, jadi satu siklus 5 Hz
  memakan sekitar delapan sampel, dan jendela yang lebih pendek dari dua siklus
  meloloskan getarannya sehingga pada lebar layar penuh hasilnya terbaca sebagai
  sisir berduri, bukan gelombang. Komponen ini `aria-hidden` dan tidak pernah
  membawa angka.

### Icons
lucide-react, ketebalan garis **1.75** di seluruh halaman, ukuran 16 sampai 24px.
Ikon selalu `aria-hidden` dan selalu ditemani teks; tidak ada ikon yang berdiri
sendiri sebagai satu-satunya penanda makna. Ikon per tes dipetakan dari tipe tes,
bukan dari urutan baris, supaya penambahan tes di `TEST_SEQUENCE` tidak diam-diam
menggeser ikon seluruh tabel.

### Focus
Satu perlakuan: `:focus-visible { outline: 3px solid var(--accent);
outline-offset: 3px }`. Isian punya perlakuannya sendiri, yaitu garis `--accent`
plus cincin `0 0 0 4px var(--accent-wash)`.

### Motion
Satu gerakan yang diotori: `riseIn`, opasitas 0 ke 1 dengan `translateY(12px)` ke
nol, `0.48s cubic-bezier(0.16, 1, 0.3, 1)`. Halaman depan memakai pola yang sama
lewat `useReveal`, dengan jeda bertingkat pada baris tabel. Transisi keadaan
seragam `0.18s ease-out`.

Blok `@media (prefers-reduced-motion: reduce)` global memangkas seluruh animasi
ke 0.01ms, dan `useCountUp` memeriksanya sendiri karena hitungan angkanya
berjalan di JavaScript dan tidak tersentuh blok CSS itu.

**The Motion Is Never Load-Bearing Rule.** Keadaan diam adalah keadaan terlihat.
Tanpa JavaScript sekalipun seluruh isi tetap terbaca.

## Do's and Don'ts

### Do:
- **Do** biarkan biru mengisi wilayah utuh. Kalau sebuah bagian terasa datar,
  beri ia bidang `--accent-soft` selebar layar, bukan garis aksen.
- **Do** pakai kartu putih membulat dengan `--shadow-card` untuk memisahkan blok.
- **Do** pasangkan setiap angka dengan satuannya, dan rata kanan di kolom lewat
  `.num`.
- **Do** pakai `--cta-field` dan `--cta-ink` untuk setiap bidang berwarna yang
  membawa teks.
- **Do** beri lantai `--t-record` pada setiap ukuran huruf relatif.
- **Do** tulis nilai gelap di dua tempat sekaligus, `[data-theme='dark']` dan
  blok `prefers-color-scheme` yang dijaga `:root:not([data-theme='light'])`.
- **Do** tulis `:global(.dataTable)` ketika merujuk kelas globals.css dari dalam
  berkas modul; nama kelas polos di sana ikut di-hash dan aturannya diam-diam
  tidak pernah berlaku.

### Don't:
- **Don't** tambahkan angka pemasaran yang produk ini tidak punya: jumlah
  pengguna, jumlah mitra, testimoni, sensitivitas dan spesifisitas klinis,
  persetujuan regulator. `PRODUCT.md` melarangnya dan halaman depan sudah
  dibangun untuk tidak membutuhkannya.
- **Don't** pakai `--accent` sebagai latar bidang yang membawa teks di atasnya.
- **Don't** sampaikan keadaan hanya lewat warna.
- **Don't** pakai JetBrains Mono untuk prosa, judul, atau teks tombol.
- **Don't** biarkan tabel menggulir mendatar di ponsel; lepas kolomnya.
- **Don't** pakai bayangan ber-offset nol, gradien teks, atau kaca sebagai
  hiasan.
- **Don't** tumpuk dua bidang biru penuh dalam satu layar.

## Keadaan Konversi

Halaman depan (`app/page.tsx` + `landing.module.css`) dibangun ulang penuh di
dunia ini, bersama `globals.css`, `layout.tsx`, `Logo.module.css`,
`TremorPlate.module.css`, `lib/theme.module.css`, dan `lib/i18n.module.css`.

Rute lain, yaitu `/screening`, `/dashboard`, `/login`, `/register`, `/demo`,
`/riwayat`, `/edukasi`, `/bantuan`, `/profil`, dan empat rute dokter, **ikut
berubah warna dan bentuk** karena seluruh nama token dan nama kelas
dipertahankan persis dari dunia sebelumnya. Semuanya sudah diperiksa dan
menjawab 200. Tetapi mereka belum **dikomposisi ulang**: susunannya masih
susunan yang dirancang untuk lembar dokumen, jadi mereka sewarna dengan dunia
ini tanpa benar-benar memanfaatkannya. Itu keadaan yang tercatat, bukan
pengecualian yang direstui.

## Aset

Lisensi dan asal-usul seluruh gambar dicatat di
`webapp/src/assets/CREDITS.md`. Kedua foto berlisensi CC0 dari StockSnap.io.
