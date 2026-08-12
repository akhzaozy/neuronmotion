# Referensi Dataset Training NeuronMotion

Dokumen ini menautkan setiap parameter dalam dataset training dengan sumbernya.

**Penting:** seluruh dataset bersifat **sintetis**. Referensi di bawah dipakai untuk menetapkan
rentang nilai yang masuk akal secara klinis, **bukan** sebagai bukti bahwa model sudah divalidasi
secara klinis. Validasi pada pasien nyata bersama tenaga medis tetap wajib sebelum sistem dipakai
untuk skrining sungguhan.

Status setiap baris:

| Status | Arti |
|---|---|
| ✅ **Terverifikasi** | Angka benar-benar berasal dari publikasi yang dikutip |
| ⚠️ **Belum ada sumber** | Nilai ditetapkan dari pertimbangan umum, tanpa sumber spesifik |

---

## ✅ Parameter dengan sumber terverifikasi

### 1. Frekuensi tremor Parkinson (3–7 Hz) dan tumpang tindihnya dengan Essential Tremor

> Zhang J. dkk. (2017). *Differential Diagnosis of Parkinson Disease, Essential Tremor, and Enhanced
> Physiological Tremor with the Tremor Analysis of EMG*. Parkinson's Disease (Hindawi/Wiley).
> <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5573102/>

Frekuensi tremor PD 4–6 Hz, dan frekuensi ET juga berada pada rentang tersebut, sehingga sulit
dibedakan hanya melalui frekuensi tremor saat istirahat. **Menjadi dasar** dibuatnya tumpang tindih
antara kelas `PARKINSON_*` dan `ESSENTIAL_TREMOR` pada dataset ini.

### 2. Frekuensi tremor fisiologis orang sehat (6–12 Hz)

> Scholarpedia, artikel *Tremor*. <http://www.scholarpedia.org/article/Tremor>
> Smaga S. (1999). *Classification of Tremor and Update on Treatment*. American Family Physician.
> <https://www.aafp.org/pubs/afp/issues/1999/0315/p1565.html>

Tremor fisiologis normal adalah tremor postural beramplitudo rendah dengan frekuensi modal 8–12 Hz.
**Memperbaiki** versi awal dataset yang keliru memodelkan orang sehat pada 0–2 Hz.

### 3. Pembeda utama sehat vs patologis adalah amplitudo, bukan frekuensi

> Smaga S. (1999). *Classification of Tremor and Update on Treatment*. American Family Physician.
> <https://www.aafp.org/pubs/afp/issues/1999/0315/p1565.html>

Tremor fisiologis beramplitudo rendah justru pada rentang frekuensi yang lebih tinggi dari tremor
Parkinson, sehingga amplitudo menjadi pembeda yang lebih menentukan.

### 4. Cadence Parkinson tidak lebih rendah dari kontrol sehat

> Zanardi A.P.J. dkk. (2021). *Gait parameters of Parkinson's disease compared with healthy controls:
> a systematic review and meta-analysis*. Scientific Reports.
> <https://www.nature.com/articles/s41598-020-80768-2>

Meta-analisis menemukan cadence pada PD sekitar **1,75 langkah/menit lebih tinggi** dibanding
kelompok sehat; yang benar-benar memendek adalah **panjang langkah**. **Menjadi dasar koreksi**
rentang cadence PD, yang pada versi sebelumnya keliru dimodelkan jauh lebih rendah dari orang sehat.

### 5. Cadence normatif lansia sehat (95–120 langkah/menit)

> Tudor-Locke C. dkk. *CADENCE-Adults study*, kelompok usia 61–85 tahun.
> <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8461976/>

Ambang cadence 100, 110, dan 120 langkah/menit berkaitan dengan intensitas 3, 4, dan 5 MET pada
lansia sehat. Dipakai sebagai acuan rentang cadence kelas `HEALTHY`.

### 6. Asimetri ayunan lengan Parkinson tahap awal

> Lewek M.D. dkk. (2010). *Arm swing magnitude and asymmetry during gait in the early stages of
> Parkinson's disease*. Gait & Posture.
> <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2818433/>

Kelompok PD menunjukkan asimetri ayunan lengan **13,9 ± 7,9%** dibanding kontrol **5,1 ± 4,0%**
(p = 0,003). **Menjadi dasar** penetapan rentang `armAsymmetry` untuk `PARKINSON_EARLY` dan
`HEALTHY`, termasuk tumpang tindih di antara keduanya.

### 7. Asimetri ayunan lengan berguna untuk deteksi dini

> Tinjauan sistematis dan meta-analisis asimetri ayunan lengan pada Parkinson (2023).
> <https://www.sciencedirect.com/science/article/abs/pii/S1413355523000801>

Asimetri ayunan lengan, berbeda dengan besaran ayunannya, secara konsisten membedakan PD tahap awal
dari kontrol sehat, sehingga berguna untuk diagnosis dini dan diferensial.

### 8. Finger tapping perlu disesuaikan usia

> *Age-related differences in the quantitative analysis of the finger tapping task*.
> <https://pmc.ncbi.nlm.nih.gov/articles/PMC9028619/>

Kecepatan finger tapping menurun seiring bertambahnya usia, sehingga penilaian bradikinesia
sebaiknya memakai nilai normatif yang disesuaikan usia. **Menjadi dasar** `ageFactor` pada generator
dan penyesuaian rentang normal per kelompok usia di aplikasi.

### 9. Protokol finger tapping (ketuk secepat dan selebar mungkin)

> MDS-UPDRS, butir finger tapping; dan SMART test (medRxiv, 2021).
> <https://www.medrxiv.org/content/10.1101/2021.03.24.21254234.full.pdf>

MDS-UPDRS meminta pasien mengetukkan telunjuk ke ibu jari "secepat **dan** selebar mungkin", serta
menilai perlambatan, kehilangan amplitudo, dan jeda sebagai tanda bradikinesia. **Menjadi dasar**
instruksi tes dan pengukuran dekremen amplitudo di aplikasi.

### 10. Dekremen dan variabilitas ritme lebih membedakan daripada kecepatan mutlak

> Studi tapping berirama pada Parkinson.
> <https://pmc.ncbi.nlm.nih.gov/articles/PMC1015235/>

Pada tapping dengan tempo bebas, kecepatan PD dan kontrol **tidak berbeda bermakna**
(1,46 ± 0,53 Hz vs 1,72 ± 0,91 Hz), namun variabilitas ritme PD lebih besar dan memburuk saat
isyarat tempo eksternal dihilangkan. **Menjadi alasan** dekremen amplitudo diberi bobot pada
penilaian, bukan hanya kecepatan.

### 11. Skala penilaian motorik dan pembagian tahap Parkinson

> MDS-UPDRS (Movement Disorder Society Unified Parkinson's Disease Rating Scale) dan skala
> Hoehn & Yahr. <https://www.movementdisorders.org/MDS/MDS-Rating-Scales.htm>

MDS-UPDRS menjadi acuan domain penilaian motorik dan non-motorik. Skala Hoehn & Yahr dipakai untuk
memisahkan kelas `PARKINSON_EARLY` (tahap 1–2) dan `PARKINSON_ADVANCED` (tahap 3–4).

### 12. Domain gejala non-motorik pada kuesioner pra-skrining

> MDS-UPDRS Bagian I dan daftar tanda peringatan dini Parkinson yang lazim dipakai.
> <https://www.movementdisorders.org/MDS/MDS-Rating-Scales.htm>

Hilangnya kemampuan membau, gangguan perilaku tidur REM, sembelit menahun, mikrografia, dan
perubahan suara termasuk tanda awal yang sering mendahului gejala motorik. **Menjadi dasar**
pemilihan pertanyaan kuesioner pra-skrining.

---

## ⚠️ Parameter yang belum punya sumber spesifik

Nilai berikut **tidak boleh dikutip** sebagai temuan berbasis publikasi. Sebelum dipakai untuk klaim
ilmiah, parameter ini perlu dikalibrasi ulang terhadap publikasi atau data pengukuran nyata.

| Parameter | Keterangan |
|---|---|
| **Sway area postural (cm²)** | Literatur menyebut lansia dan pasien Parkinson memiliki sway lebih besar dari dewasa muda, dan sebuah studi menyebut ambang 10,3 cm² pada lansia, namun [belum ada standar universal untuk posturografi](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12510599/) sehingga nilainya sangat bergantung protokol. Nilai pada dataset ini dalam satuan ternormalisasi kamera, **bukan** cm² dari force plate, sehingga tidak dapat disamakan. |
| **Amplitudo tremor (mm)** | Literatur konsisten menyebut tremor fisiologis beramplitudo "rendah" dan tremor patologis lebih besar, namun tidak ditemukan rentang numerik dalam milimeter yang dapat dikutip langsung. Nilai ditetapkan agar berskala wajar relatif antar kelas. |
| **Kecepatan finger tapping maksimal (ketukan/detik)** | Nilai normatif tapping maksimal per detik untuk sehat maupun Parkinson tidak berhasil dikonfirmasi dari sumber yang dapat diakses. Nilai ditetapkan agar konsisten dengan arah temuan bradikinesia. |
| **Indeks simetri langkah** | Arah temuan (asimetri meningkat pada Parkinson, pasca stroke, dan ataksia) didukung literatur gait, namun definisi indeks simetri berbeda-beda antar studi sehingga ambangnya tidak dapat dipindahkan langsung. Nilai memakai definisi indeks internal aplikasi ini. |
| **Range of Motion lutut dan bahu** | Ditetapkan dari rentang gerak sendi yang umum dipakai, tanpa menelusuri publikasi normatif spesifik. |

---

## Catatan tentang kutipan yang dihapus

Versi awal proyek ini mencantumkan **Shimoyama dkk. 1990**, **Zijlstra & Hof 2003**, dan
**mPower Study** sebagai referensi. Kutipan tersebut **dihapus** karena tidak berhasil dikonfirmasi
bahwa angka-angka dalam dataset memang berasal dari publikasi tersebut. Lebih baik mencantumkan
sedikit referensi yang benar-benar dapat dipertanggungjawabkan daripada banyak referensi yang tidak
dapat ditelusuri.
