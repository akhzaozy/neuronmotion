/**
 * Penyiap proyek untuk mesin baru.
 *
 * Repositori ini sengaja tidak membawa dua hal: berkas .env dan basis data
 * prisma/dev.db. Keduanya ada di .gitignore, dan memang seharusnya begitu,
 * sebab yang pertama memuat kunci penanda tangan token dan yang kedua memuat
 * data pasien.
 *
 * Akibatnya, hasil clone yang segar tidak bisa langsung dijalankan: `npm run
 * dev:all` akan menyalakan backend yang tidak menemukan DATABASE_URL, lalu
 * gagal pada permintaan pertama. Skrip ini menutup jarak itu dengan satu
 * perintah, dan ia dibuat aman diulang: berkas .env yang sudah ada tidak
 * pernah ditimpa, sehingga menjalankannya dua kali tidak menghapus kunci yang
 * sudah dipakai.
 *
 *   npm run setup
 */

import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

const step = msg => console.log(`\n▸ ${msg}`);
const ok = msg => console.log(`  ✓ ${msg}`);

const run = (cmd, label) => {
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
  } catch {
    console.error(`\n✗ Gagal pada langkah: ${label}`);
    console.error(`  Perintah: ${cmd}`);
    process.exit(1);
  }
};

console.log('\nPenyiapan NeuronMotion\n' + '─'.repeat(60));

/* ── 1. Berkas .env ───────────────────────────────────────────────────────
   Kunci JWT diacak di sini, bukan disalin apa adanya dari contoh. Kunci
   contoh terbaca oleh siapa pun yang membuka repositori, dan token yang
   ditandatanganinya bisa dipalsukan. */
step('Menyiapkan .env');
if (existsSync(envPath)) {
  ok('.env sudah ada, dibiarkan apa adanya');
} else {
  if (!existsSync(examplePath)) {
    console.error('  ✗ .env.example tidak ditemukan.');
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  const secret = randomBytes(48).toString('base64url');
  writeFileSync(
    envPath,
    readFileSync(envPath, 'utf8').replace(
      /JWT_SECRET="[^"]*"/,
      `JWT_SECRET="${secret}"`,
    ),
  );
  ok('.env dibuat, dengan JWT_SECRET acak');
}

/* ── 2. Dependensi ──────────────────────────────────────────────────────── */
step('Memasang dependensi (root)');
run('npm install', 'npm install di root');

step('Memasang dependensi (webapp)');
run('npm install --prefix webapp', 'npm install di webapp');

/* ── 3. Basis data ──────────────────────────────────────────────────────── */
step('Membuat basis data dan Prisma Client');
run('npx prisma db push', 'prisma db push');

/* ── 4. Data contoh ───────────────────────────────────────────────────────
   Seed menghapus isi tabel lebih dulu, jadi ia hanya dijalankan ketika basis
   datanya memang belum berisi. Menjalankan `npm run setup` pada proyek yang
   sudah dipakai tidak boleh diam-diam membuang sesi yang sudah ada. */
step('Mengisi data contoh');
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const existing = await prisma.user.count();
await prisma.$disconnect();

if (existing > 0) {
  ok(`Basis data sudah berisi ${existing} pengguna, seed dilewati`);
  console.log('    Untuk mengisi ulang dari nol: npm run seed');
} else {
  run('npm run seed', 'npm run seed');
}

console.log('\n' + '─'.repeat(60));
console.log('Selesai. Jalankan aplikasinya dengan:\n');
console.log('  npm run dev:all\n');
console.log('  Aplikasi  http://localhost:3000');
console.log('  API       http://localhost:4000/api/health\n');
console.log('Akun demo (dibuat oleh seed):');
console.log('  Pasien  pasien@neuronmotion.id  / password123');
console.log('  Dokter  dr.dewi@neuronmotion.id / doctor123');
console.log('  Admin   admin@neuronmotion.id   / admin123  (API saja, belum ada halaman)\n');
