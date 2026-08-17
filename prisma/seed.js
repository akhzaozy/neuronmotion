/**
 * NeuronMotion, Database Seeder
 * Mengisi database dengan data pasien sintetis berbasis klinis
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTrainingDataset, CONDITION_PROFILES, CLINICAL_REFERENCE } from '../server/data/clinicalData.js';

const prisma = new PrismaClient();

/**
 * 100 lokasi dummy dari berbagai wilayah di seluruh dunia.
 * Mencakup ~30 negara dari 6 benua / region global.
 */
const WORLD_LOCATIONS = [
  // ── Asia Tenggara ─────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia',    state: 'DKI Jakarta',       region: 'Asia Tenggara', city: 'Jakarta',          address: 'Jl. Thamrin No. 1' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Jawa Barat',        region: 'Asia Tenggara', city: 'Bandung',          address: 'Jl. Braga No. 10' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Jawa Timur',        region: 'Asia Tenggara', city: 'Surabaya',         address: 'Jl. Pemuda No. 31' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Sumatera Utara',    region: 'Asia Tenggara', city: 'Medan',            address: 'Jl. Gatot Subroto No. 88' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Bali',              region: 'Asia Tenggara', city: 'Denpasar',         address: 'Jl. Teuku Umar No. 20' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Sulawesi Selatan',  region: 'Asia Tenggara', city: 'Makassar',         address: 'Jl. Penghibur No. 11' },
  { country: 'ID', countryName: 'Indonesia',    state: 'DI Yogyakarta',     region: 'Asia Tenggara', city: 'Yogyakarta',       address: 'Jl. Malioboro No. 52' },
  { country: 'ID', countryName: 'Indonesia',    state: 'Jawa Tengah',       region: 'Asia Tenggara', city: 'Semarang',         address: 'Jl. Pandanaran No. 42' },
  { country: 'MY', countryName: 'Malaysia',     state: 'Kuala Lumpur',      region: 'Asia Tenggara', city: 'Kuala Lumpur',     address: 'Jalan Bukit Bintang 55' },
  { country: 'MY', countryName: 'Malaysia',     state: 'Penang',            region: 'Asia Tenggara', city: 'George Town',      address: 'Lebuh Pantai 12' },
  { country: 'MY', countryName: 'Malaysia',     state: 'Sabah',             region: 'Asia Tenggara', city: 'Kota Kinabalu',    address: 'Jalan Gaya 8' },
  { country: 'SG', countryName: 'Singapura',    state: 'Singapore',         region: 'Asia Tenggara', city: 'Singapore',        address: 'Orchard Road 238' },
  { country: 'TH', countryName: 'Thailand',     state: 'Bangkok',           region: 'Asia Tenggara', city: 'Bangkok',          address: 'Sukhumvit Soi 11' },
  { country: 'TH', countryName: 'Thailand',     state: 'Chiang Mai',        region: 'Asia Tenggara', city: 'Chiang Mai',       address: 'Nimmanhaemin Road 7' },
  { country: 'PH', countryName: 'Filipina',     state: 'Metro Manila',      region: 'Asia Tenggara', city: 'Manila',           address: 'Roxas Boulevard 100' },
  { country: 'PH', countryName: 'Filipina',     state: 'Cebu',              region: 'Asia Tenggara', city: 'Cebu City',        address: 'Osmena Boulevard 45' },
  { country: 'VN', countryName: 'Vietnam',      state: 'Ho Chi Minh',       region: 'Asia Tenggara', city: 'Ho Chi Minh City', address: 'Nguyen Hue Street 88' },
  { country: 'VN', countryName: 'Vietnam',      state: 'Hanoi',             region: 'Asia Tenggara', city: 'Hanoi',            address: 'Pho Hang Bai 30' },

  // ── Asia Timur ────────────────────────────────────────────────────────────
  { country: 'JP', countryName: 'Jepang',       state: 'Tokyo',             region: 'Asia Timur',    city: 'Tokyo',            address: 'Shibuya 2-21-1' },
  { country: 'JP', countryName: 'Jepang',       state: 'Osaka',             region: 'Asia Timur',    city: 'Osaka',            address: 'Namba 5-1-60' },
  { country: 'JP', countryName: 'Jepang',       state: 'Kyoto',             region: 'Asia Timur',    city: 'Kyoto',            address: 'Kawaramachi Shijo 101' },
  { country: 'KR', countryName: 'Korea Selatan', state: 'Seoul',            region: 'Asia Timur',    city: 'Seoul',            address: 'Gangnam-daero 396' },
  { country: 'KR', countryName: 'Korea Selatan', state: 'Busan',            region: 'Asia Timur',    city: 'Busan',            address: 'Haeundae-ro 264' },
  { country: 'CN', countryName: 'Tiongkok',     state: 'Beijing',           region: 'Asia Timur',    city: 'Beijing',          address: 'Wangfujing Street 255' },
  { country: 'CN', countryName: 'Tiongkok',     state: 'Shanghai',          region: 'Asia Timur',    city: 'Shanghai',         address: 'Nanjing Road 501' },
  { country: 'CN', countryName: 'Tiongkok',     state: 'Guangdong',         region: 'Asia Timur',    city: 'Guangzhou',        address: 'Beijing Road 168' },
  { country: 'TW', countryName: 'Taiwan',       state: 'Taipei',            region: 'Asia Timur',    city: 'Taipei',           address: 'Zhongxiao East Road Sec. 4' },
  { country: 'HK', countryName: 'Hong Kong',    state: 'Hong Kong',         region: 'Asia Timur',    city: 'Hong Kong',        address: 'Nathan Road 36' },

  // ── Asia Selatan ──────────────────────────────────────────────────────────
  { country: 'IN', countryName: 'India',        state: 'Maharashtra',       region: 'Asia Selatan',  city: 'Mumbai',           address: 'Marine Drive 120' },
  { country: 'IN', countryName: 'India',        state: 'Delhi',             region: 'Asia Selatan',  city: 'New Delhi',        address: 'Connaught Place B-14' },
  { country: 'IN', countryName: 'India',        state: 'Karnataka',         region: 'Asia Selatan',  city: 'Bangalore',        address: 'MG Road 77' },
  { country: 'IN', countryName: 'India',        state: 'Tamil Nadu',        region: 'Asia Selatan',  city: 'Chennai',          address: 'Anna Salai 850' },
  { country: 'BD', countryName: 'Bangladesh',   state: 'Dhaka Division',    region: 'Asia Selatan',  city: 'Dhaka',            address: 'Gulshan Avenue 42' },
  { country: 'PK', countryName: 'Pakistan',     state: 'Punjab',            region: 'Asia Selatan',  city: 'Lahore',           address: 'Mall Road 155' },
  { country: 'LK', countryName: 'Sri Lanka',    state: 'Western Province',  region: 'Asia Selatan',  city: 'Colombo',          address: 'Galle Road 200' },

  // ── Timur Tengah ──────────────────────────────────────────────────────────
  { country: 'AE', countryName: 'Uni Emirat Arab', state: 'Dubai',          region: 'Timur Tengah',  city: 'Dubai',            address: 'Sheikh Zayed Road 507' },
  { country: 'AE', countryName: 'Uni Emirat Arab', state: 'Abu Dhabi',      region: 'Timur Tengah',  city: 'Abu Dhabi',        address: 'Corniche Road 34' },
  { country: 'SA', countryName: 'Arab Saudi',   state: 'Riyadh Province',   region: 'Timur Tengah',  city: 'Riyadh',           address: 'King Fahd Road 200' },
  { country: 'SA', countryName: 'Arab Saudi',   state: 'Makkah Province',   region: 'Timur Tengah',  city: 'Jeddah',           address: 'Tahlia Street 80' },
  { country: 'TR', countryName: 'Turki',        state: 'Istanbul',          region: 'Timur Tengah',  city: 'Istanbul',         address: 'Istiklal Caddesi 140' },
  { country: 'TR', countryName: 'Turki',        state: 'Ankara',            region: 'Timur Tengah',  city: 'Ankara',           address: 'Ataturk Boulevard 55' },
  { country: 'QA', countryName: 'Qatar',        state: 'Doha',              region: 'Timur Tengah',  city: 'Doha',             address: 'Corniche Street 12' },
  { country: 'EG', countryName: 'Mesir',        state: 'Cairo Governorate', region: 'Timur Tengah',  city: 'Cairo',            address: 'Tahrir Square 1' },

  // ── Eropa Barat ───────────────────────────────────────────────────────────
  { country: 'GB', countryName: 'Inggris',      state: 'England',           region: 'Eropa Barat',   city: 'London',           address: '221B Baker Street' },
  { country: 'GB', countryName: 'Inggris',      state: 'England',           region: 'Eropa Barat',   city: 'Manchester',       address: 'Deansgate 100' },
  { country: 'FR', countryName: 'Prancis',      state: 'Ile-de-France',     region: 'Eropa Barat',   city: 'Paris',            address: '15 Rue de Rivoli' },
  { country: 'FR', countryName: 'Prancis',      state: 'Provence-Alpes',    region: 'Eropa Barat',   city: 'Marseille',        address: '8 Quai du Port' },
  { country: 'DE', countryName: 'Jerman',       state: 'Berlin',            region: 'Eropa Barat',   city: 'Berlin',           address: 'Friedrichstrasse 43' },
  { country: 'DE', countryName: 'Jerman',       state: 'Bayern',            region: 'Eropa Barat',   city: 'Munich',           address: 'Marienplatz 8' },
  { country: 'NL', countryName: 'Belanda',      state: 'Noord-Holland',     region: 'Eropa Barat',   city: 'Amsterdam',        address: 'Damrak 70' },
  { country: 'ES', countryName: 'Spanyol',      state: 'Madrid',            region: 'Eropa Barat',   city: 'Madrid',           address: 'Gran Via 28' },
  { country: 'ES', countryName: 'Spanyol',      state: 'Catalonia',         region: 'Eropa Barat',   city: 'Barcelona',        address: 'La Rambla 91' },
  { country: 'IT', countryName: 'Italia',       state: 'Lazio',             region: 'Eropa Barat',   city: 'Roma',             address: 'Via del Corso 126' },
  { country: 'IT', countryName: 'Italia',       state: 'Lombardia',         region: 'Eropa Barat',   city: 'Milan',            address: 'Corso Buenos Aires 33' },
  { country: 'PT', countryName: 'Portugal',     state: 'Lisbon District',   region: 'Eropa Barat',   city: 'Lisbon',           address: 'Rua Augusta 50' },
  { country: 'CH', countryName: 'Swiss',        state: 'Zurich',            region: 'Eropa Barat',   city: 'Zurich',           address: 'Bahnhofstrasse 17' },
  { country: 'SE', countryName: 'Swedia',       state: 'Stockholm',         region: 'Eropa Barat',   city: 'Stockholm',        address: 'Drottninggatan 53' },

  // ── Eropa Timur ───────────────────────────────────────────────────────────
  { country: 'PL', countryName: 'Polandia',     state: 'Masovia',           region: 'Eropa Timur',   city: 'Warsaw',           address: 'Nowy Swiat 22' },
  { country: 'CZ', countryName: 'Ceko',         state: 'Prague',            region: 'Eropa Timur',   city: 'Prague',           address: 'Vaclavske Namesti 34' },
  { country: 'RO', countryName: 'Rumania',      state: 'Bucharest',         region: 'Eropa Timur',   city: 'Bucharest',        address: 'Calea Victoriei 120' },
  { country: 'HU', countryName: 'Hungaria',     state: 'Budapest',          region: 'Eropa Timur',   city: 'Budapest',         address: 'Andrassy ut 60' },
  { country: 'RU', countryName: 'Rusia',        state: 'Moscow Oblast',     region: 'Eropa Timur',   city: 'Moscow',           address: 'Tverskaya Street 15' },

  // ── Amerika Utara ─────────────────────────────────────────────────────────
  { country: 'US', countryName: 'Amerika Serikat', state: 'New York',       region: 'Amerika Utara', city: 'New York City',    address: '350 5th Avenue' },
  { country: 'US', countryName: 'Amerika Serikat', state: 'California',     region: 'Amerika Utara', city: 'Los Angeles',      address: '6801 Hollywood Boulevard' },
  { country: 'US', countryName: 'Amerika Serikat', state: 'California',     region: 'Amerika Utara', city: 'San Francisco',    address: '1 Market Street' },
  { country: 'US', countryName: 'Amerika Serikat', state: 'Illinois',       region: 'Amerika Utara', city: 'Chicago',          address: '233 S Wacker Drive' },
  { country: 'US', countryName: 'Amerika Serikat', state: 'Texas',          region: 'Amerika Utara', city: 'Houston',          address: '1600 Lamar Street' },
  { country: 'US', countryName: 'Amerika Serikat', state: 'Massachusetts',  region: 'Amerika Utara', city: 'Boston',           address: '1 Beacon Street' },
  { country: 'CA', countryName: 'Kanada',       state: 'Ontario',           region: 'Amerika Utara', city: 'Toronto',          address: '100 Queen Street W' },
  { country: 'CA', countryName: 'Kanada',       state: 'British Columbia',  region: 'Amerika Utara', city: 'Vancouver',        address: '999 Canada Place' },
  { country: 'MX', countryName: 'Meksiko',      state: 'Ciudad de Mexico',  region: 'Amerika Utara', city: 'Mexico City',      address: 'Paseo de la Reforma 222' },

  // ── Amerika Selatan ───────────────────────────────────────────────────────
  { country: 'BR', countryName: 'Brasil',       state: 'Sao Paulo',         region: 'Amerika Selatan', city: 'Sao Paulo',      address: 'Avenida Paulista 1578' },
  { country: 'BR', countryName: 'Brasil',       state: 'Rio de Janeiro',    region: 'Amerika Selatan', city: 'Rio de Janeiro', address: 'Avenida Atlantica 1702' },
  { country: 'AR', countryName: 'Argentina',    state: 'Buenos Aires',      region: 'Amerika Selatan', city: 'Buenos Aires',   address: 'Avenida 9 de Julio 1925' },
  { country: 'CL', countryName: 'Chile',        state: 'Santiago',          region: 'Amerika Selatan', city: 'Santiago',        address: 'Avenida Libertador 1200' },
  { country: 'CO', countryName: 'Kolombia',     state: 'Bogota D.C.',       region: 'Amerika Selatan', city: 'Bogota',          address: 'Carrera 7 No. 71-52' },
  { country: 'PE', countryName: 'Peru',         state: 'Lima Province',     region: 'Amerika Selatan', city: 'Lima',            address: 'Avenida Arequipa 3500' },

  // ── Afrika ────────────────────────────────────────────────────────────────
  { country: 'ZA', countryName: 'Afrika Selatan', state: 'Gauteng',         region: 'Afrika',        city: 'Johannesburg',     address: '10 Sandton Drive' },
  { country: 'ZA', countryName: 'Afrika Selatan', state: 'Western Cape',    region: 'Afrika',        city: 'Cape Town',        address: '1 Adderley Street' },
  { country: 'NG', countryName: 'Nigeria',      state: 'Lagos',             region: 'Afrika',        city: 'Lagos',            address: 'Victoria Island, Adeola Odeku' },
  { country: 'KE', countryName: 'Kenya',        state: 'Nairobi County',    region: 'Afrika',        city: 'Nairobi',          address: 'Kenyatta Avenue 100' },
  { country: 'GH', countryName: 'Ghana',        state: 'Greater Accra',     region: 'Afrika',        city: 'Accra',            address: 'Oxford Street, Osu' },
  { country: 'MA', countryName: 'Maroko',       state: 'Casablanca-Settat', region: 'Afrika',        city: 'Casablanca',       address: 'Boulevard Mohammed V 22' },
  { country: 'TZ', countryName: 'Tanzania',     state: 'Dar es Salaam',     region: 'Afrika',        city: 'Dar es Salaam',    address: 'Samora Avenue 15' },
  { country: 'ET', countryName: 'Ethiopia',     state: 'Addis Ababa',       region: 'Afrika',        city: 'Addis Ababa',      address: 'Bole Road 48' },

  // ── Oseania ───────────────────────────────────────────────────────────────
  { country: 'AU', countryName: 'Australia',    state: 'New South Wales',   region: 'Oseania',       city: 'Sydney',           address: '1 Macquarie Street' },
  { country: 'AU', countryName: 'Australia',    state: 'Victoria',          region: 'Oseania',       city: 'Melbourne',        address: '385 Bourke Street' },
  { country: 'AU', countryName: 'Australia',    state: 'Queensland',        region: 'Oseania',       city: 'Brisbane',         address: '100 George Street' },
  { country: 'NZ', countryName: 'Selandia Baru', state: 'Auckland',        region: 'Oseania',       city: 'Auckland',         address: '2 Queen Street' },
  { country: 'NZ', countryName: 'Selandia Baru', state: 'Wellington',      region: 'Oseania',       city: 'Wellington',       address: '50 Lambton Quay' },
];

/** Ambil satu lokasi acak dari daftar */
function randomLocation() {
  return WORLD_LOCATIONS[Math.floor(Math.random() * WORLD_LOCATIONS.length)];
}

async function main() {
  console.log('🌱 Memulai seeding database NeuronMotion...\n');

  // 1. Bersihkan data lama
  await prisma.session.deleteMany();
  await prisma.doctorPatient.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database dibersihkan');

  // 2. Seed Conditions (referensi klinis)
  const conditions = await Promise.all(
    Object.entries(CONDITION_PROFILES).map(([key, profile]) =>
      prisma.condition.create({
        data: {
          key,
          label: profile.label,
          description: profile.description,
          biomarkerThresholds: JSON.stringify(profile.biomarkerProfile),
        },
      })
    )
  );
  console.log(`✅ ${conditions.length} kondisi klinis ditambahkan`);

  // 3. Buat akun Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { email: 'admin@neuronmotion.id', password: adminPassword, name: 'Admin NeuronMotion', role: 'ADMIN' },
  });

  // 4. Buat 5 Dokter Spesialis Saraf
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctorData = [
    { name: 'dr. Andi Wijaya, Sp.S', email: 'dr.andi@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2021-001' },
    { name: 'dr. Sari Kusuma, Sp.S', email: 'dr.sari@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2021-002' },
    { name: 'dr. Budi Santoso, Sp.KFR', email: 'dr.budi@neuronmotion.id', spec: 'Kedokteran Fisik & Rehabilitasi', license: 'SIP-2020-015' },
    { name: 'dr. Dewi Rahayu, Sp.S', email: 'dr.dewi@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2022-008' },
    { name: 'dr. Hendra Pratama, Sp.KFR', email: 'dr.hendra@neuronmotion.id', spec: 'Kedokteran Fisik & Rehabilitasi', license: 'SIP-2019-030' },
  ];
  const doctors = await Promise.all(
    doctorData.map(d => prisma.user.create({
      data: {
        email: d.email, password: doctorPassword, name: d.name,
        role: 'DOCTOR', specialization: d.spec, licenseNumber: d.license,
      },
    }))
  );
  console.log(`✅ ${doctors.length} akun dokter dibuat`);

  // 5. Generate dan seed pasien sintetis
  const patientPassword = await bcrypt.hash('patient123', 10);
  const syntheticDataset = generateTrainingDataset(1500); // 1500 pasien

  let sessionCount = 0;
  const createdPatients = [];

  // ── Batch insert untuk performa SQLite ────────────────────────────────────
  // Sebelumnya ~6000 operasi satu per satu (masing-masing 1 transaksi SQLite).
  // Sekarang dikumpulkan dulu di memori, lalu ditulis dalam batch per 100 di
  // dalam satu $transaction — jauh lebih cepat karena SQLite hanya perlu flush
  // ke disk sekali per batch, bukan sekali per baris.

  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(syntheticDataset.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batch = syntheticDataset.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

    // Siapkan semua operasi untuk batch ini
    const ops = [];
    const batchMeta = []; // simpan metadata sementara

    // Fase 1: buat semua user dalam satu transaksi
    const userOps = batch.map(patientData => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - patientData.age);
      const loc = randomLocation();
      return prisma.user.create({
        data: {
          email: patientData.email,
          password: patientPassword,
          name: patientData.name,
          role: 'PATIENT',
          gender: patientData.gender,
          dateOfBirth: dob,
          country: loc.country,
          countryName: loc.countryName,
          state: loc.state,
          region: loc.region,
          city: loc.city,
          address: loc.address,
        },
      });
    });

    const batchPatients = await prisma.$transaction(userOps);

    // Fase 2: buat semua link + session dalam satu transaksi
    const linkAndSessionOps = [];
    for (let i = 0; i < batchPatients.length; i++) {
      const patient = batchPatients[i];
      const patientData = batch[i];
      createdPatients.push({ ...patient, condition: patientData.condition });

      // Link ke dokter acak
      const assignedDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      linkAndSessionOps.push(
        prisma.doctorPatient.create({
          data: { doctorId: assignedDoctor.id, patientId: patient.id },
        })
      );

      // Buat 1-3 sesi pemeriksaan per pasien
      const sessionCount_ = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < sessionCount_; s++) {
        const bm = patientData.biomarkers;
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - (s * 30));

        linkAndSessionOps.push(
          prisma.session.create({
            data: {
              patientId: patient.id,
              doctorId: assignedDoctor.id,
              tremorResult: JSON.stringify({
                dominantFrequencyHz: bm.tremor.dominantFrequencyHz,
                amplitude: bm.tremor.amplitude,
                category: categorizeTremor(bm.tremor),
                score: scoreTremor(bm.tremor),
              }),
              fingerTappingResult: JSON.stringify({
                tapRatePerSecond: bm.fingerTapping.tapRatePerSecond,
                decrementPercent: bm.fingerTapping.decrementPercent,
                category: categorizeTapping(bm.fingerTapping),
                score: scoreTapping(bm.fingerTapping),
              }),
              gaitResult: JSON.stringify({
                symmetryIndex: bm.gait.symmetryIndex,
                cadencePerMin: bm.gait.cadencePerMin,
                category: categorizeGait(bm.gait),
                score: scoreGait(bm.gait),
              }),
              posturalResult: JSON.stringify({
                swayAreaNorm: bm.posturalStability.swayArea,
                swayLengthNorm: bm.posturalStability.swayLength,
                category: categorizePosture(bm.posturalStability),
                score: scorePosture(bm.posturalStability),
              }),
              compositeScore: patientData.updrsApprox.severityPercent,
              riskCategory: patientData.updrsApprox.severityPercent >= 65 ? 'HIGH'
                : patientData.updrsApprox.severityPercent >= 35 ? 'MEDIUM' : 'LOW',
              mlPrediction: JSON.stringify({ predictedCondition: patientData.condition, predictedLabel: patientData.conditionLabel }),
              updrsEstimate: JSON.stringify(patientData.updrsApprox),
              recommendations: JSON.stringify(generateBasicRecs(patientData.condition)),
              doctorNote: s === 0 && Math.random() > 0.5
                ? `Pasien datang dengan keluhan ${patientData.conditionLabel}. Perlu tindak lanjut.`
                : null,
              timestamp: sessionDate,
            },
          })
        );
        sessionCount++;
      }
    }

    await prisma.$transaction(linkAndSessionOps);
    process.stdout.write(`\r  📦 Batch ${b + 1}/${totalBatches} selesai (${Math.min((b + 1) * BATCH_SIZE, syntheticDataset.length)} pasien)`);
  }
  console.log(); // newline setelah progress

  console.log(`✅ ${createdPatients.length} pasien sintetis dibuat`);
  console.log(`✅ ${sessionCount} sesi pemeriksaan dibuat`);
  console.log(`✅ ${WORLD_LOCATIONS.length} lokasi dummy tersedia dari berbagai wilayah dunia`);

  // Buat akun pasien demo yang bisa login
  const demoDob = new Date();
  demoDob.setFullYear(demoDob.getFullYear() - 64);
  const demoPatient = await prisma.user.create({
    data: {
      email: 'pasien@neuronmotion.id',
      password: await bcrypt.hash('password123', 10),
      name: 'Pasien Demo',
      role: 'PATIENT',
      gender: 'M',
      dateOfBirth: demoDob,
      country: 'ID',
      countryName: 'Indonesia',
      state: 'DKI Jakarta',
      region: 'Jawa',
      city: 'Jakarta Pusat',
      address: 'Jl. Thamrin No. 1',
    },
  });
  await prisma.doctorPatient.create({ data: { doctorId: doctors[0].id, patientId: demoPatient.id } });

  /* Riwayat akun demo.
     ─────────────────────────────────────────────────────────────────────────
     Sebelumnya akun ini dibuat tanpa satu pun sesi, sehingga orang yang masuk
     dengan akun demo justru melihat halaman kosong dan tidak menemukan apa pun
     dari produk ini.

     Datanya ditulis tangan, tidak diambil dari generator sintetis, karena dua
     alasan. Pertama, generator memberi satu set biomarker per pasien lalu
     memakainya ulang untuk seluruh sesinya, sehingga grafik trennya datar dan
     setiap perbandingan antar sesi bernilai nol. Kedua, generator tidak pernah
     mengisi ayunan lengan dan rentang gerak, sehingga dua dari enam kartu
     biomarker tidak pernah muncul.

     Deretan di bawah ini bergerak: memburuk perlahan selama lima bulan lalu
     sedikit membaik pada sesi terakhir. Itu bentuk yang membuat garis tren,
     selisih antar sesi, dan pembanding riwayat punya sesuatu untuk ditunjukkan.

     Nama fieldnya sengaja mengikuti keluaran analisator live di
     server/services/biomarkers.js, bukan bentuk ringkas yang dipakai pasien
     sintetis di atas, supaya akun demo ikut menguji jalur yang sama dengan
     rekaman kamera sungguhan.

     Angka-angka ini data peraga, bukan rekaman pasien nyata. */
  const demoSessions = [
    { daysAgo: 152, score: 28.4, tremorHz: 3.81, amp: 0.0061, tap: 4.62, dec: 6.2,  cad: 108.4, sym: 95.8, arm: 8.3,  rom: 128.5, sway: 2.14 },
    { daysAgo: 121, score: 33.9, tremorHz: 4.08, amp: 0.0079, tap: 4.31, dec: 9.4,  cad: 105.1, sym: 93.6, arm: 12.1, rom: 124.2, sway: 2.83 },
    { daysAgo: 88,  score: 41.2, tremorHz: 4.37, amp: 0.0104, tap: 3.94, dec: 13.1, cad: 101.3, sym: 90.7, arm: 16.8, rom: 119.4, sway: 3.91 },
    { daysAgo: 54,  score: 47.6, tremorHz: 4.71, amp: 0.0138, tap: 3.52, dec: 17.3, cad: 96.8,  sym: 87.9, arm: 21.6, rom: 114.1, sway: 5.22 },
    { daysAgo: 19,  score: 43.8, tremorHz: 4.59, amp: 0.0126, tap: 3.71, dec: 15.2, cad: 98.9,  sym: 89.2, arm: 19.4, rom: 116.3, sway: 4.68 },
  ];

  for (const d of demoSessions) {
    const when = new Date();
    when.setDate(when.getDate() - d.daysAgo);

    await prisma.session.create({
      data: {
        patientId: demoPatient.id,
        doctorId: doctors[0].id,
        timestamp: when,
        createdAt: when,
        tremorResult: JSON.stringify({
          dominantFrequencyHz: d.tremorHz,
          amplitude: d.amp,
          category: 'PARKINSON_TREMOR',
          score: Math.round(d.tremorHz * 14),
        }),
        fingerTappingResult: JSON.stringify({
          tapRatePerSecond: d.tap,
          decrementPercent: d.dec,
          category: d.dec > 15 ? 'MODERATE_BRADYKINESIA' : d.dec > 8 ? 'MILD_BRADYKINESIA' : 'NORMAL',
          score: Math.round(d.dec * 3.4),
        }),
        gaitResult: JSON.stringify({
          cadencePerMin: d.cad,
          strideSymmetryIndex: parseFloat((d.sym / 100).toFixed(3)),
          symmetryPercent: d.sym,
          stepCount: Math.round(d.cad / 4),
          category: d.sym < 90 ? 'MODERATE_ASYMMETRY' : 'NORMAL',
          score: Math.round(100 - d.sym),
        }),
        armSwingResult: JSON.stringify({
          leftAmplitudeDeg: parseFloat((32 - d.arm / 3).toFixed(1)),
          rightAmplitudeDeg: parseFloat((32 - d.arm / 1.2).toFixed(1)),
          asymmetryPercent: d.arm,
          weakerSide: 'kanan',
          category: d.arm > 20 ? 'SIGNIFICANT_ASYMMETRY' : d.arm > 10 ? 'MILD_ASYMMETRY' : 'NORMAL',
          score: Math.round(d.arm * 2.6),
        }),
        romResult: JSON.stringify({
          joint: 'knee',
          maxAngleDeg: d.rom,
          minAngleDeg: 4.2,
          romDeg: d.rom,
          category: d.rom < 120 ? 'MILD_LIMITATION' : 'NORMAL',
          score: Math.round(Math.max(0, 135 - d.rom) * 2),
        }),
        posturalResult: JSON.stringify({
          swayLengthNorm: parseFloat((d.sway * 0.14).toFixed(4)),
          swayAreaNorm: parseFloat((d.sway / 10000).toFixed(6)),
          swayAreaCm2: d.sway,
          frameCount: 300,
          category: d.sway > 4 ? 'UNSTABLE' : 'MILDLY_UNSTABLE',
          score: Math.round(d.sway * 12),
        }),
        compositeScore: d.score,
        riskCategory: d.score >= 65 ? 'HIGH' : d.score >= 35 ? 'MEDIUM' : 'LOW',
        mlPrediction: JSON.stringify({
          predictedCondition: 'PARKINSON_EARLY',
          predictedLabel: 'Parkinson Awal (Hoehn-Yahr 1-2)',
          confidence: 71,
        }),
        recommendations: JSON.stringify([
          'Konsultasikan hasil ini dengan dokter saraf untuk pemeriksaan lanjutan.',
          'Ulangi skrining setiap satu bulan untuk memantau perubahan.',
        ]),
      },
    });
  }
  console.log(`✅ ${demoSessions.length} sesi untuk akun demo dibuat`);
  console.log(`\n✅ Akun demo dibuat:`);
  console.log(`   Pasien: pasien@neuronmotion.id / password123`);
  console.log(`   Dokter: dr.andi@neuronmotion.id / doctor123`);
  console.log(`   Admin:  admin@neuronmotion.id / admin123`);
  console.log('\n🌿 Seeding selesai!');
}

// Helper functions untuk seeder
function categorizeTremor(t) {
  if (t.amplitude < 0.005) return 'NORMAL';
  if (t.dominantFrequencyHz >= 4 && t.dominantFrequencyHz <= 6) return 'PARKINSON_TREMOR';
  if (t.dominantFrequencyHz > 6) return 'ESSENTIAL_TREMOR';
  return 'ABNORMAL';
}
function scoreTremor(t) {
  if (t.amplitude < 0.005) return 0;
  if (t.dominantFrequencyHz >= 4 && t.dominantFrequencyHz <= 6) return 85;
  if (t.dominantFrequencyHz > 6) return 55;
  return 40;
}
function categorizeTapping(ft) {
  if (ft.tapRatePerSecond >= 3.5) return 'NORMAL';
  if (ft.tapRatePerSecond < 1.5) return 'SEVERE_BRADYKINESIA';
  if (ft.tapRatePerSecond < 2.5) return 'MODERATE_BRADYKINESIA';
  return 'MILD_BRADYKINESIA';
}
function scoreTapping(ft) {
  if (ft.tapRatePerSecond >= 3.5) return 0;
  if (ft.tapRatePerSecond < 1.5) return 90;
  if (ft.tapRatePerSecond < 2.5) return 65;
  return 35;
}
function categorizeGait(g) {
  if (g.symmetryIndex >= 0.90) return 'NORMAL';
  if (g.symmetryIndex < 0.75) return 'SEVERE_ASYMMETRY';
  if (g.symmetryIndex < 0.85) return 'MODERATE_ASYMMETRY';
  return 'MILD_ASYMMETRY';
}
function scoreGait(g) {
  if (g.symmetryIndex >= 0.90) return 0;
  if (g.symmetryIndex < 0.75) return 88;
  if (g.symmetryIndex < 0.85) return 60;
  return 35;
}
function categorizePosture(p) {
  if (p.swayArea < 0.003) return 'STABLE';
  if (p.swayArea > 0.015) return 'SEVERELY_UNSTABLE';
  if (p.swayArea > 0.008) return 'MODERATELY_UNSTABLE';
  return 'MILDLY_UNSTABLE';
}
function scorePosture(p) {
  if (p.swayArea < 0.003) return 0;
  if (p.swayArea > 0.015) return 85;
  if (p.swayArea > 0.008) return 50;
  return 25;
}
function generateBasicRecs(condition) {
  const recs = {
    HEALTHY: ['Tetap aktif berolahraga.', 'Skrining ulang tiap 6 bulan.'],
    PARKINSON_EARLY: ['Konsultasi neurolog segera.', 'Mulai program fisioterapi.', 'Evaluasi kebutuhan terapi farmakologi.'],
    PARKINSON_ADVANCED: ['Rawat inap atau pengawasan intensif dianjurkan.', 'Evaluasi terapi levodopa.'],
    POST_STROKE: ['Rehabilitasi intensif dengan fisioterapis.', 'Latihan ROM dan penguatan otot.'],
    ESSENTIAL_TREMOR: ['Evaluasi kebutuhan terapi beta-blocker.', 'Hindari kafein dan alkohol.'],
    CEREBELLAR_ATAXIA: ['Latihan koordinasi dan keseimbangan.', 'Evaluasi etiologi dengan MRI otak.'],
  };
  return recs[condition] || ['Konsultasikan dengan dokter.'];
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
