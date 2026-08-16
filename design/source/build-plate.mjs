import sharp from 'sharp';

const SRC = 'D:/Github-ADL/neuronmotion/design/source/plate-hand-source.jpg';
const OUT = 'D:/Github-ADL/neuronmotion/webapp/src/assets/plate-hand.webp';

const MARK = { x0: 1740, y0: 225, x1: 1830, y1: 315 };
const MARGIN = 150;
const ASPECT = 4 / 5;

const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

let hx0 = 1e9, hy0 = 1e9, hx1 = -1, hy1 = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const inMark = x >= MARK.x0 && x <= MARK.x1 && y >= MARK.y0 && y <= MARK.y1;
    if (!inMark && data[(y * width + x) * channels] < 170) {
      if (x < hx0) hx0 = x;
      if (y < hy0) hy0 = y;
      if (x > hx1) hx1 = x;
      if (y > hy1) hy1 = y;
    }
  }
}

const top = Math.max(0, hy0 - MARGIN);
const h = Math.min(height, hy1 + MARGIN) - top;
const w = Math.round(h * ASPECT);
let left = Math.max(0, Math.min(width - w, Math.round((hx0 + hx1) / 2 - w / 2)));
if (left + w > MARK.x0) left = Math.max(0, MARK.x0 - w - 1);
if (left > hx0 || left + w < hx1) throw new Error('tangan terpotong');
if (left + w > MARK.x0 && top < MARK.y1) throw new Error('tanda aksen masih di dalam potongan');

// Titik putih dinaikkan sehingga kertas menjadi putih murni.
//
// Ini syarat mutlak agar latar gambar larut ke halaman. mix-blend-mode
// multiply hanya menghilangkan putih murni; kertas krem 241..246 akan selalu
// menyisakan petak yang lebih gelap dari halaman. Hal yang sama berlaku
// terbalik di tema gelap: setelah invert, kertas ini menjadi hitam murni,
// dan screen menghilangkan hitam murni.
//
// Nilai pengali diambil sedikit di bawah piksel kertas paling gelap yang
// terukur, 241, supaya seluruh gradasi latar terpotong rata ke 255 dan masih
// tersisa ruang terhadap pembulatan kompresi WebP. Raster titiknya jauh lebih
// gelap sehingga tidak tersentuh.
const PAPER_MIN = 234;
const gain = 255 / PAPER_MIN;

const cleaned = sharp(SRC)
  .extract({ left, top, width: w, height: h })
  .greyscale()
  .linear(gain, 0);

const meta = await cleaned
  .clone()
  .resize(760, 950, { fit: 'inside' })
  .webp({ quality: 82 })
  .toFile(OUT);

// Verifikasi: keempat sudut harus putih murni, dan tangan harus tetap gelap.
const v = await sharp(OUT).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => v.data[(y * v.info.width + x) * v.info.channels];
const corners = [px(2, 2), px(v.info.width - 3, 2), px(2, v.info.height - 3), px(v.info.width - 3, v.info.height - 3)];
let darkest = 255;
for (let i = 0; i < v.data.length; i += v.info.channels) if (v.data[i] < darkest) darkest = v.data[i];

console.log(`potongan: ${w}x${h} di (${left},${top})`);
console.log(`keluaran: ${meta.width}x${meta.height}, ${(meta.size / 1024).toFixed(1)} KB`);
console.log('sudut (harus 255):', corners.join(', '));
console.log('piksel tergelap  :', darkest);

await sharp(OUT).jpeg({ quality: 84 }).toFile('D:/Github-ADL/neuronmotion/webapp/.plate-check.jpg');
