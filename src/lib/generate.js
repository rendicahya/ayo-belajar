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
