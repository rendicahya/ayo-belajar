import { ALPHABET, TRACE_WORDS } from './letters.js';
import { COLORS as PAINTS, COLOR_PICTURES, DOT_PICTURES, GRID_COPY, GRID_HALF } from './drawings.js';

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[rand(0, arr.length - 1)];

/** Digit dari satuan ke kiri: 123 → [3, 2, 1] */
export const digitsOf = (n) => String(n).split('').reverse().map(Number);
export const fromDigits = (ds) => Number([...ds].reverse().join(''));
export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function randWithDigits(digits, allowZero = false) {
  if (digits === 1) return rand(allowZero ? 0 : 1, 9);
  return rand(10 ** (digits - 1), 10 ** digits - 1);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Soal yang butuh simpan/pinjam lebih sering muncul, tapi sesekali tanpa juga.
const acceptPlain = (tries) => Math.random() < 0.3 || tries > 20;

export function genAddition({ count, digits }) {
  for (let tries = 0; ; tries++) {
    const operands = Array.from({ length: count }, () => randWithDigits(digits));
    const rows = operands.map(digitsOf);
    const hasCarry = Array.from({ length: digits }, (_, p) => sum(rows.map((r) => r[p] ?? 0))).some(
      (s) => s >= 10,
    );
    if (hasCarry || acceptPlain(tries)) return { operands, answer: sum(operands) };
  }
}

/**
 * Dibangun per kolom dari kanan, sehingga setiap kolom cukup meminjam paling banyak 1
 * (penting untuk soal 3 bilangan) dan hasilnya tidak pernah negatif.
 */
function trySubtraction(count, digits) {
  const top = [];
  const others = Array.from({ length: count - 1 }, () => []);
  let lentRight = 0;
  let borrowed = false;

  for (let p = 0; p < digits; p++) {
    const leading = p === digits - 1;
    let placed = false;
    for (let t = 0; t < 60 && !placed; t++) {
      const ds = others.map(() => rand(leading ? 1 : 0, 9));
      const r = rand(leading && digits > 1 ? 1 : 0, 9);
      const need = r + sum(ds) + lentRight;
      let borrowIn;
      if (need <= 9) borrowIn = 0;
      else if (!leading && need <= 19) borrowIn = 1;
      else continue;
      top[p] = need - 10 * borrowIn;
      ds.forEach((d, i) => (others[i][p] = d));
      lentRight = borrowIn;
      if (borrowIn) borrowed = true;
      placed = true;
    }
    if (!placed) return null;
  }

  const operands = [fromDigits(top), ...others.map(fromDigits)];
  return { operands, answer: operands[0] - sum(operands.slice(1)), borrowed };
}

export function genSubtraction({ count, digits }) {
  for (let tries = 0; ; tries++) {
    const p = trySubtraction(count, digits);
    if (p && (p.borrowed || acceptPlain(tries))) return { operands: p.operands, answer: p.answer };
  }
}

export function genMultiplication({ digits, by }) {
  const a = digits === 1 ? rand(2, 9) : randWithDigits(digits);
  // pengali tanpa angka 0 supaya setiap baris perkalian berarti
  const b = by === 1 ? rand(2, 9) : fromDigits(Array.from({ length: by }, () => rand(1, 9)));
  return { operands: [a, b], answer: a * b };
}

const divisionHasRemainder = (dividend, divisor) => {
  let rem = 0;
  for (const d of String(dividend)) {
    const cur = rem * 10 + Number(d);
    rem = cur % divisor;
    if (rem && cur >= divisor) return true;
  }
  return false;
};

export function genDivision({ digits, clean, minDiv = 2, maxDiv = 9 }) {
  if (clean) {
    // setiap digit habis dibagi, mis. 84 : 4
    const divisor = rand(2, 4);
    const q = Array.from({ length: digits }, () => rand(1, Math.floor(9 / divisor)));
    const dividend = Number(q.map((d) => d * divisor).join(''));
    return { dividend, divisor, answer: dividend / divisor };
  }
  for (let tries = 0; ; tries++) {
    const divisor = rand(minDiv, maxDiv);
    const qMin = Math.ceil(10 ** (digits - 1) / divisor);
    const qMax = Math.floor((10 ** digits - 1) / divisor);
    const answer = rand(qMin, qMax);
    const dividend = answer * divisor;
    if (divisionHasRemainder(dividend, divisor) || tries > 20) return { dividend, divisor, answer };
  }
}

/** Pembagian bersusun panjang: hasil bagi minimal 2 digit supaya ada beberapa langkah. */
export function genLongDivision({ digits, divMin, divMax, rem }) {
  for (;;) {
    const divisor = rand(divMin, divMax);
    let dividend;
    if (rem === 'none') {
      const q = rand(Math.ceil(10 ** (digits - 1) / divisor), Math.floor((10 ** digits - 1) / divisor));
      dividend = q * divisor;
    } else dividend = randWithDigits(digits);
    const remainder = dividend % divisor;
    const answer = Math.floor(dividend / divisor);
    if (answer < 10 || (rem === 'yes' && !remainder)) continue;
    return { dividend, divisor, answer, remainder };
  }
}

export function genCompare({ digits, close }) {
  const a = randWithDigits(digits, digits === 1);
  if (Math.random() < 0.2) return { a, b: a };
  let b;
  do {
    if (close && digits > 1) {
      const ds = digitsOf(a);
      if (Math.random() < 0.5) {
        // tukar posisi dua digit, mis. 352 vs 325
        const i = rand(0, digits - 1);
        const j = rand(0, digits - 1);
        [ds[i], ds[j]] = [ds[j], ds[i]];
      } else {
        ds[rand(0, digits - 2)] = rand(0, 9);
      }
      b = ds[digits - 1] === 0 ? a : fromDigits(ds);
    } else {
      b = randWithDigits(digits, digits === 1);
    }
  } while (b === a);
  return { a, b };
}

const expr = (text, value) => ({ text, value });
const plus = (a, b) => expr(`${a} + ${b}`, a + b);
const minus = (a, b) => expr(`${a} − ${b}`, a - b);
const times = (a, b) => expr(`${a} × ${b}`, a * b);
const num = (n) => expr(String(n), n);

/** Nilai yang dekat dengan v (kadang sama persis) supaya anak benar-benar menghitung. */
function nearby(v, spread, min) {
  if (Math.random() < 0.25) return v;
  let d;
  do d = rand(-spread, spread);
  while (d === 0 || v + d < min);
  return v + d;
}

function splitSum(v, maxPart) {
  const lo = Math.max(1, v - maxPart);
  const hi = Math.min(maxPart, v - 1);
  if (lo > hi) return num(v);
  const a = rand(lo, hi);
  return plus(a, v - a);
}

export function genExprCompare({ expr: type }) {
  let left, right;
  switch (type) {
    case 'sum1':
      left = plus(rand(1, 9), rand(1, 9));
      right = num(nearby(left.value, 2, 0));
      break;
    case 'sumsum1':
      left = plus(rand(1, 9), rand(1, 9));
      right = splitSum(nearby(left.value, 2, 2), 9);
      break;
    case 'sum2':
      left = plus(rand(10, 60), rand(10, 39));
      right = num(nearby(left.value, 5, 0));
      break;
    case 'diffsum2': {
      const a = rand(30, 99);
      left = minus(a, rand(10, a - 10));
      right = splitSum(nearby(left.value, 4, 2), 60);
      break;
    }
    default: {
      const a = rand(2, 9);
      const b = rand(2, 9);
      left = times(a, b);
      const same = [];
      for (let c = 2; c <= 9; c++) {
        const d = left.value / c;
        if (Number.isInteger(d) && d >= 2 && d <= 9 && c !== a && c !== b) same.push([c, d]);
      }
      if (same.length && Math.random() < 0.35) right = times(...pick(same));
      else {
        let c, d;
        let t = 0;
        do {
          c = rand(2, 9);
          d = rand(2, 9);
        } while (Math.abs(c * d - left.value) > 6 && ++t < 200);
        right = times(c, d);
      }
    }
  }
  return Math.random() < 0.5 ? { left, right } : { left: right, right: left };
}

export function genSort({ count, digits, order, close }) {
  const set = new Set();
  const base = close ? rand(10 ** (digits - 1), 10 ** digits - 100) : 0;
  while (set.size < count) set.add(close ? base + rand(0, 99) : randWithDigits(digits, digits === 1));
  const values = [...set];
  const target = [...values].sort((x, y) => (order === 'asc' ? x - y : y - x));
  let shuffled;
  do shuffled = shuffle(values);
  while (shuffled.every((v, i) => v === target[i]));
  return { values: shuffled, target };
}

export const PLACES = ['satuan', 'puluhan', 'ratusan', 'ribuan', 'puluh ribuan', 'ratus ribuan'];

export function genPlaceValue({ type, digits }) {
  if (type !== 'value') return { number: randWithDigits(digits) };
  // digit berbeda semua supaya pertanyaan "angka X" tidak ambigu
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, digits);
  const number = Number(ds.join(''));
  const pos = rand(0, digits - 1); // dari satuan
  const digit = digitsOf(number)[pos];
  const ask = Math.random() < 0.5 ? 'value' : 'place';
  const choices =
    ask === 'value'
      ? Array.from({ length: digits }, (_, p) => digit * 10 ** p)
      : PLACES.slice(0, digits);
  return {
    number,
    pos,
    digit,
    ask,
    choices: [...choices].reverse(),
    answer: ask === 'value' ? digit * 10 ** pos : PLACES[pos],
  };
}

const NAMES = ['Budi', 'Siti', 'Andi', 'Rina', 'Dimas', 'Tika', 'Bayu', 'Lala', 'Putri', 'Raka', 'Nina', 'Joko'];
const ITEMS = [
  ['kelereng', '🔮'],
  ['permen', '🍬'],
  ['kue', '🍪'],
  ['buku', '📚'],
  ['balon', '🎈'],
  ['stiker', '⭐'],
  ['pensil', '✏️'],
  ['apel', '🍎'],
  ['jeruk', '🍊'],
  ['bunga', '🌸'],
];

const STORIES = {
  tambah: [
    (a, b, A, B, x) => `${A} punya ${a} ${x}. Lalu ${A} diberi ${b} ${x} lagi oleh ${B}. Berapa ${x} ${A} sekarang?`,
    (a, b, A, B, x) =>
      `${A} mengumpulkan ${a} ${x} pada hari Senin dan ${b} ${x} pada hari Selasa. Berapa banyak ${x} yang dikumpulkan ${A}?`,
    (a, b, A, B, x) => `Di toko ada ${a} ${x} merah dan ${b} ${x} biru. Berapa jumlah semua ${x} itu?`,
    (a, b, A, B, x) => `${A} punya ${a} ${x} dan ${B} punya ${b} ${x}. Berapa ${x} mereka jika digabungkan?`,
  ],
  kurang: [
    (a, b, A, B, x) => `${A} punya ${a} ${x}. Sebanyak ${b} ${x} diberikan kepada ${B}. Berapa sisa ${x} ${A}?`,
    (a, b, A, B, x) => `Ada ${a} ${x} di dalam kotak. ${A} mengambil ${b} ${x}. Berapa ${x} yang masih ada di kotak?`,
    (a, b, A, B, x) => `${A} punya ${a} ${x}, sedangkan ${B} punya ${b} ${x}. Berapa selisih ${x} mereka?`,
    (a, b, A, B, x) => `Di toko ada ${a} ${x}. Hari ini terjual ${b} ${x}. Berapa ${x} yang belum terjual?`,
  ],
  kali: [
    (a, b, A, B, x) => `${A} membeli ${b} kantong ${x}. Setiap kantong berisi ${a} ${x}. Berapa jumlah semua ${x}?`,
    (a, b, A, B, x) => `Ada ${b} meja. Di setiap meja ada ${a} ${x}. Berapa ${x} di semua meja?`,
    (a, b, A, B, x) => `Setiap hari ${A} mendapat ${a} ${x}. Berapa ${x} yang didapat ${A} selama ${b} hari?`,
  ],
  bagi: [
    (a, b, A, B, x) => `${a} ${x} dibagikan sama rata kepada ${b} anak. Berapa ${x} yang didapat setiap anak?`,
    (a, b, A, B, x) => `${A} punya ${a} ${x}. Semuanya dimasukkan ke ${b} kotak sama banyak. Berapa ${x} di setiap kotak?`,
  ],
};

export function genStory({ ops, digits }) {
  const op = pick(ops);
  const [A, B] = shuffle(NAMES);
  const [item, emoji] = pick(ITEMS);
  let problem, a, b;
  if (op === 'tambah' || op === 'kurang') {
    problem = (op === 'tambah' ? genAddition : genSubtraction)({ count: 2, digits });
    [a, b] = problem.operands;
  } else if (op === 'kali') {
    problem = genMultiplication({ digits: digits >= 3 ? 2 : rand(1, 2), by: 1 });
    [a, b] = problem.operands;
  } else {
    problem = genDivision({ digits: digits >= 3 ? 3 : 2 });
    a = problem.dividend;
    b = problem.divisor;
  }
  return { op, problem, emoji, text: pick(STORIES[op])(a, b, A, B, item) };
}

// ---------- Uang & belanja ----------

export const rupiah = (n) => `Rp${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const SHOP = [
  ['Roti', '🍞'],
  ['Susu', '🥛'],
  ['Cokelat', '🍫'],
  ['Permen', '🍬'],
  ['Pisang', '🍌'],
  ['Es krim', '🍦'],
  ['Jus', '🧃'],
  ['Pensil', '✏️'],
  ['Buku', '📒'],
  ['Biskuit', '🍪'],
  ['Apel', '🍎'],
  ['Telur', '🥚'],
  ['Donat', '🍩'],
  ['Jagung', '🌽'],
  ['Semangka', '🍉'],
  ['Bola', '⚽'],
  ['Krayon', '🖍️'],
  ['Teh', '🍵'],
];

const shopItems = (n, minStep, maxStep) =>
  shuffle(SHOP)
    .slice(0, n)
    .map(([name, emoji]) => ({ name, emoji, price: rand(minStep, maxStep) * 500 }));

const noteAbove = (total) => [5000, 10000, 20000, 50000, 100000].find((v) => v > total);

export function genMoney({ type }) {
  switch (type) {
    case 'count': {
      const pieces = Array.from({ length: rand(2, 4) }, () => pick([500, 1000, 2000, 5000])).sort((a, b) => b - a);
      return { pieces, answers: [sum(pieces)] };
    }
    case 'pay': {
      const [item] = shopItems(1, 3, 19);
      return { items: [item], wallet: [500, 1000, 2000, 5000], answers: [item.price] };
    }
    case 'total': {
      const items = shopItems(2, 1, 10);
      return { items, answers: [sum(items.map((i) => i.price))] };
    }
    case 'change': {
      const [item] = shopItems(1, 2, 19);
      const note = item.price < 5000 && Math.random() < 0.5 ? 5000 : 10000;
      return { items: [item], note, answers: [note - item.price] };
    }
    default: {
      const items = shopItems(rand(2, 3), 2, 24);
      const total = sum(items.map((i) => i.price));
      const note = noteAbove(total);
      return { items, note, answers: [total, note - total] };
    }
  }
}

// ---------- Garis bilangan ----------

export function genJump({ type, max, tick = 1 }) {
  let start, hop, count, dir, text;
  const t = type === 'mix' ? pick(['add', 'sub']) : type;
  if (t === 'mul') {
    hop = rand(2, 5);
    count = rand(2, Math.floor(max / hop));
    start = 0;
    dir = 1;
    text = `${count} × ${hop}`;
  } else {
    hop = tick;
    dir = t === 'add' ? 1 : -1;
    const steps = max / tick;
    const a = t === 'add' ? rand(0, steps - 1) : rand(1, steps);
    count = t === 'add' ? rand(1, Math.min(9, steps - a)) : rand(1, Math.min(9, a));
    start = a * tick;
    text = `${start} ${t === 'add' ? '+' : '−'} ${count * tick}`;
  }
  const answer = start + dir * hop * count;
  // pilihan pengecoh: meleset satu-dua lompatan
  const opts = new Set([answer]);
  const near = t === 'mul' ? [-hop, hop, -1, 1] : shuffle([-1, 1, -2, 2]).map((x) => x * tick);
  for (const d of near) if (opts.size < 4 && answer + d >= 0 && answer + d <= max) opts.add(answer + d);
  for (let v = 0; opts.size < 4 && v <= max; v += tick) opts.add(v);
  return { start, hop, count, dir, answer, text, max, tick, choices: [...opts].sort((x, y) => x - y) };
}

// ---------- Tabel perkalian ----------

const FACTS_KEY = 'jb-facts';
const loadFacts = () => {
  try {
    return JSON.parse(localStorage.getItem(FACTS_KEY)) ?? {};
  } catch {
    return {};
  }
};
let lastFact = '';

/** Fakta perkalian; yang pernah salah punya bobot lebih besar sehingga lebih sering muncul. */
export function genFact({ tables }) {
  const misses = loadFacts();
  const pool = [];
  for (const t of tables)
    for (let b = 1; b <= 10; b++) {
      const [x, y] = Math.random() < 0.5 ? [t, b] : [b, t];
      const id = `${Math.min(x, y)}x${Math.max(x, y)}`;
      if (id === lastFact) continue;
      pool.push({ a: x, b: y, id, w: 1 + 3 * (misses[id] ?? 0) + (b === 1 || b === 10 ? -0.5 : 0) });
    }
  let r = Math.random() * sum(pool.map((f) => f.w));
  const fact = pool.find((f) => (r -= f.w) < 0) ?? pool.at(-1);
  lastFact = fact.id;
  return { a: fact.a, b: fact.b, id: fact.id, answer: fact.a * fact.b };
}

/** Catat hasil: salah menambah bobot, benar langsung mengurangi. */
export function recordFact(id, firstTry) {
  const misses = loadFacts();
  misses[id] = Math.max(0, Math.min(5, (misses[id] ?? 0) + (firstTry ? -1 : 1)));
  if (!misses[id]) delete misses[id];
  try {
    localStorage.setItem(FACTS_KEY, JSON.stringify(misses));
  } catch {}
}

// ---------- Pola bilangan ----------

export function genPattern({ kind, steps, blanks = 1, dir = 1 }) {
  const len = 6;
  let seq, rule;
  if (kind === 'grow') {
    if (Math.random() < 0.5) {
      let v = rand(1, 5);
      let d = rand(1, 3);
      seq = [v];
      while (seq.length < len) seq.push((v += d++));
      rule = { type: 'grow', d0: seq[1] - seq[0] };
    } else {
      let v = rand(1, 3);
      seq = [v];
      while (seq.length < len) seq.push((v *= 2));
      rule = { type: 'double' };
    }
  } else {
    const step = pick(steps);
    const start = dir > 0 ? (step >= 5 && Math.random() < 0.7 ? step * rand(0, 4) : rand(0, 20)) : rand(step * (len - 1), step * (len - 1) + 20);
    seq = Array.from({ length: len }, (_, i) => start + dir * step * i);
    rule = { type: 'step', step: dir * step };
  }
  // posisi kosong: minimal ada dua angka berurutan di depan supaya aturannya bisa ditebak
  const first = blanks > 1 || kind === 'grow' ? 2 : 1;
  const hidden = shuffle(Array.from({ length: len - first }, (_, i) => i + first))
    .slice(0, blanks)
    .sort((a, b) => a - b);
  return { seq, hidden, rule };
}

// ---------- Satuan ukur ----------

const OBJECTS = [
  ['pensil', '#f5b700'],
  ['krayon', '#ec4fa8'],
  ['spidol', '#2fa6dc'],
  ['sedotan', '#5aae22'],
  ['pita', '#8f4fd9'],
  ['kapur', '#e2780c'],
];

const nearChoices = (answer, deltas, min = 0) => {
  const set = new Set([answer]);
  for (const d of shuffle(deltas)) if (set.size < 4 && answer + d >= min) set.add(answer + d);
  return [...set].sort((a, b) => a - b);
};

export function genMeasure({ type }) {
  if (type === 'ruler' || type === 'ruler-offset') {
    const [name, color] = pick(OBJECTS);
    if (type === 'ruler') {
      const length = rand(3, 14);
      return { name, color, start: 0, length, max: 15, choices: nearChoices(length, [-2, -1, 1, 2], 1), answer: length };
    }
    const start = rand(1, 5);
    const length = rand(3, 10);
    const end = start + length;
    // pengecoh utama: angka di ujung benda (lupa dikurangi titik awal)
    const choices = [...new Set([length, end, ...shuffle([length - 1, length + 1, length + 2])])].slice(0, 4).sort((a, b) => a - b);
    return { name, color, start, length, max: 20, choices, answer: length };
  }
  if (type === 'scale') {
    const items = [['semangka', '🍉'], ['beras', '🍚'], ['kucing', '🐈'], ['labu', '🎃'], ['nanas', '🍍'], ['tas', '🎒']];
    const [name, emoji] = pick(items);
    const value = rand(1, 9);
    return { name, emoji, value, answer: value, choices: nearChoices(value, [-2, -1, 1, 2], 0) };
  }
  if (type === 'convert') {
    const n = rand(1, 5);
    const [big, small, f] = pick([
      ['m', 'cm', 100],
      ['kg', 'g', 1000],
      ['km', 'm', 1000],
    ]);
    if (Math.random() < 0.65) {
      const answer = n * f;
      return { text: `${n} ${big} = ? ${small}`, answer, unit: small, choices: [n, answer / 10, answer, answer * 10] };
    }
    return { text: `${n * f} ${small} = ? ${big}`, answer: n, unit: big, choices: [...new Set([n, n * 10, n * 100, n + 1])].sort((a, b) => a - b) };
  }
  // bandingkan dua ukuran dengan satuan berbeda
  const [big, small, f] = pick([
    ['m', 'cm', 100],
    ['kg', 'g', 1000],
  ]);
  const n = rand(1, 3);
  const r = Math.random();
  const smallVal = r < 0.25 ? n * f : n * f + pick([-1, 1]) * (f === 100 ? pick([10, 20, 30, 50]) : pick([100, 200, 250, 500]));
  const left = { text: `${n} ${big}`, value: n * f };
  const right = { text: `${smallVal} ${small}`, value: smallVal };
  return Math.random() < 0.5 ? { left, right } : { left: right, right: left };
}

// ---------- Bangun datar ----------

const poly = (n, r = 44, rot = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 52 + r * Math.sin(a)].map((v) => Math.round(v * 10) / 10);
  });

export const SHAPES = {
  lingkaran: { name: 'Lingkaran', circle: true, sides: 0, corners: 0, clue: 'Aku bulat seperti roda dan tidak punya titik sudut.' },
  segitiga: { name: 'Segitiga', pts: [[50, 8], [93, 88], [7, 88]], sides: 3, corners: 3, clue: 'Aku punya 3 sisi dan 3 titik sudut.' },
  persegi: { name: 'Persegi', pts: [[14, 14], [86, 14], [86, 86], [14, 86]], sides: 4, corners: 4, clue: 'Keempat sisiku sama panjang dan semua sudutku siku-siku.' },
  persegiPanjang: { name: 'Persegi panjang', pts: [[4, 26], [96, 26], [96, 76], [4, 76]], sides: 4, corners: 4, clue: 'Semua sudutku siku-siku. Dua sisiku panjang dan dua sisiku pendek.' },
  belahKetupat: { name: 'Belah ketupat', pts: [[50, 4], [82, 50], [50, 96], [18, 50]], sides: 4, corners: 4, clue: 'Keempat sisiku sama panjang, tapi sudutku tidak siku-siku. Bentukku seperti wajik.' },
  trapesium: { name: 'Trapesium', pts: [[30, 22], [70, 22], [95, 80], [5, 80]], sides: 4, corners: 4, clue: 'Aku punya 4 sisi. Sisi atasku lebih pendek dari sisi bawahku.' },
  jajarGenjang: { name: 'Jajar genjang', pts: [[28, 24], [96, 24], [72, 78], [4, 78]], sides: 4, corners: 4, clue: 'Sisi-sisiku yang berhadapan sama panjang, tapi badanku miring.' },
  segiLima: { name: 'Segi lima', pts: poly(5), sides: 5, corners: 5, clue: 'Aku punya 5 sisi dan 5 titik sudut.' },
  segiEnam: { name: 'Segi enam', pts: poly(6, 45, 0), sides: 6, corners: 6, clue: 'Aku punya 6 sisi, seperti sarang lebah.' },
};

const BASIC = ['lingkaran', 'segitiga', 'persegi', 'persegiPanjang'];
const SHAPE_COLORS = ['var(--coral)', 'var(--sky)', 'var(--lime)', 'var(--grape)', 'var(--pink)', 'var(--orange)', 'var(--teal)'];
const dressShape = (id) => ({ id, color: pick(SHAPE_COLORS), rot: id === 'lingkaran' ? 0 : rand(-12, 12), scale: rand(80, 100) / 100 });

export function genShape({ type }) {
  const all = Object.keys(SHAPES);
  if (type === 'name') {
    const id = pick(BASIC);
    return { shape: dressShape(id), answer: id, choices: shuffle(BASIC) };
  }
  if (type === 'find') {
    const target = pick(BASIC);
    const count = rand(2, 4);
    const others = Array.from({ length: 8 - count }, () => pick(BASIC.filter((s) => s !== target)));
    return { target, field: shuffle([...Array(count).fill(target), ...others]).map(dressShape) };
  }
  if (type === 'sides' || type === 'corners') {
    const id = pick(all.filter((s) => type === 'corners' || s !== 'lingkaran'));
    const answer = SHAPES[id][type];
    return { shape: dressShape(id), answer, choices: answer === 0 || (type === 'corners' && Math.random() < 0.5) ? [0, 3, 4, 5, 6] : [3, 4, 5, 6] };
  }
  const id = pick(all);
  const pool = all.filter((s) => s !== id && !(id === 'persegi' && s === 'belahKetupat') && !(id === 'belahKetupat' && s === 'persegi'));
  return { answer: id, clue: SHAPES[id].clue, choices: shuffle([id, ...shuffle(pool).slice(0, 3)]).map(dressShape) };
}

// ---------- Pecahan ----------

const fr = (k, d) => ({ k, d });
const sameValue = (a, b) => a.k * b.d === b.k * a.d;

export function genFraction({ type, dens }) {
  if (type === 'identify' || type === 'color') {
    const d = pick(dens);
    const target = fr(rand(1, d - 1), d);
    if (type === 'color') return { target };
    const cands = shuffle([
      fr(d - target.k, d),
      fr(target.k, d + 1),
      fr(target.k, d - 1),
      fr(Math.min(target.k + 1, d), d),
      fr(Math.max(target.k - 1, 1), d),
      fr(1, d),
      fr(target.k, d + 2),
    ]);
    const choices = [target];
    for (const c of cands) {
      if (choices.length >= 4) break;
      if (c.k < 1 || c.k >= c.d || c.d > 12) continue;
      if (choices.some((x) => sameValue(x, c))) continue;
      choices.push(c);
    }
    return { target, choices: shuffle(choices) };
  }

  let a, b;
  if (type === 'compareSame') {
    if (Math.random() < 0.5) {
      const d = pick([3, 4, 5, 6, 8]);
      a = fr(rand(1, d - 1), d);
      b = Math.random() < 0.15 ? { ...a } : fr(rand(1, d - 1), d);
    } else {
      // pecahan satuan: makin banyak potongan, makin kecil tiap potongan
      const [x, y] = shuffle([2, 3, 4, 5, 6, 8]);
      a = fr(1, x);
      b = Math.random() < 0.15 ? fr(1, x) : fr(1, y);
    }
  } else if (Math.random() < 0.3) {
    const pairs = [
      [fr(1, 2), fr(2, 4)],
      [fr(1, 2), fr(3, 6)],
      [fr(1, 2), fr(4, 8)],
      [fr(1, 3), fr(2, 6)],
      [fr(2, 3), fr(4, 6)],
      [fr(1, 4), fr(2, 8)],
      [fr(3, 4), fr(6, 8)],
    ];
    [a, b] = shuffle(pick(pairs));
  } else {
    do {
      const [d1, d2] = [pick([2, 3, 4, 6, 8]), pick([2, 3, 4, 6, 8])];
      a = fr(rand(1, d1 - 1), d1);
      b = fr(rand(1, d2 - 1), d2);
    } while (a.d === b.d || sameValue(a, b));
  }
  return { a, b };
}

// ---------- Menghitung benda ----------

export const ANIMALS = [
  { emoji: '🐱', name: 'kucing' },
  { emoji: '🐶', name: 'anjing' },
  { emoji: '🐰', name: 'kelinci' },
  { emoji: '🐸', name: 'katak' },
  { emoji: '🐥', name: 'anak ayam' },
  { emoji: '🐟', name: 'ikan' },
  { emoji: '🦋', name: 'kupu-kupu' },
  { emoji: '🐞', name: 'kepik' },
  { emoji: '🐢', name: 'kura-kura' },
  { emoji: '🦆', name: 'bebek' },
  { emoji: '🐘', name: 'gajah' },
  { emoji: '🐵', name: 'monyet' },
];

/** 4 bilangan berurutan di sekitar jawaban, tetap di antara min dan max. */
function runChoices(answer, min, max) {
  const start = Math.min(Math.max(answer - rand(0, 3), min), Math.max(max - 3, min));
  return Array.from({ length: Math.min(4, max - min + 1) }, (_, i) => start + i);
}
const countChoices = (answer, max) => runChoices(answer, 1, max);

const placeAnimal = (a) => ({ ...a, rot: rand(-12, 12), dy: rand(-6, 6) });
const herd = (a, n) => Array.from({ length: n }, () => placeAnimal(a));

export function genCount({ type, max }) {
  if (type === 'count') {
    const animal = pick(ANIMALS);
    const answer = rand(1, max);
    return { animal, answer, field: herd(animal, answer), choices: countChoices(answer, max) };
  }
  if (type === 'mixed') {
    const [animal, other] = shuffle(ANIMALS);
    const answer = rand(2, max);
    const others = rand(2, Math.max(2, 13 - answer));
    const field = shuffle([...Array(answer).fill(animal), ...Array(others).fill(other)]).map(placeAnimal);
    return { animal, answer, field, choices: countChoices(answer, max) };
  }
  if (type === 'take') {
    const animal = pick(ANIMALS);
    return { animal, answer: rand(2, max - 1), field: herd(animal, max) };
  }
  // mana yang lebih banyak / lebih sedikit
  const [x, y] = shuffle(ANIMALS);
  const a = rand(1, max);
  let b;
  do b = rand(Math.max(1, a - 3), Math.min(max, a + 3));
  while (b === a);
  const ask = Math.random() < 0.6 ? 'more' : 'less';
  const answer = (ask === 'more') === a > b ? 0 : 1;
  return { ask, answer, groups: [{ animal: x, n: a, field: herd(x, a) }, { animal: y, n: b, field: herd(y, b) }] };
}

// ---------- Mengenal angka ----------

export function genNumeral({ type, min = 1, max }) {
  if (type === 'listen') {
    const answer = rand(min, max);
    const others = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i).filter((v) => v !== answer));
    return { answer, choices: shuffle([answer, ...others.slice(0, 3)]) };
  }
  if (type === 'toGroup') {
    const answer = rand(1, max);
    const near = shuffle(Array.from({ length: max }, (_, i) => i + 1).filter((v) => v !== answer && Math.abs(v - answer) <= 3));
    const animals = shuffle(ANIMALS);
    const groups = shuffle([answer, ...near.slice(0, 2)]).map((n, i) => ({ n, animal: animals[i], field: herd(animals[i], n) }));
    return { answer, groups };
  }
  // angka sebelum / sesudah
  const dir = Math.random() < 0.5 ? 'after' : 'before';
  const n = dir === 'after' ? rand(min, max - 1) : rand(min + 1, max);
  const answer = dir === 'after' ? n + 1 : n - 1;
  return { dir, n, answer, choices: runChoices(answer, 0, max) };
}

// ---------- Menulis angka ----------

let lastTrace = null;
export function genTrace({ digits, twoDigit, letters, pairs, words, art }) {
  let v;
  do {
    if (art) v = pick(art);
    else if (letters) v = pick([...letters]);
    else if (pairs) {
      const c = pick(ALPHABET);
      v = c.toUpperCase() + c;
    }
    else if (words) v = pick(TRACE_WORDS);
    else v = String(twoDigit ? rand(10, 20) : pick(digits));
  } while (v === lastTrace);
  return (lastTrace = v);
}

// ---------- Tambah & kurang dengan benda ----------

export function genObjOp({ ops, max }) {
  const op = pick(ops);
  const animal = pick(ANIMALS);
  if (op === 'tambah') {
    const a = rand(1, max - 1);
    const b = rand(1, Math.min(max - a, 5));
    return { op, animal, a, b, answer: a + b, choices: runChoices(a + b, 1, max) };
  }
  const a = rand(2, max);
  const b = rand(1, Math.min(a - 1, 5));
  return { op, animal, a, b, answer: a - b, choices: runChoices(a - b, 0, max) };
}

// ---------- Mengelompokkan ----------

const COLORS = {
  merah: '#e8435f',
  biru: '#2fa6dc',
  kuning: '#ffb703',
  hijau: '#5aae22',
};
const CATEGORIES = {
  hewan: { icon: '🐾', items: ['🐱', '🐶', '🐰', '🐸', '🐘', '🐵', '🦆', '🐢'] },
  buah: { icon: '🧺', items: ['🍎', '🍌', '🍇', '🍊', '🍉', '🍓', '🍍', '🥭'] },
  kendaraan: { icon: '🛣️', items: ['🚗', '🚌', '🚲', '🚂', '✈️', '🚀', '🚢', '🛵'] },
};

/** Bagi n benda ke beberapa keranjang, tiap keranjang paling sedikit 2. */
function splitAcross(n, k) {
  const counts = Array(k).fill(2);
  for (let i = 2 * k; i < n; i++) counts[rand(0, k - 1)]++;
  return counts;
}

export function genGroup({ type }) {
  let baskets;
  let make;
  if (type === 'kind') {
    baskets = shuffle(ANIMALS).slice(0, 2).map((a) => ({ key: a.name, label: a.name, emoji: a.emoji }));
    make = (b) => ({ emoji: b.emoji });
  } else if (type === 'color') {
    baskets = shuffle(Object.keys(COLORS)).slice(0, 2).map((c) => ({ key: c, label: c, color: COLORS[c] }));
    make = (b) => ({ shape: { id: pick(BASIC), color: b.color, rot: 0, scale: rand(80, 100) / 100 } });
  } else if (type === 'shape') {
    baskets = shuffle(BASIC).slice(0, 2).map((id) => ({ key: id, label: SHAPES[id].name.toLowerCase(), shape: id }));
    make = (b) => ({ shape: { id: b.shape, color: pick(SHAPE_COLORS), rot: 0, scale: rand(80, 100) / 100 } });
  } else if (type === 'size') {
    const animal = pick(ANIMALS);
    baskets = [
      { key: 'besar', label: 'besar', emoji: animal.emoji, big: true },
      { key: 'kecil', label: 'kecil', emoji: animal.emoji, big: false },
    ];
    make = (b) => ({ emoji: animal.emoji, big: b.big });
  } else {
    baskets = Object.entries(CATEGORIES).map(([key, c]) => ({ key, label: key, emoji: c.icon, pool: shuffle(c.items) }));
    make = (b, i) => ({ emoji: b.pool[i] });
  }
  const counts = splitAcross(baskets.length === 3 ? 9 : rand(6, 8), baskets.length);
  const items = shuffle(baskets.flatMap((b, bi) => Array.from({ length: counts[bi] }, (_, i) => ({ key: b.key, ...make(b, i) })))).map(
    (it, id) => ({ ...it, id }),
  );
  return { baskets: baskets.map(({ pool, ...b }) => b), items };
}

// ---------- Besar & kecil ----------

const BIG_THINGS = ['🐘', '🐻', '🐱', '🐶', '🐰', '🍎', '🍉', '🎈', '🌳', '⚽', '🚗', '🧸'];
const WEIGHTS = [
  { emoji: '🐘', name: 'gajah', w: 9 },
  { emoji: '🦛', name: 'kuda nil', w: 8 },
  { emoji: '🐻', name: 'beruang', w: 7 },
  { emoji: '🐶', name: 'anjing', w: 5 },
  { emoji: '🐱', name: 'kucing', w: 4 },
  { emoji: '🐰', name: 'kelinci', w: 3 },
  { emoji: '🐥', name: 'anak ayam', w: 2 },
  { emoji: '🐭', name: 'tikus', w: 1 },
];
const CRAYONS = ['#e8435f', '#2fa6dc', '#ffb703', '#5aae22', '#8f4fd9', '#ec4fa8'];

/** k bilangan berbeda dari [lo, hi], selisihnya paling sedikit gap. */
function distinctSpread(k, lo, hi, gap) {
  for (;;) {
    const vs = Array.from({ length: k }, () => rand(lo, hi));
    const sorted = [...vs].sort((a, b) => a - b);
    if (sorted.every((v, i) => i === 0 || v - sorted[i - 1] >= gap)) return vs;
  }
}

export function genSize({ type }) {
  const most = Math.random() < 0.55;
  if (type === 'big') {
    const emoji = pick(BIG_THINGS);
    const sizes = shuffle([1, rand(45, 65) / 100]);
    const answer = sizes.indexOf(most ? 1 : Math.min(...sizes));
    return { ask: most ? 'besar' : 'kecil', items: sizes.map((s) => ({ emoji, s })), answer };
  }
  if (type === 'long' || type === 'tall') {
    const vals = type === 'long' ? distinctSpread(3, 30, 100, 15) : distinctSpread(3, 2, 8, 2);
    const target = most ? Math.max(...vals) : Math.min(...vals);
    const colors = shuffle(CRAYONS);
    const ask = type === 'long' ? (most ? 'panjang' : 'pendek') : most ? 'tinggi' : 'rendah';
    return { ask, items: vals.map((v, i) => ({ v, color: colors[i] })), answer: vals.indexOf(target) };
  }
  if (type === 'heavy') {
    const [a, b] = shuffle(WEIGHTS);
    const items = [a, b];
    const heavier = a.w > b.w ? 0 : 1;
    return { ask: most ? 'berat' : 'ringan', items, heavier, answer: most ? heavier : 1 - heavier };
  }
  // urutkan dari yang paling kecil
  const emoji = pick(BIG_THINGS);
  const sizes = [0.4, 0.6, 0.8, 1];
  return { items: shuffle(sizes).map((s) => ({ emoji, s })), order: sizes };
}

// ---------- Menggambar ----------

const notLast = (pool, key) => {
  const last = notLast[key];
  const options = pool.length > 1 ? pool.filter((p) => p !== last) : pool;
  return (notLast[key] = pick(options));
};

const RAINBOW = Object.keys(PAINTS);

export function genColoring({ type, min = 1, max = 9, extra = 0 }) {
  const pic = notLast(COLOR_PICTURES.filter((p) => p.regions.length >= min && p.regions.length <= max), 'color');
  const used = [...new Set(pic.regions.map((r) => r.color))];
  if (type === 'number') {
    const numbers = Object.fromEntries(shuffle(used).map((c, i) => [c, i + 1]));
    return { pic, type, numbers, palette: used.sort((a, b) => numbers[a] - numbers[b]) };
  }
  const others = shuffle(RAINBOW.filter((c) => !used.includes(c))).slice(0, type === 'word' ? 9 : extra);
  return { pic, type, palette: RAINBOW.filter((c) => used.includes(c) || others.includes(c)) };
}

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function genDots({ type, min, max }) {
  const pic = notLast(DOT_PICTURES.filter((p) => p.pts.length >= min && p.pts.length <= max), 'dots');
  const labels = pic.pts.map((_, i) => (type === 'abc' ? ABC[i] : type === 'skip' ? String((i + 1) * 2) : String(i + 1)));
  return { pic, type, labels };
}

/** Kunci satu ruas pendek antara dua titik bertetangga, tidak peduli arahnya. */
export const segKey = ([x1, y1], [x2, y2]) => (x1 < x2 || (x1 === x2 && y1 < y2) ? `${x1},${y1},${x2},${y2}` : `${x2},${y2},${x1},${y1}`);

/** Pecah garis lurus A→B menjadi ruas-ruas pendek; null kalau garisnya tidak mendatar, tegak, atau miring 45°. */
export function lineUnits(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  if (!n || (dx && dy && Math.abs(dx) !== Math.abs(dy))) return null;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  return Array.from({ length: n }, (_, i) => segKey([a[0] + sx * i, a[1] + sy * i], [a[0] + sx * (i + 1), a[1] + sy * (i + 1)]));
}

const unitsOf = (lines) => [...new Set(lines.flatMap((pts) => pts.slice(1).flatMap((p, i) => lineUnits(pts[i], p))))];
const parseSeg = (k) => {
  const [x1, y1, x2, y2] = k.split(',').map(Number);
  return [[x1, y1], [x2, y2]];
};

export function genGrid({ type, size, flip }) {
  if (type === 'copy') {
    const shape = notLast(GRID_COPY[size], 'grid');
    const target = unitsOf(shape.lines);
    return { type, name: shape.name, cols: size, rows: size, given: [], target, example: target };
  }
  const shape = notLast(GRID_HALF[size], 'grid');
  const axis = (size - 1) / 2;
  let cols = size;
  let rows = size === 5 ? 5 : 6;
  let lines = shape.lines;
  if (flip) {
    // cermin atas-bawah: putar separuh gambar sehingga garis cerminnya mendatar
    lines = lines.map((pts) => pts.map(([x, y]) => [y, x]));
    [cols, rows] = [rows, cols];
  }
  const given = unitsOf(lines);
  const mirror = ([x, y]) => (flip ? [x, 2 * axis - y] : [2 * axis - x, y]);
  const onAxis = ([x, y]) => (flip ? y : x) === axis;
  const target = given.map(parseSeg).filter(([p, q]) => !(onAxis(p) && onAxis(q))).map(([p, q]) => segKey(mirror(p), mirror(q)));
  return { type, name: shape.name, cols, rows, axis, flip, given, target };
}
