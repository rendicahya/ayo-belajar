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
  ],
  5: [
    { name: 'rumah', lines: [[[0, 2], [2, 0], [4, 2], [4, 4], [0, 4], [0, 2], [4, 2]]] },
    { name: 'belah ketupat', lines: [[[2, 0], [4, 2], [2, 4], [0, 2], [2, 0]]] },
    { name: 'perahu', lines: [[[0, 3], [4, 3], [3, 4], [1, 4], [0, 3]], [[2, 3], [2, 0], [4, 2], [2, 2]]] },
    { name: 'pohon', lines: [[[2, 0], [0, 2], [4, 2], [2, 0]], [[2, 2], [2, 4]]] },
    { name: 'jam pasir', lines: [[[0, 0], [4, 0], [0, 4], [4, 4], [0, 0]]] },
    { name: 'huruf M', lines: [[[0, 4], [0, 0], [2, 2], [4, 0], [4, 4]]] },
    { name: 'amplop', lines: [[[0, 1], [4, 1], [4, 4], [0, 4], [0, 1], [2, 3], [4, 1]]] },
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
  ],
  7: [
    { name: 'kupu-kupu', lines: [[[3, 2], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3]], [[3, 3], [1, 5], [0, 4], [1, 3]], [[3, 1], [3, 5]]] },
    { name: 'istana', lines: [[[3, 5], [0, 5], [0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0]], [[2, 5], [2, 3], [3, 3]]] },
    { name: 'pohon besar', lines: [[[3, 0], [1, 2], [2, 2], [0, 4], [2, 4], [2, 5], [3, 5]]] },
    { name: 'wajah robot', lines: [[[3, 0], [0, 0], [0, 4], [3, 4]], [[1, 1], [1, 2]], [[1, 3], [3, 3]]] },
    { name: 'vas bunga', lines: [[[3, 0], [1, 0], [1, 1], [0, 2], [0, 4], [1, 5], [3, 5]]] },
    { name: 'roket', lines: [[[3, 0], [2, 1], [2, 3], [0, 5], [3, 5]]] },
    { name: 'payung', lines: [[[3, 0], [0, 3], [3, 3]], [[3, 3], [3, 5], [2, 5]]] },
  ],
};
