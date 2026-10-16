export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[rand(0, arr.length - 1)];

/** Digit dari satuan ke kiri: 123 → [3, 2, 1] */
export const digitsOf = (n) => String(n).split('').reverse().map(Number);
const fromDigits = (ds) => Number([...ds].reverse().join(''));
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

function randWithDigits(digits, allowZero = false) {
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
