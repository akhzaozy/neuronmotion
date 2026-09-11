#!/bin/sh
set -e

echo "🚀 [NeuronMotion] Memulai backend container..."

# Pastikan direktori prisma memiliki berkas skema dan seed jika volume luar ter-mount
if [ -d "/app/prisma_template" ]; then
  mkdir -p /app/prisma
  if [ ! -f "/app/prisma/schema.prisma" ]; then
    echo "📋 [NeuronMotion] Volume prisma baru terdeteksi. Menyalin berkas skema & seed..."
    cp -a /app/prisma_template/. /app/prisma/
  else
    # Selalu pastikan skema dan seed terbaru sinkron tanpa menghapus berkas dev.db
    cp -f /app/prisma_template/schema.prisma /app/prisma/schema.prisma 2>/dev/null || true
    cp -f /app/prisma_template/seed.js /app/prisma/seed.js 2>/dev/null || true
  fi
fi

# 1. Generate Prisma client untuk arsitektur container saat ini
echo "📦 [NeuronMotion] Menghasilkan Prisma Client..."
npx prisma generate

# 2. Pastikan skema basis data SQLite terpasang
echo "🗄️  [NeuronMotion] Menyinkronkan skema database SQLite..."
npx prisma db push --skip-generate

# 3. Inisialisasi data awal jika database masih kosong
if [ "$AUTO_SEED" = "true" ] || [ -z "$AUTO_SEED" ]; then
  echo "🌱 [NeuronMotion] Memeriksa data awal database..."
  
  SEED_REQUIRED=0
  node --input-type=module -e "
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        process.exit(10);
      } else {
        console.log('   ✓ Database sudah memiliki ' + userCount + ' pengguna. Melewati seed.');
        process.exit(0);
      }
    } catch (err) {
      console.warn('   ⚠️ Gagal memeriksa user:', err.message);
      process.exit(0);
    } finally {
      await prisma.\$disconnect();
    }
  " || SEED_REQUIRED=$?

  if [ "$SEED_REQUIRED" = "10" ]; then
    echo "   🌱 Basis data baru/kosong terdeteksi. Menjalankan seed data contoh..."
    node prisma/seed.js || echo "   ⚠️ Seed mengalami kendala, tetap melanjutkan start server."
  fi
fi

echo "✨ [NeuronMotion] Memulai server Express pada port ${PORT:-4000}..."
exec "$@"
