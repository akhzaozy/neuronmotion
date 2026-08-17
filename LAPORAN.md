# Laporan Sistem Connected Safety Infrastructure

## 1. Ringkasan Sistem

`connected-safety-infrastruktur` adalah platform pemantauan keselamatan tambang real-time yang menggabungkan:
- AI Vision untuk mendeteksi kelengkapan APD dan perilaku berisiko di kabin,
- backend server untuk ingest event dan menyinkronkan data,
- frontend web dashboard untuk pemantauan dan visualisasi.

Tujuan utama sistem ini adalah:
- memantau operasi tambang secara real-time,
- memberikan alert keselamatan dini,
- menampilkan statistik zona, kejadian, dan akses secara interaktif.

## 2. Arsitektur Sistem

Sistem terdiri dari tiga komponen utama:

1. **Frontend Web App**
   - Berada di `src/`
   - Dibangun menggunakan React, Vite, dan Mantine UI.
   - Menyajikan dashboard command center, monitoring zona, event, KPI, dan terminal AI Vision.

2. **Backend Server**
   - Berada di `server/`.
   - Menggunakan Node.js, Express, dan ws.
   - Berfungsi sebagai REST API dan WebSocket server untuk ingest data dan distribusi event real-time.

3. **Edge AI Vision Node**
   - Berada di `main.py`.
   - Menggunakan Python, Flask, OpenCV, YOLOv8, MediaPipe.
   - Memproses video kabin secara lokal untuk mendeteksi APD dan perilaku pengemudi.

## 3. Alur Sistem End-to-End

### 3.1 Pengambilan Data Lapangan

- Kamera kabin atau webcam menangkap frame video.
- Edge node memproses frame tersebut.

### 3.2 Inference AI

- Model YOLOv8 dan MediaPipe digunakan untuk mendeteksi:
  - Helm,
  - Rompi keselamatan,
  - Penggunaan HP,
  - Merokok,
  - Mengantuk.
- OpenCV melakukan pemrosesan gambar, bounding box, dan streaming live.

### 3.3 Pembuatan Event

- Ketika deteksi terjadi, sistem menghasilkan event dalam format JSON.
- Event dikirim ke backend melalui endpoint `POST /api/ingest`.

### 3.4 Pemrosesan Backend

- Backend menyimpan event di memori internal.
- Backend mengupdate status zona dan statistik keselamatan.
- Backend juga membuat log akses apabila event bertipe akses.
- Backend mengirim update real-time ke klien WebSocket.

### 3.5 Sinkronisasi Real-time

- Backend membuka WebSocket di `ws://localhost:4000/ws`.
- Ketika klien terhubung, backend mengirimkan snapshot awal data.
- Selanjutnya backend mengirim update terpisah untuk:
  - `event`,
  - `access`,
  - `zones`,
  - `stats`.

### 3.6 Visualisasi Frontend

- Frontend menerima update WebSocket dan memperbarui UI.
- Dashboard menampilkan:
  - KPI,
  - peta zona,
  - ringkasan kejadian,
  - heatmap shift,
  - grafik tren,
  - panel detail zona.
- Terminal kamera menampilkan status AI Vision dan simulasi deteksi.

### 3.7 Alert dan Interaksi Pengguna

- Frontend menggunakan Web Speech API untuk voice alert real-time.
- Peristiwa kritis dapat diucapkan secara otomatis.
- Terdapat banner SOS untuk kondisi darurat.

## 4. Teknologi yang Digunakan

### 4.1 Frontend

- React
- Vite
- Mantine UI (`@mantine/core`, `@mantine/hooks`, `@mantine/charts`)
- Recharts
- WebSocket
- Fetch API
- SpeechSynthesis API

### 4.2 Backend

- Node.js
- Express
- ws
- concurrently

### 4.3 AI / Edge

- Python
- Flask
- OpenCV
- YOLOv8
- MediaPipe
- Model `best.pt` dan `smoking_model.pt`

### 4.4 Pendukung

- HTML/CSS
- JavaScript modern
- JSON

## 5. Fitur Sistem

### 5.1 Dashboard Command Center

- Menampilkan status keseluruhan operasi tambang.
- KPI utama meliputi:
  - Total unit kendaraan,
  - Kepatuhan APD,
  - Pelanggaran driver,
  - Status AI Vision.
- Menampilkan event terbaru, heatmap, dan detail zona.

### 5.2 AI Vision Terminal (Kabin)

- Menampilkan simulasi kamera kabin.
- Menampilkan pipeline AI:
  - capture,
  - preprocess,
  - inference,
  - result.
- Menyediakan kontrol deteksi dan status AI.

### 5.3 Real-time Event Stream

- Event safety dikirim secara langsung ke backend.
- Backend mengupdate dashboard secara real-time.
- Terdapat fallback offline jika backend tidak tersedia.

### 5.4 Notifikasi dan Voice Alert

- Voice alert muncul untuk event penting.
- Contoh pesan:
  - operator tanpa helm atau rompi,
  - penggunaan HP,
  - merokok,
  - mengantuk,
  - SOS.

### 5.5 Monitoring Zona dan Akses

- Zona disimpan dengan atribut:
  - pekerja aktif,
  - kapasitas,
  - skor kepatuhan APD,
  - risiko.
- Log akses RFID disimpan sebagai history.

### 5.6 Statistik Keselamatan

- Mendukung analisis:
  - total event hari ini,
  - near-miss,
  - akses tervalidasi,
  - pelanggaran driver,
  - overspeed,
  - road alerts,
  - status SOS.

## 6. Komponen Kode Penting

### 6.1 Frontend

- `src/App.jsx`: entry point UI dan navigasi views.
- `src/components/Dashboard.jsx`: dashboard visual utama.
- `src/components/CameraView.jsx`: tampilan toggle ke modul kamera.
- `src/components/CameraCheckpoint.jsx`: UI simulasi AI Vision.
- `src/useSafetyStream.js`: logika WebSocket dan state data.

### 6.2 Backend

- `server/index.js`: server Express + WebSocket.
- `server/data.js`: generator data dummy, zone, pekerja, dan event.

### 6.3 AI Vision

- `main.py`: server Python untuk deteksi video dan status.
- `best.pt`, `smoking_model.pt`: model deteksi.

## 7. Alur Operasional untuk Pengguna

1. Jalankan `npm install` di root proyek.
2. Jalankan `npm run dev:all` untuk memulai frontend dan backend.
3. Jalankan server Python AI jika tersedia: `python main.py --source 0`.
4. Buka browser ke `http://localhost:5173`.
5. Dashboard akan terhubung ke backend dan menampilkan data real-time.

## 8. Rekomendasi Pengembangan Selanjutnya

- Menambahkan basis data persistensi (misalnya PostgreSQL).
- Menambahkan autentikasi dan otorisasi.
- Mengintegrasikan broker pesan nyata (MQTT).
- Menambah modul notifikasi WhatsApp / SMS.
- Mengembangkan manajemen perangkat edge dan konfigurasi unit.

## 9. Kesimpulan

Sistem ini merupakan prototype terintegrasi yang menghubungkan edge AI vision dengan cloud dashboard. Implementasi saat ini sudah mencakup alur deteksi, pemrosesan data, sinkronisasi real-time, dan visualisasi keselamatan. Dengan pengembangan lebih lanjut, sistem dapat ditingkatkan menjadi solusi operasi tambang yang lebih stabil dan lengkap.
