// Data gambar untuk tab Menggambar. Semua gambar memakai kotak 200 × 200.

const r1 = (n) => Math.round(n * 10) / 10;
const pt = ([x, y]) => `${r1(x)} ${r1(y)}`;
const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

/** Lingkaran/elips satu goresan, mulai dari atas lalu ke kiri seperti menulis huruf o. */
export const ellipse = (cx, cy, rx, ry = rx) =>
  `M${cx} ${cy - ry} A${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A${rx} ${ry} 0 1 0 ${cx} ${cy - ry}`;

/** Garis patah melewati titik-titik; `close` = kembali ke titik awal. */
export const poly = (pts, close = false) => `M${(close ? [...pts, pts[0]] : pts).map(pt).join(' L')}`;

/** Bintang n sudut, mulai dari ujung atas. */
export const starPoints = (cx, cy, R, r, n = 5) =>
  Array.from({ length: n * 2 }, (_, i) => polar(cx, cy, i % 2 ? r : R, -90 + (i * 180) / n));

/** Segi-n beraturan, mulai dari titik atas. */
const ngon = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => polar(cx, cy, r, -90 + (i * 360) / n));

/** Spiral dari tengah ke luar. */
function spiral(cx, cy, turns, rMax) {
  const n = turns * 24;
  return poly(Array.from({ length: n + 1 }, (_, i) => polar(cx, cy, (rMax * i) / n, -90 + i * 15)));
}

/** Garis luar kelopak bunga: n lengkungan di sekeliling titik tengah. */
function petals(cx, cy, n, rIn, rOut) {
  const step = 360 / n;
  let d = `M${pt(polar(cx, cy, rIn, -90))}`;
  for (let k = 0; k < n; k++) {
    const a = -90 + k * step;
    d += ` C${pt(polar(cx, cy, rOut, a + step * 0.05))} ${pt(polar(cx, cy, rOut, a + step * 0.95))} ${pt(polar(cx, cy, rIn, a + step))}`;
  }
  return d;
}

const heartL = 'M100 62 C94 48 80 36 62 36 C42 36 24 52 24 76 C24 112 60 140 100 170';
const heartR = 'M100 62 C106 48 120 36 138 36 C158 36 176 52 176 76 C176 112 140 140 100 170';
const heartFill = 'M100 62 C94 48 80 36 62 36 C42 36 24 52 24 76 C24 112 60 140 100 170 C140 140 176 112 176 76 C176 52 158 36 138 36 C120 36 106 48 100 62 Z';

// ---------- Warna (mewarnai & kanvas) ----------

export const COLORS = {
  merah: '#e8435f',
  oranye: '#f28c1e',
  kuning: '#ffd02a',
  hijau: '#4cb844',
  biru: '#2f8fe0',
  ungu: '#8f4fd9',
  'merah muda': '#f58ac0',
  cokelat: '#9a6235',
  hitam: '#33303f',
};

// ---------- Menelusuri garis, bentuk, dan gambar ----------
// `s` = goresan sesuai urutan menggambar; `fill` = warna yang muncul setelah selesai.

export const TRACE_ART = {
  // garis & bentuk
  tegak: { name: 'garis tegak', s: ['M50 30 L50 170', 'M100 30 L100 170', 'M150 30 L150 170'] },
  datar: { name: 'garis mendatar', s: ['M30 50 L170 50', 'M30 100 L170 100', 'M30 150 L170 150'] },
  pagar: { name: 'pagar', s: ['M45 40 L45 170', 'M100 40 L100 170', 'M155 40 L155 170', 'M25 80 L175 80', 'M25 135 L175 135'] },
  miring: { name: 'garis miring', s: ['M30 170 L80 30', 'M80 170 L130 30', 'M130 170 L180 30'] },
  gunung: { name: 'gunung', s: ['M15 160 L50 60 L85 160 L120 60 L155 160 L185 90'] },
  petir: { name: 'petir', s: ['M120 15 L60 105 L120 105 L70 190'], fill: [{ d: 'M120 15 L60 105 L120 105 L70 190 L150 85 L95 85 Z', c: '#ffd02a' }] },
  gelombang: { name: 'gelombang', s: ['M15 70 C40 30 60 30 85 70 C110 110 130 110 155 70 C165 55 175 50 185 50', 'M15 140 C40 100 60 100 85 140 C110 180 130 180 155 140 C165 125 175 120 185 120'] },
  bukit: { name: 'bukit', s: ['M15 160 C15 90 75 90 75 160 C75 100 125 100 125 160 C125 90 185 90 185 160'] },
  pelangi1: { name: 'lengkungan pelangi', s: ['M20 170 C20 60 180 60 180 170', 'M50 170 C50 95 150 95 150 170'] },
  lingkaran: { name: 'lingkaran', s: [ellipse(100, 100, 75)], fill: [{ d: ellipse(100, 100, 75), c: '#2f8fe0' }] },
  telur: { name: 'telur', s: [ellipse(100, 105, 55, 75)], fill: [{ d: ellipse(100, 105, 55, 75), c: '#fff1c9' }] },
  spiral: { name: 'spiral siput', s: [spiral(100, 100, 3, 80)] },
  segitiga: { name: 'segitiga', s: [poly([[100, 25], [25, 170], [175, 170]], true)], fill: [{ d: poly([[100, 25], [25, 170], [175, 170]], true), c: '#4cb844' }] },
  persegi: { name: 'persegi', s: [poly([[35, 35], [35, 165], [165, 165], [165, 35]], true)], fill: [{ d: poly([[35, 35], [35, 165], [165, 165], [165, 35]], true), c: '#f28c1e' }] },
  ketupat: { name: 'belah ketupat', s: [poly([[100, 15], [35, 100], [100, 185], [165, 100]], true)], fill: [{ d: poly([[100, 15], [35, 100], [100, 185], [165, 100]], true), c: '#8f4fd9' }] },
  bintang: { name: 'bintang', s: [poly(starPoints(100, 108, 90, 38), true)], fill: [{ d: poly(starPoints(100, 108, 90, 38), true), c: '#ffd02a' }] },
  hati: { name: 'hati', s: [heartL, heartR], fill: [{ d: heartFill, c: '#e8435f' }] },

  // gambar langkah demi langkah
  bola: {
    name: 'bola',
    s: [ellipse(100, 100, 70), 'M35 75 C75 100 125 100 165 75', 'M35 125 C75 100 125 100 165 125'],
    fill: [{ d: ellipse(100, 100, 70), c: '#2f8fe0' }],
  },
  matahari: {
    name: 'matahari',
    s: [ellipse(100, 100, 45), 'M100 40 L100 12', 'M160 100 L188 100', 'M100 160 L100 188', 'M40 100 L12 100'],
    fill: [{ d: ellipse(100, 100, 45), c: '#ffd02a' }],
  },
  balon: {
    name: 'balon',
    s: ['M100 25 C140 25 155 60 155 85 C155 118 128 140 100 140 C72 140 45 118 45 85 C45 60 60 25 100 25', 'M100 140 C88 158 112 170 100 190'],
    fill: [{ d: 'M100 25 C140 25 155 60 155 85 C155 118 128 140 100 140 C72 140 45 118 45 85 C45 60 60 25 100 25 Z', c: '#e8435f' }],
  },
  apel: {
    name: 'apel',
    s: [
      'M100 62 C80 48 40 52 38 95 C36 138 66 172 86 170 C94 169 96 166 100 166 C104 166 106 169 114 170 C134 172 164 138 162 95 C160 52 120 48 100 62',
      'M100 62 C100 48 96 38 90 30',
      'M104 54 C110 36 128 28 146 30 C142 48 124 56 104 54',
    ],
    fill: [
      { d: 'M100 62 C80 48 40 52 38 95 C36 138 66 172 86 170 C94 169 96 166 100 166 C104 166 106 169 114 170 C134 172 164 138 162 95 C160 52 120 48 100 62 Z', c: '#e8435f' },
      { d: 'M104 54 C110 36 128 28 146 30 C142 48 124 56 104 54 Z', c: '#4cb844' },
    ],
  },
  rumah: {
    name: 'rumah',
    s: ['M35 100 L100 35 L165 100', 'M50 90 L50 176 L150 176 L150 90', 'M86 176 L86 132 L114 132 L114 176', poly([[122, 110], [144, 110], [144, 130], [122, 130]], true)],
    fill: [
      { d: 'M50 90 L50 176 L150 176 L150 90 L100 40 Z', c: '#ffd02a' },
      { d: 'M35 100 L100 35 L165 100 L150 100 L100 50 L50 100 Z', c: '#e8435f' },
      { d: 'M86 176 L86 132 L114 132 L114 176 Z', c: '#9a6235' },
      { d: poly([[122, 110], [144, 110], [144, 130], [122, 130]], true), c: '#2f8fe0' },
    ],
  },
  ikan: {
    name: 'ikan',
    s: ['M35 100 C60 60 120 60 145 100 C120 140 60 140 35 100', 'M145 100 L180 72 L180 128 L145 100', 'M68 92 L68 98'],
    fill: [
      { d: 'M145 100 L180 72 L180 128 Z', c: '#ffd02a' },
      { d: 'M35 100 C60 60 120 60 145 100 C120 140 60 140 35 100 Z', c: '#f28c1e' },
    ],
  },
  pohon: {
    name: 'pohon',
    s: [
      'M60 110 C38 110 32 82 52 74 C48 50 76 38 92 48 C100 28 132 30 138 52 C160 50 172 76 156 92 C168 110 148 126 132 116 C122 128 98 128 92 118 C80 126 60 122 60 110',
      'M90 122 L88 180',
      'M110 122 L112 180',
    ],
    fill: [
      { d: 'M90 122 L88 180 L112 180 L110 122 Z', c: '#9a6235' },
      { d: 'M60 110 C38 110 32 82 52 74 C48 50 76 38 92 48 C100 28 132 30 138 52 C160 50 172 76 156 92 C168 110 148 126 132 116 C122 128 98 128 92 118 C80 126 60 122 60 110 Z', c: '#4cb844' },
    ],
  },
  eskrim: {
    name: 'es krim',
    s: ['M60 100 L100 182 L140 100', 'M60 100 C56 62 76 44 100 44 C124 44 144 62 140 100 Z', ellipse(100, 30, 10)],
    fill: [
      { d: 'M60 100 L100 182 L140 100 Z', c: '#d9a066' },
      { d: 'M60 100 C56 62 76 44 100 44 C124 44 144 62 140 100 Z', c: '#f58ac0' },
      { d: ellipse(100, 30, 10), c: '#e8435f' },
    ],
  },
  kucing: {
    name: 'kucing',
    s: [ellipse(100, 112, 50), 'M62 80 L62 38 L92 64', 'M108 64 L138 38 L138 80', 'M82 104 L82 110', 'M118 104 L118 110', 'M90 126 C95 133 100 132 100 126 C100 132 105 133 110 126'],
    fill: [{ d: `${ellipse(100, 112, 50)} M62 80 L62 38 L92 64 Z M108 64 L138 38 L138 80 Z`, c: '#f28c1e' }],
  },
  bunga: {
    name: 'bunga',
    s: [ellipse(100, 72, 16), petals(100, 72, 6, 22, 58), 'M100 116 L100 188', 'M100 165 C112 148 132 146 144 152 C134 166 116 170 100 165'],
    fill: [
      { d: `${petals(100, 72, 6, 22, 58)} Z`, c: '#f58ac0' },
      { d: ellipse(100, 72, 16), c: '#ffd02a' },
      { d: 'M100 165 C112 148 132 146 144 152 C134 166 116 170 100 165 Z', c: '#4cb844' },
    ],
  },
  mobil: {
    name: 'mobil',
    s: ['M25 140 L25 112 L60 108 L80 76 L128 76 L148 108 L176 112 L176 140 L25 140', poly([[86, 84], [122, 84], [136, 106], [72, 106]], true), ellipse(62, 142, 17), ellipse(140, 142, 17)],
    fill: [
      { d: 'M25 140 L25 112 L60 108 L80 76 L128 76 L148 108 L176 112 L176 140 Z', c: '#e8435f' },
      { d: poly([[86, 84], [122, 84], [136, 106], [72, 106]], true), c: '#bfe3ff' },
      { d: `${ellipse(62, 142, 17)} ${ellipse(140, 142, 17)}`, c: '#33303f' },
    ],
  },
  kupu: {
    name: 'kupu-kupu',
    s: [
      'M100 70 L100 150',
      'M96 104 C80 54 30 44 30 80 C30 104 64 110 96 106 C70 112 44 132 54 152 C64 170 90 152 96 118',
      'M104 104 C120 54 170 44 170 80 C170 104 136 110 104 106 C130 112 156 132 146 152 C136 170 110 152 104 118',
      'M98 72 C94 56 86 48 76 44',
      'M102 72 C106 56 114 48 124 44',
    ],
    fill: [
      { d: 'M96 104 C80 54 30 44 30 80 C30 104 64 110 96 106 C70 112 44 132 54 152 C64 170 90 152 96 118 Z', c: '#8f4fd9' },
      { d: 'M104 104 C120 54 170 44 170 80 C170 104 136 110 104 106 C130 112 156 132 146 152 C136 170 110 152 104 118 Z', c: '#8f4fd9' },
    ],
  },
  roket: {
    name: 'roket',
    s: [
      'M100 22 C124 46 130 90 124 150 L76 150 C70 90 76 46 100 22',
      ellipse(100, 88, 13),
      'M78 116 L52 160 L77 150',
      'M122 116 L148 160 L123 150',
      'M86 152 C86 170 100 186 100 186 C100 186 114 170 114 152',
    ],
    fill: [
      { d: 'M86 152 C86 170 100 186 100 186 C100 186 114 170 114 152 Z', c: '#f28c1e' },
      { d: 'M78 116 L52 160 L77 150 Z M122 116 L148 160 L123 150 Z', c: '#e8435f' },
      { d: 'M100 22 C124 46 130 90 124 150 L76 150 C70 90 76 46 100 22 Z', c: '#e6e9f2' },
      { d: ellipse(100, 88, 13), c: '#2f8fe0' },
    ],
  },
  robot: {
    name: 'robot',
    s: [
      'M100 34 L100 16',
      poly([[62, 34], [138, 34], [138, 88], [62, 88]], true),
      'M84 54 L84 62',
      'M116 54 L116 62',
      'M86 76 L114 76',
      poly([[55, 96], [145, 96], [145, 170], [55, 170]], true),
      'M55 110 L28 140',
      'M145 110 L172 140',
    ],
    fill: [
      { d: poly([[62, 34], [138, 34], [138, 88], [62, 88]], true), c: '#9fd4ff' },
      { d: poly([[55, 96], [145, 96], [145, 170], [55, 170]], true), c: '#8f9bb3' },
    ],
  },
  perahu: {
    name: 'perahu',
    s: ['M25 128 L175 128 L148 165 L52 165 L25 128', 'M100 128 L100 30', 'M104 38 L104 118 L160 118 L104 38', 'M15 182 C40 170 60 194 85 182 C110 170 130 194 155 182 C170 175 180 178 188 182'],
    fill: [
      { d: 'M25 128 L175 128 L148 165 L52 165 Z', c: '#9a6235' },
      { d: 'M104 38 L104 118 L160 118 Z', c: '#ffd02a' },
    ],
  },
  pelangi: {
    name: 'pelangi',
    s: ['M20 150 C20 40 180 40 180 150', 'M45 150 C45 75 155 75 155 150', 'M70 150 C70 108 130 108 130 150', 'M10 160 C10 140 40 136 48 150 C60 146 68 160 58 168 L14 168 C8 168 8 162 10 160'],
    fill: [
      { d: 'M20 150 C20 40 180 40 180 150 L155 150 C155 75 45 75 45 150 Z', c: '#e8435f' },
      { d: 'M45 150 C45 75 155 75 155 150 L130 150 C130 108 70 108 70 150 Z', c: '#ffd02a' },
    ],
  },

  // ---- garis & bentuk tambahan (supaya setiap level punya cukup banyak soal) ----
  // garis tegak & mendatar
  tangga: { name: 'tangga', s: ['M25 170 L25 135 L65 135 L65 100 L105 100 L105 65 L145 65 L145 30 L180 30'] },
  jendela: { name: 'jendela', s: [poly([[40, 40], [40, 160], [160, 160], [160, 40]], true), 'M100 40 L100 160', 'M40 100 L160 100'] },
  rel: { name: 'rel kereta', s: ['M20 75 L180 75', 'M20 125 L180 125', 'M45 55 L45 145', 'M85 55 L85 145', 'M125 55 L125 145', 'M165 55 L165 145'] },
  tambah: { name: 'tanda tambah', s: ['M100 30 L100 170', 'M30 100 L170 100'] },
  sisir: { name: 'sisir', s: ['M25 60 L175 60', 'M45 60 L45 150', 'M75 60 L75 150', 'M105 60 L105 150', 'M135 60 L135 150', 'M165 60 L165 150'] },
  meja: { name: 'meja', s: ['M25 70 L175 70', 'M45 70 L45 170', 'M155 70 L155 170'] },
  gawang: { name: 'gawang', s: ['M40 170 L40 50 L160 50 L160 170'] },
  kursi: { name: 'kursi', s: ['M60 30 L60 170', 'M60 100 L140 100 L140 170'] },
  bendera: { name: 'bendera', s: ['M60 185 L60 20', 'M60 30 L160 30 L160 90 L60 90'], fill: [{ d: 'M60 30 L160 30 L160 90 L60 90 Z', c: '#e8435f' }] },
  // garis miring & zigzag
  tenda: { name: 'tenda', s: ['M20 170 L100 30 L180 170', 'M100 30 L100 170'] },
  atap: { name: 'atap rumah', s: ['M20 130 L100 45 L180 130'] },
  gergaji: { name: 'gigi gergaji', s: ['M15 120 L35 80 L55 120 L75 80 L95 120 L115 80 L135 120 L155 80 L175 120'] },
  silang: { name: 'tanda silang', s: ['M40 40 L160 160', 'M160 40 L40 160'] },
  panah: { name: 'panah', s: ['M20 100 L170 100', 'M120 50 L170 100 L120 150'] },
  cemara: {
    name: 'pohon cemara',
    s: ['M100 20 L40 90 L80 90 L30 160 L170 160 L120 90 L160 90 L100 20'],
    fill: [{ d: 'M100 20 L40 90 L80 90 L30 160 L170 160 L120 90 L160 90 Z', c: '#4cb844' }],
  },
  hujan: { name: 'hujan miring', s: ['M50 30 L30 80', 'M100 30 L80 80', 'M150 30 L130 80', 'M75 110 L55 160', 'M125 110 L105 160', 'M175 110 L155 160'] },
  mahkota: {
    name: 'mahkota',
    s: ['M30 160 L30 60 L65 110 L100 40 L135 110 L170 60 L170 160 L30 160'],
    fill: [{ d: 'M30 160 L30 60 L65 110 L100 40 L135 110 L170 60 L170 160 Z', c: '#ffd02a' }],
  },
  pita: {
    name: 'pita',
    s: ['M100 100 L30 50 L30 150 L100 100 L170 50 L170 150 L100 100'],
    fill: [{ d: 'M100 100 L30 50 L30 150 Z M100 100 L170 50 L170 150 Z', c: '#f58ac0' }],
  },
  // garis lengkung
  senyum: { name: 'senyuman', s: ['M40 80 C50 165 150 165 160 80'] },
  kail: { name: 'kail pancing', s: ['M120 20 L120 130 C120 175 60 175 60 135 L75 120'] },
  ombak: { name: 'ombak', s: ['M15 120 C30 80 60 80 70 110 C75 125 90 125 95 110 C105 80 135 80 145 110 C150 125 165 125 170 110 C175 100 180 95 188 95'] },
  ular: { name: 'ular', s: ['M30 45 C125 40 130 100 100 100 C70 100 75 160 170 155'] },
  sabit: {
    name: 'bulan sabit',
    s: ['M130 25 C55 35 45 165 130 175 C85 145 85 55 130 25'],
    fill: [{ d: 'M130 25 C55 35 45 165 130 175 C85 145 85 55 130 25 Z', c: '#ffd02a' }],
  },
  jembatan: { name: 'jembatan', s: ['M15 140 C60 55 140 55 185 140', 'M15 140 L185 140'] },
  busur: { name: 'busur panah', s: ['M70 25 C150 50 150 150 70 175', 'M70 25 L70 175'] },
  rumput: { name: 'rumput', s: ['M25 165 C30 125 35 105 28 80', 'M60 165 C62 125 70 105 82 88', 'M100 165 C100 125 104 98 98 70', 'M140 165 C140 125 148 105 160 90', 'M175 165 C175 125 180 105 172 82'] },
  kerang: {
    name: 'kerang',
    s: ['M100 170 C40 160 20 85 60 52 C82 32 118 32 140 52 C180 85 160 160 100 170', 'M100 170 L70 58', 'M100 170 L100 42', 'M100 170 L130 58'],
    fill: [{ d: 'M100 170 C40 160 20 85 60 52 C82 32 118 32 140 52 C180 85 160 160 100 170 Z', c: '#f58ac0' }],
  },
  // lingkaran
  kacamata: { name: 'kacamata', s: [ellipse(58, 100, 36), ellipse(142, 100, 36), 'M94 98 C98 90 102 90 106 98'] },
  roda: { name: 'roda', s: [ellipse(100, 100, 75), 'M100 25 L100 175', 'M25 100 L175 100'] },
  jam: { name: 'jam', s: [ellipse(100, 100, 75), 'M100 100 L100 55', 'M100 100 L135 100'], fill: [{ d: ellipse(100, 100, 75), c: '#fff1c9' }] },
  gelembung: { name: 'gelembung', s: [ellipse(65, 125, 42), ellipse(135, 65, 30), ellipse(150, 150, 20)], fill: [{ d: `${ellipse(65, 125, 42)} ${ellipse(135, 65, 30)} ${ellipse(150, 150, 20)}`, c: '#bfe3ff' }] },
  kancing: {
    name: 'kancing',
    s: [ellipse(100, 100, 70), 'M82 82 L82 88', 'M118 82 L118 88', 'M82 114 L82 120', 'M118 114 L118 120'],
    fill: [{ d: ellipse(100, 100, 70), c: '#2f8fe0' }],
  },
  rantai: { name: 'rantai', s: [ellipse(55, 100, 36), ellipse(100, 100, 36), ellipse(145, 100, 36)] },
  mata: { name: 'mata', s: [ellipse(100, 100, 80, 50), ellipse(100, 100, 22)], fill: [{ d: ellipse(100, 100, 22), c: '#9a6235' }] },
  saljuboneka: {
    name: 'boneka salju',
    s: [ellipse(100, 55, 32), ellipse(100, 135, 50)],
    fill: [{ d: `${ellipse(100, 55, 32)} ${ellipse(100, 135, 50)}`, c: '#e6f3ff' }],
  },
  cincin: { name: 'cincin', s: [ellipse(100, 105, 70), ellipse(100, 105, 50)], fill: [{ d: `${ellipse(100, 105, 70)} ${ellipse(100, 105, 50)}`, c: '#ffd02a' }] },
  // bangun datar
  persegipanjang: { name: 'persegi panjang', s: [poly([[20, 55], [20, 145], [180, 145], [180, 55]], true)], fill: [{ d: poly([[20, 55], [20, 145], [180, 145], [180, 55]], true), c: '#2f8fe0' }] },
  segilima: { name: 'segi lima', s: [poly(ngon(100, 105, 80, 5), true)], fill: [{ d: poly(ngon(100, 105, 80, 5), true), c: '#f58ac0' }] },
  segienam: { name: 'segi enam', s: [poly(ngon(100, 100, 80, 6), true)], fill: [{ d: poly(ngon(100, 100, 80, 6), true), c: '#ffd02a' }] },
  trapesium: { name: 'trapesium', s: [poly([[60, 50], [20, 155], [180, 155], [140, 50]], true)], fill: [{ d: poly([[60, 50], [20, 155], [180, 155], [140, 50]], true), c: '#4cb844' }] },
  jajargenjang: { name: 'jajar genjang', s: [poly([[60, 50], [15, 150], [140, 150], [185, 50]], true)], fill: [{ d: poly([[60, 50], [15, 150], [140, 150], [185, 50]], true), c: '#8f4fd9' }] },
  oval: { name: 'oval', s: [ellipse(100, 100, 85, 55)], fill: [{ d: ellipse(100, 100, 85, 55), c: '#f28c1e' }] },
  layangbangun: { name: 'layang-layang', s: [poly([[100, 15], [45, 75], [100, 185], [155, 75]], true)], fill: [{ d: poly([[100, 15], [45, 75], [100, 185], [155, 75]], true), c: '#e8435f' }] },

  // ---- gambar tambahan ----
  jeruk: {
    name: 'jeruk',
    s: [ellipse(100, 112, 65), 'M100 47 C108 27 130 21 150 27 C140 45 122 51 100 47'],
    fill: [{ d: ellipse(100, 112, 65), c: '#f28c1e' }, { d: 'M100 47 C108 27 130 21 150 27 C140 45 122 51 100 47 Z', c: '#4cb844' }],
  },
  awan: {
    name: 'awan',
    s: ['M55 150 C25 150 20 110 50 105 C45 70 90 55 105 85 C120 55 170 65 162 105 C190 110 185 150 155 150 L55 150'],
    fill: [{ d: 'M55 150 C25 150 20 110 50 105 C45 70 90 55 105 85 C120 55 170 65 162 105 C190 110 185 150 155 150 Z', c: '#cde9ff' }],
  },
  bulan: {
    name: 'bulan',
    s: ['M130 25 C55 35 45 165 130 175 C85 145 85 55 130 25', 'M150 60 L150 66', 'M165 105 L165 111'],
    fill: [{ d: 'M130 25 C55 35 45 165 130 175 C85 145 85 55 130 25 Z', c: '#ffd02a' }],
  },
  donat: {
    name: 'donat',
    s: [ellipse(100, 100, 72), ellipse(100, 100, 25)],
    fill: [{ d: `${ellipse(100, 100, 72)} ${ellipse(100, 100, 25)}`, c: '#d9a066' }],
  },
  daun: {
    name: 'daun',
    s: ['M30 170 C30 80 90 30 170 30 C170 110 120 170 30 170', 'M30 170 L130 70'],
    fill: [{ d: 'M30 170 C30 80 90 30 170 30 C170 110 120 170 30 170 Z', c: '#4cb844' }],
  },
  layangan: {
    name: 'layangan',
    s: [poly([[100, 15], [160, 75], [100, 155], [40, 75]], true), 'M100 155 C88 168 112 178 100 192'],
    fill: [{ d: poly([[100, 15], [160, 75], [100, 155], [40, 75]], true), c: '#e8435f' }],
  },
  lolipop: {
    name: 'lolipop',
    s: [ellipse(100, 75, 55), 'M100 130 L100 190'],
    fill: [{ d: ellipse(100, 75, 55), c: '#f58ac0' }],
  },
  ceri: {
    name: 'ceri',
    s: [ellipse(62, 145, 28), ellipse(138, 145, 28), 'M62 117 C68 75 90 45 110 28', 'M138 117 C132 75 122 48 110 28'],
    fill: [{ d: `${ellipse(62, 145, 28)} ${ellipse(138, 145, 28)}`, c: '#e8435f' }],
  },
  payung: {
    name: 'payung',
    s: ['M20 100 C25 35 175 35 180 100 C160 85 140 85 120 100 C110 88 90 88 80 100 C60 85 40 85 20 100', 'M100 92 L100 165 C100 185 75 185 72 165'],
    fill: [{ d: 'M20 100 C25 35 175 35 180 100 C160 85 140 85 120 100 C110 88 90 88 80 100 C60 85 40 85 20 100 Z', c: '#2f8fe0' }],
  },
  jamur: {
    name: 'jamur',
    s: ['M30 110 C30 40 170 40 170 110 L30 110', 'M75 110 L70 175 L130 175 L125 110', ellipse(80, 80, 10), ellipse(125, 75, 10)],
    fill: [{ d: 'M75 110 L70 175 L130 175 L125 110 Z', c: '#fff1c9' }, { d: 'M30 110 C30 40 170 40 170 110 Z', c: '#e8435f' }],
  },
  topi: {
    name: 'topi',
    s: ['M20 150 L180 150', 'M50 150 L60 60 L140 60 L150 150', 'M55 118 L145 118'],
    fill: [{ d: 'M50 150 L60 60 L140 60 L150 150 Z', c: '#8f4fd9' }],
  },
  gelas: {
    name: 'gelas',
    s: ['M55 35 L70 175 L130 175 L145 35', 'M60 80 L140 80'],
    fill: [{ d: 'M60 80 L140 80 L130 175 L70 175 Z', c: '#9fd4ff' }],
  },
  wortel: {
    name: 'wortel',
    s: ['M55 62 C80 55 125 55 150 62 L102 185 L55 62', 'M88 58 C80 38 74 26 66 16', 'M103 58 L103 12', 'M118 58 C126 38 132 26 140 16'],
    fill: [{ d: 'M55 62 C80 55 125 55 150 62 L102 185 Z', c: '#f28c1e' }],
  },
  siput: {
    name: 'siput',
    s: [spiral(115, 95, 2, 50), 'M25 150 L170 150 C182 150 185 135 172 132', 'M40 148 L30 105', 'M52 148 L56 105'],
    fill: [{ d: ellipse(115, 95, 50), c: '#f28c1e' }],
  },
  kue: {
    name: 'kue ulang tahun',
    s: [poly([[40, 110], [160, 110], [160, 180], [40, 180]], true), 'M40 132 C55 147 70 147 80 132 C90 147 110 147 120 132 C130 147 150 147 160 132', 'M100 110 L100 72', 'M100 64 C90 54 100 40 100 40 C100 40 110 54 100 64'],
    fill: [{ d: poly([[40, 110], [160, 110], [160, 180], [40, 180]], true), c: '#f58ac0' }, { d: 'M100 64 C90 54 100 40 100 40 C100 40 110 54 100 64 Z', c: '#f28c1e' }],
  },
  pensil: {
    name: 'pensil',
    s: [poly([[40, 80], [150, 80], [150, 120], [40, 120]], true), 'M150 80 L185 100 L150 120', 'M40 80 L22 80 L22 120 L40 120'],
    fill: [
      { d: poly([[40, 80], [150, 80], [150, 120], [40, 120]], true), c: '#ffd02a' },
      { d: 'M150 80 L185 100 L150 120 Z', c: '#d9a066' },
      { d: 'M40 80 L22 80 L22 120 L40 120 Z', c: '#f58ac0' },
    ],
  },
  ulat: {
    name: 'ulat',
    s: [ellipse(38, 125, 22), ellipse(78, 115, 24), ellipse(120, 118, 24), ellipse(160, 102, 26), 'M152 78 L142 56', 'M168 78 L178 56', 'M166 97 L166 102'],
    fill: [{ d: `${ellipse(38, 125, 22)} ${ellipse(78, 115, 24)} ${ellipse(120, 118, 24)} ${ellipse(160, 102, 26)}`, c: '#4cb844' }],
  },
  jamweker: {
    name: 'jam weker',
    s: [ellipse(100, 108, 65), 'M100 108 L100 68', 'M100 108 L132 122', ellipse(55, 45, 14), ellipse(145, 45, 14), 'M62 160 L50 182', 'M138 160 L150 182'],
    fill: [{ d: ellipse(100, 108, 65), c: '#fff1c9' }, { d: `${ellipse(55, 45, 14)} ${ellipse(145, 45, 14)}`, c: '#e8435f' }],
  },
  tulip: {
    name: 'tulip',
    s: ['M60 50 L80 75 L100 45 L120 75 L140 50 C150 100 130 120 100 120 C70 120 50 100 60 50', 'M100 120 L100 186', 'M100 162 C80 142 60 142 50 152 C65 172 85 174 100 166'],
    fill: [{ d: 'M60 50 L80 75 L100 45 L120 75 L140 50 C150 100 130 120 100 120 C70 120 50 100 60 50 Z', c: '#e8435f' }, { d: 'M100 162 C80 142 60 142 50 152 C65 172 85 174 100 166 Z', c: '#4cb844' }],
  },
  bus: {
    name: 'bus',
    s: [
      poly([[20, 60], [180, 60], [180, 148], [20, 148]], true),
      poly([[35, 75], [75, 75], [75, 105], [35, 105]], true),
      poly([[90, 75], [130, 75], [130, 105], [90, 105]], true),
      poly([[145, 75], [168, 75], [168, 105], [145, 105]], true),
      ellipse(55, 150, 16),
      ellipse(145, 150, 16),
    ],
    fill: [
      { d: poly([[20, 60], [180, 60], [180, 148], [20, 148]], true), c: '#ffd02a' },
      { d: `${poly([[35, 75], [75, 75], [75, 105], [35, 105]], true)} ${poly([[90, 75], [130, 75], [130, 105], [90, 105]], true)} ${poly([[145, 75], [168, 75], [168, 105], [145, 105]], true)}`, c: '#bfe3ff' },
      { d: `${ellipse(55, 150, 16)} ${ellipse(145, 150, 16)}`, c: '#33303f' },
    ],
  },
  kelinci: {
    name: 'kelinci',
    s: [ellipse(100, 128, 45), 'M80 88 C65 42 70 15 82 15 C95 15 98 50 92 84', 'M108 84 C102 50 105 15 118 15 C130 15 135 42 120 88', 'M84 120 L84 126', 'M116 120 L116 126', 'M94 140 L100 146 L106 140'],
    fill: [{ d: ellipse(100, 128, 45), c: '#eadcf5' }],
  },
  beruang: {
    name: 'beruang',
    s: [ellipse(100, 112, 55), ellipse(56, 62, 18), ellipse(144, 62, 18), ellipse(100, 132, 20), 'M80 100 L80 106', 'M120 100 L120 106'],
    fill: [{ d: `${ellipse(56, 62, 18)} ${ellipse(144, 62, 18)} ${ellipse(100, 112, 55)}`, c: '#9a6235' }, { d: ellipse(100, 132, 20), c: '#d9a066' }],
  },
  burung: {
    name: 'burung',
    s: ['M40 110 C40 70 80 55 110 70 C130 45 165 55 165 85 C165 125 130 150 90 150 C60 150 40 135 40 110', 'M165 80 L186 88 L165 96', 'M72 108 C88 92 115 98 120 120 C100 125 84 122 72 108', 'M140 76 L140 82', 'M88 150 L83 180', 'M110 150 L115 180'],
    fill: [{ d: 'M40 110 C40 70 80 55 110 70 C130 45 165 55 165 85 C165 125 130 150 90 150 C60 150 40 135 40 110 Z', c: '#2f8fe0' }, { d: 'M165 80 L186 88 L165 96 Z', c: '#f28c1e' }],
  },
  kereta: {
    name: 'kereta api',
    s: [
      poly([[110, 50], [170, 50], [170, 148], [110, 148]], true),
      poly([[30, 90], [110, 90], [110, 148], [30, 148]], true),
      poly([[45, 90], [45, 55], [72, 55], [72, 90]], true),
      ellipse(55, 152, 16),
      ellipse(100, 152, 16),
      ellipse(145, 152, 16),
    ],
    fill: [
      { d: poly([[110, 50], [170, 50], [170, 148], [110, 148]], true), c: '#2f8fe0' },
      { d: `${poly([[30, 90], [110, 90], [110, 148], [30, 148]], true)} ${poly([[45, 90], [45, 55], [72, 55], [72, 90]], true)}`, c: '#e8435f' },
      { d: `${ellipse(55, 152, 16)} ${ellipse(100, 152, 16)} ${ellipse(145, 152, 16)}`, c: '#33303f' },
    ],
  },
  pesawat: {
    name: 'pesawat',
    s: [
      'M20 100 C20 88 35 82 55 82 L160 82 C178 82 190 92 190 100 C190 108 178 118 160 118 L55 118 C35 118 20 112 20 100',
      'M95 82 L70 30 L92 30 L130 82',
      'M95 118 L70 170 L92 170 L130 118',
      'M35 84 L25 52 L45 52 L60 82',
      'M150 95 L150 101',
      'M165 95 L165 101',
    ],
    fill: [
      { d: 'M95 82 L70 30 L92 30 L130 82 Z M95 118 L70 170 L92 170 L130 118 Z M35 84 L25 52 L45 52 L60 82 Z', c: '#2f8fe0' },
      { d: 'M20 100 C20 88 35 82 55 82 L160 82 C178 82 190 92 190 100 C190 108 178 118 160 118 L55 118 C35 118 20 112 20 100 Z', c: '#e6e9f2' },
    ],
  },
  kastil: {
    name: 'istana',
    s: [
      'M30 180 L30 60 L50 60 L50 80 L70 80 L70 60 L90 60 L90 80 L110 80 L110 60 L130 60 L130 80 L150 80 L150 60 L170 60 L170 180 L30 180',
      'M80 180 L80 138 C80 116 120 116 120 138 L120 180',
      poly([[45, 100], [60, 100], [60, 120], [45, 120]], true),
      poly([[140, 100], [155, 100], [155, 120], [140, 120]], true),
      'M100 60 L100 22 L126 32 L100 42',
    ],
    fill: [
      { d: 'M30 180 L30 60 L50 60 L50 80 L70 80 L70 60 L90 60 L90 80 L110 80 L110 60 L130 60 L130 80 L150 80 L150 60 L170 60 L170 180 Z', c: '#cfd3dd' },
      { d: 'M80 180 L80 138 C80 116 120 116 120 138 L120 180 Z', c: '#9a6235' },
      { d: 'M100 22 L126 32 L100 42 Z', c: '#e8435f' },
    ],
  },
  kura: {
    name: 'kura-kura',
    s: ['M40 130 C40 70 160 70 160 130 L40 130', ellipse(176, 118, 15), 'M55 130 L50 156 L75 156 L75 130', 'M125 130 L125 156 L150 156 L145 130', 'M70 130 L85 96 L115 96 L130 130', 'M40 128 L22 136'],
    fill: [
      { d: 'M55 130 L50 156 L75 156 L75 130 Z M125 130 L125 156 L150 156 L145 130 Z', c: '#9be07f' },
      { d: ellipse(176, 118, 15), c: '#9be07f' },
      { d: 'M40 130 C40 70 160 70 160 130 Z', c: '#4cb844' },
    ],
  },
  kemah: {
    name: 'tenda kemah',
    s: ['M20 172 L100 42 L180 172 L20 172', 'M100 72 L75 172', 'M100 72 L125 172', 'M100 42 L100 16 L126 24 L100 32'],
    fill: [
      { d: 'M20 172 L100 42 L180 172 Z', c: '#f28c1e' },
      { d: 'M100 72 L75 172 L125 172 Z', c: '#9a6235' },
      { d: 'M100 16 L126 24 L100 32 Z', c: '#e8435f' },
    ],
  },
  gitar: {
    name: 'gitar',
    s: ['M100 100 C62 90 42 120 52 148 C62 180 138 180 148 148 C158 120 138 90 100 100', poly([[92, 100], [92, 18], [108, 18], [108, 100]], true), ellipse(100, 142, 14), 'M100 30 L100 172'],
    fill: [{ d: 'M100 100 C62 90 42 120 52 148 C62 180 138 180 148 148 C158 120 138 90 100 100 Z', c: '#d9a066' }, { d: poly([[92, 100], [92, 18], [108, 18], [108, 100]], true), c: '#9a6235' }],
  },
  truk: {
    name: 'truk',
    s: [poly([[20, 60], [120, 60], [120, 148], [20, 148]], true), 'M120 90 L160 90 L180 120 L180 148 L120 148', poly([[130, 98], [156, 98], [170, 120], [130, 120]], true), ellipse(50, 152, 17), ellipse(150, 152, 17)],
    fill: [
      { d: poly([[20, 60], [120, 60], [120, 148], [20, 148]], true), c: '#4cb844' },
      { d: 'M120 90 L160 90 L180 120 L180 148 L120 148 Z', c: '#e8435f' },
      { d: poly([[130, 98], [156, 98], [170, 120], [130, 120]], true), c: '#bfe3ff' },
      { d: `${ellipse(50, 152, 17)} ${ellipse(150, 152, 17)}`, c: '#33303f' },
    ],
  },
  bungamatahari: {
    name: 'bunga matahari',
    s: [ellipse(100, 78, 24), petals(100, 78, 10, 30, 62), 'M100 140 L100 190', 'M100 172 C114 152 138 150 150 158 C138 175 116 178 100 172'],
    fill: [
      { d: `${petals(100, 78, 10, 30, 62)} Z`, c: '#ffd02a' },
      { d: ellipse(100, 78, 24), c: '#9a6235' },
      { d: 'M100 172 C114 152 138 150 150 158 C138 175 116 178 100 172 Z', c: '#4cb844' },
    ],
  },
  paus: {
    name: 'ikan paus',
    s: ['M25 112 C25 62 120 52 158 90 L185 60 L185 132 L158 116 C130 150 25 162 25 112', 'M60 100 L60 106', 'M70 56 L70 30', 'M70 30 C60 20 55 24 50 30', 'M70 30 C80 20 85 24 90 30'],
    fill: [{ d: 'M25 112 C25 62 120 52 158 90 L185 60 L185 132 L158 116 C130 150 25 162 25 112 Z', c: '#2f8fe0' }],
  },
};

// ---------- Mewarnai ----------
// Bagian digambar sesuai urutan (yang belakang lebih dulu). `at` = letak angka/nama warna.

const rays = Array.from({ length: 8 }, (_, k) => {
  const a = -90 + k * 45;
  return poly([polar(100, 100, 54, a - 11), polar(100, 100, 90, a), polar(100, 100, 54, a + 11)], true);
}).join(' ');
const band = (R, r) => `M${100 - R} 165 A${R} ${R} 0 0 1 ${100 + R} 165 L${100 + r} 165 A${r} ${r} 0 0 0 ${100 - r} 165 Z`;
const circlePath = (cx, cy, r) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
const petalBlobs = Array.from({ length: 5 }, (_, k) => {
  const [x, y] = polar(100, 78, 30, -90 + k * 72);
  return circlePath(r1(x), r1(y), 22);
}).join(' ');

export const COLOR_PICTURES = [
  {
    name: 'matahari',
    regions: [
      { label: 'sinar', color: 'oranye', d: rays, at: [100, 30] },
      { label: 'matahari', color: 'kuning', d: circlePath(100, 100, 44), at: [100, 100] },
    ],
    lines: ['M84 92 L84 98', 'M116 92 L116 98', 'M86 112 C94 120 106 120 114 112'],
  },
  {
    name: 'pohon',
    regions: [
      { label: 'batang', color: 'cokelat', d: 'M88 116 L86 180 L114 180 L112 116 Z', at: [100, 155] },
      { label: 'daun', color: 'hijau', d: 'M60 110 C38 110 32 82 52 74 C48 50 76 38 92 48 C100 28 132 30 138 52 C160 50 172 76 156 92 C168 110 148 126 132 116 C122 128 98 128 92 118 C80 126 60 122 60 110 Z', at: [100, 84] },
    ],
  },
  {
    name: 'es krim',
    regions: [
      { label: 'cone', color: 'cokelat', d: 'M58 96 L100 180 L142 96 Z', at: [100, 124] },
      { label: 'es krim', color: 'merah muda', d: 'M56 98 C50 60 76 40 100 40 C124 40 150 60 144 98 Z', at: [100, 72] },
    ],
  },
  {
    name: 'semangka',
    regions: [
      { label: 'kulit', color: 'hijau', d: 'M18 90 A82 82 0 0 0 182 90 Z', at: [100, 164] },
      { label: 'buah', color: 'merah', d: 'M34 90 A66 66 0 0 0 166 90 Z', at: [100, 118] },
    ],
    lines: ['M70 108 L72 116', 'M100 128 L100 136', 'M130 108 L128 116', 'M86 100 L87 106', 'M114 100 L113 106'],
  },
  {
    name: 'apel',
    regions: [
      { label: 'tangkai', color: 'cokelat', d: 'M95 64 C95 50 91 40 85 32 L92 28 C100 38 104 50 104 64 Z', at: [90, 40] },
      { label: 'daun', color: 'hijau', d: 'M106 56 C110 36 128 26 150 28 C146 48 128 58 106 56 Z', at: [130, 42] },
      { label: 'apel', color: 'merah', d: 'M100 62 C80 48 40 52 38 95 C36 138 66 172 86 170 C94 169 96 166 100 166 C104 166 106 169 114 170 C134 172 164 138 162 95 C160 52 120 48 100 62 Z', at: [100, 115] },
    ],
  },
  {
    name: 'rumah',
    regions: [
      { label: 'dinding', color: 'kuning', d: 'M50 100 L150 100 L150 176 L50 176 Z', at: [68, 130] },
      { label: 'atap', color: 'merah', d: 'M34 104 L100 40 L166 104 Z', at: [100, 82] },
      { label: 'pintu', color: 'cokelat', d: 'M86 128 L114 128 L114 176 L86 176 Z', at: [100, 154] },
      { label: 'jendela', color: 'biru', d: 'M122 112 L146 112 L146 136 L122 136 Z', at: [134, 124] },
    ],
  },
  {
    name: 'bunga',
    regions: [
      { label: 'batang', color: 'hijau', d: 'M96 110 L96 186 L104 186 L104 110 Z M104 156 C116 138 138 136 150 142 C140 158 122 162 104 160 Z', at: [128, 150] },
      { label: 'kelopak', color: 'merah muda', d: petalBlobs, at: [100, 42] },
      { label: 'tengah bunga', color: 'kuning', d: circlePath(100, 78, 17), at: [100, 78] },
    ],
  },
  {
    name: 'ikan',
    regions: [
      { label: 'ekor', color: 'kuning', d: 'M136 100 L178 68 L178 132 Z', at: [164, 100] },
      { label: 'sirip', color: 'merah', d: 'M76 76 C82 50 110 48 120 74 Z', at: [98, 64] },
      { label: 'badan', color: 'oranye', d: 'M40 100 C40 76 70 68 95 68 C120 68 145 80 145 100 C145 120 120 132 95 132 C70 132 40 124 40 100 Z', at: [100, 104] },
    ],
    lines: ['M64 94 L64 100', 'M50 112 C56 116 62 116 66 112'],
  },
  {
    name: 'mobil',
    regions: [
      { label: 'badan mobil', color: 'merah', d: 'M24 142 L24 112 L60 106 L80 74 L128 74 L148 106 L176 112 L176 142 Z', at: [54, 126] },
      { label: 'jendela', color: 'biru', d: 'M86 82 L122 82 L136 104 L72 104 Z', at: [104, 94] },
      { label: 'roda', color: 'hitam', d: `${circlePath(62, 144, 17)} ${circlePath(140, 144, 17)}`, at: [[62, 144], [140, 144]] },
    ],
  },
  {
    name: 'perahu',
    regions: [
      { label: 'perahu', color: 'cokelat', d: 'M30 128 L170 128 L146 166 L54 166 Z', at: [100, 144] },
      { label: 'layar', color: 'kuning', d: 'M104 40 L104 120 L158 120 Z', at: [120, 100] },
      { label: 'bendera', color: 'merah', d: 'M98 24 L98 44 L70 34 Z', at: [88, 34] },
      { label: 'air', color: 'biru', d: 'M8 160 C30 150 50 172 72 160 C94 150 114 172 136 160 C158 150 176 166 192 160 L192 194 L8 194 Z', at: [100, 182] },
    ],
    lines: ['M100 128 L100 20'],
  },
  {
    name: 'kupu-kupu',
    regions: [
      { label: 'sayap atas', color: 'ungu', d: 'M96 96 C80 50 30 40 30 76 C30 100 64 108 96 104 Z M104 96 C120 50 170 40 170 76 C170 100 136 108 104 104 Z', at: [[58, 78], [142, 78]] },
      { label: 'sayap bawah', color: 'merah muda', d: 'M96 108 C70 112 44 130 54 152 C64 170 90 150 96 120 Z M104 108 C130 112 156 130 146 152 C136 170 110 150 104 120 Z', at: [[70, 140], [130, 140]] },
      { label: 'badan', color: 'cokelat', d: 'M100 72 C106 72 108 90 108 112 C108 134 106 152 100 152 C94 152 92 134 92 112 C92 90 94 72 100 72 Z', at: [100, 116] },
    ],
    lines: ['M98 74 C94 58 86 50 76 46', 'M102 74 C106 58 114 50 124 46'],
  },
  {
    name: 'pelangi',
    regions: [
      { label: 'merah', color: 'merah', d: band(92, 78), at: [100, 80] },
      { label: 'oranye', color: 'oranye', d: band(78, 64), at: [100, 94] },
      { label: 'kuning', color: 'kuning', d: band(64, 50), at: [100, 108] },
      { label: 'hijau', color: 'hijau', d: band(50, 36), at: [100, 122] },
      { label: 'biru', color: 'biru', d: band(36, 22), at: [100, 136] },
      { label: 'ungu', color: 'ungu', d: band(22, 8), at: [100, 150] },
    ],
  },
  // 2 bagian
  {
    name: 'jamur',
    regions: [
      { label: 'batang', color: 'kuning', d: 'M75 108 L70 175 L130 175 L125 108 Z', at: [100, 145] },
      { label: 'topi jamur', color: 'merah', d: 'M30 110 C30 40 170 40 170 110 Z', at: [100, 82] },
    ],
  },
  {
    name: 'lolipop',
    regions: [
      { label: 'tangkai', color: 'cokelat', d: 'M95 125 L95 190 L105 190 L105 125 Z', at: [100, 165] },
      { label: 'permen', color: 'merah muda', d: circlePath(100, 75, 55), at: [100, 75] },
    ],
    lines: ['M100 75 C112 75 112 90 100 90 C84 90 82 66 100 62 C124 58 130 92 108 102'],
  },
  {
    name: 'wortel',
    regions: [
      { label: 'daun', color: 'hijau', d: 'M85 60 C70 30 75 15 90 20 C95 35 100 45 100 60 C100 45 105 35 110 20 C125 15 130 30 115 60 Z', at: [100, 38] },
      { label: 'wortel', color: 'oranye', d: 'M55 62 C80 55 125 55 150 62 L102 185 Z', at: [100, 100] },
    ],
    lines: ['M80 90 L95 92', 'M110 120 L124 118', 'M92 148 L103 150'],
  },
  {
    name: 'stroberi',
    regions: [
      { label: 'buah', color: 'merah', d: 'M50 65 C50 58 150 58 150 65 C150 120 115 175 100 182 C85 175 50 120 50 65 Z', at: [100, 112] },
      { label: 'daun', color: 'hijau', d: 'M60 55 L80 40 L100 55 L120 40 L140 55 L120 68 L80 68 Z', at: [100, 55] },
    ],
    lines: ['M80 90 L80 96', 'M120 90 L120 96', 'M100 138 L100 144', 'M84 125 L84 131', 'M116 125 L116 131'],
  },
  {
    name: 'jeruk',
    regions: [
      { label: 'daun', color: 'hijau', d: 'M100 48 C108 28 130 22 150 28 C140 46 122 52 100 48 Z', at: [126, 38] },
      { label: 'jeruk', color: 'oranye', d: circlePath(100, 115, 65), at: [100, 118] },
    ],
  },
  {
    name: 'ceri',
    regions: [
      { label: 'daun', color: 'hijau', d: 'M108 30 C120 14 146 14 156 24 C142 38 120 38 108 30 Z', at: [132, 27] },
      { label: 'buah ceri', color: 'merah', d: `${circlePath(65, 142, 30)} ${circlePath(135, 142, 30)}`, at: [[65, 142], [135, 142]] },
    ],
    lines: ['M65 112 C70 75 90 45 108 30', 'M135 112 C130 75 120 50 108 30'],
  },
  {
    name: 'payung',
    regions: [
      { label: 'gagang', color: 'cokelat', d: 'M95 98 L95 168 C95 184 70 184 68 168 L77 168 C78 175 86 175 86 168 L86 98 Z', at: [90, 130] },
      { label: 'payung', color: 'biru', d: 'M20 100 C25 35 175 35 180 100 C160 85 140 85 120 100 C110 88 90 88 80 100 C60 85 40 85 20 100 Z', at: [100, 65] },
    ],
  },
  {
    name: 'terong',
    regions: [
      { label: 'terong', color: 'ungu', d: 'M75 62 C60 100 50 150 80 175 C110 195 150 170 140 120 C135 95 125 75 125 62 Z', at: [100, 128] },
      { label: 'daun', color: 'hijau', d: 'M68 60 C80 38 120 38 132 60 C116 72 84 72 68 60 Z', at: [100, 56] },
    ],
    lines: ['M100 42 L100 22'],
  },
  // 3–4 bagian
  {
    name: 'kue ulang tahun',
    regions: [
      { label: 'piring', color: 'biru', d: 'M20 172 L180 172 L168 188 L32 188 Z', at: [100, 181] },
      { label: 'kue', color: 'merah muda', d: 'M40 108 L160 108 L160 172 L40 172 Z', at: [100, 145] },
      { label: 'lilin', color: 'kuning', d: 'M92 108 L92 68 L108 68 L108 108 Z', at: [100, 90] },
      { label: 'api', color: 'oranye', d: 'M100 62 C88 52 100 32 100 32 C100 32 112 52 100 62 Z', at: [100, 50] },
    ],
  },
  {
    name: 'tenda',
    regions: [
      { label: 'tenda', color: 'oranye', d: 'M20 170 L100 45 L180 170 Z', at: [60, 152] },
      { label: 'pintu', color: 'cokelat', d: 'M100 75 L75 170 L125 170 Z', at: [100, 145] },
      { label: 'bendera', color: 'merah', d: 'M102 14 L132 24 L102 34 Z', at: [112, 24] },
    ],
    lines: ['M100 45 L100 12'],
  },
  {
    name: 'bus',
    regions: [
      { label: 'badan bus', color: 'kuning', d: 'M20 60 L180 60 L180 148 L20 148 Z', at: [100, 128] },
      { label: 'jendela', color: 'biru', d: 'M35 75 L75 75 L75 105 L35 105 Z M90 75 L130 75 L130 105 L90 105 Z M145 75 L168 75 L168 105 L145 105 Z', at: [[55, 90], [110, 90], [156, 90]] },
      { label: 'roda', color: 'hitam', d: `${circlePath(55, 150, 17)} ${circlePath(145, 150, 17)}`, at: [[55, 150], [145, 150]] },
    ],
  },
  {
    name: 'burung',
    regions: [
      { label: 'badan', color: 'biru', d: 'M40 110 C40 70 80 55 110 70 C130 45 165 55 165 85 C165 125 130 150 90 150 C60 150 40 135 40 110 Z', at: [140, 112] },
      { label: 'sayap', color: 'ungu', d: 'M70 105 C85 90 115 95 120 118 C100 123 82 120 70 105 Z', at: [96, 110] },
      { label: 'paruh', color: 'oranye', d: 'M163 80 L188 88 L163 96 Z', at: [173, 88] },
    ],
    lines: ['M140 74 L140 80', 'M88 150 L83 180', 'M110 150 L115 180'],
  },
  {
    name: 'lebah',
    regions: [
      { label: 'sayap', color: 'biru', d: `${circlePath(95, 75, 24)} ${circlePath(132, 72, 24)}`, at: [[95, 70], [132, 67]] },
      { label: 'badan', color: 'kuning', d: 'M55 120 C55 98 85 88 115 88 C150 88 170 104 170 120 C170 136 150 152 115 152 C85 152 55 142 55 120 Z', at: [140, 122] },
      { label: 'kepala', color: 'hitam', d: circlePath(48, 118, 22), at: [48, 118] },
    ],
    lines: ['M95 90 L95 150', 'M120 89 L120 151'],
  },
];

// ---------- Hubungkan titik ----------

const heartDots = Array.from({ length: 14 }, (_, k) => {
  const t = (k * 2 * Math.PI) / 14;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [r1(100 + x * 5.2), r1(95 - y * 5.2)];
});

export const DOT_PICTURES = [
  { name: 'layang-layang', emoji: '🪁', color: '#e8435f', pts: [[100, 15], [160, 80], [100, 185], [40, 80]] },
  { name: 'rumah', emoji: '🏠', color: '#f28c1e', pts: [[40, 185], [40, 90], [100, 30], [160, 90], [160, 185]] },
  { name: 'berlian', emoji: '💎', color: '#2f8fe0', pts: [[60, 40], [140, 40], [175, 85], [100, 180], [25, 85]] },
  { name: 'perahu', emoji: '⛵', color: '#2f8fe0', pts: [[25, 125], [95, 125], [95, 25], [160, 125], [175, 125], [145, 170], [55, 170]] },
  { name: 'mahkota', emoji: '👑', color: '#ffd02a', pts: [[30, 165], [30, 55], [70, 105], [100, 35], [130, 105], [170, 55], [170, 165]] },
  { name: 'ikan', emoji: '🐟', color: '#f28c1e', pts: [[20, 100], [55, 62], [110, 55], [150, 88], [185, 55], [185, 145], [150, 112], [110, 145], [55, 138]] },
  { name: 'kucing', emoji: '🐱', color: '#f28c1e', pts: [[40, 25], [80, 60], [120, 60], [160, 25], [165, 105], [140, 155], [100, 175], [60, 155], [35, 105]] },
  { name: 'bintang', emoji: '⭐', color: '#ffd02a', pts: starPoints(100, 108, 90, 38).map(([x, y]) => [r1(x), r1(y)]) },
  { name: 'hati', emoji: '❤️', color: '#e8435f', pts: heartDots },
  { name: 'roket', emoji: '🚀', color: '#8f9bb3', pts: [[100, 10], [125, 40], [132, 110], [160, 150], [160, 178], [128, 160], [115, 186], [85, 186], [72, 160], [40, 178], [40, 150], [68, 110], [75, 40]] },
  { name: 'jamur', emoji: '🍄', color: '#e8435f', pts: [[100, 25], [140, 35], [170, 65], [180, 100], [130, 100], [130, 170], [120, 180], [80, 180], [70, 170], [70, 100], [20, 100], [30, 65], [60, 35]] },
  { name: 'pohon cemara', emoji: '🎄', color: '#4cb844', pts: [[100, 15], [145, 65], [122, 65], [160, 110], [135, 110], [175, 155], [110, 155], [110, 190], [90, 190], [90, 155], [25, 155], [65, 110], [40, 110], [78, 65], [55, 65]] },
  // sampai 5 titik
  { name: 'tenda', emoji: '⛺', color: '#f28c1e', pts: [[100, 25], [175, 170], [25, 170]] },
  { name: 'topi pesta', emoji: '🥳', color: '#8f4fd9', pts: [[100, 15], [150, 168], [100, 185], [50, 168]] },
  { name: 'potongan pizza', emoji: '🍕', color: '#ffd02a', pts: [[100, 182], [30, 40], [170, 40]] },
  { name: 'gelas', emoji: '🥛', color: '#9fd4ff', pts: [[45, 25], [155, 25], [135, 180], [65, 180]] },
  { name: 'perahu kecil', emoji: '🛶', color: '#9a6235', pts: [[20, 90], [180, 90], [150, 160], [50, 160]] },
  { name: 'bendera', emoji: '🚩', color: '#e8435f', pts: [[45, 185], [45, 20], [160, 55], [45, 90]] },
  { name: 'perisai', emoji: '🛡️', color: '#2f8fe0', pts: [[40, 30], [160, 30], [160, 100], [100, 180], [40, 100]] },
  { name: 'jam pasir', emoji: '⏳', color: '#d9a066', pts: [[40, 20], [160, 20], [40, 180], [160, 180]] },
  // 6–10 titik
  { name: 'panah', emoji: '➡️', color: '#2f8fe0', pts: [[20, 80], [110, 80], [110, 40], [180, 100], [110, 160], [110, 120], [20, 120]] },
  { name: 'mobil', emoji: '🚗', color: '#e8435f', pts: [[20, 140], [20, 105], [55, 100], [75, 65], [130, 65], [150, 100], [180, 105], [180, 140]] },
  { name: 'piala', emoji: '🏆', color: '#ffd02a', pts: [[50, 25], [150, 25], [140, 90], [110, 110], [110, 150], [140, 175], [60, 175], [90, 150], [90, 110], [60, 90]] },
  { name: 'pohon', emoji: '🌲', color: '#4cb844', pts: [[100, 20], [160, 110], [115, 110], [115, 180], [85, 180], [85, 110], [40, 110]] },
  { name: 'cangkir', emoji: '☕', color: '#9a6235', pts: [[30, 50], [150, 50], [150, 70], [180, 80], [180, 120], [150, 125], [140, 170], [40, 170]] },
  { name: 'kepala robot', emoji: '🤖', color: '#8f9bb3', pts: [[50, 40], [90, 40], [90, 20], [110, 20], [110, 40], [150, 40], [150, 170], [50, 170]] },
  { name: 'rumah berasap', emoji: '🏡', color: '#f28c1e', pts: [[30, 185], [30, 95], [100, 30], [125, 53], [125, 25], [145, 25], [145, 72], [170, 95], [170, 185]] },
  // lebih dari 10 titik
  { name: 'baju', emoji: '👕', color: '#2f8fe0', pts: [[60, 25], [85, 40], [115, 40], [140, 25], [185, 60], [160, 90], [145, 75], [145, 180], [55, 180], [55, 75], [40, 90], [15, 60]] },
  { name: 'bunga', emoji: '🌼', color: '#f58ac0', pts: starPoints(100, 100, 85, 45, 6).map(([x, y]) => [r1(x), r1(y)]) },
  { name: 'pesawat', emoji: '✈️', color: '#e6e9f2', pts: [[15, 95], [60, 90], [80, 40], [100, 40], [95, 90], [150, 90], [165, 70], [180, 70], [175, 100], [180, 130], [165, 130], [150, 110], [95, 110], [100, 160], [80, 160], [60, 110], [15, 105]] },
  { name: 'kelinci', emoji: '🐰', color: '#eadcf5', pts: [[70, 15], [85, 15], [92, 80], [108, 80], [115, 15], [130, 15], [125, 90], [150, 120], [145, 165], [100, 185], [55, 165], [50, 120], [75, 90]] },
  { name: 'apel', emoji: '🍎', color: '#e8435f', pts: [[100, 50], [125, 35], [155, 45], [172, 80], [168, 125], [145, 165], [115, 175], [100, 168], [85, 175], [55, 165], [32, 125], [28, 80], [45, 45], [75, 35]] },
  { name: 'awan', emoji: '☁️', color: '#cde9ff', pts: [[40, 140], [25, 115], [40, 90], [65, 85], [75, 60], [105, 50], [130, 65], [150, 60], [172, 80], [175, 110], [160, 140]] },
  { name: 'beruang', emoji: '🐻', color: '#9a6235', pts: [[45, 40], [70, 35], [80, 55], [120, 55], [130, 35], [155, 40], [155, 70], [145, 85], [160, 115], [155, 150], [130, 175], [100, 182], [70, 175], [45, 150], [40, 115], [55, 85], [45, 70]] },
];

// ---------- Salin & cermin di kotak titik ----------
// Garis patah dalam koordinat titik (kolom, baris). Setiap langkah harus mendatar, tegak, atau miring 45°.

export const GRID_COPY = {
  4: [
    { name: 'persegi', lines: [[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]] },
    { name: 'segitiga', lines: [[[0, 3], [3, 3], [0, 0], [0, 3]]] },
    { name: 'huruf L', lines: [[[0, 0], [0, 3], [2, 3]]] },
    { name: 'tangga', lines: [[[0, 3], [0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0]]] },
    { name: 'panah', lines: [[[0, 1], [2, 1]], [[1, 0], [2, 1], [1, 2]]] },
    { name: 'zigzag', lines: [[[0, 2], [1, 1], [2, 2], [3, 1]]] },
    { name: 'kotak bergaris', lines: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0], [2, 2]]] },
    { name: 'tanda tambah', lines: [[[1, 0], [1, 2]], [[0, 1], [2, 1]]] },
    { name: 'huruf T', lines: [[[0, 0], [2, 0]], [[1, 0], [1, 3]]] },
    { name: 'jendela', lines: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]], [[1, 0], [1, 2]]] },
    { name: 'bendera', lines: [[[0, 3], [0, 0], [2, 0], [2, 1], [0, 1]]] },
    { name: 'rumah kecil', lines: [[[0, 2], [1, 1], [2, 2], [2, 3], [0, 3], [0, 2]]] },
  ],
  5: [
    { name: 'rumah', lines: [[[0, 2], [2, 0], [4, 2], [4, 4], [0, 4], [0, 2], [4, 2]]] },
    { name: 'belah ketupat', lines: [[[2, 0], [4, 2], [2, 4], [0, 2], [2, 0]]] },
    { name: 'perahu', lines: [[[0, 3], [4, 3], [3, 4], [1, 4], [0, 3]], [[2, 3], [2, 0], [4, 2], [2, 2]]] },
    { name: 'pohon', lines: [[[2, 0], [0, 2], [4, 2], [2, 0]], [[2, 2], [2, 4]]] },
    { name: 'jam pasir', lines: [[[0, 0], [4, 0], [0, 4], [4, 4], [0, 0]]] },
    { name: 'huruf M', lines: [[[0, 4], [0, 0], [2, 2], [4, 0], [4, 4]]] },
    { name: 'amplop', lines: [[[0, 1], [4, 1], [4, 4], [0, 4], [0, 1], [2, 3], [4, 1]]] },
    { name: 'bintang garis', lines: [[[2, 0], [2, 4]], [[0, 2], [4, 2]], [[0, 0], [4, 4]], [[4, 0], [0, 4]]] },
    { name: 'tangga besar', lines: [[[0, 4], [0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1], [3, 0], [4, 0]]] },
    { name: 'kursi', lines: [[[1, 0], [1, 4]], [[1, 2], [3, 2], [3, 4]]] },
    { name: 'panah ke atas', lines: [[[2, 4], [2, 0]], [[0, 2], [2, 0], [4, 2]]] },
    { name: 'tenda', lines: [[[0, 4], [2, 2], [4, 4], [0, 4]], [[2, 2], [2, 0]]] },
  ],
};

// separuh kiri gambar simetris; kolom paling kanan = garis cermin
export const GRID_HALF = {
  5: [
    { name: 'rumah', lines: [[[2, 0], [0, 2], [0, 4], [2, 4]]] },
    { name: 'belah ketupat', lines: [[[2, 0], [0, 2], [2, 4]]] },
    { name: 'pohon', lines: [[[2, 0], [0, 2], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4]]] },
    { name: 'hati', lines: [[[2, 1], [1, 0], [0, 1], [0, 2], [2, 4]]] },
    { name: 'jam pasir', lines: [[[2, 0], [0, 0], [2, 2], [0, 4], [2, 4]]] },
    { name: 'cangkir', lines: [[[0, 0], [0, 3], [1, 4], [2, 4]]] },
    { name: 'roket', lines: [[[2, 0], [1, 1], [1, 3], [0, 4], [1, 4], [1, 3]]] },
    { name: 'mahkota', lines: [[[0, 0], [0, 4], [2, 4]], [[0, 0], [1, 1], [2, 0]]] },
    { name: 'panah', lines: [[[2, 0], [0, 2], [1, 2], [1, 4], [2, 4]]] },
    { name: 'gelas', lines: [[[0, 0], [0, 4], [2, 4]], [[0, 1], [2, 1]]] },
    { name: 'kepala kucing', lines: [[[2, 1], [1, 1], [0, 0], [0, 3], [1, 4], [2, 4]]] },
    { name: 'pita', lines: [[[2, 2], [0, 0], [0, 4], [2, 2]]] },
  ],
  7: [
    { name: 'kupu-kupu', lines: [[[3, 2], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3]], [[3, 3], [1, 5], [0, 4], [1, 3]], [[3, 1], [3, 5]]] },
    { name: 'istana', lines: [[[3, 5], [0, 5], [0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0]], [[2, 5], [2, 3], [3, 3]]] },
    { name: 'pohon besar', lines: [[[3, 0], [1, 2], [2, 2], [0, 4], [2, 4], [2, 5], [3, 5]]] },
    { name: 'wajah robot', lines: [[[3, 0], [0, 0], [0, 4], [3, 4]], [[1, 1], [1, 2]], [[1, 3], [3, 3]]] },
    { name: 'vas bunga', lines: [[[3, 0], [1, 0], [1, 1], [0, 2], [0, 4], [1, 5], [3, 5]]] },
    { name: 'roket', lines: [[[3, 0], [2, 1], [2, 3], [0, 5], [3, 5]]] },
    { name: 'payung', lines: [[[3, 0], [0, 3], [3, 3]], [[3, 3], [3, 5], [2, 5]]] },
    { name: 'rumah besar', lines: [[[3, 0], [0, 3], [0, 5], [3, 5]], [[2, 5], [2, 4], [3, 4]]] },
    { name: 'bunga', lines: [[[3, 3], [3, 5]], [[3, 3], [1, 1], [2, 0], [3, 1]], [[3, 4], [2, 3]]] },
    { name: 'perahu', lines: [[[3, 0], [3, 3]], [[3, 1], [1, 3]], [[0, 3], [3, 3]], [[0, 3], [2, 5], [3, 5]]] },
    { name: 'mahkota', lines: [[[0, 5], [0, 1], [1, 2], [2, 1], [3, 2]], [[0, 5], [3, 5]]] },
    { name: 'menara', lines: [[[3, 0], [2, 0], [2, 2], [1, 2], [1, 4], [0, 4], [0, 5], [3, 5]]] },
    { name: 'beruang', lines: [[[3, 1], [1, 1], [1, 0], [0, 0], [0, 1], [1, 1]], [[1, 1], [0, 2], [0, 4], [1, 5], [3, 5]], [[3, 3], [2, 4], [3, 4]]] },
  ],
};
