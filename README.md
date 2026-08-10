# NeuronMotion — Sistem Skrining Gangguan Saraf Berbasis Computer Vision

Mockup UI (desain) sudah ada di project ini:
- `NeuronMotion - Landing.dc.html` — halaman publik
- `NeuronMotion - Skrining.dc.html` — alur skrining (pilih tes → rekam → hasil biomarker → skor risiko → riwayat)

Dokumen ini adalah panduan membangun **sistem produksi**-nya secara penuh.

## 1. Ringkasan Sistem

Web app yang mendeteksi body keypoints dari kamera standar (webcam/HP), mengekstrak biomarker gerakan (tremor, finger tapping, gait, arm swing, range of motion, postural stability), mengubahnya menjadi skor risiko neurologis berbasis rule/ML, dan menyimpan riwayat untuk trend monitoring & portal nakes.

**Tujuan**: screening tool non-invasif, low-cost, accessible, yang mempercepat deteksi dini dan follow-up pemulihan pasien di daerah keterbatasan akses neurolog.

## 2. Arsitektur

```
┌─────────────┐     video frame      ┌───────────────────┐
│   Browser    │ ───────────────────▶ │  Pose/Hand Model   │  (client-side, WASM/WebGL)
│ (kamera user)│ ◀─────────────────── │  MediaPipe/TF.js   │
└─────┬───────┘   keypoints (x,y,z)   └─────────┬──────────┘
      │                                          │
      │ keypoint sequence (JSON)                 │
      ▼                                          ▼
┌─────────────────────┐            ┌─────────────────────────┐
│ Biomarker Extraction │            │ Feature Engineering       │
│ (frontend/edge, JS)  │───────────▶│ tremor freq, tap rate,     │
└─────────┬────────────┘            │ stride symmetry, ROM, sway│
          │                          └────────────┬────────────┘
          ▼                                       ▼
   ┌────────────────────┐              ┌────────────────────┐
   │  API Backend         │◀────────────│  Risk Scoring Model │
   │  (FastAPI/Node)      │             │  (rule-based +/or ML)│
   └─────────┬────────────┘             └────────────────────┘
             │
     ┌───────┼────────────┐
     ▼       ▼            ▼
   Auth DB  Sesi/Riwayat  Laporan Nakes
  (Postgres) (Postgres/S3) (PDF/Dashboard)
```

**Prinsip kunci:** deteksi keypoint & ekstraksi biomarker berjalan **di sisi klien** (browser, via WASM/WebGL) demi privasi (video tidak perlu diunggah) dan latensi rendah, terutama penting di daerah dengan koneksi internet terbatas.

## 3. Modul & Requirement Mapping

### 3.1 Deteksi Keypoint & Ekstraksi Biomarker (req #1)
- **Model**: MediaPipe Pose (33 landmark tubuh) + MediaPipe Hands (21 landmark/tangan), berjalan via `@mediapipe/tasks-vision` (WASM, client-side, gratis, tanpa server GPU).
- **Kamera**: `getUserMedia()` di browser, target 30fps, resolusi 640×480 cukup untuk landmark.
- **Ekstraksi biomarker** (contoh formula, per file `biomarkers/*.ts`):
  - *Tremor*: FFT pada posisi pergelangan tangan saat diam → dominant frequency (Hz) + amplitude.
  - *Finger tapping*: jarak ibu jari–telunjuk dari waktu ke waktu → deteksi puncak (peak counting) → tap rate & decrement (kelelahan gerak).
  - *Gait*: jarak antar pergelangan kaki dari waktu ke waktu → cadence, stride length (perlu kalibrasi jarak kamera), symmetry index.
  - *Arm swing*: sudut bahu-siku-pergelangan selama siklus jalan → amplitudo per sisi → asymmetry %.
  - *Range of motion*: sudut maksimum antar 3 landmark sendi (bahu/siku/lutut) selama gerakan terarah.
  - *Postural stability*: center-of-mass sway (dari pinggul/bahu) selama berdiri diam → sway path length / area.
- **Kalibrasi jarak**: opsional, minta user berdiri sejauh lengan terentang dari kamera, atau gunakan tinggi badan sebagai referensi skala.

### 3.2 Website Publik Tanpa Instalasi (req #2)
- **Frontend**: React/Next.js (atau lanjutan dari mockup DC ini), PWA-ready (installable tapi tetap jalan langsung di browser, offline-capable untuk model inference).
- **Kompatibilitas rendah-resource**: lazy-load model (~5-10MB), fallback resolusi kamera lebih rendah, mode "unduh dulu lalu proses offline" untuk koneksi lambat, UI multi-bahasa (mulai Bahasa Indonesia).
- **Hosting**: static frontend (Vercel/Netlify/CDN) + backend API terpisah, agar beban server minimal.

### 3.3 Model Analitik Skor Risiko (req #3)
- **Tahap awal (rule-based)**: threshold per biomarker berbasis literatur klinis (mis. tremor >4Hz "berisiko"), dikombinasikan jadi skor komposit (weighted sum atau skor tertimbang per kondisi target: Parkinson, stroke, cerebellar disorder, etc.).
- **Tahap lanjut (ML)**: model klasifikasi (Random Forest/XGBoost) dilatih pada data biomarker berlabel (bekerja sama dengan RS/klinik untuk dataset), output kategori Rendah/Sedang/Tinggi + confidence score.
- **Rekomendasi tindak lanjut**: mapping rule dari kombinasi biomarker → teks rekomendasi (rujukan spesialis saraf, link ke panduan latihan rehabilitasi per biomarker bermasalah).
- **Validasi klinis**: WAJIB sebelum diklaim sebagai alat skrining — lakukan uji sensitivitas/spesifisitas dengan tenaga medis mitra sebelum go-live publik. Sertakan disclaimer "bukan alat diagnosis, hanya screening awal".

### 3.4 Riwayat Pemeriksaan (req #4)
- **Data model**: `User`, `Session` (timestamp, biomarker raw values, risk score, recommendation), `Note` (opsional dari nakes).
- **Fitur**: grafik tren skor per waktu, tabel riwayat, perbandingan antar sesi (delta biomarker) — sudah dimockup di step 5 halaman skrining.
- **Reminder**: notifikasi email/WA untuk jadwal skrining berkala (pasien rehab/Parkinson).

### 3.5 Edukasi Tidak Langsung (req #5)
- Setiap hasil biomarker disertai penjelasan singkat ("apa artinya", rentang normal, sumber referensi) — transparansi mendorong awareness tanpa perlu halaman edukasi terpisah.
- Konten statis edukasi (gejala awal Parkinson/stroke) sebagai bagian dari landing page (sudah ada).

### 3.6 Portal Tenaga Kesehatan (req #6)
- **Role-based access**: akun nakes terverifikasi (lisensi/STR) dengan akses ke pasien yang menghubungkan akun mereka (consent-based).
- **Dashboard**: daftar pasien + status risiko, laporan detail per pasien dengan grafik parameter gerakan multi-sesi (sudah dimockup), export PDF laporan untuk rekam medis.
- **Audit log**: siapa mengakses data pasien kapan (kepatuhan privasi data kesehatan).

## 4. Stack Rekomendasi

| Layer | Pilihan |
|---|---|
| Computer vision | MediaPipe Tasks Vision (Pose + Hands), TensorFlow.js sebagai alternatif |
| Frontend | Next.js/React + TypeScript, Tailwind atau design system existing |
| Backend API | FastAPI (Python, cocok utk model ML) atau Node/NestJS |
| Database | PostgreSQL (data terstruktur pasien/sesi) |
| File/asset storage | S3-compatible (jika menyimpan snapshot/video opsional) |
| Model ML skor risiko | scikit-learn/XGBoost, disajikan via backend API |
| Auth | OAuth/JWT, role: pasien vs nakes |
| Deployment | Docker Compose → cloud (mis. GCP/AWS), CDN untuk frontend statis |

## 5. Privasi & Keamanan (kritis untuk data kesehatan)

- Proses video **di perangkat pengguna**; jangan unggah video mentah ke server kecuali user memberi consent eksplisit (mis. untuk review dokter).
- Enkripsi data biomarker & skor saat transit (TLS) dan at rest.
- Kepatuhan regulasi data kesehatan lokal (mis. UU PDP Indonesia) — consent form eksplisit, hak hapus data.
- Akses nakes ke data pasien harus berbasis consent/relasi resmi (bukan akses bebas semua pasien).

## 6. Roadmap Bertahap

1. **MVP**: deteksi pose client-side + 2 biomarker (tremor, finger tapping) + skor rule-based sederhana + riwayat lokal (tanpa backend/login).
2. **V1**: tambah 4 biomarker lain, backend + akun pengguna, riwayat tersimpan di cloud.
3. **V2**: portal nakes, model ML skor risiko, validasi klinis bersama mitra medis.
4. **V3**: multi-bahasa, mode offline/low-bandwidth, notifikasi jadwal, integrasi rujukan ke faskes terdekat.

## 7. Referensi Desain

Lihat `NeuronMotion - Landing.dc.html` dan `NeuronMotion - Skrining.dc.html` di project ini untuk alur UX dan tampilan yang menjadi acuan implementasi frontend.

---

## 🚀 Last Dance Teams

**Project Lead:** Muhammad Akhza Fachrozy (@akhzaozy)

Proyek **NeuronMotion** adalah inisiatif dari **Last Dance Teams** yang berdedikasi untuk menghadirkan solusi inovatif di bidang kesehatan neurologis. Tim kami percaya bahwa teknologi computer vision dan machine learning dapat membuat skrining gangguan saraf lebih mudah diakses oleh masyarakat luas, terutama di daerah-daerah dengan keterbatasan akses ke tenaga medis spesialis.

**Misi kami:** Terus berinovasi untuk kesehatan yang lebih baik! 🎯

---

**Created by Last Dance Team** — Terus berinovasi untuk kesehatan yang lebih baik! 🚀
