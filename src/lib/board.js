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
    helperName: 'simpan',
    // simpanan ke kolom paling kiri langsung turun, jadi boleh tidak ditulis (mis. 7 + 5 = 12)
    helperOptional: [`c${cols - 1}`],
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
    helperName: 'pinjam',
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
    // pada pengali 2 digit lingkaran simpanan dipakai ulang tiap baris, jadi tidak dicek
    helperName: multi ? null : 'simpan',
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

  // angka depan yang terlalu kecil (mis. 1 pada 15 : 3) boleh langsung dibaca 15 tanpa menulis sisa
  const helperOptional = range(lead).map((i) => `r${i + 1}`);
  return { digits: D, divisor, rows: [row], steps, helperName: 'sisa', helperOptional };
}

/**
 * Pembagian bersusun panjang (porogapit dengan baris pengurangan), mis. 432 : 12.
 * Kolom i dihitung dari kiri bilangan yang dibagi. Baris kerja di bawahnya ('lines'):
 *   prod  hasil kali pembagi × angka hasil bagi, diberi tanda − dan garis
 *   rest  hasil pengurangan, ditambah angka yang diturunkan
 * Kunci kotak: q{i} untuk hasil bagi, w{baris}_{i} untuk baris kerja.
 */
export function buildLongDivision(dividend, divisor) {
  const D = String(dividend).split('').map(Number);
  const n = D.length;
  const rows = []; // urutan pengerjaan, untuk BoardState
  const lines = [];
  const steps = [];
  const key = (l, c) => `w${l.idx}_${c}`;
  const putNum = (l, value, to, set) => digitsOf(value).forEach((d, j) => (set[key(l, to - j)] = d));

  // ambil angka dari kiri sampai cukup untuk dibagi
  let s = 0;
  let cur = D[0];
  while (cur < divisor && s < n - 1) cur = cur * 10 + D[++s];

  let rest = null;
  for (let i = s; i < n; i++) {
    const last = i === n - 1;
    if (i > s) {
      cur = cur * 10 + D[i];
      rest.to = i;
      rest.value = cur;
      steps.push({ col: i, text: `Turunkan angka ${D[i]} ke bawah, jadi ${cur}.`, set: { [key(rest, i)]: D[i] } });
    }

    const qd = Math.floor(cur / divisor);
    const qk = `q${i}`;
    rows.push({ keys: [qk], order: [qk], cells: { [qk]: { exp: qd, lead: false, pos: i } } });
    const left = cur % divisor;
    const done = last
      ? ` Tidak ada angka lagi yang bisa diturunkan, jadi ${left ? `sisanya ${left}` : 'pembagiannya habis, tidak ada sisa'}.`
      : '';

    if (qd === 0) {
      steps.push({ col: i, text: `${cur} lebih kecil dari ${divisor}, jadi tulis 0 di atas.${done}`, set: { [qk]: 0 } });
      continue;
    }

    const prod = qd * divisor;
    const next = divisor * (qd + 1);
    steps.push({
      col: i,
      text:
        `${cur} : ${divisor}. Cari ${divisor} × berapa yang paling dekat dengan ${cur} tapi tidak lebih: ` +
        `${divisor} × ${qd} = ${prod}${qd < 9 ? `, sedangkan ${divisor} × ${qd + 1} = ${next} terlalu besar` : ''}. Tulis ${qd} di atas.`,
      set: { [qk]: qd },
    });

    const pl = { idx: lines.length, kind: 'prod', from: i - String(prod).length + 1, to: i, value: prod };
    lines.push(pl);
    const pset = {};
    putNum(pl, prod, i, pset);
    steps.push({ col: i, text: `${divisor} × ${qd} = ${prod}. Tulis ${prod} di bawah ${cur}, lalu kurangkan.`, set: pset });

    const rem = cur - prod;
    rest = { idx: lines.length, kind: 'rest', from: i - String(rem).length + 1, remTo: i, to: i, value: rem };
    lines.push(rest);
    const rset = {};
    putNum(rest, rem, i, rset);
    steps.push({ col: i, text: `${cur} − ${prod} = ${rem}.${done}`, set: rset });
    rows.push(pl, rest);
    cur = rem;
  }

  // isi kotak tiap baris kerja setelah panjang akhirnya diketahui
  for (const l of lines) {
    const ds = digitsOf(l.value);
    l.from = Math.min(l.from, l.to - ds.length + 1);
    const cols = range(l.to - l.from + 1).map((j) => l.to - j); // kanan → kiri
    l.keys = cols.map((c) => key(l, c));
    l.cells = Object.fromEntries(
      cols.map((c) => [key(l, c), { exp: ds[l.to - c] ?? 0, lead: l.to - c >= ds.length, pos: c }]),
    );
    // sisa ditulis dari kanan ke kiri, angka yang diturunkan dari kiri ke kanan
    l.order =
      l.kind === 'rest'
        ? [...cols.filter((c) => c <= l.remTo), ...cols.filter((c) => c > l.remTo).reverse()].map((c) => key(l, c))
        : l.keys;
  }

  return {
    digits: D,
    divisor,
    qFrom: s,
    lines,
    rows,
    steps,
    quotient: Math.floor(dividend / divisor),
    remainder: dividend % divisor,
  };
}
