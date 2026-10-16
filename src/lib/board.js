import { digitsOf, sum, PLACES } from './generate.js';

/*
 * Model papan bersusun. Setiap kotak punya kunci:
 *   a{baris}_{posisi}  kotak jawaban (dicek)        posisi dihitung dari satuan (0)
 *   c{posisi}          angka simpanan di atas kolom (bantuan, tidak dicek)
 *   l{posisi}          kolom ini meminjamkan 1 ke kanannya (pengurangan)
 *   q{i} / r{i}        hasil bagi & sisa kecil pada pembagian (i dari kiri)
 *
 * steps: langkah penyelesaian { text, col, set: { kunci: nilai } } yang dipakai
 * untuk tombol Petunjuk dan Lihat Cara.
 */

const range = (n) => Array.from({ length: n }, (_, i) => i);

function answerRow(r, from, to, value, extra = {}) {
  const ds = digitsOf(value);
  const keys = [];
  const cells = {};
  for (let p = from; p <= to; p++) {
    const k = `a${r}_${p}`;
    keys.push(k);
    // lead: posisi di kiri hasil — boleh dikosongkan (atau diisi 0)
    cells[k] = { exp: ds[p] ?? 0, lead: p >= ds.length, pos: p };
  }
  return { r, from, to, keys, order: keys, cells, fixed: {}, ...extra };
}

/** Langkah penjumlahan kolom demi kolom; dipakai juga untuk menjumlahkan baris perkalian. */
function additionSteps(values, r, cols, intro = '') {
  const rows = values.map(digitsOf);
  const steps = [];
  let carry = 0;
  for (let p = 0; p < cols; p++) {
    const ds = rows.map((d) => d[p]).filter((d) => d !== undefined);
    const k = `a${r}_${p}`;
    if (!ds.length) {
      if (carry) steps.push({ col: p, text: `Simpanan ${carry} turun ke kolom ${PLACES[p]}. Tulis ${carry}.`, set: { [k]: carry } });
      break;
    }
    const s = carry + sum(ds);
    const out = Math.floor(s / 10);
    let text = `${p === 0 ? intro : ''}Kolom ${PLACES[p]}: `;
    if (ds.length === 1 && !carry) {
      steps.push({ col: p, text: `${text}Turunkan ${s}. Tulis ${s}.`, set: { [k]: s } });
      continue;
    }
    text += `${carry ? `simpanan ${carry} + ` : ''}${ds.join(' + ')} = ${s}. `;
    text += out ? `Tulis ${s % 10}, simpan ${out} di atas kolom ${PLACES[p + 1]}.` : `Tulis ${s}.`;
    const set = { [k]: s % 10 };
    if (out) set[`c${p + 1}`] = out;
    steps.push({ col: p, text, set });
    carry = out;
  }
  return steps;
}

function buildAddition(operands) {
  const numbers = operands.map(digitsOf);
  const cols = Math.max(...numbers.map((d) => d.length)) + 1;
  const total = sum(operands);
  return {
    cols,
    sign: '+',
    numbers,
    values: operands,
    helper: { type: 'cycle', from: 1, max: operands.length - 1 },
    rows: [answerRow(0, 0, cols - 1, total, { lineBefore: true })],
    steps: additionSteps(operands, 0, cols),
  };
}

function buildSubtraction(operands) {
  const numbers = operands.map(digitsOf);
  const [top, ...others] = numbers;
  const cols = top.length;
  const result = operands[0] - sum(operands.slice(1));
  const resultLen = String(result).length;
  const row = answerRow(0, 0, cols - 1, result, { lineBefore: true });

  // kolom mana yang perlu meminjam
  const borrow = [];
  let lent = 0;
  for (let p = 0; p < cols; p++) {
    borrow[p] = top[p] - lent < sum(others.map((d) => d[p] ?? 0));
    lent = borrow[p] ? 1 : 0;
  }

  const steps = [];
  for (let p = 0; p < cols; p++) {
    const subs = others.map((d) => d[p]).filter((d) => d !== undefined);
    const lentOut = p > 0 && borrow[p - 1];
    const set = {};
    let text = `Kolom ${PLACES[p]}: `;
    let val = top[p] - (lentOut ? 1 : 0);

    if (lentOut && top[p] === 0) {
      // angka 0 yang sudah meminjam ke kiri: 0 → 10 → dipinjam 1 → 9
      val = 9;
      text += `Angka 0 tadi menjadi 10, lalu dipinjam 1, jadi sekarang 9. `;
    } else {
      if (lentOut) text += `${top[p]} sudah dipinjam 1, jadi sekarang ${val}. `;
      if (borrow[p]) {
        text += `${val} terlalu kecil untuk dikurangi ${subs.join(' dan ')}, jadi pinjam 1 dari kolom ${PLACES[p + 1]}. `;
        set[`l${p + 1}`] = true;
        let j = p + 1;
        if (top[j] === 0) text += `Karena angkanya 0, pinjam dulu dari angka di kirinya. `;
        while (top[j] === 0 && j + 1 < cols) set[`l${++j}`] = true;
        val += 10;
      }
    }

    const res = val - sum(subs);
    text += subs.length ? `${val} − ${subs.join(' − ')} = ${res}. ` : `Turunkan ${val}. `;
    const k = `a0_${p}`;
    if (p >= resultLen) {
      text += 'Hasilnya 0 di depan, jadi boleh dikosongkan.';
      set[k] = null;
    } else {
      text += `Tulis ${res}.`;
      set[k] = res;
    }
    steps.push({ col: p, text, set });
  }

  return {
    cols,
    sign: '−',
    numbers,
    values: operands,
    helper: { type: 'lend' },
    rows: [row],
    steps,
  };
}

function buildMultiplication([a, b]) {
  const A = digitsOf(a);
  const B = digitsOf(b);
  const multi = B.length > 1;
  const cols = multi ? A.length + B.length : A.length + 1;
  const ordinal = ['pertama', 'kedua', 'ketiga'];

  const rows = multi
    ? [
        ...B.map((m, r) =>
          answerRow(r, r, r + A.length, a * m * 10 ** r, {
            lineBefore: r === 0,
            fixed: Object.fromEntries(range(r).map((p) => [p, 0])),
            sign: r === B.length - 1 ? '+' : '',
          }),
        ),
        answerRow(B.length, 0, cols - 1, a * b, { lineBefore: true }),
      ]
    : [answerRow(0, 0, A.length, a * b, { lineBefore: true })];

  const clearCarries = () => Object.fromEntries(range(cols).slice(1).map((p) => [`c${p}`, null]));
  const steps = [];
  B.forEach((m, r) => {
    let carry = 0;
    A.forEach((d, p) => {
      const prod = d * m + carry;
      const last = p === A.length - 1;
      let text = '';
      let set = {};
      if (p === 0 && multi) {
        text +=
          r === 0
            ? `Baris ${ordinal[r]}: kalikan dengan angka satuan, yaitu ${m}. `
            : `Baris ${ordinal[r]}: kalikan dengan angka ${PLACES[r]}, yaitu ${m}. Angka 0 di kanan sudah ditulis supaya hasilnya bergeser. `;
        if (r > 0) set = clearCarries();
      }
      text += `${d} × ${m} = ${d * m}${carry ? `, ditambah simpanan ${carry} = ${prod}` : ''}. `;
      set[`a${r}_${p + r}`] = prod % 10;
      if (last) {
        text += `Tulis ${prod}.`;
        if (prod >= 10) set[`a${r}_${p + r + 1}`] = Math.floor(prod / 10);
        carry = 0;
      } else {
        carry = Math.floor(prod / 10);
        text += carry ? `Tulis ${prod % 10}, simpan ${carry}.` : `Tulis ${prod}.`;
        set[`c${p + r + 1}`] = carry || null;
      }
      steps.push({ col: p + r, row: r, text, set });
    });
  });
  if (multi) {
    const partials = B.map((m, r) => a * m * 10 ** r);
    const sumSteps = additionSteps(partials, B.length, cols, 'Sekarang jumlahkan semua baris. ');
    sumSteps[0].set = { ...clearCarries(), ...sumSteps[0].set };
    steps.push(...sumSteps);
  }

  return {
    cols,
    sign: '×',
    numbers: [A, B],
    values: [a, b],
    helper: { type: 'type', from: 1 },
    rows,
    steps,
  };
}

export function buildColumn(op, operands) {
  if (op === 'tambah') return buildAddition(operands);
  if (op === 'kurang') return buildSubtraction(operands);
  return buildMultiplication(operands);
}

export function buildDivision(dividend, divisor) {
  const D = String(dividend).split('').map(Number);
  const n = D.length;
  const q = dividend / divisor;
  const Q = String(q).padStart(n, '0').split('').map(Number);
  const lead = n - String(q).length;

  const order = range(n).map((i) => `q${i}`);
  const cells = Object.fromEntries(order.map((k, i) => [k, { exp: Q[i], lead: i < lead, pos: i }]));
  const row = { r: 0, keys: [...order].reverse(), order, cells };

  const steps = [];
  let rem = 0;
  D.forEach((d, i) => {
    const cur = rem * 10 + d;
    const qd = Math.floor(cur / divisor);
    rem = cur % divisor;
    const set = {};
    const hasNext = i < n - 1;
    let text;
    if (i < lead) {
      text = `${cur} tidak cukup dibagi ${divisor}, jadi di atasnya dikosongkan.`;
      set[`q${i}`] = null;
    } else {
      text = `${cur} : ${divisor} = ${qd}, sebab ${divisor} × ${qd} = ${divisor * qd}`;
      text += rem ? `, sisa ${rem}. ` : '. ';
      text += `Tulis ${qd} di atas.`;
      set[`q${i}`] = qd;
    }
    if (hasNext) {
      if (rem) text += ` ${rem} ditulis kecil di depan angka ${D[i + 1]}, jadi menjadi ${rem}${D[i + 1]}.`;
      set[`r${i + 1}`] = rem || null;
    }
    steps.push({ col: i, text, set });
  });

  return { digits: D, divisor, rows: [row], steps };
}
